-- Migration: Revamp categories to support income/expense with multi-account reservations
-- This replaces the fund system with a more flexible reservation system

-- Step 1: Create category_reservations table to track funds reserved from accounts for expense categories
CREATE TABLE IF NOT EXISTS category_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  reserved_amount BIGINT NOT NULL DEFAULT 0 CHECK (reserved_amount >= 0),
  currency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(category_id, account_id) -- A category can only have one reservation per account
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS category_reservations_user_id_idx ON category_reservations(user_id);
CREATE INDEX IF NOT EXISTS category_reservations_category_id_idx ON category_reservations(category_id);
CREATE INDEX IF NOT EXISTS category_reservations_account_id_idx ON category_reservations(account_id);

-- Enable Row Level Security
ALTER TABLE category_reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reservations"
  ON category_reservations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations"
  ON category_reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON category_reservations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations"
  ON category_reservations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_category_reservations_updated_at
  BEFORE UPDATE ON category_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 2: Migrate category_type from 'regular'|'fund' to 'income'|'expense'
-- First, let's handle the migration of existing data:
-- - 'fund' categories will become 'expense' categories with reservations
-- - 'regular' categories will become 'expense' categories (most common use case)

-- Migrate fund categories to expense categories and create their reservations
DO $$
DECLARE
  fund_cat RECORD;
BEGIN
  FOR fund_cat IN 
    SELECT id, user_id, fund_account_id, fund_balance, fund_currency
    FROM categories
    WHERE category_type = 'fund' AND fund_account_id IS NOT NULL
  LOOP
    -- Insert a reservation for this fund category
    INSERT INTO category_reservations (
      user_id,
      category_id,
      account_id,
      reserved_amount,
      currency
    ) VALUES (
      fund_cat.user_id,
      fund_cat.id,
      fund_cat.fund_account_id,
      fund_cat.fund_balance,
      COALESCE(fund_cat.fund_currency, 'INR')
    ) ON CONFLICT (category_id, account_id) DO UPDATE
      SET reserved_amount = EXCLUDED.reserved_amount,
          currency = EXCLUDED.currency;
  END LOOP;
END $$;

-- IMPORTANT: Update all existing categories to 'expense' BEFORE changing the constraint
-- (users can manually change income categories later)
UPDATE categories SET category_type = 'expense' WHERE category_type IN ('regular', 'fund');

-- Now it's safe to update the constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_category_type_check;
ALTER TABLE categories 
  ADD CONSTRAINT categories_category_type_check 
  CHECK (category_type IN ('income', 'expense'));

-- Step 3: Clean up old fund-related columns (optional - commented out for safety)
-- Uncomment these if you want to fully remove the old fund columns:
-- ALTER TABLE categories DROP COLUMN IF EXISTS fund_balance;
-- ALTER TABLE categories DROP COLUMN IF EXISTS fund_currency;
-- ALTER TABLE categories DROP COLUMN IF EXISTS fund_account_id;
-- ALTER TABLE categories DROP COLUMN IF EXISTS fund_target_amount;

-- For now, we'll keep them but they won't be used in the new system

-- Step 4: Helper function to adjust reservation amounts
CREATE OR REPLACE FUNCTION adjust_category_reservation(
  p_category_id UUID,
  p_account_id UUID,
  p_amount_delta BIGINT
)
RETURNS category_reservations AS $$
DECLARE
  v_reservation category_reservations;
  v_category categories;
  v_account accounts;
BEGIN
  -- Verify ownership and get category
  SELECT * INTO v_category
  FROM categories
  WHERE id = p_category_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;
  
  IF v_category.category_type <> 'expense' THEN
    RAISE EXCEPTION 'Can only reserve funds for expense categories';
  END IF;
  
  -- Verify account ownership
  SELECT * INTO v_account
  FROM accounts
  WHERE id = p_account_id AND user_id  = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found or access denied';
  END IF;
  
  -- Get or create reservation
  SELECT * INTO v_reservation
  FROM category_reservations
  WHERE category_id = p_category_id AND account_id = p_account_id;
  
  IF NOT FOUND THEN
    -- Create new reservation
    IF p_amount_delta < 0 THEN
      RAISE EXCEPTION 'Cannot create reservation with negative amount';
    END IF;
    
    INSERT INTO category_reservations (
      user_id,
      category_id,
      account_id,
      reserved_amount,
      currency
    ) VALUES (
      auth.uid(),
      p_category_id,
      p_account_id,
      p_amount_delta,
      v_account.currency
    ) RETURNING * INTO v_reservation;
  ELSE
    -- Update existing reservation
    IF v_reservation.reserved_amount + p_amount_delta < 0 THEN
      RAISE EXCEPTION 'Insufficient reserved balance';
    END IF;
    
    UPDATE category_reservations
    SET reserved_amount = reserved_amount + p_amount_delta,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_reservation.id
    RETURNING * INTO v_reservation;
  END IF;
  
  RETURN v_reservation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION adjust_category_reservation(UUID, UUID, BIGINT) TO authenticated;

-- Step 5: Helper function to delete a reservation
CREATE OR REPLACE FUNCTION delete_category_reservation(
  p_category_id UUID,
  p_account_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN;
BEGIN
  DELETE FROM category_reservations
  WHERE category_id = p_category_id 
    AND account_id = p_account_id
    AND user_id = auth.uid();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_category_reservation(UUID, UUID) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE category_reservations IS 'Tracks reserved funds from accounts for expense categories';
COMMENT ON COLUMN category_reservations.reserved_amount IS 'Amount reserved from account for this category (in smallest currency unit)';
COMMENT ON COLUMN category_reservations.currency IS 'Currency of the reservation (derived from account)';


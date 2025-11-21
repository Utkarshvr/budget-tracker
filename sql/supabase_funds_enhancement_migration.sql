-- Migration to enhance goals table with fund types and status
-- This transforms "goals" into "savings funds" with different behaviors

-- Step 1: Add fund_type column (drop constraint first if column exists)
-- First, drop any existing constraint on fund_type
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_fund_type_check;

-- Add the column if it doesn't exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS fund_type TEXT NOT NULL DEFAULT 'target_goal';

-- IMPORTANT: Update any invalid fund_type values BEFORE adding constraint
-- Update any old continuous_savings or invalid values to budget_fund
UPDATE goals
SET fund_type = 'budget_fund'
WHERE fund_type = 'continuous_savings' OR fund_type NOT IN ('target_goal', 'emergency_fund', 'budget_fund');

-- Update any NULL fund_type to default
UPDATE goals
SET fund_type = 'target_goal'
WHERE fund_type IS NULL;

-- Now add the constraint with correct values
ALTER TABLE goals ADD CONSTRAINT goals_fund_type_check 
  CHECK (fund_type IN ('target_goal', 'emergency_fund', 'budget_fund'));

-- Step 2: Add status column (drop constraint first if column exists)
-- First, drop any existing constraint on status
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;

-- Add the column if it doesn't exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- IMPORTANT: Update any invalid status values BEFORE adding constraint
UPDATE goals
SET status = 'active'
WHERE status NOT IN ('active', 'completed') OR status IS NULL;

-- Now add the constraint with correct values
ALTER TABLE goals ADD CONSTRAINT goals_status_check 
  CHECK (status IN ('active', 'completed'));

-- Step 3: Add index for status queries
CREATE INDEX IF NOT EXISTS goals_status_idx ON goals(status);
CREATE INDEX IF NOT EXISTS goals_fund_type_idx ON goals(fund_type);

-- Step 4: Update existing goals to have default values (already set by DEFAULT)
-- All existing goals will be 'target_goal' with 'active' status
-- Also migrate any old 'continuous_savings' to 'budget_fund'
UPDATE goals
SET fund_type = 'budget_fund'
WHERE fund_type = 'continuous_savings';

-- Step 5: Add fund_id to transactions table for tracking which fund was used
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fund_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Step 6: Create index for fund_id in transactions
CREATE INDEX IF NOT EXISTS transactions_fund_id_idx ON transactions(fund_id);

-- Step 7: Add new transaction type 'fund_expense' for direct fund usage
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('expense', 'income', 'transfer', 'goal', 'goal_withdraw', 'fund_expense'));

-- Step 8: Update transaction account constraints to handle fund_expense
-- fund_expense: Uses from_account_id OR fund_id, and has category_id
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_transaction_accounts;
ALTER TABLE transactions ADD CONSTRAINT check_transaction_accounts CHECK (
  (type = 'expense' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
  (type = 'income' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
  (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id) OR
  (type = 'goal' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
  (type = 'goal_withdraw' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
  (type = 'fund_expense' AND fund_id IS NOT NULL AND from_account_id IS NULL AND to_account_id IS NULL)
);

-- Step 9: Update the trigger function to handle fund_expense transactions
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle expense: deduct from from_account
  IF NEW.type = 'expense' THEN
    UPDATE accounts
    SET balance = balance - NEW.amount
    WHERE id = NEW.from_account_id;
  
  -- Handle income: add to to_account
  ELSIF NEW.type = 'income' THEN
    UPDATE accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.to_account_id;
  
  -- Handle transfer: deduct from from_account, add to to_account
  ELSIF NEW.type = 'transfer' THEN
    UPDATE accounts
    SET balance = balance - NEW.amount
    WHERE id = NEW.from_account_id;
    
    UPDATE accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.to_account_id;
  
  -- Handle goal deposit: deduct from from_account
  ELSIF NEW.type = 'goal' THEN
    UPDATE accounts
    SET balance = balance - NEW.amount
    WHERE id = NEW.from_account_id;
  
  -- Handle goal withdrawal: add to to_account
  ELSIF NEW.type = 'goal_withdraw' THEN
    UPDATE accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.to_account_id;
  
  -- Handle fund_expense: deduct from goal saved_amount
  ELSIF NEW.type = 'fund_expense' THEN
    UPDATE goals
    SET saved_amount = saved_amount - NEW.amount
    WHERE id = NEW.fund_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Update the trigger function to handle updates and deletes
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reverse the balance changes on delete
  IF OLD.type = 'expense' THEN
    UPDATE accounts
    SET balance = balance + OLD.amount
    WHERE id = OLD.from_account_id;
  
  ELSIF OLD.type = 'income' THEN
    UPDATE accounts
    SET balance = balance - OLD.amount
    WHERE id = OLD.to_account_id;
  
  ELSIF OLD.type = 'transfer' THEN
    UPDATE accounts
    SET balance = balance + OLD.amount
    WHERE id = OLD.from_account_id;
    
    UPDATE accounts
    SET balance = balance - OLD.amount
    WHERE id = OLD.to_account_id;
  
  ELSIF OLD.type = 'goal' THEN
    UPDATE accounts
    SET balance = balance + OLD.amount
    WHERE id = OLD.from_account_id;
  
  ELSIF OLD.type = 'goal_withdraw' THEN
    UPDATE accounts
    SET balance = balance - OLD.amount
    WHERE id = OLD.to_account_id;
  
  ELSIF OLD.type = 'fund_expense' THEN
    UPDATE goals
    SET saved_amount = saved_amount + OLD.amount
    WHERE id = OLD.fund_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS transaction_balance_update ON transactions;
DROP TRIGGER IF EXISTS transaction_balance_delete ON transactions;

-- Create triggers
CREATE TRIGGER transaction_balance_update
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_on_transaction();

CREATE TRIGGER transaction_balance_delete
  AFTER DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_on_transaction_delete();

-- Step 11: Add helper function to use fund for expense
CREATE OR REPLACE FUNCTION use_fund_for_expense(
  p_fund_id UUID,
  p_amount BIGINT,
  p_note TEXT,
  p_category_id UUID DEFAULT NULL
)
RETURNS transactions AS $$
DECLARE
  v_fund goals;
  v_transaction transactions;
  v_user_id UUID;
BEGIN
  -- Get fund details and verify ownership
  SELECT * INTO v_fund
  FROM goals
  WHERE id = p_fund_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fund not found or access denied';
  END IF;
  
  -- Check if fund has enough balance
  IF v_fund.saved_amount < p_amount THEN
    RAISE EXCEPTION 'Insufficient fund balance';
  END IF;
  
  -- Get user_id
  v_user_id := auth.uid();
  
  -- Create the transaction
  INSERT INTO transactions (
    user_id,
    note,
    type,
    amount,
    fund_id,
    category_id,
    currency,
    from_account_id,
    to_account_id
  ) VALUES (
    v_user_id,
    p_note,
    'fund_expense',
    p_amount,
    p_fund_id,
    p_category_id,
    v_fund.currency,
    NULL,
    NULL
  ) RETURNING * INTO v_transaction;
  
  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Add comments for documentation
COMMENT ON COLUMN goals.fund_type IS 'Type of savings fund: target_goal (specific purchase), emergency_fund (ongoing protection), budget_fund (allocated spending envelope)';
COMMENT ON COLUMN goals.status IS 'Status of the fund: active (currently saving), completed (target achieved)';
COMMENT ON COLUMN transactions.fund_id IS 'Reference to the fund used for this expense (for fund_expense type)';


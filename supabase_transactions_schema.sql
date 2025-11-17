-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount BIGINT NOT NULL, -- stored in smallest currency unit (paise for INR, cents for USD)
  from_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  -- Ensure proper account references based on transaction type
  CONSTRAINT check_expense_accounts CHECK (
    (type = 'expense' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
    (type = 'income' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
    (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id)
  )
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_from_account_id_idx ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS transactions_to_account_id_idx ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own transactions
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own transactions
CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update account balances when a transaction is created
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle expense: deduct from from_account
  IF NEW.type = 'expense' AND NEW.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.from_account_id;
  END IF;

  -- Handle income: add to to_account
  IF NEW.type = 'income' AND NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.to_account_id;
  END IF;

  -- Handle transfer: deduct from from_account, add to to_account
  IF NEW.type = 'transfer' AND NEW.from_account_id IS NOT NULL AND NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.from_account_id;
    
    UPDATE accounts
    SET balance = balance + NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.to_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update account balances on transaction insert
CREATE TRIGGER update_account_balance_on_transaction_insert
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_on_transaction();

-- Function to revert account balances when a transaction is deleted
CREATE OR REPLACE FUNCTION revert_account_balance_on_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle expense: add back to from_account
  IF OLD.type = 'expense' AND OLD.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.from_account_id;
  END IF;

  -- Handle income: deduct from to_account
  IF OLD.type = 'income' AND OLD.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.to_account_id;
  END IF;

  -- Handle transfer: add back to from_account, deduct from to_account
  IF OLD.type = 'transfer' AND OLD.from_account_id IS NOT NULL AND OLD.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.from_account_id;
    
    UPDATE accounts
    SET balance = balance - OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.to_account_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to revert account balances on transaction delete
CREATE TRIGGER revert_account_balance_on_transaction_delete
  AFTER DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION revert_account_balance_on_transaction_delete();

-- Function to update account balances when a transaction is updated
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction_update()
RETURNS TRIGGER AS $$
BEGIN
  -- First, revert the old transaction's effect
  IF OLD.type = 'expense' AND OLD.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.from_account_id;
  END IF;

  IF OLD.type = 'income' AND OLD.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.to_account_id;
  END IF;

  IF OLD.type = 'transfer' AND OLD.from_account_id IS NOT NULL AND OLD.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.from_account_id;
    
    UPDATE accounts
    SET balance = balance - OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.to_account_id;
  END IF;

  -- Then, apply the new transaction's effect
  IF NEW.type = 'expense' AND NEW.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.from_account_id;
  END IF;

  IF NEW.type = 'income' AND NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.to_account_id;
  END IF;

  IF NEW.type = 'transfer' AND NEW.from_account_id IS NOT NULL AND NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.from_account_id;
    
    UPDATE accounts
    SET balance = balance + NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.to_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update account balances on transaction update
CREATE TRIGGER update_account_balance_on_transaction_update
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (OLD.amount IS DISTINCT FROM NEW.amount OR 
        OLD.type IS DISTINCT FROM NEW.type OR
        OLD.from_account_id IS DISTINCT FROM NEW.from_account_id OR
        OLD.to_account_id IS DISTINCT FROM NEW.to_account_id)
  EXECUTE FUNCTION update_account_balance_on_transaction_update();


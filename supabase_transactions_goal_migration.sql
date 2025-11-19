-- Migration to add 'goal' transaction type support
-- Run this after updating the transactions table schema

-- Step 1: Update the type constraint to include 'goal'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('expense', 'income', 'transfer', 'goal'));

-- Step 2: Update the account reference constraint to handle goal type
-- Goals: from_account_id for deposits (like expense), to_account_id for withdrawals (like income)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_expense_accounts;
ALTER TABLE transactions ADD CONSTRAINT check_transaction_accounts CHECK (
  (type = 'expense' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
  (type = 'income' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
  (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id) OR
  (type = 'goal' AND ((from_account_id IS NOT NULL AND to_account_id IS NULL) OR (from_account_id IS NULL AND to_account_id IS NOT NULL)))
);

-- Step 3: Update the function to handle goal transactions on insert
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

  -- Handle goal deposit: deduct from from_account (like expense)
  IF NEW.type = 'goal' AND NEW.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.from_account_id;
  END IF;

  -- Handle goal withdraw: add to to_account (like income)
  IF NEW.type = 'goal' AND NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.to_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update the function to handle goal transactions on delete
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

  -- Handle goal deposit: add back to from_account (like expense)
  IF OLD.type = 'goal' AND OLD.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.from_account_id;
  END IF;

  -- Handle goal withdraw: deduct from to_account (like income)
  IF OLD.type = 'goal' AND OLD.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.to_account_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update the function to handle goal transactions on update
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

  IF OLD.type = 'goal' AND OLD.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + OLD.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.from_account_id;
  END IF;

  IF OLD.type = 'goal' AND OLD.to_account_id IS NOT NULL THEN
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

  IF NEW.type = 'goal' AND NEW.from_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.from_account_id;
  END IF;

  IF NEW.type = 'goal' AND NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + NEW.amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.to_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


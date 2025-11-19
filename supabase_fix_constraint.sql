-- Fix constraint issue - run this if the migration fails
-- This script will:
-- 1. Check existing constraints
-- 2. Drop all related constraints
-- 3. Recreate them properly

-- First, let's see what constraints exist (for debugging)
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'transactions'::regclass 
-- AND contype = 'c';

-- Drop all possible constraint names
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_transaction_accounts;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_expense_accounts;

-- Ensure type constraint allows goal_withdraw
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('expense', 'income', 'transfer', 'goal', 'goal_withdraw'));

-- Migrate any existing goal withdrawals
UPDATE transactions
SET type = 'goal_withdraw'
WHERE type = 'goal' AND to_account_id IS NOT NULL AND from_account_id IS NULL;

-- Now create the account constraint with proper logic
ALTER TABLE transactions ADD CONSTRAINT check_transaction_accounts CHECK (
  (type = 'expense' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
  (type = 'income' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
  (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id) OR
  (type = 'goal' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
  (type = 'goal_withdraw' AND from_account_id IS NULL AND to_account_id IS NOT NULL)
);


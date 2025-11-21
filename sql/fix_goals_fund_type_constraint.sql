-- Quick fix for goals_fund_type_check constraint error
-- Run this immediately to fix the constraint issue

-- Step 1: First, update any invalid fund_type values BEFORE adding constraint
-- Update any old continuous_savings to budget_fund
UPDATE goals
SET fund_type = 'budget_fund'
WHERE fund_type = 'continuous_savings' OR fund_type NOT IN ('target_goal', 'emergency_fund', 'budget_fund');

-- Step 2: Update any NULL fund_type to default
UPDATE goals
SET fund_type = 'target_goal'
WHERE fund_type IS NULL;

-- Step 3: Drop the existing constraint (if it exists)
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_fund_type_check;

-- Step 4: Recreate the constraint with correct values including budget_fund
ALTER TABLE goals ADD CONSTRAINT goals_fund_type_check 
  CHECK (fund_type IN ('target_goal', 'emergency_fund', 'budget_fund'));

-- Step 5: Also fix status constraint while we're at it
-- Update any invalid status values first
UPDATE goals
SET status = 'active'
WHERE status NOT IN ('active', 'completed') OR status IS NULL;

ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;
ALTER TABLE goals ADD CONSTRAINT goals_status_check 
  CHECK (status IN ('active', 'completed'));

-- Verify: Check all fund types and statuses
-- SELECT fund_type, COUNT(*) FROM goals GROUP BY fund_type;
-- SELECT status, COUNT(*) FROM goals GROUP BY status;

-- Verify: Check all fund types
-- SELECT fund_type, COUNT(*) FROM goals GROUP BY fund_type;


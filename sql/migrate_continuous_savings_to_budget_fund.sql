-- Migration to update existing continuous_savings funds to budget_fund
-- Run this after the main funds_enhancement_migration.sql

-- Step 1: Update all existing continuous_savings to budget_fund
UPDATE goals
SET fund_type = 'budget_fund'
WHERE fund_type = 'continuous_savings';

-- Step 2: Verify the update
-- SELECT fund_type, COUNT(*) FROM goals GROUP BY fund_type;


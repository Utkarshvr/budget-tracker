-- Account-level funds allow users to reserve part of an account balance
-- without moving money away. Each fund belongs to exactly one account
-- and stores its current allocation in the smallest currency unit.

CREATE TABLE IF NOT EXISTS account_funds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💰',
  background_color TEXT NOT NULL DEFAULT '#16a34a',
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS account_funds_user_id_idx ON account_funds(user_id);
CREATE INDEX IF NOT EXISTS account_funds_account_id_idx ON account_funds(account_id);

ALTER TABLE account_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own funds"
  ON account_funds
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funds"
  ON account_funds
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funds"
  ON account_funds
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funds"
  ON account_funds
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_account_funds_updated_at
  BEFORE UPDATE ON account_funds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper to safely adjust balances (positive allocates, negative spends/withdraws)
CREATE OR REPLACE FUNCTION adjust_account_fund_balance(
  p_fund_id UUID,
  p_amount_delta BIGINT
)
RETURNS account_funds AS $$
DECLARE
  v_fund account_funds;
  v_account accounts;
BEGIN
  SELECT * INTO v_fund
  FROM account_funds
  WHERE id = p_fund_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fund not found or access denied';
  END IF;

  SELECT * INTO v_account
  FROM accounts
  WHERE id = v_fund.account_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found or access denied';
  END IF;

  IF v_account.currency <> v_fund.currency THEN
    RAISE EXCEPTION 'Fund currency mismatch. Please recreate the fund.';
  END IF;

  IF v_fund.balance + p_amount_delta < 0 THEN
    RAISE EXCEPTION 'Insufficient fund balance';
  END IF;

  UPDATE account_funds
  SET balance = balance + p_amount_delta,
      updated_at = TIMEZONE('utc', NOW())
  WHERE id = p_fund_id
  RETURNING * INTO v_fund;

  RETURN v_fund;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION adjust_account_fund_balance(UUID, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION adjust_account_fund_balance(UUID, BIGINT) TO authenticated;

COMMENT ON TABLE account_funds IS 'Virtual envelopes tied to an account balance';
COMMENT ON FUNCTION adjust_account_fund_balance(UUID, BIGINT) IS 'Keeps fund balances in sync without touching the real account';



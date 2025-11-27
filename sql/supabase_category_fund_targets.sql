-- Adds optional target amount support for fund categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS fund_target_amount BIGINT
    CHECK (fund_target_amount IS NULL OR fund_target_amount >= 0);

COMMENT ON COLUMN categories.fund_target_amount IS 'Optional target for fund categories (stored in smallest currency unit)';


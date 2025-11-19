-- Create savings goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount BIGINT NOT NULL CHECK (target_amount > 0),
  saved_amount BIGINT NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals"
  ON goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Safe adjustment helper for goal savings
CREATE OR REPLACE FUNCTION adjust_goal_saved_amount(
  goal_id UUID,
  amount_delta BIGINT
)
RETURNS goals AS $$
DECLARE
  updated_goal goals;
BEGIN
  UPDATE goals
  SET saved_amount = saved_amount + amount_delta,
      updated_at = TIMEZONE('utc', NOW())
  WHERE id = goal_id
    AND user_id = auth.uid()
  RETURNING * INTO updated_goal;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found or access denied';
  END IF;

  IF updated_goal.saved_amount < 0 THEN
    RAISE EXCEPTION 'Goal balance cannot be negative';
  END IF;

  IF updated_goal.saved_amount > updated_goal.target_amount THEN
    RAISE EXCEPTION 'Goal balance cannot exceed target amount';
  END IF;

  RETURN updated_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;



-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'checking', 'savings', 'credit_card')),
  currency TEXT NOT NULL DEFAULT 'INR',
  balance BIGINT NOT NULL DEFAULT 0, -- stored in smallest currency unit (paise for INR, cents for USD)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own accounts
CREATE POLICY "Users can view their own accounts"
  ON accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own accounts
CREATE POLICY "Users can insert their own accounts"
  ON accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own accounts
CREATE POLICY "Users can update their own accounts"
  ON accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own accounts
CREATE POLICY "Users can delete their own accounts"
  ON accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


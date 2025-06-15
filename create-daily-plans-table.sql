-- Create daily_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_blocks JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own daily plans
CREATE POLICY "Users can view their own daily plans" ON daily_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own daily plans
CREATE POLICY "Users can insert their own daily plans" ON daily_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own daily plans
CREATE POLICY "Users can update their own daily plans" ON daily_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own daily plans
CREATE POLICY "Users can delete their own daily plans" ON daily_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, date);
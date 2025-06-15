-- Add multi-dimensional prioritization fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS urgency INTEGER CHECK (urgency >= 1 AND urgency <= 5),
ADD COLUMN IF NOT EXISTS importance INTEGER CHECK (importance >= 1 AND importance <= 5),
ADD COLUMN IF NOT EXISTS emotional_weight INTEGER CHECK (emotional_weight >= 1 AND emotional_weight <= 5),
ADD COLUMN IF NOT EXISTS energy_required TEXT CHECK (energy_required IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_urgency ON tasks(urgency);
CREATE INDEX IF NOT EXISTS idx_tasks_importance ON tasks(importance);
CREATE INDEX IF NOT EXISTS idx_tasks_emotional_weight ON tasks(emotional_weight);
CREATE INDEX IF NOT EXISTS idx_tasks_energy_required ON tasks(energy_required);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Update RLS policies if needed
-- The existing policies should work fine with the new columns
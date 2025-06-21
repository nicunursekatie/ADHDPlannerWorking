-- Add start_date column to tasks table
-- This column will store when a task becomes available to start

-- Add the start_date column (nullable initially for existing tasks)
ALTER TABLE tasks 
ADD COLUMN start_date DATE;

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN tasks.start_date IS 'The earliest date when this task can be started. Tasks without a start date are available immediately.';

-- Optional: Create an index for better performance when filtering by start_date
CREATE INDEX idx_tasks_start_date ON tasks(start_date);

-- Optional: Update RLS policies if needed (uncomment if using Row Level Security)
-- The existing RLS policies should work since they filter by user_id which is not affected

/*
Example usage after running this migration:

-- Tasks that can be started today or have already become available
SELECT * FROM tasks 
WHERE user_id = 'your-user-id' 
  AND (start_date IS NULL OR start_date <= CURRENT_DATE)
  AND completed = false 
  AND archived = false;

-- Tasks that are not yet available (future start dates)
SELECT * FROM tasks 
WHERE user_id = 'your-user-id' 
  AND start_date > CURRENT_DATE
  AND completed = false 
  AND archived = false;

-- Tasks becoming available today
SELECT * FROM tasks 
WHERE user_id = 'your-user-id' 
  AND start_date = CURRENT_DATE
  AND completed = false 
  AND archived = false;
*/
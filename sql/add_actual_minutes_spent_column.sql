-- Add actual_minutes_spent column to tasks table
-- This column will store the actual time spent completing a task for comparison with estimates

-- Add the actual_minutes_spent column (nullable for existing tasks)
ALTER TABLE tasks 
ADD COLUMN actual_minutes_spent INTEGER;

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN tasks.actual_minutes_spent IS 'The actual number of minutes spent completing this task, for comparison with estimated_minutes';

-- Optional: Create an index for better performance when analyzing time tracking data
CREATE INDEX idx_tasks_actual_minutes_spent ON tasks(actual_minutes_spent);

/*
Example usage after running this migration:

-- Tasks with time tracking data (both estimated and actual time)
SELECT title, estimated_minutes, actual_minutes_spent,
       CASE 
         WHEN actual_minutes_spent IS NULL THEN 'No tracking data'
         WHEN actual_minutes_spent < estimated_minutes THEN 'Finished early'
         WHEN actual_minutes_spent > estimated_minutes * 1.5 THEN 'Took much longer'
         ELSE 'Close to estimate'
       END as performance
FROM tasks 
WHERE user_id = 'your-user-id' 
  AND completed = true 
  AND estimated_minutes IS NOT NULL;

-- Average estimation accuracy for completed tasks
SELECT 
  AVG(actual_minutes_spent::float / estimated_minutes) as avg_accuracy_ratio,
  COUNT(*) as tasks_with_data
FROM tasks 
WHERE user_id = 'your-user-id' 
  AND completed = true 
  AND estimated_minutes IS NOT NULL 
  AND actual_minutes_spent IS NOT NULL;
*/
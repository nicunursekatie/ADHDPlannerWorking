-- Fix due_date column to use DATE type instead of TIMESTAMP WITH TIME ZONE
-- This prevents timezone conversion issues when storing simple dates

-- Step 1: Drop dependent view first
DROP VIEW IF EXISTS task_subtasks;

-- Step 2: Add a new column with DATE type
ALTER TABLE tasks ADD COLUMN due_date_new DATE;

-- Step 3: Copy existing data, extracting just the date part
UPDATE tasks 
SET due_date_new = due_date::DATE 
WHERE due_date IS NOT NULL;

-- Step 4: Drop the old column
ALTER TABLE tasks DROP COLUMN due_date;

-- Step 5: Rename the new column to replace the old one
ALTER TABLE tasks RENAME COLUMN due_date_new TO due_date;

-- Step 6: Recreate the view with updated due_date type
CREATE OR REPLACE VIEW task_subtasks AS
SELECT 
  parent.id as parent_task_id,
  parent.title as parent_title,
  child.id as subtask_id,
  child.title as subtask_title,
  child.completed as subtask_completed,
  child.due_date as subtask_due_date,
  child.priority as subtask_priority
FROM tasks parent
JOIN tasks child ON child.parent_task_id = parent.id
WHERE child.deleted_at IS NULL;

-- Step 7: Recreate the function with updated due_date type
CREATE OR REPLACE FUNCTION get_subtasks(parent_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  completed BOOLEAN,
  due_date DATE,
  priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.completed,
    t.due_date,
    t.priority
  FROM tasks t
  WHERE t.parent_task_id = parent_id
    AND t.deleted_at IS NULL
  ORDER BY t.created_at;
END;
$$ LANGUAGE plpgsql;
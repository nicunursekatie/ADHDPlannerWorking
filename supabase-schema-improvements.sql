-- Improvements to the Supabase schema for better relational design

-- 1. Remove array columns from tasks table (these will be replaced with proper relations)
ALTER TABLE tasks 
  DROP COLUMN IF EXISTS subtasks,
  DROP COLUMN IF EXISTS depends_on,
  DROP COLUMN IF EXISTS depended_on_by;

-- 2. Create task dependencies table for better many-to-many relationships
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate dependencies
  UNIQUE(task_id, depends_on_task_id),
  
  -- Prevent self-dependencies
  CHECK (task_id != depends_on_task_id)
);

-- 3. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- 4. Create a view to easily get subtasks
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

-- 5. Create a function to get all subtasks for a parent task
CREATE OR REPLACE FUNCTION get_subtasks(parent_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  completed BOOLEAN,
  due_date TIMESTAMP WITH TIME ZONE,
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

-- 6. Create a function to get task dependencies
CREATE OR REPLACE FUNCTION get_task_dependencies(task_id_param UUID)
RETURNS TABLE (
  depends_on_id UUID,
  depends_on_title TEXT,
  depends_on_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.completed
  FROM task_dependencies td
  JOIN tasks t ON t.id = td.depends_on_task_id
  WHERE td.task_id = task_id_param
    AND t.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create RLS policies for the new table
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own task dependencies" ON task_dependencies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_dependencies.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only create dependencies for their own tasks" ON task_dependencies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_dependencies.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only delete dependencies for their own tasks" ON task_dependencies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_dependencies.task_id 
      AND tasks.user_id = auth.uid()
    )
  );
-- Add order column to projects table for drag and drop functionality
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Create index for better query performance when sorting by order
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects("order");

-- Update existing projects to have an order based on creation date using CTE
WITH project_order AS (
  SELECT 
    id,
    row_number() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS new_order
  FROM projects 
  WHERE "order" IS NULL
)
UPDATE projects 
SET "order" = project_order.new_order
FROM project_order
WHERE projects.id = project_order.id;
# Subtasks Migration Guide

## Why This Change?

Currently, the app stores subtask relationships in two ways:
1. `parent_task_id` on child tasks (good for relational DB)
2. `subtasks[]` array on parent tasks (problematic for relational DB)

The array approach has several issues:
- **Data inconsistency**: The parent's subtasks array can get out of sync with actual child tasks
- **Performance**: Updating arrays in PostgreSQL requires rewriting the entire row
- **Querying**: Finding all subtasks requires complex array operations
- **Integrity**: No automatic referential integrity for array elements

## Benefits of the New Approach

Using only `parent_task_id` with proper indexes and views provides:
- **Data consistency**: Single source of truth for parent-child relationships
- **Better performance**: Indexed foreign key lookups are fast
- **Simpler queries**: Standard SQL joins instead of array operations
- **Referential integrity**: Database ensures relationships are valid
- **Easier maintenance**: No need to sync array with actual relationships

## Migration Steps

### 1. Database Changes

Run the schema improvements SQL file:
```sql
-- This will:
-- - Remove the subtasks, depends_on, and depended_on_by array columns
-- - Create a proper task_dependencies table
-- - Add helpful indexes
-- - Create views and functions for easy subtask access
```

### 2. Code Changes Required

#### In `types/index.ts`:
Remove the array fields from the Task interface:
```typescript
export interface Task {
  // ... other fields
  parentTaskId: string | null;
  // Remove these:
  // subtasks: string[];
  // dependsOn: string[];
  // dependedOnBy: string[];
}
```

#### In `services/database.ts`:
Update queries to not include the removed columns:
```typescript
// When fetching tasks, get subtasks via relationship
const tasksWithSubtasks = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null);

// To get subtasks for a specific task
const subtasks = await supabase
  .from('tasks')
  .select('*')
  .eq('parent_task_id', parentTaskId)
  .is('deleted_at', null);
```

#### In `context/AppContextSupabase.tsx`:
Update the task loading to build subtask arrays dynamically:
```typescript
// After loading tasks, build the subtask relationships
const tasksWithSubtasks = tasks.map(task => {
  const subtaskIds = tasks
    .filter(t => t.parentTaskId === task.id)
    .map(t => t.id);
  
  return {
    ...task,
    subtasks: subtaskIds // This is now computed, not stored
  };
});
```

#### For Task Dependencies:
Use the new `task_dependencies` table:
```typescript
// Add a dependency
await supabase
  .from('task_dependencies')
  .insert({
    task_id: taskId,
    depends_on_task_id: dependencyId
  });

// Get dependencies
const { data: dependencies } = await supabase
  .from('task_dependencies')
  .select('depends_on_task_id')
  .eq('task_id', taskId);
```

## Rollback Plan

If needed, you can recreate the array columns:
```sql
ALTER TABLE tasks 
  ADD COLUMN subtasks UUID[] DEFAULT '{}',
  ADD COLUMN depends_on UUID[] DEFAULT '{}',
  ADD COLUMN depended_on_by UUID[] DEFAULT '{}';

-- Populate them from relationships
UPDATE tasks parent
SET subtasks = (
  SELECT ARRAY_AGG(child.id)
  FROM tasks child
  WHERE child.parent_task_id = parent.id
);
```

## Testing Checklist

- [ ] Creating tasks with subtasks works
- [ ] Moving tasks between parents works
- [ ] Deleting parent tasks handles subtasks correctly
- [ ] Task dependencies can be created/removed
- [ ] Performance is acceptable with many subtasks
- [ ] All existing features continue to work
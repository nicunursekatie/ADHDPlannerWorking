// Direct Supabase cleanup script
// Run this in the browser console to clean up duplicate tasks

async function cleanupSupabaseDuplicates() {
  // Get the current user
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return;
  }

  console.log('Starting cleanup for user:', user.id);

  // Get all tasks
  const { data: tasks, error } = await window.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  console.log(`Found ${tasks.length} total tasks`);

  // Find tasks generated from recurring tasks
  const recurringTasks = tasks.filter(task => task.recurring_task_id);
  console.log(`Found ${recurringTasks.length} tasks from recurring tasks`);

  // Group by recurring_task_id and due_date
  const groups = {};
  recurringTasks.forEach(task => {
    const key = `${task.recurring_task_id}-${task.due_date}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  });

  // Find duplicates
  let duplicateIds = [];
  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      console.log(`Found ${group.length} duplicates for ${key}`);
      // Keep the first one, mark rest for deletion
      const toDelete = group.slice(1).map(t => t.id);
      duplicateIds = duplicateIds.concat(toDelete);
    }
  }

  console.log(`Found ${duplicateIds.length} duplicate tasks to delete`);

  if (duplicateIds.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  // Confirm before deleting
  if (!confirm(`Delete ${duplicateIds.length} duplicate tasks?`)) {
    console.log('Cleanup cancelled');
    return;
  }

  // Delete in batches of 50
  const batchSize = 50;
  let totalDeleted = 0;

  for (let i = 0; i < duplicateIds.length; i += batchSize) {
    const batch = duplicateIds.slice(i, i + batchSize);
    
    const { error: deleteError } = await window.supabase
      .from('tasks')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error('Error deleting batch:', deleteError);
    } else {
      totalDeleted += batch.length;
      console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(duplicateIds.length / batchSize)} (${totalDeleted} total)`);
    }
  }

  console.log(`✅ Cleanup complete! Deleted ${totalDeleted} tasks`);
  console.log('Please refresh the page to see the changes.');
}

// Also create a function to delete ALL tasks from a specific recurring task
async function deleteAllFromRecurringTask(recurringTaskId) {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return;
  }

  const { data: tasks, error } = await window.supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('recurring_task_id', recurringTaskId);

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  console.log(`Found ${tasks.length} tasks from recurring task ${recurringTaskId}`);
  
  if (tasks.length === 0) return;

  if (!confirm(`Delete ALL ${tasks.length} tasks from this recurring task?`)) {
    return;
  }

  const ids = tasks.map(t => t.id);
  const { error: deleteError } = await window.supabase
    .from('tasks')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('Error deleting tasks:', deleteError);
  } else {
    console.log(`✅ Deleted ${tasks.length} tasks`);
  }
}

// Instructions
console.log(`
🧹 Supabase Cleanup Functions Available:

1. Clean up all duplicate recurring tasks:
   cleanupSupabaseDuplicates()

2. Delete ALL tasks from a specific recurring task:
   deleteAllFromRecurringTask('recurring-task-id-here')

3. First, you might want to see your recurring task ID:
   Run the debug analysis to find the recurring task ID
`);

// Make functions available globally
window.cleanupSupabaseDuplicates = cleanupSupabaseDuplicates;
window.deleteAllFromRecurringTask = deleteAllFromRecurringTask;
// Nuclear option - delete ALL tasks that came from recurring tasks
// Use with caution!

async function nuclearCleanup() {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return;
  }

  // Get count first
  const { count, error: countError } = await window.supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('recurring_task_id', 'is', null);

  if (countError) {
    console.error('Error counting tasks:', countError);
    return;
  }

  console.log(`Found ${count} tasks generated from recurring tasks`);

  if (count === 0) {
    console.log('No recurring task-generated tasks found');
    return;
  }

  if (!confirm(`⚠️ DELETE ALL ${count} tasks that were generated from recurring tasks?\n\nThis cannot be undone!`)) {
    console.log('Cleanup cancelled');
    return;
  }

  // Get all IDs
  const { data: tasks, error } = await window.supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .not('recurring_task_id', 'is', null);

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  const ids = tasks.map(t => t.id);
  
  // Delete in batches
  const batchSize = 100;
  let totalDeleted = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    
    const { error: deleteError } = await window.supabase
      .from('tasks')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error('Error deleting batch:', deleteError);
    } else {
      totalDeleted += batch.length;
      console.log(`Deleted batch: ${totalDeleted}/${ids.length}`);
    }
  }

  console.log(`✅ Nuclear cleanup complete! Deleted ${totalDeleted} tasks`);
  console.log('Please refresh the page.');
}

console.log(`
☢️ NUCLEAR CLEANUP AVAILABLE:

To delete ALL tasks that were generated from recurring tasks:
nuclearCleanup()

⚠️ This will delete ALL tasks with a recurring_task_id, not just duplicates!
`);

window.nuclearCleanup = nuclearCleanup;
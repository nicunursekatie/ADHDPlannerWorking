// Analyze tasks in Supabase to understand what's there

async function analyzeTasks() {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return;
  }

  // Get all tasks
  const { data: tasks, error } = await window.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  console.log(`\n📊 TASK ANALYSIS`);
  console.log(`Total tasks: ${tasks.length}`);

  // Regular vs recurring-generated
  const regularTasks = tasks.filter(t => !t.recurring_task_id);
  const recurringGenerated = tasks.filter(t => t.recurring_task_id);

  console.log(`Regular tasks: ${regularTasks.length}`);
  console.log(`Recurring-generated tasks: ${recurringGenerated.length}`);

  if (recurringGenerated.length > 0) {
    // Group by recurring task ID
    const byRecurringId = {};
    recurringGenerated.forEach(task => {
      if (!byRecurringId[task.recurring_task_id]) {
        byRecurringId[task.recurring_task_id] = [];
      }
      byRecurringId[task.recurring_task_id].push(task);
    });

    console.log(`\n📋 RECURRING TASK BREAKDOWN:`);
    for (const [recurringId, tasks] of Object.entries(byRecurringId)) {
      console.log(`\nRecurring Task ID: ${recurringId}`);
      console.log(`  Total generated: ${tasks.length}`);
      
      // Group by due date
      const byDueDate = {};
      tasks.forEach(task => {
        const dueDate = task.due_date || 'no-date';
        if (!byDueDate[dueDate]) {
          byDueDate[dueDate] = [];
        }
        byDueDate[dueDate].push(task);
      });

      // Show duplicates
      const duplicateDates = Object.entries(byDueDate)
        .filter(([date, tasks]) => tasks.length > 1);
      
      if (duplicateDates.length > 0) {
        console.log(`  ⚠️ DUPLICATES FOUND:`);
        duplicateDates.forEach(([date, tasks]) => {
          console.log(`    ${date}: ${tasks.length} copies`);
          console.log(`      First task: "${tasks[0].title}" (created ${tasks[0].created_at})`);
        });
      }

      // Show sample
      console.log(`  Sample task: "${tasks[0].title}"`);
      console.log(`  Due dates: ${[...new Set(tasks.map(t => t.due_date))].slice(0, 5).join(', ')}${tasks.length > 5 ? '...' : ''}`);
    }
  }

  // Show recent tasks
  console.log(`\n🕐 LAST 5 TASKS CREATED:`);
  tasks.slice(0, 5).forEach(task => {
    console.log(`  "${task.title}" - ${task.created_at} ${task.recurring_task_id ? '(from recurring)' : ''}`);
  });

  return tasks;
}

console.log(`
🔍 TASK ANALYZER:

To analyze your tasks and see what's in the database:
analyzeTasks()

This will show you:
- Total task count
- Breakdown of regular vs recurring-generated tasks
- Duplicate analysis
- Recent task creation
`);

window.analyzeTasks = analyzeTasks;
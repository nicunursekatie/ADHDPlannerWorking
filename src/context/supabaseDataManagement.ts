import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { generateId } from '../utils/helpers';
import { formatDateString } from '../utils/dateUtils';

const USER_SCOPED_TABLES = [
  'tasks',
  'projects',
  'categories',
  'daily_plans',
  'journal_entries',
  'recurring_tasks',
  'work_schedules',
  'work_shifts'
];

const isMissingTableError = (error: PostgrestError | null): boolean => {
  if (!error) {
    return false;
  }

  return (
    error.code === 'PGRST106' ||
    error.code === '42P01' ||
    (typeof error.message === 'string' && error.message.includes('does not exist'))
  );
};

const ensureNoTableError = (error: PostgrestError | null) => {
  if (error && !isMissingTableError(error)) {
    throw error;
  }
};

export const clearSupabaseUserData = async (
  client: SupabaseClient,
  userId: string
): Promise<void> => {
  const { data: taskRows, error: taskSelectError } = await client
    .from('tasks')
    .select('id')
    .eq('user_id', userId);

  if (taskSelectError) {
    if (!isMissingTableError(taskSelectError)) {
      throw taskSelectError;
    }
  }

  const taskIds = (taskRows ?? [])
    .map(row => row.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  if (taskIds.length > 0) {
    const { error: dependencyError } = await client
      .from('task_dependencies')
      .delete()
      .in('task_id', taskIds);
    ensureNoTableError(dependencyError);

    const { error: reverseDependencyError } = await client
      .from('task_dependencies')
      .delete()
      .in('depends_on_task_id', taskIds);
    ensureNoTableError(reverseDependencyError);
  }

  for (const table of USER_SCOPED_TABLES) {
    const { error } = await client
      .from(table)
      .delete()
      .eq('user_id', userId);
    ensureNoTableError(error);
  }

  const { error: settingsError } = await client
    .from('app_settings')
    .delete()
    .eq('user_id', userId);
  ensureNoTableError(settingsError);
};

const formatDate = (date: Date): string => {
  return formatDateString(date) ?? date.toISOString().split('T')[0];
};

const buildSampleDataForUser = (userId: string) => {
  const now = new Date();
  const isoNow = now.toISOString();
  const today = formatDate(now);
  const tomorrow = formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const nextWeek = formatDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

  const categories = [
    {
      id: generateId(),
      name: 'Work',
      color: '#3B82F6',
      created_at: isoNow,
      updated_at: isoNow,
      user_id: userId
    },
    {
      id: generateId(),
      name: 'Personal',
      color: '#10B981',
      created_at: isoNow,
      updated_at: isoNow,
      user_id: userId
    },
    {
      id: generateId(),
      name: 'Urgent',
      color: '#EF4444',
      created_at: isoNow,
      updated_at: isoNow,
      user_id: userId
    }
  ];

  const projects = [
    {
      id: generateId(),
      name: 'Website Redesign',
      description: 'Redesign the company website',
      color: '#8B5CF6',
      created_at: isoNow,
      updated_at: isoNow,
      user_id: userId,
      order: 0
    },
    {
      id: generateId(),
      name: 'Home Organization',
      description: 'Organize and declutter the house',
      color: '#F59E0B',
      created_at: isoNow,
      updated_at: isoNow,
      user_id: userId,
      order: 1
    }
  ];

  const [workCategory, personalCategory, urgentCategory] = categories;
  const [websiteProject, homeProject] = projects;

  const parentTask1Id = generateId();
  const parentTask2Id = generateId();

  const tasks = [
    {
      id: parentTask1Id,
      user_id: userId,
      title: 'Design new homepage',
      description: 'Create wireframes for the new homepage',
      completed: false,
      archived: false,
      due_date: tomorrow,
      start_date: null,
      project_id: websiteProject.id,
      category_ids: [workCategory.id],
      parent_task_id: null,
      tags: [],
      priority: 'high',
      created_at: isoNow,
      updated_at: isoNow
    },
    {
      id: generateId(),
      user_id: userId,
      title: 'Create color palette',
      description: 'Select colors for the new website design',
      completed: false,
      archived: false,
      due_date: today,
      start_date: null,
      project_id: websiteProject.id,
      category_ids: [workCategory.id],
      parent_task_id: parentTask1Id,
      tags: [],
      priority: 'medium',
      created_at: isoNow,
      updated_at: isoNow
    },
    {
      id: parentTask2Id,
      user_id: userId,
      title: 'Organize kitchen',
      description: 'Clean and organize kitchen cabinets',
      completed: false,
      archived: false,
      due_date: nextWeek,
      start_date: null,
      project_id: homeProject.id,
      category_ids: [personalCategory.id],
      parent_task_id: null,
      tags: [],
      priority: 'medium',
      created_at: isoNow,
      updated_at: isoNow
    },
    {
      id: generateId(),
      user_id: userId,
      title: 'Buy storage containers',
      description: 'Purchase containers for pantry organization',
      completed: false,
      archived: false,
      due_date: tomorrow,
      start_date: null,
      project_id: homeProject.id,
      category_ids: [personalCategory.id, urgentCategory.id],
      parent_task_id: parentTask2Id,
      tags: [],
      priority: 'high',
      created_at: isoNow,
      updated_at: isoNow
    },
    {
      id: generateId(),
      user_id: userId,
      title: 'Review quarterly report',
      description: 'Review and approve the quarterly financial report',
      completed: false,
      archived: false,
      due_date: today,
      start_date: null,
      project_id: null,
      category_ids: [workCategory.id, urgentCategory.id],
      parent_task_id: null,
      tags: [],
      priority: 'high',
      created_at: isoNow,
      updated_at: isoNow
    }
  ];

  return { categories, projects, tasks };
};

export const seedSampleDataForUser = async (
  client: SupabaseClient,
  userId: string
): Promise<void> => {
  await clearSupabaseUserData(client, userId);

  const { categories, projects, tasks } = buildSampleDataForUser(userId);

  if (categories.length > 0) {
    const { error } = await client.from('categories').insert(categories);
    if (error) {
      throw error;
    }
  }

  if (projects.length > 0) {
    const { error } = await client.from('projects').insert(projects);
    if (error) {
      throw error;
    }
  }

  if (tasks.length > 0) {
    const { error } = await client.from('tasks').insert(tasks);
    if (error) {
      throw error;
    }
  }
};

export type SampleDataPayload = ReturnType<typeof buildSampleDataForUser>;

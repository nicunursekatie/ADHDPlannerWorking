import { supabase } from '../lib/supabase';
import { 
  Task, 
  Project, 
  Category, 
  RecurringTask, 
  DailyPlan, 
  JournalEntry, 
  WorkSchedule,
  AppSettings 
} from '../types';
import { DatabaseService } from '@/services/database'; // or adjust path if needed

export class DatabaseService {
  // Helper to map database snake_case to TypeScript camelCase
  private static mapTaskFromDb(dbTask: any): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      completed: dbTask.completed,
      archived: dbTask.archived,
      dueDate: dbTask.due_date ? (dbTask.due_date.includes('T') ? dbTask.due_date.split('T')[0] : dbTask.due_date) : null,
      createdAt: dbTask.created_at,
      updatedAt: dbTask.updated_at,
      projectId: dbTask.project_id,
      categoryIds: dbTask.category_ids || [],
      tags: dbTask.tags || [],
      priority: dbTask.priority,
      energyLevel: dbTask.energy_level,
      size: dbTask.size,
      estimatedMinutes: dbTask.estimated_minutes,
      parentTaskId: dbTask.parent_task_id,
      // These fields will be computed at runtime, not stored in DB
      // subtasks: dbTask.subtasks || [],
      // dependsOn: dbTask.depends_on || [],
      // dependedOnBy: dbTask.depended_on_by || [],
      isRecurring: dbTask.is_recurring,
      recurrencePattern: dbTask.recurrence_pattern,
      recurrenceInterval: dbTask.recurrence_interval,
      recurringTaskId: dbTask.recurring_task_id,
      projectPhase: dbTask.project_phase,
      phaseOrder: dbTask.phase_order,
      deletedAt: dbTask.deleted_at,
      showSubtasks: dbTask.show_subtasks,
      braindumpSource: dbTask.braindump_source,
      completedAt: dbTask.completed_at,
      aiProcessed: dbTask.ai_processed,
      urgency: dbTask.urgency,
      importance: dbTask.importance,
      emotionalWeight: dbTask.emotional_weight,
      energyRequired: dbTask.energy_required
    };
  }
  
  // Helper to map TypeScript camelCase to database snake_case
  private static mapTaskToDb(task: Partial<Task>): any {
    const dbTask: any = {};
    
    if (task.id !== undefined) dbTask.id = task.id;
    if (task.title !== undefined) dbTask.title = task.title;
    if (task.description !== undefined) dbTask.description = task.description;
    if (task.completed !== undefined) dbTask.completed = task.completed;
    if (task.archived !== undefined) dbTask.archived = task.archived;
    if (task.dueDate !== undefined) {
      // Ensure we only store the date part (YYYY-MM-DD) without timezone
      if (task.dueDate && task.dueDate.includes('T')) {
        dbTask.due_date = task.dueDate.split('T')[0];
      } else {
        dbTask.due_date = task.dueDate;
      }
    }
    if (task.createdAt !== undefined) dbTask.created_at = task.createdAt;
    if (task.updatedAt !== undefined) dbTask.updated_at = task.updatedAt;
    if (task.projectId !== undefined) dbTask.project_id = task.projectId;
    if (task.categoryIds !== undefined) dbTask.category_ids = task.categoryIds;
    if (task.tags !== undefined) dbTask.tags = task.tags;
    if (task.priority !== undefined) dbTask.priority = task.priority;
    if (task.energyLevel !== undefined) dbTask.energy_level = task.energyLevel;
    if (task.size !== undefined) dbTask.size = task.size;
    if (task.estimatedMinutes !== undefined) dbTask.estimated_minutes = task.estimatedMinutes;
    if (task.parentTaskId !== undefined) dbTask.parent_task_id = task.parentTaskId;
    // Don't map these fields as they're not stored in DB anymore
    // if (task.subtasks !== undefined) dbTask.subtasks = task.subtasks;
    // if (task.dependsOn !== undefined) dbTask.depends_on = task.dependsOn;
    // if (task.dependedOnBy !== undefined) dbTask.depended_on_by = task.dependedOnBy;
    if (task.isRecurring !== undefined) dbTask.is_recurring = task.isRecurring;
    if (task.recurrencePattern !== undefined) dbTask.recurrence_pattern = task.recurrencePattern;
    if (task.recurrenceInterval !== undefined) dbTask.recurrence_interval = task.recurrenceInterval;
    if (task.recurringTaskId !== undefined) dbTask.recurring_task_id = task.recurringTaskId;
    if (task.projectPhase !== undefined) dbTask.project_phase = task.projectPhase;
    if (task.phaseOrder !== undefined) dbTask.phase_order = task.phaseOrder;
    if (task.deletedAt !== undefined) dbTask.deleted_at = task.deletedAt;
    if (task.showSubtasks !== undefined) dbTask.show_subtasks = task.showSubtasks;
    if (task.braindumpSource !== undefined) dbTask.braindump_source = task.braindumpSource;
    if (task.completedAt !== undefined) dbTask.completed_at = task.completedAt;
    if (task.aiProcessed !== undefined) dbTask.ai_processed = task.aiProcessed;
    if (task.urgency !== undefined) dbTask.urgency = task.urgency;
    if (task.importance !== undefined) dbTask.importance = task.importance;
    if (task.emotionalWeight !== undefined) dbTask.emotional_weight = task.emotionalWeight;
    if (task.energyRequired !== undefined) dbTask.energy_required = task.energyRequired;
    
    return dbTask;
  }
  
  // Helper to map database recurring task to TypeScript format
  private static mapRecurringTaskFromDb(dbTask: any): RecurringTask {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      pattern: dbTask.pattern,
      source: { type: dbTask.source_type }, // Convert string to object
      projectId: dbTask.project_id,
      categoryIds: dbTask.category_ids || [],
      tags: dbTask.tags || [],
      priority: dbTask.priority,
      energyLevel: dbTask.energy_level,
      estimatedMinutes: dbTask.estimated_minutes,
      active: dbTask.is_active,
      nextDue: dbTask.next_due,
      lastGenerated: dbTask.last_generated,
      createdAt: dbTask.created_at,
      updatedAt: dbTask.updated_at
    };
  }
  
  // Helper to map TypeScript recurring task to database format
  private static mapRecurringTaskToDb(task: Partial<RecurringTask>): any {
    const dbTask: any = {};
    
    if (task.id !== undefined) dbTask.id = task.id;
    if (task.title !== undefined) dbTask.title = task.title;
    if (task.description !== undefined) dbTask.description = task.description;
    if (task.pattern !== undefined) dbTask.pattern = task.pattern;
    if (task.source !== undefined) dbTask.source_type = task.source.type;
    if (task.projectId !== undefined) dbTask.project_id = task.projectId;
    if (task.categoryIds !== undefined) dbTask.category_ids = task.categoryIds;
    if (task.tags !== undefined) dbTask.tags = task.tags;
    if (task.priority !== undefined) dbTask.priority = task.priority;
    if (task.energyLevel !== undefined) dbTask.energy_level = task.energyLevel;
    if (task.estimatedMinutes !== undefined) dbTask.estimated_minutes = task.estimatedMinutes;
    if (task.active !== undefined) dbTask.is_active = task.active;
    if (task.nextDue !== undefined) dbTask.next_due = task.nextDue;
    if (task.lastGenerated !== undefined) dbTask.last_generated = task.lastGenerated;
    if (task.createdAt !== undefined) dbTask.created_at = task.createdAt;
    if (task.updatedAt !== undefined) dbTask.updated_at = task.updatedAt;
    
    return dbTask;
  }
  
  // Tasks
  static async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []).map(task => this.mapTaskFromDb(task));
  }

  static async createTask(task: Task, userId: string): Promise<Task> {
    // Map camelCase to snake_case for database
    const dbTask = {
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description,
      completed: task.completed,
      archived: task.archived,
      due_date: task.dueDate,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      project_id: task.projectId,
      category_ids: task.categoryIds,
      tags: task.tags,
      priority: task.priority,
      energy_level: task.energyLevel,
      size: task.size,
      estimated_minutes: task.estimatedMinutes,
      parent_task_id: task.parentTaskId,
      // Don't store these - they're computed at runtime
      // subtasks: task.subtasks,
      // depends_on: task.dependsOn,
      // depended_on_by: task.dependedOnBy,
      is_recurring: task.isRecurring,
      recurrence_pattern: task.recurrencePattern,
      recurrence_interval: task.recurrenceInterval,
      recurring_task_id: task.recurringTaskId,
      project_phase: task.projectPhase,
      phase_order: task.phaseOrder,
      deleted_at: task.deletedAt,
      show_subtasks: task.showSubtasks,
      braindump_source: task.braindumpSource,
      completed_at: task.completedAt,
      ai_processed: task.aiProcessed,
      urgency: task.urgency,
      importance: task.importance,
      emotional_weight: task.emotionalWeight,
      energy_required: task.energyRequired
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(dbTask)
      .select()
      .single();
    
    if (error) throw error;
    
    // Map snake_case back to camelCase
    return this.mapTaskFromDb(data);
  }

  static async updateTask(id: string, updates: Partial<Task>, userId: string): Promise<Task> {
    const dbUpdates = this.mapTaskToDb(updates);
    
    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    const mappedTask = this.mapTaskFromDb(data);
    return mappedTask;
  }

  static async deleteTask(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Get subtasks for a specific task
  static async getSubtasks(parentTaskId: string, userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .eq('user_id', userId)
      .is('deleted_at', null);
    
    if (error) throw error;
    return (data || []).map(task => this.mapTaskFromDb(task));
  }

  // Task Dependencies
  static async addTaskDependency(taskId: string, dependsOnTaskId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('task_dependencies')
      .insert({
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId
      });
    
    if (error) throw error;
  }

  static async removeTaskDependency(taskId: string, dependsOnTaskId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('task_id', taskId)
      .eq('depends_on_task_id', dependsOnTaskId);
    
    if (error) throw error;
  }

  static async getTaskDependencies(taskId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('depends_on_task_id')
      .eq('task_id', taskId);
    
    if (error) throw error;
    return (data || []).map(dep => dep.depends_on_task_id);
  }

  static async getTaskDependents(taskId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('task_id')
      .eq('depends_on_task_id', taskId);
    
    if (error) throw error;
    return (data || []).map(dep => dep.task_id);
  }

  // Projects
  static async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  static async createProject(project: Project, userId: string): Promise<Project> {
    const dbProject = {
      id: project.id,
      user_id: userId,
      name: project.name,
      description: project.description,
      color: project.color,
      order: project.order,
      created_at: project.createdAt,
      updated_at: project.updatedAt
    };
    
    const { data, error } = await supabase
      .from('projects')
      .insert(dbProject)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: Partial<Project>, userId: string): Promise<Project> {
    // Map TypeScript camelCase to database snake_case
    const dbUpdates: any = {};
    
    if (updates.id !== undefined) dbUpdates.id = updates.id;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.order !== undefined) dbUpdates.order = updates.order;
    if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Categories
  static async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  static async createCategory(category: Category, userId: string): Promise<Category> {
    const dbCategory = {
      id: category.id,
      user_id: userId,
      name: category.name,
      color: category.color,
      created_at: category.createdAt,
      updated_at: category.updatedAt
    };
    
    const { data, error } = await supabase
      .from('categories')
      .insert(dbCategory)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCategory(id: string, updates: Partial<Category>, userId: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteCategory(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Recurring Tasks
  static async getRecurringTasks(userId: string): Promise<RecurringTask[]> {
    const { data, error } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Map database format to application format
    return (data || []).map(task => this.mapRecurringTaskFromDb(task));
  }

  static async createRecurringTask(task: RecurringTask, userId: string): Promise<RecurringTask> {
    // Map camelCase to snake_case
    const dbTask = {
      ...this.mapRecurringTaskToDb(task),
      user_id: userId
    };
    
    const { data, error } = await supabase
      .from('recurring_tasks')
      .insert(dbTask)
      .select()
      .single();
    
    if (error) throw error;
    
    // Map back to camelCase
    return this.mapRecurringTaskFromDb(data);
  }

  static async updateRecurringTask(id: string, updates: Partial<RecurringTask>, userId: string): Promise<RecurringTask> {
    // Map updates to database format
    const dbUpdates = this.mapRecurringTaskToDb(updates);
    
    const { data, error } = await supabase
      .from('recurring_tasks')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Map back to application format
    return this.mapRecurringTaskFromDb(data);
  }

  static async deleteRecurringTask(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('recurring_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Daily Plans
  static async getDailyPlans(userId: string): Promise<DailyPlan[]> {
    try {
      
      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Basic supabase connection failed:', testError);
        throw testError;
      }
      
      
      // First test if the table exists by trying a simple select
      const { data: tableTest, error: tableError } = await supabase
        .from('daily_plans')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('daily_plans table does not exist or is not accessible:', {
          message: tableError.message,
          details: tableError.details,
          hint: tableError.hint,
          code: tableError.code
        });
        
        // Return empty array if table doesn't exist instead of throwing
        if (tableError.code === 'PGRST106' || tableError.message.includes('does not exist')) {
          console.warn('daily_plans table does not exist, returning empty array');
          return [];
        }
        throw tableError;
      }
      
      
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching daily plans:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error('getDailyPlans failed:', err);
      throw err;
    }
  }

  static async getDailyPlan(date: string, userId: string): Promise<DailyPlan | null> {
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('date', date)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async saveDailyPlan(plan: DailyPlan, userId: string): Promise<DailyPlan> {
    // Convert camelCase to snake_case for database
    const dbPlan = {
      id: plan.id,
      date: plan.date,
      time_blocks: plan.timeBlocks,
      user_id: userId
    };
    
    const { data, error } = await supabase
      .from('daily_plans')
      .upsert(dbPlan)
      .select()
      .single();
    
    if (error) throw error;
    
    // Convert snake_case back to camelCase for application
    return {
      id: data.id,
      date: data.date,
      timeBlocks: data.time_blocks || []
    };
  }

  // Journal Entries
  static async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createJournalEntry(entry: JournalEntry, userId: string): Promise<JournalEntry> {
    const dbEntry = {
      id: entry.id,
      user_id: userId,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      sections: entry.section ? { [entry.section]: true } : {}, // Convert single section to sections object
      mood: entry.mood,
      mood_score: null, // Not in the interface, set to null
      week: entry.weekNumber,
      year: entry.weekYear,
      tags: entry.tags || [],
      created_at: entry.createdAt,
      updated_at: entry.updatedAt
    };
    
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(dbEntry)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateJournalEntry(id: string, updates: Partial<JournalEntry>, userId: string): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteJournalEntry(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Helper to map database snake_case to TypeScript camelCase for work schedules
  private static mapWorkScheduleFromDb(dbSchedule: any): WorkSchedule {
    return {
      id: dbSchedule.id,
      name: dbSchedule.name,
      shifts: dbSchedule.shifts || [],
      createdAt: dbSchedule.created_at,
      updatedAt: dbSchedule.updated_at,
    };
  }

  // Helper to map TypeScript camelCase to database snake_case for work schedules
  private static mapWorkScheduleToDb(schedule: Partial<WorkSchedule>) {
    const mapped: any = {};
    if (schedule.id !== undefined) mapped.id = schedule.id;
    if (schedule.name !== undefined) mapped.name = schedule.name;
    if (schedule.shifts !== undefined) mapped.shifts = schedule.shifts;
    if (schedule.createdAt !== undefined) mapped.created_at = schedule.createdAt;
    if (schedule.updatedAt !== undefined) mapped.updated_at = schedule.updatedAt;
    return mapped;
  }

  // Work Schedules
  static async getWorkSchedules(userId: string): Promise<WorkSchedule[]> {
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []).map(this.mapWorkScheduleFromDb);
  }

  static async createWorkSchedule(schedule: WorkSchedule, userId: string): Promise<WorkSchedule> {
    const dbSchedule = this.mapWorkScheduleToDb(schedule);
    const { data, error } = await supabase
      .from('work_schedules')
      .insert({ ...dbSchedule, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapWorkScheduleFromDb(data);
  }

  static async updateWorkSchedule(id: string, updates: Partial<WorkSchedule>, userId: string): Promise<WorkSchedule> {
    const dbUpdates = this.mapWorkScheduleToDb(updates);
    const { data, error } = await supabase
      .from('work_schedules')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapWorkScheduleFromDb(data);
  }

  static async deleteWorkSchedule(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('work_schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Settings
  static async getSettings(userId: string): Promise<AppSettings | null> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // PGRST116 means no rows returned, which is fine for settings
        if (error.code === 'PGRST116') {
          return null;
        }
        console.warn('Error fetching settings:', error);
        return null; // Return null instead of throwing for other errors
      }
      
      return data ? data.settings : null; // Extract settings from the JSONB field
    } catch (error) {
      console.warn('Error in getSettings:', error);
      return null; // Gracefully handle any other errors
    }
  }

  static async saveSettings(settings: AppSettings, userId: string): Promise<AppSettings> {
    const dbSettings = {
      user_id: userId,
      settings: settings, // Store the entire settings object in the JSONB field
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(dbSettings)
      .select()
      .single();
    
    if (error) throw error;
    return data.settings; // Return just the settings part
  }

  // Authentication helpers
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.status === 429) {
        const customError = new Error('Too many login attempts. Please wait a moment and try again.');
        (customError as any).status = 429;
        throw customError;
      }
      throw error;
    }
    return data;
  }

  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      if (error.status === 429) {
        const customError = new Error('Too many signup attempts. Please wait a moment and try again.');
        (customError as any).status = 429;
        throw customError;
      }
      throw error;
    }
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
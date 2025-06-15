import { Task, Project, Category, DailyPlan, JournalEntry, AppSettings } from '../types';
import { WorkSchedule, WorkShift } from '../types/WorkSchedule';
import { transformImportedData } from './importTransform';

// Local storage keys - add prefix to handle different paths in PWA
const KEY_PREFIX = 'ADHDplanner_';
const TASKS_KEY = `${KEY_PREFIX}tasks`;
const PROJECTS_KEY = `${KEY_PREFIX}projects`;
const CATEGORIES_KEY = `${KEY_PREFIX}categories`;
const DAILY_PLANS_KEY = `${KEY_PREFIX}dailyPlans`;
const WORK_SCHEDULE_KEY = `${KEY_PREFIX}workSchedule`;
const JOURNAL_ENTRIES_KEY = `${KEY_PREFIX}journalEntries`;
const LAST_WEEKLY_REVIEW_KEY = `${KEY_PREFIX}lastWeeklyReview`;
const DELETED_TASKS_KEY = `${KEY_PREFIX}deletedTasks`;
const SETTINGS_KEY = `${KEY_PREFIX}settings`;

// Tasks
export const getTasks = (): Task[] => {
  try {
    const tasksJSON = localStorage.getItem(TASKS_KEY);
    
    // Check for data under the legacy key without prefix
    if (!tasksJSON) {
      const legacyTasksJSON = localStorage.getItem('tasks');
      if (legacyTasksJSON) {
        // Found data under legacy key, migrate it
        const legacyTasks = JSON.parse(legacyTasksJSON);
        saveTasks(legacyTasks);
        // Remove legacy data after successful migration
        localStorage.removeItem('tasks');
        return legacyTasks;
      }
    }
    
    return tasksJSON ? JSON.parse(tasksJSON) : [];
  } catch (error) {
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
  }
};

export const addTask = (task: Task): void => {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
};

export const updateTask = (updatedTask: Task): void => {
  const tasks = getTasks();
  const index = tasks.findIndex((task) => task.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    saveTasks(tasks);
  }
};

export const deleteTask = (taskId: string): void => {
  const tasks = getTasks();
  const updatedTasks = tasks.filter((task) => task.id !== taskId);
  saveTasks(updatedTasks);
};

// Projects
export const getProjects = (): Project[] => {
  try {
    const projectsJSON = localStorage.getItem(PROJECTS_KEY);
    
    // Check for data under the legacy key without prefix
    if (!projectsJSON) {
      const legacyProjectsJSON = localStorage.getItem('projects');
      if (legacyProjectsJSON) {
        // Found data under legacy key, migrate it
        const legacyProjects = JSON.parse(legacyProjectsJSON);
        saveProjects(legacyProjects);
        // Remove legacy data after successful migration
        localStorage.removeItem('projects');
        return legacyProjects;
      }
    }
    
    return projectsJSON ? JSON.parse(projectsJSON) : [];
  } catch (error) {
    return [];
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
  }
};

export const addProject = (project: Project): void => {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
};

export const updateProject = (updatedProject: Project): void => {
  const projects = getProjects();
  const index = projects.findIndex((project) => project.id === updatedProject.id);
  if (index !== -1) {
    projects[index] = updatedProject;
    saveProjects(projects);
  }
};

export const deleteProject = (projectId: string): void => {
  const projects = getProjects();
  const updatedProjects = projects.filter((project) => project.id !== projectId);
  saveProjects(updatedProjects);
};

// Categories
export const getCategories = (): Category[] => {
  try {
    const categoriesJSON = localStorage.getItem(CATEGORIES_KEY);
    
    // Check for data under the legacy key without prefix
    if (!categoriesJSON) {
      const legacyCategoriesJSON = localStorage.getItem('categories');
      if (legacyCategoriesJSON) {
        // Found data under legacy key, migrate it
        const legacyCategories = JSON.parse(legacyCategoriesJSON);
        saveCategories(legacyCategories);
        // Remove legacy data after successful migration
        localStorage.removeItem('categories');
        return legacyCategories;
      }
    }
    
    return categoriesJSON ? JSON.parse(categoriesJSON) : [];
  } catch (error) {
    return [];
  }
};

export const saveCategories = (categories: Category[]): void => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
  }
};

export const addCategory = (category: Category): void => {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
};

export const updateCategory = (updatedCategory: Category): void => {
  const categories = getCategories();
  const index = categories.findIndex((category) => category.id === updatedCategory.id);
  if (index !== -1) {
    categories[index] = updatedCategory;
    saveCategories(categories);
  }
};

export const deleteCategory = (categoryId: string): void => {
  const categories = getCategories();
  const updatedCategories = categories.filter((category) => category.id !== categoryId);
  saveCategories(updatedCategories);
};

// Daily Plans
export const getDailyPlans = (): DailyPlan[] => {
  try {
    const plansJSON = localStorage.getItem(DAILY_PLANS_KEY);
    
    // Check for data under the legacy key without prefix
    if (!plansJSON) {
      const legacyPlansJSON = localStorage.getItem('dailyPlans');
      if (legacyPlansJSON) {
        // Found data under legacy key, migrate it
        const legacyPlans = JSON.parse(legacyPlansJSON);
        saveDailyPlans(legacyPlans);
        // Remove legacy data after successful migration
        localStorage.removeItem('dailyPlans');
        return legacyPlans;
      }
    }
    
    return plansJSON ? JSON.parse(plansJSON) : [];
  } catch (error) {
    return [];
  }
};

export const saveDailyPlans = (plans: DailyPlan[]): void => {
  try {
    localStorage.setItem(DAILY_PLANS_KEY, JSON.stringify(plans));
  } catch (error) {
  }
};

export const getDailyPlan = (date: string): DailyPlan | null => {
  try {
    const plans = getDailyPlans();
    return plans.find((plan) => plan.date === date) || null;
  } catch (error) {
    return null;
  }
};

export const saveDailyPlan = (plan: DailyPlan): void => {
  try {
    const plans = getDailyPlans();
    const index = plans.findIndex((p) => p.date === plan.date);
    
    if (index !== -1) {
      plans[index] = plan;
    } else {
      plans.push(plan);
    }
    
    saveDailyPlans(plans);
  } catch (error) {
  }
};

// Work Schedule
export const getWorkSchedule = (): WorkSchedule | null => {
  try {
    const scheduleJSON = localStorage.getItem(WORK_SCHEDULE_KEY);
    
    // Check for data under the legacy key without prefix
    if (!scheduleJSON) {
      const legacyScheduleJSON = localStorage.getItem('workSchedule');
      if (legacyScheduleJSON) {
        // Found data under legacy key, migrate it
        const legacySchedule = JSON.parse(legacyScheduleJSON);
        saveWorkSchedule(legacySchedule);
        // Remove legacy data after successful migration
        localStorage.removeItem('workSchedule');
        return legacySchedule;
      }
    }
    
    return scheduleJSON ? JSON.parse(scheduleJSON) : null;
  } catch (error) {
    return null;
  }
};

export const saveWorkSchedule = (schedule: WorkSchedule): void => {
  try {
    localStorage.setItem(WORK_SCHEDULE_KEY, JSON.stringify(schedule));
  } catch (error) {
  }
};

export const getWorkShifts = (): WorkShift[] => {
  try {
    const schedule = getWorkSchedule();
    return schedule ? schedule.shifts : [];
  } catch (error) {
    return [];
  }
};

export const addWorkShift = (shift: WorkShift): void => {
  try {
    const schedule = getWorkSchedule();
    
    if (schedule) {
      const updatedSchedule = {
        ...schedule,
        shifts: [...schedule.shifts, shift],
        updatedAt: new Date().toISOString()
      };
      saveWorkSchedule(updatedSchedule);
    } else {
      // If no schedule exists, create a new one
      const newSchedule: WorkSchedule = {
        id: generateId(),
        name: 'My Work Schedule',
        shifts: [shift],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveWorkSchedule(newSchedule);
    }
  } catch (error) {
  }
};

export const updateWorkShift = (updatedShift: WorkShift): void => {
  try {
    const schedule = getWorkSchedule();
    
    if (schedule) {
      const updatedSchedule = {
        ...schedule,
        shifts: schedule.shifts.map(shift => 
          shift.id === updatedShift.id ? updatedShift : shift
        ),
        updatedAt: new Date().toISOString()
      };
      saveWorkSchedule(updatedSchedule);
    }
  } catch (error) {
  }
};

export const deleteWorkShift = (shiftId: string): void => {
  try {
    const schedule = getWorkSchedule();
    
    if (schedule) {
      const updatedSchedule = {
        ...schedule,
        shifts: schedule.shifts.filter(shift => shift.id !== shiftId),
        updatedAt: new Date().toISOString()
      };
      saveWorkSchedule(updatedSchedule);
    }
  } catch (error) {
  }
};

export const getShiftsForMonth = (year: number, month: number): WorkShift[] => {
  try {
    const schedule = getWorkSchedule();
    if (!schedule) return [];
    
    // Create date range for the given month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return schedule.shifts.filter(shift => 
      shift.date >= startDate && shift.date <= endDate
    );
  } catch (error) {
    return [];
  }
};

// Helper function to generate IDs
const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Data Import/Export
export const exportData = (): string => {
  try {
    // Wrap in try-catch to handle potential localStorage access issues
    const tasks = getTasks() || [];
    const projects = getProjects() || [];
    const categories = getCategories() || [];
    
    // Create a map of project IDs to names for quick lookup
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    
    // Add project names to tasks for easier reference
    const tasksWithProjectNames = tasks.map(task => ({
      ...task,
      projectName: task.projectId ? projectMap.get(task.projectId) || null : null
    }));
    
    const data = {
      tasks: tasksWithProjectNames,
      projects: projects,
      categories: categories,
      dailyPlans: getDailyPlans() || [],
      workSchedule: getWorkSchedule(),
      exportDate: new Date().toISOString(),
      version: "1.1.0"
    };
    
    return JSON.stringify(data);
  } catch (error) {
    // Return a minimal valid JSON to avoid breaking the export
    return JSON.stringify({
      tasks: [],
      projects: [],
      categories: [],
      dailyPlans: [],
      exportDate: new Date().toISOString(),
      version: "1.1.0",
      error: "Failed to access stored data"
    });
  }
};

export const importData = (jsonData: string): boolean => {
  try {
    // Check if the input is valid JSON
    if (!jsonData || jsonData.trim() === '') {
      return false;
    }

    // First try to parse the JSON
    let data;
    try {
      data = JSON.parse(jsonData);
    } catch (parseError) {
      return false;
    }

    // Verify that the data contains at least some of the expected properties
    if (!data || (
      !data.tasks && 
      !data.projects && 
      !data.categories && 
      !data.dailyPlans && 
      !data.workSchedule
    )) {
      return false;
    }

    // Try to transform the imported data first (for backward compatibility)
    const transformedData = transformImportedData(jsonData);
    
    if (transformedData) {
      // Save transformed data
      saveTasks(transformedData.tasks);
      saveProjects(transformedData.projects);
      saveCategories(transformedData.categories);
      return true;
    }
    
    // If transformation isn't applicable, try direct import
    let importSuccessful = false;
    
    if (Array.isArray(data.tasks)) {
      // Remove projectName field from tasks if present (it's only for export convenience)
      const cleanedTasks: Task[] = data.tasks.map(
        (task: Task & { projectName?: string }): Task => {
          const { projectName, ...cleanTask } = task;
          return cleanTask;
        }
      );
      saveTasks(cleanedTasks);
      importSuccessful = true;
    }
    
    if (Array.isArray(data.projects)) {
      saveProjects(data.projects);
      importSuccessful = true;
    }
    
    if (Array.isArray(data.categories)) {
      saveCategories(data.categories);
      importSuccessful = true;
    }
    
    if (Array.isArray(data.dailyPlans)) {
      saveDailyPlans(data.dailyPlans);
      importSuccessful = true;
    }
    
    if (data.workSchedule) {
      saveWorkSchedule(data.workSchedule);
      importSuccessful = true;
    }
    
    if (importSuccessful) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const resetData = (): void => {
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(DAILY_PLANS_KEY);
  localStorage.removeItem(WORK_SCHEDULE_KEY);
  localStorage.removeItem(JOURNAL_ENTRIES_KEY);
  localStorage.removeItem(LAST_WEEKLY_REVIEW_KEY);
};

// Weekly Review Date Functions
export const getLastWeeklyReviewDate = (): string | null => {
  try {
    const dateString = localStorage.getItem(LAST_WEEKLY_REVIEW_KEY);
    
    // Check for legacy key
    if (!dateString) {
      const legacyDateString = localStorage.getItem('lastWeeklyReview');
      if (legacyDateString) {
        // Migrate legacy data
        setLastWeeklyReviewDate(legacyDateString);
        localStorage.removeItem('lastWeeklyReview');
        return legacyDateString;
      }
    }
    
    return dateString;
  } catch (error) {
    return null;
  }
};

export const setLastWeeklyReviewDate = (dateString: string): void => {
  try {
    localStorage.setItem(LAST_WEEKLY_REVIEW_KEY, dateString);
  } catch (error) {
  }
};

export const needsWeeklyReview = (): boolean => {
  try {
    const lastReviewDate = getLastWeeklyReviewDate();
    if (!lastReviewDate) return true;
    
    const lastReview = new Date(lastReviewDate);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(lastReview.getTime())) return true;
    
    // Calculate days since last review
    const daysSinceReview = Math.floor(
      (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Return true if it's been 7 or more days
    return daysSinceReview >= 7;
  } catch (error) {
    return false; // Default to not showing reminder on error
  }
};

// Journal Entries
export const getJournalEntries = (): JournalEntry[] => {
  try {
    const entriesJSON = localStorage.getItem(JOURNAL_ENTRIES_KEY);
    
    // Check for data under the legacy key without prefix
    if (!entriesJSON) {
      const legacyEntriesJSON = localStorage.getItem('journalEntries');
      if (legacyEntriesJSON) {
        // Found data under legacy key, migrate it
        const legacyEntries = JSON.parse(legacyEntriesJSON);
        saveJournalEntries(legacyEntries);
        // Remove legacy data after successful migration
        localStorage.removeItem('journalEntries');
        return legacyEntries;
      }
    }
    
    return entriesJSON ? JSON.parse(entriesJSON) : [];
  } catch (error) {
    return [];
  }
};

export const saveJournalEntries = (entries: JournalEntry[]): void => {
  try {
    localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
  }
};

export const addJournalEntry = (entry: JournalEntry): void => {
  try {
    const entries = getJournalEntries();
    entries.push(entry);
    saveJournalEntries(entries);
  } catch (error) {
  }
};

export const updateJournalEntry = (updatedEntry: JournalEntry): void => {
  try {
    const entries = getJournalEntries();
    const index = entries.findIndex(entry => entry.id === updatedEntry.id);
    
    if (index !== -1) {
      entries[index] = updatedEntry;
      saveJournalEntries(entries);
    } else {
    }
  } catch (error) {
  }
};

export const deleteJournalEntry = (entryId: string): void => {
  try {
    const entries = getJournalEntries();
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    saveJournalEntries(updatedEntries);
  } catch (error) {
  }
};

// Get a specific journal entry by ID
export const getJournalEntryById = (entryId: string): JournalEntry | null => {
  try {
    const entries = getJournalEntries();
    return entries.find(entry => entry.id === entryId) || null;
  } catch (error) {
    return null;
  }
};

// Get journal entries for a specific week (by weekNumber and weekYear)
export const getJournalEntriesForWeek = (weekNumber: number, weekYear: number): JournalEntry[] => {
  try {
    const entries = getJournalEntries();
    return entries.filter(entry => 
      entry.weekNumber === weekNumber && entry.weekYear === weekYear
    );
  } catch (error) {
    return [];
  }
};


// Deleted Tasks Management
export interface DeletedTask {
  task: Task;
  deletedAt: string;
  deletedBy?: string; // Optional: track who deleted it
}

export const getDeletedTasks = (): DeletedTask[] => {
  try {
    const deletedTasksJSON = localStorage.getItem(DELETED_TASKS_KEY);
    if (!deletedTasksJSON) return [];
    
    const deletedTasks: DeletedTask[] = JSON.parse(deletedTasksJSON);
    
    // Clean up tasks older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDeletedTasks = deletedTasks.filter(dt => 
      new Date(dt.deletedAt) > thirtyDaysAgo
    );
    
    // Save cleaned list if different
    if (recentDeletedTasks.length !== deletedTasks.length) {
      saveDeletedTasks(recentDeletedTasks);
    }
    
    return recentDeletedTasks;
  } catch (error) {
    return [];
  }
};

export const saveDeletedTasks = (deletedTasks: DeletedTask[]): void => {
  try {
    localStorage.setItem(DELETED_TASKS_KEY, JSON.stringify(deletedTasks));
  } catch (error) {
  }
};

export const addDeletedTask = (task: Task, deletedBy?: string): void => {
  try {
    const deletedTasks = getDeletedTasks();
    const deletedTask: DeletedTask = {
      task,
      deletedAt: new Date().toISOString(),
      deletedBy
    };
    deletedTasks.push(deletedTask);
    saveDeletedTasks(deletedTasks);
  } catch (error) {
  }
};

export const restoreDeletedTask = (taskId: string): Task | null => {
  try {
    const deletedTasks = getDeletedTasks();
    const deletedTaskIndex = deletedTasks.findIndex(dt => dt.task.id === taskId);
    
    if (deletedTaskIndex === -1) return null;
    
    const restoredTask = deletedTasks[deletedTaskIndex].task;
    
    // Remove from deleted tasks
    deletedTasks.splice(deletedTaskIndex, 1);
    saveDeletedTasks(deletedTasks);
    
    // Add back to regular tasks
    const tasks = getTasks();
    tasks.push(restoredTask);
    saveTasks(tasks);
    
    return restoredTask;
  } catch (error) {
    return null;
  }
};

export const permanentlyDeleteTask = (taskId: string): void => {
  try {
    const deletedTasks = getDeletedTasks();
    const filteredTasks = deletedTasks.filter(dt => dt.task.id !== taskId);
    saveDeletedTasks(filteredTasks);
  } catch (error) {
  }
};

export const clearAllDeletedTasks = (): void => {
  try {
    saveDeletedTasks([]);
  } catch (error) {
  }
};

// Settings
export const getSettings = (): AppSettings | null => {
  try {
    const settingsJSON = localStorage.getItem(SETTINGS_KEY);
    return settingsJSON ? JSON.parse(settingsJSON) : null;
  } catch (error) {
    return null;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
  }
};
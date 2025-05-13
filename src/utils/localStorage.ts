import { Task, Project, Category, DailyPlan } from '../types';
import { WorkSchedule, WorkShift } from '../types/WorkSchedule';
import { transformImportedData } from './importTransform';

// Local storage keys - add prefix to handle different paths in PWA
const KEY_PREFIX = 'ADHDplanner_';
const TASKS_KEY = `${KEY_PREFIX}tasks`;
const PROJECTS_KEY = `${KEY_PREFIX}projects`;
const CATEGORIES_KEY = `${KEY_PREFIX}categories`;
const DAILY_PLANS_KEY = `${KEY_PREFIX}dailyPlans`;
const WORK_SCHEDULE_KEY = `${KEY_PREFIX}workSchedule`;

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
        console.log('Migrated tasks data from legacy storage');
        return legacyTasks;
      }
    }
    
    return tasksJSON ? JSON.parse(tasksJSON) : [];
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
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
        console.log('Migrated projects data from legacy storage');
        return legacyProjects;
      }
    }
    
    return projectsJSON ? JSON.parse(projectsJSON) : [];
  } catch (error) {
    console.error('Error reading projects from localStorage:', error);
    return [];
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving projects to localStorage:', error);
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
        console.log('Migrated categories data from legacy storage');
        return legacyCategories;
      }
    }
    
    return categoriesJSON ? JSON.parse(categoriesJSON) : [];
  } catch (error) {
    console.error('Error reading categories from localStorage:', error);
    return [];
  }
};

export const saveCategories = (categories: Category[]): void => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories to localStorage:', error);
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
        console.log('Migrated daily plans data from legacy storage');
        return legacyPlans;
      }
    }
    
    return plansJSON ? JSON.parse(plansJSON) : [];
  } catch (error) {
    console.error('Error reading daily plans from localStorage:', error);
    return [];
  }
};

export const saveDailyPlans = (plans: DailyPlan[]): void => {
  try {
    localStorage.setItem(DAILY_PLANS_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error('Error saving daily plans to localStorage:', error);
  }
};

export const getDailyPlan = (date: string): DailyPlan | null => {
  try {
    const plans = getDailyPlans();
    return plans.find((plan) => plan.date === date) || null;
  } catch (error) {
    console.error('Error getting daily plan for date:', date, error);
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
    console.error('Error saving daily plan:', error);
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
        console.log('Migrated work schedule data from legacy storage');
        return legacySchedule;
      }
    }
    
    return scheduleJSON ? JSON.parse(scheduleJSON) : null;
  } catch (error) {
    console.error('Error reading work schedule from localStorage:', error);
    return null;
  }
};

export const saveWorkSchedule = (schedule: WorkSchedule): void => {
  try {
    localStorage.setItem(WORK_SCHEDULE_KEY, JSON.stringify(schedule));
  } catch (error) {
    console.error('Error saving work schedule to localStorage:', error);
  }
};

export const getWorkShifts = (): WorkShift[] => {
  try {
    const schedule = getWorkSchedule();
    return schedule ? schedule.shifts : [];
  } catch (error) {
    console.error('Error getting work shifts:', error);
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
    console.error('Error adding work shift:', error);
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
    console.error('Error updating work shift:', error);
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
    console.error('Error deleting work shift:', error);
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
    console.error('Error getting shifts for month:', error);
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
    const data = {
      tasks: getTasks() || [],
      projects: getProjects() || [],
      categories: getCategories() || [],
      dailyPlans: getDailyPlans() || [],
      workSchedule: getWorkSchedule(),
      exportDate: new Date().toISOString(),
      version: "1.0.0"
    };
    
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error exporting data:', error);
    // Return a minimal valid JSON to avoid breaking the export
    return JSON.stringify({
      tasks: [],
      projects: [],
      categories: [],
      dailyPlans: [],
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      error: "Failed to access stored data"
    });
  }
};

export const importData = (jsonData: string): boolean => {
  try {
    // Check if the input is valid JSON
    if (!jsonData || jsonData.trim() === '') {
      console.error('Import failed: Empty JSON data provided');
      return false;
    }

    // First try to parse the JSON
    let data;
    try {
      data = JSON.parse(jsonData);
    } catch (parseError) {
      console.error('Import failed: Invalid JSON format', parseError);
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
      console.error('Import failed: Data does not contain any valid sections');
      return false;
    }

    // Try to transform the imported data first (for backward compatibility)
    const transformedData = transformImportedData(jsonData);
    
    if (transformedData) {
      // Save transformed data
      saveTasks(transformedData.tasks);
      saveProjects(transformedData.projects);
      saveCategories(transformedData.categories);
      console.log('Successfully imported transformed data');
      return true;
    }
    
    // If transformation isn't applicable, try direct import
    let importSuccessful = false;
    
    if (Array.isArray(data.tasks)) {
      saveTasks(data.tasks);
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
      console.log('Successfully imported data');
      return true;
    } else {
      console.error('Import failed: No valid data sections found');
      return false;
    }
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

export const resetData = (): void => {
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(DAILY_PLANS_KEY);
  localStorage.removeItem(WORK_SCHEDULE_KEY);
};
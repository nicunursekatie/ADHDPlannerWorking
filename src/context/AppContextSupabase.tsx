import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, Project, Category, DailyPlan, WhatNowCriteria, JournalEntry, RecurringTask, AppSettings } from '../types';
import { WorkSchedule, WorkShift, ShiftType, DEFAULT_SHIFTS } from '../types/WorkSchedule';
import { DatabaseService } from '../services/database';
import { generateId, recommendTasks as recommendTasksUtil } from '../utils/helpers';
import { getTodayString, formatDateString, extractDateFromText } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface DeletedTask {
  task: Task;
  timestamp: number;
}

interface AppContextType {
  // Auth
  user: User | null;
  signOut: () => Promise<void>;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Partial<Task>) => Promise<Task>;
  quickAddTask: (title: string, projectId?: string | null) => Promise<Task>;
  addSubtask: (parentId: string, subtaskData: Partial<Task>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  archiveCompletedTasks: () => Promise<void>;
  undoDelete: () => Promise<void>;
  hasRecentlyDeleted: boolean;
  
  // Bulk operations
  bulkAddTasks: (tasks: Partial<Task>[]) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  bulkCompleteTasks: (taskIds: string[]) => Promise<void>;
  bulkMoveTasks: (taskIds: string[], projectId: string | null) => Promise<void>;
  bulkArchiveTasks: (taskIds: string[]) => Promise<void>;
  bulkConvertToSubtasks: (taskIds: string[], parentTaskId: string) => Promise<void>;
  bulkAssignCategories: (taskIds: string[], categoryIds: string[], mode: 'add' | 'replace') => Promise<void>;
  
  // Dependencies
  addTaskDependency: (taskId: string, dependsOnId: string) => Promise<void>;
  removeTaskDependency: (taskId: string, dependsOnId: string) => Promise<void>;
  getTaskDependencies: (taskId: string) => Task[];
  getDependentTasks: (taskId: string) => Task[];
  canCompleteTask: (taskId: string) => boolean;
  
  // Projects
  projects: Project[];
  addProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // Categories
  categories: Category[];
  addCategory: (category: Partial<Category>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  // Daily Plans
  dailyPlans: DailyPlan[];
  getDailyPlan: (date: string) => DailyPlan | null;
  saveDailyPlan: (plan: DailyPlan) => Promise<void>;
  exportTimeBlocksToTasks: (date: string) => number;
  
  // Work Schedule
  workSchedule: WorkSchedule | null;
  workShifts: WorkShift[];
  addWorkShift: (date: string, shiftType?: ShiftType) => Promise<WorkShift>;
  updateWorkShift: (shift: WorkShift) => Promise<void>;
  deleteWorkShift: (shiftId: string) => Promise<void>;
  getShiftsForMonth: (year: number, month: number) => WorkShift[];
  getShiftForDate: (date: string) => WorkShift | undefined;
  
  // Journal Entries
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Partial<JournalEntry>) => Promise<JournalEntry>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (entryId: string) => Promise<void>;
  getJournalEntryById: (entryId: string) => JournalEntry | null;
  getJournalEntriesForWeek: (weekNumber: number, weekYear: number) => JournalEntry[];
  
  // Weekly Review
  getLastWeeklyReviewDate: () => string | null;
  updateLastWeeklyReviewDate: () => Promise<void>;
  needsWeeklyReview: () => boolean;
  
  // Recurring Tasks
  recurringTasks: RecurringTask[];
  addRecurringTask: (recurringTask: RecurringTask) => Promise<void>;
  updateRecurringTask: (recurringTask: RecurringTask) => Promise<void>;
  deleteRecurringTask: (recurringTaskId: string) => Promise<void>;
  generateTaskFromRecurring: (recurringTaskId: string) => Task | null;
  
  // What Now Wizard
  recommendTasks: (criteria: WhatNowCriteria) => Task[];
  
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // Data Management
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
  resetData: () => Promise<void>;
  initializeSampleData: () => Promise<void>;
  
  // App State
  isLoading: boolean;
  isDataInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const UNDO_WINDOW = 5000; // 5 seconds window for undo

const DEFAULT_SETTINGS: AppSettings = {
  timeManagement: {
    defaultBufferTime: 15,
    timeBlindnessAlerts: false,
    timeBlindnessInterval: 60,
    autoAdjustEstimates: false,
    gettingReadyTime: 30
  },
  visual: {
    fontSize: 'medium',
    layoutDensity: 'comfortable',
    reduceAnimations: false,
    highContrast: false,
    customPriorityColors: {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    }
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [lastWeeklyReviewDate, setLastWeeklyReviewDate] = useState<string | null>(null);

  // Auth state management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        // Clear data when user signs out
        setTasks([]);
        setProjects([]);
        setCategories([]);
        setDailyPlans([]);
        setWorkSchedule(null);
        setJournalEntries([]);
        setRecurringTasks([]);
        setSettings(DEFAULT_SETTINGS);
        setIsDataInitialized(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user data from Supabase
  const loadUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const [
        tasksData,
        projectsData,
        categoriesData,
        dailyPlansData,
        workSchedulesData,
        journalEntriesData,
        recurringTasksData,
        settingsData
      ] = await Promise.allSettled([
        DatabaseService.getTasks(userId),
        DatabaseService.getProjects(userId),
        DatabaseService.getCategories(userId),
        DatabaseService.getDailyPlans(userId),
        DatabaseService.getWorkSchedules(userId),
        DatabaseService.getJournalEntries(userId),
        DatabaseService.getRecurringTasks(userId),
        DatabaseService.getSettings(userId)
      ]).then(results => results.map(result => 
        result.status === 'fulfilled' ? result.value : []
      ));

      setTasks(tasksData);
      setProjects(projectsData);
      setCategories(categoriesData);
      setDailyPlans(dailyPlansData);
      setWorkSchedule(workSchedulesData[0] || null);
      setJournalEntries(journalEntriesData);
      setRecurringTasks(recurringTasksData);
      if (settingsData) {
        setSettings(settingsData);
      }

      const hasData = tasksData.length > 0 || projectsData.length > 0 || categoriesData.length > 0;
      setIsDataInitialized(hasData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up old deleted tasks
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setDeletedTasks(prev => 
        prev.filter(dt => now - dt.timestamp < UNDO_WINDOW)
      );
    }, 1000);
    
    return () => clearInterval(cleanup);
  }, []);

  const signOut = async () => {
    await DatabaseService.signOut();
  };

  // Tasks
  const addTask = useCallback(async (taskData: Partial<Task>): Promise<Task> => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      title: '',
      description: '',
      completed: false,
      archived: false,
      dueDate: null,
      projectId: null,
      categoryIds: [],
      parentTaskId: null,
      subtasks: [],
      dependsOn: [],
      dependedOnBy: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      ...taskData,
    };
    
    const createdTask = await DatabaseService.createTask(newTask, user.id);
    setTasks(prev => [...prev, createdTask]);
    
    // Update parent task if this is a subtask
    if (createdTask.parentTaskId) {
      const parentTask = tasks.find(t => t.id === createdTask.parentTaskId);
      if (parentTask) {
        const updatedParent = {
          ...parentTask,
          subtasks: [...parentTask.subtasks, createdTask.id],
          updatedAt: timestamp,
        };
        
        await DatabaseService.updateTask(updatedParent.id, updatedParent, user.id);
        setTasks(prev => prev.map(t => 
          t.id === updatedParent.id ? updatedParent : t
        ));
      }
    }
    
    return createdTask;
  }, [user, tasks]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const taskWithTimestamp = {
      ...updatedTask,
      updatedAt: timestamp,
    };
    
    await DatabaseService.updateTask(updatedTask.id, taskWithTimestamp, user.id);
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? taskWithTimestamp : task
    ));
  }, [user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Store the task for potential undo
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      setDeletedTasks(prev => [...prev, {
        task: taskToDelete,
        timestamp: Date.now()
      }]);
    }
    
    // Remove task from parent's subtasks if it's a subtask
    if (taskToDelete?.parentTaskId) {
      const parentTask = tasks.find(t => t.id === taskToDelete.parentTaskId);
      if (parentTask) {
        const updatedParent = {
          ...parentTask,
          subtasks: parentTask.subtasks.filter(id => id !== taskId),
          updatedAt: new Date().toISOString(),
        };
        
        await DatabaseService.updateTask(updatedParent.id, updatedParent, user.id);
        setTasks(prev => prev.map(t => 
          t.id === updatedParent.id ? updatedParent : t
        ));
      }
    }
    
    // Delete all subtasks recursively
    const deleteSubtasksRecursively = async (parentId: string) => {
      const subtaskIds = tasks
        .filter(t => t.parentTaskId === parentId)
        .map(t => t.id);
      
      for (const id of subtaskIds) {
        await deleteSubtasksRecursively(id);
        await DatabaseService.deleteTask(id, user.id);
      }
    };
    
    await deleteSubtasksRecursively(taskId);
    
    // Delete the task itself
    await DatabaseService.deleteTask(taskId, user.id);
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, [user, tasks]);

  const undoDelete = useCallback(async () => {
    if (!user || deletedTasks.length === 0) return;
    
    const lastDeleted = deletedTasks[deletedTasks.length - 1];
    const restoredTask = await DatabaseService.createTask(lastDeleted.task, user.id);
    
    setTasks(prev => [...prev, restoredTask]);
    setDeletedTasks(prev => prev.slice(0, -1));
  }, [user, deletedTasks]);

  const hasRecentlyDeleted = deletedTasks.length > 0;

  const completeTask = useCallback(async (taskId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const taskToUpdate = tasks.find(t => t.id === taskId);
    
    if (!taskToUpdate) return;
    
    const updatedTask = {
      ...taskToUpdate,
      completed: !taskToUpdate.completed,
      completedAt: !taskToUpdate.completed ? timestamp : null,
      updatedAt: timestamp,
    };
    
    await DatabaseService.updateTask(taskId, updatedTask, user.id);
    setTasks(prev => prev.map(task => 
      task.id === taskId ? updatedTask : task
    ));
  }, [user, tasks]);

  const archiveCompletedTasks = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    
    // Find all completed tasks and set them as archived
    const tasksToArchive = tasks.filter(task => task.completed && !task.archived);
    
    for (const task of tasksToArchive) {
      const updatedTask = {
        ...task,
        archived: true,
        updatedAt: timestamp,
      };
      await DatabaseService.updateTask(task.id, updatedTask, user.id);
    }
    
    setTasks(prev => prev.map(task => {
      if (task.completed && !task.archived) {
        return {
          ...task,
          archived: true,
          updatedAt: timestamp,
        };
      }
      return task;
    }));
  }, [user, tasks]);

  // Projects
  const addProject = useCallback(async (projectData: Partial<Project>): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const newProject: Project = {
      id: generateId(),
      name: '',
      description: '',
      color: '#3B82F6',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...projectData,
    };
    
    const createdProject = await DatabaseService.createProject(newProject, user.id);
    setProjects(prev => [...prev, createdProject]);
    return createdProject;
  }, [user]);

  const updateProject = useCallback(async (updatedProject: Project) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const projectWithTimestamp = {
      ...updatedProject,
      updatedAt: timestamp,
    };
    
    await DatabaseService.updateProject(updatedProject.id, projectWithTimestamp, user.id);
    setProjects(prev => prev.map(project => 
      project.id === updatedProject.id ? projectWithTimestamp : project
    ));
  }, [user]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Remove project from tasks
    const tasksToUpdate = tasks.filter(task => task.projectId === projectId);
    
    for (const task of tasksToUpdate) {
      const updatedTask = {
        ...task,
        projectId: null,
        updatedAt: new Date().toISOString(),
      };
      await DatabaseService.updateTask(task.id, updatedTask, user.id);
    }
    
    setTasks(prev => prev.map(task => {
      if (task.projectId === projectId) {
        return {
          ...task,
          projectId: null,
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    }));
    
    // Delete project
    await DatabaseService.deleteProject(projectId, user.id);
    setProjects(prev => prev.filter(project => project.id !== projectId));
  }, [user, tasks]);

  // Categories
  const addCategory = useCallback(async (categoryData: Partial<Category>): Promise<Category> => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const newCategory: Category = {
      id: generateId(),
      name: '',
      color: '#3B82F6',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...categoryData,
    };
    
    const createdCategory = await DatabaseService.createCategory(newCategory, user.id);
    setCategories(prev => [...prev, createdCategory]);
    return createdCategory;
  }, [user]);

  const updateCategory = useCallback(async (updatedCategory: Category) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const categoryWithTimestamp = {
      ...updatedCategory,
      updatedAt: timestamp,
    };
    
    await DatabaseService.updateCategory(updatedCategory.id, categoryWithTimestamp, user.id);
    setCategories(prev => prev.map(category => 
      category.id === updatedCategory.id ? categoryWithTimestamp : category
    ));
  }, [user]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Remove category from tasks
    const tasksToUpdate = tasks.filter(task => task.categoryIds?.includes(categoryId));
    
    for (const task of tasksToUpdate) {
      const updatedTask = {
        ...task,
        categoryIds: task.categoryIds.filter(id => id !== categoryId),
        updatedAt: new Date().toISOString(),
      };
      await DatabaseService.updateTask(task.id, updatedTask, user.id);
    }
    
    setTasks(prev => prev.map(task => {
      if (task.categoryIds?.includes(categoryId)) {
        return {
          ...task,
          categoryIds: task.categoryIds.filter(id => id !== categoryId),
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    }));
    
    // Delete category
    await DatabaseService.deleteCategory(categoryId, user.id);
    setCategories(prev => prev.filter(category => category.id !== categoryId));
  }, [user, tasks]);

  // Daily Plans
  const getDailyPlan = useCallback((date: string): DailyPlan | null => {
    return dailyPlans.find(plan => plan.date === date) || null;
  }, [dailyPlans]);

  const saveDailyPlan = useCallback(async (plan: DailyPlan) => {
    if (!user) throw new Error('User not authenticated');
    
    const savedPlan = await DatabaseService.saveDailyPlan(plan, user.id);
    
    setDailyPlans(prev => {
      const existingIndex = prev.findIndex(p => p.date === plan.date);
      if (existingIndex !== -1) {
        return [
          ...prev.slice(0, existingIndex),
          savedPlan,
          ...prev.slice(existingIndex + 1),
        ];
      } else {
        return [...prev, savedPlan];
      }
    });
  }, [user]);

  const exportTimeBlocksToTasks = useCallback((date: string): number => {
    const plan = getDailyPlan(date);
    if (!plan || !plan.timeBlocks || plan.timeBlocks.length === 0) {
      return 0;
    }

    let exportedCount = 0;
    plan.timeBlocks.forEach(block => {
      if (block && block.title && block.title !== 'New Time Block') {
        exportedCount++;
      }
    });

    return exportedCount;
  }, [getDailyPlan]);

  // Work Schedule
  const workShifts = workSchedule?.shifts || [];

  const addWorkShift = useCallback(async (date: string, shiftType: ShiftType = 'full'): Promise<WorkShift> => {
    if (!user) throw new Error('User not authenticated');
    
    const shiftDefaults = DEFAULT_SHIFTS[shiftType];
    const newShift: WorkShift = {
      id: generateId(),
      date,
      startTime: shiftDefaults.startTime,
      endTime: shiftDefaults.endTime,
      shiftType: shiftDefaults.shiftType,
    };
    
    let scheduleToUpdate = workSchedule;
    
    if (!scheduleToUpdate) {
      scheduleToUpdate = {
        id: generateId(),
        name: 'My Work Schedule',
        shifts: [newShift],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const created = await DatabaseService.createWorkSchedule(scheduleToUpdate, user.id);
      setWorkSchedule(created);
    } else {
      scheduleToUpdate = {
        ...scheduleToUpdate,
        shifts: [...scheduleToUpdate.shifts, newShift],
        updatedAt: new Date().toISOString()
      };
      
      const updated = await DatabaseService.updateWorkSchedule(scheduleToUpdate.id, scheduleToUpdate, user.id);
      setWorkSchedule(updated);
    }
    
    return newShift;
  }, [user, workSchedule]);

  const updateWorkShift = useCallback(async (updatedShift: WorkShift) => {
    if (!user || !workSchedule) throw new Error('User not authenticated or no work schedule');
    
    const updatedSchedule = {
      ...workSchedule,
      shifts: workSchedule.shifts.map(shift => 
        shift.id === updatedShift.id ? updatedShift : shift
      ),
      updatedAt: new Date().toISOString()
    };
    
    const saved = await DatabaseService.updateWorkSchedule(workSchedule.id, updatedSchedule, user.id);
    setWorkSchedule(saved);
  }, [user, workSchedule]);

  const deleteWorkShift = useCallback(async (shiftId: string) => {
    if (!user || !workSchedule) throw new Error('User not authenticated or no work schedule');
    
    const updatedSchedule = {
      ...workSchedule,
      shifts: workSchedule.shifts.filter(shift => shift.id !== shiftId),
      updatedAt: new Date().toISOString()
    };
    
    const saved = await DatabaseService.updateWorkSchedule(workSchedule.id, updatedSchedule, user.id);
    setWorkSchedule(saved);
  }, [user, workSchedule]);

  const getShiftsForMonth = useCallback((year: number, month: number): WorkShift[] => {
    if (!workSchedule) return [];
    
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return workSchedule.shifts.filter(shift => 
      shift.date >= startDate && shift.date <= endDate
    );
  }, [workSchedule]);

  const getShiftForDate = useCallback((date: string): WorkShift | undefined => {
    return workSchedule?.shifts.find(shift => shift.date === date);
  }, [workSchedule]);

  // Journal Entries
  const addJournalEntry = useCallback(async (entryData: Partial<JournalEntry>): Promise<JournalEntry> => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    const date = new Date();
    
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    const newEntry: JournalEntry = {
      id: generateId(),
      date: timestamp.split('T')[0],
      title: '',
      content: '',
      weekNumber,
      weekYear: date.getFullYear(),
      createdAt: timestamp,
      updatedAt: timestamp,
      ...entryData
    };
    
    const createdEntry = await DatabaseService.createJournalEntry(newEntry, user.id);
    setJournalEntries(prev => [...prev, createdEntry]);
    return createdEntry;
  }, [user]);

  const updateJournalEntry = useCallback(async (updatedEntry: JournalEntry) => {
    if (!user) throw new Error('User not authenticated');
    
    const updatedEntryWithTimestamp = {
      ...updatedEntry,
      updatedAt: new Date().toISOString()
    };
    
    await DatabaseService.updateJournalEntry(updatedEntry.id, updatedEntryWithTimestamp, user.id);
    setJournalEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntryWithTimestamp : entry
    ));
  }, [user]);

  const deleteJournalEntry = useCallback(async (entryId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    await DatabaseService.deleteJournalEntry(entryId, user.id);
    setJournalEntries(prev => prev.filter(entry => entry.id !== entryId));
  }, [user]);

  const getJournalEntryById = useCallback((entryId: string): JournalEntry | null => {
    return journalEntries.find(entry => entry.id === entryId) || null;
  }, [journalEntries]);

  const getJournalEntriesForWeek = useCallback((weekNumber: number, weekYear: number): JournalEntry[] => {
    return journalEntries.filter(entry => 
      entry.weekNumber === weekNumber && entry.weekYear === weekYear
    );
  }, [journalEntries]);

  // Recurring Tasks
  const addRecurringTask = useCallback(async (recurringTask: RecurringTask) => {
    if (!user) throw new Error('User not authenticated');
    
    const created = await DatabaseService.createRecurringTask(recurringTask, user.id);
    setRecurringTasks(prev => [...prev, created]);
  }, [user]);

  const updateRecurringTask = useCallback(async (recurringTask: RecurringTask) => {
    if (!user) throw new Error('User not authenticated');
    
    const updated = await DatabaseService.updateRecurringTask(recurringTask.id, recurringTask, user.id);
    setRecurringTasks(prev => prev.map(rt => rt.id === recurringTask.id ? updated : rt));
  }, [user]);

  const deleteRecurringTask = useCallback(async (recurringTaskId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    await DatabaseService.deleteRecurringTask(recurringTaskId, user.id);
    setRecurringTasks(prev => prev.filter(rt => rt.id !== recurringTaskId));
  }, [user]);

  const generateTaskFromRecurring = useCallback((recurringTaskId: string): Task | null => {
    const recurringTask = recurringTasks.find(rt => rt.id === recurringTaskId);
    if (!recurringTask) return null;

    const newTask: Task = {
      id: generateId(),
      title: recurringTask.title,
      description: recurringTask.description,
      completed: false,
      archived: false,
      dueDate: recurringTask.nextDue,
      projectId: recurringTask.projectId,
      categoryIds: recurringTask.categoryIds,
      parentTaskId: null,
      subtasks: [],
      dependsOn: [],
      dependedOnBy: [],
      priority: recurringTask.priority,
      energyLevel: recurringTask.energyLevel,
      estimatedMinutes: recurringTask.estimatedMinutes,
      tags: recurringTask.tags,
      recurringTaskId: recurringTaskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newTask;
  }, [recurringTasks]);

  // Weekly Review
  const getLastWeeklyReviewDate = useCallback((): string | null => {
    return lastWeeklyReviewDate;
  }, [lastWeeklyReviewDate]);

  const updateLastWeeklyReviewDate = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    setLastWeeklyReviewDate(today);
    // TODO: Store this in Supabase user metadata or settings
  }, []);

  const needsWeeklyReview = useCallback((): boolean => {
    if (!lastWeeklyReviewDate) return true;
    
    const lastReview = new Date(lastWeeklyReviewDate);
    const today = new Date();
    const daysSinceReview = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceReview >= 7;
  }, [lastWeeklyReviewDate]);

  // Settings
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    if (!user) throw new Error('User not authenticated');
    
    const updated = {
      ...settings,
      ...newSettings,
      timeManagement: {
        ...settings.timeManagement,
        ...(newSettings.timeManagement || {})
      },
      visual: {
        ...settings.visual,
        ...(newSettings.visual || {}),
        customPriorityColors: {
          ...settings.visual.customPriorityColors,
          ...(newSettings.visual?.customPriorityColors || {})
        }
      }
    };
    
    const saved = await DatabaseService.saveSettings(updated, user.id);
    setSettings(saved);
  }, [user, settings]);

  // What Now Wizard
  const recommendTasks = useCallback((criteria: WhatNowCriteria): Task[] => {
    return recommendTasksUtil(tasks, criteria);
  }, [tasks]);

  // Simple task creation with smart text parsing
  const quickAddTask = useCallback(async (title: string, projectId: string | null = null): Promise<Task> => {
    let processedTitle = title.trim();
    let dueDate: string | null = null;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let categoryIds: string[] = [];
    
    // First extract natural language dates
    const { cleanedText, date } = extractDateFromText(processedTitle);
    if (date) {
      processedTitle = cleanedText;
      dueDate = formatDateString(date);
    }
    
    // Extract priority
    if (processedTitle.includes('!high')) {
      priority = 'high';
      processedTitle = processedTitle.replace('!high', '').trim();
    } else if (processedTitle.includes('!low')) {
      priority = 'low';
      processedTitle = processedTitle.replace('!low', '').trim();
    } else if (processedTitle.includes('!medium')) {
      priority = 'medium';
      processedTitle = processedTitle.replace('!medium', '').trim();
    }
    
    // Clean up any double spaces
    processedTitle = processedTitle.replace(/\s+/g, ' ').trim();
    
    // Create and return the task
    return addTask({
      title: processedTitle,
      dueDate,
      priority,
      projectId,
      categoryIds,
      completed: false
    });
  }, [addTask]);

  // Create a subtask directly linked to a parent task
  const addSubtask = useCallback(async (parentId: string, subtaskData: Partial<Task>): Promise<Task> => {
    // Make sure the parent exists
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }
    
    // Create the subtask with parent reference
    const newSubtask = await addTask({
      ...subtaskData,
      parentTaskId: parentId,
      // Inherit project from parent if not specified
      projectId: subtaskData.projectId !== undefined ? subtaskData.projectId : parentTask.projectId
    });
    
    return newSubtask;
  }, [tasks, addTask]);

  // Bulk Operations
  const bulkDeleteTasks = useCallback(async (taskIds: string[]) => {
    if (!user) throw new Error('User not authenticated');
    
    // Store tasks for potential undo
    const tasksToDelete = tasks.filter(t => taskIds.includes(t.id));
    tasksToDelete.forEach(task => {
      setDeletedTasks(prev => [...prev, {
        task,
        timestamp: Date.now()
      }]);
    });
    
    // Delete tasks and their subtasks
    for (const taskId of taskIds) {
      await deleteTask(taskId);
    }
  }, [user, tasks, deleteTask]);

  const bulkCompleteTasks = useCallback(async (taskIds: string[]) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    
    for (const taskId of taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask({
          ...task,
          completed: true,
          completedAt: timestamp,
          updatedAt: timestamp
        });
      }
    }
  }, [user, tasks, updateTask]);

  const bulkMoveTasks = useCallback(async (taskIds: string[], projectId: string | null) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    
    for (const taskId of taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask({
          ...task,
          projectId,
          updatedAt: timestamp
        });
      }
    }
  }, [user, tasks, updateTask]);

  const bulkArchiveTasks = useCallback(async (taskIds: string[]) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    
    for (const taskId of taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask({
          ...task,
          archived: true,
          updatedAt: timestamp
        });
      }
    }
  }, [user, tasks, updateTask]);

  const bulkAddTasks = useCallback(async (newTasks: Partial<Task>[]) => {
    if (!user) throw new Error('User not authenticated');
    
    for (const taskData of newTasks) {
      await addTask(taskData);
    }
  }, [user, addTask]);

  const bulkConvertToSubtasks = useCallback(async (taskIds: string[], parentTaskId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask) return;
    
    const timestamp = new Date().toISOString();
    
    for (const taskId of taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask({
          ...task,
          parentTaskId: parentTaskId,
          projectId: parentTask.projectId,
          updatedAt: timestamp
        });
      }
    }
    
    // Update parent task
    await updateTask({
      ...parentTask,
      subtasks: [...parentTask.subtasks, ...taskIds.filter(id => !parentTask.subtasks.includes(id))],
      updatedAt: timestamp
    });
  }, [user, tasks, updateTask]);

  const bulkAssignCategories = useCallback(async (taskIds: string[], categoryIds: string[], mode: 'add' | 'replace') => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    
    for (const taskId of taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        let newCategoryIds: string[];
        
        if (mode === 'replace') {
          newCategoryIds = categoryIds;
        } else {
          const existingIds = task.categoryIds || [];
          const uniqueNewIds = categoryIds.filter(id => !existingIds.includes(id));
          newCategoryIds = [...existingIds, ...uniqueNewIds];
        }
        
        await updateTask({
          ...task,
          categoryIds: newCategoryIds,
          updatedAt: timestamp
        });
      }
    }
  }, [user, tasks, updateTask]);

  // Dependencies
  const addTaskDependency = useCallback(async (taskId: string, dependsOnId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    
    const task = tasks.find(t => t.id === taskId);
    const dependsOnTask = tasks.find(t => t.id === dependsOnId);
    
    if (task && dependsOnTask) {
      await updateTask({
        ...task,
        dependsOn: task.dependsOn ? [...task.dependsOn, dependsOnId] : [dependsOnId],
        updatedAt: timestamp
      });
      
      await updateTask({
        ...dependsOnTask,
        dependedOnBy: dependsOnTask.dependedOnBy ? [...dependsOnTask.dependedOnBy, taskId] : [taskId],
        updatedAt: timestamp
      });
    }
  }, [user, tasks, updateTask]);

  const removeTaskDependency = useCallback(async (taskId: string, dependsOnId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const timestamp = new Date().toISOString();
    
    const task = tasks.find(t => t.id === taskId);
    const dependsOnTask = tasks.find(t => t.id === dependsOnId);
    
    if (task && dependsOnTask) {
      await updateTask({
        ...task,
        dependsOn: task.dependsOn?.filter(id => id !== dependsOnId) || [],
        updatedAt: timestamp
      });
      
      await updateTask({
        ...dependsOnTask,
        dependedOnBy: dependsOnTask.dependedOnBy?.filter(id => id !== taskId) || [],
        updatedAt: timestamp
      });
    }
  }, [user, tasks, updateTask]);

  const getTaskDependencies = useCallback((taskId: string): Task[] => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependsOn) return [];
    
    return tasks.filter(t => task.dependsOn.includes(t.id));
  }, [tasks]);

  const getDependentTasks = useCallback((taskId: string): Task[] => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependedOnBy) return [];
    
    return tasks.filter(t => task.dependedOnBy.includes(t.id));
  }, [tasks]);

  const canCompleteTask = useCallback((taskId: string): boolean => {
    const dependencies = getTaskDependencies(taskId);
    return dependencies.every(dep => dep.completed);
  }, [getTaskDependencies]);

  // Data Management
  const exportData = useCallback((): string => {
    const data = {
      tasks,
      projects,
      categories,
      dailyPlans,
      workSchedule,
      journalEntries,
      recurringTasks,
      settings
    };
    return JSON.stringify(data, null, 2);
  }, [tasks, projects, categories, dailyPlans, workSchedule, journalEntries, recurringTasks, settings]);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const data = JSON.parse(jsonData);
      
      // TODO: Implement bulk import to Supabase
      // For now, return false to indicate not implemented
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, [user]);

  const resetData = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    
    // TODO: Implement data reset in Supabase
    // This would delete all user data
  }, [user]);

  const initializeSampleData = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    
    // TODO: Implement sample data initialization
  }, [user]);

  const contextValue: AppContextType = {
    user,
    signOut,
    
    tasks,
    addTask,
    quickAddTask,
    addSubtask,
    updateTask,
    deleteTask,
    completeTask,
    archiveCompletedTasks,
    undoDelete,
    hasRecentlyDeleted,
    
    bulkAddTasks,
    bulkDeleteTasks,
    bulkCompleteTasks,
    bulkMoveTasks,
    bulkArchiveTasks,
    bulkConvertToSubtasks,
    bulkAssignCategories,
    
    addTaskDependency,
    removeTaskDependency,
    getTaskDependencies,
    getDependentTasks,
    canCompleteTask,
    
    projects,
    addProject,
    updateProject,
    deleteProject,
    
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    
    dailyPlans,
    getDailyPlan,
    saveDailyPlan,
    exportTimeBlocksToTasks,
    
    workSchedule,
    workShifts,
    addWorkShift,
    updateWorkShift,
    deleteWorkShift,
    getShiftsForMonth,
    getShiftForDate,
    
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalEntryById,
    getJournalEntriesForWeek,
    
    getLastWeeklyReviewDate,
    updateLastWeeklyReviewDate,
    needsWeeklyReview,
    
    recurringTasks,
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    generateTaskFromRecurring,
    
    recommendTasks,
    
    settings,
    updateSettings,
    
    exportData,
    importData,
    resetData,
    initializeSampleData,
    
    isLoading,
    isDataInitialized,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
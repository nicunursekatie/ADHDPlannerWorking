import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, Project, Category, DailyPlan, WhatNowCriteria, JournalEntry, AppSettings } from '../types';
import { WorkSchedule, WorkShift, ShiftType, DEFAULT_SHIFTS } from '../types/WorkSchedule';
import * as localStorage from '../utils/localStorage';
import { generateId, createSampleData, recommendTasks as recommendTasksUtil } from '../utils/helpers';
import { getTodayString, formatDateString, extractDateFromText } from '../utils/dateUtils';

interface DeletedTask {
  task: Task;
  timestamp: number;
}

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (task: Partial<Task>) => Task;
  quickAddTask: (title: string, projectId?: string | null) => Task;
  addSubtask: (parentId: string, subtaskData: Partial<Task>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  archiveCompletedTasks: () => void;
  undoDelete: () => void;
  hasRecentlyDeleted: boolean;
  
  // Bulk operations
  bulkAddTasks: (tasks: Partial<Task>[]) => void;
  bulkDeleteTasks: (taskIds: string[]) => void;
  bulkCompleteTasks: (taskIds: string[]) => void;
  bulkMoveTasks: (taskIds: string[], projectId: string | null) => void;
  bulkArchiveTasks: (taskIds: string[]) => void;
  bulkConvertToSubtasks: (taskIds: string[], parentTaskId: string) => void;
  bulkAssignCategories: (taskIds: string[], categoryIds: string[], mode: 'add' | 'replace') => void;
  
  // Dependencies
  addTaskDependency: (taskId: string, dependsOnId: string) => void;
  removeTaskDependency: (taskId: string, dependsOnId: string) => void;
  getTaskDependencies: (taskId: string) => Task[];
  getDependentTasks: (taskId: string) => Task[];
  canCompleteTask: (taskId: string) => boolean;
  
  // Projects
  projects: Project[];
  addProject: (project: Partial<Project>) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  
  // Categories
  categories: Category[];
  addCategory: (category: Partial<Category>) => Category;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  
  // Daily Plans
  dailyPlans: DailyPlan[];
  getDailyPlan: (date: string) => DailyPlan | null;
  saveDailyPlan: (plan: DailyPlan) => void;
  exportTimeBlocksToTasks: (date: string) => number;
  
  // Work Schedule
  workSchedule: WorkSchedule | null;
  workShifts: WorkShift[];
  addWorkShift: (date: string, shiftType?: ShiftType) => WorkShift;
  updateWorkShift: (shift: WorkShift) => void;
  deleteWorkShift: (shiftId: string) => void;
  getShiftsForMonth: (year: number, month: number) => WorkShift[];
  getShiftForDate: (date: string) => WorkShift | undefined;
  
  // Journal Entries
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Partial<JournalEntry>) => JournalEntry;
  updateJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (entryId: string) => void;
  getJournalEntryById: (entryId: string) => JournalEntry | null;
  getJournalEntriesForWeek: (weekNumber: number, weekYear: number) => JournalEntry[];
  
  // Weekly Review
  getLastWeeklyReviewDate: () => string | null;
  updateLastWeeklyReviewDate: () => void;
  needsWeeklyReview: () => boolean;
  
  // What Now Wizard
  recommendTasks: (criteria: WhatNowCriteria) => Task[];
  
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Data Management
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  resetData: () => void;
  initializeSampleData: () => void;
  
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
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
  

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      try {
        // Wrap all localStorage calls in try-catch to prevent React rendering crashes
        let loadedTasks = [];
        let loadedProjects = [];
        let loadedCategories = [];
        let loadedDailyPlans = [];
        let loadedWorkSchedule = null;
        let loadedJournalEntries = [];
        let loadedSettings = null;
        
        try {
          loadedTasks = localStorage.getTasks();
        } catch (error) {
        }
        
        try {
          loadedProjects = localStorage.getProjects();
        } catch (error) {
        }
        
        try {
          loadedCategories = localStorage.getCategories();
        } catch (error) {
        }
        
        try {
          loadedDailyPlans = localStorage.getDailyPlans();
        } catch (error) {
        }
        
        try {
          loadedWorkSchedule = localStorage.getWorkSchedule();
        } catch (error) {
        }
        
        try {
          loadedJournalEntries = localStorage.getJournalEntries();
        } catch (error) {
        }
        
        try {
          loadedSettings = localStorage.getSettings();
        } catch (error) {
        }
        
        // Debug logging
        
        setTasks(loadedTasks);
        setProjects(loadedProjects);
        setCategories(loadedCategories);
        setDailyPlans(loadedDailyPlans);
        setWorkSchedule(loadedWorkSchedule);
        setJournalEntries(loadedJournalEntries);
        if (loadedSettings) {
          setSettings(loadedSettings);
        }
        
        // Check if data exists
        const hasData = 
          loadedTasks.length > 0 || 
          loadedProjects.length > 0 || 
          loadedCategories.length > 0;
        
        setIsDataInitialized(hasData);
      } catch (error) {
        // Catch-all for any unhandled errors in data loading
        // Set default empty data structures to prevent rendering errors
        setTasks([]);
        setProjects([]);
        setCategories([]);
        setDailyPlans([]);
        setWorkSchedule(null);
        setJournalEntries([]);
        setIsDataInitialized(false);
      } finally {
        // Always set loading to false, even if there was an error
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  
  // Tasks
  const addTask = useCallback((taskData: Partial<Task>): Task => {
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
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
    
    // Update parent task if this is a subtask
    if (newTask.parentTaskId) {
      const parentTask = updatedTasks.find(t => t.id === newTask.parentTaskId);
      if (parentTask) {
        const updatedParent = {
          ...parentTask,
          subtasks: [...parentTask.subtasks, newTask.id],
          updatedAt: timestamp,
        };
        
        const finalTasks = updatedTasks.map(t => 
          t.id === updatedParent.id ? updatedParent : t
        );
        
        setTasks(finalTasks);
        localStorage.saveTasks(finalTasks);
      }
    }
    
    return newTask;
  }, [tasks]);
  
  const updateTask = useCallback((updatedTask: Task) => {
    const timestamp = new Date().toISOString();
    const taskWithTimestamp = {
      ...updatedTask,
      updatedAt: timestamp,
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? taskWithTimestamp : task
    );
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
    
  }, [tasks]);
  
  const deleteTask = useCallback((taskId: string) => {
    // Store the task for potential undo
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      setDeletedTasks(prev => [...prev, {
        task: taskToDelete,
        timestamp: Date.now()
      }]);
      
      // Also store in long-term deleted tasks storage
      localStorage.addDeletedTask(taskToDelete);
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
        
        setTasks(prev => prev.map(t => 
          t.id === updatedParent.id ? updatedParent : t
        ));
      }
    }
    
    // Delete all subtasks recursively
    const deleteSubtasksRecursively = (parentId: string) => {
      const subtaskIds = tasks
        .filter(t => t.parentTaskId === parentId)
        .map(t => t.id);
      
      subtaskIds.forEach(id => {
        // Store subtasks in deleted tasks as well
        const subtask = tasks.find(t => t.id === id);
        if (subtask) {
          localStorage.addDeletedTask(subtask);
        }
        deleteSubtasksRecursively(id);
      });
      
      setTasks(prev => prev.filter(t => t.id !== parentId && t.parentTaskId !== parentId));
    };
    
    deleteSubtasksRecursively(taskId);
    
    // Delete the task itself
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const undoDelete = useCallback(() => {
    if (deletedTasks.length === 0) return;
    
    const lastDeleted = deletedTasks[deletedTasks.length - 1];
    const updatedTasks = [...tasks, lastDeleted.task];
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
    
    setDeletedTasks(prev => prev.slice(0, -1));
  }, [tasks, deletedTasks]);
  
  const hasRecentlyDeleted = deletedTasks.length > 0;
  
  const completeTask = useCallback((taskId: string) => {
    const timestamp = new Date().toISOString();
    const taskToUpdate = tasks.find(t => t.id === taskId);
    
    if (!taskToUpdate) return;
    
    const updatedTask = {
      ...taskToUpdate,
      completed: !taskToUpdate.completed,
      updatedAt: timestamp,
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? updatedTask : task
    );
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const archiveCompletedTasks = useCallback(() => {
    const timestamp = new Date().toISOString();
    
    // Find all completed tasks and set them as archived
    const updatedTasks = tasks.map(task => {
      if (task.completed && !task.archived) {
        return {
          ...task,
          archived: true,
          updatedAt: timestamp,
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  // Projects
  const addProject = useCallback((projectData: Partial<Project>): Project => {
    const timestamp = new Date().toISOString();
    const newProject: Project = {
      id: generateId(),
      name: '',
      description: '',
      color: '#3B82F6', // Default blue color
      createdAt: timestamp,
      updatedAt: timestamp,
      ...projectData,
    };
    
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.saveProjects(updatedProjects);
    return newProject;
  }, [projects]);
  
  const updateProject = useCallback((updatedProject: Project) => {
    const timestamp = new Date().toISOString();
    const projectWithTimestamp = {
      ...updatedProject,
      updatedAt: timestamp,
    };
    
    const updatedProjects = projects.map(project => 
      project.id === updatedProject.id ? projectWithTimestamp : project
    );
    
    setProjects(updatedProjects);
    localStorage.saveProjects(updatedProjects);
  }, [projects]);
  
  const deleteProject = useCallback((projectId: string) => {
    // Remove project from tasks
    const updatedTasks = tasks.map(task => {
      if (task.projectId === projectId) {
        return {
          ...task,
          projectId: null,
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
    
    // Delete project
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    localStorage.saveProjects(updatedProjects);
  }, [projects, tasks]);
  
  // Categories
  const addCategory = useCallback((categoryData: Partial<Category>): Category => {
    const timestamp = new Date().toISOString();
    const newCategory: Category = {
      id: generateId(),
      name: '',
      color: '#3B82F6', // Default blue color
      createdAt: timestamp,
      updatedAt: timestamp,
      ...categoryData,
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    localStorage.saveCategories(updatedCategories);
    return newCategory;
  }, [categories]);
  
  const updateCategory = useCallback((updatedCategory: Category) => {
    const timestamp = new Date().toISOString();
    const categoryWithTimestamp = {
      ...updatedCategory,
      updatedAt: timestamp,
    };
    
    const updatedCategories = categories.map(category => 
      category.id === updatedCategory.id ? categoryWithTimestamp : category
    );
    
    setCategories(updatedCategories);
    localStorage.saveCategories(updatedCategories);
  }, [categories]);
  
  const deleteCategory = useCallback((categoryId: string) => {
    // Remove category from tasks
    const updatedTasks = tasks.map(task => {
      if (task.categoryIds?.includes(categoryId) || false) {
        return {
          ...task,
          categoryIds: task.categoryIds.filter(id => id !== categoryId),
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
    
    // Delete category
    const updatedCategories = categories.filter(category => category.id !== categoryId);
    setCategories(updatedCategories);
    localStorage.saveCategories(updatedCategories);
  }, [categories, tasks]);
  
  // Daily Plans
  const getDailyPlan = useCallback((date: string): DailyPlan | null => {
    try {
      if (!dailyPlans || !Array.isArray(dailyPlans)) {
        return null;
      }
      
      const plan = dailyPlans.find(plan => plan && plan.date === date);
      
      // Debug logging
      if (!plan) {
      } else {
      }
      
      return plan || null;
    } catch (error) {
      return null;
    }
  }, [dailyPlans]);
  
  const saveDailyPlan = useCallback((plan: DailyPlan) => {
    try {
      if (!dailyPlans || !Array.isArray(dailyPlans)) {
        const newPlans = [plan];
        setDailyPlans(newPlans);
        localStorage.saveDailyPlans(newPlans);
        return;
      }
      
      const existingIndex = dailyPlans.findIndex(p => p && p.date === plan.date);
      let updatedPlans: DailyPlan[];
      
      if (existingIndex !== -1) {
        updatedPlans = [
          ...dailyPlans.slice(0, existingIndex),
          plan,
          ...dailyPlans.slice(existingIndex + 1),
        ];
      } else {
        updatedPlans = [...dailyPlans, plan];
      }
      
      setDailyPlans(updatedPlans);
      
      try {
        localStorage.saveDailyPlans(updatedPlans);
      } catch (storageError) {
      }
    } catch (error) {
      // Try a more direct approach if the complex logic fails
      try {
        const simplePlans = [plan];
        setDailyPlans(prev => {
          const existing = prev.find(p => p.date === plan.date);
          return existing 
            ? prev.map(p => p.date === plan.date ? plan : p)
            : [...prev, plan];
        });
        localStorage.saveDailyPlans(simplePlans);
      } catch (fallbackError) {
      }
    }
  }, [dailyPlans]);
  
  // Function to make time blocks show up in calendar view
  const exportTimeBlocksToTasks = useCallback((date: string): number => {
    try {
      // Get the daily plan for the specified date
      const plan = getDailyPlan(date);
      if (!plan || !plan.timeBlocks || !Array.isArray(plan.timeBlocks) || plan.timeBlocks.length === 0) {
        return 0; // No time blocks to export
      }

      let exportedCount = 0;

      // Count time blocks for reporting purposes
      plan.timeBlocks.forEach(block => {
        try {
          // Skip empty blocks with no title
          if (!block || !block.title || block.title === 'New Time Block') {
            return;
          }

          exportedCount++;
        } catch (blockError) {
          // Continue with other blocks
        }
      });

      
      // Instead of creating tasks, we simply update the UI to show that blocks were exported
      // The calendar view already reads from the dailyPlans data structure directly
      return exportedCount;
    } catch (error) {
      return 0;
    }
  }, [getDailyPlan]);
  
  // Work Schedule
  const workShifts = workSchedule?.shifts || [];
  
  const addWorkShift = useCallback((date: string, shiftType: ShiftType = 'full'): WorkShift => {
    const shiftDefaults = DEFAULT_SHIFTS[shiftType];
    const newShift: WorkShift = {
      id: generateId(),
      date,
      startTime: shiftDefaults.startTime,
      endTime: shiftDefaults.endTime,
      shiftType: shiftDefaults.shiftType,
    };
    
    localStorage.addWorkShift(newShift);
    
    // Update local state
    setWorkSchedule(prev => {
      if (!prev) {
        return {
          id: generateId(),
          name: 'My Work Schedule',
          shifts: [newShift],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      return {
        ...prev,
        shifts: [...prev.shifts, newShift],
        updatedAt: new Date().toISOString()
      };
    });
    
    return newShift;
  }, []);
  
  const updateWorkShift = useCallback((updatedShift: WorkShift) => {
    localStorage.updateWorkShift(updatedShift);
    
    // Update local state
    setWorkSchedule(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === updatedShift.id ? updatedShift : shift
        ),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);
  
  const deleteWorkShift = useCallback((shiftId: string) => {
    localStorage.deleteWorkShift(shiftId);
    
    // Update local state
    setWorkSchedule(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        shifts: prev.shifts.filter(shift => shift.id !== shiftId),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);
  
  const getShiftsForMonth = useCallback((year: number, month: number): WorkShift[] => {
    if (!workSchedule) return [];
    
    // Create date range for the given month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return workSchedule.shifts.filter(shift => 
      shift.date >= startDate && shift.date <= endDate
    );
  }, [workSchedule]);
  
  const getShiftForDate = useCallback((date: string): WorkShift | undefined => {
    return workSchedule?.shifts.find(shift => shift.date === date);
  }, [workSchedule]);
  
  // What Now Wizard
  const recommendTasks = useCallback((criteria: WhatNowCriteria): Task[] => {
    return recommendTasksUtil(tasks, criteria);
  }, [tasks]);

  
  // Data Management
  const exportData = useCallback((): string => {
    return localStorage.exportData();
  }, []);
  
  const importData = useCallback((jsonData: string): boolean => {
    const result = localStorage.importData(jsonData);
    if (result) {
      // Reload data
      setTasks(localStorage.getTasks());
      setProjects(localStorage.getProjects());
      setCategories(localStorage.getCategories());
      setDailyPlans(localStorage.getDailyPlans());
      setIsDataInitialized(true);
    }
    return result;
  }, []);
  
  const resetData = useCallback(() => {
    localStorage.resetData();
    setTasks([]);
    setProjects([]);
    setCategories([]);
    setDailyPlans([]);
    setIsDataInitialized(false);
  }, []);
  
  const initializeSampleData = useCallback(() => {
    createSampleData();
    setTasks(localStorage.getTasks());
    setProjects(localStorage.getProjects());
    setCategories(localStorage.getCategories());
    setIsDataInitialized(true);
  }, []);
  
  // Create a subtask directly linked to a parent task
  const addSubtask = useCallback((parentId: string, subtaskData: Partial<Task>): Task => {
    // Make sure the parent exists
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }
    
    // Create the subtask with parent reference
    const newSubtask = addTask({
      ...subtaskData,
      parentTaskId: parentId,
      // Inherit project from parent if not specified
      projectId: subtaskData.projectId !== undefined ? subtaskData.projectId : parentTask.projectId
    });
    
    return newSubtask;
  }, [tasks, addTask]);

  // Simple task creation with smart text parsing
  const quickAddTask = useCallback((title: string, projectId: string | null = null): Task => {
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

  // Journal Entries
  const addJournalEntry = useCallback((entryData: Partial<JournalEntry>): JournalEntry => {
    try {
      const timestamp = new Date().toISOString();
      const date = new Date();
      
      // Calculate week number
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
      
      const updatedEntries = [...journalEntries, newEntry];
      setJournalEntries(updatedEntries);
      localStorage.saveJournalEntries(updatedEntries);
      
      return newEntry;
    } catch (error) {
      throw error;
    }
  }, [journalEntries]);
  
  const updateJournalEntry = useCallback((updatedEntry: JournalEntry) => {
    try {
      const updatedEntryWithTimestamp = {
        ...updatedEntry,
        updatedAt: new Date().toISOString()
      };
      
      const updatedEntries = journalEntries.map(entry => 
        entry.id === updatedEntry.id ? updatedEntryWithTimestamp : entry
      );
      
      setJournalEntries(updatedEntries);
      localStorage.saveJournalEntries(updatedEntries);
    } catch (error) {
    }
  }, [journalEntries]);
  
  const deleteJournalEntry = useCallback((entryId: string) => {
    try {
      const updatedEntries = journalEntries.filter(entry => entry.id !== entryId);
      setJournalEntries(updatedEntries);
      localStorage.saveJournalEntries(updatedEntries);
    } catch (error) {
    }
  }, [journalEntries]);
  
  const getJournalEntryById = useCallback((entryId: string): JournalEntry | null => {
    return journalEntries.find(entry => entry.id === entryId) || null;
  }, [journalEntries]);
  
  const getJournalEntriesForWeek = useCallback((weekNumber: number, weekYear: number): JournalEntry[] => {
    return journalEntries.filter(entry => 
      entry.weekNumber === weekNumber && entry.weekYear === weekYear
    );
  }, [journalEntries]);

  // Bulk Operations
  const bulkDeleteTasks = useCallback((taskIds: string[]) => {
    // Store tasks for potential undo
    const tasksToDelete = tasks.filter(t => taskIds.includes(t.id));
    tasksToDelete.forEach(task => {
      setDeletedTasks(prev => [...prev, {
        task,
        timestamp: Date.now()
      }]);
      // Also store in long-term deleted tasks storage
      localStorage.addDeletedTask(task);
    });
    
    // Also store subtasks that will be deleted
    const subtasksToDelete = tasks.filter(task => 
      task.parentTaskId && taskIds.includes(task.parentTaskId)
    );
    subtasksToDelete.forEach(subtask => {
      localStorage.addDeletedTask(subtask);
    });
    
    // Remove tasks and their subtasks
    const remainingTasks = tasks.filter(task => {
      // If task is in the deletion list, remove it
      if (taskIds.includes(task.id)) return false;
      
      // If task's parent is in the deletion list, remove it too
      if (task.parentTaskId && taskIds.includes(task.parentTaskId)) return false;
      
      return true;
    });
    
    setTasks(remainingTasks);
    localStorage.saveTasks(remainingTasks);
  }, [tasks]);
  
  const bulkCompleteTasks = useCallback((taskIds: string[]) => {
    const timestamp = new Date().toISOString();
    
    const updatedTasks = tasks.map(task => {
      if (taskIds.includes(task.id)) {
        return {
          ...task,
          completed: true,
          updatedAt: timestamp
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const bulkMoveTasks = useCallback((taskIds: string[], projectId: string | null) => {
    const timestamp = new Date().toISOString();
    
    const updatedTasks = tasks.map(task => {
      if (taskIds.includes(task.id)) {
        return {
          ...task,
          projectId,
          updatedAt: timestamp
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const bulkArchiveTasks = useCallback((taskIds: string[]) => {
    const timestamp = new Date().toISOString();
    
    const updatedTasks = tasks.map(task => {
      if (taskIds.includes(task.id)) {
        return {
          ...task,
          archived: true,
          updatedAt: timestamp
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);

  const bulkAddTasks = useCallback((newTasks: Partial<Task>[]) => {
    const timestamp = new Date().toISOString();

    // Ensure every task has an ID
    const tasksWithIds = newTasks.map(task => ({
      ...task,
      id: task.id || generateId(),
    }));

    // Add timestamp to all new tasks
    const tasksWithTimestamp = tasksWithIds.map(task => ({
      ...task,
      createdAt: task.createdAt || timestamp,
      updatedAt: task.updatedAt || timestamp,
    }));
    
    // Merge with existing tasks
    const allTasks = [...tasks, ...tasksWithTimestamp];

    // Update parent tasks to include new subtask IDs
    const updatedTasks = allTasks.map(task => {
      // Check if this task is a parent of any new subtasks
      const subtaskIds = tasksWithIds
        .filter(newTask => newTask.parentTaskId === task.id)
        .map(subtask => subtask.id);
      
      if (subtaskIds.length > 0) {
        return {
          ...task,
          subtasks: [...task.subtasks, ...subtaskIds],
          updatedAt: timestamp,
        };
      }
      
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);

  const bulkConvertToSubtasks = useCallback((taskIds: string[], parentTaskId: string) => {
    const timestamp = new Date().toISOString();
    
    // Find the parent task
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask) {
      return;
    }
    
    // Update all tasks
    const updatedTasks = tasks.map(task => {
      if (taskIds.includes(task.id)) {
        // Convert to subtask
        return {
          ...task,
          parentTaskId: parentTaskId,
          projectId: parentTask.projectId, // Inherit project from parent
          updatedAt: timestamp
        };
      } else if (task.id === parentTaskId) {
        // Update parent to include new subtasks
        const newSubtaskIds = taskIds.filter(id => !task.subtasks.includes(id));
        return {
          ...task,
          subtasks: [...task.subtasks, ...newSubtaskIds],
          updatedAt: timestamp
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const bulkAssignCategories = useCallback((taskIds: string[], categoryIds: string[], mode: 'add' | 'replace') => {
    const timestamp = new Date().toISOString();
    
    const updatedTasks = tasks.map(task => {
      if (taskIds.includes(task.id)) {
        let newCategoryIds: string[];
        
        if (mode === 'replace') {
          // Replace all existing categories
          newCategoryIds = categoryIds;
        } else {
          // Add to existing categories (avoiding duplicates)
          const existingIds = task.categoryIds || [];
          const uniqueNewIds = categoryIds.filter(id => !existingIds.includes(id));
          newCategoryIds = [...existingIds, ...uniqueNewIds];
        }
        
        return {
          ...task,
          categoryIds: newCategoryIds,
          updatedAt: timestamp
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);

  // Dependency management functions
  const addTaskDependency = useCallback((taskId: string, dependsOnId: string) => {
    const timestamp = new Date().toISOString();
    
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Add dependency to the task
        return {
          ...task,
          dependsOn: task.dependsOn ? [...task.dependsOn, dependsOnId] : [dependsOnId],
          updatedAt: timestamp
        };
      } else if (task.id === dependsOnId) {
        // Add reverse dependency
        return {
          ...task,
          dependedOnBy: task.dependedOnBy ? [...task.dependedOnBy, taskId] : [taskId],
          updatedAt: timestamp
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const removeTaskDependency = useCallback((taskId: string, dependsOnId: string) => {
    const timestamp = new Date().toISOString();
    
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Remove dependency from the task
        return {
          ...task,
          dependsOn: task.dependsOn?.filter(id => id !== dependsOnId) || [],
          updatedAt: timestamp
        };
      } else if (task.id === dependsOnId) {
        // Remove reverse dependency
        return {
          ...task,
          dependedOnBy: task.dependedOnBy?.filter(id => id !== taskId) || [],
          updatedAt: timestamp
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
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
    // Can complete if all dependencies are completed
    return dependencies.every(dep => dep.completed);
  }, [getTaskDependencies]);

  // Weekly Review Date functions
  const getLastWeeklyReviewDate = useCallback((): string | null => {
    return localStorage.getLastWeeklyReviewDate();
  }, []);
  
  const updateLastWeeklyReviewDate = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setLastWeeklyReviewDate(today);
  }, []);
  
  const needsWeeklyReview = useCallback((): boolean => {
    return localStorage.needsWeeklyReview();
  }, []);


  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
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
    setSettings(updated);
    localStorage.saveSettings(updated);
  }, [settings]);

  const contextValue: AppContextType = {
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
    
    // Bulk operations
    bulkAddTasks,
    bulkDeleteTasks,
    bulkCompleteTasks,
    bulkMoveTasks,
    bulkArchiveTasks,
    bulkConvertToSubtasks,
    bulkAssignCategories,
    
    // Dependencies
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
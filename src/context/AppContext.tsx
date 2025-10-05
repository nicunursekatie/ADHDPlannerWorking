import React, { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  Task,
  Project,
  Category,
  DailyPlan,
  WhatNowCriteria,
  JournalEntry,
  AppSettings,
} from '../types';
import {
  WorkSchedule,
  WorkShift,
  ShiftType,
  DEFAULT_SHIFTS,
} from '../types/WorkSchedule';
import * as storage from '../utils/localStorage';
import {
  generateId,
  createSampleData,
  recommendTasks as recommendTasksUtil,
} from '../utils/helpers';
import {
  formatDateString,
  extractDateFromText,
} from '../utils/dateUtils';

export interface AppContextType {
  // Entities
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  dailyPlans: DailyPlan[];
  workSchedule: WorkSchedule | null;
  workShifts: WorkShift[];
  journalEntries: JournalEntry[];
  settings: AppSettings;

  // State flags
  isLoading: boolean;
  isDataInitialized: boolean;

  // Task operations
  addTask: (task: Partial<Task>) => Task;
  quickAddTask: (title: string, projectId?: string | null) => Task;
  addSubtask: (parentId: string, subtaskData: Partial<Task>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  recommendTasks: (criteria: WhatNowCriteria) => Task[];

  // Project operations
  addProject: (project: Partial<Project>) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;

  // Category operations
  addCategory: (category: Partial<Category>) => Category;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  // Daily plan operations
  getDailyPlan: (date: string) => DailyPlan | null;
  saveDailyPlan: (plan: DailyPlan) => void;
  exportTimeBlocksToTasks: (date: string) => number;

  // Work schedule operations
  addWorkShift: (date: string, shiftType?: ShiftType) => WorkShift;
  updateWorkShift: (shift: WorkShift) => void;
  deleteWorkShift: (shiftId: string) => void;
  getShiftsForMonth: (year: number, month: number) => WorkShift[];
  getShiftForDate: (date: string) => WorkShift | undefined;

  // Journal operations
  addJournalEntry: (entry: Partial<JournalEntry>) => JournalEntry;
  updateJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (entryId: string) => void;
  getJournalEntryById: (entryId: string) => JournalEntry | null;
  getJournalEntriesForWeek: (weekNumber: number, weekYear: number) => JournalEntry[];

  // Weekly review
  getLastWeeklyReviewDate: () => string | null;
  updateLastWeeklyReviewDate: (dateString?: string) => void;
  needsWeeklyReview: () => boolean;

  // Data & settings
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  resetData: () => void;
  initializeSampleData: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  timeManagement: {
    defaultBufferTime: 15,
    timeBlindnessAlerts: false,
    timeBlindnessInterval: 60,
    autoAdjustEstimates: false,
    gettingReadyTime: 30,
  },
  visual: {
    fontSize: 'medium',
    layoutDensity: 'comfortable',
    reduceAnimations: false,
    highContrast: false,
    customPriorityColors: {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981',
    },
  },
};

const buildTask = (taskData: Partial<Task>): Task => {
  const now = new Date().toISOString();
  return {
    id: taskData.id ?? generateId(),
    title: taskData.title?.trim() ?? 'Untitled Task',
    description: taskData.description ?? '',
    completed: taskData.completed ?? false,
    archived: taskData.archived ?? false,
    dueDate: taskData.dueDate ?? null,
    startDate: taskData.startDate ?? null,
    projectId: taskData.projectId ?? null,
    categoryIds: taskData.categoryIds ?? [],
    parentTaskId: taskData.parentTaskId ?? null,
    priority: taskData.priority,
    energyLevel: taskData.energyLevel,
    size: taskData.size,
    estimatedMinutes: taskData.estimatedMinutes,
    phase: taskData.phase,
    tags: taskData.tags ?? [],
    urgency: taskData.urgency,
    importance: taskData.importance,
    emotionalWeight: taskData.emotionalWeight,
    energyRequired: taskData.energyRequired,
    smartPriorityScore: taskData.smartPriorityScore,
    createdAt: taskData.createdAt ?? now,
    updatedAt: now,
    completedAt: taskData.completedAt ?? null,
    actualMinutesSpent: taskData.actualMinutesSpent ?? null,
    recurringTaskId: taskData.recurringTaskId ?? null,
    isRecurring: taskData.isRecurring,
    recurrencePattern: taskData.recurrencePattern,
    recurrenceInterval: taskData.recurrenceInterval,
    projectPhase: taskData.projectPhase,
    phaseOrder: taskData.phaseOrder,
    deletedAt: taskData.deletedAt ?? null,
    showSubtasks: taskData.showSubtasks ?? false,
    braindumpSource: taskData.braindumpSource,
    aiProcessed: taskData.aiProcessed ?? false,
    subtasks: taskData.subtasks ?? [],
    dependsOn: taskData.dependsOn ?? [],
    dependedOnBy: taskData.dependedOnBy ?? [],
  };
};

const buildProject = (projectData: Partial<Project>): Project => {
  const now = new Date().toISOString();
  return {
    id: projectData.id ?? generateId(),
    name: projectData.name?.trim() ?? 'Untitled Project',
    description: projectData.description ?? '',
    color: projectData.color ?? '#6366f1',
    order: projectData.order,
    completed: projectData.completed ?? false,
    completedAt: projectData.completedAt ?? null,
    archived: projectData.archived ?? false,
    archivedAt: projectData.archivedAt ?? null,
    createdAt: projectData.createdAt ?? now,
    updatedAt: now,
  };
};

const buildCategory = (categoryData: Partial<Category>): Category => {
  const now = new Date().toISOString();
  return {
    id: categoryData.id ?? generateId(),
    name: categoryData.name?.trim() ?? 'Untitled Category',
    color: categoryData.color ?? '#6366f1',
    createdAt: categoryData.createdAt ?? now,
    updatedAt: now,
  };
};

const buildJournalEntry = (entryData: Partial<JournalEntry>): JournalEntry => {
  const now = new Date().toISOString();
  return {
    id: entryData.id ?? generateId(),
    date: entryData.date ?? now,
    title: entryData.title ?? '',
    content: entryData.content ?? '',
    section: entryData.section,
    prompt: entryData.prompt,
    promptIndex: entryData.promptIndex,
    mood: entryData.mood,
    weekNumber: entryData.weekNumber ?? 0,
    weekYear: entryData.weekYear ?? new Date().getFullYear(),
    tags: entryData.tags ?? [],
    createdAt: entryData.createdAt ?? now,
    updatedAt: now,
  };
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  const loadStateFromStorage = useCallback(() => {
    try {
      const loadedTasks = storage.getTasks();
      const loadedProjects = storage.getProjects();
      const loadedCategories = storage.getCategories();
      const loadedPlans = storage.getDailyPlans();
      const loadedWorkSchedule = storage.getWorkSchedule();
      const loadedJournalEntries = storage.getJournalEntries();
      const loadedSettings = storage.getSettings();

      setTasks(loadedTasks);
      setProjects(loadedProjects);
      setCategories(loadedCategories);
      setDailyPlans(loadedPlans);
      setWorkSchedule(loadedWorkSchedule);
      setJournalEntries(loadedJournalEntries);
      if (loadedSettings) {
        setSettings(loadedSettings);
      }

      const hasData =
        loadedTasks.length > 0 ||
        loadedProjects.length > 0 ||
        loadedCategories.length > 0;

      setIsDataInitialized(hasData);
    } catch (error) {
      setTasks([]);
      setProjects([]);
      setCategories([]);
      setDailyPlans([]);
      setWorkSchedule(null);
      setJournalEntries([]);
      setIsDataInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  const persistTasks = useCallback((updater: (current: Task[]) => Task[]) => {
    setTasks(prev => {
      const next = updater(prev);
      storage.saveTasks(next);
      return next;
    });
  }, []);

  const persistProjects = useCallback((updater: (current: Project[]) => Project[]) => {
    setProjects(prev => {
      const next = updater(prev);
      storage.saveProjects(next);
      return next;
    });
  }, []);

  const persistCategories = useCallback((updater: (current: Category[]) => Category[]) => {
    setCategories(prev => {
      const next = updater(prev);
      storage.saveCategories(next);
      return next;
    });
  }, []);

  const persistDailyPlans = useCallback((updater: (current: DailyPlan[]) => DailyPlan[]) => {
    setDailyPlans(prev => {
      const next = updater(prev);
      storage.saveDailyPlans(next);
      return next;
    });
  }, []);

  const persistJournalEntries = useCallback((updater: (current: JournalEntry[]) => JournalEntry[]) => {
    setJournalEntries(prev => {
      const next = updater(prev);
      storage.saveJournalEntries(next);
      return next;
    });
  }, []);

  const addTask = useCallback((taskData: Partial<Task>): Task => {
    const newTask = buildTask(taskData);
    persistTasks(current => [...current, newTask]);
    return newTask;
  }, [persistTasks]);

  const quickAddTask = useCallback((title: string, projectId: string | null = null): Task => {
    let processedTitle = title.trim();
    let dueDate: string | null = null;
    let priority: Task['priority'] = 'medium';

    const { cleanedText, date } = extractDateFromText(processedTitle);
    if (date) {
      processedTitle = cleanedText.trim();
      dueDate = formatDateString(date);
    }

    if (processedTitle.includes('!high')) {
      priority = 'high';
      processedTitle = processedTitle.replace('!high', '').trim();
    } else if (processedTitle.includes('!low')) {
      priority = 'low';
      processedTitle = processedTitle.replace('!low', '').trim();
    } else if (processedTitle.includes('!urgent')) {
      priority = 'urgent';
      processedTitle = processedTitle.replace('!urgent', '').trim();
    }

    return addTask({
      title: processedTitle,
      dueDate,
      priority,
      projectId,
      completed: false,
    });
  }, [addTask]);

  const addSubtask = useCallback((parentId: string, subtaskData: Partial<Task>): Task => {
    const parentTask = tasks.find(task => task.id === parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }

    return addTask({
      ...subtaskData,
      parentTaskId: parentId,
      projectId: subtaskData.projectId ?? parentTask.projectId ?? null,
    });
  }, [addTask, tasks]);

  const updateTask = useCallback((task: Task) => {
    const updatedTask: Task = { ...task, updatedAt: new Date().toISOString() };
    persistTasks(current => current.map(existing => existing.id === updatedTask.id ? updatedTask : existing));
  }, [persistTasks]);

  const deleteTask = useCallback((taskId: string) => {
    persistTasks(current => current.filter(task => task.id !== taskId));
  }, [persistTasks]);

  const completeTask = useCallback((taskId: string) => {
    const completedAt = new Date().toISOString();
    persistTasks(current => current.map(task =>
      task.id === taskId
        ? { ...task, completed: true, completedAt, updatedAt: completedAt }
        : task
    ));
  }, [persistTasks]);

  const recommendTasks = useCallback((criteria: WhatNowCriteria) => {
    return recommendTasksUtil(tasks, criteria);
  }, [tasks]);

  const addProject = useCallback((projectData: Partial<Project>): Project => {
    const newProject = buildProject(projectData);
    persistProjects(current => [...current, newProject]);
    return newProject;
  }, [persistProjects]);

  const updateProject = useCallback((project: Project) => {
    const updatedProject: Project = { ...project, updatedAt: new Date().toISOString() };
    persistProjects(current => current.map(existing => existing.id === updatedProject.id ? updatedProject : existing));
  }, [persistProjects]);

  const deleteProject = useCallback((projectId: string) => {
    persistProjects(current => current.filter(project => project.id !== projectId));
    persistTasks(current => current.map(task =>
      task.projectId === projectId ? { ...task, projectId: null } : task
    ));
  }, [persistProjects, persistTasks]);

  const addCategory = useCallback((categoryData: Partial<Category>): Category => {
    const newCategory = buildCategory(categoryData);
    persistCategories(current => [...current, newCategory]);
    return newCategory;
  }, [persistCategories]);

  const updateCategory = useCallback((category: Category) => {
    const updatedCategory: Category = { ...category, updatedAt: new Date().toISOString() };
    persistCategories(current => current.map(existing => existing.id === updatedCategory.id ? updatedCategory : existing));
  }, [persistCategories]);

  const deleteCategory = useCallback((categoryId: string) => {
    persistCategories(current => current.filter(category => category.id !== categoryId));
    persistTasks(current => current.map(task =>
      task.categoryIds.includes(categoryId)
        ? { ...task, categoryIds: task.categoryIds.filter(id => id !== categoryId) }
        : task
    ));
  }, [persistCategories, persistTasks]);

  useEffect(() => {
    if (tasks.length > 0 || projects.length > 0 || categories.length > 0) {
      setIsDataInitialized(true);
    }
  }, [tasks, projects, categories]);

  const getDailyPlan = useCallback((date: string): DailyPlan | null => {
    return dailyPlans.find(plan => plan.date === date) ?? null;
  }, [dailyPlans]);

  const saveDailyPlan = useCallback((plan: DailyPlan) => {
    persistDailyPlans(current => {
      const index = current.findIndex(existing => existing.date === plan.date);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = plan;
        return updated;
      }
      return [...current, plan];
    });
  }, [persistDailyPlans]);

  const exportTimeBlocksToTasks = useCallback((date: string): number => {
    const plan = getDailyPlan(date);
    if (!plan?.timeBlocks?.length) {
      return 0;
    }

    let exportedCount = 0;
    plan.timeBlocks.forEach(block => {
      if (block && block.title && block.title !== 'New Time Block') {
        exportedCount += 1;
      }
    });

    return exportedCount;
  }, [getDailyPlan]);

  const addWorkShift = useCallback((date: string, shiftType: ShiftType = 'full'): WorkShift => {
    const defaults = DEFAULT_SHIFTS[shiftType] ?? DEFAULT_SHIFTS.full;
    const newShift: WorkShift = {
      id: generateId(),
      date,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
      shiftType: defaults.shiftType,
    };

    setWorkSchedule(prev => {
      const now = new Date().toISOString();
      const updatedSchedule: WorkSchedule = prev
        ? {
            ...prev,
            shifts: [...prev.shifts, newShift],
            updatedAt: now,
          }
        : {
            id: generateId(),
            name: 'My Work Schedule',
            shifts: [newShift],
            createdAt: now,
            updatedAt: now,
          };

      storage.saveWorkSchedule(updatedSchedule);
      return updatedSchedule;
    });

    return newShift;
  }, []);

  const updateWorkShift = useCallback((shift: WorkShift) => {
    setWorkSchedule(prev => {
      if (!prev) {
        return prev;
      }
      const now = new Date().toISOString();
      const updatedSchedule: WorkSchedule = {
        ...prev,
        shifts: prev.shifts.map(existing => existing.id === shift.id ? shift : existing),
        updatedAt: now,
      };
      storage.saveWorkSchedule(updatedSchedule);
      return updatedSchedule;
    });
  }, []);

  const deleteWorkShift = useCallback((shiftId: string) => {
    setWorkSchedule(prev => {
      if (!prev) {
        return prev;
      }
      const now = new Date().toISOString();
      const updatedSchedule: WorkSchedule = {
        ...prev,
        shifts: prev.shifts.filter(shift => shift.id !== shiftId),
        updatedAt: now,
      };
      storage.saveWorkSchedule(updatedSchedule);
      return updatedSchedule;
    });
  }, []);

  const getShiftsForMonth = useCallback((year: number, month: number) => {
    return storage.getShiftsForMonth(year, month);
  }, []);

  const getShiftForDate = useCallback((date: string) => {
    return workSchedule?.shifts.find(shift => shift.date === date);
  }, [workSchedule]);

  const addJournalEntry = useCallback((entryData: Partial<JournalEntry>): JournalEntry => {
    const entry = buildJournalEntry(entryData);
    persistJournalEntries(current => [...current, entry]);
    return entry;
  }, [persistJournalEntries]);

  const updateJournalEntry = useCallback((entry: JournalEntry) => {
    const updated = { ...entry, updatedAt: new Date().toISOString() };
    persistJournalEntries(current => current.map(existing => existing.id === updated.id ? updated : existing));
  }, [persistJournalEntries]);

  const deleteJournalEntry = useCallback((entryId: string) => {
    persistJournalEntries(current => current.filter(entry => entry.id !== entryId));
  }, [persistJournalEntries]);

  const getJournalEntryById = useCallback((entryId: string) => {
    return journalEntries.find(entry => entry.id === entryId) ?? null;
  }, [journalEntries]);

  const getJournalEntriesForWeek = useCallback((weekNumber: number, weekYear: number) => {
    return journalEntries.filter(entry => entry.weekNumber === weekNumber && entry.weekYear === weekYear);
  }, [journalEntries]);

  const getLastWeeklyReviewDate = useCallback(() => {
    return storage.getLastWeeklyReviewDate();
  }, []);

  const updateLastWeeklyReviewDate = useCallback((dateString?: string) => {
    const dateToSave = dateString ?? new Date().toISOString().split('T')[0];
    storage.setLastWeeklyReviewDate(dateToSave);
  }, []);

  const needsWeeklyReview = useCallback(() => {
    return storage.needsWeeklyReview();
  }, []);

  const exportData = useCallback(() => storage.exportData(), []);

  const importData = useCallback((jsonData: string) => {
    const success = storage.importData(jsonData);
    if (success) {
      loadStateFromStorage();
    }
    return success;
  }, [loadStateFromStorage]);

  const resetData = useCallback(() => {
    storage.resetData();
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  const initializeSampleData = useCallback(() => {
    createSampleData();
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings: AppSettings = {
        ...prevSettings,
        ...newSettings,
        timeManagement: {
          ...prevSettings.timeManagement,
          ...(newSettings.timeManagement ?? {}),
        },
        visual: {
          ...prevSettings.visual,
          ...(newSettings.visual ?? {}),
          customPriorityColors: {
            ...prevSettings.visual.customPriorityColors,
            ...(newSettings.visual?.customPriorityColors ?? {}),
          },
        },
      };

      storage.saveSettings(updatedSettings);
      return updatedSettings;
    });
  }, []);

  const workShifts = useMemo(() => workSchedule?.shifts ?? [], [workSchedule]);

  const contextValue: AppContextType = {
    tasks,
    projects,
    categories,
    dailyPlans,
    workSchedule,
    workShifts,
    journalEntries,
    settings,
    isLoading,
    isDataInitialized,
    addTask,
    quickAddTask,
    addSubtask,
    updateTask,
    deleteTask,
    completeTask,
    recommendTasks,
    addProject,
    updateProject,
    deleteProject,
    addCategory,
    updateCategory,
    deleteCategory,
    getDailyPlan,
    saveDailyPlan,
    exportTimeBlocksToTasks,
    addWorkShift,
    updateWorkShift,
    deleteWorkShift,
    getShiftsForMonth,
    getShiftForDate,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalEntryById,
    getJournalEntriesForWeek,
    getLastWeeklyReviewDate,
    updateLastWeeklyReviewDate,
    needsWeeklyReview,
    exportData,
    importData,
    resetData,
    initializeSampleData,
    updateSettings,
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

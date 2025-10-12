import React, { createContext, useCallback, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
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
  // Auth parity with Supabase context (local app treats user as null)
  user: null;
  signOut: () => Promise<void>;

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
  addTask: (task: Partial<Task>) => Promise<Task>;
  quickAddTask: (title: string, projectId?: string | null) => Promise<Task>;
  addSubtask: (parentId: string, subtaskData: Partial<Task>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  archiveCompletedTasks: () => Promise<void>;
  archiveProjectCompletedTasks: (projectId: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  hasRecentlyDeleted: boolean;
  bulkAddTasks: (tasks: Partial<Task>[]) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  bulkCompleteTasks: (taskIds: string[]) => Promise<void>;
  bulkMoveTasks: (taskIds: string[], projectId: string | null) => Promise<void>;
  bulkArchiveTasks: (taskIds: string[]) => Promise<void>;
  bulkConvertToSubtasks: (taskIds: string[], parentTaskId: string) => Promise<void>;
  bulkAssignCategories: (taskIds: string[], categoryIds: string[], mode: 'add' | 'replace') => Promise<void>;
  addTaskDependency: (taskId: string, dependsOnId: string) => Promise<void>;
  removeTaskDependency: (taskId: string, dependsOnId: string) => Promise<void>;
  getTaskDependencies: (taskId: string) => Task[];
  getDependentTasks: (taskId: string) => Task[];
  canCompleteTask: (taskId: string) => boolean;
  recommendTasks: (criteria: WhatNowCriteria) => Task[];

  // Project operations
  addProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  completeProject: (projectId: string) => Promise<Project | null>;
  archiveProject: (projectId: string) => Promise<Project | null>;
  reorderProjects: (projectIds: string[]) => Promise<void>;

  // Category operations
  addCategory: (category: Partial<Category>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Daily plan operations
  getDailyPlan: (date: string) => DailyPlan | null;
  saveDailyPlan: (plan: DailyPlan) => Promise<void>;
  exportTimeBlocksToTasks: (date: string) => number;

  // Work schedule operations
  addWorkShift: (date: string, shiftType?: ShiftType) => Promise<WorkShift>;
  updateWorkShift: (shift: WorkShift) => Promise<void>;
  deleteWorkShift: (shiftId: string) => Promise<void>;
  getShiftsForMonth: (year: number, month: number) => WorkShift[];
  getShiftForDate: (date: string) => WorkShift | undefined;

  // Journal operations
  addJournalEntry: (entry: Partial<JournalEntry>) => Promise<JournalEntry>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (entryId: string) => Promise<void>;
  getJournalEntryById: (entryId: string) => JournalEntry | null;
  getJournalEntriesForWeek: (weekNumber: number, weekYear: number) => JournalEntry[];

  // Weekly review
  getLastWeeklyReviewDate: () => string | null;
  updateLastWeeklyReviewDate: (dateString?: string) => Promise<void>;
  needsWeeklyReview: () => boolean;

  // Data & settings
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
  resetData: () => Promise<void>;
  initializeSampleData: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Direct state helpers
  setTasks: (tasks: Task[]) => void;
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

const UNDO_WINDOW = 5000;

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
  const [hasRecentlyDeleted, setHasRecentlyDeleted] = useState(false);

  const undoStackRef = useRef<Task[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

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

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const scheduleUndoReset = useCallback(() => {
    clearUndoTimer();
    undoTimerRef.current = setTimeout(() => {
      undoStackRef.current = [];
      setHasRecentlyDeleted(false);
    }, UNDO_WINDOW);
  }, [clearUndoTimer]);

  const addTask = useCallback(async (taskData: Partial<Task>): Promise<Task> => {
    const newTask = buildTask(taskData);
    persistTasks(current => [...current, newTask]);
    return newTask;
  }, [persistTasks]);

  const quickAddTask = useCallback(async (title: string, projectId: string | null = null): Promise<Task> => {
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

  const addSubtask = useCallback(async (parentId: string, subtaskData: Partial<Task>): Promise<Task> => {
    const parentTask = tasks.find(task => task.id === parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }

    const newSubtask = await addTask({
      ...subtaskData,
      parentTaskId: parentId,
      projectId: subtaskData.projectId ?? parentTask.projectId ?? null,
    });

    // Ensure parent tracks subtask relationship
    persistTasks(current => current.map(task => {
      if (task.id === parentId) {
        const existingSubtasks = task.subtasks ?? [];
        if (!existingSubtasks.includes(newSubtask.id)) {
          return {
            ...task,
            subtasks: [...existingSubtasks, newSubtask.id],
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return task;
    }));

    return newSubtask;
  }, [addTask, persistTasks, tasks]);

  const updateTask = useCallback(async (task: Task): Promise<void> => {
    const updatedTask: Task = { ...task, updatedAt: new Date().toISOString() };
    persistTasks(current => current.map(existing => existing.id === updatedTask.id ? updatedTask : existing));
  }, [persistTasks]);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    let deletedTask: Task | undefined;
    persistTasks(current => {
      const remaining: Task[] = [];
      current.forEach(task => {
        if (task.id === taskId) {
          deletedTask = task;
        } else {
          remaining.push(task);
        }
      });
      return remaining;
    });

    if (deletedTask) {
      storage.addDeletedTask(deletedTask);
      undoStackRef.current = [deletedTask, ...undoStackRef.current];
      setHasRecentlyDeleted(true);
      scheduleUndoReset();
    }
  }, [persistTasks, scheduleUndoReset]);

  const completeTask = useCallback(async (taskId: string): Promise<void> => {
    const completedAt = new Date().toISOString();
    persistTasks(current => current.map(task =>
      task.id === taskId
        ? { ...task, completed: true, completedAt, updatedAt: completedAt }
        : task
    ));
  }, [persistTasks]);

  const archiveCompletedTasks = useCallback(async (): Promise<void> => {
    const archivedAt = new Date().toISOString();
    persistTasks(current => current.map(task =>
      task.completed && !task.archived
        ? { ...task, archived: true, updatedAt: archivedAt }
        : task
    ));
  }, [persistTasks]);

  const archiveProjectCompletedTasks = useCallback(async (projectId: string): Promise<void> => {
    const archivedAt = new Date().toISOString();
    persistTasks(current => current.map(task =>
      task.projectId === projectId && task.completed && !task.archived
        ? { ...task, archived: true, updatedAt: archivedAt }
        : task
    ));
  }, [persistTasks]);

  const undoDelete = useCallback(async (): Promise<void> => {
    const [lastDeleted, ...remaining] = undoStackRef.current;
    if (!lastDeleted) {
      return;
    }

    undoStackRef.current = remaining;
    persistTasks(current => [lastDeleted, ...current]);

    const deletedTasks = storage.getDeletedTasks();
    const filtered = deletedTasks.filter(dt => dt.task.id !== lastDeleted.id);
    storage.saveDeletedTasks(filtered);

    if (remaining.length === 0) {
      setHasRecentlyDeleted(false);
      clearUndoTimer();
    }
  }, [clearUndoTimer, persistTasks]);

  const bulkAddTasks = useCallback(async (tasksToAdd: Partial<Task>[]): Promise<void> => {
    if (!tasksToAdd.length) return;
    const builtTasks = tasksToAdd.map(buildTask);
    persistTasks(current => [...current, ...builtTasks]);
  }, [persistTasks]);

  const bulkDeleteTasks = useCallback(async (taskIds: string[]): Promise<void> => {
    if (taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    const removedTasks: Task[] = [];
    persistTasks(current => {
      const remaining: Task[] = [];
      current.forEach(task => {
        if (idSet.has(task.id)) {
          removedTasks.push(task);
        } else {
          remaining.push(task);
        }
      });
      return remaining;
    });

    if (removedTasks.length > 0) {
      removedTasks.forEach(task => storage.addDeletedTask(task));
      undoStackRef.current = [...removedTasks, ...undoStackRef.current];
      setHasRecentlyDeleted(true);
      scheduleUndoReset();
    }
  }, [persistTasks, scheduleUndoReset]);

  const bulkCompleteTasks = useCallback(async (taskIds: string[]): Promise<void> => {
    if (taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    const completedAt = new Date().toISOString();
    persistTasks(current => current.map(task =>
      idSet.has(task.id)
        ? { ...task, completed: true, completedAt, updatedAt: completedAt }
        : task
    ));
  }, [persistTasks]);

  const bulkMoveTasks = useCallback(async (taskIds: string[], projectId: string | null): Promise<void> => {
    if (taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    persistTasks(current => current.map(task =>
      idSet.has(task.id)
        ? { ...task, projectId, updatedAt: new Date().toISOString() }
        : task
    ));
  }, [persistTasks]);

  const bulkArchiveTasks = useCallback(async (taskIds: string[]): Promise<void> => {
    if (taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    const archivedAt = new Date().toISOString();
    persistTasks(current => current.map(task =>
      idSet.has(task.id)
        ? { ...task, archived: true, updatedAt: archivedAt }
        : task
    ));
  }, [persistTasks]);

  const bulkConvertToSubtasks = useCallback(async (taskIds: string[], parentTaskId: string): Promise<void> => {
    if (taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    persistTasks(current => {
      const updatedTasks = current.map(task => {
        if (idSet.has(task.id)) {
          return {
            ...task,
            parentTaskId,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });

      return updatedTasks.map(task => {
        if (task.id === parentTaskId) {
          const existingSubtasks = task.subtasks ?? [];
          const newSubtasks = Array.from(new Set([...existingSubtasks, ...taskIds]));
          return { ...task, subtasks: newSubtasks, updatedAt: new Date().toISOString() };
        }
        return task;
      });
    });
  }, [persistTasks]);

  const bulkAssignCategories = useCallback(async (taskIds: string[], categoryIds: string[], mode: 'add' | 'replace'): Promise<void> => {
    if (taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    const categoriesToApply = Array.from(new Set(categoryIds));
    persistTasks(current => current.map(task => {
      if (!idSet.has(task.id)) {
        return task;
      }

      const existing = task.categoryIds ?? [];
      const updatedCategories = mode === 'replace'
        ? categoriesToApply
        : Array.from(new Set([...existing, ...categoriesToApply]));

      return {
        ...task,
        categoryIds: updatedCategories,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [persistTasks]);

  const addTaskDependency = useCallback(async (taskId: string, dependsOnId: string): Promise<void> => {
    persistTasks(current => current.map(task => {
      if (task.id === taskId) {
        const dependsOn = task.dependsOn ?? [];
        if (!dependsOn.includes(dependsOnId)) {
          return {
            ...task,
            dependsOn: [...dependsOn, dependsOnId],
            updatedAt: new Date().toISOString(),
          };
        }
      }

      if (task.id === dependsOnId) {
        const dependedOnBy = task.dependedOnBy ?? [];
        if (!dependedOnBy.includes(taskId)) {
          return {
            ...task,
            dependedOnBy: [...dependedOnBy, taskId],
            updatedAt: new Date().toISOString(),
          };
        }
      }

      return task;
    }));
  }, [persistTasks]);

  const removeTaskDependency = useCallback(async (taskId: string, dependsOnId: string): Promise<void> => {
    persistTasks(current => current.map(task => {
      if (task.id === taskId && task.dependsOn?.includes(dependsOnId)) {
        return {
          ...task,
          dependsOn: task.dependsOn.filter(id => id !== dependsOnId),
          updatedAt: new Date().toISOString(),
        };
      }

      if (task.id === dependsOnId && task.dependedOnBy?.includes(taskId)) {
        return {
          ...task,
          dependedOnBy: task.dependedOnBy.filter(id => id !== taskId),
          updatedAt: new Date().toISOString(),
        };
      }

      return task;
    }));
  }, [persistTasks]);

  const getTaskDependencies = useCallback((taskId: string): Task[] => {
    const task = tasks.find(t => t.id === taskId);
    if (!task?.dependsOn?.length) {
      return [];
    }
    const idSet = new Set(task.dependsOn);
    return tasks.filter(t => idSet.has(t.id));
  }, [tasks]);

  const getDependentTasks = useCallback((taskId: string): Task[] => {
    return tasks.filter(task => task.dependsOn?.includes(taskId));
  }, [tasks]);

  const canCompleteTask = useCallback((taskId: string): boolean => {
    const dependencies = getTaskDependencies(taskId);
    return dependencies.every(task => task.completed);
  }, [getTaskDependencies]);

  const recommendTasks = useCallback((criteria: WhatNowCriteria) => {
    return recommendTasksUtil(tasks, criteria);
  }, [tasks]);

  const addProject = useCallback(async (projectData: Partial<Project>): Promise<Project> => {
    const newProject = buildProject(projectData);
    persistProjects(current => [...current, newProject]);
    return newProject;
  }, [persistProjects]);

  const updateProject = useCallback(async (project: Project): Promise<void> => {
    const updatedProject: Project = { ...project, updatedAt: new Date().toISOString() };
    persistProjects(current => current.map(existing => existing.id === updatedProject.id ? updatedProject : existing));
  }, [persistProjects]);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    persistProjects(current => current.filter(project => project.id !== projectId));
    persistTasks(current => current.map(task =>
      task.projectId === projectId ? { ...task, projectId: null } : task
    ));
  }, [persistProjects, persistTasks]);

  const completeProject = useCallback(async (projectId: string): Promise<Project | null> => {
    let completedProject: Project | null = null;
    const completedAt = new Date().toISOString();
    persistProjects(current => current.map(project => {
      if (project.id === projectId) {
        completedProject = { ...project, completed: true, completedAt, updatedAt: completedAt };
        return completedProject;
      }
      return project;
    }));
    return completedProject;
  }, [persistProjects]);

  const archiveProject = useCallback(async (projectId: string): Promise<Project | null> => {
    let archivedProject: Project | null = null;
    const archivedAt = new Date().toISOString();
    persistProjects(current => current.map(project => {
      if (project.id === projectId) {
        archivedProject = { ...project, archived: true, archivedAt, updatedAt: archivedAt };
        return archivedProject;
      }
      return project;
    }));
    return archivedProject;
  }, [persistProjects]);

  const reorderProjects = useCallback(async (projectIds: string[]): Promise<void> => {
    const orderMap = new Map(projectIds.map((id, index) => [id, index]));
    persistProjects(current => current.map(project =>
      orderMap.has(project.id)
        ? { ...project, order: orderMap.get(project.id), updatedAt: new Date().toISOString() }
        : project
    ));
  }, [persistProjects]);

  const addCategory = useCallback(async (categoryData: Partial<Category>): Promise<Category> => {
    const newCategory = buildCategory(categoryData);
    persistCategories(current => [...current, newCategory]);
    return newCategory;
  }, [persistCategories]);

  const updateCategory = useCallback(async (category: Category): Promise<void> => {
    const updatedCategory: Category = { ...category, updatedAt: new Date().toISOString() };
    persistCategories(current => current.map(existing => existing.id === updatedCategory.id ? updatedCategory : existing));
  }, [persistCategories]);

  const deleteCategory = useCallback(async (categoryId: string): Promise<void> => {
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

  const saveDailyPlan = useCallback(async (plan: DailyPlan): Promise<void> => {
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

  const addWorkShift = useCallback(async (date: string, shiftType: ShiftType = 'full'): Promise<WorkShift> => {
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

  const updateWorkShift = useCallback(async (shift: WorkShift): Promise<void> => {
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

  const deleteWorkShift = useCallback(async (shiftId: string): Promise<void> => {
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

  const addJournalEntry = useCallback(async (entryData: Partial<JournalEntry>): Promise<JournalEntry> => {
    const entry = buildJournalEntry(entryData);
    persistJournalEntries(current => [...current, entry]);
    return entry;
  }, [persistJournalEntries]);

  const updateJournalEntry = useCallback(async (entry: JournalEntry): Promise<void> => {
    const updated = { ...entry, updatedAt: new Date().toISOString() };
    persistJournalEntries(current => current.map(existing => existing.id === updated.id ? updated : existing));
  }, [persistJournalEntries]);

  const deleteJournalEntry = useCallback(async (entryId: string): Promise<void> => {
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

  const updateLastWeeklyReviewDate = useCallback(async (dateString?: string): Promise<void> => {
    const dateToSave = dateString ?? new Date().toISOString().split('T')[0];
    storage.setLastWeeklyReviewDate(dateToSave);
  }, []);

  const needsWeeklyReview = useCallback(() => {
    return storage.needsWeeklyReview();
  }, []);

  const exportData = useCallback(() => storage.exportData(), []);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    const success = storage.importData(jsonData);
    if (success) {
      loadStateFromStorage();
    }
    return success;
  }, [loadStateFromStorage]);

  const resetData = useCallback(async (): Promise<void> => {
    storage.resetData();
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  const initializeSampleData = useCallback(async (): Promise<void> => {
    createSampleData();
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>): Promise<void> => {
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

  const setTasksState = useCallback((nextTasks: Task[]) => {
    persistTasks(() => nextTasks);
  }, [persistTasks]);

  const workShifts = useMemo(() => workSchedule?.shifts ?? [], [workSchedule]);

  const signOut = useCallback(async () => {
    // Local app has no auth; resolve immediately for API parity
  }, []);

  const contextValue: AppContextType = {
    user: null,
    signOut,
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
    archiveCompletedTasks,
    archiveProjectCompletedTasks,
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
    recommendTasks,
    addProject,
    updateProject,
    deleteProject,
    completeProject,
    archiveProject,
    reorderProjects,
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
    setTasks: setTasksState,
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

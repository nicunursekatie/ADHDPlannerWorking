export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  archived: boolean;
  dueDate: string | null;
  projectId: string | null;
  categoryIds: string[];
  parentTaskId: string | null;
  priority?: 'low' | 'medium' | 'high';
  energyLevel?: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
  estimatedMinutes?: number;
  phase?: string; // Project phase this task belongs to
  tags?: string[]; // Tags associated with the task, including phase name
  
  // Multi-dimensional prioritization fields
  urgency?: 'today' | 'tomorrow' | 'week' | 'month' | 'someday'; // Time sensitivity
  importance?: number; // 1-5: How critical to goals (5 = life-changing, 1 = nice-to-have)
  emotionalWeight?: 'easy' | 'neutral' | 'stressful' | 'dreading'; // Emotional difficulty
  energyRequired?: 'low' | 'medium' | 'high'; // Physical/mental effort needed
  smartPriorityScore?: number; // Calculated composite score
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  recurringTaskId?: string | null;
  
  // Runtime computed fields (not stored in DB)
  subtasks?: string[]; // IDs of subtasks - computed from parent-child relationships
  dependsOn?: string[]; // IDs of tasks this task depends on - computed from dependencies table
  dependedOnBy?: string[]; // IDs of tasks that depend on this task - computed from dependencies table
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  timeBlocks: TimeBlock[];
}

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  taskId: string | null; // Kept for backward compatibility
  taskIds: string[]; // New field to support multiple tasks
  title: string;
  description: string;
}

export interface WhatNowCriteria {
  availableTime: 'short' | 'medium' | 'long';
  energyLevel: 'low' | 'medium' | 'high';
  blockers: string[];
}

export type ViewMode = 'day' | 'week' | 'month';

export type TaskSortMode = 
  | 'whatnow' // Matches current energy to task requirements
  | 'eatthefrog' // High emotional weight tasks when energy is high
  | 'quickwins' // Low time + low emotional weight for momentum
  | 'deadline' // Pure urgency-based
  | 'energymatch' // Only shows tasks matching current energy level
  | 'priority' // Traditional priority sorting
  | 'smart'; // Smart priority score based

// Project breakdown structures
export interface ProjectPhase {
  id: string;
  title: string;
  description?: string;
  expanded: boolean;
  tasks: PhaseTask[];
}

export interface PhaseTask {
  id: string;
  title: string;
  description?: string;
}

// Journal entries for the weekly review system
export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  section?: 'reflect' | 'overdue' | 'upcoming' | 'projects' | 'life-areas'; // Section of the weekly review
  prompt?: string; // The specific prompt this entry is responding to
  promptIndex?: number; // Index of the prompt in the section
  mood?: 'great' | 'good' | 'neutral' | 'challenging' | 'difficult';
  weekNumber: number;
  weekYear: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}


// Settings types
export interface AppSettings {
  // Time Management Settings
  timeManagement: {
    defaultBufferTime: number; // minutes between tasks
    timeBlindnessAlerts: boolean;
    timeBlindnessInterval: number; // minutes between alerts
    autoAdjustEstimates: boolean;
    gettingReadyTime: number; // minutes to add before appointments
  };
  
  // Visual Preferences
  visual: {
    fontSize: 'small' | 'medium' | 'large';
    layoutDensity: 'compact' | 'comfortable' | 'spacious';
    reduceAnimations: boolean;
    highContrast: boolean;
    customPriorityColors: {
      high: string;
      medium: string;
      low: string;
    };
  };
}

// Re-export WorkSchedule types
export * from './WorkSchedule';
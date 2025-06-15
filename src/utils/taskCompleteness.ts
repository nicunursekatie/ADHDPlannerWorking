import { Task } from '../types';

export interface TaskCompleteness {
  isComplete: boolean;
  missingFields: string[];
  completenessScore: number;
  hasCriticalFields: boolean;
}

export const analyzeTaskCompleteness = (task: Task): TaskCompleteness => {
  const missingFields: string[] = [];
  let score = 0;
  const totalFields = 7;
  
  // Due date is now optional, but we still track it
  if (!task.dueDate) {
    missingFields.push('dueDate');
  } else {
    score += 1;
  }
  
  // Critical field - must have priority
  if (!task.priority) {
    missingFields.push('priority');
  } else {
    score += 1;
  }
  
  // Important fields
  if (!task.description || task.description.length < 10) {
    missingFields.push('description');
  } else {
    score += 1;
  }
  
  if (!task.estimatedMinutes || task.estimatedMinutes <= 0) {
    missingFields.push('estimatedTime');
  } else {
    score += 1;
  }
  
  if (!task.energyLevel) {
    missingFields.push('energy');
  } else {
    score += 1;
  }
  
  // Nice to have fields
  if (!task.projectId) {
    missingFields.push('project');
  } else {
    score += 1;
  }
  
  if (!task.categoryIds || task.categoryIds.length === 0) {
    missingFields.push('categories');
  } else {
    score += 1;
  }
  
  // Only priority is truly critical now
  const hasCriticalFields = !!task.priority;
  const completenessScore = (score / totalFields) * 100;
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completenessScore,
    hasCriticalFields,
  };
};

export const getIncompleteTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => {
    if (task.completed || task.archived) return false;
    const analysis = analyzeTaskCompleteness(task);
    return !analysis.isComplete;
  });
};
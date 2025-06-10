import { Task } from '../types';

export type SortMode = 
  | 'smart' // Smart priority score based (default)
  | 'energymatch' // Only shows tasks matching current energy level
  | 'quickwins' // Low time + low emotional weight for momentum
  | 'eatthefrog' // High emotional weight tasks when energy is high
  | 'deadline' // Pure urgency-based
  | 'priority'; // Traditional priority sorting

export type EnergyLevel = 'low' | 'medium' | 'high';

// Convert enum values to numeric scores for calculations
const urgencyScore = (urgency?: string): number => {
  switch (urgency) {
    case 'today': return 4;
    case 'week': return 3;
    case 'month': return 2;
    case 'someday': return 1;
    default: return 2; // Default to "month"
  }
};

const priorityScore = (priority?: string): number => {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2; // Default to medium
  }
};

const emotionalWeightScore = (emotionalWeight?: string): number => {
  switch (emotionalWeight) {
    case 'easy': return 1;
    case 'neutral': return 2;
    case 'stressful': return 3;
    case 'dreading': return 4;
    default: return 2; // Default to neutral
  }
};

const energyRequiredScore = (energyRequired?: string): number => {
  switch (energyRequired) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 2; // Default to medium
  }
};

// Check if task is overdue or due today
const getTimeModifier = (task: Task): number => {
  if (!task.dueDate) return 0;
  
  const today = new Date();
  const dueDate = new Date(task.dueDate);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 10; // Overdue
  if (diffDays === 0) return 5; // Due today
  return 0;
};

// Calculate smart priority score
export const calculateSmartPriorityScore = (task: Task): number => {
  const urgency = urgencyScore(task.urgency);
  const priority = priorityScore(task.priority);
  const emotionalWeight = emotionalWeightScore(task.emotionalWeight);
  const energyRequired = energyRequiredScore(task.energyRequired);
  
  // Base formula: (urgency * 3) + (priority * 2) + (5 - emotionalWeight) + (5 - energyRequired)
  // Higher urgency = higher score
  // Higher priority = higher score  
  // Lower emotional weight = higher score (easier to start)
  // Lower energy needed = higher score
  let score = (urgency * 3) + (priority * 2) + (5 - emotionalWeight) + (5 - energyRequired);
  
  // Add time-based modifiers
  score += getTimeModifier(task);
  
  // Quick win bonus: estimated time < 15 min
  if (task.estimatedMinutes && task.estimatedMinutes < 15) {
    score += 2;
  }
  
  return score;
};

// Sort tasks based on the selected mode
export const sortTasks = (tasks: Task[], mode: SortMode, currentEnergy?: EnergyLevel): Task[] => {
  let filteredTasks = [...tasks].filter(t => !t.completed && !t.archived);
  
  switch (mode) {
    case 'smart':
      // Smart sorting using calculated priority score
      return filteredTasks
        .map(task => ({ 
          ...task, 
          smartPriorityScore: calculateSmartPriorityScore(task) 
        }))
        .sort((a, b) => (b.smartPriorityScore || 0) - (a.smartPriorityScore || 0));
    
    case 'energymatch':
      // Only show tasks matching or below current energy
      if (currentEnergy) {
        const energyLevels = ['low', 'medium', 'high'];
        const currentEnergyIndex = energyLevels.indexOf(currentEnergy);
        filteredTasks = filteredTasks.filter(task => {
          const taskEnergyIndex = energyLevels.indexOf(task.energyRequired || 'medium');
          return taskEnergyIndex <= currentEnergyIndex;
        });
      }
      // Within matches, sort by emotional weight (easiest first)
      return filteredTasks.sort((a, b) => {
        const aEmotional = emotionalWeightScore(a.emotionalWeight);
        const bEmotional = emotionalWeightScore(b.emotionalWeight);
        return aEmotional - bEmotional;
      });
    
    case 'quickwins':
      // Filter: estimated time ≤ 30 min AND emotional weight ≤ neutral
      filteredTasks = filteredTasks.filter(task => {
        const timeOk = !task.estimatedMinutes || task.estimatedMinutes <= 30;
        const emotionalOk = emotionalWeightScore(task.emotionalWeight) <= 2;
        return timeOk && emotionalOk;
      });
      // Sort by time (shortest first)
      return filteredTasks.sort((a, b) => {
        const aTime = a.estimatedMinutes || 30;
        const bTime = b.estimatedMinutes || 30;
        return aTime - bTime;
      });
    
    case 'eatthefrog':
      // Only shows: emotional weight ≥ stressful OR priority = High
      filteredTasks = filteredTasks.filter(task => {
        const isStressful = emotionalWeightScore(task.emotionalWeight) >= 3;
        const isHighPriority = task.priority === 'high';
        return isStressful || isHighPriority;
      });
      // Sort by urgency
      return filteredTasks.sort((a, b) => {
        const aUrgency = urgencyScore(a.urgency);
        const bUrgency = urgencyScore(b.urgency);
        return bUrgency - aUrgency;
      });
    
    case 'deadline':
      // Sort purely by urgency and due date
      return filteredTasks.sort((a, b) => {
        const aUrgency = urgencyScore(a.urgency);
        const bUrgency = urgencyScore(b.urgency);
        
        if (aUrgency !== bUrgency) {
          return bUrgency - aUrgency;
        }
        
        // If same urgency, sort by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
    
    case 'priority':
      // Traditional priority sorting
      return filteredTasks.sort((a, b) => {
        const aPriority = priorityScore(a.priority);
        const bPriority = priorityScore(b.priority);
        return bPriority - aPriority;
      });
    
    default:
      return filteredTasks;
  }
};

// Get filtered task counts for UI chips
export const getFilteredCounts = (tasks: Task[], currentEnergy?: EnergyLevel) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return {
    quickWins: tasks.filter(task => {
      const timeOk = !task.estimatedMinutes || task.estimatedMinutes <= 30;
      const emotionalOk = emotionalWeightScore(task.emotionalWeight) <= 2;
      return timeOk && emotionalOk;
    }).length,
    
    dueToday: tasks.filter(task => 
      task.dueDate === todayStr || task.urgency === 'today'
    ).length,
    
    highEnergy: tasks.filter(task => 
      task.energyRequired === 'high'
    ).length,
    
    energyMatch: currentEnergy ? tasks.filter(task => {
      const energyLevels = ['low', 'medium', 'high'];
      const currentEnergyIndex = energyLevels.indexOf(currentEnergy);
      const taskEnergyIndex = energyLevels.indexOf(task.energyRequired || 'medium');
      return taskEnergyIndex <= currentEnergyIndex;
    }).length : 0,
  };
};

// Generate reasoning for top task recommendations
export const getTaskRecommendationReason = (task: Task, mode: SortMode, currentEnergy?: EnergyLevel): string[] => {
  const reasons: string[] = [];
  
  // Check urgency
  if (task.urgency === 'today') {
    reasons.push('🔥 Due today');
  } else if (task.urgency === 'week') {
    reasons.push('📅 Due this week');
  }
  
  // Check emotional weight
  if (task.emotionalWeight === 'easy') {
    reasons.push('😊 Low emotional weight');
  } else if (task.emotionalWeight === 'dreading') {
    reasons.push('😱 High emotional impact - tackle when energized');
  }
  
  // Check energy match
  if (currentEnergy && task.energyRequired) {
    const energyLevels = ['low', 'medium', 'high'];
    const currentIndex = energyLevels.indexOf(currentEnergy);
    const taskIndex = energyLevels.indexOf(task.energyRequired);
    
    if (taskIndex <= currentIndex) {
      reasons.push('🔋 Matches your current energy');
    } else {
      reasons.push('⚡ Requires more energy than you have');
    }
  }
  
  // Check time
  if (task.estimatedMinutes && task.estimatedMinutes <= 15) {
    reasons.push('⚡ Quick win (under 15 min)');
  }
  
  // Check if overdue
  if (task.dueDate) {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    if (dueDate < today) {
      reasons.push('⏰ Overdue');
    }
  }
  
  return reasons;
};

// Get sort mode display name and description
export const getSortModeInfo = (mode: SortMode) => {
  switch (mode) {
    case 'smart':
      return {
        name: 'Smart Sort',
        description: 'Best all-around ordering based on urgency, priority, and emotional factors'
      };
    case 'energymatch':
      return {
        name: 'Energy Match',
        description: 'Only shows tasks matching your current energy level'
      };
    case 'quickwins':
      return {
        name: 'Quick Wins',
        description: 'Short, low-stress tasks perfect for building momentum'
      };
    case 'eatthefrog':
      return {
        name: 'Eat the Frog',
        description: 'Tackle the hardest, most important tasks when you have energy'
      };
    case 'deadline':
      return {
        name: 'Deadline Focus',
        description: 'Sorted purely by urgency and due dates'
      };
    case 'priority':
      return {
        name: 'Priority',
        description: 'Traditional high/medium/low priority sorting'
      };
    default:
      return {
        name: 'Default',
        description: 'Standard task ordering'
      };
  }
};

// Get emoji indicators for UI
export const getUrgencyEmoji = (urgency?: string): string => {
  switch (urgency) {
    case 'today': return '🔥';
    case 'week': return '📅';
    case 'month': return '📌';
    case 'someday': return '🌊';
    default: return '📌';
  }
};

export const getEmotionalWeightEmoji = (weight?: string): string => {
  switch (weight) {
    case 'easy': return '😊';
    case 'neutral': return '😐';
    case 'stressful': return '😰';
    case 'dreading': return '😱';
    default: return '😐';
  }
};

export const getEnergyRequiredEmoji = (energy?: string): string => {
  switch (energy) {
    case 'low': return '🔋';
    case 'medium': return '🔋🔋';
    case 'high': return '🔋🔋🔋';
    default: return '🔋🔋';
  }
};
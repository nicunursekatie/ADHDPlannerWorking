import { Task } from '../types';

export interface TimeContext {
  currentTime: Date;
  dayProgress: number; // 0-1
  hoursRemaining: number;
  productiveHoursRemaining: number;
  isUsingNextDay?: boolean;
  timeUntilSunset?: number;
  nextDeadline?: {
    task: Task;
    minutesUntil: number;
    urgency: 'safe' | 'warning' | 'urgent' | 'critical';
  };
}

export interface TaskTimeEstimate {
  taskId: string;
  estimatedMinutes: number;
  percentOfDayRemaining: number;
  finishTime: Date;
  urgency: 'safe' | 'warning' | 'urgent';
}

export const getTimeContext = (tasks: Task[]): TimeContext => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(8, 0, 0, 0); // Assume productive day starts at 8 AM
  
  const endOfDay = new Date(now);
  
  // Handle late night schedule: 8 AM to 2 AM next day
  if (now.getHours() >= 0 && now.getHours() < 8) {
    // It's early morning (12 AM - 8 AM), so we're still in yesterday's productive period
    endOfDay.setHours(2, 0, 0, 0); // End at 2 AM today
    startOfDay.setDate(startOfDay.getDate() - 1); // Start was yesterday at 8 AM
    startOfDay.setHours(8, 0, 0, 0);
  } else {
    // Normal day or evening (8 AM - 11:59 PM), productive day ends at 2 AM tomorrow
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(2, 0, 0, 0);
  }
  
  const totalDayMinutes = 18 * 60; // 8 AM to 2 AM (18 hours)
  const minutesSinceStart = Math.max(0, (now.getTime() - startOfDay.getTime()) / (1000 * 60));
  const dayProgress = Math.min(1, minutesSinceStart / totalDayMinutes);
  
  const hoursRemaining = Math.max(0, (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  // If we're near the end of the day (less than 2 hours left), roll over to next day's time
  let effectiveHoursRemaining = hoursRemaining;
  let isUsingNextDay = false;
  
  if (hoursRemaining < 2) {
    // Calculate next day's full productive time (18 hours total - 3 hours for breaks = 15 hours)
    effectiveHoursRemaining = 15; // Full next day productive time
    isUsingNextDay = true;
  }
  
  // Account for meals, breaks, and transitions (remove ~3 hours from productive time for longer day)
  // But don't subtract more than we have - minimum of 1 hour if we have any time left
  const productiveHoursRemaining = !isUsingNextDay && effectiveHoursRemaining > 3 
    ? effectiveHoursRemaining - 3 
    : isUsingNextDay 
      ? effectiveHoursRemaining // Already accounted for breaks in next day calculation
      : Math.max(0, effectiveHoursRemaining * 0.7); // Use 70% of remaining time if less than 3 hours left
  
  // Debug logging removed for performance
  
  // Find next deadline
  const upcomingTasks = tasks
    .filter(task => task.dueDate && !task.completed)
    .map(task => {
      const dueDate = new Date(task.dueDate!);
      const minutesUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60);
      
      let urgency: 'safe' | 'warning' | 'urgent' | 'critical' = 'safe';
      if (minutesUntil < 15) urgency = 'critical';
      else if (minutesUntil < 60) urgency = 'urgent';
      else if (minutesUntil < 180) urgency = 'warning';
      
      return { task, minutesUntil, urgency };
    })
    .sort((a, b) => a.minutesUntil - b.minutesUntil);
  
  // Calculate sunset time (rough estimate - would use real API in production)
  const sunset = new Date();
  sunset.setHours(18, 30, 0, 0); // 6:30 PM estimate
  const timeUntilSunset = sunset.getTime() > now.getTime() 
    ? (sunset.getTime() - now.getTime()) / (1000 * 60) 
    : undefined;
  
  return {
    currentTime: now,
    dayProgress,
    hoursRemaining,
    productiveHoursRemaining,
    isUsingNextDay,
    timeUntilSunset,
    nextDeadline: upcomingTasks[0] || undefined
  };
};

export const formatTimeRemaining = (minutes: number): string => {
  const absMinutes = Math.abs(minutes);
  const isOverdue = minutes < 0;
  
  let timeString: string;
  if (absMinutes < 60) {
    timeString = `${Math.round(absMinutes)}min`;
  } else if (absMinutes < 1440) { // Less than 24 hours
    const hours = Math.floor(absMinutes / 60);
    const mins = Math.round(absMinutes % 60);
    timeString = mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  } else {
    const days = Math.floor(absMinutes / 1440);
    const hours = Math.floor((absMinutes % 1440) / 60);
    timeString = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  
  return isOverdue ? `${timeString} ago` : timeString;
};

export const getTaskTimeEstimate = (
  task: Task, 
  timeContext: TimeContext,
  defaultEstimateMinutes: number = 30
): TaskTimeEstimate => {
  // In a real app, this would use historical data
  const estimatedMinutes = task.estimatedMinutes || defaultEstimateMinutes;
  
  // Fix the percentage calculation - convert minutes to hours first
  const estimatedHours = estimatedMinutes / 60;
  
  // Handle edge cases where there's very little time left
  const percentOfDayRemaining = timeContext.productiveHoursRemaining > 0.1 
    ? estimatedHours / timeContext.productiveHoursRemaining 
    : estimatedHours > 0.1 ? 1 : 0; // If less than 6 minutes left in day, treat small tasks as feasible
  
  // Calculate finish time - if we're using next day's time, start from 8 AM tomorrow
  let finishTime: Date;
  const currentHour = timeContext.currentTime.getHours();
  const isLateNight = currentHour >= 0 && currentHour < 2; // Between midnight and 2 AM
  const isNearEndOfDay = timeContext.productiveHoursRemaining === 15; // Using next day's time
  
  if (isNearEndOfDay && !isLateNight) {
    // We're using next day calculations, so task starts at 8 AM tomorrow
    const nextDay = new Date(timeContext.currentTime);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0);
    finishTime = new Date(nextDay.getTime() + estimatedMinutes * 60 * 1000);
  } else {
    // Normal calculation - task starts now
    finishTime = new Date(timeContext.currentTime.getTime() + estimatedMinutes * 60 * 1000);
  }
  
  let urgency: 'safe' | 'warning' | 'urgent' = 'safe';
  if (percentOfDayRemaining > 0.8) urgency = 'urgent';
  else if (percentOfDayRemaining > 0.5) urgency = 'warning';
  
  // Debug logging removed for performance
  
  return {
    taskId: task.id,
    estimatedMinutes,
    percentOfDayRemaining: Math.min(percentOfDayRemaining, 1), // Cap at 100%
    finishTime,
    urgency
  };
};

export const formatTimeOfDay = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'critical': return 'text-red-600 bg-red-100';
    case 'urgent': return 'text-orange-600 bg-orange-100';
    case 'warning': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-green-600 bg-green-100';
  }
};
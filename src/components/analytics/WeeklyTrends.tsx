import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  Clock,
  CheckCircle2,
  Target,
  Zap
} from 'lucide-react';
import { Task } from '../../types';
import Card from '../common/Card';

interface WeeklyTrendsProps {
  tasks: Task[];
}

export const WeeklyTrends: React.FC<WeeklyTrendsProps> = ({ tasks }) => {
  const calculateStreak = (tasks: Task[]): number => {
    const now = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const hasCompletedTask = tasks.some(task => {
        if (!task.completed) return false;
        const completedDate = new Date(task.updatedAt);
        return completedDate >= checkDate && completedDate < nextDate;
      });
      
      if (hasCompletedTask) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const trends = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // This week's tasks
    const thisWeekTasks = tasks.filter(task => {
      const createdDate = new Date(task.createdAt);
      return createdDate >= oneWeekAgo;
    });
    
    // Last week's tasks
    const lastWeekTasks = tasks.filter(task => {
      const createdDate = new Date(task.createdAt);
      return createdDate >= twoWeeksAgo && createdDate < oneWeekAgo;
    });
    
    // Completed tasks
    const thisWeekCompleted = thisWeekTasks.filter(t => t.completed).length;
    const lastWeekCompleted = lastWeekTasks.filter(t => t.completed).length;
    
    // Calculate completion rates
    const thisWeekRate = thisWeekTasks.length > 0 
      ? Math.round((thisWeekCompleted / thisWeekTasks.length) * 100) 
      : 0;
    const lastWeekRate = lastWeekTasks.length > 0 
      ? Math.round((lastWeekCompleted / lastWeekTasks.length) * 100) 
      : 0;
    
    // Calculate daily averages
    const dailyAvgThisWeek = Math.round(thisWeekCompleted / 7 * 10) / 10;
    const dailyAvgLastWeek = Math.round(lastWeekCompleted / 7 * 10) / 10;
    
    // Calculate time tracking
    const thisWeekTimeSpent = thisWeekTasks
      .filter(t => t.completed && t.actualMinutesSpent)
      .reduce((sum, t) => sum + (t.actualMinutesSpent || 0), 0);
    
    const lastWeekTimeSpent = lastWeekTasks
      .filter(t => t.completed && t.actualMinutesSpent)
      .reduce((sum, t) => sum + (t.actualMinutesSpent || 0), 0);
    
    // Daily breakdown for sparkline
    const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (6 - i));
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayTasks = tasks.filter(task => {
        if (!task.completed) return false;
        const completedDate = new Date(task.updatedAt);
        return completedDate >= dayStart && completedDate < dayEnd;
      });
      
      return dayTasks.length;
    });
    
    const maxDaily = Math.max(...dailyBreakdown, 1);
    
    return {
      thisWeekCompleted,
      lastWeekCompleted,
      thisWeekRate,
      lastWeekRate,
      dailyAvgThisWeek,
      dailyAvgLastWeek,
      thisWeekTimeSpent,
      lastWeekTimeSpent,
      dailyBreakdown,
      maxDaily,
      totalActive: tasks.filter(t => !t.completed).length,
      streak: calculateStreak(tasks)
    };
  }, [tasks]);
  
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-success-600 dark:text-success-400" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-danger-600 dark:text-danger-400" />;
    return <Minus className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  };
  
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Weekly Trends
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            Last 7 days
          </div>
        </div>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              {getTrendIcon(trends.thisWeekRate, trends.lastWeekRate)}
            </div>
            <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {trends.thisWeekRate}%
            </div>
            <div className="text-sm text-primary-600 dark:text-primary-400 mt-1">
              Completion Rate
            </div>
            <div className="text-xs text-primary-500 dark:text-primary-500 mt-1">
              {trends.lastWeekRate > 0 && (
                <span className={trends.thisWeekRate >= trends.lastWeekRate ? 'text-success-600' : 'text-danger-600'}>
                  {trends.thisWeekRate >= trends.lastWeekRate ? '+' : ''}
                  {trends.thisWeekRate - trends.lastWeekRate}% vs last week
                </span>
              )}
            </div>
          </div>
          
          {/* Tasks Completed */}
          <div className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/30 dark:to-success-800/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
              {getTrendIcon(trends.thisWeekCompleted, trends.lastWeekCompleted)}
            </div>
            <div className="text-2xl font-bold text-success-700 dark:text-success-300">
              {trends.thisWeekCompleted}
            </div>
            <div className="text-sm text-success-600 dark:text-success-400 mt-1">
              Tasks Completed
            </div>
            <div className="text-xs text-success-500 dark:text-success-500 mt-1">
              {trends.dailyAvgThisWeek} per day avg
            </div>
          </div>
          
          {/* Time Tracked */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {getTrendIcon(trends.thisWeekTimeSpent, trends.lastWeekTimeSpent)}
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatTime(trends.thisWeekTimeSpent)}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Time Tracked
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
              {trends.lastWeekTimeSpent > 0 && (
                <span className={trends.thisWeekTimeSpent >= trends.lastWeekTimeSpent ? 'text-success-600' : 'text-danger-600'}>
                  {trends.thisWeekTimeSpent >= trends.lastWeekTimeSpent ? '+' : ''}
                  {formatTime(Math.abs(trends.thisWeekTimeSpent - trends.lastWeekTimeSpent))}
                </span>
              )}
            </div>
          </div>
          
          {/* Current Streak */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              {trends.streak >= 3 && <span className="text-xs font-bold text-amber-600 dark:text-amber-400">🔥</span>}
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {trends.streak}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Day Streak
            </div>
            <div className="text-xs text-amber-500 dark:text-amber-500 mt-1">
              {trends.totalActive} active tasks
            </div>
          </div>
        </div>
        
        {/* Daily Activity Sparkline */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Activity</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">Last 7 days</span>
          </div>
          <div className="flex items-end justify-between gap-1 h-16">
            {trends.dailyBreakdown.map((count, index) => {
              const height = trends.maxDaily > 0 ? (count / trends.maxDaily) * 100 : 0;
              const isToday = index === 6;
              const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][
                new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).getDay()
              ];
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full flex items-end justify-center h-12">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isToday 
                          ? 'bg-gradient-to-t from-primary-500 to-primary-400' 
                          : 'bg-gradient-to-t from-gray-400 to-gray-300 dark:from-gray-600 dark:to-gray-500'
                      }`}
                      style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                    >
                      {count > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 dark:text-gray-300">
                          {count}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs ${isToday ? 'font-bold text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-500'}`}>
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
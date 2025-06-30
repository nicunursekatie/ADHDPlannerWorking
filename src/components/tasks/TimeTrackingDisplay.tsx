import React from 'react';
import { Clock, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TimeTrackingDisplayProps {
  estimatedMinutes?: number | null;
  actualMinutesSpent?: number | null;
  completedAt?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TimeTrackingDisplay: React.FC<TimeTrackingDisplayProps> = ({
  estimatedMinutes,
  actualMinutesSpent,
  completedAt,
  size = 'md',
  showLabel = true
}) => {
  if (!actualMinutesSpent && !estimatedMinutes) {
    return null;
  }

  const formatTime = (minutes: number | null | undefined) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPerformanceIndicator = () => {
    if (!estimatedMinutes || !actualMinutesSpent) return null;
    
    const ratio = actualMinutesSpent / estimatedMinutes;
    
    if (ratio < 0.8) {
      return {
        icon: TrendingDown,
        color: 'text-green-600 bg-green-50',
        label: 'Finished early',
        percentage: Math.round((1 - ratio) * 100)
      };
    } else if (ratio > 1.5) {
      return {
        icon: TrendingUp,
        color: 'text-red-600 bg-red-50',
        label: 'Took longer',
        percentage: Math.round((ratio - 1) * 100)
      };
    } else {
      return {
        icon: Target,
        color: 'text-blue-600 bg-blue-50',
        label: 'Close to estimate',
        percentage: null
      };
    }
  };

  const performance = getPerformanceIndicator();
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      {showLabel && (
        <Clock className={`${iconSizes[size]} text-gray-500`} />
      )}
      
      <div className="flex items-center gap-2">
        {estimatedMinutes && (
          <span className="text-gray-600">
            Est: {formatTime(estimatedMinutes)}
          </span>
        )}
        
        {estimatedMinutes && actualMinutesSpent && (
          <span className="text-gray-400">•</span>
        )}
        
        {actualMinutesSpent && (
          <span className="font-medium text-gray-900">
            Actual: {formatTime(actualMinutesSpent)}
          </span>
        )}
      </div>

      {performance && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${performance.color}`}>
          <performance.icon className={iconSizes[size]} />
          <span className="font-medium">
            {performance.label === 'Took longer' && performance.percentage
              ? `Took ${performance.percentage}% longer`
              : performance.label === 'Finished early' && performance.percentage
              ? `Finished ${performance.percentage}% early`
              : performance.label
            }
          </span>
        </div>
      )}
    </div>
  );
};

interface TimeTrackingStatsProps {
  tasks: Array<{
    estimatedMinutes?: number | null;
    actualMinutesSpent?: number | null;
    completed: boolean;
  }>;
}

export const TimeTrackingStats: React.FC<TimeTrackingStatsProps> = ({ tasks }) => {
  const completedTasksWithTime = tasks.filter(task => 
    task.completed && 
    task.estimatedMinutes && 
    task.actualMinutesSpent
  );

  if (completedTasksWithTime.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No time tracking data available yet
      </div>
    );
  }

  const totalEstimated = completedTasksWithTime.reduce((sum, task) => 
    sum + (task.estimatedMinutes || 0), 0
  );
  
  const totalActual = completedTasksWithTime.reduce((sum, task) => 
    sum + (task.actualMinutesSpent || 0), 0
  );

  const accuracy = totalEstimated > 0 ? (totalActual / totalEstimated) : 0;
  const accuracyPercentage = Math.round(accuracy * 100);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Time Tracking Summary ({completedTasksWithTime.length} tasks)
      </h4>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Estimated</div>
          <div className="font-medium">{formatTime(totalEstimated)}</div>
        </div>
        
        <div>
          <div className="text-gray-600">Actual</div>
          <div className="font-medium">{formatTime(totalActual)}</div>
        </div>
        
        <div>
          <div className="text-gray-600">Accuracy</div>
          <div className={`font-medium ${
            accuracyPercentage > 120 ? 'text-red-600' :
            accuracyPercentage < 80 ? 'text-green-600' :
            'text-blue-600'
          }`}>
            {accuracyPercentage}%
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        {accuracy < 0.8 && 'You tend to finish tasks faster than estimated ⚡'}
        {accuracy >= 0.8 && accuracy <= 1.2 && 'Your time estimates are quite accurate 🎯'}
        {accuracy > 1.2 && 'Tasks often take longer than estimated 🐌'}
      </div>
    </div>
  );
};

export default TimeTrackingDisplay;
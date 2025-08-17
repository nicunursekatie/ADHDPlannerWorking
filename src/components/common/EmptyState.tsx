import React from 'react';
import Button from './Button';
import { 
  Calendar, 
  CheckCircle2, 
  Coffee, 
  Sparkles, 
  Target,
  Inbox,
  Folder,
  Archive,
  Clock,
  Brain
} from 'lucide-react';

export type EmptyStateType = 
  | 'no-tasks-today' 
  | 'all-done-today' 
  | 'no-tasks' 
  | 'no-projects'
  | 'no-archived'
  | 'no-overdue'
  | 'no-upcoming'
  | 'brain-dump-empty';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

const emptyStateConfigs = {
  'no-tasks-today': {
    icon: Coffee,
    iconColor: 'text-green-500',
    title: 'Nothing due today!',
    message: 'Enjoy some free time, or get ahead on future tasks ☕',
    defaultAction: 'Add a task',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
  },
  'all-done-today': {
    icon: CheckCircle2,
    iconColor: 'text-purple-500',
    title: 'All done for today! 🎉',
    message: 'You\'ve completed everything. Time to relax!',
    defaultAction: 'Plan tomorrow',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10'
  },
  'no-tasks': {
    icon: Inbox,
    iconColor: 'text-blue-500',
    title: 'No tasks yet',
    message: 'Start by adding your first task to get organized',
    defaultAction: 'Create your first task',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10'
  },
  'no-projects': {
    icon: Folder,
    iconColor: 'text-amber-500',
    title: 'No projects created',
    message: 'Projects help you organize related tasks together',
    defaultAction: 'Create a project',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10'
  },
  'no-archived': {
    icon: Archive,
    iconColor: 'text-gray-500',
    title: 'No archived items',
    message: 'Completed tasks will appear here when archived',
    defaultAction: null,
    bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10'
  },
  'no-overdue': {
    icon: Target,
    iconColor: 'text-green-500',
    title: 'No overdue tasks! 🎯',
    message: 'You\'re all caught up - great job staying on track!',
    defaultAction: null,
    bgGradient: 'from-green-50 to-teal-50 dark:from-green-900/10 dark:to-teal-900/10'
  },
  'no-upcoming': {
    icon: Calendar,
    iconColor: 'text-indigo-500',
    title: 'Clear schedule ahead',
    message: 'No tasks scheduled for the upcoming week',
    defaultAction: 'Plan your week',
    bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10'
  },
  'brain-dump-empty': {
    icon: Brain,
    iconColor: 'text-purple-500',
    title: 'Ready for a brain dump?',
    message: 'Get all those thoughts out of your head and onto the page',
    defaultAction: 'Start brain dump',
    bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onAction,
  actionLabel,
  className = ''
}) => {
  const config = emptyStateConfigs[type];
  const Icon = config.icon;
  
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-50`} />
      
      {/* Content */}
      <div className="relative flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
        {/* Animated icon */}
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-ping">
            <Icon className={`w-16 h-16 ${config.iconColor} opacity-20`} />
          </div>
          <Icon className={`w-16 h-16 ${config.iconColor} relative`} />
        </div>
        
        {/* Text content */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {config.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
          {config.message}
        </p>
        
        {/* Action button */}
        {(onAction && (actionLabel || config.defaultAction)) && (
          <Button
            onClick={onAction}
            variant="primary"
            size="sm"
            className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {actionLabel || config.defaultAction}
          </Button>
        )}
      </div>
    </div>
  );
};
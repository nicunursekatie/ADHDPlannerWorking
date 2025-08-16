import React, { useRef, useState } from 'react';
import { Check, Clock, Calendar, AlertCircle, ChevronRight, Trash2, Sparkles } from 'lucide-react';
import { Task } from '../../types';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { formatDistanceToNow } from 'date-fns';
import { FuzzyTaskBreakdownSimple } from './FuzzyTaskBreakdownSimple';
import { useAppContext } from '../../context/AppContextSupabase';

interface MobileTaskCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const MobileTaskCard: React.FC<MobileTaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { addTask, deleteTask } = useAppContext();

  // Add haptic feedback if available
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  useSwipeGesture(cardRef, {
    onSwipeRight: () => {
      triggerHaptic();
      onToggle(task.id);
      // Animate the swipe
      setSwipeOffset(100);
      setTimeout(() => setSwipeOffset(0), 300);
    },
    onSwipeLeft: () => {
      triggerHaptic();
      setIsDeleting(true);
      setTimeout(() => {
        onDelete(task.id);
      }, 300);
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden transition-all duration-300 ${
        isDeleting ? 'opacity-0 scale-95' : ''
      }`}
      style={{ transform: `translateX(${swipeOffset}px)` }}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-l-4 ${
          task.completed ? 'opacity-60 border-gray-400' : getPriorityColor(task.priority || 'medium')
        } ${isOverdue ? 'border-red-600' : ''}`}
        onClick={() => onEdit(task)}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onToggle(task.id);
            }}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-purple-500'
            }`}
          >
            {task.completed && <Check size={14} className="text-white" />}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className={`text-base font-medium flex-1 ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {task.title}
              </h3>
              {!task.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic();
                    setShowBreakdown(true);
                  }}
                  className="ml-2 p-1.5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                  title="Break down this task"
                >
                  <Sparkles size={16} />
                </button>
              )}
            </div>

            {/* Task metadata */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
              {task.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {task.estimatedMinutes}m
                </span>
              )}
              
              {task.dueDate && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                  <Calendar size={12} />
                  {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                </span>
              )}

              {isOverdue && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle size={12} />
                  Overdue
                </span>
              )}
            </div>

            {/* Project/Category tags */}
            {(task.projectId || task.categoryId) && (
              <div className="flex gap-2 mt-2">
                {task.projectId && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    Project
                  </span>
                )}
                {task.categoryId && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Category
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* Swipe indicators */}
      <div className="absolute inset-y-0 left-0 w-16 bg-green-500 flex items-center justify-center -translate-x-full">
        <Check size={20} className="text-white" />
      </div>
      <div className="absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center translate-x-full">
        <Trash2 size={20} className="text-white" />
      </div>
    </div>
    
    {/* Fuzzy Task Breakdown Modal */}
    {showBreakdown && (
      <FuzzyTaskBreakdownSimple
        task={task}
        onClose={() => setShowBreakdown(false)}
        onComplete={async (newTasks) => {
          // Add all new tasks
          for (const newTask of newTasks) {
            await addTask({
              ...newTask,
              completed: false,
              archived: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as Task);
          }
          
          // Delete the original fuzzy task
          await deleteTask(task.id);
          
          // Close the modal
          setShowBreakdown(false);
        }}
      />
    )}
  );
};
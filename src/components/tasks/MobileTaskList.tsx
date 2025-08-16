import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../../types';
import { MobileTaskCard } from './MobileTaskCard';
import { RefreshCw } from 'lucide-react';

interface MobileTaskListProps {
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onRefresh?: () => Promise<void>;
  groupBy?: 'none' | 'priority' | 'dueDate' | 'project';
}

export const MobileTaskList: React.FC<MobileTaskListProps> = ({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onRefresh,
  groupBy = 'none'
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);

  // Pull-to-refresh implementation
  useEffect(() => {
    const element = listRef.current;
    if (!element || !onRefresh) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;
      
      if (distance > 0 && element.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, 100));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 60 && onRefresh) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
      startY.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, onRefresh]);

  // Group tasks
  const groupedTasks = React.useMemo(() => {
    if (groupBy === 'none') return { 'All Tasks': tasks };

    return tasks.reduce((groups, task) => {
      let key = 'Other';
      
      switch (groupBy) {
        case 'priority':
          key = task.priority ? `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)} Priority` : 'No Priority';
          break;
        case 'dueDate':
          if (!task.dueDate) {
            key = 'No Due Date';
          } else {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (dueDate < today) {
              key = 'Overdue';
            } else if (dueDate.toDateString() === today.toDateString()) {
              key = 'Today';
            } else if (dueDate.toDateString() === tomorrow.toDateString()) {
              key = 'Tomorrow';
            } else {
              key = 'Later';
            }
          }
          break;
        case 'project':
          key = task.projectId || 'No Project';
          break;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
      return groups;
    }, {} as Record<string, Task[]>);
  }, [tasks, groupBy]);

  return (
    <div 
      ref={listRef}
      className="relative h-full overflow-y-auto"
      style={{ transform: `translateY(${pullDistance}px)` }}
    >
      {/* Pull-to-refresh indicator */}
      {onRefresh && (
        <div className={`absolute -top-12 left-0 right-0 flex justify-center transition-opacity ${
          pullDistance > 60 ? 'opacity-100' : 'opacity-50'
        }`}>
          <div className={`p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg ${
            isRefreshing ? 'animate-spin' : ''
          }`}>
            <RefreshCw size={20} className="text-purple-600" />
          </div>
        </div>
      )}

      {/* Task groups */}
      <div className="space-y-6 p-4 pb-20">
        {Object.entries(groupedTasks).map(([group, groupTasks]) => (
          <div key={group}>
            {groupBy !== 'none' && (
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 -mx-4 px-4">
                {group} ({groupTasks.length})
              </h3>
            )}
            <div className="space-y-3">
              {groupTasks.map((task) => (
                <MobileTaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Tap the + button to add your first task
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
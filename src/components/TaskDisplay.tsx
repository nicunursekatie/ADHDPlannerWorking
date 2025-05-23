import React from 'react';
import { CheckCircle2, Circle, Calendar, AlertCircle } from 'lucide-react';
import { Task } from '../types/task';

interface TaskDisplayProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onBreakdown?: (task: Task) => void;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete,
  onBreakdown 
}) => {
  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Overdue
    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return {
        text: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
        className: 'text-red-600 font-semibold',
        icon: <AlertCircle className="w-4 h-4" />
      };
    }
    
    // Due today
    if (diffDays === 0) {
      return {
        text: 'Due today',
        className: 'text-green-600 font-semibold',
        icon: <Calendar className="w-4 h-4" />
      };
    }
    
    // Future
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      text: `${monthNames[dueDate.getMonth()]} ${dueDate.getDate()}`,
      className: 'text-gray-500',
      icon: <Calendar className="w-4 h-4" />
    };
  };

  const dueDateInfo = getDueDateInfo();
  
  return (
    <div className={`
      group flex items-start gap-3 p-4 rounded-xl border
      ${task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm'}
      transition-all duration-200
    `}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`
            text-base font-medium tracking-tight
            ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}
          `}>
            {task.title}
          </h3>
          
          {/* Due Date */}
          {dueDateInfo && (
            <div className={`flex items-center gap-1.5 text-sm ${dueDateInfo.className}`}>
              {dueDateInfo.icon}
              <span>{dueDateInfo.text}</span>
            </div>
          )}
        </div>
        
        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {task.subtasks.filter(st => !st.completed).length} of {task.subtasks.length} subtasks remaining
          </div>
        )}
      </div>
      
      {/* Actions - Only visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onBreakdown && !task.completed && (
          <button
            onClick={() => onBreakdown(task)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
            title="Break down into subtasks"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
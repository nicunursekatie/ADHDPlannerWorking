import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  Folder, 
  Tags, 
  Trash2, 
  Clock,
  Edit2,
  ArrowRight,
  Copy,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import { Task, Project, Category } from '../../types';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface ImprovedTaskCardProps {
  task: Task;
  projects: Project[];
  categories: Category[];
  isSubtask?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const ImprovedTaskCard: React.FC<ImprovedTaskCardProps> = ({
  task,
  projects,
  categories,
  isSubtask = false,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { completeTask, tasks, addTask } = useAppContext();
  
  const project = task.projectId 
    ? projects.find(p => p.id === task.projectId) 
    : null;
  
  const taskCategories = categories.filter(c => 
    task.categoryIds?.includes(c.id) || false
  );
  
  const subtasks = tasks.filter(t => 
    task.subtasks?.includes(t.id) || false
  );
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task.id);
    }
  };
  
  const handlePostpone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit && task.dueDate) {
      // Create a new date from the current due date and add one day
      const currentDate = new Date(task.dueDate);
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Format as YYYY-MM-DD
      const newDate = currentDate.toISOString().split('T')[0];
      
      // Create a modified task with the new due date
      const postponedTask = {
        ...task,
        dueDate: newDate
      };
      
      onEdit(postponedTask);
    }
  };
  
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a duplicate without the ID, completed and archived flags
    const duplicateTask: Partial<Task> = {
      title: `${task.title} (copy)`,
      description: task.description,
      dueDate: task.dueDate,
      projectId: task.projectId,
      categoryIds: task.categoryIds,
      parentTaskId: task.parentTaskId,
      priority: task.priority,
      energyLevel: task.energyLevel,
      size: task.size,
      estimatedMinutes: task.estimatedMinutes,
      completed: false,
      archived: false
    };
    
    addTask(duplicateTask);
  };
  
  // Determine priority color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };
  
  // Format due date with color based on urgency
  const renderDueDate = () => {
    if (!task.dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse the task due date from YYYY-MM-DD format
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day); // Month is 0-indexed in JS Date
    dueDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let textColor = 'text-gray-500';
    
    if (dueDate < today) {
      textColor = 'text-red-600 font-medium';
    } else if (dueDate.getTime() === today.getTime()) {
      textColor = 'text-green-600 font-medium'; // Changed to green for today's tasks
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      textColor = 'text-orange-500';
    }
    
    return (
      <div className={`flex items-center text-xs ${textColor.replace('gray-500', 'gray-400').replace('red-600', 'red-400').replace('green-600', 'green-400').replace('orange-500', 'orange-400')}`}>
        <Calendar size={14} className="mr-1" />
        {formatDateForDisplay(task.dueDate)}
      </div>
    );
  };
  
  // Check if task is due today
  const isDueToday = () => {
    if (!task.dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate.getTime() === today.getTime();
  };
  
  // Determine task background color based on status
  const getTaskBackground = () => {
    if (task.completed) return 'bg-amber-50 border-amber-200 opacity-75';
    if (!task.dueDate) return 'bg-white border-amber-200';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) return 'bg-red-50 border-red-500';
    if (dueDate.getTime() === today.getTime()) return 'bg-amber-50 border-amber-400';
    return 'bg-white border-amber-200';
  };
  
  return (
    <div className={`border rounded-lg p-4 ${getTaskBackground()}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <button
            onClick={handleComplete}
            className="mt-1"
          >
            {task.completed ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : (
              <Circle size={20} className="text-gray-400" />
            )}
          </button>
          <div>
            <h3 className={`text-base font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-gray-500">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-amber-500 rounded"
            >
              <Edit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {task.dueDate && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar size={14} className="mr-1" />
            {formatDateForDisplay(task.dueDate)}
          </div>
        )}
        
        {project && (
          <div className="flex items-center text-xs">
            <Folder size={14} className="mr-1" style={{ color: project.color }} />
            <span style={{ color: project.color }}>{project.name}</span>
          </div>
        )}
        
        {taskCategories.length > 0 && (
          <div className="flex items-center gap-1">
            <Tags size={14} className="text-gray-400" />
            {taskCategories.map(category => (
              <Badge 
                key={category.id}
                text={category.name}
                bgColor={category.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedTaskCard;
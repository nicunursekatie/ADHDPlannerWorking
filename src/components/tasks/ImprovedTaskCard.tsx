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
  MoreHorizontal,
  Battery,
  Brain,
  Flame,
  Star
} from 'lucide-react';
import { Task, Project, Category } from '../../types';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { getRelativeTimeDisplay } from '../../utils/dateUtils';
import { useAppContext } from '../../context/AppContextSupabase';
import { QuickDueDateEditor } from './QuickDueDateEditor';
import { getUrgencyEmoji, getEmotionalWeightEmoji, getEnergyRequiredEmoji, calculateSmartPriorityScore } from '../../utils/taskPrioritization';

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
  const [showDateEditor, setShowDateEditor] = useState(false);
  const { completeTask, tasks, addTask, updateTask } = useAppContext();
  
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
      case 'high': return 'bg-red-500 dark:bg-red-600';
      case 'medium': return 'bg-purple-500 dark:bg-purple-600';
      case 'low': return 'bg-blue-500 dark:bg-blue-600';
      default: return 'bg-gray-400 dark:bg-gray-600';
    }
  };
  
  // Format due date with color based on urgency
  const renderDueDate = () => {
    let textColor = 'text-text-muted';
    let dateText = 'Add date';
    
    if (task.dueDate) {
      const relativeTimeInfo = getRelativeTimeDisplay(task.dueDate, true); // Use weekend-relative display
      
      if (relativeTimeInfo) {
        // Use the combined format (e.g., "Monday after this weekend (Jun 17)")
        dateText = relativeTimeInfo.combined;
        
        // Apply styling based on urgency level
        switch (relativeTimeInfo.urgencyLevel) {
          case 'overdue':
            textColor = 'text-red-700 dark:text-red-300 font-bold bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
            break;
          case 'today':
            textColor = 'text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700';
            break;
          case 'soon':
            textColor = 'text-blue-600 dark:text-blue-400 font-medium';
            break;
          default:
            textColor = 'text-gray-600 dark:text-gray-400';
        }
      } else {
        // Fallback to original format
        dateText = formatDateForDisplay(task.dueDate);
      }
    }
    
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDateEditor(!showDateEditor);
          }}
          className={`flex items-center text-sm font-medium ${textColor} px-3 py-1.5 rounded-xl transition-all hover:scale-105 border ${textColor.includes('bg-') ? '' : 'border-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700'}`}
          title={task.dueDate ? "Click to change due date" : "Click to add due date"}
        >
          <Calendar size={16} className="mr-1.5" />
          {dateText}
        </button>
        
        {showDateEditor && (
          <QuickDueDateEditor
            currentDate={task.dueDate}
            onDateChange={(newDate) => {
              updateTask({ ...task, dueDate: newDate });
              setShowDateEditor(false);
            }}
            onClose={() => setShowDateEditor(false)}
          />
        )}
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
  
  // Determine task background color based on status and emotional weight
  const getTaskBackground = () => {
    if (task.completed) return 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-75';
    
    // Color by emotional weight if high
    if (task.emotionalWeight && task.emotionalWeight >= 4) {
      return 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-orange-300 dark:border-orange-800';
    }
    
    if (!task.dueDate) return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800';
    if (dueDate.getTime() === today.getTime()) return 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800';
    return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800';
  };
  
  return (
    <div className={`border rounded-xl p-4 ${getTaskBackground()} transition-all hover:shadow-md hover:scale-[1.01]`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <button
            onClick={handleComplete}
            className="mt-1"
          >
            {task.completed ? (
              <CheckCircle2 size={20} className="text-green-600 dark:text-green-500" />
            ) : (
              <Circle size={20} className="text-text-muted hover:text-primary-600 transition-colors" />
            )}
          </button>
          <div>
            <h3 className={`text-base font-medium ${task.completed ? 'text-text-tertiary opacity-75' : 'text-text-primary'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-text-secondary">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1 text-text-muted hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all hover:scale-110"
            >
              <Edit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-text-muted hover:text-danger-600 rounded-xl hover:bg-danger-50 transition-all hover:scale-110"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {/* Priority indicators */}
        <div className="flex items-center gap-1">
          {/* Urgency indicator */}
          {task.urgency && (
            <span className="text-sm" title={`Urgency: ${task.urgency}/5`}>
              {getUrgencyEmoji(task.urgency)}
            </span>
          )}
          
          {/* Importance indicator */}
          {task.importance && task.importance >= 4 && (
            <Star size={14} className="text-yellow-500" title={`Importance: ${task.importance}/5`} />
          )}
          
          {/* Emotional weight indicator */}
          {task.emotionalWeight && (
            <span className="text-sm" title={`Emotional weight: ${task.emotionalWeight}/5`}>
              {getEmotionalWeightEmoji(task.emotionalWeight)}
            </span>
          )}
          
          {/* Energy required indicator */}
          {task.energyRequired && (
            <span className="text-sm" title={`Energy required: ${task.energyRequired}`}>
              {getEnergyRequiredEmoji(task.energyRequired)}
            </span>
          )}
          
          {/* Smart priority score badge */}
          {(task.urgency || task.importance) && (
            <span 
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              title="Smart priority score"
            >
              {calculateSmartPriorityScore(task).toFixed(1)}
            </span>
          )}
        </div>
        
        {/* Separator if we have priority indicators */}
        {(task.urgency || task.importance || task.emotionalWeight || task.energyRequired) && (
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
        )}
        
        {task.dueDate && (
          <div className="flex items-center text-xs text-text-tertiary">
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
            <Tags size={14} className="text-purple-500 dark:text-purple-400" />
            {taskCategories.map(category => (
              <Badge 
                key={category.id}
                text={category.name}
                bgColor={category.color}
              />
            ))}
          </div>
        )}
        
        {/* Time estimate */}
        {task.estimatedMinutes && (
          <div className="flex items-center text-xs text-text-tertiary">
            <Clock size={14} className="mr-1" />
            {task.estimatedMinutes} min
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedTaskCard;
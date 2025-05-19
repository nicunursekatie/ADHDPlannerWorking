import React, { useState } from 'react';
import { Task, Project, Category } from '../../types';
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
  Zap, 
  BarChart,
  AlertTriangle,
  Plus,
  ListPlus,
  Timer,
  Brain,
  Edit2
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface EnhancedTaskCardProps {
  task: Task;
  projects: Project[];
  categories: Category[];
  isSubtask?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onBreakdown?: (task: Task) => void;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
  task,
  projects,
  categories,
  isSubtask = false,
  onEdit,
  onDelete,
  onBreakdown,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskTime, setNewSubtaskTime] = useState<number>(15);
  const { completeTask, tasks, addSubtask } = useAppContext();
  
  // Calculate total time of all subtasks
  const totalSubtaskTime = tasks
    .filter(t => task.subtasks?.includes(t.id))
    .reduce((total, subtask) => total + (subtask.estimatedMinutes || 0), 0);
  
  // Check if the task is overdue or due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let isOverdue = false;
  let isToday = false;
  
  if (task.dueDate && !task.completed) {
    // Parse the task due date from YYYY-MM-DD format
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day); // Month is 0-indexed in JS Date
    dueDate.setHours(0, 0, 0, 0);
    
    // Task is overdue if due date is before today
    isOverdue = dueDate < today;
    
    // Task is due today if the dates are equal
    isToday = dueDate.getTime() === today.getTime();
  }
    
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
  
  const toggleSubtaskInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubtaskInput(!showSubtaskInput);
    if (!showSubtaskInput) {
      setExpanded(true); // Auto-expand when adding subtasks
    }
  };
  
  const handleAddSubtask = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, { 
        title: newSubtaskTitle.trim(),
        estimatedMinutes: newSubtaskTime
      });
      setNewSubtaskTitle('');
      setNewSubtaskTime(15); // Reset to default
      setShowSubtaskInput(false);
    }
  };
  
  const handleSubtaskInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSubtaskInput(false);
      setNewSubtaskTitle('');
      e.stopPropagation();
    } else if (e.key === 'Enter') {
      handleAddSubtask(e as unknown as React.FormEvent);
    }
  };
  
  // Get priority color and styles
  const getPriorityColor = () => {
    if (!task.priority) return 'bg-gray-100 text-gray-600';
    
    switch (task.priority) {
      case 'high':
        return 'bg-red-100 text-red-600';
      case 'medium':
        return 'bg-orange-100 text-orange-600';
      case 'low':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get energy level styles
  const getEnergyLevelColor = () => {
    if (!task.energyLevel) return 'bg-gray-100 text-gray-600';
    
    switch (task.energyLevel) {
      case 'high':
        return 'bg-yellow-100 text-yellow-600';
      case 'medium':
        return 'bg-blue-100 text-blue-600';
      case 'low':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get task size styles
  const getTaskSizeColor = () => {
    if (!task.size) return 'bg-gray-100 text-gray-600';
    
    switch (task.size) {
      case 'large':
        return 'bg-indigo-100 text-indigo-600';
      case 'medium':
        return 'bg-blue-100 text-blue-600';
      case 'small':
        return 'bg-teal-100 text-teal-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get card border style based on completion and due date
  const getCardBorderStyle = () => {
    if (task.completed) return 'border-amber-200 bg-amber-50';
    if (isOverdue) return 'border-red-500 bg-red-50';
    if (isToday) return 'border-amber-400 bg-amber-50';
    return 'border-amber-200 bg-white';
  };
  
  const getTaskStyling = () => {
    return `border rounded-lg p-4 ${getCardBorderStyle()}`;
  };
  
  return (
    <div className={getTaskStyling()}>
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
            <h3 className={`text-base font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-gray-800">
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
          <div className="flex items-center text-xs text-amber-700">
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

export default EnhancedTaskCard;
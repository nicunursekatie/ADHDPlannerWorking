import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Calendar, Folder, Tags, Trash2, Edit2 } from 'lucide-react';
import { Task, Project, Category } from '../../types';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface TaskCardProps {
  task: Task;
  projects: Project[];
  categories: Category[];
  isSubtask?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projects,
  categories,
  isSubtask = false,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { completeTask, tasks } = useAppContext();
  
  const project = task.projectId 
    ? projects.find(p => p.id === task.projectId) 
    : null;
  
  const taskCategories = categories.filter(c => 
    task.categoryIds?.includes(c.id) || false
  );
  
  const subtasks = tasks.filter(t => 
    task.subtasks?.includes(t.id) || false
  );
  
  // Determine task status
  const getTaskStatus = () => {
    if (task.completed) return 'completed';
    if (!task.dueDate) return 'no-date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'today';
    return 'future';
  };
  
  const taskStatus = getTaskStatus();
  
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
  
  const getTaskStyling = () => {
    switch (taskStatus) {
      case 'completed':
        return 'border-amber-200 bg-amber-50 opacity-75';
      case 'overdue':
        return 'border-red-500 bg-red-50';
      case 'today':
        return 'border-amber-400 bg-amber-50';
      default:
        return 'border-amber-200 bg-white';
    }
  };
  
  return (
    <div className={`border rounded-lg p-4 ${getTaskStyling()}`}>
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

export default TaskCard;
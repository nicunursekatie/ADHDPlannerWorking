import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Calendar, Folder, Tags, Link, LockKeyhole, AlertCircle, Brain, Edit3, Trash2 } from 'lucide-react';
import { Task, Project, Category } from '../../types';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface TaskCardWithDependenciesProps {
  task: Task;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onBreakdown?: (task: Task) => void;
  showSelection?: boolean;
}

const TaskCardWithDependencies: React.FC<TaskCardWithDependenciesProps> = ({
  task,
  isSelected = false,
  onSelectChange,
  onEdit,
  onDelete,
  onBreakdown,
  showSelection = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { completeTask, tasks, projects, categories, getTaskDependencies, getDependentTasks, canCompleteTask } = useAppContext();
  
  const project = task.projectId 
    ? projects.find(p => p.id === task.projectId) 
    : null;
  
  const taskCategories = categories.filter(c => 
    task.categoryIds?.includes(c.id) || false
  );
  
  const subtasks = tasks.filter(t => 
    task.subtasks?.includes(t.id) || false
  );
  
  const dependencies = getTaskDependencies(task.id);
  const dependents = getDependentTasks(task.id);
  const canComplete = canCompleteTask(task.id);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canComplete) {
      completeTask(task.id);
    }
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(task);
    }
  };
  
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-400';
    }
  };
  
  const getEnergyIcon = (energy?: string) => {
    switch (energy) {
      case 'high': return '⚡⚡⚡';
      case 'medium': return '⚡⚡';
      case 'low': return '⚡';
      default: return '';
    }
  };
  
  const getSizeIcon = (size?: string) => {
    switch (size) {
      case 'large': return '●●●';
      case 'medium': return '●●';
      case 'small': return '●';
      default: return '';
    }
  };
  
  const getTaskStyling = () => {
    if (task.completed) {
      return 'bg-gray-100 border-gray-200';
    } else if (!canComplete) {
      return 'bg-amber-50 border-amber-200';
    } else {
      return 'bg-white border-gray-200';
    }
  };
  
  return (
    <div className={`border rounded-lg p-4 ${getTaskStyling()}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          {showSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectChange?.(e.target.checked);
              }}
              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          )}
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
              {task.priority && (
                <span className={`ml-2 text-sm ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'high' ? '!!!' : task.priority === 'medium' ? '!!' : '!'}
                </span>
              )}
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
              <Edit3 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash2 size={16} />
            </button>
          )}
          {onBreakdown && (
            <button
              onClick={() => onBreakdown(task)}
              className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded"
              title="AI Breakdown"
            >
              <Brain size={16} />
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
      
      {/* Expandable sections */}
      {(subtasks.length > 0 || dependencies.length > 0 || dependents.length > 0) && (
        <div className="mt-3">
          <button
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
          >
            {expanded ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            <span>
              {subtasks.length > 0 && `${subtasks.length} subtask${subtasks.length !== 1 ? 's' : ''}`}
              {subtasks.length > 0 && (dependencies.length > 0 || dependents.length > 0) && ' • '}
              {dependencies.length > 0 && `${dependencies.length} dependency${dependencies.length !== 1 ? 'ies' : ''}`}
              {dependencies.length > 0 && dependents.length > 0 && ' • '}
              {dependents.length > 0 && `${dependents.length} dependent${dependents.length !== 1 ? 's' : ''}`}
            </span>
          </button>
          
          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Dependencies */}
              {dependencies.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Dependencies (must complete first):</h4>
                  <div className="space-y-1">
                    {dependencies.map(dep => (
                      <div key={dep.id} className={`text-sm pl-4 ${dep.completed ? 'text-green-600' : 'text-gray-600'}`}>
                        {dep.completed ? '✓' : '○'} {dep.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Dependent tasks */}
              {dependents.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Dependent tasks (blocked by this):</h4>
                  <div className="space-y-1">
                    {dependents.map(dep => (
                      <div key={dep.id} className="text-sm pl-4 text-gray-600">
                        ○ {dep.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Subtasks */}
              {subtasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Subtasks:</h4>
                  <div className="space-y-2">
                    {subtasks.map(subtask => (
                      <TaskCardWithDependencies
                        key={subtask.id}
                        task={subtask}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCardWithDependencies;
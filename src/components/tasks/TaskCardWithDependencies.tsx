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
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
      task.completed ? 'opacity-75' : ''
    }`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={handleEdit}
      >
        <div className="flex items-start gap-3">
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
            className={`mt-0.5 flex-shrink-0 focus:outline-none ${
              !canComplete && !task.completed ? 'cursor-not-allowed' : ''
            }`}
            onClick={handleComplete}
            disabled={!canComplete && !task.completed}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : !canComplete ? (
              <LockKeyhole className="h-5 w-5 text-gray-400" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-indigo-500" />
            )}
          </button>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <h3 className={`text-base font-medium ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {task.title}
                  {task.priority && (
                    <span className={`ml-2 text-sm ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? '!!!' : task.priority === 'medium' ? '!!' : '!'}
                    </span>
                  )}
                </h3>
                
                {task.description && (
                  <p className={`mt-1 text-sm ${
                    task.completed ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {task.description}
                  </p>
                )}
                
                {/* Show blocked message if task can't be completed */}
                {!canComplete && !task.completed && dependencies.length > 0 && (
                  <div className="mt-2 flex items-center text-sm text-orange-600">
                    <AlertCircle size={14} className="mr-1" />
                    <span>Blocked by incomplete dependencies</span>
                  </div>
                )}
                
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  {task.dueDate && (
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {formatDateForDisplay(task.dueDate)}
                    </div>
                  )}
                  
                  {project && (
                    <div className="flex items-center">
                      <Folder size={12} className="mr-1" />
                      <span style={{ color: project.color }}>{project.name}</span>
                    </div>
                  )}
                  
                  {taskCategories.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tags size={12} />
                      {taskCategories.map(category => (
                        <Badge 
                          key={category.id}
                          text={category.name}
                          bgColor={category.color}
                        />
                      ))}
                    </div>
                  )}
                  
                  {dependencies.length > 0 && (
                    <div className="flex items-center text-indigo-600">
                      <Link size={12} className="mr-1" />
                      <span>{dependencies.length} dep{dependencies.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {dependents.length > 0 && (
                    <div className="flex items-center text-purple-600">
                      <Link size={12} className="mr-1 transform rotate-180" />
                      <span>{dependents.length} task{dependents.length !== 1 ? 's' : ''} depend on this</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <div className="flex gap-3 text-xs">
                    {task.energyLevel && (
                      <span className="text-yellow-600" title={`Energy: ${task.energyLevel}`}>
                        {getEnergyIcon(task.energyLevel)}
                      </span>
                    )}
                    {task.size && (
                      <span className="text-blue-600" title={`Size: ${task.size}`}>
                        {getSizeIcon(task.size)}
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="text-gray-500">
                        {task.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {!task.completed && !task.parentTaskId && onBreakdown && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBreakdown(task);
                        }}
                        className="p-1 text-gray-400 hover:text-purple-500 rounded transition-colors"
                        title="AI Breakdown"
                      >
                        <Brain size={16} />
                      </button>
                    )}
                    
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                        title="Edit task"
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
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default TaskCardWithDependencies;
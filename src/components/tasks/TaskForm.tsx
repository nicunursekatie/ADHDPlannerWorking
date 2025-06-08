import React, { useState, useEffect } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Button from '../common/Button';
import SubtaskList from './SubtaskList';
import { Calendar, Folder, Tag } from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  parentTask?: Task | null;
  onClose: () => void;
  isEdit?: boolean;
  initialProjectId?: string | null;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  parentTask = null,
  onClose,
  isEdit = false,
  initialProjectId = null,
}) => {
  const { addTask, updateTask, deleteTask, projects, categories } = useAppContext();
  
  const initialState: Partial<Task> = {
    title: '',
    description: '',
    dueDate: null,
    projectId: parentTask?.projectId || initialProjectId || null,
    categoryIds: [],
    parentTaskId: parentTask?.id || null,
    priority: 'medium',
    energyLevel: 'medium',
    size: 'medium',
    estimatedMinutes: 30,
    subtasks: [],
    ...task,
  };
  
  const [formData, setFormData] = useState<Partial<Task>>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Reset form data when the task prop changes
    if (task) {
      setFormData({ ...task });
    } else {
      setFormData(initialState);
    }
  }, [task, parentTask]);
  
  // Debug current formData
  useEffect(() => {
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Special handling for date inputs to preserve the selected date
    if (name === 'dueDate') {
      // If the value is empty, set to null
      if (!value) {
        setFormData(prev => ({ ...prev, dueDate: null }));
      } else {
        // Store the date value as is without timezone conversion
        setFormData(prev => ({ ...prev, dueDate: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      projectId: value === '' ? null : value,
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => {
      const categoryIds = prev.categoryIds || [];
      if (categoryIds.includes(categoryId)) {
        return {
          ...prev,
          categoryIds: categoryIds.filter(id => id !== categoryId),
        };
      } else {
        return {
          ...prev,
          categoryIds: [...categoryIds, categoryId],
        };
      }
    });
  };
  
  const handleSubtasksChange = (subtaskIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      subtasks: subtaskIds,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEdit && task) {
      updateTask({ ...task, ...formData } as Task);
    } else {
      addTask(formData);
    }
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Task Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all sm:text-sm ${
            errors.title ? 'border-red-500 dark:border-red-400' : ''
          }`}
          placeholder="Enter task title"
          autoFocus
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all sm:text-sm"
          placeholder="Add details about this task"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date
          </label>
          <div className="flex items-center">
            <Calendar size={18} className="text-purple-400 dark:text-purple-500 mr-2" />
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all sm:text-sm"
            />
          </div>
        </div>
        {/* Project */}
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project
          </label>
          <div className="flex items-center">
            <Folder size={18} className="text-purple-400 dark:text-purple-500 mr-2" />
            <select
              id="project"
              name="project"
              value={formData.projectId || ''}
              onChange={handleProjectChange}
              className="block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all sm:text-sm"
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Repeat/Recurrence Button Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repeat</label>
        <div className="flex space-x-2">
          {[
            { label: 'None', value: 'none' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Custom', value: 'custom' },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                isRecurring: option.value !== 'none',
                recurrencePattern: option.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'custom',
                recurrenceInterval: option.value === 'custom' ? 1 : undefined,
              }))}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 focus:outline-none ${
                (formData.recurrencePattern || 'none') === option.value
                  ? 'bg-purple-500 dark:bg-purple-600 text-white border-purple-500 dark:border-purple-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Categories
        </label>
        <div className="flex items-start">
          <Tag size={18} className="text-purple-400 dark:text-purple-500 mr-2 mt-1" />
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div
                key={category.id}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm 
                  ${
                    (formData.categoryIds?.includes(category.id) || false)
                      ? 'bg-opacity-100 text-white'
                      : 'bg-opacity-25 text-gray-700 dark:text-gray-300'
                  } cursor-pointer transition-all hover:scale-105`}
                style={{ 
                  backgroundColor: (formData.categoryIds?.includes(category.id) || false)
                    ? category.color 
                    : `${category.color}40`
                }}
                onClick={() => handleCategoryChange(category.id)}
              >
                <span>{category.name}</span>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-500">No categories available</p>
            )}
          </div>
        </div>
      </div>

      {/* Always show subtasks section */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Subtasks</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Break this task down into smaller, more manageable steps.</p>
        
        {/* Simple subtask interface for when we don't have a task ID yet */}
        {(!isEdit || !task?.id) ? (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3 rounded-xl text-purple-700 dark:text-purple-300 text-sm">
            Save this task first before adding subtasks.
          </div>
        ) : (
          <SubtaskList
            parentTaskId={task.id}
            existingSubtasks={formData.subtasks || []}
            onSubtasksChange={handleSubtasksChange}
          />
        )}
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-between">
        {/* Delete button (only show when editing) */}
        {isEdit && task && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this task?')) {
                deleteTask(task.id);
                onClose();
              }
            }}
          >
            Delete Task
          </Button>
        )}

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {isEdit ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
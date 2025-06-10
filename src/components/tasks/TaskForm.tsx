import React, { useState, useEffect } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Button from '../common/Button';
import SubtaskList from './SubtaskList';
import { Calendar, Folder, Tag, Flame, Star, Brain, Battery } from 'lucide-react';

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
    urgency: 3,
    importance: 3,
    emotionalWeight: 3,
    energyRequired: 'medium',
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

      {/* Quick Preset Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFormData(prev => ({
            ...prev,
            priority: 'low',
            urgency: 'week',
            emotionalWeight: 'easy',
            energyRequired: 'low',
            estimatedMinutes: 15
          }))}
          className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-all text-sm font-medium"
        >
          Quick Task
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({
            ...prev,
            priority: 'high',
            urgency: 'month',
            emotionalWeight: 'neutral',
            energyRequired: 'high',
            estimatedMinutes: 120
          }))}
          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-all text-sm font-medium"
        >
          Big Project
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({
            ...prev,
            priority: 'high',
            urgency: 'today',
            emotionalWeight: 'dreading',
            energyRequired: 'high',
            estimatedMinutes: 60
          }))}
          className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-all text-sm font-medium"
        >
          Dreaded Task
        </button>
      </div>

      {/* Priority and Urgency Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Star size={16} className="inline mr-1" />
            Priority
          </label>
          <div className="flex gap-2">
            {[
              { label: 'Low', value: 'low' as const },
              { label: 'Medium', value: 'medium' as const },
              { label: 'High', value: 'high' as const },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:scale-105 focus:outline-none ${
                  (formData.priority || 'medium') === option.value
                    ? option.value === 'high' 
                      ? 'bg-red-500 text-white border-red-500'
                      : option.value === 'medium'
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-green-500 text-white border-green-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Flame size={16} className="inline mr-1" />
            Urgency
          </label>
          <div className="flex gap-2">
            {[
              { label: '🔥 Today', value: 'today' as const, color: 'red' },
              { label: '📅 This Week', value: 'week' as const, color: 'orange' },
              { label: '📌 This Month', value: 'month' as const, color: 'yellow' },
              { label: '🌊 Someday', value: 'someday' as const, color: 'blue' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, urgency: option.value }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all hover:scale-105 focus:outline-none text-lg ${
                  (formData.urgency || 'week') === option.value
                    ? option.color === 'red' ? 'bg-red-500 text-white border-red-500'
                    : option.color === 'orange' ? 'bg-orange-500 text-white border-orange-500'
                    : option.color === 'yellow' ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:shadow-md'
                }`}
                title={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories (Full Width) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          <Tag size={16} className="inline mr-1" />
          Categories
        </label>
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

      {/* Energy and Emotional Weight Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Energy Needed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Battery size={16} className="inline mr-1" />
            Energy Needed
          </label>
          <div className="flex gap-2">
            {[
              { label: '🔋 Low', value: 'low' as const },
              { label: '🔋🔋 Medium', value: 'medium' as const },
              { label: '🔋🔋🔋 High', value: 'high' as const },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, energyRequired: option.value }))}
                className={`px-4 py-3 rounded-lg text-base font-medium border-2 transition-all hover:scale-105 focus:outline-none ${
                  (formData.energyRequired || 'medium') === option.value
                    ? 'bg-green-500 dark:bg-green-600 text-white border-green-600 dark:border-green-700 shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotional Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Brain size={16} className="inline mr-1" />
            Emotional Weight
          </label>
          <div className="flex gap-2">
            {[
              { label: '😊 Easy/Fun', value: 'easy' as const, color: 'green' },
              { label: '😐 Neutral', value: 'neutral' as const, color: 'yellow' },
              { label: '😰 Stressful', value: 'stressful' as const, color: 'orange' },
              { label: '😱 Dreading', value: 'dreading' as const, color: 'red' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, emotionalWeight: option.value }))}
                className={`px-3 py-3 rounded-lg text-lg font-medium border-2 transition-all hover:scale-105 focus:outline-none ${
                  (formData.emotionalWeight || 'neutral') === option.value
                    ? option.value === 'easy' ? 'bg-green-500 text-white border-green-600 shadow-md'
                    : option.value === 'neutral' ? 'bg-yellow-500 text-white border-yellow-600 shadow-md'
                    : option.value === 'stressful' ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                    : 'bg-red-500 text-white border-red-600 shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:shadow-md'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Estimated Time (minutes)
        </label>
        <input
          type="number"
          name="estimatedMinutes"
          value={formData.estimatedMinutes || 30}
          onChange={handleChange}
          className="block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all sm:text-sm"
          min="5"
          step="5"
        />
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
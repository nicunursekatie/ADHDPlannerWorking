import React, { useState, useEffect, useCallback } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import { useTaskAutoSave } from '../../hooks/useTaskAutoSave';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SubtaskList from './SubtaskList';
import { Calendar, Folder, Tag, Flame, Star, Brain, Battery, ChevronDown, ChevronRight, Clock, AlertCircle, Sparkles, Hash, Plus, X } from 'lucide-react';
import { addDays, endOfWeek, endOfMonth, format } from 'date-fns';

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
  const { addTask, updateTask, deleteTask, projects, categories, tasks, addTaskDependency, removeTaskDependency, addCategory } = useAppContext();
  const { queueTaskForSave, clearPendingTask } = useTaskAutoSave({ 
    delay: 2000, // Auto-save after 2 seconds of no changes
    enabled: false // Disable auto-save for TaskForm - use manual save instead
  });
  
  // Progressive disclosure state for ADHD-friendly design
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEmotionalSection, setShowEmotionalSection] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  
  // New features state
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task?.dependsOn || []);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  
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
    estimatedMinutes: 0,
    urgency: 'week',
    importance: 3,
    emotionalWeight: 'neutral',
    energyRequired: 'medium',
    subtasks: [],
    ...task,
  };
  
  const [formData, setFormData] = useState<Partial<Task>>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});


  // Helper function to update form data (auto-save disabled for forms)
  const updateFormData = useCallback((updater: (prev: Partial<Task>) => Partial<Task>) => {
    setFormData(updater);
  }, []);

  // Helper functions for new features
  const getAvailableTasksForDependency = useCallback(() => {
    if (!task) return tasks.filter(t => !t.completed && !t.archived);
    
    // Filter out:
    // 1. The current task itself
    // 2. Tasks that already depend on this task (to avoid cycles)
    // 3. Completed or archived tasks
    return tasks.filter(t => 
      t.id !== task.id && 
      !t.completed && 
      !t.archived &&
      !(t.dependsOn && t.dependsOn.includes(task.id))
    );
  }, [task, tasks]);

  const toggleDependency = useCallback((taskId: string) => {
    if (selectedDependencies.includes(taskId)) {
      setSelectedDependencies(selectedDependencies.filter(id => id !== taskId));
    } else {
      setSelectedDependencies([...selectedDependencies, taskId]);
    }
  }, [selectedDependencies]);

  const addTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags]);

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const category = await addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      
      // Add the new category to the current task's categories
      updateFormData(prev => ({ 
        ...prev, 
        categoryIds: [...(prev.categoryIds || []), category.id] 
      }));
      
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setShowNewCategoryModal(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  }, [newCategoryName, newCategoryColor, addCategory, updateFormData]);

  useEffect(() => {
    // Reset form data when the task prop changes
    if (task) {
      setFormData({ 
        ...task,
        // Ensure these fields are included even if missing from task
        urgency: task.urgency || 'week',
        importance: task.importance || 3,
        emotionalWeight: task.emotionalWeight || 'neutral',
        energyRequired: task.energyRequired || 'medium'
      });
    }
  }, [task?.id]); // Only re-run when task ID changes
  
  // Remove empty useEffect that causes unnecessary re-renders

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Special handling for date inputs to preserve the selected date
    if (name === 'dueDate') {
      // If the value is empty, set to null
      if (!value) {
        updateFormData(prev => ({ ...prev, dueDate: null }));
      } else {
        // Store the date value as is without timezone conversion
        updateFormData(prev => ({ ...prev, dueDate: value }));
      }
    } else if (name === 'estimatedMinutes') {
      // Handle number input - allow empty values and decimals
      const numericValue = value ? parseFloat(value) : 0;
      updateFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      updateFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors, updateFormData]);

  const handleProjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateFormData(prev => ({
      ...prev,
      projectId: value === '' ? null : value,
    }));
  }, [updateFormData]);

  
  const handleSubtasksChange = useCallback((subtaskIds: string[]) => {
    updateFormData(prev => ({
      ...prev,
      subtasks: subtaskIds,
    }));
  }, [updateFormData]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    updateFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...(prev.categoryIds || []), categoryId]
    }));
  }, [updateFormData]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    const taskData = {
      ...formData,
      tags,
      dependsOn: selectedDependencies,
    };
    
    try {
      if (isEdit && task) {
        const taskToUpdate = { ...task, ...taskData } as Task;
        await updateTask(taskToUpdate);
        
        // Update dependencies if they have changed
        const oldDependencies = task.dependsOn || [];
        const toRemove = oldDependencies.filter(id => !selectedDependencies.includes(id));
        const toAdd = selectedDependencies.filter(id => !oldDependencies.includes(id));
        
        if (addTaskDependency && removeTaskDependency) {
          await Promise.all([
            ...toRemove.map(depId => removeTaskDependency(task.id, depId)),
            ...toAdd.map(depId => addTaskDependency(task.id, depId))
          ]);
        }
        
        clearPendingTask(task.id);
      } else {
        const newTask = await addTask(taskData);
        
        // Add dependencies to the new task
        if (selectedDependencies.length > 0 && addTaskDependency) {
          await Promise.all(
            selectedDependencies.map(depId => addTaskDependency(newTask.id, depId))
          );
        }
      }
      
      onClose();
    } catch (error) {
      console.error('TaskForm save error:', error);
      console.error('Task data that failed to save:', taskData);
      let errorMessage = 'Failed to save task. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, isEdit, task, formData, tags, selectedDependencies, updateTask, clearPendingTask, addTask, addTaskDependency, removeTaskDependency, onClose]);

  return (
    <div className="space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto pb-20 px-1">
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error saving task</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">{submitError}</div>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-8" id="task-form">
        {/* Main Task Info - Always visible */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center mb-4">
            <Sparkles className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">What needs to be done?</h3>
          </div>
          
          <div className="space-y-6">
            {/* Task Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className={`block w-full text-lg px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 placeholder:text-gray-400 ${
                  errors.title ? 'border-red-500 dark:border-red-400' : ''
                }`}
                placeholder="Enter a clear, specific task title..."
                autoFocus
              />
              {errors.title && (
                <div className="mt-2 flex items-center text-red-500">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <p className="text-sm">{errors.title}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 placeholder:text-gray-400"
                placeholder="Add any additional details or context..."
              />
            </div>
          </div>
        </div>

        {/* Time Estimate - Always Visible */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">How long will this take?</h3>
            {formData.estimatedMinutes && (
              <span className="ml-auto text-sm text-orange-600 dark:text-orange-400 font-medium">
                ~{formData.estimatedMinutes} min
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Quick Time Presets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '5 min', value: 5, desc: 'Very quick' },
                { label: '15 min', value: 15, desc: 'Quick task' },
                { label: '30 min', value: 30, desc: 'Short task' },
                { label: '1 hour', value: 60, desc: 'Medium task' },
                { label: '2 hours', value: 120, desc: 'Long task' },
                { label: 'Half day', value: 240, desc: 'Major task' },
                { label: 'Full day', value: 480, desc: 'Big project' },
                { label: 'Custom', value: 0, desc: 'Enter exact time' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (option.value === 0) {
                      // Focus the custom input field
                      const input = document.querySelector('input[name="estimatedMinutes"]') as HTMLInputElement;
                      if (input) input.focus();
                      return;
                    }
                    
                    let size: 'small' | 'medium' | 'large' = 'medium';
                    if (option.value <= 30) {
                      size = 'small';
                    } else if (option.value <= 120) {
                      size = 'medium';
                    } else {
                      size = 'large';
                    }
                    updateFormData(prev => ({ ...prev, estimatedMinutes: option.value, size }));
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    option.value === 0 
                      ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-orange-300 hover:shadow-lg'
                      : (formData.estimatedMinutes || 0) === option.value
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                </button>
              ))}
            </div>
            
            {/* Custom Time Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or enter exact time (minutes)
              </label>
              <input
                type="number"
                name="estimatedMinutes"
                value={formData.estimatedMinutes || ''}
                onChange={handleChange}
                className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-all"
                placeholder="Enter any number of minutes (e.g., 7, 23, 45)..."
                min="0"
                step="0.5"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You can enter any time estimate - whole numbers or decimals (e.g., 2.5 for 2 minutes 30 seconds)
              </p>
            </div>
          </div>
        </div>

        {/* How Do You Feel About This? - Emotional Section */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-6 border border-pink-100 dark:border-pink-800">
          <button
            type="button"
            onClick={() => setShowEmotionalSection(!showEmotionalSection)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center">
              <Brain className="w-5 h-5 text-pink-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">How do you feel about this?</h3>
            </div>
            <div className="flex items-center text-gray-500">
              <span className="text-sm mr-2">
                {formData.emotionalWeight === 'easy' ? '😊 Easy' : 
                 formData.emotionalWeight === 'neutral' ? '😐 Neutral' : 
                 formData.emotionalWeight === 'stressful' ? '😰 Stressful' : 
                 '😱 Dreading'}
              </span>
              {showEmotionalSection ? 
                <ChevronDown className="w-5 h-5 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-5 h-5 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showEmotionalSection ? 'max-h-[2000px] mt-6' : 'max-h-0'}`}>
            <div className="space-y-6">
              {/* Emotional Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Choose what feels right
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
                  {[
                    { label: '😊', text: 'Easy/Fun', value: 'easy' as const, desc: 'Looking forward to this' },
                    { label: '😐', text: 'Neutral', value: 'neutral' as const, desc: 'Just another task' },
                    { label: '😰', text: 'Stressful', value: 'stressful' as const, desc: 'A bit overwhelming' },
                    { label: '😱', text: 'Dreading', value: 'dreading' as const, desc: 'Not looking forward' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormData(prev => ({ ...prev, emotionalWeight: option.value }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                        (formData.emotionalWeight || 'neutral') === option.value
                          ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.label}</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{option.text}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority & Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Star size={16} className="inline mr-1" />
                    How important is this?
                  </label>
                  <div className="space-y-2">
                    {[
                      { label: '🌱 Low', value: 'low' as const, desc: 'Nice to do' },
                      { label: '🔶 Medium', value: 'medium' as const, desc: 'Should do' },
                      { label: '🔴 High', value: 'high' as const, desc: 'Must do' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateFormData(prev => ({ 
                            ...prev, 
                            priority: option.value,
                            importance: option.value === 'low' ? 2 : option.value === 'medium' ? 5 : 8
                          }));
                        }}
                        className={`w-full p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md ${
                          (formData.priority || 'medium') === option.value
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Battery size={16} className="inline mr-1" />
                    How much energy needed?
                  </label>
                  <div className="space-y-2">
                    {[
                      { label: '🔋 Low', value: 'low' as const, desc: 'Easy, relaxing' },
                      { label: '🔋🔋 Medium', value: 'medium' as const, desc: 'Some focus needed' },
                      { label: '🔋🔋🔋 High', value: 'high' as const, desc: 'Deep focus required' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateFormData(prev => ({ 
                            ...prev, 
                            energyRequired: option.value
                          }));
                        }}
                        className={`w-full p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md ${
                          (formData.energyRequired || 'medium') === option.value
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/30 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Flame size={16} className="inline mr-1" />
                  When does this need to happen?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: '🔥', text: 'Today', value: 'today' as const, desc: 'Urgent!' },
                    { label: '☀️', text: 'Tomorrow', value: 'tomorrow' as const, desc: 'Next day' },
                    { label: '📅', text: 'This Week', value: 'week' as const, desc: 'Soon' },
                    { label: '📌', text: 'This Month', value: 'month' as const, desc: 'Eventually' },
                    { label: '🌊', text: 'Someday', value: 'someday' as const, desc: 'When I get to it' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        let dueDate: Date | null = null;
                        
                        switch (option.value) {
                          case 'today':
                            dueDate = today;
                            break;
                          case 'tomorrow':
                            dueDate = addDays(today, 1);
                            break;
                          case 'week':
                            dueDate = endOfWeek(today, { weekStartsOn: 1 }); // End of current week
                            break;
                          case 'month':
                            dueDate = endOfMonth(today); // End of current month
                            break;
                          case 'someday':
                            dueDate = null; // No specific date
                            break;
                        }
                        
                        updateFormData(prev => ({ 
                          ...prev, 
                          urgency: option.value,
                          dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : null
                        }));
                      }}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md ${
                        (formData.urgency || 'week') === option.value
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{option.label}</div>
                      <div className="font-medium text-sm">{option.text}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
          onClick={() => {
            const today = new Date();
            const endOfWeek = endOfWeek(today, { weekStartsOn: 1 });
            updateFormData(prev => ({
              ...prev,
              priority: 'low',
              urgency: 'week',
              emotionalWeight: 'easy',
              energyRequired: 'low',
              estimatedMinutes: 15,
              dueDate: format(endOfWeek, 'yyyy-MM-dd'),
              importance: 2,
              size: 'small'
            }));
          }}
          className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-all text-sm font-medium"
        >
          Quick Task
        </button>
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const endOfMonth = endOfMonth(today);
            updateFormData(prev => ({
              ...prev,
              priority: 'high',
              urgency: 'month',
              emotionalWeight: 'neutral',
              energyRequired: 'high',
              estimatedMinutes: 120,
              dueDate: format(endOfMonth, 'yyyy-MM-dd'),
              importance: 8,
              size: 'large'
            }));
          }}
          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-all text-sm font-medium"
        >
          Big Project
        </button>
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            updateFormData(prev => ({
              ...prev,
              priority: 'high',
              urgency: 'today',
              emotionalWeight: 'dreading',
              energyRequired: 'high',
              estimatedMinutes: 60,
              dueDate: format(today, 'yyyy-MM-dd'),
              importance: 8,
              size: 'medium'
            }));
          }}
          className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-all text-sm font-medium"
        >
          Dreaded Task
        </button>
      </div>


      {/* Categories */}
      <div>
        <label htmlFor="categories" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <Tag size={16} className="inline mr-1" />
          Categories
        </label>
        <select
          id="categories"
          name="categories"
          multiple
          value={formData.categoryIds || []}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            updateFormData(prev => ({ ...prev, categoryIds: values }));
          }}
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all sm:text-sm"
          size={Math.min(categories.length + 1, 4)}
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Hold Ctrl/Cmd to select multiple categories</p>
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


        {/* Advanced Options */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center">
              <div className="w-5 h-5 text-gray-500 mr-2">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Advanced Options</h3>
            </div>
            <div className="flex items-center text-gray-500">
              <span className="text-sm mr-2">Time, dependencies, tags, subtasks</span>
              {showAdvanced ? 
                <ChevronDown className="w-5 h-5 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-5 h-5 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[2000px] mt-6' : 'max-h-0'}`}>
            <div className="space-y-6">

              {/* Dependencies Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Hash className="w-5 h-5 mr-2 text-purple-500" />
                  Dependencies
                </h4>
                <button
                  type="button"
                  onClick={() => setShowDependencyModal(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  + Add Dependencies
                </button>
                {selectedDependencies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDependencies.map(depId => {
                      const depTask = tasks.find(t => t.id === depId);
                      if (!depTask) return null;
                      return (
                        <span
                          key={depId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        >
                          {depTask.title}
                          <button
                            type="button"
                            onClick={() => setSelectedDependencies(selectedDependencies.filter(id => id !== depId))}
                            className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-green-500" />
                  Tags
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtasks Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Subtasks</h4>
                {!isEdit ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-blue-700 dark:text-blue-300 text-sm">
                    💡 Save this task first, then you can break it down into smaller subtasks
                  </div>
                ) : task ? (
                  <SubtaskList
                    parentTaskId={task.id}
                    existingSubtasks={formData.subtasks || []}
                    onSubtasksChange={handleSubtasksChange}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Form Actions - Outside of form for better styling */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl -mx-6 -mb-6">
        <div className="flex justify-between items-center">
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

          <div className={`flex space-x-3 ${!isEdit || !task ? 'ml-auto' : ''}`}>
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
              form="task-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </div>
      </div>

      {/* Dependency Selection Modal */}
      {showDependencyModal && (
        <Modal
          isOpen={showDependencyModal}
          onClose={() => setShowDependencyModal(false)}
          title="Select Dependencies"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Choose which tasks need to be completed before this one can start.
            </p>
            
            {getAvailableTasksForDependency().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No other tasks available as dependencies
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getAvailableTasksForDependency().map(task => (
                  <label
                    key={task.id}
                    className="flex items-center p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDependencies.includes(task.id)}
                      onChange={() => toggleDependency(task.id)}
                      className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDependencyModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowDependencyModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Creation Modal */}
      {showNewCategoryModal && (
        <Modal
          isOpen={showNewCategoryModal}
          onClose={() => {
            setShowNewCategoryModal(false);
            setNewCategoryName('');
            setNewCategoryColor('#3B82F6');
          }}
          title="Create New Category"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category name..."
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="newCategoryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                id="newCategoryColor"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="block w-full h-10 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName('');
                  setNewCategoryColor('#3B82F6');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
              >
                Create Category
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TaskForm;
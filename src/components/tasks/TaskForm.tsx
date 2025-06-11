import React, { useState, useEffect } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Button from '../common/Button';
import SubtaskList from './SubtaskList';
import { Calendar, Folder, Tag, Flame, Star, Brain, Battery, ChevronDown, ChevronRight, Clock, AlertCircle, Sparkles } from 'lucide-react';

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
  
  // Progressive disclosure state for ADHD-friendly design
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEmotionalSection, setShowEmotionalSection] = useState(true);
  const [showScheduling, setShowScheduling] = useState(false);
  
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
    urgency: 'week',
    importance: 3,
    emotionalWeight: 'neutral',
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

  
  const handleSubtasksChange = (subtaskIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      subtasks: subtaskIds,
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...(prev.categoryIds || []), categoryId]
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
    <div className="space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto pb-20">
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
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '😊', text: 'Easy/Fun', value: 'easy' as const, desc: 'Looking forward to this' },
                    { label: '😐', text: 'Neutral', value: 'neutral' as const, desc: 'Just another task' },
                    { label: '😰', text: 'Stressful', value: 'stressful' as const, desc: 'A bit overwhelming' },
                    { label: '😱', text: 'Dreading', value: 'dreading' as const, desc: 'Really not looking forward' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, emotionalWeight: option.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 hover:shadow-md ${
                        (formData.emotionalWeight || 'neutral') === option.value
                          ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/30 shadow-lg transform scale-105'
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
                        onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
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
                        onClick={() => setFormData(prev => ({ ...prev, energyRequired: option.value }))}
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                      onClick={() => setFormData(prev => ({ ...prev, urgency: option.value }))}
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
              { label: '☀️ Tomorrow', value: 'tomorrow' as const, color: 'orange' },
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
            setFormData(prev => ({ ...prev, categoryIds: values }));
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

        {/* When & Where - Scheduling Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
          <button
            type="button"
            onClick={() => setShowScheduling(!showScheduling)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">When & Where</h3>
            </div>
            <div className="flex items-center text-gray-500">
              <span className="text-sm mr-2">
                {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : 'No date set'}
              </span>
              {showScheduling ? 
                <ChevronDown className="w-5 h-5 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-5 h-5 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showScheduling ? 'max-h-[2000px] mt-6' : 'max-h-0'}`}>
            <div className="space-y-6">
              {/* Due Date and Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date */}
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Calendar size={16} className="inline mr-1" />
                    When is this due?
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate || ''}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                
                {/* Project */}
                <div>
                  <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Folder size={16} className="inline mr-1" />
                    Which project?
                  </label>
                  <select
                    id="project"
                    name="project"
                    value={formData.projectId || ''}
                    onChange={handleProjectChange}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  >
                    <option value="">No specific project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label htmlFor="categories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Tag size={16} className="inline mr-1" />
                  Categories <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  id="categories"
                  name="categories"
                  multiple
                  value={formData.categoryIds || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData(prev => ({ ...prev, categoryIds: values }));
                  }}
                  className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  size={Math.min(categories.length + 1, 4)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Hold Ctrl/Cmd to select multiple categories
                </p>
              </div>

              {/* Time Estimate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Clock size={16} className="inline mr-1" />
                  How long will this take?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '15 min', value: 15, desc: 'Quick task' },
                    { label: '30 min', value: 30, desc: 'Short task' },
                    { label: '1 hour', value: 60, desc: 'Medium task' },
                    { label: '2 hours', value: 120, desc: 'Long task' },
                    { label: 'Half day', value: 240, desc: 'Major task' },
                    { label: 'Full day', value: 480, desc: 'Big project' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, estimatedMinutes: option.value }))}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md ${
                        (formData.estimatedMinutes || 30) === option.value
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="number"
                    name="estimatedMinutes"
                    value={formData.estimatedMinutes || 30}
                    onChange={handleChange}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all"
                    placeholder="Custom minutes..."
                    min="5"
                    step="5"
                  />
                </div>
              </div>
            </div>
          </div>
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
              <span className="text-sm mr-2">Subtasks, etc.</span>
              {showAdvanced ? 
                <ChevronDown className="w-5 h-5 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-5 h-5 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[2000px] mt-6' : 'max-h-0'}`}>
            <div className="space-y-6">
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
            >
              {isEdit ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
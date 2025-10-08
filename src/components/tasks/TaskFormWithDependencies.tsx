import React, { useState } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import SubtaskList from './SubtaskList';
import { getTodayString, getTomorrowString, formatDateString } from '../../utils/dateUtils';
import { addDays, endOfWeek, endOfMonth, format } from 'date-fns';
import { 
  Clock,
  Calendar,
  Folder,
  FolderOpen,
  Tag,
  Link,
  Hash,
  Battery,
  Plus,
  X,
  Flame,
  Star,
  Brain,
  ChevronDown,
  ChevronRight,
  Heart,
  Zap
} from 'lucide-react';

interface TaskFormWithDependenciesProps {
  task?: Task;
  onClose: () => void;
  isEdit?: boolean;
  initialProjectId?: string | null;
  initialDate?: string | null;
}

const TaskFormWithDependencies: React.FC<TaskFormWithDependenciesProps> = ({
  task,
  onClose,
  isEdit = false,
  initialProjectId = null,
  initialDate = null,
}) => {
  const { 
    tasks, 
    projects, 
    categories, 
    addTask, 
    updateTask, 
    addTaskDependency,
    removeTaskDependency,
    addCategory 
  } = useAppContext();
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || initialDate || '');
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [projectId, setProjectId] = useState(task?.projectId || initialProjectId || '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(task?.categoryIds || []);
  // New ADHD-friendly fields
  const [urgency, setUrgency] = useState<'today' | 'tomorrow' | 'week' | 'month' | 'someday'>(task?.urgency || 'week');
  const [emotionalWeight, setEmotionalWeight] = useState<'easy' | 'neutral' | 'stressful' | 'dreading'>(task?.emotionalWeight || 'neutral');
  const [energyRequired, setEnergyRequired] = useState<'low' | 'medium' | 'high'>(task?.energyRequired || 'medium');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task?.priority || 'medium');
  const [importance, setImportance] = useState(task?.importance || 3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes || 0);
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task?.dependsOn || []);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  
  // Remove recurring fields as they're not in the Task interface
  const [subtasks, setSubtasks] = useState<string[]>(task?.subtasks || []);
  
  // Progressive disclosure state
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Get available tasks for dependencies (excluding self and tasks that would create cycles)
  const getAvailableTasksForDependency = () => {
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
  };
  
  const availableTasksForDependency = getAvailableTasksForDependency();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      title,
      description,
      dueDate: dueDate || null,
      startDate: startDate || null,
      projectId: projectId || null,
      categoryIds: selectedCategoryIds,
      urgency,
      emotionalWeight,
      energyRequired,
      priority,
      importance: Math.max(1, Math.min(5, importance)), // Ensure importance is between 1-5
      estimatedMinutes,
      tags,
    };
    
    try {
      console.log('[TaskForm] Starting task creation/update with data:', taskData);
      
      if (isEdit && task) {
        console.log('[TaskForm] Updating existing task');
        await updateTask({
          ...task,
          ...taskData,
        });
        
        // Update dependencies
        const oldDependencies = task.dependsOn || [];
        const toRemove = oldDependencies.filter(id => !selectedDependencies.includes(id));
        const toAdd = selectedDependencies.filter(id => !oldDependencies.includes(id));
        
        await Promise.all([
          ...toRemove.map(depId => removeTaskDependency(task.id, depId)),
          ...toAdd.map(depId => addTaskDependency(task.id, depId))
        ]);
      } else {
        console.log('[TaskForm] Creating new task');
        const newTask = await addTask(taskData);
        console.log('[TaskForm] New task created:', newTask);
        
        // Add dependencies to the new task
        if (selectedDependencies.length > 0) {
          console.log('[TaskForm] Adding dependencies:', selectedDependencies);
          await Promise.all(
            selectedDependencies.map(depId => addTaskDependency(newTask.id, depId))
          );
        }
      }
      
      console.log('[TaskForm] Task creation/update completed successfully');
      onClose();
    } catch (error) {
      console.error('[TaskForm] Error saving task:', error);
      // Show error to user
      alert(`Error saving task: ${error.message || 'Unknown error'}`);
    }
  };
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const category = await addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      
      setSelectedCategoryIds([...selectedCategoryIds, category.id]);
      setNewCategoryName('');
      setShowNewCategoryModal(false);
    } catch (error) {
      console.error('Error creating category:', error);
      // You might want to show an error message to the user here
    }
  };
  
  
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const toggleDependency = (taskId: string) => {
    if (selectedDependencies.includes(taskId)) {
      setSelectedDependencies(selectedDependencies.filter(id => id !== taskId));
    } else {
      setSelectedDependencies([...selectedDependencies, taskId]);
    }
  };
  
  return (
    <div className="max-h-[85vh] overflow-y-auto">
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add any additional details..."
              className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Due Date | Project (side by side) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project
            </label>
            <select
              id="project"
              name="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">No project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Estimate - Simplified */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-3">
            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Estimate</h3>
            {estimatedMinutes && (
              <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                {estimatedMinutes} min
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Quick Time Presets */}
            <div className="grid grid-cols-4 gap-2">
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
                    setEstimatedMinutes(option.value);
                  }}
                  className={`px-3 py-2 rounded-lg border text-center transition-colors text-sm ${
                    option.value === 0 
                      ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'
                      : (estimatedMinutes || 0) === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div>{option.label}</div>
                </button>
              ))}
            </div>
            
            {/* Custom Time Input */}
            <div>
              <input
                type="number"
                name="estimatedMinutes"
                value={estimatedMinutes || ''}
                onChange={(e) => setEstimatedMinutes(e.target.value ? parseFloat(e.target.value) : 0)}
                className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Custom minutes..."
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={selectedCategoryIds[0] || ''}
            onChange={(e) => {
              if (e.target.value === 'add-new') {
                setShowNewCategoryModal(true);
              } else {
                setSelectedCategoryIds(e.target.value ? [e.target.value] : []);
              }
            }}
            className="block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">No category</option>
            {categories && categories.map((category) => {
              return (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              );
            })}
            <option value="add-new">+ Add New Category</option>
          </select>
        </div>
        
        {/* Priority | Urgency (side by side) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Priority */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Low', value: 'low', emoji: '📋', desc: 'Can wait' },
                { label: 'Medium', value: 'medium', emoji: '⭐', desc: 'Important' },
                { label: 'High', value: 'high', emoji: '🚨', desc: 'Critical' },
                { label: 'Urgent', value: 'urgent', emoji: '🚨', desc: 'Drop everything' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPriority(option.value as 'low' | 'medium' | 'high' | 'urgent');
                    // Adjust importance score based on priority (1-5 scale)
                    const importanceMap = {
                      'low': 2,
                      'medium': 3,
                      'high': 4,
                      'urgent': 5
                    };
                    setImportance(importanceMap[option.value as keyof typeof importanceMap]);
                  }}
                  className={`p-2 rounded-lg border text-center transition-colors text-xs ${
                    priority === option.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div className="text-base mb-1">{option.emoji}</div>
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-red-500" />
              Urgency
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Today', value: 'today', emoji: '🔥', desc: 'Right now' },
                { label: 'Tomorrow', value: 'tomorrow', emoji: '☀️', desc: 'Next day' },
                { label: 'This Week', value: 'week', emoji: '📅', desc: 'Soon' },
                { label: 'This Month', value: 'month', emoji: '📌', desc: 'Later' },
                { label: 'Someday', value: 'someday', emoji: '🌊', desc: 'No rush' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setUrgency(option.value as 'today' | 'tomorrow' | 'week' | 'month' | 'someday');
                    // Set due date based on urgency selection
                    const today = new Date();
                    let newDueDate: Date | null = null;
                    
                    switch (option.value) {
                      case 'today':
                        newDueDate = today;
                        break;
                      case 'tomorrow':
                        newDueDate = addDays(today, 1);
                        break;
                      case 'week':
                        newDueDate = endOfWeek(today, { weekStartsOn: 1 }); // End of current week
                        break;
                      case 'month':
                        newDueDate = endOfMonth(today); // End of current month
                        break;
                      case 'someday':
                        newDueDate = null; // No specific date
                        break;
                    }
                    
                    if (newDueDate) {
                      setDueDate(format(newDueDate, 'yyyy-MM-dd'));
                    } else {
                      setDueDate('');
                    }
                  }}
                  className={`p-2 rounded-lg border-2 text-center transition-all duration-200 hover:shadow-lg hover:shadow-red-200/50 ${
                    urgency === option.value
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/30 shadow-lg ring-2 ring-red-200 dark:ring-red-700'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-300'
                  }`}
                >
                  <div className="text-lg mb-1">{option.emoji}</div>
                  <div className="font-semibold text-xs mb-1">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Energy Needed | Emotional Weight (side by side) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Energy Needed */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Energy Level
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Low', value: 'low', emoji: '🔋' },
                { label: 'Medium', value: 'medium', emoji: '⚡' },
                { label: 'High', value: 'high', emoji: '🚀' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setEnergyRequired(option.value as 'low' | 'medium' | 'high');
                  }}
                  className={`p-2 rounded-lg border text-center transition-colors text-xs ${
                    energyRequired === option.value
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div className="text-base mb-1">{option.emoji}</div>
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Emotional Weight */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emotional Weight
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Easy', value: 'easy', emoji: '😊' },
                { label: 'Neutral', value: 'neutral', emoji: '😐' },
                { label: 'Stressful', value: 'stressful', emoji: '😰' },
                { label: 'Dreading', value: 'dreading', emoji: '😱' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEmotionalWeight(option.value as 'easy' | 'neutral' | 'stressful' | 'dreading')}
                  className={`p-2 rounded-lg border text-center transition-colors text-xs ${
                    emotionalWeight === option.value
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div className="text-base mb-1">{option.emoji}</div>
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        
        {/* Advanced Options (collapsed by default) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              {showAdvanced ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Advanced Options
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Tags, dependencies, subtasks
            </span>
          </button>
        </div>
        
        {/* Advanced Options Content */}
        <div className={`transition-all duration-300 ${showAdvanced ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              {/* Start Date */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </h4>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Available From
                  </label>
                  <div className="flex items-center">
                    <Calendar size={18} className="text-green-400 dark:text-green-500 mr-2" />
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all sm:text-sm"
                      title="The earliest date this task can be started"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    When you can start this task - useful for tasks that can't begin until a specific date
                  </p>
                </div>
              </div>

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
                        if (newTag.trim() && !tags.includes(newTag.trim())) {
                          setTags([...tags, newTag.trim()]);
                          setNewTag('');
                        }
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim() && !tags.includes(newTag.trim())) {
                        setTags([...tags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
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
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
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
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtasks
                </h4>
                {!isEdit ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-blue-700 dark:text-blue-300 text-xs">
                    Save this task first to add subtasks
                  </div>
                ) : (
                  <SubtaskList
                    parentTaskId={task!.id}
                    existingSubtasks={subtasks}
                    onSubtasksChange={(newSubtasks) => setSubtasks(newSubtasks)}
                  />
                )}
              </div>
            </div>
          </div>
      </form>

      {/* Form Actions */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <div className="flex justify-between items-center">
          {/* Delete button (only show when editing) */}
          {isEdit && task && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  // deleteTask(task.id);
                  onClose();
                }
              }}
              className="px-4 py-2 text-sm"
            >
              Delete
            </Button>
          )}

          <div className={`flex gap-2 ${!isEdit || !task ? 'ml-auto' : ''}`}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              form="task-form"
              className="px-4 py-2 text-sm"
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskFormWithDependencies;
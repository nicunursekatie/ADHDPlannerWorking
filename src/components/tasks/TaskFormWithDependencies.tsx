import React, { useState } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
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
  const [projectId, setProjectId] = useState(task?.projectId || initialProjectId || '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(task?.categoryIds || []);
  // New ADHD-friendly fields
  const [urgency, setUrgency] = useState<'today' | 'tomorrow' | 'week' | 'month' | 'someday'>(task?.urgency || 'week');
  const [emotionalWeight, setEmotionalWeight] = useState<'easy' | 'neutral' | 'stressful' | 'dreading'>(task?.emotionalWeight || 'neutral');
  const [energyRequired, setEnergyRequired] = useState<'low' | 'medium' | 'high'>(task?.energyRequired || 'medium');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [importance, setImportance] = useState(task?.importance || 5);
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
      projectId: projectId || null,
      categoryIds: selectedCategoryIds,
      urgency,
      emotionalWeight,
      energyRequired,
      priority,
      importance,
      estimatedMinutes,
      tags,
      dependsOn: selectedDependencies,
      // Remove recurring fields
      subtasks,
    };
    
    try {
      if (isEdit && task) {
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
        const newTask = await addTask(taskData);
        
        // Add dependencies to the new task
        if (selectedDependencies.length > 0) {
          await Promise.all(
            selectedDependencies.map(depId => addTaskDependency(newTask.id, depId))
          );
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      // You might want to show an error message to the user here
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
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
      <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Title & Description */}
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              What needs to be done?
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Type your task here..."
              className="block w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all duration-200"
              required
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              More details <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Any extra details or context..."
              className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Due Date | Project (side by side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
            />
          </div>
          
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Project
            </label>
            <select
              id="project"
              name="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
            >
              <option value="">No project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Estimate - Always Visible */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">How long will this take?</h3>
            {estimatedMinutes && (
              <span className="ml-auto text-sm text-orange-600 dark:text-orange-400 font-medium">
                ~{estimatedMinutes} min
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
                    setEstimatedMinutes(option.value);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    option.value === 0 
                      ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-orange-300 hover:shadow-lg'
                      : (estimatedMinutes || 0) === option.value
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
                value={estimatedMinutes || ''}
                onChange={(e) => setEstimatedMinutes(e.target.value ? parseFloat(e.target.value) : 0)}
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

        {/* Categories */
        <div>
          <label htmlFor="category" className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            <Tag className="w-5 h-5 mr-2 text-blue-500 inline" />
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
            className="block w-full px-4 py-4 text-lg rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
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
        }
        {/* Priority | Urgency (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-500" />
              Priority
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Low', value: 'low', emoji: '📋', desc: 'Can wait' },
                { label: 'Medium', value: 'medium', emoji: '⭐', desc: 'Important' },
                { label: 'High', value: 'high', emoji: '🚨', desc: 'Critical' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPriority(option.value as 'low' | 'medium' | 'high');
                    // Adjust importance score based on priority
                    const importanceMap = {
                      'low': 2,
                      'medium': 5,
                      'high': 8
                    };
                    setImportance(importanceMap[option.value]);
                  }}
                  className={`p-2 rounded-lg border-2 text-center transition-all duration-200 hover:shadow-lg hover:shadow-purple-200/50 ${
                    priority === option.value
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 shadow-lg ring-2 ring-purple-200 dark:ring-purple-700'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300'
                  }`}
                >
                  <div className="text-lg mb-1">{option.emoji}</div>
                  <div className="font-semibold text-xs mb-1">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Energy Needed */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Energy Needed
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Low', value: 'low', emoji: '🔋', desc: 'Easy, relaxed' },
                { label: 'Medium', value: 'medium', emoji: '⚡', desc: 'Normal focus' },
                { label: 'High', value: 'high', emoji: '🚀', desc: 'Full focus' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setEnergyRequired(option.value as 'low' | 'medium' | 'high');
                  }}
                  className={`p-2 rounded-lg border-2 text-center transition-all duration-200 hover:shadow-lg hover:shadow-yellow-200/50 ${
                    energyRequired === option.value
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 shadow-lg ring-2 ring-yellow-200 dark:ring-yellow-700'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-lg mb-1">{option.emoji}</div>
                  <div className="font-semibold text-xs mb-1">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Emotional Weight */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-pink-500" />
              Emotional Weight
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Easy/Fun', value: 'easy', emoji: '😊', desc: 'Love it' },
                { label: 'Neutral', value: 'neutral', emoji: '😐', desc: 'It\'s fine' },
                { label: 'Stressful', value: 'stressful', emoji: '😰', desc: 'Hard work' },
                { label: 'Dreading', value: 'dreading', emoji: '😱', desc: 'Really hard' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEmotionalWeight(option.value as 'easy' | 'neutral' | 'stressful' | 'dreading')}
                  className={`p-2 rounded-lg border-2 text-center transition-all duration-200 hover:shadow-lg hover:shadow-pink-200/50 ${
                    emotionalWeight === option.value
                      ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/30 shadow-lg ring-2 ring-pink-200 dark:ring-pink-700'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300'
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

        
        {/* Advanced Options (collapsed by default) */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center">
              <div className="w-6 h-6 text-gray-500 mr-3">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Advanced Options</h3>
            </div>
            <div className="flex items-center text-gray-500">
              <span className="text-sm mr-2">Dependencies, tags & subtasks</span>
              {showAdvanced ? 
                <ChevronDown className="w-5 h-5 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-5 h-5 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[600px] mt-6' : 'max-h-0'}`}>
            <div className="space-y-8">
              {/* Dependencies Section */
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
              }
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
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim() && !tags.includes(newTag.trim())) {
                        setTags([...tags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
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
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2 text-blue-500" />
                  Subtasks
                </h4>
                {!isEdit ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-blue-700 dark:text-blue-300 text-sm">
                    💡 Save this task first, then you can break it down into smaller subtasks
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
                  // deleteTask(task.id);
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

export default TaskFormWithDependencies;
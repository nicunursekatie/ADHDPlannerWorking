import React, { useState } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Modal from '../common/Modal';
import Button from '../common/Button';
import SubtaskList from './SubtaskList';
import { getTodayString, getTomorrowString, formatDateString } from '../../utils/dateUtils';
import { 
  Clock,
  Calendar,
  Folder,
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
  const [urgency, setUrgency] = useState<'today' | 'week' | 'month' | 'someday'>(task?.urgency || 'week');
  const [emotionalWeight, setEmotionalWeight] = useState<'easy' | 'neutral' | 'stressful' | 'dreading'>(task?.emotionalWeight || 'neutral');
  const [energyRequired, setEnergyRequired] = useState<'low' | 'medium' | 'high'>(task?.energyRequired || 'medium');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes || 30);
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
  const [showEmotional, setShowEmotional] = useState(true);
  const [showScheduling, setShowScheduling] = useState(false);
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
      !t.dependsOn?.includes(task.id) &&
      !t.completed &&
      !t.archived
    );
  };
  
  const availableTasksForDependency = getAvailableTasksForDependency();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      projectId: projectId || null,
      categoryIds: selectedCategoryIds,
      urgency,
      emotionalWeight,
      energyRequired,
      priority,
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
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
      <form id="task-form" onSubmit={handleSubmit} className="space-y-8">
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
        
        {/* How do you feel about this? - Emotional Weight */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border-2 border-purple-100 dark:border-purple-800 shadow-lg">
          <button
            type="button"
            onClick={() => setShowEmotional(!showEmotional)}
            className="flex items-center justify-between w-full text-left group hover:bg-white/50 dark:hover:bg-black/20 rounded-2xl p-3 -m-3 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 text-2xl mr-4">💜</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">How do you feel about this?</h3>
                <p className="text-sm text-purple-600 dark:text-purple-300">Your emotional connection matters</p>
              </div>
            </div>
            <div className="flex items-center text-gray-500">
              {showEmotional ? 
                <ChevronDown className="w-6 h-6 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-6 h-6 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-500 ease-out overflow-hidden ${showEmotional ? 'max-h-96 pt-8' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Excited!', value: 'easy', emoji: '🎉', desc: 'Love doing this', color: 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40' },
                { label: 'Good vibes', value: 'neutral', emoji: '😊', desc: 'Looking forward to it', color: 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40' },
                { label: 'Ugh...', value: 'stressful', emoji: '😩', desc: 'Not feeling it', color: 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40' },
                { label: 'Dreading it', value: 'dreading', emoji: '😰', desc: 'Really don\'t want to', color: 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/40 dark:to-pink-900/40' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEmotionalWeight(option.value as 'easy' | 'neutral' | 'stressful' | 'dreading')}
                  className={`p-6 rounded-2xl border-3 text-center transition-all duration-300 hover:shadow-xl transform hover:scale-110 active:scale-95 ${
                    emotionalWeight === option.value
                      ? option.color + ' shadow-xl scale-110 ring-4 ring-purple-200 dark:ring-purple-700'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <div className="text-4xl mb-3">{option.emoji}</div>
                  <div className="font-bold text-lg mb-2">{option.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{option.desc}</div>
                </button>
              ))}
            </div>
            
            {/* Energy Required */}
            <div className="mt-8 pt-6 border-t border-purple-200 dark:border-purple-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                Energy Level Needed
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Low Energy', value: 'low', emoji: '🔋', desc: 'Easy, relaxed task' },
                  { label: 'Medium Energy', value: 'medium', emoji: '⚡', desc: 'Normal focus needed' },
                  { label: 'High Energy', value: 'high', emoji: '🚀', desc: 'Full focus required' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEnergyRequired(option.value as 'low' | 'medium' | 'high')}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                      energyRequired === option.value
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-yellow-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <div className="font-semibold text-sm mb-1">{option.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* When & Where - Scheduling */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
          <button
            type="button"
            onClick={() => setShowScheduling(!showScheduling)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center">
              <div className="w-6 h-6 text-blue-500 mr-3">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">When & Where</h3>
            </div>
            <div className="flex items-center text-gray-500">
              <span className="text-sm mr-2">Schedule & organize</span>
              {showScheduling ? 
                <ChevronDown className="w-5 h-5 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-5 h-5 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showScheduling ? 'max-h-96 mt-6' : 'max-h-0'}`}>
            <div className="space-y-6">
              {/* Due Date and Urgency */}
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
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setDueDate(getTodayString())}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        dueDate === getTodayString()
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueDate(getTomorrowString())}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        dueDate === getTomorrowString()
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        setDueDate(formatDateString(nextWeek) || '');
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all"
                    >
                      Next Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all"
                    >
                      No Date
                    </button>
                  </div>
                </div>
                
                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Flame size={16} className="inline mr-1" />
                    How urgent is this?
                  </label>
                  <div className="space-y-2">
                    {[
                      { label: 'Must do today', value: 'today', color: 'bg-red-500 hover:bg-red-600' },
                      { label: 'This week', value: 'week', color: 'bg-orange-500 hover:bg-orange-600' },
                      { label: 'This month', value: 'month', color: 'bg-yellow-500 hover:bg-yellow-600' },
                      { label: 'Someday', value: 'someday', color: 'bg-green-500 hover:bg-green-600' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setUrgency(option.value as 'today' | 'week' | 'month' | 'someday')}
                        className={`block w-full px-4 py-2 rounded-lg text-white font-medium transition-all text-left ${
                          urgency === option.value
                            ? option.color + ' shadow-lg'
                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
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
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                >
                  <option value="">No specific project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
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
                      onClick={() => setEstimatedMinutes(option.value)}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md ${
                        estimatedMinutes === option.value
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
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
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 30)}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                    placeholder="Custom minutes..."
                    min="5"
                    step="5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Categories - Convert to Dropdown */}
        <div>
          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Tag size={16} className="inline mr-1" />
            Categories <span className="text-gray-400">(optional)</span>
          </label>
          <select
            id="categories"
            name="categories"
            multiple
            value={selectedCategoryIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedCategoryIds(values);
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
              <span className="text-sm mr-2">Dependencies, tags, etc.</span>
              {showAdvanced ? 
                <ChevronDown className="w-5 h-5 transform transition-transform group-hover:scale-110" /> : 
                <ChevronRight className="w-5 h-5 transform transition-transform group-hover:scale-110" />
              }
            </div>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-96 mt-6' : 'max-h-0'}`}>
            <div className="space-y-6">
              {/* Subtasks Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Subtasks</h4>
                {!isEdit ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-blue-700 dark:text-blue-300 text-sm">
                    💡 Save this task first, then you can break it down into smaller subtasks
                  </div>
                ) : (
                  <SubtaskList
                    parentTaskId={task.id}
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
            </div>
          </label>
          <div className="space-y-2">
            {selectedDependencies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedDependencies.map(depId => {
                  const depTask = tasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  return (
                    <span
                      key={depId}
                      className="inline-flex items-center px-2 py-1 rounded text-sm bg-indigo-100 text-indigo-800"
                    >
                      {depTask.title}
                      <button
                        type="button"
                        onClick={() => toggleDependency(depId)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowDependencyModal(true)}
              className="px-3 py-1 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center"
            >
              <Plus size={14} className="mr-1" />
              Add Dependency
            </button>
          </div>
        </div>
        
        {/* ADHD-Friendly Task Properties - Compact Layout */}
        <div className="space-y-3">
          {/* Priority and Urgency Row */}
          <div className="grid grid-cols-1 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Star size={14} className="inline mr-1" />
                Priority
              </label>
              <div className="flex gap-1">
                {[
                  { label: '🌱', text: 'Low', value: 'low' as const },
                  { label: '🔶', text: 'Medium', value: 'medium' as const },
                  { label: '🔴', text: 'High', value: 'high' as const },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`flex-1 px-2 py-2 rounded text-sm font-bold border transition-all focus:outline-none ${
                      priority === option.value
                        ? option.value === 'high'
                        ? 'bg-red-500 text-white border-red-500'
                        : option.value === 'medium'
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    title={`${option.label} ${option.text}`}
                  >
                    <span className="text-lg">{option.label}</span>
                    <span className="block text-sm font-bold">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Flame size={14} className="inline mr-1" />
                Urgency
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: '🔥', text: 'Today', value: 'today' as const, color: 'red' },
                  { label: '📅', text: 'Week', value: 'week' as const, color: 'orange' },
                  { label: '📌', text: 'Month', value: 'month' as const, color: 'yellow' },
                  { label: '🌊', text: 'Someday', value: 'someday' as const, color: 'blue' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUrgency(option.value)}
                    className={`px-2 py-2 rounded text-sm font-bold border transition-all focus:outline-none ${
                      urgency === option.value
                        ? option.color === 'red' ? 'bg-red-500 text-white border-red-500'
                        : option.color === 'orange' ? 'bg-orange-500 text-white border-orange-500'
                        : option.color === 'yellow' ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    title={`${option.label} ${option.text}`}
                  >
                    <span className="text-lg">{option.label}</span>
                    <span className="block text-sm font-bold">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Energy and Emotional Weight Row */}
          <div className="grid grid-cols-1 gap-3">
            {/* Energy Needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Battery size={14} className="inline mr-1" />
                Energy Needed
              </label>
              <div className="flex gap-1">
                {[
                  { label: '🔋', text: 'Low', value: 'low' as const },
                  { label: '🔋🔋', text: 'Med', value: 'medium' as const },
                  { label: '🔋🔋🔋', text: 'High', value: 'high' as const },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEnergyRequired(option.value)}
                    className={`flex-1 px-2 py-2 rounded text-sm font-bold border transition-all focus:outline-none ${
                      energyRequired === option.value
                        ? 'bg-green-500 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                    }`}
                    title={`Energy: ${option.text}`}
                  >
                    <span className="text-base">{option.label}</span>
                    <span className="block text-sm font-bold">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emotional Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Brain size={14} className="inline mr-1" />
                Emotional Weight
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: '😊', text: 'Easy', value: 'easy' as const, color: 'green' },
                  { label: '😐', text: 'OK', value: 'neutral' as const, color: 'yellow' },
                  { label: '😰', text: 'Hard', value: 'stressful' as const, color: 'orange' },
                  { label: '😱', text: 'Dread', value: 'dreading' as const, color: 'red' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEmotionalWeight(option.value)}
                    className={`px-2 py-2 rounded text-sm font-bold border transition-all focus:outline-none ${
                      emotionalWeight === option.value
                        ? option.value === 'easy' ? 'bg-green-500 text-white border-green-600'
                        : option.value === 'neutral' ? 'bg-yellow-500 text-white border-yellow-600'
                        : option.value === 'stressful' ? 'bg-orange-500 text-white border-orange-600'
                        : 'bg-red-500 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    title={`${option.label} ${option.text}`}
                  >
                    <span className="text-lg">{option.label}</span>
                    <span className="block text-sm font-bold">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Estimated Time */}
        <div>
          <label htmlFor="estimatedMinutes" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center">
              <Clock size={16} className="mr-1" />
              Estimated Time (minutes)
            </div>
          </label>
          <input
            type="number"
            id="estimatedMinutes"
            name="estimatedMinutes"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
            min="0"
            step="15"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Hash size={16} className="mr-1" />
              Tags
            </div>
          </label>
          <div className="space-y-2">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded text-sm bg-gray-100 text-gray-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-r-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* Subtasks */}
        {isEdit && task && (
          <div className="pt-4">
            <SubtaskList
              parentTaskId={task.id}
              existingSubtasks={subtasks}
              onSubtasksChange={setSubtasks}
            />
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
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
      </form>
      
      {/* New Category Modal */}
      <Modal
        isOpen={showNewCategoryModal}
        onClose={() => setShowNewCategoryModal(false)}
        title="Create New Category"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
              Category Name
            </label>
            <input
              type="text"
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <input
              type="color"
              id="categoryColor"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowNewCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCategory}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Dependency Selection Modal */}
      <Modal
        isOpen={showDependencyModal}
        onClose={() => setShowDependencyModal(false)}
        title="Select Dependencies"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select tasks that must be completed before this task can be started.
          </p>
          <div className="max-h-96 overflow-y-auto">
            {availableTasksForDependency.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No available tasks for dependencies</p>
            ) : (
              <div className="space-y-2">
                {availableTasksForDependency.map(depTask => (
                  <label
                    key={depTask.id}
                    className="flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDependencies.includes(depTask.id)}
                      onChange={() => toggleDependency(depTask.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{depTask.title}</p>
                      {depTask.projectId && (
                        <p className="text-xs text-gray-500">
                          {projects.find(p => p.id === depTask.projectId)?.name}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setShowDependencyModal(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TaskFormWithDependencies;
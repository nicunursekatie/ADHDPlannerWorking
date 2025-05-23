import React, { useState, useEffect } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import SubtaskList from './SubtaskList';
import { formatDateForHtml } from '../../utils/helpers';
import { 
  Clock,
  Calendar,
  Flag,
  Zap,
  Folder,
  Tag,
  Link,
  Hash,
  Battery,
  Plus,
  X 
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
    getTaskDependencies,
    addCategory 
  } = useAppContext();
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || initialDate || '');
  const [projectId, setProjectId] = useState(task?.projectId || initialProjectId || '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(task?.categoryIds || []);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>(task?.energyLevel || 'medium');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>(task?.size || 'medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes || 30);
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task?.dependsOn || []);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'custom'>(task?.recurrencePattern || 'none');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(task?.recurrenceInterval || 1);
  const [subtasks, setSubtasks] = useState<string[]>(task?.subtasks || []);
  
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      projectId: projectId || null,
      categoryIds: selectedCategoryIds,
      priority,
      energyLevel,
      size,
      estimatedMinutes,
      tags,
      dependsOn: selectedDependencies,
      isRecurring,
      recurrencePattern,
      recurrenceInterval,
      subtasks,
    };
    
    if (isEdit && task) {
      updateTask({
        ...task,
        ...taskData,
      });
      
      // Update dependencies
      const oldDependencies = task.dependsOn || [];
      const toRemove = oldDependencies.filter(id => !selectedDependencies.includes(id));
      const toAdd = selectedDependencies.filter(id => !oldDependencies.includes(id));
      
      toRemove.forEach(depId => removeTaskDependency(task.id, depId));
      toAdd.forEach(depId => addTaskDependency(task.id, depId));
    } else {
      const newTask = addTask(taskData);
      
      // Add dependencies to the new task
      selectedDependencies.forEach(depId => addTaskDependency(newTask.id, depId));
    }
    
    onClose();
  };
  
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const category = addCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });
    
    setSelectedCategoryIds([...selectedCategoryIds, category.id]);
    setNewCategoryName('');
    setShowNewCategoryModal(false);
  };
  
  const toggleCategorySelection = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
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
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            autoFocus
          />
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        {/* Due Date & Project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                Due Date
              </div>
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Folder size={16} className="mr-1" />
                Project
              </div>
            </label>
            <select
              id="project"
              name="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">No project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Repeat/Recurrence Button Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
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
                onClick={() => {
                  setIsRecurring(option.value !== 'none');
                  setRecurrencePattern(option.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'custom');
                  setRecurrenceInterval(option.value === 'custom' ? 1 : 1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors focus:outline-none ${
                  (recurrencePattern || 'none') === option.value
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-amber-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Tag size={16} className="mr-1" />
              Categories
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategorySelection(category.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedCategoryIds.includes(category.id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNewCategoryModal(true)}
              className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center"
            >
              <Plus size={14} className="mr-1" />
              New
            </button>
          </div>
        </div>
        
        {/* Dependencies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Link size={16} className="mr-1" />
              Dependencies
            </div>
          </label>
          <div className="space-y-2">
            {selectedDependencies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedDependencies.map(depId => {
                  const depTask = tasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  return (
                    <Badge
                      key={depId}
                      text={depTask.title}
                      bgColor="#E0E7FF"
                      textColor="#4F46E5"
                      onRemove={() => toggleDependency(depId)}
                    />
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
        
        {/* Task Properties */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Flag size={16} className="mr-1" />
                Priority
              </div>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Battery size={16} className="mr-1" />
                Energy Level
              </div>
            </label>
            <select
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value as 'low' | 'medium' | 'high')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Zap size={16} className="mr-1" />
                Size
              </div>
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
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
                  <Badge
                    key={tag}
                    text={tag}
                    bgColor="#F3F4F6"
                    textColor="#374151"
                    onRemove={() => removeTag(tag)}
                  />
                ))}
              </div>
            )}
            <div className="flex">
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
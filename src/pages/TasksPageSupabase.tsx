import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContextSupabase';
import { Task } from '../types';
import { TaskDisplay } from '../components/TaskDisplay';
import TaskFormWithDependencies from '../components/tasks/TaskFormWithDependencies';
import AITaskBreakdown from '../components/tasks/AITaskBreakdown';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Empty from '../components/common/Empty';
import { QuickCapture } from '../components/tasks/QuickCapture';
import { 
  Plus, Filter, X, Undo2, Archive, 
  AlertTriangle, CalendarDays, Calendar, Layers, 
  Trash2, CheckCircle2, Folder, FileArchive,
  ArrowUpDown, Clock, Star, Hash, FolderOpen, Tag
} from 'lucide-react';
import { formatDate, getOverdueTasks, getTasksDueToday, getTasksDueThisWeek } from '../utils/helpers';

interface BulkTaskCardProps {
  task: Task;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onBreakdown?: (task: Task) => void;
}

const BulkTaskCard: React.FC<BulkTaskCardProps> = ({ 
  task, 
  isSelected, 
  onSelectChange,
  onEdit,
  onDelete,
  onBreakdown
}) => {
  const { updateTask } = useAppContext();
  
  return (
    <div className="relative">
      {/* Selection checkbox for bulk operations */}
      <div className="absolute left-2 top-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
      </div>
      
      {/* Task Card - offset to make room for checkbox */}
      <div className="ml-6">
        <TaskDisplay
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onBreakdown={onBreakdown}
        />
      </div>
    </div>
  );
};

export const TasksPageSupabase: React.FC = () => {
  const location = useLocation();
  const { 
    tasks, 
    projects, 
    categories, 
    addTask, 
    updateTask, 
    deleteTask,
    isLoading 
  } = useAppContext();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [aiBreakdownTask, setAiBreakdownTask] = useState<Task | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'completed' | 'active' | 'overdue' | 'today' | 'week' | 'project' | 'category' | 'archived'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'alphabetical' | 'energy' | 'estimated'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  
  // Bulk operations state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Auto-focus for quick capture
  const quickCaptureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get('tab');
    if (tab) {
      setFilterBy(tab as typeof filterBy);
    }
  }, [location]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading tasks...</div>
        </div>
      </div>
    );
  }

  // Filter and sort tasks
  let filteredTasks = tasks.filter(task => {
    if (filterBy === 'all') return !task.archived && !task.deletedAt;
    if (filterBy === 'completed') return task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'active') return !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'archived') return task.archived && !task.deletedAt;
    if (filterBy === 'overdue') return getOverdueTasks([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'today') return getTasksDueToday([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'week') return getTasksDueThisWeek([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'project') return task.projectId === selectedProject && !task.archived && !task.deletedAt;
    if (filterBy === 'category') return task.categoryIds?.includes(selectedCategory) && !task.archived && !task.deletedAt;
    return true;
  });

  // Sort tasks
  filteredTasks.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
        break;
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        comparison = priorityB - priorityA; // High priority first
        break;
      case 'created':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'alphabetical':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'energy':
        const energyOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const energyA = energyOrder[a.energyLevel as keyof typeof energyOrder] || 0;
        const energyB = energyOrder[b.energyLevel as keyof typeof energyOrder] || 0;
        comparison = energyB - energyA;
        break;
      case 'estimated':
        comparison = (a.estimatedMinutes || 0) - (b.estimatedMinutes || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleAddTask = async (task: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: task.title || '',
      description: task.description || '',
      completed: false,
      archived: false,
      dueDate: task.dueDate || null,
      projectId: task.projectId || null,
      categoryIds: task.categoryIds || [],
      parentTaskId: task.parentTaskId || null,
      subtasks: [],
      dependsOn: [],
      dependedOnBy: [],
      priority: task.priority,
      energyLevel: task.energyLevel,
      size: task.size,
      estimatedMinutes: task.estimatedMinutes,
      tags: task.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addTask(newTask);
      setShowTaskForm(false);
      setShowQuickCapture(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleEditTask = async (updates: Partial<Task>) => {
    if (!editingTask) return;
    
    try {
      await updateTask(editingTask.id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setEditingTask(null);
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAIBreakdown = (task: Task) => {
    setAiBreakdownTask(task);
    setShowAIBreakdown(true);
  };

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    const allTaskIds = new Set(filteredTasks.map(task => task.id));
    setSelectedTasks(allTaskIds);
    setShowBulkActions(allTaskIds.size > 0);
  };

  const handleDeselectAll = () => {
    setSelectedTasks(new Set());
    setShowBulkActions(false);
  };

  const handleBulkComplete = async () => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId =>
          updateTask(taskId, { completed: true, updatedAt: new Date().toISOString() })
        )
      );
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk completing tasks:', error);
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId =>
          updateTask(taskId, { archived: true, updatedAt: new Date().toISOString() })
        )
      );
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk archiving tasks:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId => deleteTask(taskId))
      );
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
    }
  };

  const handleBulkCategoryAssign = async (categoryId: string) => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            const newCategoryIds = task.categoryIds?.includes(categoryId) 
              ? task.categoryIds 
              : [...(task.categoryIds || []), categoryId];
            return updateTask(taskId, { 
              categoryIds: newCategoryIds,
              updatedAt: new Date().toISOString() 
            });
          }
          return Promise.resolve();
        })
      );
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk assigning category:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowQuickCapture(!showQuickCapture)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
          <Button
            onClick={() => setShowTaskForm(true)}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Quick Capture */}
      {showQuickCapture && (
        <Card className="mb-6 p-4">
          <QuickCapture
            onAdd={handleAddTask}
            ref={quickCaptureRef}
            onCancel={() => setShowQuickCapture(false)}
          />
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterBy('all')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All ({tasks.filter(t => !t.archived && !t.deletedAt).length})
            </button>
            <button
              onClick={() => setFilterBy('active')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Active ({tasks.filter(t => !t.completed && !t.archived && !t.deletedAt).length})
            </button>
            <button
              onClick={() => setFilterBy('completed')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Completed ({tasks.filter(t => t.completed && !t.archived && !t.deletedAt).length})
            </button>
            <button
              onClick={() => setFilterBy('overdue')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'overdue' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Overdue ({getOverdueTasks(tasks.filter(t => !t.completed && !t.archived && !t.deletedAt)).length})
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Created</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="energy">Energy Level</option>
              <option value="estimated">Estimated Time</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {filteredTasks.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                Select All
              </Button>
              {selectedTasks.size > 0 && (
                <Button onClick={handleDeselectAll} variant="outline" size="sm">
                  Deselect All
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && (
        <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button onClick={handleBulkComplete} variant="outline" size="sm">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Complete
              </Button>
              <Button onClick={handleBulkArchive} variant="outline" size="sm">
                <Archive className="w-4 h-4 mr-1" />
                Archive
              </Button>
              <select
                onChange={(e) => e.target.value && handleBulkCategoryAssign(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="">Add Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button onClick={handleBulkDelete} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Empty 
            message="No tasks found" 
            actionLabel="Add your first task"
            onAction={() => setShowTaskForm(true)}
          />
        ) : (
          filteredTasks.map(task => (
            <BulkTaskCard
              key={task.id}
              task={task}
              isSelected={selectedTasks.has(task.id)}
              onSelectChange={(selected) => handleTaskSelect(task.id, selected)}
              onEdit={(task) => {
                setEditingTask(task);
                setShowTaskForm(true);
              }}
              onDelete={handleDeleteTask}
              onBreakdown={handleAIBreakdown}
            />
          ))
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <Modal
          title={editingTask ? 'Edit Task' : 'Add New Task'}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        >
          <TaskFormWithDependencies
            task={editingTask}
            onSubmit={editingTask ? handleEditTask : handleAddTask}
            onCancel={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}
          />
        </Modal>
      )}

      {/* AI Breakdown Modal */}
      {showAIBreakdown && aiBreakdownTask && (
        <Modal
          title={`AI Task Breakdown: ${aiBreakdownTask.title}`}
          onClose={() => {
            setShowAIBreakdown(false);
            setAiBreakdownTask(null);
          }}
        >
          <AITaskBreakdown
            task={aiBreakdownTask}
            onTasksGenerated={(generatedTasks) => {
              generatedTasks.forEach(task => handleAddTask(task));
              setShowAIBreakdown(false);
              setAiBreakdownTask(null);
            }}
            onCancel={() => {
              setShowAIBreakdown(false);
              setAiBreakdownTask(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default TasksPageSupabase;
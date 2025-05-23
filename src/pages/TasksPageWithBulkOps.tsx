import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
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
  Trash2, CheckCircle2, Folder, FileArchive, RotateCcw
} from 'lucide-react';
import { formatDate, getOverdueTasks, getTasksDueToday, getTasksDueThisWeek } from '../utils/helpers';
import { DeletedTask, getDeletedTasks, restoreDeletedTask, permanentlyDeleteTask } from '../utils/localStorage';

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
      
      {/* Task display with padding for checkbox */}
      <div className={isSelected ? 'ml-8' : 'ml-8'}>
        <TaskDisplay
          task={task}
          onToggle={() => updateTask({ ...task, completed: !task.completed })}
          onEdit={onEdit}
          onDelete={onDelete}
          onBreakdown={onBreakdown}
        />
      </div>
    </div>
  );
};

const TasksPageWithBulkOps: React.FC = () => {
  const location = useLocation();
  const { 
    tasks, 
    projects, 
    categories, 
    deleteTask, 
    undoDelete, 
    hasRecentlyDeleted, 
    archiveCompletedTasks,
    bulkDeleteTasks,
    bulkCompleteTasks,
    bulkMoveTasks,
    bulkArchiveTasks,
    bulkAddTasks,
    bulkConvertToSubtasks
  } = useAppContext();
  
  // Get initial tab from URL query params
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') as 'today' | 'tomorrow' | 'week' | 'overdue' | 'all' | null;
  const initialTab = tabParam || 'today';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [selectedProjectForMove, setSelectedProjectForMove] = useState<string | null>(null);
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null);
  const [showConvertToSubtasksModal, setShowConvertToSubtasksModal] = useState(false);
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string | null>(null);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  
  // Filter state
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // View state
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'overdue' | 'all' | 'deleted'>(initialTab);
  
  // Show undo notification when a task is deleted
  useEffect(() => {
    if (hasRecentlyDeleted) {
      setShowUndoNotification(true);
      const timer = setTimeout(() => {
        setShowUndoNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasRecentlyDeleted]);
  
  // Load deleted tasks when tab changes
  useEffect(() => {
    if (activeTab === 'deleted') {
      loadDeletedTasks();
    }
  }, [activeTab]);
  
  const loadDeletedTasks = () => {
    const deleted = getDeletedTasks();
    setDeletedTasks(deleted.sort((a, b) => 
      new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    ));
  };
  
  const handleRestoreTask = (taskId: string) => {
    const restoredTask = restoreDeletedTask(taskId);
    if (restoredTask) {
      loadDeletedTasks();
      // The context will automatically update with the restored task
    }
  };
  
  const handlePermanentlyDeleteTask = (taskId: string) => {
    permanentlyDeleteTask(taskId);
    loadDeletedTasks();
  };
  
  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };
  
  const handleUndo = () => {
    undoDelete();
    setShowUndoNotification(false);
  };
  
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  const clearFilters = () => {
    setShowCompleted(false);
    setShowArchived(false);
    setFilterProjectId(null);
    setFilterCategoryId(null);
  };

  const handleArchiveConfirmOpen = () => {
    const completedTasks = tasks.filter(task => task.completed && !task.archived);
    if (completedTasks.length > 0) {
      setShowArchiveConfirm(true);
    }
  };

  const handleArchiveConfirmClose = () => {
    setShowArchiveConfirm(false);
  };

  const handleArchiveCompleted = () => {
    archiveCompletedTasks();
    setShowArchiveConfirm(false);
  };
  
  const handleBreakdown = (task: Task) => {
    setBreakdownTask(task);
  };
  
  const handleBreakdownAccept = async (subtasks: Partial<Task>[]) => {
    if (breakdownTask) {

      // Prepare all subtasks with parentTaskId and other inherited fields
      const preparedSubtasks = subtasks.map((subtask) => ({
        ...subtask,
        parentTaskId: breakdownTask.id,
        projectId: breakdownTask.projectId,
        categoryIds: breakdownTask.categoryIds || [],
        dueDate: subtask.dueDate || breakdownTask.dueDate || null,
        priority: subtask.priority || breakdownTask.priority || 'medium',
        energyLevel: subtask.energyLevel || breakdownTask.energyLevel,
        estimatedMinutes: subtask.estimatedMinutes,
        tags: subtask.tags || [],
      }));

      bulkAddTasks(preparedSubtasks);

      setBreakdownTask(null);
    }
  };
  
  const handleBreakdownClose = () => {
    setBreakdownTask(null);
  };
  
  // Bulk operations
  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };
  
  const selectAllVisibleTasks = () => {
    const visibleTaskIds = new Set(getActiveTaskList().map(task => task.id));
    setSelectedTasks(visibleTaskIds);
  };
  
  const deselectAllTasks = () => {
    setSelectedTasks(new Set());
  };
  
  const handleBulkDelete = () => {
    if (selectedTasks.size > 0) {
      bulkDeleteTasks(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
  };
  
  const handleBulkComplete = () => {
    if (selectedTasks.size > 0) {
      bulkCompleteTasks(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
  };
  
  const handleBulkMove = () => {
    setShowBulkMoveModal(true);
  };
  
  const executeBulkMove = () => {
    if (selectedTasks.size > 0) {
      bulkMoveTasks(Array.from(selectedTasks), selectedProjectForMove);
      setSelectedTasks(new Set());
      setShowBulkMoveModal(false);
      setSelectedProjectForMove(null);
    }
  };
  
  const handleBulkArchive = () => {
    if (selectedTasks.size > 0) {
      bulkArchiveTasks(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
  };
  
  const handleBulkConvertToSubtasks = () => {
    setShowConvertToSubtasksModal(true);
  };
  
  const executeBulkConvertToSubtasks = () => {
    if (selectedTasks.size > 0 && selectedParentTaskId) {
      bulkConvertToSubtasks(Array.from(selectedTasks), selectedParentTaskId);
      setSelectedTasks(new Set());
      setShowConvertToSubtasksModal(false);
      setSelectedParentTaskId(null);
    }
  };
  
  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  };
  
  // Get tasks due tomorrow
  const getTasksDueTomorrow = (tasks: Task[]): Task[] => {
    const tomorrowDate = getTomorrowDate();
    return tasks.filter(task => 
      task.dueDate === tomorrowDate && 
      !task.completed && 
      !task.archived
    );
  };
  
  // Filter tasks based on global filters (project, category)
  const applyBaseFilter = (task: Task): boolean => {
    if (filterProjectId && task.projectId !== filterProjectId) {
      return false;
    }
    
    if (filterCategoryId && !(task.categoryIds?.includes(filterCategoryId) || false)) {
      return false;
    }
    
    return true;
  };
  
  // Get tasks for each section
  const overdueTasks = getOverdueTasks(tasks)
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const todayTasks = getTasksDueToday(tasks)
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const tomorrowTasks = getTasksDueTomorrow(tasks)
    .filter(applyBaseFilter);
    
  const thisWeekTasks = getTasksDueThisWeek(tasks)
    .filter(task => 
      task.dueDate !== formatDate(new Date()) && 
      task.dueDate !== getTomorrowDate()
    )
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const otherTasks = tasks.filter(task => 
    (showCompleted || !task.completed) &&
    (showArchived || !task.archived) &&
    (!task.dueDate || 
      (!overdueTasks.some(t => t.id === task.id) && 
       !todayTasks.some(t => t.id === task.id) && 
       !tomorrowTasks.some(t => t.id === task.id) && 
       !thisWeekTasks.some(t => t.id === task.id))
    )
  ).filter(applyBaseFilter);
  
  // Get currently active task list based on the selected tab
  const getActiveTaskList = (): Task[] => {
    switch (activeTab) {
      case 'today':
        return todayTasks;
      case 'tomorrow':
        return tomorrowTasks;
      case 'week':
        return thisWeekTasks;
      case 'overdue':
        return overdueTasks;
      case 'all':
        return [...overdueTasks, ...todayTasks, ...tomorrowTasks, ...thisWeekTasks, ...otherTasks];
      default:
        return todayTasks;
    }
  };
  
  const activeTaskList = getActiveTaskList();
  const parentTasks = activeTaskList.filter(task => !task.parentTaskId);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {activeTaskList.length} task{activeTaskList.length !== 1 ? 's' : ''}
            {(filterProjectId || filterCategoryId) && ' (filtered)'}
            {selectedTasks.size > 0 && ` • ${selectedTasks.size} selected`}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button
            variant={showBulkActions ? "secondary" : "outline"}
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            {showBulkActions ? 'Hide Bulk Actions' : 'Bulk Actions'}
          </Button>
          <Button
            variant="secondary"
            icon={<Archive size={16} />}
            onClick={handleArchiveConfirmOpen}
          >
            Archive Completed
          </Button>
          <Button
            variant="secondary"
            icon={<Filter size={16} />}
            onClick={toggleFilter}
          >
            Filter
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenModal()}
          >
            New Task
          </Button>
        </div>
      </div>
      
      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="bg-indigo-50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllVisibleTasks}
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={deselectAllTasks}
              >
                Deselect All
              </Button>
              <span className="text-sm text-gray-600">
                {selectedTasks.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                icon={<CheckCircle2 size={14} />}
                onClick={handleBulkComplete}
                disabled={selectedTasks.size === 0}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<Folder size={14} />}
                onClick={handleBulkMove}
                disabled={selectedTasks.size === 0}
              >
                Move
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<Layers size={14} />}
                onClick={handleBulkConvertToSubtasks}
                disabled={selectedTasks.size === 0}
              >
                Make Subtasks
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<FileArchive size={14} />}
                onClick={handleBulkArchive}
                disabled={selectedTasks.size === 0}
              >
                Archive
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={handleBulkDelete}
                disabled={selectedTasks.size === 0}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Quick Task Input */}
      <div className="mb-6">
        <QuickCapture 
          placeholder="Add a task quickly... (try !today, !tomorrow, !high)"
          defaultProjectId={filterProjectId}
          onTaskAdded={() => {
            if (activeTab === 'today') {
              // Stay on today tab
            } else if (activeTab === 'all') {
              // Stay on all tab
            } else {
              setActiveTab('all');
            }
          }}
        />
      </div>
      
      {/* Tab navigation */}
      <div className="overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
        <div className="flex min-w-max border-b border-gray-200">
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'today' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('today')}
          >
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span className="whitespace-nowrap">Today{todayTasks.length > 0 && ` (${todayTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'tomorrow' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('tomorrow')}
          >
            <div className="flex items-center space-x-2">
              <CalendarDays size={16} />
              <span className="whitespace-nowrap">Tomorrow{tomorrowTasks.length > 0 && ` (${tomorrowTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'week' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('week')}
          >
            <div className="flex items-center space-x-2">
              <CalendarDays size={16} />
              <span className="whitespace-nowrap">This Week{thisWeekTasks.length > 0 && ` (${thisWeekTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'overdue' 
                ? 'border-red-500 text-red-600 bg-red-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overdue')}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className={overdueTasks.length > 0 ? 'text-red-500' : ''} />
              <span className="whitespace-nowrap">Overdue{overdueTasks.length > 0 && ` (${overdueTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <div className="flex items-center space-x-2">
              <Layers size={16} />
              <span className="whitespace-nowrap">All Tasks</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'deleted' 
                ? 'border-gray-500 text-gray-600 bg-gray-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('deleted')}
          >
            <div className="flex items-center space-x-2">
              <Trash2 size={16} />
              <span className="whitespace-nowrap">Deleted</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Add CSS for hiding scrollbar but allowing scroll */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari, Opera */
        }
      `}</style>
      
      {/* Undo notification */}
      {showUndoNotification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-3 z-50">
          <span>Task deleted</span>
          <Button
            variant="secondary"
            size="sm"
            icon={<Undo2 size={14} />}
            onClick={handleUndo}
          >
            Undo
          </Button>
        </div>
      )}
      
      {/* Filter panel - same as before */}
      {isFilterOpen && (
        <Card className="bg-gray-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={toggleFilter}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Status
                </label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showCompleted"
                      checked={showCompleted}
                      onChange={() => setShowCompleted(!showCompleted)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="showCompleted" className="ml-2 text-sm text-gray-700">
                      Show completed tasks
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showArchived"
                      checked={showArchived}
                      onChange={() => setShowArchived(!showArchived)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="showArchived" className="ml-2 text-sm text-gray-700">
                      Show archived tasks
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="projectFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  id="projectFilter"
                  value={filterProjectId || ''}
                  onChange={(e) => setFilterProjectId(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="categoryFilter"
                  value={filterCategoryId || ''}
                  onChange={(e) => setFilterCategoryId(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Task list */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="space-y-4">
          {parentTasks.length > 0 ? (
            <div>
              {activeTab === 'all' ? (
                <div className="space-y-6">
                  {overdueTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-red-600 mb-3 flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        Overdue
                      </h3>
                      <div className="space-y-2">
                        {overdueTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <BulkTaskCard
                              key={task.id}
                              task={task}
                              isSelected={selectedTasks.has(task.id)}
                              onSelectChange={(selected) => {
                                if (selected) {
                                  toggleTaskSelection(task.id);
                                } else {
                                  const newSelection = new Set(selectedTasks);
                                  newSelection.delete(task.id);
                                  setSelectedTasks(newSelection);
                                }
                              }}
                              onEdit={handleOpenModal}
                              onDelete={handleDeleteTask}
                              onBreakdown={handleBreakdown}
                            />
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {todayTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <Calendar size={16} className="mr-2" />
                        Today
                      </h3>
                      <div className="space-y-2">
                        {todayTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <BulkTaskCard
                              key={task.id}
                              task={task}
                              isSelected={selectedTasks.has(task.id)}
                              onSelectChange={(selected) => {
                                if (selected) {
                                  toggleTaskSelection(task.id);
                                } else {
                                  const newSelection = new Set(selectedTasks);
                                  newSelection.delete(task.id);
                                  setSelectedTasks(newSelection);
                                }
                              }}
                              onEdit={handleOpenModal}
                              onDelete={handleDeleteTask}
                              onBreakdown={handleBreakdown}
                            />
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {tomorrowTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <CalendarDays size={16} className="mr-2" />
                        Tomorrow
                      </h3>
                      <div className="space-y-2">
                        {tomorrowTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <BulkTaskCard
                              key={task.id}
                              task={task}
                              isSelected={selectedTasks.has(task.id)}
                              onSelectChange={(selected) => {
                                if (selected) {
                                  toggleTaskSelection(task.id);
                                } else {
                                  const newSelection = new Set(selectedTasks);
                                  newSelection.delete(task.id);
                                  setSelectedTasks(newSelection);
                                }
                              }}
                              onEdit={handleOpenModal}
                              onDelete={handleDeleteTask}
                              onBreakdown={handleBreakdown}
                            />
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {thisWeekTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <CalendarDays size={16} className="mr-2" />
                        This Week
                      </h3>
                      <div className="space-y-2">
                        {thisWeekTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <BulkTaskCard
                              key={task.id}
                              task={task}
                              isSelected={selectedTasks.has(task.id)}
                              onSelectChange={(selected) => {
                                if (selected) {
                                  toggleTaskSelection(task.id);
                                } else {
                                  const newSelection = new Set(selectedTasks);
                                  newSelection.delete(task.id);
                                  setSelectedTasks(newSelection);
                                }
                              }}
                              onEdit={handleOpenModal}
                              onDelete={handleDeleteTask}
                              onBreakdown={handleBreakdown}
                            />
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {otherTasks.filter(t => !t.parentTaskId).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                        <Layers size={16} className="mr-2" />
                        Other Tasks
                      </h3>
                      <div className="space-y-2">
                        {otherTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <BulkTaskCard
                              key={task.id}
                              task={task}
                              isSelected={selectedTasks.has(task.id)}
                              onSelectChange={(selected) => {
                                if (selected) {
                                  toggleTaskSelection(task.id);
                                } else {
                                  const newSelection = new Set(selectedTasks);
                                  newSelection.delete(task.id);
                                  setSelectedTasks(newSelection);
                                }
                              }}
                              onEdit={handleOpenModal}
                              onDelete={handleDeleteTask}
                              onBreakdown={handleBreakdown}
                            />
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {parentTasks.map(task => (
                    <BulkTaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTasks.has(task.id)}
                      onSelectChange={(selected) => {
                        if (selected) {
                          toggleTaskSelection(task.id);
                        } else {
                          const newSelection = new Set(selectedTasks);
                          newSelection.delete(task.id);
                          setSelectedTasks(newSelection);
                        }
                      }}
                      onEdit={handleOpenModal}
                      onDelete={handleDeleteTask}
                      onBreakdown={handleBreakdown}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Empty
              title="No tasks found"
              description={
                filterProjectId || filterCategoryId
                  ? "Try adjusting your filters or create a new task"
                  : activeTab === 'today'
                    ? "No tasks due today. Add a task or check another tab."
                    : activeTab === 'tomorrow'
                      ? "No tasks due tomorrow. Add a task or check another tab."
                      : activeTab === 'week'
                        ? "No tasks due this week. Add a task or check another tab."
                        : activeTab === 'overdue'
                          ? "No overdue tasks. You're all caught up!"
                          : "Get started by creating your first task"
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => handleOpenModal()}
                >
                  New Task
                </Button>
              }
            />
          )}
        </div>
      </div>
      
      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="lg"
      >
        <TaskFormWithDependencies
          task={editingTask || undefined}
          onClose={handleCloseModal}
          isEdit={!!editingTask}
        />
      </Modal>
      
      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveConfirm}
        onClose={handleArchiveConfirmClose}
        title="Archive Completed Tasks"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will archive all completed tasks. Archived tasks will be hidden by default but can still be viewed using the filter.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleArchiveConfirmClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Archive size={16} />}
              onClick={handleArchiveCompleted}
            >
              Archive Tasks
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Bulk Move Modal */}
      <Modal
        isOpen={showBulkMoveModal}
        onClose={() => setShowBulkMoveModal(false)}
        title="Move Selected Tasks"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Move {selectedTasks.size} selected task{selectedTasks.size !== 1 ? 's' : ''} to:
          </p>
          <select
            value={selectedProjectForMove || ''}
            onChange={(e) => setSelectedProjectForMove(e.target.value || null)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">No Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowBulkMoveModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Folder size={16} />}
              onClick={executeBulkMove}
            >
              Move Tasks
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* AI Breakdown Modal */}
      {breakdownTask && (
        <AITaskBreakdown
          task={breakdownTask}
          onAccept={handleBreakdownAccept}
          onClose={handleBreakdownClose}
        />
      )}
      
      {/* Convert to Subtasks Modal */}
      <Modal
        isOpen={showConvertToSubtasksModal}
        onClose={() => {
          setShowConvertToSubtasksModal(false);
          setSelectedParentTaskId(null);
        }}
        title="Convert to Subtasks"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Convert {selectedTasks.size} selected task{selectedTasks.size !== 1 ? 's' : ''} into subtasks of:
          </p>
          
          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-3">
            {tasks
              .filter(task => 
                !task.completed && 
                !task.archived && 
                !selectedTasks.has(task.id) // Can't make a task a subtask of itself
              )
              .map(task => (
                <label
                  key={task.id}
                  className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedParentTaskId === task.id 
                      ? 'bg-indigo-50 border-2 border-indigo-500' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="parentTask"
                    value={task.id}
                    checked={selectedParentTaskId === task.id}
                    onChange={() => setSelectedParentTaskId(task.id)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                    )}
                    {task.projectId && (
                      <div className="text-xs text-gray-500 mt-1">
                        Project: {projects.find(p => p.id === task.projectId)?.name}
                      </div>
                    )}
                  </div>
                </label>
              ))
            }
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConvertToSubtasksModal(false);
                setSelectedParentTaskId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Layers size={16} />}
              onClick={executeBulkConvertToSubtasks}
              disabled={!selectedParentTaskId}
            >
              Convert to Subtasks
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksPageWithBulkOps;
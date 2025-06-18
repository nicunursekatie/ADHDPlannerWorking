import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContextSupabase';
import { Task, TaskSortMode, WhatNowCriteria } from '../types';
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
  ArrowUpDown, Clock, Star, Hash, FolderOpen, Tag,
  Zap, Brain, Timer, Battery
} from 'lucide-react';
import { formatDate, getOverdueTasks, getTasksDueToday, getTasksDueThisWeek } from '../utils/helpers';
import { DeletedTask, getDeletedTasks, restoreDeletedTask, permanentlyDeleteTask } from '../utils/localStorage';
import { sortTasks as smartSortTasks, SortMode, EnergyLevel, getFilteredCounts, getSortModeInfo } from '../utils/taskPrioritization';

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
    bulkConvertToSubtasks,
    bulkAssignCategories
  } = useAppContext();
  
  // Get initial tab from URL query params
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') as 'today' | 'tomorrow' | 'week' | 'overdue' | 'all' | null;
  const categoryIdParam = searchParams.get('categoryId');
  const initialTab = tabParam || 'all';
  
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
  const [, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [selectedCategoryIdsForBulk, setSelectedCategoryIdsForBulk] = useState<string[]>([]);
  const [categoryAssignMode, setCategoryAssignMode] = useState<'add' | 'replace'>('add');
  
  // Filter state
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(categoryIdParam);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // View state
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'overdue' | 'all' | 'deleted'>(initialTab);
  
  // Sort state
  type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'title' | 'estimatedMinutes' | 'project';
  type SortDirection = 'asc' | 'desc';
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  // Smart sorting state
  const [smartSortMode, setSmartSortMode] = useState<SortMode>('smart');
  const [currentEnergy, setCurrentEnergy] = useState<EnergyLevel>('medium');
  const [showSmartSort, setShowSmartSort] = useState(false);
  
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
  
  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    
    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);
  
  const loadDeletedTasks = () => {
    const deleted = getDeletedTasks();
    setDeletedTasks(deleted.sort((a, b) => 
      new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    ));
  };
  
  // const handleRestoreTask = (taskId: string) => {
  //   const restoredTask = restoreDeletedTask(taskId);
  //   if (restoredTask) {
  //     loadDeletedTasks();
  //     // The context will automatically update with the restored task
  //   }
  // };
  
  // const handlePermanentlyDeleteTask = (taskId: string) => {
  //   permanentlyDeleteTask(taskId);
  //   loadDeletedTasks();
  // };
  
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
  
  const handleBulkCategoryAssign = () => {
    setShowBulkCategoryModal(true);
  };
  
  const executeBulkCategoryAssign = () => {
    if (selectedTasks.size > 0 && selectedCategoryIdsForBulk.length > 0) {
      bulkAssignCategories(Array.from(selectedTasks), selectedCategoryIdsForBulk, categoryAssignMode);
      setSelectedTasks(new Set());
      setShowBulkCategoryModal(false);
      setSelectedCategoryIdsForBulk([]);
      setCategoryAssignMode('add');
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
  
  // Sort function
  const sortTasks = (tasks: Task[]): Task[] => {
    // If using smart sort, delegate to the smart sorting utility
    if (showSmartSort) {
      return smartSortTasks(tasks, smartSortMode, currentEnergy);
    }
    
    // Otherwise use traditional sorting
    const sorted = [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          // Tasks without due dates go to the end
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.localeCompare(b.dueDate);
          break;
          
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
          break;
          
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
          
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
          
        case 'estimatedMinutes':
          const aMinutes = a.estimatedMinutes || 0;
          const bMinutes = b.estimatedMinutes || 0;
          comparison = bMinutes - aMinutes;
          break;
          
        case 'project':
          const aProject = projects.find(p => p.id === a.projectId)?.name || '';
          const bProject = projects.find(p => p.id === b.projectId)?.name || '';
          comparison = aProject.localeCompare(bProject);
          break;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
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
  
  // Get tasks for each section (unsorted)
  const overdueTasksUnsorted = getOverdueTasks(tasks)
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const todayTasksUnsorted = getTasksDueToday(tasks)
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const tomorrowTasksUnsorted = getTasksDueTomorrow(tasks)
    .filter(applyBaseFilter);
    
  const thisWeekTasksUnsorted = getTasksDueThisWeek(tasks)
    .filter(task => 
      task.dueDate !== formatDate(new Date()) && 
      task.dueDate !== getTomorrowDate()
    )
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const otherTasksUnsorted = tasks.filter(task => 
    (showCompleted || !task.completed) &&
    (showArchived || !task.archived) &&
    (!task.dueDate || 
      (!overdueTasksUnsorted.some(t => t.id === task.id) && 
       !todayTasksUnsorted.some(t => t.id === task.id) && 
       !tomorrowTasksUnsorted.some(t => t.id === task.id) && 
       !thisWeekTasksUnsorted.some(t => t.id === task.id))
    )
  ).filter(applyBaseFilter);
  
  // Apply sorting to each section
  const overdueTasks = sortTasks(overdueTasksUnsorted);
  const todayTasks = sortTasks(todayTasksUnsorted);
  const tomorrowTasks = sortTasks(tomorrowTasksUnsorted);
  const thisWeekTasks = sortTasks(thisWeekTasksUnsorted);
  // const otherTasks = sortTasks(otherTasksUnsorted);
  
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
        // For 'all' view, we need to sort the entire combined list
        const allTasks = [...overdueTasksUnsorted, ...todayTasksUnsorted, ...tomorrowTasksUnsorted, ...thisWeekTasksUnsorted, ...otherTasksUnsorted];
        return sortTasks(allTasks);
      default:
        // Default to all tasks view
        const allTasksDefault = [...overdueTasksUnsorted, ...todayTasksUnsorted, ...tomorrowTasksUnsorted, ...thisWeekTasksUnsorted, ...otherTasksUnsorted];
        return sortTasks(allTasksDefault);
    }
  };
  
  const activeTaskList = getActiveTaskList();
  const parentTasks = activeTaskList.filter(task => !task.parentTaskId);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTaskList.length} task{activeTaskList.length !== 1 ? 's' : ''}
            {(filterProjectId || filterCategoryId) && ' (filtered)'}
            {selectedTasks.size > 0 && ` • ${selectedTasks.size} selected`}
            {sortBy !== 'dueDate' && ` • Sorted by ${sortBy === 'createdAt' ? 'created date' : sortBy === 'estimatedMinutes' ? 'time estimate' : sortBy}`}
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
            variant={showSmartSort ? "primary" : "secondary"}
            icon={<Brain size={16} />}
            onClick={() => setShowSmartSort(!showSmartSort)}
          >
            Smart Sort
          </Button>
          <div className="relative" ref={sortMenuRef}>
            <Button
              variant="secondary"
              icon={<ArrowUpDown size={16} />}
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              {showSmartSort ? 'Legacy Sort' : 'Sort'}
            </Button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-600 ring-opacity-5 z-10">
                <div className="py-1" role="menu">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      sortBy === 'dueDate' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (sortBy === 'dueDate') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('dueDate');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      <Calendar size={16} className="mr-2" />
                      Due Date
                    </span>
                    {sortBy === 'dueDate' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      sortBy === 'priority' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (sortBy === 'priority') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('priority');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      <Star size={16} className="mr-2" />
                      Priority
                    </span>
                    {sortBy === 'priority' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      sortBy === 'createdAt' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (sortBy === 'createdAt') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('createdAt');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      <Plus size={16} className="mr-2" />
                      Created Date
                    </span>
                    {sortBy === 'createdAt' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      sortBy === 'title' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (sortBy === 'title') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('title');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      <Hash size={16} className="mr-2" />
                      Title
                    </span>
                    {sortBy === 'title' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      sortBy === 'estimatedMinutes' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (sortBy === 'estimatedMinutes') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('estimatedMinutes');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      <Clock size={16} className="mr-2" />
                      Time Estimate
                    </span>
                    {sortBy === 'estimatedMinutes' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      sortBy === 'project' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      if (sortBy === 'project') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('project');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      <FolderOpen size={16} className="mr-2" />
                      Project
                    </span>
                    {sortBy === 'project' && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
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
                icon={<Tag size={14} />}
                onClick={handleBulkCategoryAssign}
                disabled={selectedTasks.size === 0}
              >
                Categories
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
      
      {/* Smart Sort Controls */}
      {showSmartSort && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <Brain size={20} className="mr-2 text-purple-600 dark:text-purple-400" />
                Smart Task Prioritization
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowSmartSort(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Current Energy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Battery size={16} className="inline mr-1" />
                Your Current Energy Level
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setCurrentEnergy(level)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentEnergy === level
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    {level === 'low' && '🔋 Low'}
                    {level === 'medium' && '🔋🔋 Medium'}
                    {level === 'high' && '🔋🔋🔋 High'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sorting Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Zap size={16} className="inline mr-1" />
                Prioritization Strategy
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { mode: 'smart' as const, label: '🧠 Smart Sort', desc: 'AI-optimized task ordering' },
                  { mode: 'energymatch' as const, label: '🔋 Energy Match', desc: 'Only matching tasks' },
                  { mode: 'quickwins' as const, label: '⚡ Quick Wins', desc: 'Build momentum' },
                  { mode: 'eatthefrog' as const, label: '🐸 Eat the Frog', desc: 'Hard tasks first' },
                  { mode: 'deadline' as const, label: '⏰ Deadline Focus', desc: 'Due date priority' },
                  { mode: 'priority' as const, label: '⭐ Priority', desc: 'Traditional priority' },
                ].map(({ mode, label, desc }) => (
                  <button
                    key={mode}
                    onClick={() => setSmartSortMode(mode)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      smartSortMode === mode
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className={`text-xs mt-1 ${smartSortMode === mode ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filter Chips */}
            {(() => {
              const filteredCounts = getFilteredCounts(tasks, currentEnergy);
              const activeTasks = tasks.filter(t => !t.completed && !t.archived);
              return (
                <div className="flex flex-wrap gap-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 w-full">
                    Quick Filters ({activeTasks.length} active tasks):
                  </div>
                  <button
                    onClick={() => setSmartSortMode('quickwins')}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      smartSortMode === 'quickwins'
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                    }`}
                  >
                    ⚡ Quick Wins ({filteredCounts.quickWins})
                  </button>
                  
                  <button
                    onClick={() => setSmartSortMode('deadline')}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      smartSortMode === 'deadline'
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30'
                    }`}
                  >
                    🔥 Due Today ({filteredCounts.dueToday})
                  </button>
                  
                  <button
                    onClick={() => setSmartSortMode('eatthefrog')}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      smartSortMode === 'eatthefrog'
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/30'
                    }`}
                  >
                    💪 High Energy ({filteredCounts.highEnergy})
                  </button>
                  
                  {filteredCounts.energyMatch > 0 && (
                    <button
                      onClick={() => setSmartSortMode('energymatch')}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        smartSortMode === 'energymatch'
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      🔋 Energy Match ({filteredCounts.energyMatch})
                    </button>
                  )}
                </div>
              );
            })()}
            
            {/* Smart Sort Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Strategy: {getSortModeInfo(smartSortMode).name}
              </p>
              <p>{getSortModeInfo(smartSortMode).description}</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Task list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="space-y-4">
          {parentTasks.length > 0 ? (
            <div>
              {activeTab === 'all' ? (
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
        size="3xl"
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
      
      {/* Bulk Category Assignment Modal */}
      <Modal
        isOpen={showBulkCategoryModal}
        onClose={() => {
          setShowBulkCategoryModal(false);
          setSelectedCategoryIdsForBulk([]);
          setCategoryAssignMode('add');
        }}
        title="Assign Categories"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Assign categories to {selectedTasks.size} selected task{selectedTasks.size !== 1 ? 's' : ''}:
          </p>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Assignment Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="assignMode"
                  value="add"
                  checked={categoryAssignMode === 'add'}
                  onChange={() => setCategoryAssignMode('add')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Add to existing categories
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="assignMode"
                  value="replace"
                  checked={categoryAssignMode === 'replace'}
                  onChange={() => setCategoryAssignMode('replace')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Replace all existing categories
                </span>
              </label>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Categories
            </label>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-3">
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={category.id}
                    checked={selectedCategoryIdsForBulk.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategoryIdsForBulk([...selectedCategoryIdsForBulk, category.id]);
                      } else {
                        setSelectedCategoryIdsForBulk(
                          selectedCategoryIdsForBulk.filter(id => id !== category.id)
                        );
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center">
                    <div
                      className="h-4 w-4 rounded mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-gray-900">{category.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBulkCategoryModal(false);
                setSelectedCategoryIdsForBulk([]);
                setCategoryAssignMode('add');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Tag size={16} />}
              onClick={executeBulkCategoryAssign}
              disabled={selectedCategoryIdsForBulk.length === 0}
            >
              Assign Categories
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksPageWithBulkOps;
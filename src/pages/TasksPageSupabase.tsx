import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContextSupabase';
import { Task } from '../types';
import { TaskDisplay } from '../components/TaskDisplay';
import TaskFormWithDependencies from '../components/tasks/TaskFormWithDependencies';
import AITaskBreakdown from '../components/tasks/AITaskBreakdown';
import ConvertToProject from '../components/tasks/ConvertToProject';
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
import { formatDate, getOverdueTasks, getTasksDueToday, getTasksDueThisWeek, getActionableTasks, getFutureTasks } from '../utils/helpers';
import { TimeSpentModal } from '../components/tasks/TimeSpentModal';
import { FollowUpTasksModal } from '../components/tasks/FollowUpTasksModal';
import { triggerCelebration, showToastCelebration } from '../utils/celebrations';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Utility function to group tasks by project and due date
const groupTasksByProjectAndDueDate = (tasks: Task[], projects: any[]) => {
  // Create a map for quick project lookup
  const projectMap = new Map(projects.map(proj => [proj.id, proj]));
  
  // Group tasks by project
  const tasksByProject = new Map<string, Task[]>();
  
  tasks.forEach(task => {
    const projectKey = task.projectId || 'no-project';
    if (!tasksByProject.has(projectKey)) {
      tasksByProject.set(projectKey, []);
    }
    tasksByProject.get(projectKey)!.push(task);
  });
  
  // Sort tasks within each project by due date
  const sortedGroups = Array.from(tasksByProject.entries()).map(([projectId, projectTasks]) => {
    const sortedTasks = [...projectTasks].sort((a, b) => {
      // Tasks without due dates go to the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      // Sort by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    const project = projectMap.get(projectId);
    const projectName = projectId === 'no-project' 
      ? 'No Project' 
      : project?.name || 'Unknown Project';
    
    const projectColor = projectId === 'no-project' 
      ? '#6B7280' 
      : project?.color || '#6B7280';
    
    return {
      projectId,
      projectName,
      projectColor,
      tasks: sortedTasks
    };
  });
  
  // Sort projects alphabetically, but keep "No Project" at the end
  return sortedGroups.sort((a, b) => {
    if (a.projectId === 'no-project') return 1;
    if (b.projectId === 'no-project') return -1;
    return a.projectName.localeCompare(b.projectName);
  });
};

interface BulkTaskCardProps {
  task: Task;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onBreakdown?: (task: Task) => void;
  onConvertToProject?: (task: Task) => void;
  onToggle: (taskId: string) => void;
  showCheckbox: boolean;
}

const BulkTaskCard: React.FC<BulkTaskCardProps> = ({ 
  task, 
  isSelected, 
  onSelectChange,
  onEdit,
  onDelete,
  onBreakdown,
  onConvertToProject,
  onToggle,
  showCheckbox
}) => {
  
  return (
    <div className="relative">
      {/* Selection checkbox for bulk operations */}
      {showCheckbox && (
        <div className="absolute left-2 top-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectChange(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>
      )}
      
      {/* Task Card - offset to make room for checkbox */}
      <div className={showCheckbox ? "ml-6" : ""}>
        <TaskDisplay
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onBreakdown={onBreakdown}
          onConvertToProject={onConvertToProject}
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
    addProject, 
    categories, 
    addTask, 
    updateTask, 
    deleteTask,
    completeTask,
    archiveCompletedTasks,
    bulkConvertToSubtasks,
    isLoading 
  } = useAppContext();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [aiBreakdownTask, setAiBreakdownTask] = useState<Task | null>(null);
  const [convertToProjectTask, setConvertToProjectTask] = useState<Task | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'completed' | 'active' | 'overdue' | 'today' | 'week' | 'actionable' | 'future' | 'project' | 'category' | 'archived'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'smart' | 'dueDate' | 'priority' | 'created' | 'alphabetical' | 'energy' | 'estimated'>('smart');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  
  // Bulk operations state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // Time tracking modal state
  const [showTimeSpentModal, setShowTimeSpentModal] = useState(false);
  const [taskBeingCompleted, setTaskBeingCompleted] = useState<Task | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [completedTaskForFollowUp, setCompletedTaskForFollowUp] = useState<Task | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionsEnabled, setBulkActionsEnabled] = useState(false);
  const [showConvertToSubtasksModal, setShowConvertToSubtasksModal] = useState(false);
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string | null>(null);

  // Auto-focus for quick capture
  const quickCaptureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get('tab');
    const categoryId = queryParams.get('categoryId');
    
    if (categoryId) {
      setFilterBy('category');
      setSelectedCategory(categoryId);
    } else if (tab) {
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
  const filteredTasks = tasks.filter(task => {
    // Exclude subtasks (tasks with a parentTaskId) from the main list
    if (task.parentTaskId) return false;
    
    if (filterBy === 'all') return !task.archived && !task.deletedAt;
    if (filterBy === 'completed') return task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'active') return !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'archived') return task.archived && !task.deletedAt;
    if (filterBy === 'overdue') return getOverdueTasks([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'today') return getTasksDueToday([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'week') return getTasksDueThisWeek([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'actionable') return getActionableTasks([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'future') return getFutureTasks([task]).length > 0 && !task.completed && !task.archived && !task.deletedAt;
    if (filterBy === 'project') return task.projectId === selectedProject && !task.archived && !task.deletedAt;
    if (filterBy === 'category') return task.categoryIds?.includes(selectedCategory) && !task.archived && !task.deletedAt;
    return true;
  });

  // Debug: Log task counts
  React.useEffect(() => {
    console.log('[TasksPageSupabase] Task counts:', {
      totalTasks: tasks.length,
      filteredTasks: filteredTasks.length,
      filterBy,
      tasksWithParentId: tasks.filter(t => t.parentTaskId).length,
      archivedTasks: tasks.filter(t => t.archived).length,
      deletedTasks: tasks.filter(t => t.deletedAt).length,
      completedTasks: tasks.filter(t => t.completed).length,
      activeTasks: tasks.filter(t => !t.completed && !t.archived && !t.deletedAt).length
    });
    
    // Log the last 3 tasks to see if new ones are there
    const lastThreeTasks = tasks.slice(-3).map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      archived: t.archived,
      deletedAt: t.deletedAt,
      parentTaskId: t.parentTaskId
    }));
    console.log('[TasksPageSupabase] Last 3 tasks:', lastThreeTasks);
  }, [tasks.length, filteredTasks.length, filterBy]);

  // Sort tasks
  filteredTasks.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'smart':
        // Smart sort: Combines due date urgency with priority
        const now = new Date();
        const getUrgencyScore = (task: Task) => {
          if (!task.dueDate) return 0;
          const dueDate = new Date(task.dueDate);
          const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          
          // Overdue tasks get highest urgency
          if (daysUntilDue < 0) return 100;
          // Due today
          if (daysUntilDue < 1) return 90;
          // Due tomorrow
          if (daysUntilDue < 2) return 80;
          // Due this week
          if (daysUntilDue < 7) return 70;
          // Due this month
          if (daysUntilDue < 30) return 50;
          // Everything else
          return 30;
        };
        
        const priorityScores = { 'urgent': 40, 'high': 30, 'medium': 20, 'low': 10 };
        const scoreA = getUrgencyScore(a) + (priorityScores[a.priority as keyof typeof priorityScores] || 0);
        const scoreB = getUrgencyScore(b) + (priorityScores[b.priority as keyof typeof priorityScores] || 0);
        comparison = scoreB - scoreA; // Higher score first
        break;
      case 'dueDate':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
        break;
      case 'priority':
        const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        comparison = priorityB - priorityA; // Urgent/High priority first
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
    try {
      await addTask(task);
      setShowTaskForm(false);
      setShowQuickCapture(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleEditTask = async (updates: Partial<Task>) => {
    if (!editingTask) return;
    
    try {
      await updateTask({
        ...editingTask,
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
  
  const handleConvertToProject = (task: Task) => {
    setConvertToProjectTask(task);
  };
  
  const handleConvertToProjectConfirm = async (projectData: any, options: any) => {
    if (!convertToProjectTask) return;
    
    try {
      // Create the new project
      const newProject = await addProject(projectData);
      
      // Get subtasks if they exist
      const subtasks = tasks.filter(t => t.parentTaskId === convertToProjectTask.id);
      
      // Update the original task to be part of the project if requested
      if (options.moveToProject) {
        await updateTask({
          ...convertToProjectTask,
          projectId: newProject.id,
          parentTaskId: null // Remove parent relationship if it exists
        });
      }
      
      // Include subtasks if requested
      if (options.includeSubtasks && subtasks.length > 0) {
        for (const subtask of subtasks) {
          await updateTask({
            ...subtask,
            projectId: newProject.id,
            parentTaskId: options.moveToProject ? convertToProjectTask.id : null
          });
        }
      }
      
      // Create project phases if requested
      if (options.createPhases) {
        const phases = ['Planning', 'Execution', 'Review'];
        for (const [index, phaseName] of phases.entries()) {
          await addTask({
            title: `${phaseName} Phase`,
            description: `${phaseName} phase for ${newProject.name}`,
            projectId: newProject.id,
            phase: phaseName,
            phaseOrder: index,
            tags: [phaseName.toLowerCase()],
            completed: false,
            archived: false,
            categoryIds: convertToProjectTask.categoryIds || [],
            dueDate: null,
            startDate: null,
            parentTaskId: null,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // Delete original task if requested and not moved to project
      if (options.deleteOriginalTask && !options.moveToProject) {
        await deleteTask(convertToProjectTask.id);
      }
      
      setConvertToProjectTask(null);
    } catch (error) {
      console.error('Failed to convert task to project:', error);
    }
  };
  
  const handleConvertToProjectCancel = () => {
    setConvertToProjectTask(null);
  };

  // Custom task completion handler that shows time tracking modal
  const handleTaskToggle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    console.log('[TasksPageSupabase] handleTaskToggle called', {
      taskId,
      taskTitle: task.title,
      completed: task.completed
    });
    
    if (!task.completed) {
      // Show time tracking modal when completing a task
      console.log('[TasksPageSupabase] Showing time spent modal for task completion');
      setTaskBeingCompleted(task);
      setShowTimeSpentModal(true);
    } else {
      // Uncompleting a task - do it directly
      console.log('[TasksPageSupabase] Uncompleting task');
      completeTask(taskId);
    }
  };
  
  // Handle time tracking modal confirm
  const handleTimeSpentConfirm = async (actualMinutes: number) => {
    if (!taskBeingCompleted) return;
    
    console.log('[TasksPageSupabase] handleTimeSpentConfirm called', {
      taskId: taskBeingCompleted.id,
      actualMinutes
    });
    
    const timestamp = new Date().toISOString();
    
    // Update the task with both completion and time spent in one operation
    const updatedTask = {
      ...taskBeingCompleted,
      actualMinutesSpent: actualMinutes,
      completed: true,
      completedAt: timestamp,
      updatedAt: timestamp
    };
    
    await updateTask(updatedTask);
    
    // Close time modal and show follow-up modal
    console.log('[TasksPageSupabase] Showing follow-up modal after time tracking', {
      updatedTask,
      showFollowUpModal: true
    });
    setShowTimeSpentModal(false);
    setCompletedTaskForFollowUp(updatedTask);
    setShowFollowUpModal(true);
    setTaskBeingCompleted(null);
  };
  
  // Handle time tracking modal skip
  const handleTimeSpentSkip = async () => {
    if (!taskBeingCompleted) return;
    
    console.log('[TasksPageSupabase] handleTimeSpentSkip called, completing without time tracking');
    
    const timestamp = new Date().toISOString();
    
    // Complete the task without recording time in one operation
    const updatedTask = {
      ...taskBeingCompleted,
      completed: true,
      completedAt: timestamp,
      updatedAt: timestamp
    };
    
    await updateTask(updatedTask);
    
    // Close time modal and show follow-up modal
    console.log('[TasksPageSupabase] Showing follow-up modal after time tracking', {
      updatedTask,
      showFollowUpModal: true
    });
    setShowTimeSpentModal(false);
    setCompletedTaskForFollowUp(updatedTask);
    setShowFollowUpModal(true);
    setTaskBeingCompleted(null);
  };

  // Handle follow-up tasks confirmation
  const handleFollowUpTasksConfirm = async (followUpTasks: Partial<Task>[]) => {
    console.log('[TasksPageSupabase] Creating follow-up tasks', followUpTasks);
    
    try {
      // Create all follow-up tasks
      for (const task of followUpTasks) {
        console.log('[TasksPageSupabase] Creating individual follow-up task:', task);
        const createdTask = await addTask(task);
        console.log('[TasksPageSupabase] Created task result:', {
          id: createdTask.id,
          title: createdTask.title,
          completed: createdTask.completed,
          archived: createdTask.archived,
          deletedAt: createdTask.deletedAt,
          parentTaskId: createdTask.parentTaskId
        });
      }
      
      // Trigger celebration after successful completion
      if (completedTaskForFollowUp) {
        console.log('[TasksPageSupabase] All follow-up tasks created successfully');
        
        // Force a refresh of the task list by changing filter and back
        // This is a workaround to ensure the UI updates
        const currentFilter = filterBy;
        setFilterBy('all');
        setTimeout(() => {
          if (currentFilter !== 'all') {
            setFilterBy(currentFilter);
          }
        }, 100);
        
        triggerCelebration();
        showToastCelebration(`"${completedTaskForFollowUp.title}" completed! 🎉`);
      }
    } catch (error) {
      console.error('[TasksPageSupabase] Error creating follow-up tasks:', error);
      alert('Failed to create follow-up tasks. Please try again.');
      return; // Don't close modal on error
    }
    
    // Close modal and clear state
    setShowFollowUpModal(false);
    setCompletedTaskForFollowUp(null);
  };

  // Handle follow-up tasks skip
  const handleFollowUpTasksSkip = () => {
    console.log('[TasksPageSupabase] Skipping follow-up tasks');
    
    // Trigger celebration
    if (completedTaskForFollowUp) {
      console.log('[TasksPageSupabase] Triggering celebration (no follow-up tasks)');
      triggerCelebration();
      showToastCelebration(`"${completedTaskForFollowUp.title}" completed! 🎉`);
    }
    
    // Close modal and clear state
    setShowFollowUpModal(false);
    setCompletedTaskForFollowUp(null);
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
        Array.from(selectedTasks).map(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            return updateTask({
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          return Promise.resolve();
        })
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
        Array.from(selectedTasks).map(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            return updateTask({
              ...task,
              archived: true,
              updatedAt: new Date().toISOString()
            });
          }
          return Promise.resolve();
        })
      );
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk archiving tasks:', error);
    }
  };

  const handleBulkUnarchive = async () => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            return updateTask({
              ...task,
              archived: false,
              updatedAt: new Date().toISOString()
            });
          }
          return Promise.resolve();
        })
      );
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk unarchiving tasks:', error);
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

  const handleBulkMove = async (projectId: string | null) => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            return updateTask({
              ...task,
              projectId,
              updatedAt: new Date().toISOString()
            });
          }
          return Promise.resolve();
        })
      );
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk moving tasks:', error);
    }
  };

  const handleBulkConvertToSubtasks = async () => {
    if (!selectedParentTaskId || selectedTasks.size === 0) return;
    
    try {
      
      // Use the bulkConvertToSubtasks function from context
      await bulkConvertToSubtasks(Array.from(selectedTasks), selectedParentTaskId);
      
      
      // Verify the updates
      const verifyTasks = tasks.filter(t => selectedTasks.has(t.id));
      
      // Also log the parent task to check its subtasks array
      const parentTask = tasks.find(t => t.id === selectedParentTaskId);
      
      // Check again after a short delay to see if it updates
      setTimeout(() => {
        const updatedParentTask = tasks.find(t => t.id === selectedParentTaskId);
          }, 100);
      
      setSelectedTasks(new Set());
      setShowBulkActions(false);
      setShowConvertToSubtasksModal(false);
      setSelectedParentTaskId(null);
    } catch (error) {
      console.error('Error converting tasks to subtasks:', error);
      alert(`Failed to convert tasks to subtasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleArchiveCompleted = async () => {
    try {
      await archiveCompletedTasks();
    } catch (error) {
      console.error('Error archiving completed tasks:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setBulkActionsEnabled(!bulkActionsEnabled);
              if (bulkActionsEnabled) {
                setSelectedTasks(new Set());
                setShowBulkActions(false);
              }
            }}
            variant={bulkActionsEnabled ? "secondary" : "outline"}
            size="sm"
          >
            {bulkActionsEnabled ? 'Exit Bulk Mode' : 'Bulk Actions'}
          </Button>
          <Button
            onClick={() => setShowQuickCapture(!showQuickCapture)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
          <Button
            onClick={handleArchiveCompleted}
            variant="outline"
            size="sm"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Completed
          </Button>
          <Button
            onClick={() => setShowTaskForm(true)}
            variant="primary"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Quick Capture */}
      {showQuickCapture && (
        <Card className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Quick Add Task
            </h3>
          </div>
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterBy('all')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All ({tasks.filter(t => !t.archived && !t.deletedAt).length})
            </button>
            <button
              onClick={() => setFilterBy('actionable')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'actionable' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              title="Tasks you can work on right now"
            >
              Actionable ({getActionableTasks(tasks.filter(t => !t.completed && !t.archived && !t.deletedAt)).length})
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
              onClick={() => setFilterBy('archived')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'archived' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              title="View archived tasks"
            >
              Archived ({tasks.filter(t => t.archived && !t.deletedAt).length})
            </button>
            <button
              onClick={() => setFilterBy('overdue')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'overdue' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Overdue ({getOverdueTasks(tasks.filter(t => !t.completed && !t.archived && !t.deletedAt)).length})
            </button>
            <button
              onClick={() => setFilterBy('today')}
              className={`px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all duration-200 hover:scale-105 ${
                filterBy === 'today' 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-red-100 to-orange-100 text-red-800 hover:from-red-200 hover:to-orange-200'
              }`}
            >
              🔥 TODAY ({getTasksDueToday(tasks.filter(t => !t.completed && !t.archived && !t.deletedAt)).length})
            </button>
            <button
              onClick={() => setFilterBy('future')}
              className={`px-3 py-1 rounded text-sm ${filterBy === 'future' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              title="Tasks that can't be started yet"
            >
              Future ({getFutureTasks(tasks.filter(t => !t.completed && !t.archived && !t.deletedAt)).length})
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="smart">Smart (Urgency + Priority)</option>
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

          {filteredTasks.length > 0 && bulkActionsEnabled && (
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
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleBulkComplete} variant="outline" size="sm">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Complete
              </Button>
              {filterBy === 'archived' ? (
                <Button onClick={handleBulkUnarchive} variant="outline" size="sm">
                  <FileArchive className="w-4 h-4 mr-1" />
                  Unarchive
                </Button>
              ) : (
                <Button onClick={handleBulkArchive} variant="outline" size="sm">
                  <FileArchive className="w-4 h-4 mr-1" />
                  Archive
                </Button>
              )}
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value !== '') {
                    handleBulkMove(value === 'none' ? null : value);
                    e.target.value = '';
                  }
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="">Move to Project</option>
                <option value="none">No Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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
              <Button 
                onClick={() => setShowConvertToSubtasksModal(true)} 
                variant="outline" 
                size="sm"
              >
                <Layers className="w-4 h-4 mr-1" />
                Make Subtasks
              </Button>
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
          <>
            {/* Sort info header */}
            <div className="text-sm text-gray-600 mb-2">
              {sortBy === 'smart' && 'Smart sort: Most urgent and important tasks first'}
              {sortBy === 'dueDate' && 'Sorted by due date (earliest first)'}
              {sortBy === 'priority' && 'Sorted by priority (highest first)'}
              {sortBy === 'created' && 'Sorted by creation date (newest first)'}
              {sortBy === 'alphabetical' && 'Sorted alphabetically'}
              {sortBy === 'energy' && 'Sorted by energy level required'}
              {sortBy === 'estimated' && 'Sorted by estimated time'}
              {' • '}
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </div>
            
            {/* Tasks displayed in sorted order without project grouping */}
            {filteredTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              return (
                <ErrorBoundary key={task.id}>
                  <div className="relative">
                    {/* Optional project indicator */}
                    {project && (
                      <div className="absolute -left-2 top-0 bottom-0 w-1 rounded-full" 
                        style={{ backgroundColor: project.color }}
                        title={project.name}
                      />
                    )}
                    <BulkTaskCard
                      task={task}
                      isSelected={selectedTasks.has(task.id)}
                      onSelectChange={(selected) => handleTaskSelect(task.id, selected)}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setShowTaskForm(true);
                      }}
                      onDelete={handleDeleteTask}
                      onBreakdown={handleAIBreakdown}
                      onConvertToProject={handleConvertToProject}
                      onToggle={handleTaskToggle}
                      showCheckbox={bulkActionsEnabled}
                    />
                  </div>
                </ErrorBoundary>
              );
            })}
          </>
        )}
      </div>

      {/* Task Form Modal */}
      <Modal
        key={editingTask?.id || 'new-task'}
        isOpen={showTaskForm}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        size="3xl"
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
      >
        <TaskFormWithDependencies
          task={editingTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          isEdit={!!editingTask}
        />
      </Modal>

      {/* AI Breakdown Modal */}
      {showAIBreakdown && aiBreakdownTask && (
        <AITaskBreakdown
          task={aiBreakdownTask}
          onAccept={async (subtasks) => {
            // Add all subtasks
            for (const subtask of subtasks) {
              await handleAddTask({
                ...subtask,
                parentTaskId: aiBreakdownTask.id
              });
            }
            
            setShowAIBreakdown(false);
            setAiBreakdownTask(null);
          }}
          onClose={() => {
            setShowAIBreakdown(false);
            setAiBreakdownTask(null);
          }}
        />
      )}
      
      {/* Convert to Project Modal */}
      {convertToProjectTask && (
        <ConvertToProject
          task={convertToProjectTask}
          onConfirm={handleConvertToProjectConfirm}
          onCancel={handleConvertToProjectCancel}
          subtasks={tasks.filter(t => t.parentTaskId === convertToProjectTask.id)}
        />
      )}

      {/* Convert to Subtasks Modal */}
      {showConvertToSubtasksModal && (
        <Modal
          isOpen={showConvertToSubtasksModal}
          title="Convert to Subtasks"
          onClose={() => {
            setShowConvertToSubtasksModal(false);
            setSelectedParentTaskId(null);
          }}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Convert {selectedTasks.size} selected task{selectedTasks.size !== 1 ? 's' : ''} into subtasks of:
            </p>
            
            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-3">
              {filteredTasks
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
                onClick={handleBulkConvertToSubtasks}
                disabled={!selectedParentTaskId}
              >
                <Layers className="w-4 h-4 mr-2" />
                Convert to Subtasks
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Time Spent Modal - rendered at top level to avoid container constraints */}
      {taskBeingCompleted && (
        <TimeSpentModal
          isOpen={showTimeSpentModal}
          onClose={() => {
            setShowTimeSpentModal(false);
            setTaskBeingCompleted(null);
          }}
          taskTitle={taskBeingCompleted.title}
          estimatedMinutes={taskBeingCompleted.estimatedMinutes}
          onConfirm={handleTimeSpentConfirm}
          onSkip={handleTimeSpentSkip}
        />
      )}

      {/* Follow-Up Tasks Modal */}
      {completedTaskForFollowUp && (
        <FollowUpTasksModal
          isOpen={showFollowUpModal}
          onClose={() => {
            console.log('[TasksPageSupabase] Closing follow-up modal via X button');
            setShowFollowUpModal(false);
            setCompletedTaskForFollowUp(null);
          }}
          parentTask={completedTaskForFollowUp}
          onConfirm={handleFollowUpTasksConfirm}
          onSkip={handleFollowUpTasksSkip}
          categories={categories}
          projects={projects}
        />
      )}
    </div>
  );
};

export default TasksPageSupabase;
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Project, Task } from '../types';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Empty from '../components/common/Empty';
import Card from '../components/common/Card';
import { 
  Plus, 
  Folder, 
  Grid3X3, 
  List, 
  Kanban, 
  Filter,
  SortDesc,
  Clock,
  TrendingUp,
  Calendar,
  ChevronDown,
  Sparkles,
  Archive
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { BackToTop } from '../components/common/BackToTop';

type ViewMode = 'grid' | 'list' | 'kanban';
type FilterMode = 'all' | 'active' | 'on-hold' | 'completed' | 'archived';
type SortMode = 'updated' | 'due-date' | 'progress' | 'priority';

// Sortable wrapper component for project cards
interface SortableProjectCardProps {
  project: Project;
  stats: any;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onComplete: (projectId: string) => void;
  onArchive: (projectId: string) => void;
  viewMode: ViewMode;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({ 
  project, 
  stats, 
  onEdit, 
  onDelete,
  onComplete,
  onArchive,
  viewMode 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (viewMode === 'grid') {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        tabIndex={-1} // Prevent focus on drag handle
      >
        <ProjectCard
          project={project}
          taskCount={stats.totalTasks}
          onEdit={onEdit}
          onDelete={onDelete}
          onComplete={onComplete}
          onArchive={onArchive}
          stats={stats}
          isDragging={isDragging}
        />
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        tabIndex={-1} // Prevent focus on drag handle
      >
        <Card
          variant="glass"
          className={`cursor-move ${
            isDragging 
              ? 'rotate-1 shadow-2xl' 
              : 'hover:shadow-xl hover:-translate-y-1'
          }`}
        >
          <div className="flex items-center justify-between gap-6 p-6">
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {project.name}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {stats.totalTasks} tasks
                  </span>
                  {stats.overdueTasks > 0 && (
                    <span className="text-red-600 font-semibold">
                      {stats.overdueTasks} overdue
                    </span>
                  )}
                  <span className="text-gray-500">
                    Updated {(() => {
                      try {
                        const date = new Date(project.updatedAt);
                        if (isNaN(date.getTime())) {
                          return 'recently';
                        }
                        return formatDistanceToNow(date) + ' ago';
                      } catch (error) {
                        return 'recently';
                      }
                    })()}
                  </span>
                  <span className="text-purple-600 font-medium">
                    {stats.totalHours}h spent
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Progress */}
              <div className="w-32">
                <div className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {stats.progress}%
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 flex items-center justify-center text-xs font-bold text-white ${
                      stats.progress >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      stats.progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${stats.progress}%` }}
                  >
                    {stats.progress >= 20 && `${stats.progress}%`}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(project)}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  title="Edit project"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(project.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete project"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

const ProjectsPage: React.FC = () => {
  const { projects, tasks, deleteProject, completeProject, archiveProject, reorderProjects } = useAppContext();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Scroll to top when component mounts to prevent focus issues
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Setup drag and drop sensors with proper constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Increased distance to prevent accidental drags
        delay: 100,   // Added delay to prevent immediate drag activation
        tolerance: 5  // Added tolerance for slight movements
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
    } else {
      setEditingProject(null);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };
  
  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const projectTasks = tasks.filter(task => 
      task.projectId === projectId && 
      !task.deletedAt && 
      !task.parentTaskId
    );
    
    const message = projectTasks.length > 0
      ? `Are you sure you want to delete "${project.name}"?\n\nThis project has ${projectTasks.length} task${projectTasks.length > 1 ? 's' : ''} that will remain but will no longer be assigned to any project.`
      : `Are you sure you want to delete "${project.name}"?`;
    
    const confirmed = await confirm({
      title: 'Delete Project',
      message,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      confirmButtonVariant: 'danger'
    });
    
    if (confirmed) {
      deleteProject(projectId);
    }
  };
  
  const handleCompleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const incompleteTasks = tasks.filter(task => 
      task.projectId === projectId && 
      !task.completed &&
      !task.deletedAt
    );
    
    const message = incompleteTasks.length > 0
      ? `Are you sure you want to mark "${project.name}" as complete?\n\nThis project still has ${incompleteTasks.length} incomplete task${incompleteTasks.length > 1 ? 's' : ''}.`
      : `Mark "${project.name}" as complete?`;
    
    const confirmed = await confirm({
      title: 'Complete Project',
      message,
      confirmText: 'Mark Complete',
      cancelText: 'Cancel',
      variant: 'success'
    });
    
    if (confirmed) {
      completeProject(projectId);
    }
  };
  
  const handleArchiveProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const message = project.archived
      ? `Restore "${project.name}" from archive?`
      : `Archive "${project.name}"?\n\nArchived projects are hidden from the main view but can be restored anytime.`;
    
    const confirmed = await confirm({
      title: project.archived ? 'Restore Project' : 'Archive Project',
      message,
      confirmText: project.archived ? 'Restore' : 'Archive',
      cancelText: 'Cancel',
      variant: 'default'
    });
    
    if (confirmed) {
      archiveProject(projectId);
    }
  };

  const handleBulkArchiveCompleted = async () => {
    const completedProjects = projects.filter(p => p.completed && !p.archived);
    
    if (completedProjects.length === 0) return;
    
    const message = `Archive ${completedProjects.length} completed project${completedProjects.length === 1 ? '' : 's'}?\n\nThey will be hidden from the main view but can be restored anytime.`;
    
    const confirmed = await confirm({
      title: 'Archive Completed Projects',
      message,
      confirmText: `Archive ${completedProjects.length} Project${completedProjects.length === 1 ? '' : 's'}`,
      cancelText: 'Cancel',
      variant: 'default'
    });
    
    if (confirmed) {
      for (const project of completedProjects) {
        await archiveProject(project.id);
      }
    }
  };
  
  // Calculate project statistics - memoized to prevent excessive recalculation
  const getProjectStats = React.useCallback((projectId: string) => {
    const projectTasks = tasks.filter(task => 
      task.projectId === projectId && 
      !task.deletedAt && 
      !task.parentTaskId  // Only count parent tasks, not subtasks
      // Note: Removed !task.archived so completed/archived tasks are counted
    );
    
    // Debug: Log project tasks for troubleshooting
    if (projectId && projectTasks.length > 0) {
      console.log(`[ProjectStats] Project ${projectId} has ${projectTasks.length} tasks`);
      projectTasks.forEach(task => {
        console.log(`[ProjectStats] Task "${task.title}": completed=${task.completed}, subtasks=${task.subtasks?.length || 0}`);
      });
    }
    
    // Helper function to determine if a task should be considered complete
    const getTaskCompletionStatus = (task: Task): boolean => {
      // Tasks with subtasks are considered complete only when all subtasks are complete
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskObjects = task.subtasks
          .map(id => tasks.find(t => t.id === id))
          .filter(Boolean) as Task[];
        return subtaskObjects.every(subtask => subtask.completed);
      }
      return task.completed;
    };
    
    const completedTasks = projectTasks.filter(getTaskCompletionStatus);
    const overdueTasks = projectTasks.filter(task => 
      !getTaskCompletionStatus(task) && task.dueDate && new Date(task.dueDate) < new Date()
    );
    
    const progress = projectTasks.length > 0
      ? Math.round((completedTasks.length / projectTasks.length) * 100)
      : 0;

    // Calculate total time spent from actual tracked time
    const totalMinutes = projectTasks.reduce((sum, task) => {
      return sum + (task.actualMinutesSpent || 0);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Estimate completion date based on real velocity if we have time data
    const remainingTasks = projectTasks.length - completedTasks.length;
    let estimatedCompletionDate: Date | null = null;

    if (remainingTasks > 0 && completedTasks.length > 0 && totalMinutes > 0) {
      // Calculate average time per completed task
      const avgMinutesPerTask = totalMinutes / completedTasks.length;
      // Estimate remaining time
      const estimatedRemainingMinutes = remainingTasks * avgMinutesPerTask;
      // Assuming 4 hours of productive work per day
      const estimatedDaysToComplete = Math.ceil(estimatedRemainingMinutes / (4 * 60));
      estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedDaysToComplete);
    }
    
    return {
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      progress,
      totalHours,
      estimatedCompletionDate
    };
  }, [tasks]);
  
  // Memoize project stats for all projects to prevent recalculation
  const allProjectStats = useMemo(() => {
    const statsMap: { [key: string]: ReturnType<typeof getProjectStats> } = {};
    projects.forEach(project => {
      statsMap[project.id] = getProjectStats(project.id);
    });
    return statsMap;
  }, [projects, getProjectStats]);
  
  // Filter projects based on selected filter
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];
    
    // Apply filters
    switch (filterMode) {
      case 'all':
        // Show non-archived, non-completed projects by default
        filtered = filtered.filter(p => !p.archived && !p.completed);
        break;
      case 'active':
        filtered = filtered.filter(p => {
          const stats = allProjectStats[p.id];
          return !p.archived && !p.completed && stats && stats.progress > 0 && stats.progress < 100;
        });
        break;
      case 'on-hold':
        // Mock on-hold status based on no recent activity
        filtered = filtered.filter(p => {
          if (p.archived || p.completed) return false;
          const lastUpdate = new Date(p.updatedAt);
          const daysSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate > 14;
        });
        break;
      case 'completed':
        filtered = filtered.filter(p => p.completed && !p.archived);
        break;
      case 'archived':
        filtered = filtered.filter(p => p.archived);
        break;
    }
    
    // Apply sorting based on mode - ALWAYS respect custom order first
    switch (sortMode) {
      case 'updated':
        // For 'updated' mode, sort by custom order first, then by update time
        filtered.sort((a, b) => {
          // First by custom order if both have order set
          const aOrder = a.order ?? 999;
          const bOrder = b.order ?? 999;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          // Then by update time
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        break;
      case 'progress':
        // Sort by custom order first, then by progress
        filtered.sort((a, b) => {
          const aOrder = a.order ?? 999;
          const bOrder = b.order ?? 999;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          const aStats = allProjectStats[a.id] || { progress: 0 };
          const bStats = allProjectStats[b.id] || { progress: 0 };
          return bStats.progress - aStats.progress;
        });
        break;
      case 'priority':
        // Sort by custom order first, then by priority (overdue tasks)
        filtered.sort((a, b) => {
          const aOrder = a.order ?? 999;
          const bOrder = b.order ?? 999;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          const aStats = allProjectStats[a.id] || { overdueTasks: 0 };
          const bStats = allProjectStats[b.id] || { overdueTasks: 0 };
          return bStats.overdueTasks - aStats.overdueTasks;
        });
        break;
      case 'due-date':
        // Sort by custom order first, then by due date
        filtered.sort((a, b) => {
          const aOrder = a.order ?? 999;
          const bOrder = b.order ?? 999;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          const aDate = getProjectStats(a.id).estimatedCompletionDate;
          const bDate = getProjectStats(b.id).estimatedCompletionDate;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return aDate.getTime() - bDate.getTime();
        });
        break;
    }
    
    return filtered;
  }, [projects, filterMode, sortMode, tasks]);
  
  const activeCount = projects.filter(p => {
    const stats = getProjectStats(p.id);
    return stats.progress > 0 && stats.progress < 100;
  }).length;

  const completedCount = projects.filter(p => p.completed && !p.archived).length;

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = filteredProjects.findIndex(p => p.id === active.id);
    const newIndex = filteredProjects.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null);
      return;
    }

    // Create a new array with the reordered projects
    const reorderedFilteredProjects = arrayMove(filteredProjects, oldIndex, newIndex);

    // Now we need to create a complete project order that includes all projects
    // Start with all projects in their current order
    const allProjectIds = [...projects].sort((a, b) => {
      const aOrder = a.order ?? 999;
      const bOrder = b.order ?? 999;
      return aOrder - bOrder;
    }).map(p => p.id);

    // Get the IDs of the filtered projects in their new order
    const filteredProjectIds = reorderedFilteredProjects.map(p => p.id);

    // Create the final order by preserving the position of non-filtered projects
    // and inserting the filtered projects in their new order
    const finalProjectIds: string[] = [];
    let filteredIndex = 0;

    for (const projectId of allProjectIds) {
      if (filteredProjectIds.includes(projectId)) {
        // This project is in our filtered view, use its new position
        finalProjectIds.push(filteredProjectIds[filteredIndex]);
        filteredIndex++;
      } else {
        // This project is not in our filtered view, keep it in its current position
        finalProjectIds.push(projectId);
      }
    }

    // Update the order in the backend
    try {
      await reorderProjects(finalProjectIds);
    } catch (error) {
      console.error('Failed to reorder projects:', error);
    }

    setActiveId(null);
  };

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;
  
  
  return (
    <div className="min-h-screen space-y-6 animate-fadeIn" style={{ scrollBehavior: 'auto' }}>
      {/* Enhanced Header */}
      <Card 
        variant="glass-purple" 
        padding="md" 
        gradient
        className="border-0 shadow-purple-lg bg-gradient-to-r from-primary-500/90 via-primary-600/90 to-accent-500/90"
      >
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="text-white">
            <h1 className="text-3xl font-display font-bold tracking-tight mb-1 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Folder className="w-6 h-6" />
              </div>
              Projects
            </h1>
            <p className="text-white/80 font-medium">
              {projects.length} total • {activeCount} active
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-primary-600 shadow-md' 
                    : 'text-white hover:bg-white/20'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white text-primary-600 shadow-md' 
                    : 'text-white hover:bg-white/20'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-primary-600 shadow-md' 
                    : 'text-white hover:bg-white/20'
                }`}
                title="Kanban view"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Bulk Archive Completed Projects Button */}
            {completedCount > 0 && (
              <button
                onClick={handleBulkArchiveCompleted}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
                title={`Archive ${completedCount} completed project${completedCount === 1 ? '' : 's'}`}
              >
                <Archive className="w-4 h-4" />
                Archive Completed ({completedCount})
              </button>
            )}
            
            {/* New Project Button */}
            <Button
              variant="secondary"
              icon={<Plus size={18} />}
              onClick={() => handleOpenModal()}
              className="bg-white text-primary-600 hover:bg-white/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              New Project
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Filters Bar */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 animate-slideInDown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filter Options */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Filter by Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'on-hold', 'completed', 'archived'] as FilterMode[]).map(mode => {
                  // Calculate counts for each filter
                  const getCount = () => {
                    switch(mode) {
                      case 'all':
                        return projects.filter(p => !p.archived && !p.completed).length;
                      case 'active':
                        return projects.filter(p => {
                          const stats = allProjectStats[p.id];
                          return !p.archived && !p.completed && stats && stats.progress > 0 && stats.progress < 100;
                        }).length;
                      case 'on-hold':
                        return projects.filter(p => {
                          if (p.archived || p.completed) return false;
                          const lastUpdate = new Date(p.updatedAt);
                          const daysSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
                          return daysSinceUpdate > 14;
                        }).length;
                      case 'completed':
                        return projects.filter(p => p.completed && !p.archived).length;
                      case 'archived':
                        return projects.filter(p => p.archived).length;
                      default:
                        return 0;
                    }
                  };
                  const count = getCount();
                  
                  return (
                    <button
                      key={mode}
                      onClick={() => setFilterMode(mode)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        filterMode === mode
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                          filterMode === mode
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Sort Options */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Sort by
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'updated', label: 'Recently Updated', icon: Clock },
                  { value: 'due-date', label: 'Due Date', icon: Calendar },
                  { value: 'progress', label: 'Progress', icon: TrendingUp },
                  { value: 'priority', label: 'Priority', icon: SortDesc }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortMode(option.value as SortMode)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      sortMode === option.value
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Project Views */}
      {filteredProjects.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Drag instructions */}
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                ↕
              </span>
              Drag projects to reorder them
            </p>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <SortableContext
              items={filteredProjects.map(p => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const stats = allProjectStats[project.id] || getProjectStats(project.id);
                  
                  return (
                    <SortableProjectCard
                      key={project.id}
                      project={project}
                      stats={stats}
                      onEdit={handleOpenModal}
                      onDelete={handleDeleteProject}
                      onComplete={handleCompleteProject}
                      onArchive={handleArchiveProject}
                      viewMode={viewMode}
                    />
                  );
                })}
              </div>
            </SortableContext>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <SortableContext
              items={filteredProjects.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {filteredProjects.map((project, index) => {
                  const stats = allProjectStats[project.id] || getProjectStats(project.id);
                  
                  return (
                    <SortableProjectCard
                      key={project.id}
                      project={project}
                      stats={stats}
                      onEdit={handleOpenModal}
                      onDelete={handleDeleteProject}
                      onComplete={handleCompleteProject}
                      onArchive={handleArchiveProject}
                      viewMode={viewMode}
                    />
                  );
                })}
              </div>
            </SortableContext>
          )}
          
          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Not Started', 'In Progress', 'Completed'].map(status => (
                <div key={status} className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2">
                    {status}
                  </h3>
                  <div className="space-y-3">
                    {filteredProjects
                      .filter(project => {
                        const stats = allProjectStats[project.id] || getProjectStats(project.id);
                        if (status === 'Not Started') return stats.progress === 0;
                        if (status === 'In Progress') return stats.progress > 0 && stats.progress < 100;
                        return stats.progress === 100;
                      })
                      .map((project, index) => {
                        const stats = allProjectStats[project.id] || getProjectStats(project.id);
                        return (
                          <Card
                            key={project.id}
                            variant="glass"
                            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            onClick={() => handleOpenModal(project)}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                  />
                                  {project.name}
                                </h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                  <span>{stats.totalTasks} tasks</span>
                                  <span>{stats.progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                      stats.progress >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                      stats.progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                      'bg-gradient-to-r from-red-500 to-red-600'
                                    }`}
                                    style={{ width: `${stats.progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeProject ? (
              <div className="opacity-90">
                {viewMode === 'grid' ? (
                  <ProjectCard
                    project={activeProject}
                    taskCount={getProjectStats(activeProject.id).totalTasks}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    stats={getProjectStats(activeProject.id)}
                    isDragging={true}
                  />
                ) : (
                  <Card variant="glass" className="shadow-2xl">
                    <div className="flex items-center gap-4 p-6">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activeProject.color }}
                      />
                      <h3 className="text-lg font-semibold">{activeProject.name}</h3>
                    </div>
                  </Card>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Empty
          title="No projects found"
          description={filterMode === 'all' ? "Create your first project to organize your tasks" : "No projects match your current filters"}
          icon={<Folder className="mx-auto h-12 w-12 text-gray-400" />}
          action={
            filterMode === 'all' ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => handleOpenModal()}
              >
                New Project
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilterMode('all')}
              >
                Clear Filters
              </Button>
            )
          }
        />
      )}
      
      {/* Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        key={editingProject ? editingProject.id : 'new'}
      >
        <ProjectForm
          project={editingProject || undefined}
          onClose={handleCloseModal}
          isEdit={!!editingProject}
        />
      </Modal>
      
      {/* Confirmation Dialog */}
      <ConfirmDialogComponent />
      <BackToTop />
    </div>
  );
};

export default ProjectsPage;
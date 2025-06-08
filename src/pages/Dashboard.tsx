import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Folder, 
  Tag, 
  Plus,
  ArrowRight,
  HelpCircle,
  BrainCircuit,
  RefreshCw,
  ListChecks,
  AlertTriangle,
  Sparkles,
  Star,
  TrendingUp
} from 'lucide-react';
import { useAppContext } from '../context/AppContextSupabase';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { TaskDisplay } from '../components/TaskDisplay';
import Modal from '../components/common/Modal';
import { StreamlinedTaskForm } from '../components/tasks/StreamlinedTaskForm';
import { QuickCapture } from '../components/tasks/QuickCapture';
import { 
  getTasksDueToday, 
  getTasksDueThisWeek, 
  getOverdueTasks 
} from '../utils/helpers';
import { Task } from '../types';
import { getIncompleteTasks } from '../utils/taskCompleteness';
import { TaskDetailWizard } from '../components/tasks/TaskDetailWizard';

const Dashboard: React.FC = () => {
  const {
    tasks,
    projects,
    categories,
    isLoading,
    isDataInitialized,
    initializeSampleData,
    deleteTask,
    updateTask,
    needsWeeklyReview,
    getLastWeeklyReviewDate
  } = useAppContext();
  
  const [showWeeklyReviewReminder, setShowWeeklyReviewReminder] = useState(false);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showIncompleteWizard, setShowIncompleteWizard] = useState(false);
  const [currentIncompleteTaskId, setCurrentIncompleteTaskId] = useState<string | null>(null);
  const [recentlyReviewedTaskIds, setRecentlyReviewedTaskIds] = useState<Set<string>>(new Set());
  
  // Check if weekly review is needed
  useEffect(() => {
    setShowWeeklyReviewReminder(needsWeeklyReview());
  }, [needsWeeklyReview]);

  // Calculate task data (always run these hooks before early returns)
  const tasksDueToday = React.useMemo(() => getTasksDueToday(tasks), [tasks]);
  const tasksDueThisWeek = React.useMemo(() => getTasksDueThisWeek(tasks), [tasks]);
  const overdueTasks = React.useMemo(() => getOverdueTasks(tasks), [tasks]);
  const completedTasks = React.useMemo(() => tasks.filter(task => task.completed && !task.parentTaskId), [tasks]);
  const incompleteTasks = React.useMemo(() => tasks.filter(task => !task.completed && !task.parentTaskId), [tasks]);
  
  // Use useMemo to recalculate incomplete tasks when tasks change, excluding recently reviewed ones
  const tasksWithMissingDetails = React.useMemo(() => {
    return getIncompleteTasks(tasks).filter(task => !recentlyReviewedTaskIds.has(task.id));
  }, [tasks, recentlyReviewedTaskIds]);

  const completionRate = React.useMemo(() => {
    return tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  }, [tasks.length, completedTasks.length]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Loading your workspace...</div>
      </div>
    );
  }
  
  if (!isDataInitialized) {
    return (
      <div className="max-w-3xl mx-auto py-8 animate-fadeIn">
        <Card className="shadow-xl bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
              <Sparkles className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent mb-4">
              Welcome to Your ADHD Planner!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
              Let's get you started with some sample data to explore, or jump right in and create your own tasks.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                variant="primary"
                onClick={initializeSampleData}
                className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Star className="w-4 h-4 mr-2" />
                Load Sample Data
              </Button>
              <Link to="/tasks">
                <Button variant="outline" className="hover:bg-primary-50 dark:hover:bg-primary-900/20">
                  Start from Scratch
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-primary-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent tracking-tight">
                Your Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Welcome back! Let's make today productive.</p>
            </div>
            {/* Progress Ring */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" cy="40" r="36" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle 
                    cx="40" cy="40" r="36" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionRate / 100)}`}
                    className="text-success-500 dark:text-success-400 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{completionRate}%</span>
                </div>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-800 dark:text-gray-200">Daily Progress</div>
                <div className="text-gray-600 dark:text-gray-400">{completedTasks.length}/{tasks.length} tasks</div>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={() => handleOpenTaskModal()}
              className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              New Task
            </Button>
            <Link to="/what-now">
              <Button
                variant="outline"
                icon={<HelpCircle size={18} />}
                className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                What Now?
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Task Input */}
      <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
        <QuickCapture
          placeholder="Quick add: Try '!today Buy groceries' or '!high Finish project report'"
        />
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        {/* Weekly Review Reminder */}
        {showWeeklyReviewReminder && (
          <Card className="mb-6 bg-gradient-to-r from-warning-50 to-warning-100 dark:from-warning-900/30 dark:to-warning-800/30 border-2 border-warning-300 dark:border-warning-700 shadow-lg animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 animate-pulse-gentle">
                  <AlertTriangle className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-bold text-warning-900 dark:text-warning-100">Time for your weekly review!</h3>
                  <p className="mt-2 text-warning-800 dark:text-warning-200">
                    Regular reviews help you stay on track and adjust your approach. It only takes a few minutes!
                  </p>
                  <div className="mt-4">
                    <Link to="/weekly-review">
                      <Button
                        variant="primary"
                        className="bg-warning-600 hover:bg-warning-700 dark:bg-warning-500 dark:hover:bg-warning-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        icon={<RefreshCw size={16} />}
                      >
                        Start Weekly Review
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Incomplete Tasks Indicator */}
        {tasksWithMissingDetails.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-focus-50 to-focus-100 dark:from-focus-900/30 dark:to-focus-800/30 border-2 border-focus-300 dark:border-focus-700 shadow-lg animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 animate-float">
                    <Sparkles className="h-6 w-6 text-focus-600 dark:text-focus-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-focus-900 dark:text-focus-100">
                      {tasksWithMissingDetails.length} task{tasksWithMissingDetails.length > 1 ? 's need' : ' needs'} more details
                    </h3>
                    <p className="mt-1 text-focus-700 dark:text-focus-300">
                      Adding details helps your ADHD brain tackle tasks more easily
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (tasksWithMissingDetails.length > 0) {
                      setCurrentIncompleteTaskId(tasksWithMissingDetails[0].id);
                      setShowIncompleteWizard(true);
                    }
                  }}
                  className="px-5 py-2.5 bg-focus-600 hover:bg-focus-700 dark:bg-focus-500 dark:hover:bg-focus-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Review Tasks
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
      
      {/* Memory Tools Section */}
      <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-display font-semibold text-gray-900 dark:text-gray-100">Quick Tools</h2>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Quick links to memory tools */}
          <Card className="lg:col-span-1 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Memory & Planning</h3>
              <div className="space-y-3">
                <Link to="/brain-dump">
                  <div className="group p-4 bg-gradient-to-r from-warning-50 to-warning-100 dark:from-warning-900/30 dark:to-warning-800/30 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between">
                    <div className="flex items-center">
                      <BrainCircuit className="w-5 h-5 text-warning-600 dark:text-warning-400 mr-3 group-hover:animate-wiggle" />
                      <span className="font-medium text-warning-900 dark:text-warning-100">Brain Dump</span>
                    </div>
                    <ArrowRight size={16} className="text-warning-600 dark:text-warning-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link to="/weekly-review">
                  <div className={`group p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between ${showWeeklyReviewReminder ? 'ring-2 ring-warning-400 dark:ring-warning-600' : ''}`}>
                    <div className="flex items-center">
                      <RefreshCw className={`w-5 h-5 text-primary-600 dark:text-primary-400 mr-3 ${showWeeklyReviewReminder ? 'animate-pulse' : ''}`} />
                      <span className="font-medium text-primary-900 dark:text-primary-100">Weekly Review</span>
                      {showWeeklyReviewReminder && (
                        <span className="ml-2 px-2 py-0.5 bg-warning-400 dark:bg-warning-600 text-warning-900 dark:text-warning-100 text-xs rounded-full font-semibold">Due</span>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link to="/accountability">
                  <div className="group p-4 bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/30 dark:to-success-800/30 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between">
                    <div className="flex items-center">
                      <ListChecks className="w-5 h-5 text-success-600 dark:text-success-400 mr-3" />
                      <span className="font-medium text-success-900 dark:text-success-100">Accountability</span>
                    </div>
                    <ArrowRight size={16} className="text-success-600 dark:text-success-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl mt-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-medium">Pro tip:</span> Use these tools when feeling overwhelmed or stuck!
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Mini Brain Dump Widget */}
          <Card className="lg:col-span-2 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-4 bg-gradient-to-r from-warning-100 to-warning-50 dark:from-warning-900/40 dark:to-warning-800/30 border-b border-warning-200 dark:border-warning-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BrainCircuit className="w-5 h-5 text-warning-600 dark:text-warning-400 mr-3 animate-pulse-gentle" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick Capture</h3>
                </div>
                <Link
                  to="/brain-dump"
                  className="text-sm text-warning-600 dark:text-warning-400 hover:text-warning-700 dark:hover:text-warning-300 flex items-center group"
                >
                  Full Brain Dump
                  <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="p-5">
              <div className="bg-gradient-to-r from-warning-50 to-white dark:from-warning-900/20 dark:to-gray-800 rounded-xl p-4 mb-4 border border-warning-200 dark:border-warning-700">
                <p className="text-warning-900 dark:text-warning-100 font-medium">
                  💭 Got something on your mind? Capture it before it disappears!
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5"
                  placeholder="Type your thought and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleOpenTaskModal();
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => handleOpenTaskModal()}
                  icon={<Plus size={18} />}
                  className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Add Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Overdue Section - High Priority at Top */}
      {overdueTasks.length > 0 && (
        <Card
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-500 animate-pulse" />
              Overdue Tasks
            </span>
          }
          className="border-l-4 border-danger-500 dark:border-danger-400 mb-6 shadow-lg animate-fadeInUp"
          style={{ animationDelay: '0.5s' }}
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group"
            >
              View All
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3">
            {overdueTasks.slice(0, 2).map((task, index) => (
              <div key={task.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <TaskDisplay
                  task={task}
                  onToggle={() => updateTask({ ...task, completed: !task.completed })}
                  onEdit={() => handleOpenTaskModal(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              </div>
            ))}
            
            {overdueTasks.length > 2 && (
              <div className="pt-2">
                <Link 
                  to="/tasks?tab=overdue"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center justify-center group"
                >
                  View all {overdueTasks.length} overdue tasks
                  <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Main task sections - more compact layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Today and Coming Up This Week in first row */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Due Today
            </span>
          }
          className="shadow-md hover:shadow-lg transition-shadow duration-200 animate-fadeInUp"
          style={{ animationDelay: '0.6s' }}
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group"
            >
              View All
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {tasksDueToday.slice(0, 3).map((task, index) => (
              <div key={task.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <TaskDisplay
                  task={task}
                  onToggle={() => updateTask({ ...task, completed: !task.completed })}
                  onEdit={() => handleOpenTaskModal(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              </div>
            ))}
            
            {tasksDueToday.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tasks due today</p>
                <p className="text-sm mt-1">Enjoy your free time! 🎉</p>
              </div>
            )}
          </div>
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Coming Up This Week
            </span>
          }
          className="shadow-md hover:shadow-lg transition-shadow duration-200 animate-fadeInUp"
          style={{ animationDelay: '0.7s' }}
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group"
            >
              View All
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {tasksDueThisWeek.filter(task => !tasksDueToday.some(t => t.id === task.id)).slice(0, 3).map((task, index) => (
              <div key={task.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <TaskDisplay
                  task={task}
                  onToggle={() => updateTask({ ...task, completed: !task.completed })}
                  onEdit={() => handleOpenTaskModal(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              </div>
            ))}
            
            {tasksDueThisWeek.filter(task => !tasksDueToday.some(t => t.id === task.id)).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No upcoming tasks this week</p>
                <p className="text-sm mt-1">Time to plan ahead! 📅</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recently Added and Projects in second row */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Recently Added
            </span>
          }
          className="shadow-md hover:shadow-lg transition-shadow duration-200 animate-fadeInUp"
          style={{ animationDelay: '0.8s' }}
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group"
            >
              View All
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {incompleteTasks
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map((task, index) => (
                <div key={task.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskDisplay
                    task={task}
                    onToggle={() => updateTask({ ...task, completed: !task.completed })}
                    onEdit={() => handleOpenTaskModal(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                </div>
              ))
            }
            
            {incompleteTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent tasks</p>
                <p className="text-sm mt-1">Add your first task above! ✨</p>
              </div>
            )}
          </div>
        </Card>
        
        <Card
          title={
            <span className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Projects
            </span>
          }
          className="shadow-md hover:shadow-lg transition-shadow duration-200 animate-fadeInUp"
          style={{ animationDelay: '0.9s' }}
          headerAction={
            <Link 
              to="/projects"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group"
            >
              View All
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {projects.slice(0, 4).map((project, index) => {
              const projectTasks = tasks.filter(
                task => task.projectId === project.id && !task.completed
              );
              
              return (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] animate-fadeIn"
                  style={{ 
                    backgroundColor: project.color + '15',
                    borderColor: project.color + '40',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3 shadow-sm" 
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{project.name}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              );
            })}
            
            {projects.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No projects yet</p>
                <p className="text-sm mt-1">Organize tasks into projects! 📁</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 animate-fadeInUp" style={{ animationDelay: '1s' }}>
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Task Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {overdueTasks.length > 0 && (
                <div className="text-center p-4 bg-gradient-to-br from-danger-50 to-danger-100 dark:from-danger-900/30 dark:to-danger-800/20 rounded-xl border border-danger-200 dark:border-danger-700 hover:shadow-md transition-all duration-200">
                  <p className="text-3xl font-bold text-danger-600 dark:text-danger-400 animate-pulse">{overdueTasks.length}</p>
                  <p className="text-sm text-danger-700 dark:text-danger-300 font-medium mt-1">Overdue</p>
                </div>
              )}
              <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:shadow-md transition-all duration-200">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-200">{incompleteTasks.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Tasks</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/30 dark:to-success-800/20 rounded-xl hover:shadow-md transition-all duration-200">
                <p className="text-3xl font-bold text-success-600 dark:text-success-400">{completedTasks.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Completed</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 rounded-xl hover:shadow-md transition-all duration-200">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{projects.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Projects</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recently Completed at bottom */}
      {completedTasks.length > 0 && (
        <Card
          title={
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
              Recently Completed
            </span>
          }
          className="border-l-4 border-success-500 dark:border-success-400 mt-6 shadow-md hover:shadow-lg transition-shadow duration-200 animate-fadeInUp"
          style={{ animationDelay: '1.1s' }}
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center group"
            >
              View All
              <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {completedTasks
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 3)
              .map((task, index) => (
                <div key={task.id} className="animate-fadeIn opacity-75 hover:opacity-100 transition-opacity" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskDisplay
                    task={task}
                    onToggle={() => updateTask({ ...task, completed: !task.completed })}
                    onEdit={() => handleOpenTaskModal(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                </div>
              ))
            }
          </div>
        </Card>
      )}
      
      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <StreamlinedTaskForm
          task={editingTask || undefined}
          onClose={handleCloseTaskModal}
          isEdit={!!editingTask}
        />
      </Modal>
      
      {/* Task Detail Wizard for Incomplete Tasks */}
      {showIncompleteWizard && currentIncompleteTaskId && (
        <TaskDetailWizard
          task={tasks.find(t => t.id === currentIncompleteTaskId) || tasksWithMissingDetails[0]}
          isOpen={showIncompleteWizard}
          onClose={() => {
            setShowIncompleteWizard(false);
            setCurrentIncompleteTaskId(null);
          }}
          onComplete={async (updatedTask) => {
            await updateTask(updatedTask);
            
            // Mark this task as recently reviewed
            setRecentlyReviewedTaskIds(prev => new Set([...prev, updatedTask.id]));
            
            // Get fresh list of incomplete tasks excluding reviewed ones
            const remainingIncompleteTasks = getIncompleteTasks(tasks)
              .filter(t => t.id !== updatedTask.id && !recentlyReviewedTaskIds.has(t.id));
            
            if (remainingIncompleteTasks.length > 0) {
              // Move to the next incomplete task
              setCurrentIncompleteTaskId(remainingIncompleteTasks[0].id);
              // Force re-render by closing and reopening
              setShowIncompleteWizard(false);
              setTimeout(() => setShowIncompleteWizard(true), 50);
            } else {
              // No more incomplete tasks
              setShowIncompleteWizard(false);
              setCurrentIncompleteTaskId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
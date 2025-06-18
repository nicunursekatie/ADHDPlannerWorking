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
  TrendingUp,
  Compass,
  Lightbulb
} from 'lucide-react';
import { useAppContext } from '../context/AppContextSupabase';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { TaskDisplay } from '../components/TaskDisplay';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import { QuickCapture } from '../components/tasks/QuickCapture';
import { 
  getTasksDueToday, 
  getTasksDueThisWeek, 
  getOverdueTasks 
} from '../utils/helpers';
import { Task } from '../types';
import { getIncompleteTasks } from '../utils/taskCompleteness';
import { TaskDetailWizard } from '../components/tasks/TaskDetailWizard';
import { getTimeContext, formatTimeRemaining, formatTimeOfDay, getUrgencyColor } from '../utils/timeAwareness';
import { focusTracker } from '../utils/focusTracker';

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showHyperfocusAlert, setShowHyperfocusAlert] = useState(false);
  
  // Check if weekly review is needed
  useEffect(() => {
    setShowWeeklyReviewReminder(needsWeeklyReview());
  }, [needsWeeklyReview]);

  // Update current time every minute for time awareness
  useEffect(() => {
    focusTracker.initialize();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Check for hyperfocus alert
      if (focusTracker.shouldSuggestBreak()) {
        setShowHyperfocusAlert(true);
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

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

  // Time awareness context
  const timeContext = React.useMemo(() => getTimeContext(tasks), [tasks, currentTime]);
  
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
    <div className="min-h-screen space-y-4 animate-fadeIn">
      {/* Quick Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => document.getElementById('due-today')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl font-semibold text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors whitespace-nowrap"
          >
            🔥 Due Today
          </button>
          <button
            onClick={() => document.getElementById('quick-capture')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-semibold text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap"
          >
            ⚡ Quick Capture
          </button>
          <button
            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl font-semibold text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors whitespace-nowrap"
          >
            🧠 Tools
          </button>
          <button
            onClick={() => document.getElementById('weekly-tasks')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-semibold text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors whitespace-nowrap"
          >
            📅 This Week
          </button>
          <button
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap"
          >
            📁 Projects
          </button>
          <button
            onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            📊 Stats
          </button>
        </div>
      </div>

      {/* Enhanced Compact Header */}
      <div className="relative overflow-hidden">
        <Card 
          variant="glass-purple" 
          padding="md" 
          gradient
          className="border-0 shadow-purple-lg bg-gradient-to-r from-primary-500/90 via-primary-600/90 to-accent-500/90"
        >
          {/* Animated background sparkles when over 50% */}
          {completionRate >= 50 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-8 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-16 w-1.5 h-1.5 bg-accent-200/80 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-6 left-16 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-4 right-8 w-0.5 h-0.5 bg-primary-200/60 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-6 relative z-10">
            {/* Left side: Welcome + Progress + Stats */}
            <div className="flex items-center gap-8 flex-1">
              <div>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-1">
                  Your Dashboard
                </h1>
                <p className="text-white/80 font-medium">
                  Ready to tackle today's goals?
                </p>
              </div>
              
              {/* Beautiful Progress Ring */}
              <div className="relative w-20 h-20 flex-shrink-0 group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-accent-300/20 rounded-full group-hover:from-white/20 group-hover:to-accent-300/30 transition-all duration-500"></div>
                <svg className="w-20 h-20 transform -rotate-90 relative z-10">
                  <circle 
                    cx="40" cy="40" r="32" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="none"
                    className="text-white/20"
                  />
                  <circle 
                    cx="40" cy="40" r="32" 
                    stroke="url(#progressGradient)" 
                    strokeWidth="6" 
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionRate / 100)}`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white animate-number-ticker">{completionRate}%</span>
                  <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">Progress</span>
                </div>
              </div>

              {/* Time Awareness + Task Stats */}
              <div className="flex flex-col gap-2">
                {/* Next Deadline Alert */}
                {timeContext.nextDeadline && Math.abs(timeContext.nextDeadline.minutesUntil) < 240 && (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getUrgencyColor(timeContext.nextDeadline.urgency)} backdrop-blur-sm`}>
                    {timeContext.nextDeadline.urgency === 'critical' ? '🚨 ' : timeContext.nextDeadline.urgency === 'urgent' ? '⚠️ ' : '⏰ '}
                    {timeContext.nextDeadline.task.title} {timeContext.nextDeadline.minutesUntil < 0 ? 'overdue by' : 'in'} {formatTimeRemaining(timeContext.nextDeadline.minutesUntil)}
                  </div>
                )}
                
                {/* Time Context */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-300 rounded-full shadow-sm"></div>
                    <span className="text-white/90 font-semibold text-sm">
                      {timeContext.productiveHoursRemaining.toFixed(1)}h productive time left
                      {timeContext.isUsingNextDay ? 
                        <span className="text-cyan-200 ml-1">(tomorrow)</span> : ''
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success-300 rounded-full shadow-sm"></div>
                    <span className="text-white/90 font-semibold text-sm">{completedTasks.length} completed today</span>
                  </div>
                </div>
                
                {/* Day Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${timeContext.dayProgress * 100}%` }}
                  ></div>
                </div>
                <span className="text-white/70 text-xs">
                  {formatTimeOfDay(timeContext.currentTime)} • Day {Math.round(timeContext.dayProgress * 100)}% complete
                </span>
              </div>
            </div>

            {/* Prominent Help Button */}
            <Link 
              to="/what-now" 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div>
                <div className="text-sm font-bold">Help me choose</div>
                <div className="text-xs text-white/70">AI recommendations</div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
      
      {/* PRIORITY #1: Due Today */}
      <Card
        id="due-today"
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-danger-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">Due Today</span>
            </div>
            
            {/* Time Reality Warning */}
            {(tasksDueToday.length > 0 || overdueTasks.length > 0) && (
              <div className="text-sm text-orange-600 font-medium">
                {(() => {
                  const totalTasks = tasksDueToday.length + overdueTasks.length;
                  const estimatedHours = totalTasks * 0.5; // Rough estimate
                  const hoursLeft = timeContext.productiveHoursRemaining;
                  
                  if (estimatedHours > hoursLeft) {
                    return (
                      <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                        ⚠️ {estimatedHours.toFixed(1)}h of work, only {hoursLeft.toFixed(1)}h left
                      </div>
                    );
                  } else if (estimatedHours > hoursLeft * 0.8) {
                    return (
                      <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                        ⏱️ Tight schedule: {estimatedHours.toFixed(1)}h planned
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        ✅ Manageable: {estimatedHours.toFixed(1)}h planned
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        }
        padding="md"
        className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-xl"
        headerAction={
          <Link 
            to="/tasks"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
          >
            View All
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        }
      >
        <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-visible pr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
          {/* Show overdue tasks first with red accent */}
          {overdueTasks.slice(0, 2).map((task, index) => (
            <div key={task.id} className="animate-fadeIn border-l-4 border-red-500 pl-2 bg-red-50/50 rounded-r-xl" style={{ animationDelay: `${index * 0.1}s` }}>
              <TaskDisplay
                task={task}
                onToggle={() => {
                  // Create clean update object without computed fields
                  const updateData = {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    completed: !task.completed,
                    archived: task.archived,
                    dueDate: task.dueDate,
                    projectId: task.projectId,
                    categoryIds: task.categoryIds,
                    parentTaskId: task.parentTaskId,
                    priority: task.priority,
                    energyLevel: task.energyLevel,
                    size: task.size,
                    estimatedMinutes: task.estimatedMinutes,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    tags: task.tags,
                    isRecurring: task.isRecurring,
                    recurrencePattern: task.recurrencePattern,
                    recurrenceInterval: task.recurrenceInterval,
                    recurringTaskId: task.recurringTaskId,
                    projectPhase: task.projectPhase,
                    phaseOrder: task.phaseOrder,
                    deletedAt: task.deletedAt,
                    showSubtasks: task.showSubtasks,
                    braindumpSource: task.braindumpSource,
                    completedAt: !task.completed ? new Date().toISOString() : null,
                    aiProcessed: task.aiProcessed,
                    urgency: task.urgency,
                    importance: task.importance,
                    emotionalWeight: task.emotionalWeight,
                    energyRequired: task.energyRequired
                  } as Task;
                  updateTask(updateData);
                }}
                onEdit={() => handleOpenTaskModal(task)}
                onDelete={() => deleteTask(task.id)}
              />
            </div>
          ))}
          
          {/* Then show tasks due today */}
          {tasksDueToday.slice(0, 3).map((task, index) => (
            <div key={task.id} className="animate-fadeIn" style={{ animationDelay: `${(overdueTasks.length + index) * 0.1}s` }}>
              <TaskDisplay
                task={task}
                onToggle={() => {
                  // Create clean update object without computed fields
                  const updateData = {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    completed: !task.completed,
                    archived: task.archived,
                    dueDate: task.dueDate,
                    projectId: task.projectId,
                    categoryIds: task.categoryIds,
                    parentTaskId: task.parentTaskId,
                    priority: task.priority,
                    energyLevel: task.energyLevel,
                    size: task.size,
                    estimatedMinutes: task.estimatedMinutes,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    tags: task.tags,
                    isRecurring: task.isRecurring,
                    recurrencePattern: task.recurrencePattern,
                    recurrenceInterval: task.recurrenceInterval,
                    recurringTaskId: task.recurringTaskId,
                    projectPhase: task.projectPhase,
                    phaseOrder: task.phaseOrder,
                    deletedAt: task.deletedAt,
                    showSubtasks: task.showSubtasks,
                    braindumpSource: task.braindumpSource,
                    completedAt: !task.completed ? new Date().toISOString() : null,
                    aiProcessed: task.aiProcessed,
                    urgency: task.urgency,
                    importance: task.importance,
                    emotionalWeight: task.emotionalWeight,
                    energyRequired: task.energyRequired
                  } as Task;
                  updateTask(updateData);
                }}
                onEdit={() => handleOpenTaskModal(task)}
                onDelete={() => deleteTask(task.id)}
              />
            </div>
          ))}
          
          {tasksDueToday.length === 0 && overdueTasks.length === 0 && (
            <div className="text-center py-12 text-success-600 dark:text-success-400">
              <div className="w-20 h-20 bg-gradient-to-r from-success-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-success-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nothing due today! 🎉</h3>
              <p className="text-success-500">You're ahead of the game. Time to relax or get ahead on tomorrow!</p>
            </div>
          )}
          
          {tasksDueToday.length === 0 && overdueTasks.length > 0 && (
            <div className="text-center py-8 text-orange-600 dark:text-orange-400">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">No new tasks today, but you have overdue items above!</h3>
              <p className="text-orange-500">Focus on catching up first, then you'll be free! 💪</p>
            </div>
          )}
        </div>
      </Card>

      {/* PRIORITY #2: Quick Capture - Compact */}
      <Card id="quick-capture" variant="glass" padding="sm" className="border border-white/20 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-primary-500 rounded-xl flex items-center justify-center shadow-md">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <QuickCapture
              placeholder="Quick capture: '!today Buy groceries' or just 'Call mom'"
            />
          </div>
        </div>
      </Card>

      {/* PRIORITY #3: Coming Up This Week */}
      <Card
        id="weekly-tasks"
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-md">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">Coming Up This Week</span>
          </div>
        }
        padding="md"
        className="shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 backdrop-blur-xl"
        headerAction={
          <Link 
            to="/tasks"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
          >
            View All
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        }
      >
        <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-visible pr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
          {tasksDueThisWeek.filter(task => !tasksDueToday.some(t => t.id === task.id)).slice(0, 3).map((task, index) => (
            <div key={task.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <TaskDisplay
                task={task}
                onToggle={() => {
                  // Create clean update object without computed fields
                  const updateData = {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    completed: !task.completed,
                    archived: task.archived,
                    dueDate: task.dueDate,
                    projectId: task.projectId,
                    categoryIds: task.categoryIds,
                    parentTaskId: task.parentTaskId,
                    priority: task.priority,
                    energyLevel: task.energyLevel,
                    size: task.size,
                    estimatedMinutes: task.estimatedMinutes,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    tags: task.tags,
                    isRecurring: task.isRecurring,
                    recurrencePattern: task.recurrencePattern,
                    recurrenceInterval: task.recurrenceInterval,
                    recurringTaskId: task.recurringTaskId,
                    projectPhase: task.projectPhase,
                    phaseOrder: task.phaseOrder,
                    deletedAt: task.deletedAt,
                    showSubtasks: task.showSubtasks,
                    braindumpSource: task.braindumpSource,
                    completedAt: !task.completed ? new Date().toISOString() : null,
                    aiProcessed: task.aiProcessed,
                    urgency: task.urgency,
                    importance: task.importance,
                    emotionalWeight: task.emotionalWeight,
                    energyRequired: task.energyRequired
                  } as Task;
                  updateTask(updateData);
                }}
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

      {/* Hyperfocus Alert */}
      {showHyperfocusAlert && (
        <div className="bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-2 border-purple-400/40 rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Hyperfocus alert! Remember to eat! 🍎</h3>
              <p className="text-sm text-text-secondary">You've been focused for 2+ hours. Time for a break!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                focusTracker.endFocus();
                setShowHyperfocusAlert(false);
              }}
              className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Take Break
            </button>
            <button
              onClick={() => setShowHyperfocusAlert(false)}
              className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Keep Going
            </button>
          </div>
        </div>
      )}

      {/* PRIORITY #4: Weekly Review Banner */}
      {showWeeklyReviewReminder && (
        <div className="bg-gradient-to-r from-warning-500/15 to-danger-500/15 border-2 border-warning-400/40 rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-warning-500 to-danger-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse-gentle">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Weekly review due</h3>
              <p className="text-sm text-text-secondary">Stay on track with a quick review</p>
            </div>
          </div>
          <Link 
            to="/weekly-review"
            className="bg-gradient-to-r from-warning-500 to-danger-500 hover:from-warning-600 hover:to-danger-600 px-4 py-2 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Start Review
          </Link>
        </div>
      )}
      
      {/* Tools & Navigation */}
      <div id="tools" className="animate-slideInUp stagger-3">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-display font-bold text-text-primary mb-2">Quick Tools</h2>
            <p className="text-text-tertiary">Your ADHD-friendly productivity arsenal</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/80 hover:bg-white border border-gray-200 hover:border-primary-200 rounded-2xl px-6 py-3 text-text-secondary hover:text-text-primary transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-semibold">Refresh</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Memory & Planning Tools */}
          <Card variant="glass-purple" className="group w-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center">
                <BrainCircuit className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-text-primary">Memory & Planning</h3>
                <p className="text-text-tertiary">Tools for your ADHD brain</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link to="/brain-dump" className="block group/item">
                <div className="bg-gradient-to-r from-warning-500/10 to-warning-600/10 border border-warning-400/20 rounded-2xl p-6 hover:bg-gradient-to-r hover:from-warning-500/20 hover:to-warning-600/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-warning-500/20 rounded-xl flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-warning-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-lg">Brain Dump</h4>
                        <p className="text-text-tertiary text-sm">Clear your mental clutter</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-warning-400 group-hover/item:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>

              <Link to="/weekly-review" className="block group/item">
                <div className={`bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-400/20 rounded-2xl p-6 hover:bg-gradient-to-r hover:from-primary-500/20 hover:to-accent-500/20 transition-all duration-300 hover:-translate-y-1 ${showWeeklyReviewReminder ? 'ring-2 ring-warning-400/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                        <RefreshCw className={`w-5 h-5 text-primary-400 ${showWeeklyReviewReminder ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-text-primary text-lg">Weekly Review</h4>
                          {showWeeklyReviewReminder && (
                            <span className="px-2 py-1 bg-warning-500 text-white text-xs rounded-full font-bold">Due</span>
                          )}
                        </div>
                        <p className="text-text-tertiary text-sm">Reflect and adjust</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary-400 group-hover/item:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>

              <Link to="/accountability" className="block group/item">
                <div className="bg-gradient-to-r from-success-500/10 to-success-600/10 border border-success-400/20 rounded-2xl p-6 hover:bg-gradient-to-r hover:from-success-500/20 hover:to-success-600/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-success-500/20 rounded-xl flex items-center justify-center">
                        <ListChecks className="w-5 h-5 text-success-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-lg">Accountability</h4>
                        <p className="text-text-tertiary text-sm">Stay on track</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-success-400 group-hover/item:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </div>
            
            {tasksWithMissingDetails.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    if (tasksWithMissingDetails.length > 0) {
                      setCurrentIncompleteTaskId(tasksWithMissingDetails[0].id);
                      setShowIncompleteWizard(true);
                    }
                  }}
                  className="flex items-center gap-3 text-text-tertiary hover:text-text-secondary transition-colors duration-300 group/tip"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Optional: Add details to {tasksWithMissingDetails.length} task{tasksWithMissingDetails.length > 1 ? 's' : ''}</span>
                  <ArrowRight className="w-3 h-3 group-hover/tip:translate-x-0.5 transition-transform duration-300" />
                </button>
              </div>
            )}
          </Card>

          {/* Mini Brain Dump Widget */}
          <Card className="w-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
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
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="p-5">
              <div className="bg-gradient-to-r from-warning-50 to-white dark:from-warning-900/20 dark:to-gray-800 rounded-xl p-4 mb-4 border border-warning-200 dark:border-warning-700">
                <p className="text-warning-900 dark:text-warning-100 font-medium">
                  💭 Got something on your mind? Capture it before it disappears!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="flex-1 w-full rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5"
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
                  className="w-full sm:w-auto shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Add Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Secondary task sections - below the fold */}
      <div id="projects" className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden space-y-0">
        {/* Recently Added and Projects */}
        <Card
          title={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Recently Added</span>
            </div>
          }
          padding="md"
          className="shadow-lg hover:shadow-xl transition-all duration-300 animate-fadeInUp border border-white/20 backdrop-blur-xl"
          style={{ animationDelay: '0.8s' }}
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
            >
              View All
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-visible pr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {incompleteTasks
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map((task, index) => (
                <div key={task.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskDisplay
                    task={task}
                    onToggle={() => {
                  // Create clean update object without computed fields
                  const updateData = {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    completed: !task.completed,
                    archived: task.archived,
                    dueDate: task.dueDate,
                    projectId: task.projectId,
                    categoryIds: task.categoryIds,
                    parentTaskId: task.parentTaskId,
                    priority: task.priority,
                    energyLevel: task.energyLevel,
                    size: task.size,
                    estimatedMinutes: task.estimatedMinutes,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    tags: task.tags,
                    isRecurring: task.isRecurring,
                    recurrencePattern: task.recurrencePattern,
                    recurrenceInterval: task.recurrenceInterval,
                    recurringTaskId: task.recurringTaskId,
                    projectPhase: task.projectPhase,
                    phaseOrder: task.phaseOrder,
                    deletedAt: task.deletedAt,
                    showSubtasks: task.showSubtasks,
                    braindumpSource: task.braindumpSource,
                    completedAt: !task.completed ? new Date().toISOString() : null,
                    aiProcessed: task.aiProcessed,
                    urgency: task.urgency,
                    importance: task.importance,
                    emotionalWeight: task.emotionalWeight,
                    energyRequired: task.energyRequired
                  } as Task;
                  updateTask(updateData);
                }}
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Folder className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Projects</span>
            </div>
          }
          padding="md"
          className="shadow-lg hover:shadow-xl transition-all duration-300 animate-fadeInUp border border-white/20 backdrop-blur-xl"
          style={{ animationDelay: '0.9s' }}
          headerAction={
            <Link 
              to="/projects"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
            >
              View All
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-visible pr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
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
      <div id="stats" className="animate-fadeInUp" style={{ animationDelay: '1s' }}>
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Recently Completed</span>
            </div>
          }
          className="border-l-4 border-success-500 dark:border-success-400 mt-6 shadow-md hover:shadow-lg transition-shadow duration-200 animate-fadeInUp"
          style={{ animationDelay: '1.1s' }}
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
            >
              View All
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-visible pr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {completedTasks
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 3)
              .map((task, index) => (
                <div key={task.id} className="animate-fadeIn opacity-75 hover:opacity-100 transition-opacity" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskDisplay
                    task={task}
                    onToggle={() => {
                  // Create clean update object without computed fields
                  const updateData = {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    completed: !task.completed,
                    archived: task.archived,
                    dueDate: task.dueDate,
                    projectId: task.projectId,
                    categoryIds: task.categoryIds,
                    parentTaskId: task.parentTaskId,
                    priority: task.priority,
                    energyLevel: task.energyLevel,
                    size: task.size,
                    estimatedMinutes: task.estimatedMinutes,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    tags: task.tags,
                    isRecurring: task.isRecurring,
                    recurrencePattern: task.recurrencePattern,
                    recurrenceInterval: task.recurrenceInterval,
                    recurringTaskId: task.recurringTaskId,
                    projectPhase: task.projectPhase,
                    phaseOrder: task.phaseOrder,
                    deletedAt: task.deletedAt,
                    showSubtasks: task.showSubtasks,
                    braindumpSource: task.braindumpSource,
                    completedAt: !task.completed ? new Date().toISOString() : null,
                    aiProcessed: task.aiProcessed,
                    urgency: task.urgency,
                    importance: task.importance,
                    emotionalWeight: task.emotionalWeight,
                    energyRequired: task.energyRequired
                  } as Task;
                  updateTask(updateData);
                }}
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
        size="3xl"
      >
        <TaskForm
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
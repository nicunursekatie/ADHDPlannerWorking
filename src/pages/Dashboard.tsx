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
  Repeat
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
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

const Dashboard: React.FC = () => {
  const {
    tasks,
    projects,
    categories,
    recurringTasks,
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
  
  // Check if weekly review is needed
  useEffect(() => {
    setShowWeeklyReviewReminder(needsWeeklyReview());
  }, [needsWeeklyReview]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  if (!isDataInitialized) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to TaskManager!
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have any data yet. Would you like to start with some sample data?
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                variant="primary"
                onClick={initializeSampleData}
              >
                Load Sample Data
              </Button>
              <Link to="/tasks">
                <Button variant="outline">
                  Start from Scratch
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  const tasksDueToday = getTasksDueToday(tasks);
  const tasksDueThisWeek = getTasksDueThisWeek(tasks);
  const overdueTasks = getOverdueTasks(tasks);
  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasks = tasks.filter(task => !task.completed);
  
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
  
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white dark:bg-gray-800/30 rounded-xl shadow-sm dark:shadow-xl border border-gray-200 dark:border-gray-700/50 p-6 mb-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Your task overview</p>
          </div>
          {/* Progress Ring */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="#374151" strokeWidth="4" fill="none"
                />
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="#10b981" strokeWidth="4" fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionRate / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{completionRate}%</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-800 dark:text-gray-200">Daily Progress</div>
              <div className="text-gray-600 dark:text-gray-400">{completedTasks.length}/{tasks.length} tasks</div>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenTaskModal()}
            size="sm"
          >
            New Task
          </Button>
          <Link to="/what-now">
            <Button
              variant="outline"
              icon={<HelpCircle size={16} />}
            >
              What Now?
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Quick Task Input */}
      <div className="mb-6">
        <QuickCapture
          placeholder="Add a new task... (try !today, !tomorrow, !high)"
        />
      </div>

      {/* Weekly Review Reminder */}
      {showWeeklyReviewReminder && (
        <Card className="mb-6 bg-amber-900/30 border-2 border-amber-700">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-bold text-amber-900">Time for your weekly review!</h3>
                <div className="mt-2 text-sm text-amber-800">
                  <p>It's been a week since your last review. Taking time to reflect helps with ADHD management.</p>
                </div>
                <div className="mt-4">
                  <Link to="/weekly-review">
                    <Button
                      variant="primary"
                      className="bg-yellow-600 hover:bg-yellow-700"
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
      
      {/* Memory Tools Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Remember & Review</h2>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Quick links to memory tools */}
          <Card className="lg:col-span-1">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Memory Tools</h3>
              <div className="space-y-2">
                <Link to="/brain-dump">
                  <div className="p-3 bg-yellow-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center">
                      <BrainCircuit className="w-5 h-5 text-amber-600 mr-2" />
                      <span className="font-medium text-amber-900">Brain Dump</span>
                    </div>
                    <ArrowRight size={16} className="text-amber-600" />
                  </div>
                </Link>

                <Link to="/weekly-review">
                  <div className={`p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer flex items-center justify-between`}>
                    <div className="flex items-center">
                      <RefreshCw className={`w-5 h-5 ${showWeeklyReviewReminder ? 'text-yellow-400' : 'text-yellow-400'} mr-2`} />
                      <span className="font-medium text-amber-900">Weekly Review</span>
                      {showWeeklyReviewReminder && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-400 text-amber-900 text-xs rounded-full border border-amber-700">Due</span>
                      )}
                    </div>
                    <ArrowRight size={16} className={`${showWeeklyReviewReminder ? 'text-yellow-400' : 'text-yellow-400'}`} />
                  </div>
                </Link>

                <Link to="/accountability">
                  <div className="p-3 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center">
                      <ListChecks className="w-5 h-5 text-amber-400 mr-2" />
                      <span className="font-medium text-amber-900">Accountability Check-In</span>
                    </div>
                    <ArrowRight size={16} className="text-amber-400" />
                  </div>
                </Link>

                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg mt-3">
                  <p className="text-sm">
                    Use these tools to help capture tasks you might forget, review your progress, and adjust your approach.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Mini Brain Dump Widget */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="p-3 bg-amber-100 border-b border-amber-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BrainCircuit className="w-5 h-5 text-amber-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Quick Brain Dump</h3>
                </div>
                <Link
                  to="/brain-dump"
                  className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
                >
                  Full Version
                  <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
            <div className="p-4">
              <div className="bg-amber-100 rounded-lg p-3 mb-4">
                <div className="text-amber-900">
                  Think of something you need to remember? Add it now:
                </div>
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 rounded-l-md bg-amber-50 border-amber-300 text-gray-900 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm placeholder-amber-400"
                  placeholder="Add something you just remembered..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const value = e.currentTarget.value;
                      handleOpenTaskModal();
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  className="rounded-l-none"
                  onClick={() => handleOpenTaskModal()}
                  icon={<Plus size={16} />}
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
          title="Overdue Tasks"
          className="border-l-4 border-red-500 mb-6"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2">
            {overdueTasks.slice(0, 2).map(task => (
              <TaskDisplay
              key={task.id}
              task={task}
              onToggle={() => updateTask({ ...task, completed: !task.completed })}
              onEdit={() => handleOpenTaskModal(task)}
              onDelete={() => deleteTask(task.id)}
            />
            ))}
            
            {overdueTasks.length > 2 && (
              <div className="pt-1">
                <Link 
                  to="/tasks?tab=overdue"
                  className="text-sm text-amber-600 hover:text-amber-500 flex items-center justify-center"
                >
                  View all {overdueTasks.length} overdue tasks
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Main task sections - more compact layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Due Today and Coming Up This Week in first row */}
        <Card
          title="Due Today"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tasksDueToday.slice(0, 3).map(task => (
              <TaskDisplay
              key={task.id}
              task={task}
              onToggle={() => updateTask({ ...task, completed: !task.completed })}
              onEdit={() => handleOpenTaskModal(task)}
              onDelete={() => deleteTask(task.id)}
            />
            ))}
            
            {tasksDueToday.length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No tasks due today
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Coming Up This Week"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tasksDueThisWeek.filter(task => !tasksDueToday.some(t => t.id === task.id)).slice(0, 3).map(task => (
              <TaskDisplay
              key={task.id}
              task={task}
              onToggle={() => updateTask({ ...task, completed: !task.completed })}
              onEdit={() => handleOpenTaskModal(task)}
              onDelete={() => deleteTask(task.id)}
            />
            ))}
            
            {tasksDueThisWeek.filter(task => !tasksDueToday.some(t => t.id === task.id)).length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No upcoming tasks this week
              </div>
            )}
          </div>
        </Card>

        {/* Recently Added and Projects in second row */}
        <Card
          title="Recently Added"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {incompleteTasks
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map(task => (
                <TaskDisplay
                key={task.id}
                task={task}
                onToggle={() => updateTask({ ...task, completed: !task.completed })}
                onEdit={() => handleOpenTaskModal(task)}
                onDelete={() => deleteTask(task.id)}
              />
              ))
            }
            
            {incompleteTasks.length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No recently added tasks
              </div>
            )}
          </div>
        </Card>
        
        <Card
          title="Projects"
          headerAction={
            <Link 
              to="/projects"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {projects.slice(0, 4).map(project => {
              const projectTasks = tasks.filter(
                task => task.projectId === project.id && !task.completed
              );
              
              return (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-2 rounded-lg border transition-colors"
                  style={{ 
                    backgroundColor: project.color + '20', // 12.5% opacity for pale background
                    borderColor: project.color
                  }}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <span className="font-medium text-gray-900">{project.name}</span>
                  </div>
                  <span className="text-sm text-amber-700">
                    {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              );
            })}
            
            {projects.length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No projects yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recurring Tasks Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          title="Recurring Tasks"
          headerAction={
            <Link 
              to="/recurring-tasks"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
            >
              Manage
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg">
              <div className="flex items-center">
                <Repeat size={20} className="text-yellow-400 mr-3" />
                <div>
                <p className="font-medium text-gray-900">{recurringTasks.length}</p>
                <p className="text-sm text-gray-600">Active Recurring Tasks</p>
                </div>
              </div>
            </div>
            
            {recurringTasks.filter(rt => rt.active).slice(0, 3).map(task => {
              const daysUntilDue = Math.ceil((new Date(task.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-800/40 rounded-lg">
                  <div className="flex items-center">
                    <Repeat size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">{task.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    daysUntilDue <= 0 ? 'bg-red-100 text-red-700' :
                    daysUntilDue <= 1 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {daysUntilDue <= 0 ? 'Due today' : 
                     daysUntilDue === 1 ? 'Tomorrow' : 
                     `In ${daysUntilDue} days`}
                  </span>
                </div>
              );
            })}
            
            {recurringTasks.length === 0 && (
              <div className="text-center py-3 text-gray-500">
                <p>No recurring tasks yet</p>
                <Link to="/recurring-tasks" className="text-amber-600 hover:text-amber-800 text-sm">
                  Create your first recurring task
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Task Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {overdueTasks.length > 0 && (
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueTasks.length}!</p>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">Overdue</p>
                </div>
              )}
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{incompleteTasks.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Tasks</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{projects.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Projects</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      
      {/* Recently Completed at bottom */}
      {completedTasks.length > 0 && (
        <Card
          title="Recently Completed"
          className="border-l-4 border-green-500 mt-4"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-amber-600 hover:text-amber-500 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {completedTasks
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 3)
              .map(task => (
                <TaskDisplay
                key={task.id}
                task={task}
                onToggle={() => updateTask({ ...task, completed: !task.completed })}
                onEdit={() => handleOpenTaskModal(task)}
                onDelete={() => deleteTask(task.id)}
              />
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
    </div>
  );
};

export default Dashboard;
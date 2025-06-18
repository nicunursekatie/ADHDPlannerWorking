import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContextSupabase';
import { Task } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatDate } from '../../utils/helpers';
import { 
  AlertCircle, 
  BarChart2, 
  CheckCircle, 
  Clock, 
  RefreshCw
} from 'lucide-react';

interface AccountabilityCheckInProps {
  onTaskUpdated?: () => void;
}

type Reason = {
  id: string;
  text: string;
  frequency: number;
  isCommon: boolean;
};

type TaskWithReason = {
  task: Task;
  selectedReason: string | null;
  customReason: string;
  action: 'reschedule' | 'break_down' | 'delegate' | 'abandon' | 'completed' | 'blocked' | null;
  rescheduleDate?: string;
};

const AccountabilityCheckIn: React.FC<AccountabilityCheckInProps> = ({ onTaskUpdated }) => {
  const { tasks, updateTask, deleteTask } = useAppContext();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [tasksWithReasons, setTasksWithReasons] = useState<TaskWithReason[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completionRate, setCompletionRate] = useState(0);
  const [lastUpdatedTask, setLastUpdatedTask] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Common reasons for not completing tasks - streamlined list
  const [commonReasons, setCommonReasons] = useState<Reason[]>([
    { id: 'already_done', text: 'I completed it', frequency: 0, isCommon: true },
    { id: 'forgot', text: 'I forgot', frequency: 0, isCommon: true },
    { id: 'not_relevant', text: 'No longer relevant', frequency: 0, isCommon: true },
    { id: 'too_vague', text: 'Too vague or complex', frequency: 0, isCommon: true },
    { id: 'no_time', text: 'Ran out of time', frequency: 0, isCommon: true },
    { id: 'overwhelming', text: 'Felt overwhelming', frequency: 0, isCommon: true },
    { id: 'waiting', text: 'Waiting on someone/something', frequency: 0, isCommon: true }
  ]);
  
  // Get date for 7 days ago
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  const lastWeekStr = formatDate(lastWeek);
  

  // Find tasks that need attention (overdue or without due dates)
  const tasksNeedingAttention = tasks.filter(task => {
    if (task.completed) return false;
    
    // Include tasks with due dates in the past week
    if (task.dueDate) {
      return task.dueDate < formatDate(today) && task.dueDate >= lastWeekStr;
    }
    
    // Include ALL tasks without due dates
    // This ensures imported tasks and tasks without dates don't get lost
    return true;
  });
  
  // Find tasks that were completed in the last 7 days
  const completedTasks = tasks.filter(task => 
    task.completed && 
    new Date(task.updatedAt) >= lastWeek
  );
  
  useEffect(() => {
    // Calculate completion rate
    const relevantTasks = tasks.filter(task => {
      if (task.dueDate) {
        // Tasks with due dates in the past week
        return task.dueDate >= lastWeekStr && task.dueDate < formatDate(today);
      }
      
      // For tasks without due dates:
      if (task.completed) {
        // Only count if completed within the past week
        return new Date(task.updatedAt) >= lastWeek;
      }
      
      // Count all incomplete tasks without due dates
      return true;
    });
    
    const completedTasks = relevantTasks.filter(task => task.completed);
    
    const rate = relevantTasks.length > 0 
      ? Math.round((completedTasks.length / relevantTasks.length) * 100) 
      : 0;
    
    setCompletionRate(rate);
    
    // Initialize tasks with reasons only once
    if (!hasInitialized && tasksNeedingAttention.length > 0) {
      const initializedTasks = tasksNeedingAttention.map(task => ({
        task,
        selectedReason: null,
        customReason: '',
        action: null,
        rescheduleDate: undefined
      }));
      setTasksWithReasons(initializedTasks);
      setHasInitialized(true);
    }
  }, [tasks, lastWeek, lastWeekStr, today, hasInitialized, tasksNeedingAttention]); // Fixed dependencies

  // Update tasksWithReasons when the underlying task data changes
  useEffect(() => {
    setTasksWithReasons(prev => {
      // Update task data for existing entries
      return prev.map(item => {
        const updatedTask = tasks.find(t => t.id === item.task.id);
        if (updatedTask && !updatedTask.completed) {
          return { ...item, task: updatedTask };
        }
        return item;
      }).filter(item => {
        // Remove tasks that have been completed or deleted
        const taskExists = tasks.find(t => t.id === item.task.id);
        return taskExists && !taskExists.completed;
      });
    });
  }, [tasks]);
  
  const handleReasonSelect = (taskId: string, reasonId: string) => {
    
    // Map of reasons to automatic actions
    const reasonToAction: { [key: string]: 'reschedule' | 'break_down' | 'delegate' | 'abandon' | 'completed' | 'blocked' } = {
      'already_done': 'completed',
      'not_relevant': 'abandon',
      'too_vague': 'break_down',
      'no_time': 'reschedule',
      'overwhelming': 'break_down',
      'waiting': 'blocked'
    };
    
    setTasksWithReasons(prev => {
      const updated = prev.map(item => {
        if (item.task.id === taskId) {
          const newItem = { ...item, selectedReason: reasonId };
          // Automatically select action if there's a mapping
          if (reasonToAction[reasonId]) {
            newItem.action = reasonToAction[reasonId];
          }
          return newItem;
        }
        return item;
      });
      return updated;
    });
    
    // Increment frequency for this reason
    if (reasonId !== 'custom') {
      setCommonReasons(prev => 
        prev.map(reason => 
          reason.id === reasonId 
            ? { ...reason, frequency: reason.frequency + 1 } 
            : reason
        )
      );
    }
  };
  
  const handleCustomReasonChange = (taskId: string, value: string) => {
    setTasksWithReasons(prev => 
      prev.map(item => 
        item.task.id === taskId 
          ? { ...item, customReason: value } 
          : item
      )
    );
  };
  
  const handleActionSelect = (taskId: string, action: 'reschedule' | 'break_down' | 'delegate' | 'abandon' | 'completed' | 'blocked' | null) => {
    setTasksWithReasons(prev => 
      prev.map(item => 
        item.task.id === taskId 
          ? { ...item, action } 
          : item
      )
    );
  };
  
  const handleRescheduleDateChange = (taskId: string, date: string) => {
    setTasksWithReasons(prev => 
      prev.map(item => 
        item.task.id === taskId 
          ? { ...item, rescheduleDate: date } 
          : item
      )
    );
  };
  
  const saveAccountabilityResponse = (taskId: string, reason: string, action: string, rescheduleDate?: string) => {
    // Create accountability response object with unique ID
    const response = {
      id: `accountability-${Date.now()}-${taskId}`,
      taskId,
      reason,
      action,
      rescheduleDate,
      timestamp: new Date().toISOString(),
    };
    
    // Get existing responses from localStorage
    const existingResponses = JSON.parse(localStorage.getItem('accountabilityResponses') || '[]');
    
    // Add new response
    existingResponses.push(response);
    
    // Save back to localStorage
    localStorage.setItem('accountabilityResponses', JSON.stringify(existingResponses));
  };
  
  const handleTaskUpdate = useCallback((taskWithReason: TaskWithReason) => {
    const { task, action, rescheduleDate } = taskWithReason;
    
    const updatedTask: Task = { ...task };
    
    // Get the reason text first
    const reasonText = taskWithReason.selectedReason === 'custom' 
      ? taskWithReason.customReason 
      : commonReasons.find(r => r.id === taskWithReason.selectedReason)?.text || '';
    
    // Apply action to the task
    if (action === 'reschedule') {
      // Use the selected reschedule date or leave it blank
      if (rescheduleDate) {
        updatedTask.dueDate = rescheduleDate;
      } else {
        // Clear the due date if no date is selected (task remains unscheduled)
        updatedTask.dueDate = '';
      }
    } else if (action === 'abandon') {
      // Delete the task - it's no longer relevant
      // We'll handle deletion after updating
    } else if (action === 'break_down') {
      // Add note that task needs breaking down
      updatedTask.description = `${updatedTask.description}\n[Needs to be broken down into smaller tasks]`;
    } else if (action === 'delegate') {
      // Add note that task will be delegated
      updatedTask.description = `${updatedTask.description}\n[To be delegated]`;
    } else if (action === 'completed') {
      // Mark as completed - user forgot to mark it earlier
      updatedTask.completed = true;
      updatedTask.description = `${updatedTask.description}\n[Marked as completed during accountability check-in]`;
    } else if (action === 'blocked') {
      // Mark as blocked - waiting on someone/something
      updatedTask.description = `${updatedTask.description}\n[BLOCKED: ${reasonText}]`;
      // Add blocked tag if not already present
      if (!updatedTask.tags?.includes('blocked')) {
        updatedTask.tags = [...(updatedTask.tags || []), 'blocked'];
      }
    }
    
    // Save accountability response if we have a reason (action is optional)
    if (reasonText) {
      saveAccountabilityResponse(task.id, reasonText, action || 'no_action', rescheduleDate);
    }
    
    // Add the reason to task description for future reference
    if (reasonText && action !== 'abandon' && action !== 'completed' && action !== 'blocked') {
      updatedTask.description = `${updatedTask.description}\n[Incomplete: ${reasonText}]`;
    }
    
    // Handle task update or deletion
    if (action === 'abandon') {
      // Delete the task instead of updating
      deleteTask(task.id);
    } else {
      updatedTask.updatedAt = new Date().toISOString();
      // Update the task
      updateTask(updatedTask);
    }
    
    // Remove from list
    setTasksWithReasons(prev => prev.filter(item => item.task.id !== task.id));
    
    // Show success feedback
    setLastUpdatedTask(task.id);
    setTimeout(() => setLastUpdatedTask(null), 3000);
    
    if (onTaskUpdated) {
      onTaskUpdated();
    }
  }, [commonReasons, deleteTask, updateTask, onTaskUpdated]);

  // Enhanced keyboard shortcuts for better navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Navigate through tasks with arrow keys
      if (e.key === 'ArrowDown' && currentTaskIndex < tasksWithReasons.length - 1) {
        e.preventDefault();
        setCurrentTaskIndex(currentTaskIndex + 1);
      } else if (e.key === 'ArrowUp' && currentTaskIndex > 0) {
        e.preventDefault();
        setCurrentTaskIndex(currentTaskIndex - 1);
      }
      
      // Quick reason selection with number keys
      if (e.key >= '1' && e.key <= '6' && tasksWithReasons.length > 0) {
        e.preventDefault();
        const reasonIndex = parseInt(e.key) - 1;
        const currentTask = tasksWithReasons[currentTaskIndex];
        if (currentTask && commonReasons[reasonIndex]) {
          handleReasonSelect(currentTask.task.id, commonReasons[reasonIndex].id);
        }
      }
      
      // Save current task with Enter
      if (e.key === 'Enter' && tasksWithReasons.length > 0) {
        const currentTask = tasksWithReasons[currentTaskIndex];
        if (currentTask && currentTask.selectedReason && 
            (currentTask.selectedReason !== 'custom' || currentTask.customReason)) {
          e.preventDefault();
          handleTaskUpdate(currentTask);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTaskIndex, tasksWithReasons, handleTaskUpdate, commonReasons]);
  
  // Get the most common reasons for not completing tasks
  const topReasons = [...commonReasons]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);
  
  return (
    <div className="space-y-6">
      {lastUpdatedTask && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800">
          <CheckCircle size={20} className="mr-2 text-green-600" />
          <span className="font-medium">Task successfully updated!</span>
        </div>
      )}
      
      <Card className="overflow-hidden">
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Accountability Check-In</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowProgress(!showProgress)}
          >
            {showProgress ? 'Hide Stats' : 'Show Stats'}
          </Button>
        </div>
        
        {showProgress && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700 mb-2 sm:mb-0">Your Past Week Performance</h4>
              <div className="flex items-center text-sm">
                <span className="mr-2">Showing tasks from</span>
                <span className="font-medium">{lastWeekStr}</span>
                <span className="mx-1">to</span>
                <span className="font-medium">{formatDate(today)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center mb-1">
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                  <h5 className="text-sm font-medium text-gray-700">Task Completion Rate</h5>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
                  <div className={`text-sm ${completionRate >= 70 ? 'text-green-600' : completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {completedTasks.length} completed
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center mb-1">
                  <Clock size={16} className="text-orange-500 mr-2" />
                  <h5 className="text-sm font-medium text-gray-700">Tasks Needing Attention</h5>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-gray-900">{tasksNeedingAttention.length}</div>
                  <div className="text-sm text-gray-600">
                    {tasksNeedingAttention.length > 0 ? 'To review' : 'All caught up!'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center mb-1">
                  <BarChart2 size={16} className="text-blue-500 mr-2" />
                  <h5 className="text-sm font-medium text-gray-700">Common Blockers</h5>
                </div>
                <div className="text-sm">
                  {topReasons.length > 0 ? (
                    <ol className="list-decimal list-inside">
                      {topReasons.map((reason, index) => (
                        <li key={reason.id} className={`truncate ${index === 0 ? 'font-medium' : ''}`}>
                          {reason.text}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-gray-600 italic">No data yet</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">Tip:</span> Patterns in why tasks don't get completed can help you plan better.
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-1">Tasks to Review</h4>
            <p className="text-sm text-gray-600">
              Understanding why tasks don't get completed helps you plan more effectively. 
              This includes tasks with recent due dates and all tasks without due dates.
            </p>
          </div>
          
          {tasksWithReasons.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <h4 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h4>
              <p className="text-gray-600">
                You have no tasks from the past week that need reviewing.
              </p>
              
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? 'Hide' : 'Show'} Completed Tasks
              </Button>
              
              {showCompleted && completedTasks.length > 0 && (
                <div className="mt-4 text-left">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    Completed Tasks
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {completedTasks.map(task => (
                      <div key={task.id} className="p-2 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span className="text-gray-800">{task.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  🚀 <strong>Quick Review:</strong> Click the reason that best fits each task or use keyboard shortcuts:
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• Numbers <kbd>1-6</kbd> to select reasons quickly</div>
                  <div>• <kbd>↑↓</kbd> to navigate between tasks</div>
                  <div>• <kbd>Enter</kbd> to save and continue</div>
                </div>
              </div>
              
              {tasksWithReasons.map((taskWithReason, index) => {
                const isProcessed = taskWithReason.selectedReason !== null;
                const isCurrentTask = index === currentTaskIndex;
                return (
                  <div 
                    key={taskWithReason.task.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      isProcessed ? 'bg-green-50 border-green-200' : 
                      isCurrentTask ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="mb-3">
                      <div className="flex items-center mb-2">
                        {isProcessed ? (
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                        ) : (
                          <AlertCircle size={16} className="text-orange-500 mr-2" />
                        )}
                        <span className="font-medium text-gray-900">{taskWithReason.task.title}</span>
                        {taskWithReason.task.dueDate && (
                          <span className="ml-2 text-xs text-gray-500">Due: {taskWithReason.task.dueDate}</span>
                        )}
                      </div>
                      
                      {/* Quick reason buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                        {commonReasons.slice(0, 6).map((reason, reasonIndex) => {
                          const isSelected = taskWithReason.selectedReason === reason.id;
                          return (
                            <button
                              key={reason.id}
                              onClick={() => handleReasonSelect(taskWithReason.task.id, reason.id)}
                              className={`p-2 text-xs rounded-md border transition-colors text-left relative ${
                                isSelected
                                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className="absolute top-1 right-1 text-xs opacity-50 font-mono">
                                {reasonIndex + 1}
                              </span>
                              {reason.text}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Custom reason input - only show if needed */}
                      {!isProcessed && (
                        <div className="mb-3">
                          <input
                            type="text"
                            placeholder="Or type a custom reason..."
                            value={taskWithReason.customReason}
                            onChange={(e) => {
                              handleCustomReasonChange(taskWithReason.task.id, e.target.value);
                              if (e.target.value) {
                                handleReasonSelect(taskWithReason.task.id, 'custom');
                              }
                            }}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      
                      {/* Quick actions - only show after reason is selected */}
                      {isProcessed && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <button
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'completed')}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              taskWithReason.action === 'completed'
                                ? 'bg-green-100 border-green-300 text-green-800'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-green-50'
                            }`}
                          >
                            ✓ Completed
                          </button>
                          <button
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'reschedule')}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              taskWithReason.action === 'reschedule'
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-blue-50'
                            }`}
                          >
                            📅 Reschedule
                          </button>
                          <button
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'break_down')}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              taskWithReason.action === 'break_down'
                                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-yellow-50'
                            }`}
                          >
                            🧩 Break Down
                          </button>
                          <button
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'abandon')}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              taskWithReason.action === 'abandon'
                                ? 'bg-red-100 border-red-300 text-red-800'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-red-50'
                            }`}
                          >
                            🗑️ Drop It
                          </button>
                        </div>
                      )}
                      
                      {/* Reschedule date picker - compact */}
                      {taskWithReason.action === 'reschedule' && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-md">
                          <label className="block text-xs text-blue-800 mb-1">New date (optional):</label>
                          <input
                            type="date"
                            value={taskWithReason.rescheduleDate || ''}
                            onChange={(e) => handleRescheduleDateChange(taskWithReason.task.id, e.target.value)}
                            className="w-full p-1 text-sm border border-blue-300 rounded"
                            min={formatDate(new Date())}
                          />
                        </div>
                      )}
                      
                      {/* Save button - only show when ready */}
                      {isProcessed && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleTaskUpdate(taskWithReason)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            Save & Continue →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AccountabilityCheckIn;
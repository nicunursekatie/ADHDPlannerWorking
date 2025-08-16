import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Calendar, AlertCircle, ChevronDown, ChevronRight, Folder, PlayCircle, Sparkles, Play, Timer, FolderPlus, Brain } from 'lucide-react';
import { Task } from '../types';
import { useAppContext } from '../context/AppContextSupabase';
import { getDueDateStatus, getRelativeTimeDisplay } from '../utils/dateUtils';
import { GuidedWalkthroughModal } from './tasks/GuidedWalkthroughModal';
import { QuickDueDateEditor } from './tasks/QuickDueDateEditor';
import { TaskDetailWizard } from './tasks/TaskDetailWizard';
import { TimeTrackingDisplay } from './tasks/TimeTrackingDisplay';
import { analyzeTaskCompleteness } from '../utils/taskCompleteness';
import { triggerCelebration } from '../utils/celebrations';
import { getTimeContext, getTaskTimeEstimate, formatTimeRemaining, formatTimeOfDay, getUrgencyColor } from '../utils/timeAwareness';
import { focusTracker } from '../utils/focusTracker';
import { getUrgencyEmoji, getEmotionalWeightEmoji, getEnergyRequiredEmoji } from '../utils/taskPrioritization';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { FuzzyTaskBreakdownSimple } from './tasks/FuzzyTaskBreakdownSimple';

interface TaskDisplayProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onBreakdown?: (task: Task) => void;
  onConvertToProject?: (task: Task) => void;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete,
  onBreakdown,
  onConvertToProject 
}) => {
  const navigate = useNavigate();
  const { tasks, projects, updateTask, addTask, deleteTask } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showDetailWizard, setShowDetailWizard] = useState(false);
  const [showFuzzyBreakdown, setShowFuzzyBreakdown] = useState(false);
  // Note: TimeSpentModal is now handled at the page level to avoid container constraints
  // const [showTimeSpentModal, setShowTimeSpentModal] = useState(false);
  const [, setCurrentTime] = useState(new Date());
  const [focusTime, setFocusTime] = useState(0);
  const [currentSession, setCurrentSession] = useState(focusTracker.getCurrentSession());
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  // Update time for live calculations and focus tracking
  React.useEffect(() => {
    focusTracker.initialize();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setFocusTime(focusTracker.getTaskFocusTime(task.id));
      setCurrentSession(focusTracker.getCurrentSession());
    }, 60000); // Update every minute instead of every second
    
    return () => clearInterval(timer);
  }, [task.id]);

  // Handle clicking on task - just open editor
  const handleTaskClick = () => {
    onEdit(task);
  };
  
  // Handle starting focus on a task
  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentSessionData = focusTracker.getCurrentSession();
    
    if (currentSessionData && currentSessionData.taskId !== task.id) {
      const shouldWarn = focusTracker.shouldWarnAboutTaskSwitch(task.id);
      
      if (shouldWarn) {
        const currentDuration = focusTracker.getCurrentSessionDuration();
        if (!window.confirm(
          `You just started working on another task ${Math.round(currentDuration)} minutes ago. ` +
          `Stay focused on that task, or switch to "${task.title}"?`
        )) {
          return;
        }
      }
    }
    
    // Start focus tracking for this task
    focusTracker.startFocus(task.id);
    setCurrentSession(focusTracker.getCurrentSession());
  };
  
  // Get actual subtask objects, filtering out null/undefined IDs
  const subtasks = task.subtasks ? 
    task.subtasks
      .filter(subtaskId => subtaskId != null) // Filter out null/undefined IDs
      .map(subtaskId => tasks.find(t => t.id === subtaskId))
      .filter(Boolean) as Task[] : [];
  
  // Handle subtask toggle
  const handleSubtaskToggle = async (subtaskId: string) => {
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;
    
    try {
      await updateTask({
        ...subtask,
        completed: !subtask.completed,
        completedAt: !subtask.completed ? new Date().toISOString() : undefined
      });
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };
  
  const dueDateStatus = getDueDateStatus(task.dueDate);
  const relativeTimeInfo = getRelativeTimeDisplay(task.dueDate, true); // Use weekend-relative display
  
  // Check if task can be completed based on start date
  const canComplete = !task.startDate || new Date(task.startDate) <= new Date();
  
  const dueDateInfo = dueDateStatus ? {
    text: relativeTimeInfo?.combined || dueDateStatus.text,
    className: dueDateStatus.className,
    icon: dueDateStatus.isOverdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />
  } : null;

  
  const taskCompleteness = analyzeTaskCompleteness(task);
  const showIncompleteIndicator = !task.completed && !taskCompleteness.isComplete;
  
  // Time awareness calculations - only recalculate when tasks change, not every minute
  const timeContext = React.useMemo(() => getTimeContext(tasks), [tasks]);
  const timeEstimate = React.useMemo(() => getTaskTimeEstimate(task, timeContext), [task, timeContext]);
  
  // Time tracking handlers are now at the page level
  
  return (
    <>
    <div 
      className={`
        group flex items-start gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl border cursor-pointer overflow-hidden backdrop-blur-sm
        shadow-md hover:shadow-xl transition-all duration-300 max-w-full
        ${!canComplete
          ? 'bg-gray-100/60 border-gray-300/40 opacity-60'
          : task.completed 
          ? 'bg-gray-50/95 border-gray-300/60 shadow-sm' 
          : task.emotionalWeight === 'easy' 
            ? 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-300/50 hover:border-green-400/70 hover:shadow-xl hover:shadow-green-100/50'
            : task.emotionalWeight === 'neutral'
            ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-300/50 hover:border-blue-400/70 hover:shadow-xl hover:shadow-blue-100/50'
            : task.emotionalWeight === 'stressful'
            ? 'bg-gradient-to-br from-orange-50/90 to-amber-50/90 border-orange-300/50 hover:border-orange-400/70 hover:shadow-xl hover:shadow-orange-100/50'
            : task.emotionalWeight === 'dreading'
            ? 'bg-gradient-to-br from-red-50/90 to-pink-50/90 border-red-300/50 hover:border-red-400/70 hover:shadow-xl hover:shadow-red-100/50'
            : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-gray-300/50 hover:border-primary-400/70 hover:shadow-xl hover:shadow-primary-100/50'}
        ${canComplete ? 'hover:shadow-2xl active:scale-[0.98]' : ''}
      `}
      onClick={handleTaskClick}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('[TaskDisplay] Checkbox clicked', {
            taskId: task.id,
            taskTitle: task.title,
            completed: task.completed,
            estimatedMinutes: task.estimatedMinutes,
            canComplete
          });
          
          // Don't allow completion if task hasn't started yet
          if (!canComplete) {
            console.log('[TaskDisplay] Task cannot be completed yet (start date in future)');
            return;
          }
          
          // If completing the task
          if (!task.completed) {
            // Time tracking is now handled at the page level
            console.log('[TaskDisplay] Completing task (time tracking handled by parent)');
            // Don't trigger celebration here - it will be triggered after time tracking
            onToggle(task.id);
          } else {
            // Uncompleting a task
            console.log('[TaskDisplay] Uncompleting task');
            onToggle(task.id);
          }
        }}
        className={`mt-1 flex-shrink-0 p-1 rounded-full hover:bg-white/80 transition-all duration-200 ${!canComplete ? 'cursor-not-allowed' : ''}`}
        disabled={!canComplete}
        title={!canComplete ? `This task starts on ${new Date(task.startDate!).toLocaleDateString()}` : undefined}
      >
        {task.completed ? (
          <CheckCircle2 className="w-6 h-6 text-green-600 drop-shadow-sm" />
        ) : !canComplete ? (
          <Circle className="w-6 h-6 text-gray-400" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400 hover:text-primary-600 transition-all duration-200" />
        )}
      </button>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className={`
                text-lg font-bold tracking-tight leading-relaxed whitespace-normal break-words
                ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}
              `}>
                {task.title}
              </h3>
              {showIncompleteIndicator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailWizard(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
                  title={`Missing ${taskCompleteness.missingFields.length} details - Click to complete`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Add details</span>
                </button>
              )}
            </div>
            
            {/* Time Tracking Information for Completed Tasks */}
            {task.completed && (task.actualMinutesSpent || task.estimatedMinutes || task.completedAt) && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Task Completed</span>
                  {task.completedAt && (
                    <span className="text-xs text-green-600">
                      {new Date(task.completedAt).toLocaleDateString()} at {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                
                {(task.actualMinutesSpent || task.estimatedMinutes) && (
                  <TimeTrackingDisplay
                    estimatedMinutes={task.estimatedMinutes}
                    actualMinutesSpent={task.actualMinutesSpent}
                    completedAt={task.completedAt}
                    size="md"
                    showLabel={true}
                  />
                )}
                
              </div>
            )}
            
            {/* ADHD-Friendly Priority Indicators */}
            <div className="flex items-center gap-2 sm:gap-3 mt-3 flex-wrap">
              {/* Urgency */}
              {task.urgency && (
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold shadow-sm border
                  ${task.urgency === 'today' 
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : task.urgency === 'tomorrow'
                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                    : task.urgency === 'week'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : task.urgency === 'month'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                  <span className="text-base" title={`Urgency: ${task.urgency}`}>
                    {getUrgencyEmoji(task.urgency)}
                  </span>
                  <span className="uppercase tracking-wide">
                    {task.urgency === 'today' ? 'TODAY' : 
                     task.urgency === 'week' ? 'THIS WEEK' : 
                     task.urgency === 'month' ? 'THIS MONTH' : 'SOMEDAY'}
                  </span>
                </div>
              )}
              
              {/* Emotional Weight */}
              {task.emotionalWeight && (
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold shadow-sm border
                  ${task.emotionalWeight === 'easy' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : task.emotionalWeight === 'neutral' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : task.emotionalWeight === 'stressful' 
                    ? 'bg-orange-100 text-orange-800 border-orange-200' 
                    : 'bg-red-100 text-red-800 border-red-200'}`}>
                  <span className="text-base" title={`Emotional Weight: ${task.emotionalWeight}`}>
                    {getEmotionalWeightEmoji(task.emotionalWeight)}
                  </span>
                  <span className="uppercase tracking-wide">
                    {task.emotionalWeight === 'easy' ? 'EASY' : 
                     task.emotionalWeight === 'neutral' ? 'NEUTRAL' : 
                     task.emotionalWeight === 'stressful' ? 'STRESSFUL' : 'DREADING'}
                  </span>
                </div>
              )}
              
              {/* Energy Required */}
              {task.energyRequired && (
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold shadow-sm border
                  ${task.energyRequired === 'low' 
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : task.energyRequired === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'}`}>
                  <span className="text-base" title={`Energy Required: ${task.energyRequired}`}>
                    {getEnergyRequiredEmoji(task.energyRequired)}
                  </span>
                  <span className="uppercase tracking-wide">{task.energyRequired} ENERGY</span>
                </div>
              )}
              
              {/* Project info */}
              {task.projectId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const project = projects.find(p => p.id === task.projectId);
                    if (project) {
                      navigate(`/projects/${project.id}`);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105 hover:bg-white/50 dark:hover:bg-gray-800/50"
                  title={`Go to ${projects.find(p => p.id === task.projectId)?.name || 'Unknown'} project`}
                >
                  <Folder className="w-3 h-3 text-purple-400 dark:text-purple-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-24 font-medium">
                    {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                  </span>
                </button>
              )}
              
              {/* Traditional Priority (smaller, less prominent) */}
              {task.priority && (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {task.priority}
                  </span>
                </div>
              )}
              
              {/* Time Reality Check */}
              {!task.completed && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getUrgencyColor(timeEstimate.urgency)}`}>
                  <span>~{formatTimeRemaining(timeEstimate.estimatedMinutes)}</span>
                  {timeEstimate.percentOfDayRemaining > 0.5 && (
                    <span className="font-bold">
                      ({Math.round(timeEstimate.percentOfDayRemaining * 100)}% of day)
                    </span>
                  )}
                </div>
              )}
              
              {/* Finish Time Prediction */}
              {!task.completed && 
               timeEstimate.percentOfDayRemaining < 1 && 
               (!task.startDate || new Date(task.startDate) <= new Date()) && (
                <div className="text-xs text-gray-500">
                  Done by {formatTimeOfDay(timeEstimate.finishTime)}
                </div>
              )}
              
              {/* Start Date Indicator */}
              {!canComplete && task.startDate && (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  <Calendar className="w-3 h-3" />
                  <span>Starts {new Date(task.startDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {/* Focus Session Indicator */}
              {currentSession && currentSession.taskId === task.id && (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>In focus • {Math.round(focusTracker.getCurrentSessionDuration())}min</span>
                  {focusTracker.getCurrentSessionDuration() > 240 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        focusTracker.resetCurrentSession();
                        setCurrentSession(null);
                        setFocusTime(0);
                      }}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                      title="Clear stuck session"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
              
              {/* Daily Focus Time */}
              {focusTime > 0 && (
                <div className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                  {Math.round(focusTime)}min today
                </div>
              )}
            </div>
          </div>
          
          {/* Due Date */}
          <div className="relative">
            {dueDateInfo ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateEditor(!showDateEditor);
                }}
                className={`flex items-center gap-2 text-sm font-bold ${dueDateInfo.className} hover:bg-white/90 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg border-2 hover:border-gray-300 active:scale-95`}
                title="Click to change due date"
              >
                <div className="w-4 h-4">{dueDateInfo.icon}</div>
                <span>{dueDateInfo.text}</span>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateEditor(!showDateEditor);
                }}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg border-2 border-gray-300 hover:border-purple-400 active:scale-95"
                title="Add due date"
              >
                <Calendar className="w-4 h-4" />
                <span>Add date</span>
              </button>
            )}
            
            {/* Start Working Button */}
            {!task.completed && canComplete && (
              currentSession && currentSession.taskId === task.id ? (
                // Show stop button if this task is in focus
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    focusTracker.endFocus();
                    setCurrentSession(null);
                    setFocusTime(focusTracker.getTaskFocusTime(task.id));
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg shadow-md active:scale-95"
                  title="Stop working on this task"
                >
                  <Timer className="w-4 h-4" />
                  <span>Stop Working</span>
                </button>
              ) : (
                // Show start button if not in focus
                <button
                  onClick={handleStartFocus}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg shadow-md active:scale-95"
                  title="Start working on this task"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Working</span>
                </button>
              )
            )}
            
            {showDateEditor && (
              <QuickDueDateEditor
                currentDate={task.dueDate}
                onDateChange={async (newDate) => {
                  console.log('QuickDueDateEditor onDateChange called with:', newDate);
                  console.log('Current task dueDate:', task.dueDate);
                  
                  try {
                    // Create update with essential fields only, excluding computed fields
                    const updateData = {
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      completed: task.completed,
                      archived: task.archived,
                      dueDate: newDate,
                      projectId: task.projectId,
                      categoryIds: task.categoryIds,
                      parentTaskId: task.parentTaskId,
                      priority: task.priority,
                      energyLevel: task.energyLevel,
                      size: task.size,
                      estimatedMinutes: task.estimatedMinutes,
                      createdAt: task.createdAt,
                      updatedAt: task.updatedAt,
                      // Exclude computed fields: subtasks, dependsOn, dependedOnBy
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
                      completedAt: task.completedAt,
                      aiProcessed: task.aiProcessed,
                      urgency: task.urgency,
                      importance: task.importance,
                      emotionalWeight: task.emotionalWeight,
                      energyRequired: task.energyRequired
                    } as Task;
                    
                    console.log('About to call updateTask with:', updateData);
                    await updateTask(updateData);
                    setShowDateEditor(false);
                  } catch (error) {
                    console.error('Failed to update task date:', error);
                    // Don't close the editor if there was an error
                  }
                }}
                onClose={() => setShowDateEditor(false)}
              />
            )}
          </div>
        </div>
        
        {/* Task Breakdown Buttons */}
        {!task.completed && subtasks.length === 0 && (
          <div className="mt-2 flex gap-2">
            {/* Fuzzy Task Breakdown - for overwhelming/unclear tasks */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFuzzyBreakdown(true);
              }}
              className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded-xl transition-all"
              title="Break down this overwhelming task into clear steps"
            >
              <Brain className="w-4 h-4" />
              <span>Break Down Task</span>
            </button>
            
            {/* AI Breakdown - existing AI feature */}
            {onBreakdown && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBreakdown(task);
                }}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-xl transition-all"
                title="Use AI to suggest subtasks"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Suggest</span>
              </button>
            )}
          </div>
        )}
        
        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>
                  {subtasks.filter(st => st.completed).length} of {subtasks.length} subtasks completed
                </span>
              </button>
              
              {!task.completed && subtasks.some(st => !st.completed) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWalkthrough(true);
                  }}
                  className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
                  title="Start guided walkthrough"
                >
                  <PlayCircle className="w-3 h-3" />
                  <span>Start Walkthrough</span>
                </button>
              )}
            </div>
            
            {/* Expanded subtasks */}
            {isExpanded && (
              <div className="mt-4 ml-8 space-y-3 pl-4 border-l-2 border-purple-200">
                {subtasks.map(subtask => (
                  <div 
                    key={subtask.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                      subtask.completed 
                        ? 'bg-gray-50/80 border-gray-200 opacity-75' 
                        : 'bg-white border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubtaskToggle(subtask.id);
                      }}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h4 className={`text-sm whitespace-normal break-words ${
                        subtask.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {subtask.title}
                      </h4>
                      {subtask.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtask.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
        {onBreakdown && !task.completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBreakdown(task);
            }}
            className="p-1 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
            title="AI Breakdown - Break down into subtasks"
          >
            <Sparkles className="w-3 h-3" />
          </button>
        )}
        {onConvertToProject && !task.completed && !task.projectId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConvertToProject(task);
            }}
            className="p-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            title="Convert to Project"
          >
            <FolderPlus className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const hasSubtasks = subtasks.length > 0;
            const message = hasSubtasks 
              ? `Are you sure you want to delete "${task.title}"?\n\nThis task has ${subtasks.length} subtask${subtasks.length > 1 ? 's' : ''} that will also be deleted.`
              : `Are you sure you want to delete "${task.title}"?`;
            
            const confirmed = await confirm({
              title: 'Delete Task',
              message,
              confirmText: 'Delete',
              cancelText: 'Cancel',
              variant: 'danger',
              confirmButtonVariant: 'danger'
            });
            
            if (confirmed) {
              onDelete(task.id);
            }
          }}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
    </div>
      
    {/* Modals rendered outside the clickable div */}
    {showWalkthrough && (
      <GuidedWalkthroughModal
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
        taskId={task.id}
      />
    )}
    
    {/* Task Detail Wizard */}
    <TaskDetailWizard
      task={task}
      isOpen={showDetailWizard}
      onClose={() => setShowDetailWizard(false)}
      onComplete={async (updatedTask) => {
        try {
          await updateTask(updatedTask);
          setShowDetailWizard(false);
        } catch (error) {
          console.error('Failed to update task:', error);
          alert('Failed to update task. Please try again.');
        }
      }}
    />
    
    {/* Time Spent Modal is now handled at the page level to avoid container constraints */}
    
    {/* Fuzzy Task Breakdown Modal */}
    {showFuzzyBreakdown && (
      <FuzzyTaskBreakdownSimple
        task={task}
        onClose={() => setShowFuzzyBreakdown(false)}
        onComplete={async (newTasks) => {
          // Add all new tasks
          for (const newTask of newTasks) {
            await addTask({
              ...newTask,
              completed: false,
              archived: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as Task);
          }
          
          // Delete the original fuzzy task
          await deleteTask(task.id);
          
          // Close the modal
          setShowFuzzyBreakdown(false);
        }}
      />
    )}
    
    {/* Confirmation Dialog */}
    <ConfirmDialogComponent />
    </>
  );
};
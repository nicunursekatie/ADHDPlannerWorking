import React, { useState } from 'react';
import { CheckCircle2, Circle, Calendar, AlertCircle, ChevronDown, ChevronRight, Folder, PlayCircle, Sparkles } from 'lucide-react';
import { Task } from '../types';
import { useAppContext } from '../context/AppContextSupabase';
import { getDueDateStatus } from '../utils/dateUtils';
import { GuidedWalkthroughModal } from './tasks/GuidedWalkthroughModal';
import { QuickDueDateEditor } from './tasks/QuickDueDateEditor';
import { TaskDetailWizard } from './tasks/TaskDetailWizard';
import { analyzeTaskCompleteness } from '../utils/taskCompleteness';
import { triggerCelebration, addCelebrationPulse, showToastCelebration } from '../utils/celebrations';
import { getTimeContext, getTaskTimeEstimate, formatTimeRemaining, formatTimeOfDay, getUrgencyColor } from '../utils/timeAwareness';
import { focusTracker } from '../utils/focusTracker';

interface TaskDisplayProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onBreakdown?: (task: Task) => void;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete,
  onBreakdown 
}) => {
  const { tasks, projects, updateTask } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showDetailWizard, setShowDetailWizard] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [focusTime, setFocusTime] = useState(0);
  const [currentSession, setCurrentSession] = useState(focusTracker.getCurrentSession());

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

  // Check for focus session warnings when clicking on task
  const handleTaskClick = () => {
    const currentSessionData = focusTracker.getCurrentSession();
    
    if (currentSessionData && currentSessionData.taskId !== task.id) {
      const shouldWarn = focusTracker.shouldWarnAboutTaskSwitch(task.id);
      
      if (shouldWarn) {
        const currentDuration = focusTracker.getCurrentSessionDuration();
        if (window.confirm(
          `You just started working on another task ${Math.round(currentDuration)} minutes ago. ` +
          `Stay focused on that task, or switch to "${task.title}"?`
        )) {
          focusTracker.startFocus(task.id);
        }
        return;
      }
    }
    
    // Start focus tracking for this task
    if (!currentSessionData || currentSessionData.taskId !== task.id) {
      focusTracker.startFocus(task.id);
      setCurrentSession(focusTracker.getCurrentSession());
    }
    
    onEdit(task);
  };
  
  // Get actual subtask objects, filtering out null/undefined IDs
  const subtasks = task.subtasks ? 
    task.subtasks
      .filter(subtaskId => subtaskId != null) // Filter out null/undefined IDs
      .map(subtaskId => tasks.find(t => t.id === subtaskId))
      .filter(Boolean) as Task[] : [];
  
  
  const dueDateStatus = getDueDateStatus(task.dueDate);
  const dueDateInfo = dueDateStatus ? {
    text: dueDateStatus.text,
    className: dueDateStatus.className,
    icon: dueDateStatus.isOverdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />
  } : null;

  
  const taskCompleteness = analyzeTaskCompleteness(task);
  const showIncompleteIndicator = !task.completed && !taskCompleteness.isComplete;
  
  // Time awareness calculations - only recalculate when tasks change, not every minute
  const timeContext = React.useMemo(() => getTimeContext(tasks), [tasks]);
  const timeEstimate = React.useMemo(() => getTaskTimeEstimate(task, timeContext), [task, timeContext]);
  
  return (
    <>
    <div 
      className={`
        group flex items-start gap-3 p-3 rounded-xl border cursor-pointer overflow-hidden backdrop-blur-sm
        ${task.completed 
          ? 'bg-gray-50/90 border-gray-200/70 shadow-sm' 
          : 'bg-white/90 border-gray-200/70 hover:border-primary-300/80 hover:shadow-lg hover:bg-white/95 hover:backdrop-blur-md'}
        transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5
      `}
      onClick={handleTaskClick}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          
          // If completing the task, trigger celebration
          if (!task.completed) {
            triggerCelebration();
            showToastCelebration(`"${task.title}" completed! 🎉`);
            addCelebrationPulse(e.currentTarget);
          }
          
          onToggle(task.id);
        }}
        className="mt-0.5 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-success-600" />
        ) : (
          <Circle className="w-5 h-5 text-text-muted hover:text-primary-600 transition-colors" />
        )}
      </button>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className={`
                text-base font-semibold tracking-tight whitespace-normal break-words
                ${task.completed ? 'text-text-tertiary opacity-75' : 'text-text-primary'}
              `}>
                {task.title}
              </h3>
              {showIncompleteIndicator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailWizard(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all hover:scale-105"
                  title={`Missing ${taskCompleteness.missingFields.length} details - Click to complete`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Add details</span>
                </button>
              )}
            </div>
            {/* Project info, Priority, and Time Estimate */}
            <div className="flex items-center gap-3 mt-1">
              {task.projectId && (
                <div className="flex items-center gap-1">
                  <Folder className="w-3 h-3 text-purple-400 dark:text-purple-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-24">
                    {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                  </span>
                </div>
              )}
              {task.priority && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-priority-high' :
                    task.priority === 'medium' ? 'bg-priority-medium' :
                    'bg-priority-low'
                  }`} />
                  <span className={`text-xs font-medium capitalize ${
                    task.priority === 'high' ? 'priority-high' :
                    task.priority === 'medium' ? 'priority-medium' :
                    'priority-low'
                  }`}>
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
              {!task.completed && timeEstimate.percentOfDayRemaining < 1 && (
                <div className="text-xs text-gray-500">
                  Done by {formatTimeOfDay(timeEstimate.finishTime)}
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
                className={`flex items-center gap-1 text-xs ${dueDateInfo.className} hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-all hover:scale-105`}
                title="Click to change due date"
              >
                {dueDateInfo.icon}
                <span>{dueDateInfo.text}</span>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateEditor(!showDateEditor);
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded-lg transition-all hover:scale-105"
                title="Add due date"
              >
                <Calendar className="w-3 h-3" />
                <span>Add date</span>
              </button>
            )}
            
            {showDateEditor && (
              <QuickDueDateEditor
                currentDate={task.dueDate}
                onDateChange={(newDate) => {
                  updateTask({ ...task, dueDate: newDate });
                  setShowDateEditor(false);
                }}
                onClose={() => setShowDateEditor(false)}
              />
            )}
          </div>
        </div>
        
        {/* AI Breakdown button for tasks without subtasks */}
        {onBreakdown && !task.completed && subtasks.length === 0 && (
          <div className="mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBreakdown(task);
              }}
              className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded-xl transition-all hover:scale-105"
              title="Use AI to break down this task"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Breakdown</span>
            </button>
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
                  className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-all hover:scale-105"
                  title="Start guided walkthrough"
                >
                  <PlayCircle className="w-3 h-3" />
                  <span>Start Walkthrough</span>
                </button>
              )}
            </div>
            
            {/* Expanded subtasks */}
            {isExpanded && (
              <div className="mt-2 ml-6 space-y-2">
                {subtasks.map(subtask => (
                  <div 
                    key={subtask.id}
                    className={`flex items-start gap-2 p-2 rounded-xl ${
                      subtask.completed ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-purple-50 dark:bg-purple-900/20'
                    } transition-all hover:scale-[1.01]`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(subtask.id);
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onBreakdown && !task.completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBreakdown(task);
            }}
            className="p-1 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all hover:scale-110"
            title="AI Breakdown - Break down into subtasks"
          >
            <Sparkles className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110"
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
    </>
  );
};
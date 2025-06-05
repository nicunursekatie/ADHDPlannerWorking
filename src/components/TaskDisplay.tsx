import React, { useState } from 'react';
import { CheckCircle2, Circle, Calendar, AlertCircle, ChevronDown, ChevronRight, Folder, PlayCircle, Sparkles } from 'lucide-react';
import { Task } from '../types';
import { useAppContext } from '../context/AppContextSupabase';
import { getDueDateStatus } from '../utils/dateUtils';
import { GuidedWalkthroughModal } from './tasks/GuidedWalkthroughModal';
import { QuickDueDateEditor } from './tasks/QuickDueDateEditor';
import { TaskDetailWizard } from './tasks/TaskDetailWizard';
import { analyzeTaskCompleteness } from '../utils/taskCompleteness';

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
  
  return (
    <>
    <div 
      className={`
        group flex items-start gap-3 p-4 rounded-xl border cursor-pointer
        ${task.completed 
          ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm dark:hover:shadow-none'}
        transition-all duration-200
      `}
      onClick={() => onEdit(task)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className="mt-0.5 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`
                text-base font-medium tracking-tight
                ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}
              `}>
                {task.title}
              </h3>
              {showIncompleteIndicator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailWizard(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full hover:bg-amber-200 transition-colors"
                  title={`Missing ${taskCompleteness.missingFields.length} details - Click to complete`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Add details</span>
                </button>
              )}
            </div>
            {/* Project info and Priority */}
            <div className="flex items-center gap-3 mt-0.5">
              {task.projectId && (
                <div className="flex items-center gap-1">
                  <Folder className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                  </span>
                </div>
              )}
              {task.priority && (
                <div className="flex items-center gap-1">
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
                className={`flex items-center gap-1.5 text-sm ${dueDateInfo.className} hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md transition-colors`}
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
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md transition-colors"
                title="Add due date"
              >
                <Calendar className="w-4 h-4" />
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
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-md transition-colors"
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
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
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
                    className={`flex items-start gap-2 p-2 rounded-lg ${
                      subtask.completed ? 'bg-gray-50 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(subtask.id);
                      }}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h4 className={`text-sm ${
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
            className="p-1.5 text-purple-500 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            title="AI Breakdown - Break down into subtasks"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
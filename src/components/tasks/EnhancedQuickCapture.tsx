import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Circle, Info, Calendar, Flag, X } from 'lucide-react';

interface EnhancedQuickCaptureProps {
  onTaskAdded?: () => void;
  defaultProjectId?: string | null;
  placeholder?: string;
}

export const EnhancedQuickCapture: React.FC<EnhancedQuickCaptureProps> = ({
  onTaskAdded,
  defaultProjectId = null,
  placeholder = 'Add task...'
}) => {
  const { addTask } = useAppContext();
  const [title, setTitle] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Process input for smart text parsing
  const processInput = (input: string) => {
    // Keep the original input for preserving spaces during editing
    let processedTitle = input;
    let dueDate: string | null = null;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    // Check for date patterns
    if (input.includes('!today')) {
      const today = new Date();
      dueDate = today.toISOString().split('T')[0];
      // Don't trim during processing to preserve spaces
      processedTitle = input.replace('!today', '');
    } else if (input.includes('!tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
      processedTitle = input.replace('!tomorrow', '');
    } else if (input.match(/!(\d+)d/)) {
      const match = input.match(/!(\d+)d/);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        const date = new Date();
        date.setDate(date.getDate() + days);
        dueDate = date.toISOString().split('T')[0];
        processedTitle = processedTitle.replace(/!(\d+)d/, '');
      }
    }
    
    // Check for priority markers
    if (input.includes('!high')) {
      priority = 'high';
      processedTitle = processedTitle.replace('!high', '');
    } else if (input.includes('!low')) {
      priority = 'low';
      processedTitle = processedTitle.replace('!low', '');
    }
    
    return { title: processedTitle, dueDate, priority };
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      handleAddTask();
    }
  };
  
  const handleAddTask = () => {
    if (!title.trim()) return;
    
    const { title: processedTitle, dueDate, priority } = processInput(title);
    
    addTask({
      title: processedTitle.trim(), // Ensure the title is trimmed when saving
      dueDate,
      priority,
      projectId: defaultProjectId,
      completed: false
    });
    
    setTitle('');
    
    if (onTaskAdded) {
      onTaskAdded();
    }
    
    // Maintain focus for rapid task entry
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderHelpTooltip = () => {
    if (!showHelp) return null;
    
    return (
      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-4 z-10 w-64 md:w-72 max-w-[90vw]">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Quick Add Shortcuts:</h4>
          <button 
            onClick={() => setShowHelp(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close help"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start">
            <Calendar size={16} className="text-primary-500 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">Date Shortcuts</div>
              <div className="text-gray-600 dark:text-gray-400">!today, !tomorrow, !3d (3 days)</div>
            </div>
          </li>
          <li className="flex items-start">
            <Flag size={16} className="text-primary-500 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">Priority</div>
              <div className="text-gray-600 dark:text-gray-400">!high, !low</div>
            </div>
          </li>
        </ul>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 p-2 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          Example: "Call doctor !tomorrow !high"
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative">
      <div className="flex items-center px-3 py-3 bg-white dark:bg-gray-800/30 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-700/50 focus-within:border-primary-500 dark:focus-within:border-primary-500 transition-colors hover:border-gray-300 dark:hover:border-gray-600">
        <Circle 
          size={18} 
          className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" 
        />
        
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-base"
          placeholder={placeholder}
          aria-label="Task title"
        />
        
        <div className="flex items-center">
          <button 
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="mx-1 p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Show shortcuts help"
          >
            <Info size={18} />
          </button>
          
          {title.trim() && (
            <button
              onClick={handleAddTask}
              className="ml-1 p-1.5 rounded-full bg-primary-900/30 text-primary-400 hover:bg-primary-900/50 transition-colors"
              aria-label="Add task"
            >
              <Plus size={18} className="transform transition-transform hover:scale-110" />
            </button>
          )}
        </div>
      </div>
      
      {renderHelpTooltip()}
    </div>
  );
};
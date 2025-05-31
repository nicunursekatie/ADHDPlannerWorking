import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContextSupabase';
import { Plus, Circle } from 'lucide-react';
import { extractDateFromText, formatDateString } from '../../utils/dateUtils';

interface QuickCaptureProps {
  onTaskAdded?: () => void;
  defaultProjectId?: string | null;
  placeholder?: string;
}

export const QuickCapture: React.FC<QuickCaptureProps> = ({
  onTaskAdded,
  defaultProjectId = null,
  placeholder = 'Add task...'
}) => {
  const { addTask } = useAppContext();
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Process input for smart text parsing
  const processInput = (input: string) => {
    let processedTitle = input;
    let dueDate: string | null = null;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    // First extract natural language dates
    const { cleanedText, date } = extractDateFromText(input);
    if (date) {
      processedTitle = cleanedText;
      dueDate = formatDateString(date);
    }
    
    // Check for priority markers
    if (processedTitle.includes('!high')) {
      priority = 'high';
      processedTitle = processedTitle.replace('!high', '');
    } else if (processedTitle.includes('!low')) {
      priority = 'low';
      processedTitle = processedTitle.replace('!low', '');
    } else if (processedTitle.includes('!medium')) {
      priority = 'medium';
      processedTitle = processedTitle.replace('!medium', '');
    }
    
    // Clean up any remaining spaces
    processedTitle = processedTitle.replace(/\s+/g, ' ').trim();
    
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
      title: processedTitle.trim(), // Ensure we trim the title when saving
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
  
  return (
    <div className="flex items-center px-3 py-2 bg-white rounded-lg shadow border border-gray-200 focus-within:border-indigo-400 transition">
      <Circle 
        size={18} 
        className="mr-2 text-gray-400 flex-shrink-0" 
      />
      
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow bg-transparent border-0 focus:ring-0 text-gray-700 placeholder-gray-400 text-sm"
        placeholder={placeholder}
        aria-label="Task title"
      />
      
      {title.trim() && (
        <button
          onClick={handleAddTask}
          className="ml-2 p-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          aria-label="Add task"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import { Plus, Circle, Calendar, Folder, Tag, Flame, Star, Brain, Battery } from 'lucide-react';
import { getTodayString, getTomorrowString, formatDateString, extractDateFromText } from '../../utils/dateUtils';

interface QuickTaskInputProps {
  onTaskAdded?: () => void;
  defaultProjectId?: string | null;
  defaultDueDate?: string | null;
}

const QuickTaskInput: React.FC<QuickTaskInputProps> = ({
  onTaskAdded,
  defaultProjectId = null,
  defaultDueDate = null,
}) => {
  const { addTask, projects, categories } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(defaultDueDate);
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [urgency, setUrgency] = useState<'today' | 'week' | 'month' | 'someday'>('week');
  const [emotionalWeight, setEmotionalWeight] = useState<'easy' | 'neutral' | 'stressful' | 'dreading'>('neutral');
  const [energyRequired, setEnergyRequired] = useState<'low' | 'medium' | 'high'>('medium');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);
  
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Check if the title is empty after trimming
    if (!title.trim()) return;
    
    // Create the task with the trimmed title for storage
    const newTask: Partial<Task> = {
      title: title.trim(), // Make sure to trim when saving
      dueDate,
      projectId,
      categoryIds,
      priority,
      urgency,
      emotionalWeight,
      energyRequired,
      completed: false,
      archived: false,
    };
    
    addTask(newTask);
    
    // Reset form
    setTitle('');
    if (!defaultDueDate) setDueDate(null);
    if (!defaultProjectId) setProjectId(null);
    setCategoryIds([]);
    setPriority('medium');
    setUrgency('week');
    setEmotionalWeight('neutral');
    setEnergyRequired('medium');
    
    if (onTaskAdded) {
      onTaskAdded();
    }
    
    // Keep focus on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    setCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };
  
  // Process title for smart parsing
  const processTitle = (input: string) => {
    let processedText = input;
    
    // First extract natural language dates
    const { cleanedText, date } = extractDateFromText(processedText);
    if (date) {
      setDueDate(formatDateString(date));
      processedText = cleanedText;
    }
    
    // Check for priority markers like "!high", "!medium", "!low"
    if (processedText.includes('!high')) {
      setPriority('high');
      processedText = processedText.replace('!high', '');
    } else if (processedText.includes('!medium')) {
      setPriority('medium');
      processedText = processedText.replace('!medium', '');
    } else if (processedText.includes('!low')) {
      setPriority('low');
      processedText = processedText.replace('!low', '');
    }
    
    // Check for project tags like "#project-name"
    const projectMatch = processedText.match(/#([a-zA-Z0-9-_]+)/);
    if (projectMatch && projectMatch[1]) {
      const projectName = projectMatch[1].toLowerCase();
      const matchedProject = projects.find(p => 
        p.name.toLowerCase().replace(/\s+/g, '-') === projectName
      );
      
      if (matchedProject) {
        setProjectId(matchedProject.id);
        processedText = processedText.replace(/#([a-zA-Z0-9-_]+)/, '');
      }
    }
    
    // Check for category tags like "@category-name"
    const categoryMatches = processedText.match(/@([a-zA-Z0-9-_]+)/g);
    if (categoryMatches) {
      const newCategoryIds: string[] = [];
      
      categoryMatches.forEach(match => {
        const categoryName = match.substring(1).toLowerCase();
        const matchedCategory = categories.find(c => 
          c.name.toLowerCase().replace(/\s+/g, '-') === categoryName
        );
        
        if (matchedCategory) {
          newCategoryIds.push(matchedCategory.id);
          processedText = processedText.replace(match, '');
        }
      });
      
      if (newCategoryIds.length > 0) {
        setCategoryIds(newCategoryIds);
      }
    }
    
    // Clean up any double spaces and set the final title
    processedText = processedText.replace(/\s+/g, ' ').trim();
    setTitle(processedText);
  };
  
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const getUrgencyColor = () => {
    switch (urgency) {
      case 'today':
        return 'text-red-600 bg-red-50 px-2 py-1 rounded-full';
      case 'week':
        return 'text-orange-600 bg-orange-50 px-2 py-1 rounded-full';
      case 'month':
        return 'text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full';
      case 'someday':
        return 'text-blue-600 bg-blue-50 px-2 py-1 rounded-full';
      default:
        return 'text-gray-400';
    }
  };

  const getEnergyColor = () => {
    switch (energyRequired) {
      case 'low':
        return 'text-green-600 bg-green-50 px-2 py-1 rounded-full';
      case 'medium':
        return 'text-green-600 bg-green-50 px-2 py-1 rounded-full';
      case 'high':
        return 'text-green-600 bg-green-50 px-2 py-1 rounded-full';
      default:
        return 'text-gray-400';
    }
  };

  const getEmotionalColor = () => {
    switch (emotionalWeight) {
      case 'easy':
        return 'text-green-600 bg-green-50 px-2 py-1 rounded-full';
      case 'neutral':
        return 'text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full';
      case 'stressful':
        return 'text-orange-600 bg-orange-50 px-2 py-1 rounded-full';
      case 'dreading':
        return 'text-red-600 bg-red-50 px-2 py-1 rounded-full';
      default:
        return 'text-gray-400';
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow p-3 transition-all ${isExpanded ? 'border-indigo-500 border' : ''}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center">
          <button 
            type="button"
            className="mr-3 flex-shrink-0 focus:outline-none text-gray-400 hover:text-indigo-500"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Plus size={24} />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            placeholder={isExpanded ? "What do you need to do? (Try !today, #project, @category)" : "Quick add task..."}
            className="flex-grow text-gray-900 placeholder-gray-500 border-0 focus:ring-0 p-0 text-base"
            value={title}
            onChange={(e) => processTitle(e.target.value)}
            onClick={() => setIsExpanded(true)}
          />
          
          {title && (
            <button
              type="submit"
              className="ml-2 p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={`flex items-center text-sm ${dueDate ? 'text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full' : 'text-gray-500'}`}
                onClick={() => {
                  setDueDate(dueDate ? null : getTodayString());
                }}
              >
                <Calendar size={16} className="mr-1" />
                {dueDate ? formatDate(dueDate) : 'Due date'}
              </button>
              
              <button
                type="button"
                className={`flex items-center text-sm ${getPriorityColor()}`}
                onClick={() => {
                  if (priority === 'medium') setPriority('high');
                  else if (priority === 'high') setPriority('low');
                  else setPriority('medium');
                }}
              >
                <Circle size={16} className="mr-1" />
                {priority === 'medium' ? 'Medium' : priority === 'high' ? 'High' : 'Low'} priority
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  className={`flex items-center text-sm ${projectId ? 'text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full' : 'text-gray-500'}`}
                  onClick={() => {
                    setShowProjectPicker(!showProjectPicker);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Folder size={16} className="mr-1" />
                  {projectId ? projects.find(p => p.id === projectId)?.name || 'Project' : 'Project'}
                </button>
                
                {showProjectPicker && (
                  <div className="absolute left-0 top-8 z-10 bg-white rounded-md shadow-lg p-2 w-48 max-h-48 overflow-y-auto">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded ${projectId === project.id ? 'bg-indigo-50' : ''}`}
                        onClick={() => {
                          setProjectId(projectId === project.id ? null : project.id);
                          setShowProjectPicker(false);
                        }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: project.color }}
                        ></div>
                        <span className="text-sm">{project.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  className={`flex items-center text-sm ${categoryIds.length > 0 ? 'text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full' : 'text-gray-500'}`}
                  onClick={() => {
                    setShowCategoryPicker(!showCategoryPicker);
                    setShowProjectPicker(false);
                  }}
                >
                  <Tag size={16} className="mr-1" />
                  {categoryIds.length > 0 ? `${categoryIds.length} ${categoryIds.length === 1 ? 'category' : 'categories'}` : 'Categories'}
                </button>
                
                {showCategoryPicker && (
                  <div className="absolute left-0 top-8 z-10 bg-white rounded-md shadow-lg p-2 w-48 max-h-48 overflow-y-auto">
                    {categories.map(category => (
                      <div
                        key={category.id}
                        className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded ${categoryIds.includes(category.id) ? 'bg-indigo-50' : ''}`}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm">{category.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Enhanced ADHD-friendly fields */}
              <button
                type="button"
                className={`flex items-center font-medium transition-all hover:scale-105 ${getUrgencyColor()}`}
                onClick={() => {
                  if (urgency === 'week') setUrgency('today');
                  else if (urgency === 'today') setUrgency('month');
                  else if (urgency === 'month') setUrgency('someday');
                  else setUrgency('week');
                }}
              >
                <Flame size={18} className="mr-2" />
                <span className="text-base">
                  {urgency === 'today' ? '🔥 Today' : urgency === 'week' ? '📅 Week' : urgency === 'month' ? '📌 Month' : '🌊 Someday'}
                </span>
              </button>
              
              <button
                type="button"
                className={`flex items-center font-medium transition-all hover:scale-105 ${getEnergyColor()}`}
                onClick={() => {
                  if (energyRequired === 'medium') setEnergyRequired('low');
                  else if (energyRequired === 'low') setEnergyRequired('high');
                  else setEnergyRequired('medium');
                }}
              >
                <Battery size={18} className="mr-2" />
                <span className="text-base">
                  {energyRequired === 'low' ? '🔋 Low' : energyRequired === 'medium' ? '⚡ Med' : '🚀 High'}
                </span>
              </button>
              
              <button
                type="button"
                className={`flex items-center font-medium transition-all hover:scale-105 ${getEmotionalColor()}`}
                onClick={() => {
                  if (emotionalWeight === 'neutral') setEmotionalWeight('easy');
                  else if (emotionalWeight === 'easy') setEmotionalWeight('stressful');
                  else if (emotionalWeight === 'stressful') setEmotionalWeight('dreading');
                  else setEmotionalWeight('neutral');
                }}
              >
                <Brain size={18} className="mr-2" />
                <span className="text-base">
                  {emotionalWeight === 'easy' ? '😊 Love it' : emotionalWeight === 'neutral' ? '😐 Neutral' : emotionalWeight === 'stressful' ? '😩 Ugh' : '😰 Dread'}
                </span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// Helper to format date for display
const formatDate = (dateString: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

export default QuickTaskInput;
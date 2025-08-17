import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Command, 
  Plus,
  Calendar,
  ClipboardList,
  Folder,
  Settings,
  Moon,
  Sun,
  Home,
  Brain,
  Target,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContextSupabase';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings';
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Define all available commands
  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      icon: <Home size={18} />,
      shortcut: '⌘D',
      action: () => {
        navigate('/');
        setIsOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'nav-tasks',
      label: 'Go to Tasks',
      icon: <ClipboardList size={18} />,
      shortcut: '⌘T',
      action: () => {
        navigate('/tasks');
        setIsOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      icon: <Folder size={18} />,
      shortcut: '⌘P',
      action: () => {
        navigate('/projects');
        setIsOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'nav-calendar',
      label: 'Go to Calendar',
      icon: <Calendar size={18} />,
      action: () => {
        navigate('/calendar');
        setIsOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'nav-brain-dump',
      label: 'Go to Brain Dump',
      icon: <Brain size={18} />,
      action: () => {
        navigate('/brain-dump');
        setIsOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'nav-what-now',
      label: 'Go to What Now',
      icon: <Target size={18} />,
      action: () => {
        navigate('/what-now');
        setIsOpen(false);
      },
      category: 'navigation'
    },
    
    // Actions
    {
      id: 'action-add-task',
      label: 'Add New Task',
      icon: <Plus size={18} />,
      shortcut: '⌘N',
      action: () => {
        // This would open the task modal
        // For now, navigate to tasks page
        navigate('/tasks');
        setIsOpen(false);
      },
      category: 'actions'
    },
    {
      id: 'action-quick-capture',
      label: 'Quick Capture',
      icon: <Brain size={18} />,
      shortcut: '⌘K',
      action: () => {
        // Focus on quick capture input
        const quickCapture = document.querySelector('[data-quick-capture]') as HTMLInputElement;
        if (quickCapture) {
          quickCapture.focus();
        }
        setIsOpen(false);
      },
      category: 'actions'
    },
    
    // Settings
    {
      id: 'settings-theme',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />,
      shortcut: '⌘⇧D',
      action: () => {
        toggleTheme();
        setIsOpen(false);
      },
      category: 'settings'
    },
    {
      id: 'settings-preferences',
      label: 'Go to Settings',
      icon: <Settings size={18} />,
      shortcut: '⌘,',
      action: () => {
        navigate('/settings');
        setIsOpen(false);
      },
      category: 'settings'
    }
  ];
  
  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );
  
  // Group commands by category
  const groupedCommands = {
    navigation: filteredCommands.filter(cmd => cmd.category === 'navigation'),
    actions: filteredCommands.filter(cmd => cmd.category === 'actions'),
    settings: filteredCommands.filter(cmd => cmd.category === 'settings')
  };
  
  // Flatten for keyboard navigation
  const allFilteredCommands = filteredCommands;
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setSearch('');
        setSelectedIndex(0);
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      
      // Navigate with arrow keys
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < allFilteredCommands.length - 1 ? prev + 1 : 0
          );
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : allFilteredCommands.length - 1
          );
        }
        if (e.key === 'Enter' && allFilteredCommands[selectedIndex]) {
          e.preventDefault();
          allFilteredCommands[selectedIndex].action();
        }
      }
      
      // Direct keyboard shortcuts (when palette is closed)
      if (!isOpen) {
        // Cmd+D for Dashboard
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
          e.preventDefault();
          navigate('/');
        }
        // Cmd+T for Tasks
        if ((e.metaKey || e.ctrlKey) && e.key === 't') {
          e.preventDefault();
          navigate('/tasks');
        }
        // Cmd+P for Projects
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
          e.preventDefault();
          navigate('/projects');
        }
        // Cmd+N for New Task
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
          e.preventDefault();
          navigate('/tasks');
        }
        // Cmd+Shift+D for Dark Mode
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
          e.preventDefault();
          toggleTheme();
        }
        // Cmd+, for Settings
        if ((e.metaKey || e.ctrlKey) && e.key === ',') {
          e.preventDefault();
          navigate('/settings');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allFilteredCommands, navigate, toggleTheme]);
  
  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  const CommandGroup = ({ title, items }: { title: string; items: CommandItem[] }) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-4">
        <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="mt-1">
          {items.map((cmd, index) => {
            const globalIndex = allFilteredCommands.indexOf(cmd);
            const isSelected = globalIndex === selectedIndex;
            
            return (
              <button
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm
                  transition-colors duration-150
                  ${isSelected 
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="opacity-60">{cmd.icon}</span>
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-20 px-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Command Palette */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 ml-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              className="flex-1 px-4 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Command List */}
          <div className="max-h-96 overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No commands found for "{search}"
              </div>
            ) : (
              <>
                <CommandGroup title="Navigation" items={groupedCommands.navigation} />
                <CommandGroup title="Actions" items={groupedCommands.actions} />
                <CommandGroup title="Settings" items={groupedCommands.settings} />
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd>
                  Close
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command size={12} />
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">K</kbd>
                to open
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
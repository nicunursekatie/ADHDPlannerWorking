import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DarkModeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  showLabel = false,
  className = ''
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center gap-2
        px-3 py-2 rounded-lg
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        transition-all duration-200
        group
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Toggle switch */}
      <div className="relative w-14 h-7 bg-gray-300 dark:bg-gray-600 rounded-full transition-colors">
        <div
          className={`
            absolute top-1 left-1 w-5 h-5 
            bg-white rounded-full shadow-md
            transition-transform duration-200
            flex items-center justify-center
            ${isDark ? 'translate-x-7' : 'translate-x-0'}
          `}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-gray-700" />
          ) : (
            <Sun className="w-3 h-3 text-yellow-500" />
          )}
        </div>
      </div>
      
      {/* Label */}
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

// Compact version for header
export const DarkModeToggleCompact: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <button
      onClick={toggleTheme}
      className="
        p-2 rounded-lg
        text-gray-600 hover:text-gray-900
        dark:text-gray-400 dark:hover:text-gray-100
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-all duration-200
        group
      "
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-6 h-6">
        {/* Sun icon */}
        <Sun 
          className={`
            absolute inset-0 w-6 h-6
            transition-all duration-300
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        
        {/* Moon icon */}
        <Moon 
          className={`
            absolute inset-0 w-6 h-6
            transition-all duration-300
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
        />
      </div>
    </button>
  );
};
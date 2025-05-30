import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfToday, parseISO, isValid } from 'date-fns';

interface QuickDueDateEditorProps {
  currentDate: string | null;
  onDateChange: (date: string | null) => void;
  onClose: () => void;
}

export const QuickDueDateEditor: React.FC<QuickDueDateEditorProps> = ({
  currentDate,
  onDateChange,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate || format(startOfToday(), 'yyyy-MM-dd')
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const date = selectedDate ? parseISO(selectedDate) : null;
    if (date && isValid(date)) {
      onDateChange(selectedDate);
    } else {
      onDateChange(null);
    }
    onClose();
  };

  const handleQuickDate = (days: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = format(addDays(startOfToday(), days), 'yyyy-MM-dd');
    setSelectedDate(newDate);
    onDateChange(newDate);
    onClose();
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(null);
    onClose();
  };

  return (
    <div ref={containerRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[280px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <input
            ref={inputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={(e) => handleSave(e)}
            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
            title="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quick dates:</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={(e) => handleQuickDate(0, e)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-left"
            >
              Today
            </button>
            <button
              onClick={(e) => handleQuickDate(1, e)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-left"
            >
              Tomorrow
            </button>
            <button
              onClick={(e) => handleQuickDate(7, e)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-left"
            >
              Next week
            </button>
            <button
              onClick={(e) => handleQuickDate(14, e)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-left"
            >
              In 2 weeks
            </button>
          </div>
          {currentDate && (
            <button
              onClick={(e) => handleClearDate(e)}
              className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              Remove due date
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isValid, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { getTodayString, getTomorrowString } from '../../utils/dateUtils';

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
    currentDate || getTodayString()
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    currentDate ? parseISO(currentDate) : new Date()
  );
  const [position, setPosition] = useState({ x: 0, y: 0, showAbove: false });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const updatePopupPosition = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopupPosition({
        x: rect.right - 280, // Position to align with right edge
        y: rect.bottom + 4
      });
    }
  };

  useEffect(() => {
    updatePopupPosition();
    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('scroll', updatePopupPosition);
    return () => {
      window.removeEventListener('resize', updatePopupPosition);
      window.removeEventListener('scroll', updatePopupPosition);
    };
  }, []);

  const updateCalendarPosition = () => {
    if (calendarButtonRef.current) {
      const rect = calendarButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const calendarHeight = 350; // Height of calendar popup
      
      setPosition({
        x: rect.right - 300, // Position calendar to the right edge minus width
        y: spaceBelow < calendarHeight && spaceAbove > calendarHeight 
          ? rect.top - calendarHeight - 8 
          : rect.bottom + 8,
        showAbove: spaceBelow < calendarHeight && spaceAbove > calendarHeight
      });
    }
  };

  const handleShowCalendar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowCalendar(true);
    updateCalendarPosition();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInContainer = containerRef.current && containerRef.current.contains(target);
      const clickedInPopup = popupRef.current && popupRef.current.contains(target);
      const clickedInCalendar = calendarRef.current && calendarRef.current.contains(target);
      
      if (!clickedInContainer && !clickedInPopup && !clickedInCalendar) {
        if (showCalendar) {
          setShowCalendar(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, showCalendar]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSave = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const date = selectedDate ? parseISO(selectedDate) : null;
    const dateToSave = (date && isValid(date)) ? selectedDate : null;
    
    // Save immediately since user clicked the save button
    onDateChange(dateToSave);
    onClose();
  };

  const handleQuickDate = (days: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let newDate: string;
    
    console.log(`handleQuickDate called with days: ${days}`);
    
    if (days === 0) {
      newDate = getTodayString();
      console.log(`Today string: ${newDate}`);
      console.log(`Current system date: ${new Date()}`);
      console.log(`System says today is: ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
    } else if (days === 1) {
      newDate = getTomorrowString();
      console.log(`Tomorrow string: ${newDate}`);
      console.log(`Current system date: ${new Date()}`);
      console.log(`System says tomorrow should be: ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate() + 1).padStart(2, '0')}`);
    } else {
      // For other days, calculate based on today's date
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      
      // Format to YYYY-MM-DD
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      newDate = `${year}-${month}-${day}`;
      console.log(`Calculated date for ${days} days: ${newDate}`);
    }
    
    console.log(`Setting selected date to: ${newDate}`);
    setSelectedDate(newDate);
    
    // Call the parent callback immediately for UI updates
    console.log(`Calling onDateChange with: ${newDate}`);
    onDateChange(newDate);
    onClose();
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Call the parent callback immediately for UI updates
    onDateChange(null);
    onClose();
  };

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateString);
    
    // Call the parent callback immediately for UI updates
    onDateChange(dateString);
    setShowCalendar(false);
    onClose();
  };

  const renderCalendar = () => {
    if (!showCalendar) return null;

    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today in local timezone
    const selectedDateObj = selectedDate ? parseISO(selectedDate) : null;

    return createPortal(
      <div 
        ref={calendarRef}
        className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[300px]"
        style={{ 
          left: Math.max(8, Math.min(position.x, window.innerWidth - 316)), // Ensure it stays in viewport
          top: Math.max(8, Math.min(position.y, window.innerHeight - 358))
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {format(calendarMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isToday = isSameDay(day, today);
            const isSelected = selectedDateObj && isSameDay(day, selectedDateObj);
            const isCurrentMonth = isSameMonth(day, calendarMonth);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateSelect(day)}
                className={`
                  p-2 text-sm rounded transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${isToday && !isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : ''}
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setShowCalendar(false)}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      </div>,
      document.body
    );
  };

  const renderDatePickerPopup = () => {
    return createPortal(
      <div 
        ref={popupRef}
        className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[280px]"
        style={{ 
          left: Math.max(8, Math.min(popupPosition.x, window.innerWidth - 288)),
          top: Math.max(8, Math.min(popupPosition.y, window.innerHeight - 300))
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={selectedDate ? format(parseISO(selectedDate), 'MMM d, yyyy') : ''}
            placeholder="Select date"
            onChange={(e) => {
              const input = e.target.value;
              try {
                const parsed = new Date(input);
                if (isValid(parsed)) {
                  const newDate = format(parsed, 'yyyy-MM-dd');
                  setSelectedDate(newDate);
                  // Note: We don't call onDateChange here for typed input
                  // to avoid too many rapid calls while typing
                }
              } catch (error) {
                // Invalid date, ignore
              }
            }}
            onClick={(e) => handleShowCalendar(e)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            ref={calendarButtonRef}
            onClick={(e) => handleShowCalendar(e)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="Open calendar"
          >
            <Calendar className="w-4 h-4" />
          </button>
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
      </div>,
      document.body
    );
  };

  return (
    <>
      <div ref={containerRef}>
        <div ref={anchorRef} className="relative inline-block" />
      </div>
      {renderDatePickerPopup()}
      {renderCalendar()}
    </>
  );
};
import { format, parse, isValid, startOfDay } from 'date-fns';

/**
 * Standard date format used throughout the app (YYYY-MM-DD)
 */
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Parse a date string in YYYY-MM-DD format to a Date object
 * Ensures consistent timezone handling by parsing as local date
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Parse the date string as a local date (not UTC)
    const parsed = parse(dateString, DATE_FORMAT, new Date());
    
    // Validate the parsed date
    if (!isValid(parsed)) {
      console.warn(`Invalid date string: ${dateString}`);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}`, error);
    return null;
  }
}

/**
 * Format a Date object to YYYY-MM-DD string
 * Returns null for invalid dates
 */
export function formatDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  try {
    // Validate the date
    if (!isValid(date)) {
      console.warn('Invalid date object:', date);
      return null;
    }
    
    return format(date, DATE_FORMAT);
  } catch (error) {
    console.warn('Failed to format date:', date, error);
    return null;
  }
}

/**
 * Create a date string for today in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return formatDateString(new Date()) || '';
}

/**
 * Create a date string for tomorrow in YYYY-MM-DD format
 */
export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateString(tomorrow) || '';
}

/**
 * Format a date string for display (e.g., "Mon, Jan 15")
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  if (!date) return '';
  
  try {
    return format(date, 'EEE, MMM d');
  } catch (error) {
    return '';
  }
}

/**
 * Format a date string with year for display (e.g., "Mon, Jan 15, 2024")
 */
export function formatDateWithYearForDisplay(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  if (!date) return '';
  
  try {
    return format(date, 'EEE, MMM d, yyyy');
  } catch (error) {
    return '';
  }
}

/**
 * Check if a date string represents today
 */
export function isToday(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  if (!date) return false;
  
  const today = startOfDay(new Date());
  const dateStart = startOfDay(date);
  
  return dateStart.getTime() === today.getTime();
}

/**
 * Check if a date string represents a past date (before today)
 */
export function isPastDate(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  if (!date) return false;
  
  const today = startOfDay(new Date());
  const dateStart = startOfDay(date);
  
  return dateStart < today;
}

/**
 * Check if a date string represents a future date (after today)
 */
export function isFutureDate(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  if (!date) return false;
  
  const today = startOfDay(new Date());
  const dateStart = startOfDay(date);
  
  return dateStart > today;
}

/**
 * Get the number of days between two date strings
 * Returns positive if date2 is after date1, negative if before
 */
export function getDaysBetween(dateString1: string | null | undefined, dateString2: string | null | undefined): number | null {
  const date1 = parseDate(dateString1);
  const date2 = parseDate(dateString2);
  
  if (!date1 || !date2) return null;
  
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get due date status information for a task
 */
export function getDueDateStatus(dateString: string | null | undefined): {
  text: string;
  className: string;
  isOverdue: boolean;
  isToday: boolean;
  daysUntilDue: number | null;
} | null {
  if (!dateString) return null;
  
  const today = getTodayString();
  const daysUntil = getDaysBetween(today, dateString);
  
  if (daysUntil === null) return null;
  
  // Overdue
  if (daysUntil < 0) {
    const daysOverdue = Math.abs(daysUntil);
    return {
      text: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
      className: 'text-red-600 font-semibold',
      isOverdue: true,
      isToday: false,
      daysUntilDue: daysUntil
    };
  }
  
  // Due today
  if (daysUntil === 0) {
    return {
      text: 'Due today',
      className: 'text-green-600 font-semibold',
      isOverdue: false,
      isToday: true,
      daysUntilDue: 0
    };
  }
  
  // Future date
  return {
    text: formatDateForDisplay(dateString),
    className: 'text-gray-500',
    isOverdue: false,
    isToday: false,
    daysUntilDue: daysUntil
  };
}

/**
 * Sort date strings in ascending order (earliest first)
 * Handles null/undefined values by placing them at the end
 */
export function sortDateStrings(dates: (string | null | undefined)[]): (string | null | undefined)[] {
  return dates.sort((a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateA.getTime() - dateB.getTime();
  });
}
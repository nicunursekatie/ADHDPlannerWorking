import { format, parse, isValid, startOfDay, addDays, addWeeks, addMonths, nextDay, lastDayOfMonth, differenceInDays, differenceInWeeks, differenceInMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Standard date format used throughout the app (YYYY-MM-DD)
 */
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Parse a date string in YYYY-MM-DD format or ISO format to a Date object
 * Ensures consistent timezone handling by parsing as local date
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Handle ISO date strings (e.g., "2025-05-22T23:22:57.975Z")
    if (dateString.includes('T') || dateString.includes('Z')) {
      const isoDate = new Date(dateString);
      if (!isValid(isoDate)) {
        console.warn(`Invalid ISO date string: ${dateString}`);
        return null;
      }
      return isoDate;
    }
    
    // Handle YYYY-MM-DD format strings
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
 * Uses local timezone to ensure consistency with user's perception of "today"
 */
export function getTodayString(): string {
  const today = new Date();
  
  // Force local timezone by using local date components
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Create a date string for tomorrow in YYYY-MM-DD format
 * Uses local timezone to ensure consistency with user's perception of "tomorrow"
 */
export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Force local timezone by using local date components
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
  
  // Normalize to start of day to avoid timezone issues
  const date1Start = startOfDay(date1);
  const date2Start = startOfDay(date2);
  
  const diffTime = date2Start.getTime() - date1Start.getTime();
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

/**
 * Parse natural language date expressions and return a Date object
 * Examples:
 * - "tomorrow", "today", "yesterday"
 * - "next monday", "next friday"
 * - "in 3 days", "in 2 weeks", "in 1 month"
 * - "3d", "2w", "1m" (shorthand)
 * - "jan 15", "december 25", "oct 31"
 * - "by july" -> last day of July
 * - "end of month" -> last day of current month
 */
export function parseNaturalDate(input: string): Date | null {
  const normalizedInput = input.toLowerCase().trim();
  const today = startOfDay(new Date());
  
  // Handle relative day keywords
  if (normalizedInput === 'today') return today;
  if (normalizedInput === 'tomorrow') return addDays(today, 1);
  if (normalizedInput === 'yesterday') return addDays(today, -1);
  
  // Handle "next [weekday]"
  const nextDayMatch = normalizedInput.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = weekdays.indexOf(nextDayMatch[1]);
    return nextDay(today, targetDay as 0 | 1 | 2 | 3 | 4 | 5 | 6);
  }
  
  // Handle "in X days/weeks/months"
  const inTimeMatch = normalizedInput.match(/^in\s+(\d+)\s+(days?|weeks?|months?)$/);
  if (inTimeMatch) {
    const amount = parseInt(inTimeMatch[1]);
    const unit = inTimeMatch[2];
    
    if (unit.startsWith('day')) return addDays(today, amount);
    if (unit.startsWith('week')) return addWeeks(today, amount);
    if (unit.startsWith('month')) return addMonths(today, amount);
  }
  
  // Handle shorthand (3d, 2w, 1m)
  const shorthandMatch = normalizedInput.match(/^(\d+)([dwm])$/);
  if (shorthandMatch) {
    const amount = parseInt(shorthandMatch[1]);
    const unit = shorthandMatch[2];
    
    if (unit === 'd') return addDays(today, amount);
    if (unit === 'w') return addWeeks(today, amount);
    if (unit === 'm') return addMonths(today, amount);
  }
  
  // Handle "by [month] [day]" (e.g., "by july 1")
  const byMonthDayMatch = normalizedInput.match(/^by\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})$/);
  if (byMonthDayMatch) {
    const monthMap: { [key: string]: number } = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    const targetMonth = monthMap[byMonthDayMatch[1]];
    const targetDay = parseInt(byMonthDayMatch[2]);
    
    let targetDate = new Date(today.getFullYear(), targetMonth, targetDay);
    
    // If the date is in the past, use next year
    if (targetDate < today) {
      targetDate = new Date(today.getFullYear() + 1, targetMonth, targetDay);
    }
    
    // Validate the date
    if (isValid(targetDate) && targetDate.getDate() === targetDay) {
      return startOfDay(targetDate);
    }
  }
  
  // Handle "by [month]" -> last day of that month
  const byMonthMatch = normalizedInput.match(/^by\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/);
  if (byMonthMatch) {
    const monthMap: { [key: string]: number } = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    const targetMonth = monthMap[byMonthMatch[1]];
    let targetDate = new Date(today.getFullYear(), targetMonth, 1);
    
    // If the target month is before the current month, use next year
    if (targetMonth < today.getMonth()) {
      targetDate = new Date(today.getFullYear() + 1, targetMonth, 1);
    }
    
    return lastDayOfMonth(targetDate);
  }
  
  // Handle "end of month"
  if (normalizedInput === 'end of month' || normalizedInput === 'eom') {
    return lastDayOfMonth(today);
  }
  
  // Handle month + day (e.g., "jan 15", "december 25")
  const monthDayMatch = normalizedInput.match(/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})$/);
  if (monthDayMatch) {
    const monthMap: { [key: string]: number } = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    const targetMonth = monthMap[monthDayMatch[1]];
    const targetDay = parseInt(monthDayMatch[2]);
    
    let targetDate = new Date(today.getFullYear(), targetMonth, targetDay);
    
    // If the date is in the past, use next year
    if (targetDate < today) {
      targetDate = new Date(today.getFullYear() + 1, targetMonth, targetDay);
    }
    
    // Validate the date
    if (isValid(targetDate) && targetDate.getDate() === targetDay) {
      return startOfDay(targetDate);
    }
  }
  
  // Handle numeric date formats (MM/DD or MM-DD)
  const numericDateMatch = normalizedInput.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (numericDateMatch) {
    const month = parseInt(numericDateMatch[1]) - 1; // 0-indexed
    const day = parseInt(numericDateMatch[2]);
    
    let targetDate = new Date(today.getFullYear(), month, day);
    
    // If the date is in the past, use next year
    if (targetDate < today) {
      targetDate = new Date(today.getFullYear() + 1, month, day);
    }
    
    // Validate the date
    if (isValid(targetDate) && targetDate.getMonth() === month && targetDate.getDate() === day) {
      return startOfDay(targetDate);
    }
  }
  
  return null;
}

/**
 * Extract date from text and return both the cleaned text and the date
 * This function looks for date patterns anywhere in the text
 */
export function extractDateFromText(text: string): { cleanedText: string; date: Date | null } {
  // Common patterns to check (order matters - more specific patterns first)
  const patterns = [
    /\b(today|tomorrow|yesterday)\b/i,
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\bin\s+\d+\s+(days?|weeks?|months?)\b/i,
    /\b\d+[dwm]\b/i,
    /\bby\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\b/i, // "by july 1" - more specific, check first
    /\bby\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i, // "by july" - less specific, check second
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\b/i,
    /\b\d{1,2}[\/\-]\d{1,2}\b/,
    /\bend\s+of\s+month\b/i,
    /\beom\b/i
  ];
  
  let cleanedText = text;
  let foundDate: Date | null = null;
  
  // Check each pattern
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[0];
      const parsedDate = parseNaturalDate(dateStr);
      
      if (parsedDate) {
        foundDate = parsedDate;
        // Remove the date pattern from the text
        cleanedText = text.replace(pattern, '').trim();
        // Clean up any double spaces
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }
  
  return { cleanedText, date: foundDate };
}

/**
 * Get relative time display for a date string
 * Returns format like "Today (Jun 14)" or "In 3 days (Jun 17)"
 * @param dateString - The date string to format
 * @param useWeekendRelative - Whether to use weekend-relative format instead
 */
export function getRelativeTimeDisplay(
  dateString: string | null | undefined, 
  useWeekendRelative: boolean = false
): {
  relative: string;
  absolute: string;
  combined: string;
  urgencyLevel: 'overdue' | 'today' | 'soon' | 'future';
} | null {
  if (!dateString) return null;
  
  const date = parseDate(dateString);
  if (!date) return null;
  
  // Use weekend-relative display if requested
  if (useWeekendRelative) {
    return getWeekendRelativeDisplay(dateString);
  }
  
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const daysDiff = differenceInDays(targetDate, today);
  
  let relative = '';
  let urgencyLevel: 'overdue' | 'today' | 'soon' | 'future' = 'future';
  
  // Handle past dates (overdue)
  if (daysDiff < 0) {
    const daysOverdue = Math.abs(daysDiff);
    urgencyLevel = 'overdue';
    
    if (daysOverdue === 1) {
      relative = 'Yesterday';
    } else if (daysOverdue <= 7) {
      relative = `${daysOverdue} days ago`;
    } else if (daysOverdue <= 14) {
      relative = 'Last week';
    } else {
      const weeksAgo = Math.floor(daysOverdue / 7);
      relative = `${weeksAgo} weeks ago`;
    }
  }
  // Handle today
  else if (daysDiff === 0) {
    relative = 'Today';
    urgencyLevel = 'today';
  }
  // Handle future dates
  else {
    if (daysDiff === 1) {
      relative = 'Tomorrow';
      urgencyLevel = 'soon';
    } else if (daysDiff <= 6) {
      // Within this week - show day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[getDay(targetDate)];
      const todayDayName = dayNames[getDay(today)];
      
      // Check if it's still this week
      const weeksDiff = differenceInWeeks(targetDate, today);
      if (weeksDiff === 0) {
        relative = `This ${dayName}`;
      } else {
        relative = `Next ${dayName}`;
      }
      urgencyLevel = daysDiff <= 3 ? 'soon' : 'future';
    } else if (daysDiff <= 13) {
      relative = 'Next week';
      urgencyLevel = 'future';
    } else if (daysDiff <= 30) {
      const weeks = Math.ceil(daysDiff / 7);
      relative = `In ${weeks} weeks`;
      urgencyLevel = 'future';
    } else {
      const months = differenceInMonths(targetDate, today);
      if (months === 1) {
        relative = 'Next month';
      } else {
        relative = `In ${months} months`;
      }
      urgencyLevel = 'future';
    }
  }
  
  const absolute = formatDateForDisplay(dateString);
  const combined = `${relative} (${absolute})`;
  
  return {
    relative,
    absolute,
    combined,
    urgencyLevel
  };
}

/**
 * Get weekend-relative date display
 * Returns format like "Monday after this weekend" or "Sunday of next weekend"
 */
export function getWeekendRelativeDisplay(dateString: string | null | undefined, currentDate: Date = new Date()): {
  weekendRelative: string;
  absolute: string;
  combined: string;
  urgencyLevel: 'overdue' | 'today' | 'soon' | 'future';
} | null {
  if (!dateString) return null;
  
  const targetDate = parseDate(dateString);
  if (!targetDate) return null;
  
  const today = startOfDay(currentDate);
  const target = startOfDay(targetDate);
  
  // Day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayName = dayNames[getDay(target)];
  
  const daysDiff = differenceInDays(target, today);
  
  // Priority 1: Use simple language for immediate dates
  let weekendRelative = '';
  let urgencyLevel: 'overdue' | 'today' | 'soon' | 'future' = 'future';
  
  // Handle today
  if (daysDiff === 0) {
    weekendRelative = 'Today';
    urgencyLevel = 'today';
  }
  // Handle yesterday  
  else if (daysDiff === -1) {
    weekendRelative = 'Yesterday';
    urgencyLevel = 'overdue';
  }
  // Handle tomorrow
  else if (daysDiff === 1) {
    weekendRelative = 'Tomorrow';
    urgencyLevel = 'soon';
  }
  // Handle 2-3 days ago (simple)
  else if (daysDiff >= -3 && daysDiff < -1) {
    const daysAgo = Math.abs(daysDiff);
    weekendRelative = `${daysAgo} days ago`;
    urgencyLevel = 'overdue';
  }
  // Handle this week (next few days)
  else if (daysDiff > 1 && daysDiff <= 6) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayName = dayNames[getDay(target)];
    
    // Check if it's still in the same week
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    const targetWeekStart = startOfWeek(target, { weekStartsOn: 0 });
    
    if (todayWeekStart.getTime() === targetWeekStart.getTime()) {
      weekendRelative = `This ${targetDayName}`;
    } else {
      weekendRelative = `Next ${targetDayName}`;
    }
    urgencyLevel = daysDiff <= 3 ? 'soon' : 'future';
  }
  // For dates beyond this range, use weekend-relative logic
  else {
    // Set urgency based on timing
    if (target < today) {
      urgencyLevel = 'overdue';
    } else if (differenceInDays(target, today) <= 7) {
      urgencyLevel = 'soon';
    } else {
      urgencyLevel = 'future';
    }
  
    // Find the Saturday and Sunday of the current week and target week
    const getCurrentWeekend = (date: Date) => {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
      const saturday = addDays(weekStart, 6);
      const sunday = weekStart;
      return { saturday, sunday };
    };
    
    const todayWeekend = getCurrentWeekend(today);
    const targetWeekend = getCurrentWeekend(target);
    
    let weekendReference = '';
    let position = '';
    
    // Determine which weekend period we're referring to
    const weekDiff = Math.floor(differenceInDays(targetWeekend.saturday, todayWeekend.saturday) / 7);
    
    if (weekDiff === 0) {
      // Same week as today
      weekendReference = 'this weekend';
    } else if (weekDiff === 1) {
      // Next week
      weekendReference = 'next weekend';
    } else if (weekDiff === 2) {
      // Week after next
      weekendReference = 'weekend after next';
    } else if (weekDiff < 0) {
      // Past weeks
      const weeksAgo = Math.abs(weekDiff);
      if (weeksAgo === 1) {
        weekendReference = 'last weekend';
      } else {
        weekendReference = `${weeksAgo} weekends ago`;
      }
    } else {
      // Far future
      weekendReference = `${weekDiff} weekends from now`;
    }
    
    // Determine position relative to weekend
    const targetDay = getDay(target);
    if (targetDay === 6 || targetDay === 0) {
      // Saturday or Sunday
      position = 'of';
    } else if (targetDay < 6) {
      // Monday through Friday
      position = 'before';
    } else {
      // This shouldn't happen, but just in case
      position = 'after';
    }
    
    // Special case: if target is Monday-Friday and it's AFTER the weekend, adjust
    if (position === 'before' && weekDiff > 0) {
      // This is actually after the previous weekend
      if (weekDiff === 1) {
        weekendReference = 'this weekend';
        position = 'after';
      } else {
        const adjustedWeekDiff = weekDiff - 1;
        if (adjustedWeekDiff === 0) {
          weekendReference = 'this weekend';
        } else if (adjustedWeekDiff === 1) {
          weekendReference = 'next weekend';
        } else {
          weekendReference = `weekend after next`;
        }
        position = 'after';
      }
    }
    
    // Construct the weekend-relative string for far dates
    weekendRelative = `${targetDayName} ${position} ${weekendReference}`;
  }
  
  const absolute = formatDateForDisplay(dateString);
  const combined = `${weekendRelative} (${absolute})`;
  
  return {
    weekendRelative,
    absolute,
    combined,
    urgencyLevel
  };
}
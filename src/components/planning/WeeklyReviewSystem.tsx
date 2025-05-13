import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, Project } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { ImprovedTaskCard } from '../tasks/ImprovedTaskCard';
import { formatDate } from '../../utils/helpers';
import { 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  ClipboardList, 
  Clock, 
  LayoutGrid, 
  NotebookPen, 
  Plus, 
  RefreshCw 
} from 'lucide-react';

interface WeeklyReviewSystemProps {
  onTaskCreated?: () => void;
}

type ReviewSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  prompts: string[];
  complete: boolean;
  hasJournal: boolean;
};

const WeeklyReviewSystem: React.FC<WeeklyReviewSystemProps> = ({ onTaskCreated }) => {
  const {
    tasks,
    projects,
    quickAddTask,
    updateTask,
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    getJournalEntriesForWeek,
    updateLastWeeklyReviewDate,
  } = useAppContext();

  const [taskInput, setTaskInput] = useState('');
  const [journalInput, setJournalInput] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [currentMood, setCurrentMood] = useState<'great' | 'good' | 'neutral' | 'challenging' | 'difficult'>('neutral');
  const [hasEnteredJournal, setHasEnteredJournal] = useState(false);

  const getCurrentWeekDetails = () => {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return {
      weekNumber,
      weekYear: date.getFullYear(),
    };
  };

  const { weekNumber, weekYear } = getCurrentWeekDetails();
  const weeklyJournalEntries = getJournalEntriesForWeek(weekNumber, weekYear);

  const getCurrentSectionJournalEntries = () => {
    if (!activeSectionId) return [];
    return weeklyJournalEntries.filter((entry) => entry.section === activeSectionId);
  };

  const getCurrentPromptJournalEntries = () => {
    if (!activeSectionId) return [];
    return weeklyJournalEntries.filter(
      (entry) => entry.section === activeSectionId && entry.promptIndex === currentPromptIndex
    );
  };

  const currentPromptEntries = getCurrentPromptJournalEntries();
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const incompleteTasks = tasks.filter((task) => !task.completed);
  const tasksDueThisWeek = incompleteTasks.filter(
    (task) => task.dueDate && task.dueDate >= formatDate(today) && task.dueDate <= formatDate(nextWeek)
  );

  const overdueTasks = incompleteTasks.filter((task) => task.dueDate && task.dueDate < formatDate(today));

  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  const recentlyCompleted = tasks.filter(
    (task) => task.completed && new Date(task.updatedAt) >= lastWeek
  );

  const [reviewSections, setReviewSections] = useState<ReviewSection[]>([
    {
      id: 'reflect',
      title: 'Reflect on Your Week',
      icon: <NotebookPen size={18} />,
      description: "Review what went well and what you'd like to improve",
      prompts: [
        'What went well this week?',
        'What were your biggest accomplishments?',
        "What didn't go as planned?",
        'What would make next week better?',
        "Any patterns you're noticing in your productivity?",
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'reflect').length > 0,
      hasJournal: true,
    },
    {
      id: 'overdue',
      title: 'Review Overdue Tasks',
      icon: <Clock size={18} />,
      description: `You have ${overdueTasks.length} overdue tasks to review`,
      prompts: [
        'Do these tasks still need to be done?',
        'What prevented you from completing these?',
        'Can any of these be broken down into smaller steps?',
        'Should any of these be delegated or dropped?',
        'Which ones are actually urgent vs. just feeling urgent?',
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'overdue').length > 0,
      hasJournal: true,
    },
    {
      id: 'upcoming',
      title: 'Plan for the Week Ahead',
      icon: <Calendar size={18} />,
      description: 'Set yourself up for success next week',
      prompts: [
        'What are your top 3 priorities for next week?',
        'Any important deadlines or events coming up?',
        'Are there preparations you need to make?',
        'Any potential obstacles you should plan for?',
        'Is your calendar aligned with your priorities?',
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'upcoming').length > 0,
      hasJournal: true,
    },
    {
      id: 'projects',
      title: 'Review Current Projects',
      icon: <LayoutGrid size={18} />,
      description: `Check progress on your ${projects.length} projects`,
      prompts: [
        'Are all your projects moving forward?',
        'Are there projects that need more attention?',
        'Any projects missing next actions?',
        'Should any projects be put on hold?',
        'Are there any dependencies blocking progress?',
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'projects').length > 0,
      hasJournal: true,
    },
    {
      id: 'life-areas',
      title: 'Life Areas Check-In',
      icon: <ClipboardList size={18} />,
      description: 'Make sure nothing important is slipping through the cracks',
      prompts: [
        'Health: Any appointments, medications, or health habits to track?',
        'Relationships: Birthdays, special occasions, or people to connect with?',
        'Home: Any maintenance, cleaning, or household purchases needed?',
        'Personal growth: Progress on learning or hobbies?',
        'Finances: Bills to pay, budgets to review, financial decisions?',
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'life-areas').length > 0,
      hasJournal: true,
    },
  ]);

  // Remaining render logic would follow here, unmodified...

  return <div>/* Full render logic not included here for brevity */</div>;
};

export default WeeklyReviewSystem;

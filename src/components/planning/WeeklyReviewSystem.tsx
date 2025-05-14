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

  const handleAddTask = () => {
    if (taskInput.trim()) {
      quickAddTask(taskInput, { immediate: true });
      setTaskInput('');
      onTaskCreated?.();
    }
  };

  const handleAddJournalEntry = () => {
    if (journalInput.trim() && activeSectionId) {
      const existingEntry = currentPromptEntries[0];
      if (existingEntry) {
        updateJournalEntry(existingEntry.id, {
          content: journalInput,
          title: journalTitle || existingEntry.title,
        });
      } else {
        addJournalEntry({
          content: journalInput,
          section: activeSectionId,
          promptIndex: currentPromptIndex,
          weekNumber,
          weekYear,
          mood: currentMood,
          title: journalTitle || `${reviewSections.find(s => s.id === activeSectionId)?.title} - Week ${weekNumber}`,
        });
      }
      setJournalInput('');
      setJournalTitle('');
      setHasEnteredJournal(true);
    }
  };

  const handleCompleteReview = () => {
    updateLastWeeklyReviewDate();
    setReviewComplete(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Weekly Review
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Week {weekNumber} of {weekYear}
          </p>
        </div>
      </Card>

      {reviewComplete ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Weekly Review Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Great work on completing your weekly review.
            </p>
            <Button onClick={() => setReviewComplete(false)}>
              Review Again
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Review sections */}
          <div className="grid gap-4">
            {reviewSections.map((section) => (
              <Card
                key={section.id}
                onClick={() => {
                  setActiveSectionId(section.id);
                  setCurrentPromptIndex(0);
                  setHasEnteredJournal(false);
                }}
                className={`cursor-pointer transition-all ${
                  activeSectionId === section.id
                    ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${section.complete ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeSectionId === section.id
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.complete && (
                      <CheckCircle size={20} className="text-green-500" />
                    )}
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        activeSectionId === section.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Active section detail */}
          {activeSectionId && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {reviewSections.find((s) => s.id === activeSectionId)?.prompts[currentPromptIndex]}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Question {currentPromptIndex + 1} of{' '}
                    {reviewSections.find((s) => s.id === activeSectionId)?.prompts.length}
                  </div>
                </div>

                {/* Journal entry */}
                {reviewSections.find((s) => s.id === activeSectionId)?.hasJournal && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      placeholder="Entry title (optional)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <textarea
                      value={journalInput}
                      onChange={(e) => setJournalInput(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-300">
                        Current mood:
                      </label>
                      <select
                        value={currentMood}
                        onChange={(e) => setCurrentMood(e.target.value as any)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      >
                        <option value="great">Great 😄</option>
                        <option value="good">Good 🙂</option>
                        <option value="neutral">Neutral 😐</option>
                        <option value="challenging">Challenging 😕</option>
                        <option value="difficult">Difficult 😔</option>
                      </select>
                    </div>
                    <Button onClick={handleAddJournalEntry} disabled={!journalInput.trim()}>
                      Save Journal Entry
                    </Button>
                  </div>
                )}

                {/* Quick task capture */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Add any tasks that come to mind:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="New task..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <Button onClick={handleAddTask} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPromptIndex(Math.max(0, currentPromptIndex - 1))}
                    disabled={currentPromptIndex === 0}
                  >
                    Previous
                  </Button>
                  {currentPromptIndex === (reviewSections.find((s) => s.id === activeSectionId)?.prompts.length || 0) - 1 ? (
                    <Button onClick={() => setActiveSectionId(null)}>
                      Complete Section
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentPromptIndex(Math.min(
                        (reviewSections.find((s) => s.id === activeSectionId)?.prompts.length || 0) - 1,
                        currentPromptIndex + 1
                      ))}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Complete review button */}
          {reviewSections.every((section) => section.complete) && (
            <Card>
              <div className="text-center">
                <Button onClick={handleCompleteReview} size="lg">
                  Complete Weekly Review
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default WeeklyReviewSystem;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContextSupabase';
import { Task } from '../../../types';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { ImprovedTaskCard } from '../../tasks/ImprovedTaskCard';
import { formatDate, formatDateForDisplay } from '../../../utils/helpers';
import Modal from '../../common/Modal';
import { 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  ClipboardList, 
  Clock, 
  LayoutGrid, 
  NotebookPen, 
  Plus, 
  RefreshCw,
  AlertTriangle,
  X,
  Check,
  Brain
} from 'lucide-react';

interface WeeklyReviewSystemFixedProps {
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
  multipleChoiceOptions?: {
    [promptIndex: number]: {
      question: string;
      options: { value: string; label: string; emoji?: string }[];
      allowMultiple?: boolean;
    };
  };
};

interface OverdueTaskReview {
  taskId: string;
  reason: string;
  action: 'reschedule' | 'keep' | 'drop' | 'delegate' | 'breakdown';
  newDate?: string;
  notes?: string;
}

const WeeklyReviewSystemFixed: React.FC<WeeklyReviewSystemFixedProps> = ({ onTaskCreated }) => {
  const navigate = useNavigate();
  const {
    tasks,
    projects,
    categories,
    quickAddTask,
    updateTask,
    deleteTask,
    addJournalEntry,
    updateJournalEntry,
    getJournalEntriesForWeek,
    updateLastWeeklyReviewDate,
  } = useAppContext();

  const [taskInput, setTaskInput] = useState('');
  const [journalResponses, setJournalResponses] = useState<{[key: string]: string}>({});
  const [activeSectionId, setActiveSectionId] = useState<ReviewSection['id'] | null>(null);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [currentMood, setCurrentMood] = useState<'great' | 'good' | 'neutral' | 'challenging' | 'difficult'>('neutral');
  
  // Smooth flow state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showSmoothFlow, setShowSmoothFlow] = useState(false);
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<{[key: string]: string[]}>({});
  const [additionalNotes, setAdditionalNotes] = useState<{[key: string]: string}>({});
  
  // Overdue task review state
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [currentOverdueTaskIndex, setCurrentOverdueTaskIndex] = useState(0);
  const [overdueTaskReviews, setOverdueTaskReviews] = useState<OverdueTaskReview[]>([]);
  const [overdueReasons, setOverdueReasons] = useState<string[]>([]);
  const [overdueOtherReason, setOverdueOtherReason] = useState('');
  const [markComplete, setMarkComplete] = useState(false);
  const [overdueAction, setOverdueAction] = useState<'reschedule' | 'keep' | 'drop' | 'delegate' | 'breakdown'>('reschedule');
  const [overdueNewDate, setOverdueNewDate] = useState('');
  const [overdueNotes, setOverdueNotes] = useState('');

  // --- State for prompt chunking ---
  const PROMPTS_PER_CHUNK = 2;
  const [promptChunkIndex, setPromptChunkIndex] = useState(0);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('weeklyReviewDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Check if draft is less than 24 hours old
        const draftAge = Date.now() - new Date(parsed.timestamp).getTime();
        if (draftAge < 24 * 60 * 60 * 1000) {
          setJournalResponses(parsed.responses || {});
          // You can add a notification here if you want
        } else {
          // Clear old draft
          localStorage.removeItem('weeklyReviewDraft');
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Auto-save responses every 10 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (Object.keys(journalResponses).length > 0) {
        localStorage.setItem('weeklyReviewDraft', JSON.stringify({
          responses: journalResponses,
          section: activeSectionId,
          timestamp: new Date().toISOString()
        }));
      }
    }, 10000); // 10 seconds

    return () => clearInterval(saveInterval);
  }, [journalResponses, activeSectionId]);

  
  const breakdownOptions = [
    { value: 'reschedule', label: 'Reschedule it', icon: <Calendar size={18} /> },
    { value: 'keep', label: 'Keep it overdue', icon: <Clock size={18} /> },
    { value: 'breakdown', label: 'Break it down', icon: <Brain size={18} /> },
    { value: 'drop', label: 'Drop it', icon: <X size={18} /> },
    { value: 'delegate', label: 'Delegate it', icon: <Check size={18} /> },
  ];
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
  
  // Get dates for this week and next week
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  // Filter out subtasks from all task lists
  const mainTasks = tasks.filter(task => !task.parentTaskId);
  const incompleteTasks = mainTasks.filter(task => !task.completed && !task.archived);
  const tasksDueThisWeek = incompleteTasks.filter(task => 
    task.dueDate && 
    task.dueDate >= formatDate(today) && 
    task.dueDate <= formatDate(nextWeek)
  );
  
  const overdueTasks = incompleteTasks.filter(task => 
    task.dueDate && task.dueDate < formatDate(today)
  );
  
  // Get recently completed tasks (within last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  const recentlyCompleted = mainTasks.filter(task => 
    task.completed && 
    new Date(task.updatedAt) >= lastWeek
  );

  // Review sections with guided prompts and multiple choice options
  const [reviewSections, setReviewSections] = useState<ReviewSection[]>([
    {
      id: 'reflect',
      title: 'Reflect on Your Week',
      icon: <NotebookPen size={18} />,
      description: "Review what went well and what you'd like to improve",
      prompts: [],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'reflect').length > 0,
      hasJournal: true,
      multipleChoiceOptions: {
        0: {
          question: 'Pick 2-3 things you\'re genuinely glad you did',
          options: [
            { value: 'completed-hard', label: 'Completed something hard', emoji: '💪' },
            { value: 'good-energy', label: 'Had good energy', emoji: '⚡' },
            { value: 'helped-someone', label: 'Helped someone', emoji: '🤝' },
            { value: 'learned-something', label: 'Learned something', emoji: '🧠' }
          ],
          allowMultiple: true
        },
        1: {
          question: 'What got derailed?',
          options: [
            { value: 'energy-crash', label: 'Energy crash', emoji: '🪫' },
            { value: 'unexpected-stuff', label: 'Unexpected stuff came up', emoji: '🌊' },
            { value: 'lost-interest', label: 'Lost interest', emoji: '😴' },
            { value: 'got-overwhelmed', label: 'Got overwhelmed', emoji: '🌀' }
          ],
          allowMultiple: true
        },
        2: {
          question: 'When did you feel most focused?',
          options: [
            { value: 'early-morning', label: 'Early morning (before 9am)', emoji: '🌅' },
            { value: 'late-morning', label: 'Late morning (9am-12pm)', emoji: '☕' },
            { value: 'afternoon', label: 'Afternoon (12pm-5pm)', emoji: '☀️' },
            { value: 'evening', label: 'Evening (5pm-9pm)', emoji: '🌆' },
            { value: 'late-night', label: 'Late night (after 9pm)', emoji: '🌙' },
            { value: 'random', label: 'Random bursts', emoji: '⚡' }
          ],
          allowMultiple: true
        },
        3: {
          question: 'What time felt impossible?',
          options: [
            { value: 'wake-up', label: 'Right after waking up', emoji: '😴' },
            { value: 'mid-morning', label: 'Mid-morning crash', emoji: '🥱' },
            { value: 'post-lunch', label: 'After lunch (2-4pm)', emoji: '🍽️' },
            { value: 'end-of-day', label: 'End of workday', emoji: '🏃' },
            { value: 'bedtime', label: 'Bedtime wind-down', emoji: '🛏️' }
          ],
          allowMultiple: true
        }
      }
    },
    {
      id: 'overdue',
      title: 'Review Overdue Tasks',
      icon: <Clock size={18} />,
      description: `You have ${overdueTasks.length} overdue tasks to review`,
      prompts: [],
      complete: overdueTaskReviews.length === overdueTasks.length,
      hasJournal: true,
    },
    {
      id: 'upcoming',
      title: 'Plan for the Week Ahead',
      icon: <Calendar size={18} />,
      description: 'Set yourself up for success next week',
      prompts: [],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'upcoming').length > 0,
      hasJournal: true,
      multipleChoiceOptions: {
        0: {
          question: "Pick your top 3 priorities for next week",
          options: [
            { value: 'urgent-deadline', label: 'Urgent deadline', emoji: '🚨' },
            { value: 'important-project', label: 'Important project', emoji: '🎯' },
            { value: 'self-care', label: 'Self-care/health', emoji: '💚' },
            { value: 'social-connection', label: 'Social connection', emoji: '🤝' },
            { value: 'home-tasks', label: 'Home/life admin', emoji: '🏠' },
            { value: 'creative-work', label: 'Creative work', emoji: '🎨' }
          ],
          allowMultiple: true
        },
        1: {
          question: "What support do you need?",
          options: [
            { value: 'time-blocks', label: 'Protected time blocks', emoji: '⏰' },
            { value: 'body-doubling', label: 'Body doubling/accountability', emoji: '👥' },
            { value: 'breaks', label: 'More breaks built in', emoji: '🌿' },
            { value: 'lower-bar', label: 'Lower the bar for success', emoji: '📉' },
            { value: 'prep-work', label: 'Prep work done in advance', emoji: '📋' },
            { value: 'emotional-whiplash', label: 'Emotional whiplash from others', emoji: '😶' }
          ],
          allowMultiple: true
        },
        2: {
          question: 'What do you actually want to get out of next week?',
          options: [] // This will be free text only
        },
        3: {
          question: 'Any other planning thoughts?',
          options: [] // This will be free text only
        }
      }
    },
    {
      id: 'projects',
      title: 'Review Your Projects',
      icon: <LayoutGrid size={18} />,
      description: 'Check progress and priorities across projects',
      prompts: [],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'projects').length > 0,
      hasJournal: true,
      multipleChoiceOptions: {
        0: {
          question: 'Which projects are on track?',
          options: [] // This will be free text only
        },
        1: {
          question: 'Where are you stuck or blocked?',
          options: [] // This will be free text only
        },
        2: {
          question: 'Should any projects be paused or dropped?',
          options: [] // This will be free text only
        },
        3: {
          question: 'Are your projects aligned with your goals?',
          options: [
            { value: 'very-aligned', label: 'Very aligned', emoji: '🎯' },
            { value: 'mostly-aligned', label: 'Mostly aligned', emoji: '✅' },
            { value: 'somewhat-aligned', label: 'Somewhat aligned', emoji: '⚖️' },
            { value: 'not-aligned', label: 'Not really aligned', emoji: '❌' },
            { value: 'unclear', label: 'Unclear on goals', emoji: '🤔' }
          ]
        },
        4: {
          question: 'What project should be your main focus next week?',
          options: [] // This will be free text only
        }
      }
    },
    {
      id: 'life-areas',
      title: 'Life Areas Check-In',
      icon: <ClipboardList size={18} />,
      description: 'Balance across work, personal, health, etc.',
      prompts: [
        'How was your work-life balance this week?',
        'Did you make time for self-care?',
        'How were your energy levels?',
        'Any life areas that need more attention?',
        'What would you like to prioritize more next week?',
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'life-areas').length > 0,
      hasJournal: true,
      multipleChoiceOptions: {
        0: {
          question: 'How well did your reality match your priorities?',
          options: [
            { value: 'aligned', label: 'Pretty aligned', emoji: '🎯' },
            { value: 'good-intentions', label: 'Good intentions, little follow-through', emoji: '📉' },
            { value: 'reactive', label: 'Constant reactive mode', emoji: '🔄' },
            { value: 'scrambled', label: 'Totally scrambled', emoji: '🪢' }
          ]
        },
        1: {
          question: 'How were your energy patterns?',
          options: [
            { value: 'predictable', label: 'Predictable and manageable', emoji: '📈' },
            { value: 'all-over', label: 'All over the place', emoji: '🎢' },
            { value: 'hard-to-track', label: 'Hard to even notice or track', emoji: '🌫️' }
          ]
        },
        2: {
          question: 'Which areas are flagging and need some love next week?',
          options: [
            { value: 'movement', label: 'Movement (even low-impact)', emoji: '🚶‍♀️' },
            { value: 'rest', label: 'Reliable rest or sleep', emoji: '😴' },
            { value: 'food-stability', label: 'Food stability / protein intake', emoji: '🧃' },
            { value: 'breaks', label: 'Breaks from overstimulation', emoji: '📵' },
            { value: 'connection', label: 'Real connection with people', emoji: '🎭' },
            { value: 'intellectual', label: 'Intellectual engagement or creativity', emoji: '🧠' },
            { value: 'grounding', label: 'Grounding practices (e.g., micro-routines, check-ins)', emoji: '🪨' }
          ],
          allowMultiple: true
        },
        3: {
          question: 'What might help you not self-erase next week?',
          options: [] // This will be free text only
        },
        4: {
          question: 'Any other life balance thoughts?',
          options: [] // This will be free text only
        }
      }
    },
  ]);

  const handleJournalChange = (promptIndex: number, value: string) => {
    const key = `${activeSectionId}-${promptIndex}`;
    setJournalResponses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddTask = () => {
    if (taskInput.trim()) {
      const newTask = quickAddTask(taskInput);
      setTaskInput('');
      if (onTaskCreated) onTaskCreated();
    }
  };

  const handleSaveJournalEntries = () => {
    if (!activeSectionId) return;
    
    const activeSection = reviewSections.find(s => s.id === activeSectionId);
    if (!activeSection) return;
    
    // Save responses
    if (activeSection.multipleChoiceOptions) {
      Object.entries(activeSection.multipleChoiceOptions).forEach(([questionIndex, questionData]) => {
        const questionKey = `${activeSectionId}-mc-${questionIndex}`;
        
        // Handle multiple choice questions
        if (questionData.options.length > 0) {
          const values = multipleChoiceAnswers[questionKey];
          if (values && values.length > 0) {
            const selectedLabels = values.map(value => 
              questionData.options.find(opt => opt.value === value)?.label || value
            );
            
            const entryData = {
              title: questionData.question,
              content: selectedLabels.join(', '),
              date: new Date().toISOString(),
              section: activeSectionId as 'projects' | 'reflect' | 'overdue' | 'upcoming' | 'life-areas',
              prompt: questionData.question,
              promptIndex: parseInt(questionIndex),
              weekNumber,
              weekYear,
              mood: currentMood,
              tags: ['weekly-review', activeSectionId, 'multiple-choice']
            };
            
            addJournalEntry(entryData);
          }
        } else {
          // Handle free text questions
          const textResponse = additionalNotes[questionKey];
          if (textResponse && textResponse.trim()) {
            const entryData = {
              title: questionData.question,
              content: textResponse,
              date: new Date().toISOString(),
              section: activeSectionId as 'projects' | 'reflect' | 'overdue' | 'upcoming' | 'life-areas',
              prompt: questionData.question,
              promptIndex: parseInt(questionIndex),
              weekNumber,
              weekYear,
              mood: currentMood,
              tags: ['weekly-review', activeSectionId, 'free-text']
            };
            
            addJournalEntry(entryData);
          }
        }
      });
    }
    
    // Mark section as complete
    setReviewSections(prev => 
      prev.map(section => 
        section.id === activeSectionId
          ? { ...section, complete: true }
          : section
      )
    );
    
    // Reset form and close section
    setActiveSectionId(null);
    setPromptChunkIndex(0);
  };

  const handleCompleteReview = () => {
    updateLastWeeklyReviewDate();
    setReviewComplete(true);
  };

  // Overdue task review modal handlers
  const startOverdueReview = () => {
    if (overdueTasks.length > 0) {
      setCurrentOverdueTaskIndex(0);
      setShowOverdueModal(true);
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setOverdueNewDate(formatDate(tomorrow));
    }
  };

  const handleOverdueSubmit = () => {
    const currentTask = overdueTasks[currentOverdueTaskIndex];
    if (!currentTask) return;

    // Save the review
    const review: OverdueTaskReview = {
      taskId: currentTask.id,
      reason: overdueReasons.join(', ') + (overdueReasons.includes('Other') && overdueOtherReason ? `: ${overdueOtherReason}` : ''),
      action: overdueAction,
      newDate: overdueNewDate,
      notes: overdueNotes,
    };

    setOverdueTaskReviews(prev => [...prev, review]);

    // Apply the action
    if (markComplete) {
      // If marking as complete, just complete it and ignore other actions
      updateTask({ ...currentTask, completed: true });
    } else {
      // Otherwise, apply the selected action
      switch (overdueAction) {
        case 'reschedule':
          updateTask({
            ...currentTask,
            dueDate: overdueNewDate || null,
          });
          break;
        case 'breakdown':
          updateTask({
            ...currentTask,
            tags: [...(currentTask.tags || []), 'needs-breakdown'],
          });
          break;
        case 'drop':
          deleteTask(currentTask.id);
          break;
        case 'delegate':
          updateTask({
            ...currentTask,
            tags: [...(currentTask.tags || []), 'delegated'],
          });
          break;
        case 'keep':
          // No action needed, keep as overdue
          break;
      }
    }

    // Save journal entry about this review
    addJournalEntry({
      title: `Overdue task review: ${currentTask.title}`,
      content: `Reason: ${review.reason}\nAction: ${overdueAction}\nNotes: ${overdueNotes}`,
      date: new Date().toISOString(),
      section: 'overdue',
      weekNumber,
      weekYear,
      tags: ['weekly-review', 'overdue-review'],
    });

    // Move to next task or close modal
    if (currentOverdueTaskIndex < overdueTasks.length - 1) {
      setCurrentOverdueTaskIndex(prev => prev + 1);
      setOverdueReasons([]);
      setOverdueOtherReason('');
      setMarkComplete(false);
      setOverdueAction('reschedule');
      setOverdueNotes('');
      // Reset default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setOverdueNewDate(formatDate(tomorrow));
    } else {
      // All tasks reviewed
      setShowOverdueModal(false);
      setReviewSections(prev => 
        prev.map(section => 
          section.id === 'overdue'
            ? { ...section, complete: true }
            : section
        )
      );
    }
  };

  const currentOverdueTask = overdueTasks[currentOverdueTaskIndex];

  const openReviewModal = (sectionId: string) => {
    if (sectionId === 'overdue' && overdueTasks.length > 0) {
      startOverdueReview();
    } else {
      setActiveSectionId(sectionId);
    }
  };
  const activeSection = reviewSections.find(s => s.id === activeSectionId);
  
  return (
    <div className="space-y-6">
      {!reviewComplete ? (
        <>
          {/* Progress indicator */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Review Progress</h3>
              <span className="text-sm text-gray-600">
                {reviewSections.filter(s => s.complete).length} of {reviewSections.length} sections
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(reviewSections.filter(s => s.complete).length / reviewSections.length) * 100}%` }}
              />
            </div>
          </div>
          {/* Quick task capture always visible */}
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="text-amber-600" size={20} />
                <h3 className="text-lg font-semibold text-amber-900">Quick Capture</h3>
              </div>
              <p className="text-sm text-amber-700">Add tasks as they come to mind during your review</p>
              <div className="flex">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  className="flex-1 rounded-l-md bg-white border-amber-300 text-amber-900 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  placeholder="Add a task..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTask();
                    }
                  }}
                />
                <Button
                  className="rounded-l-none bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                  onClick={handleAddTask}
                  icon={<Plus size={16} />}
                >
                  Add
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Smooth Flow Toggle */}
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowSmoothFlow(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Start Guided Review 🎯
            </Button>
            <p className="text-sm text-gray-600 mt-2">Or click individual sections below for traditional review</p>
          </div>

          {/* Section list */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">Review Sections</h2>
            {reviewSections.map((section, index) => (
              <Card 
                key={section.id}
                className={`cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                  section.complete 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400' 
                    : 'bg-white border-amber-300 hover:border-amber-400'
                }`}
                onClick={() => {
                  openReviewModal(section.id);
                }}
              >
                <div className="flex items-center justify-between p-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12">
                      <div className={`p-3 rounded-full ${
                        section.complete 
                          ? 'bg-green-500 text-white' 
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {section.complete ? <CheckCircle size={24} /> : section.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {section.description}
                      </p>
                      {!section.complete && (
                        <p className="text-xs text-amber-600 mt-2">
                          {section.prompts.length} reflection prompts
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {section.complete ? (
                      <span className="text-sm text-green-600 font-medium mr-2">Complete</span>
                    ) : (
                      <ChevronRight size={24} className="text-amber-500" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Complete review button */}
          {reviewSections.every(s => s.complete) && (
            <div className="flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCompleteReview}
                icon={<RefreshCw size={20} />}
              >
                Complete Weekly Review
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-green-500 rounded-full shadow-lg">
              <CheckCircle size={48} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Weekly Review Complete! 🎉
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-md mx-auto">
            Excellent work! You've reflected on your progress and set yourself up for a productive week ahead.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/tasks')}
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              View Tasks
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/planner')}
              className="bg-green-500 hover:bg-green-600"
            >
              Go to Planner
            </Button>
          </div>
        </Card>
      )}
      
      {/* Active section modal for regular sections */}
      {activeSection && activeSectionId !== 'overdue' && (
        <Modal
          isOpen={!!activeSectionId}
          onClose={() => { setActiveSectionId(null); setPromptChunkIndex(0); }}
          title={activeSection.title}
          size="lg"
        >
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-600">💡</span>
                  {activeSection.description}
                </p>
                <span className="text-xs text-amber-700">
                  {promptChunkIndex + 1} of {Math.ceil((activeSection.multipleChoiceOptions ? Object.keys(activeSection.multipleChoiceOptions).length : 0) / PROMPTS_PER_CHUNK)} • ~{Math.ceil(((activeSection.multipleChoiceOptions ? Object.keys(activeSection.multipleChoiceOptions).length : 0) - promptChunkIndex * PROMPTS_PER_CHUNK) * 0.5)} min left
                </span>
              </div>
              <div className="text-center text-sm font-medium text-amber-800">
                {promptChunkIndex < Math.ceil((activeSection.multipleChoiceOptions ? Object.keys(activeSection.multipleChoiceOptions).length : 0) / PROMPTS_PER_CHUNK) - 1 
                  ? "You're doing great! 🎯" 
                  : "Almost done! 🎉"}
              </div>
            </div>
            
            {/* Questions */}
            <div className="space-y-6">
              {activeSection.multipleChoiceOptions && Object.entries(activeSection.multipleChoiceOptions)
                .slice(promptChunkIndex * PROMPTS_PER_CHUNK, (promptChunkIndex + 1) * PROMPTS_PER_CHUNK)
                .map(([index, questionData]) => {
                  const questionKey = `${activeSectionId}-mc-${index}`;
                  const selectedValues = multipleChoiceAnswers[questionKey] || [];
                  
                  return (
                    <div key={questionKey} className="space-y-3">
                      <h4 className="font-medium text-gray-900">{questionData.question}</h4>
                      
                      {/* If there are options, show multiple choice */}
                      {questionData.options.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {questionData.options.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                if (questionData.allowMultiple) {
                                  setMultipleChoiceAnswers(prev => ({
                                    ...prev,
                                    [questionKey]: selectedValues.includes(option.value)
                                      ? selectedValues.filter(v => v !== option.value)
                                      : [...selectedValues, option.value]
                                  }));
                                } else {
                                  setMultipleChoiceAnswers(prev => ({
                                    ...prev,
                                    [questionKey]: [option.value]
                                  }));
                                }
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                                selectedValues.includes(option.value)
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-xl">{option.emoji}</span>
                              <span className="font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        /* If no options, show text area for free text */
                        <textarea
                          value={additionalNotes[questionKey] || ''}
                          onChange={(e) => setAdditionalNotes(prev => ({
                            ...prev,
                            [questionKey]: e.target.value
                          }))}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          rows={3}
                          placeholder="Share your thoughts..."
                        />
                      )}
                    </div>
                  );
                })}
            </div>
            {/* Navigation for prompt chunks */}
            <div className="flex justify-between pt-3 border-t border-amber-200">
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (promptChunkIndex > 0) setPromptChunkIndex(promptChunkIndex - 1);
                    else setActiveSectionId(null);
                  }}
                >
                  {promptChunkIndex > 0 ? 'Back' : 'Back to Review'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    // Skip current prompts
                    const totalQuestions = activeSection.multipleChoiceOptions ? Object.keys(activeSection.multipleChoiceOptions).length : 0;
                    if (((promptChunkIndex + 1) * PROMPTS_PER_CHUNK) < totalQuestions) {
                      setPromptChunkIndex(promptChunkIndex + 1);
                    } else {
                      handleSaveJournalEntries();
                      setPromptChunkIndex(0);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip these questions
                </Button>
              </div>
              {activeSection.multipleChoiceOptions && ((promptChunkIndex + 1) * PROMPTS_PER_CHUNK) < Object.keys(activeSection.multipleChoiceOptions).length ? (
                <Button 
                  onClick={() => setPromptChunkIndex(promptChunkIndex + 1)}
                  variant="primary"
                >
                  Next
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Save as draft
                      localStorage.setItem('weeklyReviewDraft', JSON.stringify({
                        responses: journalResponses,
                        section: activeSectionId,
                        timestamp: new Date().toISOString()
                      }));
                      setActiveSectionId(null);
                    }}
                  >
                    Save draft & finish later
                  </Button>
                  <Button 
                    onClick={() => {
                      handleSaveJournalEntries();
                      setPromptChunkIndex(0);
                    }}
                    variant="primary"
                  >
                    Save & Continue
                  </Button>
                </div>
              )}
            </div>
            
            {/* Relevant task lists based on the section */}
            {activeSectionId === 'upcoming' && tasksDueThisWeek.length > 0 && (
              <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                <h4 className="font-medium text-base text-amber-900 mb-2">Tasks Due This Week:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tasksDueThisWeek.slice(0, 5).map(task => (
                    <ImprovedTaskCard
                      key={task.id}
                      task={task}
                      projects={projects}
                      categories={categories}
                    />
                  ))}
                  {tasksDueThisWeek.length > 5 && (
                    <p className="text-center text-xs text-amber-700 pt-2">
                      + {tasksDueThisWeek.length - 5} more tasks this week
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {activeSectionId === 'projects' && projects.length > 0 && (
              <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                <h4 className="font-medium text-base text-amber-900 mb-2">Your Projects:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {projects.map(project => {
                    const projectTasks = incompleteTasks.filter(t => t.projectId === project.id);
                    return (
                      <div key={project.id} className="p-3 rounded-lg bg-gray-700/40 border border-gray-600/50">
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: project.color }}
                          ></div>
                          <h5 className="font-medium text-base text-amber-900">{project.name}</h5>
                          <span className="ml-auto text-xs text-amber-700">
                            {projectTasks.length} tasks
                          </span>
                        </div>
                        {projectTasks.length === 0 && (
                          <p className="text-xs text-amber-700 italic">No active tasks in this project</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeSectionId === 'reflect' && recentlyCompleted.length > 0 && (
              <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                <h4 className="font-medium text-base text-amber-900 mb-2">Recently Completed:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentlyCompleted.slice(0, 5).map(task => (
                    <ImprovedTaskCard
                      key={task.id}
                      task={task}
                      projects={projects}
                      categories={categories}
                    />
                  ))}
                  {recentlyCompleted.length > 5 && (
                    <p className="text-center text-xs text-amber-700 pt-2">
                      + {recentlyCompleted.length - 5} more completed tasks
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Journal entries for this section */}
            {activeSection && activeSection.hasJournal && weeklyJournalEntries.filter(entry => entry.section === activeSectionId).length > 0 && (
              <div className="border rounded-lg p-3 bg-amber-50 border-amber-200 mt-4">
                <h4 className="font-medium text-base text-amber-900 mb-2">Previous Reflections:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {weeklyJournalEntries
                    .filter(entry => entry.section === activeSectionId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map(entry => (
                      <div key={entry.id} className="p-2 bg-amber-100 rounded border border-amber-200 text-xs">
                        <div className="font-medium text-amber-900">{entry.title}</div>
                        <div className="text-amber-700 text-xs">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                        <div className="text-amber-800 mt-1">{entry.content}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Overdue Task Review Modal */}
      <Modal
        isOpen={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        title="Review Overdue Tasks"
        size="lg"
      >
        {currentOverdueTask && (
          <div className="space-y-6">
            {/* Progress indicator for overdue tasks */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">
                  Task {currentOverdueTaskIndex + 1} of {overdueTasks.length}
                </span>
                <span className="text-xs text-blue-600">
                  {overdueTasks.length - currentOverdueTaskIndex - 1} more to review
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{currentOverdueTask.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-orange-700">
                    <Calendar size={16} />
                    <span>Was due: {formatDateForDisplay(currentOverdueTask.dueDate!)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Why didn't this get done?
                </h4>
                <div className="space-y-2">
                  {[
                    { value: 'Forgot', emoji: '🤔' },
                    { value: 'Too busy', emoji: '⏰' },
                    { value: 'Task was unclear', emoji: '❓' },
                    { value: 'Lost motivation', emoji: '💔' },
                    { value: 'Waiting on someone', emoji: '👥' },
                    { value: 'Other', emoji: '📝' }
                  ].map(({ value: reason, emoji }) => (
                    <label key={reason} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overdueReasons.includes(reason)}
                        onChange={e => {
                          if (e.target.checked) {
                            setOverdueReasons([...overdueReasons, reason]);
                          } else {
                            setOverdueReasons(overdueReasons.filter(r => r !== reason));
                          }
                        }}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">
                        <span className="mr-2">{emoji}</span>
                        {reason}
                      </span>
                    </label>
                  ))}
                  {overdueReasons.includes('Other') && (
                    <input
                      type="text"
                      value={overdueOtherReason}
                      onChange={e => setOverdueOtherReason(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ml-7"
                      placeholder="Please specify..."
                    />
                  )}
                </div>
              </div>

              <div className={markComplete ? 'opacity-40 pointer-events-none' : ''}>
                <h4 className="font-medium text-gray-900 mb-3">
                  What should we do with this task?
                </h4>
                <div className="space-y-2">
                {breakdownOptions.map(option => (
                    <label key={option.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      overdueAction === option.value && !markComplete
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        value={option.value}
                        checked={overdueAction === option.value}
                        onChange={(e) => setOverdueAction(e.target.value as typeof overdueAction)}
                        disabled={markComplete}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 disabled:opacity-50"
                      />
                      <div className="flex items-center gap-2">
                        <span className={overdueAction === option.value && !markComplete ? 'text-amber-600' : 'text-gray-500'}>
                          {option.icon}
                        </span>
                        <span className={`text-gray-700 ${markComplete ? 'line-through' : ''}`}>{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {overdueAction === 'reschedule' && !markComplete && (
                <div>
                  <label className="block text-xs font-medium text-amber-900 mb-2">
                    New due date
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={overdueNewDate}
                      onChange={(e) => setOverdueNewDate(e.target.value)}
                      className="block w-full rounded-md bg-amber-50 border-amber-200 text-amber-900 placeholder-amber-700 shadow-sm focus:ring-amber-400 focus:border-amber-400 sm:text-xs"
                    />
                    <div className="flex flex-row gap-2 mt-1">
                      <Button size="sm" variant="secondary" className="rounded-full px-4 py-1 text-amber-900 bg-amber-100 border border-amber-200 hover:bg-amber-200" onClick={() => setOverdueNewDate(formatDate(new Date(Date.now() + 24*60*60*1000)))}>Tomorrow</Button>
                      <Button size="sm" variant="secondary" className="rounded-full px-4 py-1 text-amber-900 bg-amber-100 border border-amber-200 hover:bg-amber-200" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 7); setOverdueNewDate(formatDate(d));
                      }}>Next Week</Button>
                      <Button size="sm" variant="outline" className="rounded-full px-4 py-1 text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => setOverdueNewDate('')}>Remove Due Date</Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-green-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markComplete}
                    onChange={e => {
                      setMarkComplete(e.target.checked);
                      // If marking as complete, disable other actions visually
                      if (e.target.checked) {
                        setOverdueAction('keep');
                      }
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300 rounded"
                  />
                  <span>✓ Actually completed - just forgot to check it off</span>
                </label>
                {markComplete && (
                  <p className="text-xs text-green-700 mt-1 ml-6">
                    Great! This task will be marked as complete.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-900 mb-2">
                  Any additional notes?
                </label>
                <textarea
                  value={overdueNotes}
                  onChange={(e) => setOverdueNotes(e.target.value)}
                  className="w-full rounded-md bg-amber-50 border-amber-200 text-amber-900 placeholder-amber-700 shadow-sm focus:border-amber-400 focus:ring-amber-400"
                  rows={1}
                  placeholder="Optional: Add any context or next steps..."
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-xs text-amber-700">
                Task {currentOverdueTaskIndex + 1} of {overdueTasks.length}
              </span>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowOverdueModal(false)}
                >
                  Cancel Review
                </Button>
                <Button
                  variant="primary"
                  onClick={handleOverdueSubmit}
                >
                  {currentOverdueTaskIndex < overdueTasks.length - 1 ? 'Next Task' : 'Complete Review'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Smooth Flow Modal */}
      {showSmoothFlow && (
        <Modal
          isOpen={showSmoothFlow}
          onClose={() => {
            setShowSmoothFlow(false);
            setCurrentSectionIndex(0);
          }}
          title="Weekly Review"
          size="lg"
        >
          <div className="space-y-6">
            {/* Progress within sections */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {reviewSections[currentSectionIndex].icon}
                <h3 className="text-lg font-semibold text-gray-900">
                  {reviewSections[currentSectionIndex].title}
                </h3>
              </div>
              <div className="text-sm text-gray-600">
                Section {currentSectionIndex + 1} of {reviewSections.length}
              </div>
            </div>
            
            {/* Special handling for overdue tasks section */}
            {reviewSections[currentSectionIndex].id === 'overdue' && overdueTasks.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-700">
                  You have {overdueTasks.length} overdue tasks. Let's review them quickly.
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowSmoothFlow(false);
                    startOverdueReview();
                  }}
                  className="w-full"
                >
                  Review Overdue Tasks ({overdueTasks.length})
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Mark all overdue tasks as "cold" - add a tag
                    overdueTasks.forEach(task => {
                      updateTask({
                        ...task,
                        tags: [...(task.tags || []), 'cold'],
                        dueDate: null // Remove due date to stop them being overdue
                      });
                    });
                    // Mark section complete and move to next
                    setReviewSections(prev => 
                      prev.map(section => 
                        section.id === 'overdue'
                          ? { ...section, complete: true }
                          : section
                      )
                    );
                    if (currentSectionIndex < reviewSections.length - 1) {
                      setCurrentSectionIndex(currentSectionIndex + 1);
                    } else {
                      setShowSmoothFlow(false);
                      handleCompleteReview();
                    }
                  }}
                  className="w-full"
                  icon={<span>🧊</span>}
                >
                  "Mark Cold" - not committing to these right now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Mark section complete and move to next
                    setReviewSections(prev => 
                      prev.map(section => 
                        section.id === 'overdue'
                          ? { ...section, complete: true }
                          : section
                      )
                    );
                    if (currentSectionIndex < reviewSections.length - 1) {
                      setCurrentSectionIndex(currentSectionIndex + 1);
                    } else {
                      setShowSmoothFlow(false);
                      handleCompleteReview();
                    }
                  }}
                  className="w-full"
                >
                  Skip for Now
                </Button>
              </div>
            ) : reviewSections[currentSectionIndex].id === 'overdue' ? (
              <div className="text-center py-8">
                <div className="text-green-600 mb-4">
                  <CheckCircle size={48} className="mx-auto" />
                </div>
                <p className="text-lg text-gray-700">No overdue tasks! 🎉</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setReviewSections(prev => 
                      prev.map(section => 
                        section.id === 'overdue'
                          ? { ...section, complete: true }
                          : section
                      )
                    );
                    if (currentSectionIndex < reviewSections.length - 1) {
                      setCurrentSectionIndex(currentSectionIndex + 1);
                    } else {
                      setShowSmoothFlow(false);
                      handleCompleteReview();
                    }
                  }}
                  className="mt-4"
                >
                  Continue
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Questions for this section */}
                {reviewSections[currentSectionIndex].multipleChoiceOptions && 
                  Object.entries(reviewSections[currentSectionIndex].multipleChoiceOptions!).map(([promptIndex, mcOption]) => (
                    <div key={promptIndex} className="space-y-3">
                      <h4 className="font-medium text-gray-900">{mcOption.question}</h4>
                      
                      {/* If there are options, show multiple choice */}
                      {mcOption.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mcOption.options.map(option => {
                            const isSelected = mcOption.allowMultiple
                              ? multipleChoiceAnswers[`${reviewSections[currentSectionIndex].id}-${promptIndex}`]?.includes(option.value)
                              : multipleChoiceAnswers[`${reviewSections[currentSectionIndex].id}-${promptIndex}`]?.[0] === option.value;
                            
                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  const key = `${reviewSections[currentSectionIndex].id}-${promptIndex}`;
                                  if (mcOption.allowMultiple) {
                                    const current = multipleChoiceAnswers[key] || [];
                                    if (current.includes(option.value)) {
                                      setMultipleChoiceAnswers({
                                        ...multipleChoiceAnswers,
                                        [key]: current.filter(v => v !== option.value)
                                      });
                                    } else {
                                      setMultipleChoiceAnswers({
                                        ...multipleChoiceAnswers,
                                        [key]: [...current, option.value]
                                      });
                                    }
                                  } else {
                                    setMultipleChoiceAnswers({
                                      ...multipleChoiceAnswers,
                                      [key]: [option.value]
                                    });
                                  }
                                }}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  isSelected
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {option.emoji && <span className="text-xl">{option.emoji}</span>}
                                  <span className="text-gray-700">{option.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* If no options, show text area for free text */
                        <textarea
                          value={additionalNotes[`${reviewSections[currentSectionIndex].id}-${promptIndex}`] || ''}
                          onChange={(e) => setAdditionalNotes({
                            ...additionalNotes,
                            [`${reviewSections[currentSectionIndex].id}-${promptIndex}`]: e.target.value
                          })}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          rows={3}
                          placeholder="Share your thoughts..."
                        />
                      )}
                    </div>
                  ))
                }
                
                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentSectionIndex > 0) {
                        setCurrentSectionIndex(currentSectionIndex - 1);
                      } else {
                        setShowSmoothFlow(false);
                      }
                    }}
                  >
                    {currentSectionIndex > 0 ? 'Previous' : 'Exit'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Save responses for this section
                      const section = reviewSections[currentSectionIndex];
                      
                      // Save responses as journal entries
                      if (section.multipleChoiceOptions) {
                        Object.entries(section.multipleChoiceOptions).forEach(([promptIndex, mcOption]) => {
                          const key = `${section.id}-${promptIndex}`;
                          
                          // Handle multiple choice questions
                          if (mcOption.options.length > 0) {
                            const answers = multipleChoiceAnswers[key];
                            if (answers && answers.length > 0) {
                              const selectedLabels = answers.map(value => 
                                mcOption.options.find(opt => opt.value === value)?.label
                              ).filter(Boolean).join(', ');
                              
                              addJournalEntry({
                                title: mcOption.question,
                                content: selectedLabels,
                                date: new Date().toISOString(),
                                section: section.id as any,
                                prompt: mcOption.question,
                                promptIndex: parseInt(promptIndex),
                                weekNumber,
                                weekYear,
                                mood: currentMood,
                                tags: ['weekly-review', section.id, 'multiple-choice']
                              });
                            }
                          } else {
                            // Handle free text questions
                            const textResponse = additionalNotes[key];
                            if (textResponse && textResponse.trim()) {
                              addJournalEntry({
                                title: mcOption.question,
                                content: textResponse,
                                date: new Date().toISOString(),
                                section: section.id as any,
                                prompt: mcOption.question,
                                promptIndex: parseInt(promptIndex),
                                weekNumber,
                                weekYear,
                                mood: currentMood,
                                tags: ['weekly-review', section.id, 'free-text']
                              });
                            }
                          }
                        });
                      }
                      
                      // Mark section complete
                      setReviewSections(prev => 
                        prev.map(s => 
                          s.id === section.id
                            ? { ...s, complete: true }
                            : s
                        )
                      );
                      
                      // Move to next section or complete
                      if (currentSectionIndex < reviewSections.length - 1) {
                        setCurrentSectionIndex(currentSectionIndex + 1);
                      } else {
                        setShowSmoothFlow(false);
                        handleCompleteReview();
                      }
                    }}
                  >
                    {currentSectionIndex < reviewSections.length - 1 ? 'Next Section' : 'Complete Review'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WeeklyReviewSystemFixed;
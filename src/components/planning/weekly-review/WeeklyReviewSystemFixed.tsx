import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
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
      prompts: [
        'What went well this week?',
        'What were your biggest accomplishments?',
        "What didn't go as planned?",
        'What would make next week better?',
        "Any patterns you're noticing in your productivity?",
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'reflect').length > 0,
      hasJournal: true,
      multipleChoiceOptions: {
        0: {
          question: 'How would you rate this week overall?',
          options: [
            { value: 'excellent', label: 'Excellent week!', emoji: '🌟' },
            { value: 'good', label: 'Pretty good', emoji: '😊' },
            { value: 'okay', label: 'It was okay', emoji: '😐' },
            { value: 'challenging', label: 'Challenging', emoji: '😅' },
            { value: 'difficult', label: 'Really tough', emoji: '😔' }
          ]
        },
        1: {
          question: 'What areas saw the most progress?',
          options: [
            { value: 'work', label: 'Work/Career', emoji: '💼' },
            { value: 'personal', label: 'Personal Projects', emoji: '🎯' },
            { value: 'health', label: 'Health & Fitness', emoji: '💪' },
            { value: 'relationships', label: 'Relationships', emoji: '❤️' },
            { value: 'learning', label: 'Learning & Growth', emoji: '📚' },
            { value: 'home', label: 'Home & Organization', emoji: '🏠' }
          ],
          allowMultiple: true
        },
        2: {
          question: 'What got in the way this week?',
          options: [
            { value: 'distractions', label: 'Too many distractions', emoji: '📱' },
            { value: 'overcommitted', label: 'Overcommitted myself', emoji: '😵' },
            { value: 'energy', label: 'Low energy/motivation', emoji: '🔋' },
            { value: 'unclear', label: 'Unclear priorities', emoji: '🤷' },
            { value: 'unexpected', label: 'Unexpected events', emoji: '🎲' },
            { value: 'procrastination', label: 'Procrastination', emoji: '⏰' }
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
      prompts: [
        'Do these tasks still need to be done?',
        'What prevented you from completing these?',
        'Can any of these be broken down into smaller steps?',
        'Should any of these be delegated or dropped?',
        'Which ones are actually urgent vs. just feeling urgent?',
      ],
      complete: overdueTaskReviews.length === overdueTasks.length,
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
      multipleChoiceOptions: {
        0: {
          question: 'How full is your calendar looking?',
          options: [
            { value: 'light', label: 'Pretty light', emoji: '🍃' },
            { value: 'balanced', label: 'Well balanced', emoji: '⚖️' },
            { value: 'busy', label: 'Quite busy', emoji: '📅' },
            { value: 'packed', label: 'Completely packed', emoji: '🚨' }
          ]
        },
        3: {
          question: 'What challenges might come up?',
          options: [
            { value: 'time', label: 'Time constraints', emoji: '⏱️' },
            { value: 'energy', label: 'Energy management', emoji: '🔋' },
            { value: 'focus', label: 'Staying focused', emoji: '🎯' },
            { value: 'meetings', label: 'Too many meetings', emoji: '🗣️' },
            { value: 'deadlines', label: 'Competing deadlines', emoji: '📆' },
            { value: 'unexpected', label: 'Unexpected requests', emoji: '🔔' }
          ],
          allowMultiple: true
        }
      }
    },
    {
      id: 'projects',
      title: 'Review Your Projects',
      icon: <LayoutGrid size={18} />,
      description: 'Check progress and priorities across projects',
      prompts: [
        'Which projects are on track?',
        'Where are you stuck or blocked?',
        'Should any projects be paused or dropped?',
        'Are your projects aligned with your goals?',
        'What project should be your main focus next week?',
      ],
      complete: weeklyJournalEntries.filter((entry) => entry.section === 'projects').length > 0,
      hasJournal: true,
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
          question: 'How was your work-life balance?',
          options: [
            { value: 'great', label: 'Well balanced', emoji: '⚖️' },
            { value: 'work-heavy', label: 'Too much work', emoji: '💼' },
            { value: 'personal-heavy', label: 'Neglected work', emoji: '🏠' },
            { value: 'chaotic', label: 'All over the place', emoji: '🎪' }
          ]
        },
        2: {
          question: 'How were your energy levels?',
          options: [
            { value: 'high', label: 'High energy', emoji: '⚡' },
            { value: 'good', label: 'Pretty good', emoji: '👍' },
            { value: 'variable', label: 'Up and down', emoji: '🎢' },
            { value: 'low', label: 'Low energy', emoji: '🔋' }
          ]
        },
        3: {
          question: 'Which areas need more attention?',
          options: [
            { value: 'exercise', label: 'Exercise', emoji: '🏃' },
            { value: 'sleep', label: 'Sleep', emoji: '😴' },
            { value: 'nutrition', label: 'Nutrition', emoji: '🥗' },
            { value: 'social', label: 'Social time', emoji: '👥' },
            { value: 'hobbies', label: 'Hobbies', emoji: '🎨' },
            { value: 'rest', label: 'Rest & relaxation', emoji: '🧘' }
          ],
          allowMultiple: true
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
    
    // Save each journal response as a separate entry
    const activeSection = reviewSections.find(s => s.id === activeSectionId);
    if (!activeSection) return;
    
    const savedEntries: string[] = [];
    
    activeSection.prompts.forEach((prompt, index) => {
      const key = `${activeSectionId}-${index}`;
      const response = journalResponses[key];
      
      if (response && response.trim()) {
        const entryData = {
          title: prompt,
          content: response,
          date: new Date().toISOString(),
          section: activeSectionId as 'projects' | 'reflect' | 'overdue' | 'upcoming' | 'life-areas',
          prompt: prompt,
          promptIndex: index,
          weekNumber,
          weekYear,
          mood: currentMood,
          tags: ['weekly-review', activeSectionId]
        };
        
        const entry = addJournalEntry(entryData);
        savedEntries.push(entry.id);
      }
    });
    
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
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 flex items-start gap-2">
                <span className="text-amber-600">💡</span>
                {activeSection.description}
              </p>
            </div>
            
            {/* Prompts in chunks */}
            <div className="space-y-6">
              {activeSection.prompts
                .slice(promptChunkIndex * PROMPTS_PER_CHUNK, (promptChunkIndex + 1) * PROMPTS_PER_CHUNK)
                .map((prompt, index) => {
                  const globalIndex = promptChunkIndex * PROMPTS_PER_CHUNK + index;
                  return (
                    <div key={`${activeSectionId}-${globalIndex}`} className="space-y-2">
                      <label className="block font-medium text-gray-900">
                        {prompt}
                      </label>
                      <textarea
                        value={journalResponses[`${activeSectionId}-${globalIndex}`] || ''}
                        onChange={(e) => handleJournalChange(globalIndex, e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-gray-900"
                        rows={4}
                        placeholder="Share your thoughts..."
                      />
                    </div>
                  );
                })}
            </div>
            {/* Navigation for prompt chunks */}
            <div className="flex justify-between pt-3 border-t border-amber-200">
              <Button 
                variant="outline"
                onClick={() => {
                  if (promptChunkIndex > 0) setPromptChunkIndex(promptChunkIndex - 1);
                  else setActiveSectionId(null);
                }}
              >
                {promptChunkIndex > 0 ? 'Back' : 'Back to Review'}
              </Button>
              {((promptChunkIndex + 1) * PROMPTS_PER_CHUNK) < activeSection.prompts.length ? (
                <Button 
                  onClick={() => setPromptChunkIndex(promptChunkIndex + 1)}
                  variant="primary"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    handleSaveJournalEntries();
                    setPromptChunkIndex(0);
                  }}
                  variant="primary"
                >
                  Save All Responses & Continue
                </Button>
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
        title="Review Overdue Task"
        size="lg"
      >
        {currentOverdueTask && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertTriangle className="text-orange-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{currentOverdueTask.title}</h3>
                  {currentOverdueTask.description && (
                    <p className="text-sm text-gray-600 mt-1">{currentOverdueTask.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-orange-700 font-medium">
                      Due: {formatDateForDisplay(currentOverdueTask.dueDate!)}
                    </span>
                    {currentOverdueTask.projectId && projects.find(p => p.id === currentOverdueTask.projectId) && (
                      <span className="text-gray-600">
                        Project: {projects.find(p => p.id === currentOverdueTask.projectId)?.name}
                      </span>
                    )}
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
                {/* Multiple choice questions for this section */}
                {reviewSections[currentSectionIndex].multipleChoiceOptions && 
                  Object.entries(reviewSections[currentSectionIndex].multipleChoiceOptions!).map(([promptIndex, mcOption]) => (
                    <div key={promptIndex} className="space-y-3">
                      <h4 className="font-medium text-gray-900">{mcOption.question}</h4>
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
                    </div>
                  ))
                }
                
                {/* Free text area for additional thoughts */}
                <div>
                  <label className="block font-medium text-gray-900 mb-2">
                    Any additional thoughts? (optional)
                  </label>
                  <textarea
                    value={additionalNotes[reviewSections[currentSectionIndex].id] || ''}
                    onChange={(e) => setAdditionalNotes({
                      ...additionalNotes,
                      [reviewSections[currentSectionIndex].id]: e.target.value
                    })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    rows={3}
                    placeholder="Share any other reflections..."
                  />
                </div>
                
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
                      
                      // Save multiple choice answers as journal entries
                      if (section.multipleChoiceOptions) {
                        Object.entries(section.multipleChoiceOptions).forEach(([promptIndex, mcOption]) => {
                          const key = `${section.id}-${promptIndex}`;
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
                        });
                      }
                      
                      // Save additional notes if any
                      if (additionalNotes[section.id]) {
                        addJournalEntry({
                          title: 'Additional thoughts',
                          content: additionalNotes[section.id],
                          date: new Date().toISOString(),
                          section: section.id as any,
                          weekNumber,
                          weekYear,
                          mood: currentMood,
                          tags: ['weekly-review', section.id, 'notes']
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
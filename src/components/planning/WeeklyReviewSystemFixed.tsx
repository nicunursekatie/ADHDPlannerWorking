import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Task, Project } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { ImprovedTaskCard } from '../tasks/ImprovedTaskCard';
import { formatDate, formatDateForDisplay } from '../../utils/helpers';
import Modal from '../common/Modal';
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
  Check
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
};

interface OverdueTaskReview {
  taskId: string;
  reason: string;
  action: 'reschedule' | 'keep' | 'drop' | 'delegate';
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
    journalEntries,
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
  
  // Overdue task review state
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [currentOverdueTaskIndex, setCurrentOverdueTaskIndex] = useState(0);
  const [overdueTaskReviews, setOverdueTaskReviews] = useState<OverdueTaskReview[]>([]);
  const [overdueReason, setOverdueReason] = useState('');
  const [overdueAction, setOverdueAction] = useState<'reschedule' | 'keep' | 'drop' | 'delegate'>('reschedule');
  const [overdueNewDate, setOverdueNewDate] = useState('');
  const [overdueNotes, setOverdueNotes] = useState('');

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
  
  const incompleteTasks = tasks.filter(task => !task.completed && !task.archived);
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
  const recentlyCompleted = tasks.filter(task => 
    task.completed && 
    new Date(task.updatedAt) >= lastWeek
  );

  // Review sections with guided prompts
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
    console.log('handleAddTask called with input:', taskInput);
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
          section: activeSectionId,
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
      reason: overdueReason,
      action: overdueAction,
      newDate: overdueNewDate,
      notes: overdueNotes,
    };

    setOverdueTaskReviews(prev => [...prev, review]);

    // Apply the action
    switch (overdueAction) {
      case 'reschedule':
        updateTask({
          ...currentTask,
          dueDate: overdueNewDate || null,
        });
        break;
      case 'drop':
        deleteTask(currentTask.id);
        break;
      case 'delegate':
        // You might want to add a "delegated" flag or tag
        updateTask({
          ...currentTask,
          tags: [...(currentTask.tags || []), 'delegated'],
        });
        break;
      case 'keep':
        // No action needed, keep as overdue
        break;
    }

    // Save journal entry about this review
    addJournalEntry({
      title: `Overdue task review: ${currentTask.title}`,
      content: `Reason: ${overdueReason}\nAction: ${overdueAction}\nNotes: ${overdueNotes}`,
      date: new Date().toISOString(),
      section: 'overdue',
      weekNumber,
      weekYear,
      tags: ['weekly-review', 'overdue-review'],
    });

    // Move to next task or close modal
    if (currentOverdueTaskIndex < overdueTasks.length - 1) {
      setCurrentOverdueTaskIndex(prev => prev + 1);
      setOverdueReason('');
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
    console.log('openReviewModal called with sectionId:', sectionId);
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
          {/* Quick task capture always visible */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="label-row">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Capture: Add tasks as they come to mind
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => {
                    console.log('Input changed:', e.target.value);
                    setTaskInput(e.target.value);
                  }}
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Add a task..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTask();
                    }
                  }}
                />
                <Button
                  className="rounded-l-none"
                  onClick={handleAddTask}
                  icon={<Plus size={16} />}
                >
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Section list */}
          <div className="grid gap-4">
            {reviewSections.map((section) => (
              <Card 
                key={section.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  section.complete ? 'bg-green-50 border-green-300' : ''
                }`}
                onClick={() => {
                  console.log('Card clicked for section:', section.id, 'complete:', section.complete);
                  if (!section.complete) {
                    openReviewModal(section.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      section.complete ? 'bg-green-200' : 'bg-gray-100'
                    }`}>
                      {section.complete ? <CheckCircle size={18} className="text-green-700" /> : section.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  {!section.complete && (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
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
        <Card className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Weekly Review Complete!
          </h2>
          <p className="text-gray-600 mb-6">
            Great job taking time to reflect and plan. You're set up for a successful week ahead.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/tasks')}
            >
              View Tasks
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/planner')}
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
          onClose={() => setActiveSectionId(null)}
          title={activeSection.title}
          size="lg"
        >
          <div className="space-y-6">
            <p className="text-gray-600">{activeSection.description}</p>
            
            {/* Prompts */}
            <div className="space-y-4">
              {activeSection.prompts.map((prompt, index) => (
                <div key={`${activeSectionId}-${index}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {prompt}
                  </label>
                  <textarea
                    value={journalResponses[`${activeSectionId}-${index}`] || ''}
                    onChange={(e) => handleJournalChange(index, e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Type your thoughts here..."
                  />
                </div>
              ))}
            </div>
            
            {/* Relevant task lists based on the section */}
            {activeSectionId === 'upcoming' && tasksDueThisWeek.length > 0 && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Tasks Due This Week:</h4>
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
                    <p className="text-center text-sm text-gray-500 pt-2">
                      + {tasksDueThisWeek.length - 5} more tasks this week
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {activeSectionId === 'projects' && projects.length > 0 && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Your Projects:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {projects.map(project => {
                    const projectTasks = incompleteTasks.filter(t => t.projectId === project.id);
                    return (
                      <div key={project.id} className="p-3 rounded-lg bg-white border">
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: project.color }}
                          ></div>
                          <h5 className="font-medium">{project.name}</h5>
                          <span className="ml-auto text-sm text-gray-500">
                            {projectTasks.length} tasks
                          </span>
                        </div>
                        {projectTasks.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No active tasks in this project</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeSectionId === 'reflect' && recentlyCompleted.length > 0 && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Recently Completed:</h4>
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
                    <p className="text-center text-sm text-gray-500 pt-2">
                      + {recentlyCompleted.length - 5} more completed tasks
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Journal entries for this section */}
            {section.hasJournal && weeklyJournalEntries.filter(entry => entry.section === activeSectionId).length > 0 && (
              <div className="border rounded-lg p-3 bg-gray-50 mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Previous Reflections:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {weeklyJournalEntries
                    .filter(entry => entry.section === activeSectionId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map(entry => (
                      <div key={entry.id} className="p-2 bg-white rounded border text-sm">
                        <div className="font-medium text-gray-800">{entry.title}</div>
                        <div className="text-gray-600 text-xs">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                        <div className="text-gray-700 mt-1">{entry.content}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button 
                variant="outline"
                onClick={() => {
                  setActiveSectionId(null);
                }}
              >
                Back to Review
              </Button>
              <Button 
                onClick={handleSaveJournalEntries}
                variant="primary"
              >
                Save All Responses & Continue
              </Button>
            </div>
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
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-600 mt-1" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">{currentOverdueTask.title}</h3>
                  {currentOverdueTask.description && (
                    <p className="text-sm text-gray-600 mt-1">{currentOverdueTask.description}</p>
                  )}
                  <p className="text-sm text-orange-600 mt-2">
                    Due: {formatDateForDisplay(currentOverdueTask.dueDate!)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why didn't this get done?
                </label>
                <textarea
                  value={overdueReason}
                  onChange={(e) => setOverdueReason(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Be honest - what prevented you from completing this task?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What should we do with this task?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'reschedule', label: 'Reschedule it', icon: <Calendar size={18} /> },
                    { value: 'keep', label: 'Keep it overdue', icon: <Clock size={18} /> },
                    { value: 'drop', label: 'Drop it', icon: <X size={18} /> },
                    { value: 'delegate', label: 'Delegate it', icon: <Check size={18} /> },
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value={option.value}
                        checked={overdueAction === option.value}
                        onChange={(e) => setOverdueAction(e.target.value as typeof overdueAction)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {overdueAction === 'reschedule' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New due date
                  </label>
                  <input
                    type="date"
                    value={overdueNewDate}
                    onChange={(e) => setOverdueNewDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any additional notes?
                </label>
                <textarea
                  value={overdueNotes}
                  onChange={(e) => setOverdueNotes(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional: Add any context or next steps..."
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-gray-500">
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
    </div>
  );
};

export default WeeklyReviewSystemFixed;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContextSupabase';
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
  const navigate = useNavigate();
  const {
    tasks,
    projects,
    categories,
    quickAddTask,
    updateTask,
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
  
  const incompleteTasks = tasks.filter(task => !task.completed);
  const tasksDueThisWeek = incompleteTasks.filter(task => 
    task.dueDate && 
    task.dueDate >= formatDate(today) && 
    task.dueDate <= formatDate(nextWeek)
  );
  
  // Include overdue tasks and tasks without due dates for review
  const overdueAndUndatedTasks = incompleteTasks.filter(task => 
    (task.dueDate && task.dueDate < formatDate(today)) || !task.dueDate
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
      title: 'Review Overdue & Undated Tasks',
      icon: <Clock size={18} />,
      description: `You have ${overdueAndUndatedTasks.length} tasks to review (overdue and undated)`,
      prompts: [
        'Do these tasks still need to be done?',
        'Which tasks without due dates need deadlines?',
        'What prevented you from completing overdue tasks?',
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
      quickAddTask(taskInput);
      setTaskInput('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    }
  };


  const handleSaveJournalEntries = () => {
    if (activeSectionId) {
      const section = reviewSections.find(s => s.id === activeSectionId);
      if (!section) return;

      // Save each prompt response
      section.prompts.forEach((prompt, index) => {
        const responseKey = `${activeSectionId}-${index}`;
        const content = journalResponses[responseKey];
        
        if (content && content.trim()) {
          const existingEntry = weeklyJournalEntries.find(
            entry => entry.section === activeSectionId && entry.promptIndex === index
          );
          
          if (existingEntry) {
            updateJournalEntry({
              ...existingEntry,
              content: content,
              title: prompt,
              updatedAt: new Date().toISOString(),
            });
          } else {
            addJournalEntry({
              content: content,
              section: activeSectionId as 'reflect' | 'overdue' | 'upcoming' | 'projects' | 'life-areas',
              promptIndex: index,
              weekNumber,
              weekYear,
              mood: currentMood,
              title: prompt,
            });
          }
        }
      });

      // Update sections to mark current one as complete
      const updatedSections = reviewSections.map(s =>
        s.id === activeSectionId ? { ...s, complete: true } : s
      );
      setReviewSections(updatedSections);
      
      // Check if this was the last section
      const currentIndex = reviewSections.findIndex(s => s.id === activeSectionId);
      const nextSection = reviewSections[currentIndex + 1];
      
      if (nextSection) {
        // Move to next section
        setActiveSectionId(nextSection.id as typeof activeSectionId);
      } else {
        // All sections complete - complete the review
        handleCompleteReview();
      }
    }
  };

  const handleCompleteReview = () => {
    updateLastWeeklyReviewDate();
    setReviewComplete(true);
  };

  const activeSection = reviewSections.find(s => s.id === activeSectionId);

  
  // Show completion screen if review is complete
  if (reviewComplete) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Review Complete!</h2>
            <p className="text-gray-600 mb-6">Great job staying on top of your system.</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/')}
                variant="primary"
                className="mx-auto"
              >
                Return to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setReviewComplete(false);
                  setActiveSectionId(null);
                }}
                variant="outline"
                className="mx-auto"
              >
                Review Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Weekly Review</h3>
          </div>
        </div>
        
        <div className="p-4">
          {/* Section List */}
          {!activeSectionId && (
            <div className="space-y-3">
              {reviewSections.map(section => (
                <div 
                  key={section.id}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    section.complete 
                      ? 'bg-green-50 border border-green-100' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                  }`}
                  onClick={() => {
                    setActiveSectionId(section.id);
                  }}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${section.complete ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {section.complete ? <CheckCircle size={18} /> : section.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
          
          {/* Active Section */}
          {activeSectionId && (
            <div>
              {reviewSections.filter(s => s.id === activeSectionId).map(section => (
                <div key={section.id} className="space-y-4">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full mr-3 bg-blue-100 text-blue-600">
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-medium">{section.title}</h3>
                  </div>
                  
                  {/* Show all prompts with individual text boxes */}
                  {section.hasJournal && (
                    <div className="space-y-4 mb-6">
                      {section.prompts.map((prompt, index) => {
                        const responseKey = `${activeSectionId}-${index}`;
                        const existingEntry = weeklyJournalEntries.find(
                          entry => entry.section === activeSectionId && entry.promptIndex === index
                        );
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {prompt}
                            </label>
                            <textarea
                              value={journalResponses[responseKey] || existingEntry?.content || ''}
                              onChange={(e) => {
                                setJournalResponses({
                                  ...journalResponses,
                                  [responseKey]: e.target.value
                                });
                              }}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-24"
                              placeholder="Write your thoughts about this prompt..."
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Task entry section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add tasks that come to mind while reviewing
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
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
                        Add Task
                      </Button>
                    </div>
                  </div>
                  
                  {/* Relevant task lists based on the section */}
                  {activeSectionId === 'overdue' && overdueAndUndatedTasks.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-700 mb-2">Tasks to Review:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {overdueAndUndatedTasks.slice(0, 5).map(task => (
                          <ImprovedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={categories}
                          />
                        ))}
                        {overdueAndUndatedTasks.length > 5 && (
                          <p className="text-center text-sm text-gray-500 pt-2">
                            + {overdueAndUndatedTasks.length - 5} more tasks to review
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
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
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WeeklyReviewSystem;
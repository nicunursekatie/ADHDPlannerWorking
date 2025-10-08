import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Battery, 
  Target,
  Folder,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
  Brain,
  Timer
} from 'lucide-react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { format, addDays, startOfToday } from 'date-fns';

interface TaskDetailWizardProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedTask: Task) => Promise<void>;
}

interface WizardStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  isComplete: (task: Task) => boolean;
  isCritical?: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'description',
    title: 'What needs to be done?',
    icon: <FileText className="w-5 h-5" />,
    description: 'Add details about this task',
    isComplete: (task) => !!task.description && task.description.length > 10,
  },
  {
    id: 'dueDate',
    title: 'When is it due?',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Set a deadline to stay on track',
    isComplete: (task) => !!task.dueDate,
  },
  {
    id: 'estimatedTime',
    title: 'How long will it take?',
    icon: <Timer className="w-5 h-5" />,
    description: 'Estimate time in minutes',
    isComplete: (task) => !!task.estimatedMinutes && task.estimatedMinutes > 0,
  },
  {
    id: 'energy',
    title: 'Energy level needed?',
    icon: <Battery className="w-5 h-5" />,
    description: 'When should you tackle this?',
    isComplete: (task) => !!task.energyLevel,
  },
  {
    id: 'priority',
    title: 'How important is it?',
    icon: <Target className="w-5 h-5" />,
    description: 'Set the priority level',
    isComplete: (task) => !!task.priority,
    isCritical: true,
  },
  {
    id: 'project',
    title: 'Part of a project?',
    icon: <Folder className="w-5 h-5" />,
    description: 'Organize into a project',
    isComplete: (task) => !!task.projectId,
  },
  {
    id: 'categories',
    title: 'Add categories',
    icon: <Tag className="w-5 h-5" />,
    description: 'Tag for better organization',
    isComplete: (task) => !!task.categoryIds && task.categoryIds.length > 0,
  },
];

export const TaskDetailWizard: React.FC<TaskDetailWizardProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
}) => {
  const { projects, categories } = useAppContext();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [updatedTask, setUpdatedTask] = useState<Task>(task);
  const [showSuccess, setShowSuccess] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when task changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setUpdatedTask(task);
      setCurrentStepIndex(0);
      setVisitedSteps(new Set());
      setShowSuccess(false);
      setIsSaving(false);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const currentStep = WIZARD_STEPS[currentStepIndex];
  // Only count steps as completed if they were visited in this session
  const completedSteps = WIZARD_STEPS.filter(step => 
    visitedSteps.has(step.id) && step.isComplete(updatedTask)
  ).length;
  const progress = (completedSteps / WIZARD_STEPS.length) * 100;

  const handleNext = () => {
    // Mark current step as visited
    setVisitedSteps(prev => new Set([...prev, currentStep.id]));
    
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      // Call onComplete and wait for it to finish
      await onComplete(updatedTask);
      // Show success state
      setShowSuccess(true);
      // Only close after successful update
      setTimeout(() => {
        onClose();
        // Reset states after closing
        setShowSuccess(false);
        setIsSaving(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to save task details:', error);
      setShowSuccess(false);
      setIsSaving(false);
      // Show error message to user
      alert('Failed to save task details. Please try again.');
    }
  };

  const handleSkip = () => {
    // Mark current step as visited even when skipping
    setVisitedSteps(prev => new Set([...prev, currentStep.id]));
    
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const updateTaskField = (field: keyof Task, value: any) => {
    setUpdatedTask({ ...updatedTask, [field]: value });
  };

  const getExistingValueDisplay = (stepId: string) => {
    let fieldName: keyof Task;
    switch (stepId) {
      case 'description': fieldName = 'description'; break;
      case 'dueDate': fieldName = 'dueDate'; break;
      case 'estimatedTime': fieldName = 'estimatedMinutes'; break;
      case 'energy': fieldName = 'energyLevel'; break;
      case 'priority': fieldName = 'priority'; break;
      case 'project': fieldName = 'projectId'; break;
      case 'categories': fieldName = 'categoryIds'; break;
      default: return null;
    }

    const originalValue = task[fieldName];
    if (!originalValue) return null;

    switch (stepId) {
      case 'dueDate':
        return format(new Date(originalValue as string), 'MMM d, yyyy');
      case 'estimatedTime':
        const minutes = originalValue as number;
        return minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hours`;
      case 'energy':
        return `${(originalValue as string).charAt(0).toUpperCase()}${(originalValue as string).slice(1)} energy`;
      case 'priority':
        return `${(originalValue as string).charAt(0).toUpperCase()}${(originalValue as string).slice(1)} priority`;
      case 'project':
        const project = projects.find(p => p.id === originalValue);
        return project?.name || '';
      case 'categories':
        const categoryNames = (originalValue as string[])
          .map(id => categories.find(c => c.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        return categoryNames || '';
      default:
        return originalValue as string;
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'description':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Describe what needs to be done
            </label>
            <textarea
              value={updatedTask.description || ''}
              onChange={(e) => updateTaskField('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Break it down into clear, actionable steps..."
              autoFocus
            />
            <div className="text-xs text-gray-500">
              Tip: Be specific! "Call dentist to schedule cleaning" is better than "Dentist"
            </div>
          </div>
        );

      case 'dueDate':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              When does this need to be done?
            </label>
            <input
              type="date"
              value={updatedTask.dueDate || ''}
              onChange={(e) => updateTaskField('dueDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={format(startOfToday(), 'yyyy-MM-dd')}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateTaskField('dueDate', format(startOfToday(), 'yyyy-MM-dd'))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Today
              </button>
              <button
                onClick={() => updateTaskField('dueDate', format(addDays(startOfToday(), 1), 'yyyy-MM-dd'))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Tomorrow
              </button>
              <button
                onClick={() => updateTaskField('dueDate', format(addDays(startOfToday(), 7), 'yyyy-MM-dd'))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Next Week
              </button>
              <button
                onClick={() => updateTaskField('dueDate', format(addDays(startOfToday(), 30), 'yyyy-MM-dd'))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Next Month
              </button>
            </div>
            <button
              onClick={() => updateTaskField('dueDate', '')}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              No due date
            </button>
          </div>
        );

      case 'estimatedTime':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              How many minutes will this take?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[15, 30, 45, 60, 90, 120].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => updateTaskField('estimatedMinutes', minutes)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    updatedTask.estimatedMinutes === minutes
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={updatedTask.estimatedMinutes || ''}
              onChange={(e) => updateTaskField('estimatedMinutes', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Or enter custom minutes..."
              min="1"
            />
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              What energy level do you need for this task?
            </label>
            <div className="space-y-3">
              {[
                { value: 'low', label: 'Low Energy', icon: <Battery className="w-5 h-5" />, description: 'Can do when tired' },
                { value: 'medium', label: 'Medium Energy', icon: <Zap className="w-5 h-5" />, description: 'Need to be somewhat alert' },
                { value: 'high', label: 'High Energy', icon: <Brain className="w-5 h-5" />, description: 'Need full focus & energy' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateTaskField('energyLevel', option.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                    updatedTask.energyLevel === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={updatedTask.energyLevel === option.value ? 'text-blue-600' : 'text-gray-400'}>
                    {option.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'priority':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              How important is this task?
            </label>
            <div className="space-y-3">
              {[
                { value: 'high', label: 'High Priority', color: 'bg-red-500', description: 'Urgent and important' },
                { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-500', description: 'Important but not urgent' },
                { value: 'low', label: 'Low Priority', color: 'bg-green-500', description: 'Nice to do, not critical' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateTaskField('priority', option.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    updatedTask.priority === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${option.color}`} />
                    <div className="text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'project':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Is this part of a larger project?
            </label>
            <select
              value={updatedTask.projectId || ''}
              onChange={(e) => updateTaskField('projectId', e.target.value || null)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Add categories to organize this task
            </label>
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={updatedTask.categoryIds?.includes(category.id) || false}
                    onChange={(e) => {
                      const currentIds = updatedTask.categoryIds || [];
                      if (e.target.checked) {
                        updateTaskField('categoryIds', [...currentIds, category.id]);
                      } else {
                        updateTaskField('categoryIds', currentIds.filter(id => id !== category.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Prevent clicks on the backdrop from bubbling up
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => {
          // Prevent clicks within the modal from bubbling up to parent components
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold text-gray-900">Complete Your Task</h2>
            <button
              onClick={onClose}
              disabled={isSaving}
              className={`p-2 rounded-lg transition-colors ${
                isSaving ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'
              }`}
              title={isSaving ? 'Please wait while saving...' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Task Name */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">{updatedTask.title}</h3>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{completedSteps} of {WIZARD_STEPS.length} details complete</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto min-h-0">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Task Updated!</h3>
              <p className="text-gray-600">All details have been saved.</p>
            </div>
          ) : (
            <>
              {/* Step Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg ${
                  currentStep.isComplete(updatedTask) ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {currentStep.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{currentStep.title}</h3>
                  <p className="text-sm text-gray-600">{currentStep.description}</p>
                  {getExistingValueDisplay(currentStep.id) && (
                    <p className="text-sm text-blue-600 mt-1">
                      Current: {getExistingValueDisplay(currentStep.id)}
                    </p>
                  )}
                </div>
                {currentStep.isCritical && (
                  <div className="ml-auto flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Important</span>
                  </div>
                )}
              </div>

              {/* Step Content */}
              {renderStepContent()}
            </>
          )}
        </div>

        {/* Footer */}
        {!showSuccess && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0 || isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStepIndex === 0 || isSaving
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-3">
                {!currentStep.isComplete(updatedTask) && !currentStep.isCritical && !isSaving && (
                  <button
                    onClick={handleSkip}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Skip for now
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={(currentStep.isCritical && !currentStep.isComplete(updatedTask)) || isSaving}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    (currentStep.isCritical && !currentStep.isComplete(updatedTask)) || isSaving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      {currentStepIndex === WIZARD_STEPS.length - 1 ? 'Complete' : 'Next'}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
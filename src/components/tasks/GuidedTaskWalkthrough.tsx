import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, Clock, AlertCircle, Pause, Play, RotateCcw, Trophy } from 'lucide-react';

interface GuidedTaskWalkthroughProps {
  taskId: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export const GuidedTaskWalkthrough: React.FC<GuidedTaskWalkthroughProps> = ({
  taskId,
  onComplete,
  onExit,
}) => {
  const { tasks, updateTask } = useAppContext();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showEncouragement, setShowEncouragement] = useState(false);

  const parentTask = tasks.find(t => t.id === taskId);
  const subtasks = tasks
    .filter(t => t.parentTaskId === taskId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const currentStep = subtasks[currentStepIndex];
  const progress = subtasks.length > 0 ? (completedSteps.size / subtasks.length) * 100 : 0;

  useEffect(() => {
    setStepStartTime(new Date());
  }, [currentStepIndex]);

  useEffect(() => {
    if (completedSteps.size > 0 && completedSteps.size % 3 === 0) {
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 3000);
    }
  }, [completedSteps.size]);

  const handleStepComplete = useCallback(() => {
    if (!currentStep) return;

    updateTask({ ...currentStep, completed: true });
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));

    if (currentStepIndex < subtasks.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (onComplete && parentTask) {
      updateTask({ ...parentTask, completed: true });
      onComplete();
    }
  }, [currentStep, currentStepIndex, subtasks.length, updateTask, taskId, onComplete]);

  const handleSkipStep = useCallback(() => {
    if (currentStepIndex < subtasks.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, subtasks.length]);

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handlePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleNoteChange = useCallback((stepId: string, note: string) => {
    setNotes(prev => ({ ...prev, [stepId]: note }));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeSpent = () => {
    const now = new Date();
    const stepTime = Math.floor((now.getTime() - stepStartTime.getTime()) / 1000);
    const totalTime = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
    return { stepTime, totalTime };
  };

  if (!parentTask || subtasks.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">No subtasks found for this task.</p>
        <Button onClick={onExit} className="mt-4">Back</Button>
      </Card>
    );
  }

  const { stepTime, totalTime } = getTimeSpent();

  return (
    <div 
      className="max-w-3xl mx-auto space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      {showEncouragement && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center animate-pulse">
          <Trophy className="inline-block w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
          <span className="text-green-800 dark:text-green-200 font-medium">
            Great progress! You've completed {completedSteps.size} steps! 🎉
          </span>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">{parentTask.title}</h2>
            <Button size="sm" variant="outline" onClick={onExit}>
              Exit Walkthrough
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Total: {formatTime(totalTime)}
            </span>
            <span className="flex items-center gap-1">
              Step {currentStepIndex + 1} of {subtasks.length}
            </span>
          </div>

          <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {currentStep && (
          <div className="space-y-4">
            <Card className={`p-6 ${isPaused ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {completedSteps.has(currentStep.id) ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">{currentStep.title}</h3>
                  
                  {currentStep.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {currentStep.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentStep.estimatedMinutes && (
                      <Badge 
                        text={`~${currentStep.estimatedMinutes} min`}
                        color="#6366f1" 
                        bgColor="#e0e7ff"
                      />
                    )}
                    {currentStep.priority && (
                      <Badge 
                        text={`${currentStep.priority} priority`}
                        color={currentStep.priority === 'high' ? '#dc2626' : currentStep.priority === 'medium' ? '#f59e0b' : '#6b7280'}
                        bgColor={currentStep.priority === 'high' ? '#fee2e2' : currentStep.priority === 'medium' ? '#fef3c7' : '#f3f4f6'}
                      />
                    )}
                    <Badge 
                      text={formatTime(stepTime)}
                      color="#059669" 
                      bgColor="#d1fae5"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quick notes for this step:
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg resize-none"
                        rows={2}
                        placeholder="Any blockers, thoughts, or progress notes..."
                        value={notes[currentStep.id] || ''}
                        onChange={(e) => handleNoteChange(currentStep.id, e.target.value)}
                        disabled={isPaused}
                      />
                    </div>

                    {currentStep.tags && currentStep.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-600 dark:text-amber-400">
                          Tips: {currentStep.tags.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStepIndex === 0 || isPaused}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePause}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSkipStep}
                  disabled={isPaused || currentStepIndex === subtasks.length - 1}
                >
                  Skip
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                
                <Button
                  onClick={handleStepComplete}
                  disabled={isPaused || completedSteps.has(currentStep.id)}
                >
                  {completedSteps.has(currentStep.id) ? 'Completed' : 'Mark Complete'}
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">All Steps:</h4>
          <div className="space-y-1">
            {subtasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center gap-2 text-sm ${
                  index === currentStepIndex ? 'font-medium text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                {completedSteps.has(task.id) ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : index === currentStepIndex ? (
                  <Circle className="w-4 h-4 text-blue-500" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300" />
                )}
                <span className={completedSteps.has(task.id) ? 'line-through text-gray-500' : ''}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
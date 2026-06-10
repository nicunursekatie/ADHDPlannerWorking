import React, { useState, ChangeEvent } from 'react';
import { Task } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAppContext } from '../../context/AppContext';

interface TaskDetailsUpdaterProps {
  task: Task;
  onComplete?: () => void;
}

interface Step {
  title: string;
  question: string;
  options?: string[];
  type?: 'number' | 'text';
  field: keyof Task;
}

const TaskDetailsUpdater: React.FC<TaskDetailsUpdaterProps> = ({ task, onComplete }) => {
  const { updateTask } = useAppContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [updatedTask, setUpdatedTask] = useState<Task>(task);

  const steps: Step[] = [
    {
      title: 'Priority',
      question: 'What is the priority level of this task?',
      options: ['low', 'medium', 'high'],
      field: 'priority'
    },
    {
      title: 'Energy Level',
      question: 'How much energy does this task require?',
      options: ['low', 'medium', 'high'],
      field: 'energyLevel'
    },
    {
      title: 'Size',
      question: 'What is the size of this task?',
      options: ['small', 'medium', 'large'],
      field: 'size'
    },
    {
      title: 'Estimated Time',
      question: 'How many minutes do you estimate this task will take?',
      type: 'number',
      field: 'estimatedMinutes'
    },
    {
      title: 'Context',
      question: 'Would you like to add any tags for context? (comma-separated)',
      type: 'text',
      field: 'tags'
    }
  ];

  const handleOptionSelect = (value: string | number | string[]) => {
    const currentField = steps[currentStep].field;
    setUpdatedTask((prev: Task) => ({
      ...prev,
      [currentField]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev: number) => prev + 1);
    } else {
      // Save all updates
      updateTask(updatedTask);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev: number) => prev - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">{currentStepData.title}</h2>
      <p className="mb-4">{currentStepData.question}</p>

      {currentStepData.type === 'number' ? (
        <input
          type="number"
          value={updatedTask[currentStepData.field] || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleOptionSelect(parseInt(e.target.value))}
          className="w-full p-2 border rounded mb-4"
          min="1"
        />
      ) : currentStepData.type === 'text' ? (
        <input
          type="text"
          value={(updatedTask[currentStepData.field] as string[])?.join(', ') || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleOptionSelect(e.target.value.split(',').map(tag => tag.trim()))}
          className="w-full p-2 border rounded mb-4"
          placeholder="Enter tags separated by commas"
        />
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {currentStepData.options?.map((option) => (
            <Button
              key={option}
              onClick={() => handleOptionSelect(option)}
              variant={updatedTask[currentStepData.field] === option ? 'primary' : 'secondary'}
              className="w-full"
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button
          onClick={handleBack}
          variant="secondary"
          disabled={currentStep === 0}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          variant="primary"
        >
          {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </div>
    </Card>
  );
};

export default TaskDetailsUpdater; 
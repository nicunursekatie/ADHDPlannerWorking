import React from 'react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';

export interface TaskEditDialog2Props {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}

const steps = [
  { id: 'what-why', label: 'What & Why' },
  { id: 'when-importance', label: 'When & How Important' },
  { id: 'energy-time', label: 'Energy & Time' },
  { id: 'advanced', label: 'Advanced' },
];

export const TaskEditDialog2: React.FC<TaskEditDialog2Props> = ({ open, onClose, onDelete, onSubmit }) => {
  const [activeStep, setActiveStep] = React.useState(0);

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      title="Edit Task"
      size="2xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <Button color="error" onClick={onDelete} variant="danger">
            Delete
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button variant="primary" onClick={onSubmit}>
              Save
            </Button>
          </div>
        </div>
      }
    >
      {/* Stepper / Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeStep === index 
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {step.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeStep === 0 && (
          <div className="text-gray-600 dark:text-gray-400">
            TODO: What & Why form fields
          </div>
        )}
        {activeStep === 1 && (
          <div className="text-gray-600 dark:text-gray-400">
            TODO: When & How Important form fields
          </div>
        )}
        {activeStep === 2 && (
          <div className="text-gray-600 dark:text-gray-400">
            TODO: Energy & Time form fields
          </div>
        )}
        {activeStep === 3 && (
          <div className="text-gray-600 dark:text-gray-400">
            TODO: Advanced form fields
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskEditDialog2;
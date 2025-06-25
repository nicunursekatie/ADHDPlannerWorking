import React, { useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';

interface TimeSpentModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  estimatedMinutes?: number;
  onConfirm: (actualMinutes: number) => void;
  onSkip: () => void;
}

export const TimeSpentModal: React.FC<TimeSpentModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  estimatedMinutes,
  onConfirm,
  onSkip,
}) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  
  React.useEffect(() => {
    if (isOpen) {
      console.log('[TimeSpentModal] Modal opened for task:', {
        taskTitle,
        estimatedMinutes,
        isOpen
      });
    }
  }, [isOpen, taskTitle, estimatedMinutes]);
  
  React.useEffect(() => {
    console.log('[TimeSpentModal] Modal state changed', {
      isOpen,
      taskTitle,
      estimatedMinutes
    });
  }, [isOpen, taskTitle, estimatedMinutes]);
  
  const handleConfirm = () => {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes > 0) {
      onConfirm(totalMinutes);
      onClose();
    }
  };
  
  const handleQuickSelect = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    setHours(h);
    setMinutes(m);
  };
  
  const totalMinutes = hours * 60 + minutes;
  const estimatedHours = estimatedMinutes ? Math.floor(estimatedMinutes / 60) : 0;
  const estimatedMins = estimatedMinutes ? estimatedMinutes % 60 : 0;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How much time did you spend?"
      size="md"
      footer={
        <div className="flex justify-between">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            Skip Time Tracking
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalMinutes === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 size={16} className="inline mr-2" />
              Complete Task
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Task title */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completing task:</p>
          <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{taskTitle}</p>
        </div>
        
        {/* Estimated vs Actual comparison */}
        {estimatedMinutes ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">Estimated time:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {estimatedHours > 0 && `${estimatedHours}h `}{estimatedMins}m
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This task didn't have an estimated time. Recording actual time spent will help improve future estimates!
            </p>
          </div>
        )}
        
        {/* Time input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Actual time spent:
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                className="w-16 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">hours</span>
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-16 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">minutes</span>
            </div>
          </div>
        </div>
        
        {/* Quick select buttons */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick select:</p>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => handleQuickSelect(mins)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </button>
            ))}
          </div>
        </div>
        
        {/* Comparison feedback */}
        {totalMinutes > 0 && (
          <div className={`p-3 rounded-lg text-sm ${
            estimatedMinutes 
              ? (
                totalMinutes < estimatedMinutes 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : totalMinutes > estimatedMinutes * 1.5
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
              )
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}>
            <Clock size={16} className="inline mr-2" />
            {estimatedMinutes
              ? (
                totalMinutes < estimatedMinutes
                  ? `Great job! You finished ${estimatedMinutes - totalMinutes} minutes faster than estimated!`
                  : totalMinutes > estimatedMinutes * 1.5
                  ? `This took ${totalMinutes - estimatedMinutes} minutes longer than estimated. Consider breaking down similar tasks in the future.`
                  : `Close to estimate! Only ${Math.abs(totalMinutes - estimatedMinutes)} minutes difference.`
              )
              : `You spent ${totalMinutes} minutes on this task. This data will help improve future time estimates!`
            }
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TimeSpentModal;
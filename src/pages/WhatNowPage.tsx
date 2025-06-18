import React, { useState } from 'react';
import { Task } from '../types';
import WhatNowWizard from '../components/whatnow/WhatNowWizard';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';

const WhatNowPage: React.FC = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-primary-100 dark:border-gray-700 p-6 mb-6">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent tracking-tight mb-2">
            What should I work on?
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Let's find the perfect task for your current situation
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary-600 dark:text-primary-400">
            <span className="inline-block w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            <span>AI-powered recommendations</span>
          </div>
        </div>
      </div>
      
      {/* Wizard */}
      <WhatNowWizard onSelectTask={handleTaskSelect} />
      
      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title="Task Details"
        size="3xl"
      >
        <TaskForm
          task={selectedTask || undefined}
          onClose={handleCloseTaskModal}
          isEdit={true}
        />
      </Modal>
    </div>
  );
};

export default WhatNowPage;
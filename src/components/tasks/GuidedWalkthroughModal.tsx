import React from 'react';
import { createPortal } from 'react-dom';
import Modal from '../common/Modal';
import { GuidedTaskWalkthrough } from './GuidedTaskWalkthrough';

interface GuidedWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

export const GuidedWalkthroughModal: React.FC<GuidedWalkthroughModalProps> = ({
  isOpen,
  onClose,
  taskId,
}) => {
  const handleComplete = () => {
    alert('🎉 Congratulations! You completed all the steps!');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guided Task Walkthrough"
      size="full"
    >
      <div 
        className="-m-6"
        onClick={(e) => e.stopPropagation()}
      >
        <GuidedTaskWalkthrough
          taskId={taskId}
          onComplete={handleComplete}
          onExit={onClose}
        />
      </div>
    </Modal>,
    document.body
  );
};
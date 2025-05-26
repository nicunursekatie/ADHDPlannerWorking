import React from 'react';
import { Modal } from '../common/Modal';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-4xl"
    >
      <div className="-m-6">
        <GuidedTaskWalkthrough
          taskId={taskId}
          onComplete={handleComplete}
          onExit={onClose}
        />
      </div>
    </Modal>
  );
};
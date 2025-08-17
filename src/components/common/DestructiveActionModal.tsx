import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface DestructiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmWord?: string;
  actionLabel?: string;
}

export const DestructiveActionModal: React.FC<DestructiveActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'This action cannot be undone.',
  confirmWord = 'DELETE',
  actionLabel = 'Delete'
}) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleConfirm = () => {
    if (inputValue.toUpperCase() === confirmWord.toUpperCase()) {
      onConfirm();
      setInputValue('');
      onClose();
    }
  };
  
  const handleClose = () => {
    setInputValue('');
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <span>{title}</span>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          {description}
        </p>
        
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            ⚠️ {confirmText}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-red-600 dark:text-red-400">{confirmWord}</span> to confirm
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.toUpperCase() === confirmWord.toUpperCase()) {
                handleConfirm();
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder={`Type ${confirmWord} here`}
            autoFocus
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={inputValue.toUpperCase() !== confirmWord.toUpperCase()}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
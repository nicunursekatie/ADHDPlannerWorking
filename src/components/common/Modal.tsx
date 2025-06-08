import React, { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement>(null);
  const hasSetInitialFocus = useRef(false);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      
      // Focus management for accessibility - only set initial focus once
      if (!hasSetInitialFocus.current) {
        hasSetInitialFocus.current = true;
        setTimeout(() => {
          // First check for any input or textarea that should have focus
          const inputElement = modalRef.current?.querySelector('input:not([type="hidden"]), textarea') as HTMLElement;
          if (inputElement) {
            inputElement.focus();
          } else {
            // If no input/textarea, find first focusable element that's not the close button
            const focusables = modalRef.current?.querySelectorAll('button, [href], select, [tabindex]:not([tabindex="-1"])');
            if (focusables && focusables.length > 0) {
              // Skip the first button if it's the close button (has X icon)
              for (const element of focusables) {
                const htmlElement = element as HTMLElement;
                // Check if this is the close button by looking for the X icon
                const hasCloseIcon = htmlElement.querySelector('[data-lucide="x"]') || htmlElement.getAttribute('aria-label') === 'Close modal';
                if (!hasCloseIcon) {
                  htmlElement.focus();
                  break;
                }
              }
            }
          }
        }, 100);
      }
    } else {
      // Reset the flag when modal closes
      hasSetInitialFocus.current = false;
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnOverlayClick]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn transition-opacity"
          aria-hidden="true"
        />
        
        {/* Modal panel */}
        <div
          ref={modalRef}
          className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl transform transition-all animate-scaleIn inline-block align-bottom text-left overflow-hidden sm:my-8 sm:align-middle ${sizeClasses[size]} w-full`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center">
              <h3 
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight"
              >
                {title}
              </h3>
              {showCloseButton && (
                <button
                  type="button"
                  className="rounded-xl p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 hover:scale-105"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-6 text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
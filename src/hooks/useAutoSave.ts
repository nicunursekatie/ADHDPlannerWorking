import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: () => void | Promise<void>;
  onPageHide?: () => void | Promise<void>;
  enabled?: boolean;
}

/**
 * Custom hook for auto-saving data with debouncing and page visibility handling
 * 
 * This hook helps prevent data loss when:
 * - Tab becomes inactive and page refreshes
 * - User closes browser or navigates away
 * - App loses focus for extended periods
 */
export const useAutoSave = ({
  delay = 1000,
  onSave,
  onPageHide,
  enabled = true
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isVisibleRef = useRef(true);
  const hasPendingChangesRef = useRef(false);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (!enabled) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set flag that we have pending changes
    hasPendingChangesRef.current = true;

    // Schedule save after delay
    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave();
        hasPendingChangesRef.current = false;
        console.log('Auto-save: Changes saved successfully');
      } catch (error) {
        console.error('Auto-save: Failed to save changes', error);
        // Keep the pending changes flag true on error
      }
    }, delay);
  }, [onSave, delay, enabled]);

  // Immediate save function (for critical moments like page hide)
  const saveImmediately = useCallback(async () => {
    if (!enabled || !hasPendingChangesRef.current) return;

    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    try {
      await onSave();
      hasPendingChangesRef.current = false;
      console.log('Auto-save: Immediate save completed');
    } catch (error) {
      console.error('Auto-save: Immediate save failed', error);
    }
  }, [onSave, enabled]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = async () => {
      const isNowVisible = !document.hidden;
      
      if (!isNowVisible && isVisibleRef.current) {
        // Page is becoming hidden - save immediately
        console.log('Auto-save: Page becoming hidden, saving immediately');
        await saveImmediately();
        
        // Call custom onPageHide handler if provided
        if (onPageHide) {
          try {
            await onPageHide();
          } catch (error) {
            console.error('Auto-save: onPageHide handler failed', error);
          }
        }
      }
      
      isVisibleRef.current = isNowVisible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, saveImmediately, onPageHide]);

  // Handle beforeunload (page refresh/close)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasPendingChangesRef.current) {
        // Warning: beforeunload cannot wait for async operations
        // We can only warn the user about unsaved changes
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    /**
     * Call this function when data changes to trigger auto-save
     */
    triggerSave: debouncedSave,
    
    /**
     * Force an immediate save (bypasses debouncing)
     */
    saveNow: saveImmediately,
    
    /**
     * Check if there are pending changes that haven't been saved yet
     */
    hasPendingChanges: () => hasPendingChangesRef.current
  };
};
import { useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import { useAutoSave } from './useAutoSave';

interface UseTaskAutoSaveOptions {
  delay?: number;
  enabled?: boolean;
}

/**
 * Hook specifically for auto-saving task changes
 * Integrates with the app context and handles task-specific auto-save logic
 */
export const useTaskAutoSave = (options?: UseTaskAutoSaveOptions) => {
  const { delay = 1500, enabled = true } = options || {};
  const { updateTask } = useAppContext();
  const pendingTasksRef = useRef<Map<string, Task>>(new Map());

  // Save all pending task changes
  const saveAllPendingTasks = useCallback(async () => {
    const pendingTasks = Array.from(pendingTasksRef.current.values());
    
    if (pendingTasks.length === 0) return;

    console.log(`Auto-save: Saving ${pendingTasks.length} pending task changes`);
    
    // Save all tasks in parallel
    const savePromises = pendingTasks.map(async (task) => {
      try {
        await updateTask(task);
        console.log(`Auto-save: Successfully saved task "${task.title}"`);
        return task.id;
      } catch (error) {
        console.error(`Auto-save: Failed to save task "${task.title}"`, error);
        throw error;
      }
    });

    try {
      const savedTaskIds = await Promise.all(savePromises);
      // Remove successfully saved tasks from pending
      savedTaskIds.forEach(taskId => {
        pendingTasksRef.current.delete(taskId);
      });
    } catch (error) {
      // If any saves failed, we keep the pending tasks for retry
      console.error('Auto-save: Some task saves failed', error);
      throw error;
    }
  }, [updateTask]);

  // Auto-save hook setup
  const { triggerSave, saveNow, hasPendingChanges } = useAutoSave({
    delay,
    enabled,
    onSave: saveAllPendingTasks,
    onPageHide: async () => {
      console.log('Auto-save: Page hiding, ensuring all task changes are saved');
      await saveAllPendingTasks();
    }
  });

  // Queue a task for auto-saving
  const queueTaskForSave = useCallback((task: Task) => {
    if (!enabled) return;

    console.log(`Auto-save: Queuing task "${task.title}" for save`);
    pendingTasksRef.current.set(task.id, task);
    triggerSave();
  }, [enabled, triggerSave]);

  // Save a specific task immediately
  const saveTaskNow = useCallback(async (task: Task) => {
    if (!enabled) return;

    try {
      await updateTask(task);
      pendingTasksRef.current.delete(task.id);
      console.log(`Auto-save: Immediately saved task "${task.title}"`);
    } catch (error) {
      console.error(`Auto-save: Failed to immediately save task "${task.title}"`, error);
      throw error;
    }
  }, [enabled, updateTask]);

  // Clear pending changes for a specific task (e.g., when manually saved)
  const clearPendingTask = useCallback((taskId: string) => {
    pendingTasksRef.current.delete(taskId);
  }, []);

  return {
    /**
     * Queue a task for auto-saving with debouncing
     */
    queueTaskForSave,
    
    /**
     * Save a specific task immediately (bypasses debouncing)
     */
    saveTaskNow,
    
    /**
     * Save all pending task changes immediately
     */
    saveAllNow: saveNow,
    
    /**
     * Clear pending changes for a specific task
     */
    clearPendingTask,
    
    /**
     * Check if there are any pending task changes
     */
    hasPendingChanges,
    
    /**
     * Get the list of task IDs that have pending changes
     */
    getPendingTaskIds: () => Array.from(pendingTasksRef.current.keys())
  };
};
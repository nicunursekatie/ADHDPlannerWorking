import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { useAppContext } from '../../context/AppContextSupabase';
import { Task } from '../../types';
import { DatabaseService } from '../../services/database';

interface DuplicateGroup {
  key: string;
  tasks: Task[];
  selectedToKeep: string | null;
}

export const DuplicateCleanup: React.FC = () => {
  const { user, tasks } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cleanupComplete, setCleanupComplete] = useState(false);
  
  useEffect(() => {
    if (tasks.length > 0) {
      analyzeDuplicates();
    }
  }, [tasks]);
  
  const analyzeDuplicates = () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Group tasks by a combination of title and description to identify duplicates
      const taskGroups = new Map<string, Task[]>();
      
      tasks.forEach(task => {
        // Create a key based on title and description (normalized)
        const key = `${task.title.trim().toLowerCase()}|${(task.description || '').trim().toLowerCase()}`;
        
        if (!taskGroups.has(key)) {
          taskGroups.set(key, []);
        }
        taskGroups.get(key)!.push(task);
      });
      
      // Filter to only groups with duplicates (more than 1 task)
      const duplicates: DuplicateGroup[] = [];
      taskGroups.forEach((groupTasks, key) => {
        if (groupTasks.length > 1) {
          // Sort by creation date, keeping the oldest as the suggested one to keep
          const sortedTasks = groupTasks.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          duplicates.push({
            key,
            tasks: sortedTasks,
            selectedToKeep: sortedTasks[0].id // Default to keeping the oldest
          });
        }
      });
      
      setDuplicateGroups(duplicates);
    } catch (err) {
      console.error('Error analyzing duplicates:', err);
      setError('Failed to analyze duplicates');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleKeepSelection = (groupKey: string, taskId: string) => {
    setDuplicateGroups(prev =>
      prev.map(group =>
        group.key === groupKey
          ? { ...group, selectedToKeep: taskId }
          : group
      )
    );
  };
  
  const cleanupDuplicates = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    setIsCleaningUp(true);
    setError(null);
    
    try {
      let totalDeleted = 0;
      
      for (const group of duplicateGroups) {
        if (!group.selectedToKeep) continue;
        
        // Delete all tasks except the selected one to keep
        const tasksToDelete = group.tasks.filter(task => task.id !== group.selectedToKeep);
        
        for (const task of tasksToDelete) {
          try {
            await DatabaseService.deleteTask(task.id, user.id);
            totalDeleted++;
            console.log(`Deleted duplicate task: ${task.title} (ID: ${task.id})`);
          } catch (err) {
            console.error(`Failed to delete task ${task.id}:`, err);
            setError(`Failed to delete some tasks. Partial cleanup completed.`);
          }
        }
      }
      
      console.log(`Cleanup completed. Deleted ${totalDeleted} duplicate tasks.`);
      setCleanupComplete(true);
      
      // Clear duplicate groups since cleanup is done
      setDuplicateGroups([]);
      
    } catch (err) {
      console.error('Cleanup error:', err);
      setError('Cleanup failed. Please try again.');
    } finally {
      setIsCleaningUp(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (!user) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to clean up duplicate tasks.
          </p>
        </div>
      </Card>
    );
  }
  
  if (isAnalyzing) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Tasks</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Checking for duplicate tasks...
          </p>
        </div>
      </Card>
    );
  }
  
  if (cleanupComplete) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Cleanup Complete</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Duplicate tasks have been successfully removed from your database.
          </p>
          <Button
            onClick={() => {
              setCleanupComplete(false);
              analyzeDuplicates();
            }}
            variant="secondary"
            className="mt-4"
          >
            Analyze Again
          </Button>
        </div>
      </Card>
    );
  }
  
  if (duplicateGroups.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your task database looks clean! No duplicate tasks were detected.
          </p>
          <Button
            onClick={analyzeDuplicates}
            variant="secondary"
            className="mt-4"
          >
            Analyze Again
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <Users className="w-6 h-6 text-amber-500 mr-3" />
        <h2 className="text-xl font-semibold">Duplicate Task Cleanup</h2>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Found {duplicateGroups.length} groups of duplicate tasks. 
          Select which version to keep for each group, then click "Clean Up Duplicates" to remove the others.
        </p>
        
        <div className="space-y-6">
          {duplicateGroups.map((group, groupIndex) => (
            <div key={group.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                Duplicate Group {groupIndex + 1} ({group.tasks.length} copies)
              </h4>
              
              <div className="space-y-3">
                {group.tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded border-2 transition-colors ${
                      group.selectedToKeep === task.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`group-${group.key}`}
                            checked={group.selectedToKeep === task.id}
                            onChange={() => handleKeepSelection(group.key, task.id)}
                            className="w-4 h-4 text-green-600"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Created: {formatDate(task.createdAt)}</span>
                              <span>Updated: {formatDate(task.updatedAt)}</span>
                              <span>ID: {task.id.slice(0, 8)}...</span>
                              {task.completed && (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {group.selectedToKeep === task.id && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="w-5 h-5 mr-1" />
                          <span className="text-sm font-medium">Keep</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isCleaningUp 
            ? 'Cleanup in progress. Please do not close this window...' 
            : `Ready to clean up ${duplicateGroups.reduce((total, group) => total + group.tasks.length - 1, 0)} duplicate tasks.`}
        </p>
        <div className="space-x-3">
          <Button
            onClick={analyzeDuplicates}
            disabled={isCleaningUp}
            variant="secondary"
          >
            Re-analyze
          </Button>
          <Button
            onClick={cleanupDuplicates}
            disabled={isCleaningUp || duplicateGroups.some(group => !group.selectedToKeep)}
            variant="danger"
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cleaning Up...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Up Duplicates
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
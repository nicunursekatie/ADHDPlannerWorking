import React, { useState, useEffect } from 'react';
import { Upload, Database, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import * as localStorage from '../../utils/localStorage';
import { DatabaseService } from '../../services/database';
import { useAppContext } from '../../context/AppContextSupabase';
import { DailyPlan } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

// Helper to ensure timestamps are in ISO format
const ensureTimestamp = (date: string | null | undefined): string | null => {
  if (!date) return null;
  try {
    return new Date(date).toISOString();
  } catch {
    return null;
  }
};

interface MigrationStatus {
  tasks: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
  projects: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
  categories: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
  recurringTasks: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
  dailyPlans: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
  journalEntries: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
  workSchedules: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
  settings: { total: number; migrated: number; status: 'pending' | 'migrating' | 'completed' | 'error' };
}

export const DataMigration: React.FC = () => {
  const { user } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localDataExists, setLocalDataExists] = useState(false);
  
  useEffect(() => {
    analyzeLocalData();
  }, []);
  
  const analyzeLocalData = () => {
    setIsAnalyzing(true);
    try {
      const tasks = localStorage.getTasks();
      const projects = localStorage.getProjects();
      const categories = localStorage.getCategories();
      const recurringTasks = localStorage.getRecurringTasks();
      const dailyPlans = localStorage.getDailyPlans();
      const journalEntries = localStorage.getJournalEntries();
      const workSchedule = localStorage.getWorkSchedule();
      const settings = localStorage.getSettings();
      
      const hasData = tasks.length > 0 || projects.length > 0 || categories.length > 0;
      setLocalDataExists(hasData);
      
      if (hasData) {
        setMigrationStatus({
          tasks: { total: tasks.length, migrated: 0, status: 'pending' },
          projects: { total: projects.length, migrated: 0, status: 'pending' },
          categories: { total: categories.length, migrated: 0, status: 'pending' },
          recurringTasks: { total: recurringTasks.length, migrated: 0, status: 'pending' },
          dailyPlans: { total: dailyPlans.length, migrated: 0, status: 'pending' },
          journalEntries: { total: journalEntries.length, migrated: 0, status: 'pending' },
          workSchedules: { total: workSchedule ? 1 : 0, migrated: 0, status: 'pending' },
          settings: { total: settings ? 1 : 0, migrated: 0, status: 'pending' },
        });
      }
    } catch (err) {
      console.error('Error analyzing local data:', err);
      setError('Failed to analyze local data');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const migrateData = async () => {
    if (!user || !migrationStatus) return;
    
    setIsMigrating(true);
    setError(null);
    
    try {
      // Migrate Projects first (as tasks depend on them)
      console.log('Starting project migration...');
      setMigrationStatus(prev => prev ? {
        ...prev,
        projects: { ...prev.projects, status: 'migrating' }
      } : null);
      
      const projects = localStorage.getProjects();
      console.log('Found projects to migrate:', projects.length, projects);
      const projectIdMap = new Map<string, string>(); // oldId -> newId
      
      for (const project of projects) {
        try {
          const newId = uuidv4();
          const projectWithNewId = {
            ...project,
            id: newId,
            createdAt: ensureTimestamp(project.createdAt) || new Date().toISOString(),
            updatedAt: ensureTimestamp(project.updatedAt) || new Date().toISOString()
          };
          
          await DatabaseService.createProject(projectWithNewId, user.id);
          projectIdMap.set(project.id, newId);
          
          setMigrationStatus(prev => prev ? {
            ...prev,
            projects: { ...prev.projects, migrated: prev.projects.migrated + 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating project:', project, err);
          setError(`Failed to migrate project "${project.name}": ${err.message || err}`);
          return; // Stop migration on error
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        projects: { ...prev.projects, status: 'completed' }
      } : null);
      
      // Migrate Categories
      console.log('Starting category migration...');
      setMigrationStatus(prev => prev ? {
        ...prev,
        categories: { ...prev.categories, status: 'migrating' }
      } : null);
      
      const categories = localStorage.getCategories();
      console.log('Found categories to migrate:', categories.length, categories);
      const categoryIdMap = new Map<string, string>(); // oldId -> newId
      
      for (const category of categories) {
        try {
          const newId = uuidv4();
          const categoryWithNewId = {
            ...category,
            id: newId,
            createdAt: ensureTimestamp(category.createdAt) || new Date().toISOString(),
            updatedAt: ensureTimestamp(category.updatedAt) || new Date().toISOString()
          };
          
          await DatabaseService.createCategory(categoryWithNewId, user.id);
          categoryIdMap.set(category.id, newId);
          
          setMigrationStatus(prev => prev ? {
            ...prev,
            categories: { ...prev.categories, migrated: prev.categories.migrated + 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating category:', category, err);
          setError(`Failed to migrate category "${category.name}": ${err.message || err}`);
          return; // Stop migration on error
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        categories: { ...prev.categories, status: 'completed' }
      } : null);
      
      // Migrate Tasks (including subtasks and dependencies)
      setMigrationStatus(prev => prev ? {
        ...prev,
        tasks: { ...prev.tasks, status: 'migrating' }
      } : null);
      
      const tasks = localStorage.getTasks();
      
      // First pass: Create all tasks without parent references
      const taskIdMap = new Map<string, string>(); // oldId -> newId
      console.log('Starting first pass: creating tasks...');
      
      for (const task of tasks) {
        try {
          const newId = uuidv4();
          const taskCopy = {
            ...task,
            id: newId,
            // Update project reference if it exists
            projectId: task.projectId ? projectIdMap.get(task.projectId) || null : null,
            // Update category references
            categoryIds: task.categoryIds?.map(catId => categoryIdMap.get(catId)).filter(Boolean) || [],
            // Temporarily remove parent task reference
            parentTaskId: null,
            // Ensure timestamps are proper
            createdAt: ensureTimestamp(task.createdAt) || new Date().toISOString(),
            updatedAt: ensureTimestamp(task.updatedAt) || new Date().toISOString(),
            dueDate: ensureTimestamp(task.dueDate),
            completedAt: ensureTimestamp(task.completedAt),
            deletedAt: ensureTimestamp(task.deletedAt)
          };
          
          const createdTask = await DatabaseService.createTask(taskCopy, user.id);
          taskIdMap.set(task.id, newId);
          
          setMigrationStatus(prev => prev ? {
            ...prev,
            tasks: { ...prev.tasks, migrated: prev.tasks.migrated + 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating task:', task, err);
          setError(`Failed to migrate task "${task.title}": ${err.message || err}`);
          // Don't return here - continue with other tasks but note the failure
          console.warn(`Skipping task "${task.title}" due to migration error`);
        }
      }
      
      // Second pass: Update parent references and dependencies
      console.log('Starting second pass: updating task relationships...');
      console.log('Task ID mappings:', Array.from(taskIdMap.entries()));
      
      for (const task of tasks) {
        const newTaskId = taskIdMap.get(task.id);
        if (!newTaskId) {
          console.warn(`Task ID ${task.id} not found in mapping for task "${task.title}"`);
          continue;
        }
        
        const updates: any = {};
        let needsUpdate = false;
        
        // Update parent task reference
        if (task.parentTaskId) {
          const newParentId = taskIdMap.get(task.parentTaskId);
          if (newParentId) {
            updates.parentTaskId = newParentId;
            needsUpdate = true;
          } else {
            console.warn(`Parent task ID ${task.parentTaskId} not found in mapping for task "${task.title}"`);
          }
        }
        
        // Update subtask references
        if (task.subtasks && task.subtasks.length > 0) {
          updates.subtasks = task.subtasks
            .map(oldId => {
              const newId = taskIdMap.get(oldId);
              if (!newId) {
                console.warn(`Subtask ID ${oldId} not found in mapping for task "${task.title}"`);
              }
              return newId;
            })
            .filter((id): id is string => id !== undefined);
          if (updates.subtasks.length > 0) needsUpdate = true;
        }
        
        // Update dependency references
        if (task.dependsOn && task.dependsOn.length > 0) {
          updates.dependsOn = task.dependsOn
            .map(oldId => {
              const newId = taskIdMap.get(oldId);
              if (!newId) {
                console.warn(`Dependency ID ${oldId} not found in mapping for task "${task.title}"`);
              }
              return newId;
            })
            .filter((id): id is string => id !== undefined);
          if (updates.dependsOn.length > 0) needsUpdate = true;
        }
        
        if (task.dependedOnBy && task.dependedOnBy.length > 0) {
          updates.dependedOnBy = task.dependedOnBy
            .map(oldId => {
              const newId = taskIdMap.get(oldId);
              if (!newId) {
                console.warn(`Depended-on-by ID ${oldId} not found in mapping for task "${task.title}"`);
              }
              return newId;
            })
            .filter((id): id is string => id !== undefined);
          if (updates.dependedOnBy.length > 0) needsUpdate = true;
        }
        
        if (needsUpdate) {
          // Validate that all IDs are valid UUIDs before attempting update
          const validateUuid = (id: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
          };
          
          // Use direct Supabase update with snake_case field names
          const dbUpdates: any = {};
          
          if (updates.parentTaskId) {
            if (validateUuid(updates.parentTaskId)) {
              dbUpdates.parent_task_id = updates.parentTaskId;
            } else {
              console.warn(`Invalid UUID for parent task: ${updates.parentTaskId}`);
            }
          }
          
          if (updates.subtasks && updates.subtasks.length > 0) {
            const validSubtasks = updates.subtasks.filter(validateUuid);
            if (validSubtasks.length > 0) {
              dbUpdates.subtasks = validSubtasks;
            }
            if (validSubtasks.length !== updates.subtasks.length) {
              console.warn(`Some subtask UUIDs were invalid for task "${task.title}"`);
            }
          }
          
          if (updates.dependsOn && updates.dependsOn.length > 0) {
            const validDependsOn = updates.dependsOn.filter(validateUuid);
            if (validDependsOn.length > 0) {
              dbUpdates.depends_on = validDependsOn;
            }
            if (validDependsOn.length !== updates.dependsOn.length) {
              console.warn(`Some dependency UUIDs were invalid for task "${task.title}"`);
            }
          }
          
          if (updates.dependedOnBy && updates.dependedOnBy.length > 0) {
            const validDependedOnBy = updates.dependedOnBy.filter(validateUuid);
            if (validDependedOnBy.length > 0) {
              dbUpdates.depended_on_by = validDependedOnBy;
            }
            if (validDependedOnBy.length !== updates.dependedOnBy.length) {
              console.warn(`Some depended-on-by UUIDs were invalid for task "${task.title}"`);
            }
          }
          
          // Only update if we have valid data
          if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase
              .from('tasks')
              .update(dbUpdates)
              .eq('id', newTaskId)
              .eq('user_id', user.id);
            
            if (error) {
              console.error('Error updating task relationships for task:', task.title, error);
              setError(`Failed to update relationships for task "${task.title}": ${error.message}`);
            }
          }
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        tasks: { ...prev.tasks, status: 'completed' }
      } : null);
      
      console.log('Task migration completed. Summary:');
      console.log(`- Tasks migrated: ${taskIdMap.size}/${tasks.length}`);
      console.log(`- Task ID mappings created: ${taskIdMap.size}`);
      
      // Migrate Recurring Tasks
      setMigrationStatus(prev => prev ? {
        ...prev,
        recurringTasks: { ...prev.recurringTasks, status: 'migrating' }
      } : null);
      
      const recurringTasks = localStorage.getRecurringTasks();
      for (const recurringTask of recurringTasks) {
        try {
          const newId = uuidv4();
          const recurringTaskWithNewId = {
            ...recurringTask,
            id: newId,
            projectId: recurringTask.projectId ? projectIdMap.get(recurringTask.projectId) || null : null,
            categoryIds: recurringTask.categoryIds?.map(catId => categoryIdMap.get(catId)).filter(Boolean) || [],
            createdAt: ensureTimestamp(recurringTask.createdAt) || new Date().toISOString(),
            updatedAt: ensureTimestamp(recurringTask.updatedAt) || new Date().toISOString(),
            nextDue: ensureTimestamp(recurringTask.nextDue) || new Date().toISOString(),
            lastGenerated: ensureTimestamp(recurringTask.lastGenerated)
          };
          
          await DatabaseService.createRecurringTask(recurringTaskWithNewId, user.id);
          
          setMigrationStatus(prev => prev ? {
            ...prev,
            recurringTasks: { ...prev.recurringTasks, migrated: prev.recurringTasks.migrated + 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating recurring task:', recurringTask, err);
          setError(`Failed to migrate recurring task "${recurringTask.title}": ${err.message || err}`);
          return; // Stop migration on error
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        recurringTasks: { ...prev.recurringTasks, status: 'completed' }
      } : null);
      
      // Migrate Daily Plans
      setMigrationStatus(prev => prev ? {
        ...prev,
        dailyPlans: { ...prev.dailyPlans, status: 'migrating' }
      } : null);
      
      const dailyPlans = localStorage.getDailyPlans();
      console.log('Found daily plans to migrate:', dailyPlans.length, dailyPlans);
      for (const plan of dailyPlans) {
        try {
          // Update task IDs in time blocks
          const updatedPlan = {
            ...plan,
            timeBlocks: plan.timeBlocks.map(block => ({
              ...block,
              taskIds: block.taskIds
                ?.map(oldId => taskIdMap.get(oldId))
                .filter((id): id is string => id !== undefined) || [],
              taskId: block.taskId ? taskIdMap.get(block.taskId) || null : null
            }))
          };
          
          console.log('Migrating daily plan:', updatedPlan);
          await DatabaseService.saveDailyPlan(updatedPlan, user.id);
          setMigrationStatus(prev => prev ? {
            ...prev,
            dailyPlans: { ...prev.dailyPlans, migrated: prev.dailyPlans.migrated + 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating daily plan:', plan, err);
          setError(`Failed to migrate daily plan for "${plan.date}": ${err.message || err}`);
          return; // Stop migration on error
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        dailyPlans: { ...prev.dailyPlans, status: 'completed' }
      } : null);
      
      // Migrate Journal Entries
      setMigrationStatus(prev => prev ? {
        ...prev,
        journalEntries: { ...prev.journalEntries, status: 'migrating' }
      } : null);
      
      const journalEntries = localStorage.getJournalEntries();
      console.log('Found journal entries to migrate:', journalEntries.length, journalEntries);
      for (const entry of journalEntries) {
        try {
          console.log('Migrating journal entry:', entry);
          await DatabaseService.createJournalEntry(entry, user.id);
          setMigrationStatus(prev => prev ? {
            ...prev,
            journalEntries: { ...prev.journalEntries, migrated: prev.journalEntries.migrated + 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating journal entry:', entry, err);
          setError(`Failed to migrate journal entry for date "${entry.date}": ${err.message || err}`);
          return; // Stop migration on error
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        journalEntries: { ...prev.journalEntries, status: 'completed' }
      } : null);
      
      // Migrate Work Schedule
      setMigrationStatus(prev => prev ? {
        ...prev,
        workSchedules: { ...prev.workSchedules, status: 'migrating' }
      } : null);
      
      const workSchedule = localStorage.getWorkSchedule();
      console.log('Found work schedule to migrate:', workSchedule);
      if (workSchedule) {
        try {
          console.log('Migrating work schedule:', workSchedule);
          await DatabaseService.createWorkSchedule(workSchedule, user.id);
          setMigrationStatus(prev => prev ? {
            ...prev,
            workSchedules: { ...prev.workSchedules, migrated: 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating work schedule:', workSchedule, err);
          setError(`Failed to migrate work schedule: ${err.message || err}`);
          return; // Stop migration on error
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        workSchedules: { ...prev.workSchedules, status: 'completed' }
      } : null);
      
      // Migrate Settings
      setMigrationStatus(prev => prev ? {
        ...prev,
        settings: { ...prev.settings, status: 'migrating' }
      } : null);
      
      const settings = localStorage.getSettings();
      console.log('Found settings to migrate:', settings);
      if (settings) {
        try {
          console.log('Migrating settings:', settings);
          await DatabaseService.saveSettings(settings, user.id);
          setMigrationStatus(prev => prev ? {
            ...prev,
            settings: { ...prev.settings, migrated: 1 }
          } : null);
        } catch (err: any) {
          console.error('Error migrating settings:', settings, err);
          setError(`Failed to migrate settings: ${err.message || err}`);
          return; // Stop migration on error
        }
      }
      
      setMigrationStatus(prev => prev ? {
        ...prev,
        settings: { ...prev.settings, status: 'completed' }
      } : null);
      
      // Check if all migrations completed successfully
      const allCompleted = migrationStatus && Object.values(migrationStatus).every(
        item => item.status === 'completed' || item.total === 0
      );
      
      if (allCompleted) {
        console.log('Migration completed successfully!');
        // Optional: Clear localStorage after migration
        // localStorage.resetData();
      } else {
        console.log('Migration completed with some issues');
      }
      
    } catch (err) {
      console.error('Migration error:', err);
      setError('Migration failed. Please try again.');
    } finally {
      setIsMigrating(false);
    }
  };
  
  const getStatusIcon = (status: 'pending' | 'migrating' | 'completed' | 'error') => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case 'migrating':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };
  
  const getProgressPercentage = (item: { total: number; migrated: number }) => {
    if (item.total === 0) return 100;
    return Math.round((item.migrated / item.total) * 100);
  };
  
  if (!user) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to migrate your local data to the cloud.
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
          <h3 className="text-lg font-semibold mb-2">Analyzing Local Data</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Checking for existing data in local storage...
          </p>
        </div>
      </Card>
    );
  }
  
  if (!localDataExists) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Local Data Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            There is no local data to migrate. You're all set!
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <Upload className="w-6 h-6 text-amber-500 mr-3" />
        <h2 className="text-xl font-semibold">Data Migration</h2>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      {migrationStatus && (
        <div className="space-y-4 mb-6">
          {Object.entries(migrationStatus).map(([key, item]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(item.status)}
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-sm text-gray-500">
                  ({item.migrated}/{item.total})
                </span>
              </div>
              <div className="w-32">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(item)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isMigrating 
            ? 'Migration in progress. Please do not close this window...' 
            : 'Ready to migrate your local data to the cloud.'}
        </p>
        <Button
          onClick={migrateData}
          disabled={isMigrating}
          variant="primary"
        >
          {isMigrating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Migrating...
            </>
          ) : (
            'Start Migration'
          )}
        </Button>
      </div>
    </Card>
  );
};
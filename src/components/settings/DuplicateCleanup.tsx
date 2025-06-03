import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { useAppContext } from '../../context/AppContextSupabase';
import { Task, Project } from '../../types';
import { DatabaseService } from '../../services/database';

interface DuplicateTaskGroup {
  key: string;
  tasks: Task[];
  selectedToKeep: string | null;
}

interface DuplicateProjectGroup {
  key: string;
  projects: Project[];
  selectedToKeep: string | null;
}

type DuplicateGroup = DuplicateTaskGroup | DuplicateProjectGroup;

export const DuplicateCleanup: React.FC = () => {
  const { user, tasks, projects } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [duplicateTaskGroups, setDuplicateTaskGroups] = useState<DuplicateTaskGroup[]>([]);
  const [duplicateProjectGroups, setDuplicateProjectGroups] = useState<DuplicateProjectGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [error, setError] = useState<string | null>(null);
  const [cleanupComplete, setCleanupComplete] = useState(false);
  
  useEffect(() => {
    if (tasks.length > 0 || projects.length > 0) {
      analyzeDuplicates();
    }
  }, [tasks, projects]);
  
  const analyzeDuplicates = () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Analyze task duplicates
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
      const duplicateTasks: DuplicateTaskGroup[] = [];
      taskGroups.forEach((groupTasks, key) => {
        if (groupTasks.length > 1) {
          // Sort by creation date, keeping the oldest as the suggested one to keep
          const sortedTasks = groupTasks.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          duplicateTasks.push({
            key,
            tasks: sortedTasks,
            selectedToKeep: sortedTasks[0].id // Default to keeping the oldest
          });
        }
      });
      
      // Analyze project duplicates
      const projectGroups = new Map<string, Project[]>();
      
      projects.forEach(project => {
        // Create a key based on name and description (normalized)
        const key = `${project.name.trim().toLowerCase()}|${(project.description || '').trim().toLowerCase()}`;
        
        if (!projectGroups.has(key)) {
          projectGroups.set(key, []);
        }
        projectGroups.get(key)!.push(project);
      });
      
      // Filter to only groups with duplicates (more than 1 project)
      const duplicateProjects: DuplicateProjectGroup[] = [];
      projectGroups.forEach((groupProjects, key) => {
        if (groupProjects.length > 1) {
          // Sort by creation date, keeping the oldest as the suggested one to keep
          const sortedProjects = groupProjects.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          duplicateProjects.push({
            key,
            projects: sortedProjects,
            selectedToKeep: sortedProjects[0].id // Default to keeping the oldest
          });
        }
      });
      
      setDuplicateTaskGroups(duplicateTasks);
      setDuplicateProjectGroups(duplicateProjects);
    } catch (err) {
      console.error('Error analyzing duplicates:', err);
      setError('Failed to analyze duplicates');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleTaskKeepSelection = (groupKey: string, taskId: string) => {
    setDuplicateTaskGroups(prev =>
      prev.map(group =>
        group.key === groupKey
          ? { ...group, selectedToKeep: taskId }
          : group
      )
    );
  };
  
  const handleProjectKeepSelection = (groupKey: string, projectId: string) => {
    setDuplicateProjectGroups(prev =>
      prev.map(group =>
        group.key === groupKey
          ? { ...group, selectedToKeep: projectId }
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
      let totalDeletedTasks = 0;
      let totalDeletedProjects = 0;
      
      // Clean up duplicate tasks
      if (activeTab === 'tasks') {
        for (const group of duplicateTaskGroups) {
          if (!group.selectedToKeep) continue;
          
          // Delete all tasks except the selected one to keep
          const tasksToDelete = group.tasks.filter(task => task.id !== group.selectedToKeep);
          
          for (const task of tasksToDelete) {
            try {
              await DatabaseService.deleteTask(task.id, user.id);
              totalDeletedTasks++;
              console.log(`Deleted duplicate task: ${task.title} (ID: ${task.id})`);
            } catch (err) {
              console.error(`Failed to delete task ${task.id}:`, err);
              setError(`Failed to delete some tasks. Partial cleanup completed.`);
            }
          }
        }
      } else {
        // Clean up duplicate projects
        for (const group of duplicateProjectGroups) {
          if (!group.selectedToKeep) continue;
          
          // Delete all projects except the selected one to keep
          const projectsToDelete = group.projects.filter(project => project.id !== group.selectedToKeep);
          
          for (const project of projectsToDelete) {
            try {
              await DatabaseService.deleteProject(project.id, user.id);
              totalDeletedProjects++;
              console.log(`Deleted duplicate project: ${project.name} (ID: ${project.id})`);
            } catch (err) {
              console.error(`Failed to delete project ${project.id}:`, err);
              setError(`Failed to delete some projects. Partial cleanup completed.`);
            }
          }
        }
      }
      
      const totalDeleted = totalDeletedTasks + totalDeletedProjects;
      const itemType = activeTab === 'tasks' ? 'tasks' : 'projects';
      console.log(`Cleanup completed. Deleted ${totalDeleted} duplicate ${itemType}.`);
      setCleanupComplete(true);
      
      // Clear duplicate groups since cleanup is done
      if (activeTab === 'tasks') {
        setDuplicateTaskGroups([]);
      } else {
        setDuplicateProjectGroups([]);
      }
      
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
            Please sign in to clean up duplicate tasks and projects.
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
  
  const currentGroups = activeTab === 'tasks' ? duplicateTaskGroups : duplicateProjectGroups;
  const hasAnyDuplicates = duplicateTaskGroups.length > 0 || duplicateProjectGroups.length > 0;
  
  if (!hasAnyDuplicates) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your database looks clean! No duplicate tasks or projects were detected.
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
        <h2 className="text-xl font-semibold">Duplicate Cleanup</h2>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Tasks ({duplicateTaskGroups.length} groups)
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Projects ({duplicateProjectGroups.length} groups)
          </button>
        </nav>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {activeTab === 'tasks' ? (
            <>Found {duplicateTaskGroups.length} groups of duplicate tasks.</>
          ) : (
            <>Found {duplicateProjectGroups.length} groups of duplicate projects.</>
          )}
          {' '}Select which version to keep for each group, then click "Clean Up Duplicates" to remove the others.
        </p>
        
        <div className="space-y-6">
          {currentGroups.length === 0 ? (
            <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No duplicate {activeTab === 'tasks' ? 'tasks' : 'projects'} found.
                {hasAnyDuplicates && activeTab === 'tasks' && duplicateProjectGroups.length > 0 && (
                  <> Check the Projects tab for duplicate projects.</>
                )}
                {hasAnyDuplicates && activeTab === 'projects' && duplicateTaskGroups.length > 0 && (
                  <> Check the Tasks tab for duplicate tasks.</>
                )}
              </p>
            </div>
          ) : activeTab === 'tasks' ? (
            // Render task duplicates
            duplicateTaskGroups.map((group, groupIndex) => (
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
                              onChange={() => handleTaskKeepSelection(group.key, task.id)}
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
            ))
          ) : (
            // Render project duplicates
            duplicateProjectGroups.map((group, groupIndex) => (
              <div key={group.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                  Duplicate Group {groupIndex + 1} ({group.projects.length} copies)
                </h4>
                
                <div className="space-y-3">
                  {group.projects.map(project => (
                    <div
                      key={project.id}
                      className={`p-3 rounded border-2 transition-colors ${
                        group.selectedToKeep === project.id
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
                              checked={group.selectedToKeep === project.id}
                              onChange={() => handleProjectKeepSelection(group.key, project.id)}
                              className="w-4 h-4 text-green-600"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>Created: {formatDate(project.createdAt)}</span>
                                <span>Updated: {formatDate(project.updatedAt)}</span>
                                <span>ID: {project.id.slice(0, 8)}...</span>
                                <span className="px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: project.color }}>
                                  {project.color}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {group.selectedToKeep === project.id && (
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
            ))
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isCleaningUp 
            ? 'Cleanup in progress. Please do not close this window...' 
            : activeTab === 'tasks'
              ? `Ready to clean up ${duplicateTaskGroups.reduce((total, group) => total + group.tasks.length - 1, 0)} duplicate tasks.`
              : `Ready to clean up ${duplicateProjectGroups.reduce((total, group) => total + group.projects.length - 1, 0)} duplicate projects.`}
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
            disabled={isCleaningUp || currentGroups.length === 0 || (activeTab === 'tasks' 
              ? duplicateTaskGroups.some(group => !group.selectedToKeep)
              : duplicateProjectGroups.some(group => !group.selectedToKeep))}
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
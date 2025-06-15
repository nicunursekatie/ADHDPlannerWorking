import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle, XCircle, Loader2, Users, Tag } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { useAppContext } from '../../context/AppContextSupabase';
import { Task, Project, Category } from '../../types';

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

interface DuplicateCategoryGroup {
  key: string;
  categories: Category[];
  selectedToKeep: string | null;
}

type DuplicateGroup = DuplicateTaskGroup | DuplicateProjectGroup | DuplicateCategoryGroup;

export const DuplicateCleanup: React.FC = () => {
  const { user, tasks, projects, categories, deleteTask, deleteProject, deleteCategory } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [duplicateTaskGroups, setDuplicateTaskGroups] = useState<DuplicateTaskGroup[]>([]);
  const [duplicateProjectGroups, setDuplicateProjectGroups] = useState<DuplicateProjectGroup[]>([]);
  const [duplicateCategoryGroups, setDuplicateCategoryGroups] = useState<DuplicateCategoryGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'categories'>('tasks');
  const [error, setError] = useState<string | null>(null);
  const [cleanupComplete, setCleanupComplete] = useState(false);
  
  useEffect(() => {
    console.log('=== DuplicateCleanup useEffect triggered ===');
    console.log('tasks.length:', tasks.length);
    console.log('projects.length:', projects.length);
    console.log('categories.length:', categories.length);
    
    if (tasks.length > 0 || projects.length > 0 || categories.length > 0) {
      analyzeDuplicates();
    }
  }, [tasks, projects, categories]);
  
  const analyzeDuplicates = () => {
    setIsAnalyzing(true);
    setError(null);
    
    console.log('=== ANALYZE DUPLICATES CALLED ===');
    console.log('Projects from context:', projects);
    console.log('Projects length:', projects.length);
    console.log('Tasks length:', tasks.length);
    
    try {
      // Analyze task duplicates
      const taskGroups = new Map<string, Task[]>();
      
      tasks.forEach(task => {
        // Create a key based on title and description (normalized)
        const titlePart = (task.title || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Normalize whitespace
        const descPart = (task.description || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Normalize whitespace
        const key = `${titlePart}|${descPart}`;
        
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
      
      console.log('=== PROJECT DUPLICATE ANALYSIS DEBUG ===');
      console.log('Number of projects being analyzed:', projects.length);
      
      // Log first 5 projects for inspection
      console.log('First 5 projects:');
      projects.slice(0, 5).forEach((project, index) => {
        console.log(`Project ${index + 1}:`, {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt
        });
      });
      
      // Try two strategies for duplicate detection
      // Strategy 1: Exact match on name + description
      projects.forEach((project, index) => {
        // Create a key based on name and description (normalized)
        // Handle null, undefined, and whitespace-only values
        // Also normalize multiple spaces and special whitespace characters
        const namePart = (project.name || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Replace multiple spaces/tabs/newlines with single space
        const descPart = (project.description || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Replace multiple spaces/tabs/newlines with single space
        const key = `${namePart}|${descPart}`;
        
        // Log key generation for first 5 projects
        if (index < 5) {
          console.log(`Key for project "${project.name}":`, {
            originalName: project.name,
            originalDesc: project.description,
            namePart,
            descPart,
            finalKey: key
          });
        }
        
        if (!projectGroups.has(key)) {
          projectGroups.set(key, []);
        }
        projectGroups.get(key)!.push(project);
      });
      
      // Strategy 2: Also check for duplicates based on name only (case-insensitive)
      const nameOnlyGroups = new Map<string, Project[]>();
      projects.forEach(project => {
        const nameKey = (project.name || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Normalize whitespace
        if (nameKey) { // Only process if name is not empty
          if (!nameOnlyGroups.has(nameKey)) {
            nameOnlyGroups.set(nameKey, []);
          }
          nameOnlyGroups.get(nameKey)!.push(project);
        }
      });
      
      console.log('\n=== Alternative detection (name only) ===');
      nameOnlyGroups.forEach((group, key) => {
        if (group.length > 1) {
          console.log(`Projects with same name "${key}":`, group.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description?.substring(0, 50) + (p.description && p.description.length > 50 ? '...' : '')
          })));
        }
      });
      
      console.log('projectGroups Map after processing:');
      console.log('Total unique keys:', projectGroups.size);
      
      // Log groups with more than 1 project
      let groupsWithDuplicates = 0;
      projectGroups.forEach((groupProjects, key) => {
        if (groupProjects.length > 1) {
          groupsWithDuplicates++;
          console.log(`Duplicate group found for key "${key}":`, {
            count: groupProjects.length,
            projects: groupProjects.map(p => ({ id: p.id, name: p.name }))
          });
        }
      });
      console.log('Total groups with more than 1 project:', groupsWithDuplicates);
      
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
      
      console.log('Final duplicateProjects array length:', duplicateProjects.length);
      console.log('=== END PROJECT DUPLICATE ANALYSIS DEBUG ===');
      
      // Analyze category duplicates
      const categoryGroups = new Map<string, Category[]>();
      
      console.log('=== CATEGORY DUPLICATE ANALYSIS DEBUG ===');
      console.log('Number of categories being analyzed:', categories.length);
      
      categories.forEach((category, index) => {
        // Create a key based on name and color (normalized)
        const namePart = (category.name || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Replace multiple spaces with single space
        const colorPart = (category.color || '').toLowerCase();
        const key = `${namePart}|${colorPart}`;
        
        if (index < 5) {
          console.log(`Key for category "${category.name}":`, {
            originalName: category.name,
            originalColor: category.color,
            namePart,
            colorPart,
            finalKey: key
          });
        }
        
        if (!categoryGroups.has(key)) {
          categoryGroups.set(key, []);
        }
        categoryGroups.get(key)!.push(category);
      });
      
      // Filter to only groups with duplicates (more than 1 category)
      const duplicateCategories: DuplicateCategoryGroup[] = [];
      categoryGroups.forEach((groupCategories, key) => {
        if (groupCategories.length > 1) {
          // Sort by creation date, keeping the oldest as the suggested one to keep
          const sortedCategories = groupCategories.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          duplicateCategories.push({
            key,
            categories: sortedCategories,
            selectedToKeep: sortedCategories[0].id // Default to keeping the oldest
          });
        }
      });
      
      console.log('Final duplicateCategories array length:', duplicateCategories.length);
      console.log('=== END CATEGORY DUPLICATE ANALYSIS DEBUG ===');
      
      setDuplicateTaskGroups(duplicateTasks);
      setDuplicateProjectGroups(duplicateProjects);
      setDuplicateCategoryGroups(duplicateCategories);
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
  
  const handleCategoryKeepSelection = (groupKey: string, categoryId: string) => {
    setDuplicateCategoryGroups(prev =>
      prev.map(group =>
        group.key === groupKey
          ? { ...group, selectedToKeep: categoryId }
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
      let totalDeletedCategories = 0;
      
      // Clean up duplicate tasks
      if (activeTab === 'tasks') {
        for (const group of duplicateTaskGroups) {
          if (!group.selectedToKeep) continue;
          
          // Delete all tasks except the selected one to keep
          const tasksToDelete = group.tasks.filter(task => task.id !== group.selectedToKeep);
          
          for (const task of tasksToDelete) {
            try {
              await deleteTask(task.id);
              totalDeletedTasks++;
              console.log(`Deleted duplicate task: ${task.title} (ID: ${task.id})`);
            } catch (err) {
              console.error(`Failed to delete task ${task.id}:`, err);
              setError(`Failed to delete some tasks. Partial cleanup completed.`);
            }
          }
        }
      } else if (activeTab === 'projects') {
        // Clean up duplicate projects
        for (const group of duplicateProjectGroups) {
          if (!group.selectedToKeep) continue;
          
          // Delete all projects except the selected one to keep
          const projectsToDelete = group.projects.filter(project => project.id !== group.selectedToKeep);
          
          for (const project of projectsToDelete) {
            try {
              await deleteProject(project.id);
              totalDeletedProjects++;
              console.log(`Deleted duplicate project: ${project.name} (ID: ${project.id})`);
            } catch (err) {
              console.error(`Failed to delete project ${project.id}:`, err);
              setError(`Failed to delete some projects. Partial cleanup completed.`);
            }
          }
        }
      } else {
        // Clean up duplicate categories
        for (const group of duplicateCategoryGroups) {
          if (!group.selectedToKeep) continue;
          
          // Delete all categories except the selected one to keep
          const categoriesToDelete = group.categories.filter(category => category.id !== group.selectedToKeep);
          
          for (const category of categoriesToDelete) {
            try {
              await deleteCategory(category.id);
              totalDeletedCategories++;
              console.log(`Deleted duplicate category: ${category.name} (ID: ${category.id})`);
            } catch (err) {
              console.error(`Failed to delete category ${category.id}:`, err);
              setError(`Failed to delete some categories. Partial cleanup completed.`);
            }
          }
        }
      }
      
      const totalDeleted = totalDeletedTasks + totalDeletedProjects + totalDeletedCategories;
      const itemType = activeTab === 'tasks' ? 'tasks' : activeTab === 'projects' ? 'projects' : 'categories';
      console.log(`Cleanup completed. Deleted ${totalDeleted} duplicate ${itemType}.`);
      
      // Show success only if we actually deleted something
      if (totalDeleted > 0) {
        setCleanupComplete(true);
        // Clear duplicate groups since cleanup is done
        if (activeTab === 'tasks') {
          setDuplicateTaskGroups([]);
        } else if (activeTab === 'projects') {
          setDuplicateProjectGroups([]);
        } else {
          setDuplicateCategoryGroups([]);
        }
      } else {
        setError('No duplicates were deleted. Please check the console for errors.');
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
          <h3 className="text-lg font-semibold mb-2">Analyzing Data</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Checking for duplicate tasks, projects, and categories...
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
            Duplicate items have been successfully removed from your database.
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
  
  const currentGroups = activeTab === 'tasks' 
    ? duplicateTaskGroups 
    : activeTab === 'projects' 
      ? duplicateProjectGroups 
      : duplicateCategoryGroups;
  const hasAnyDuplicates = duplicateTaskGroups.length > 0 || duplicateProjectGroups.length > 0 || duplicateCategoryGroups.length > 0;
  
  if (!hasAnyDuplicates) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your database looks clean! No duplicate tasks, projects, or categories were detected.
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
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Categories ({duplicateCategoryGroups.length} groups)
          </button>
        </nav>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {activeTab === 'tasks' ? (
            <>Found {duplicateTaskGroups.length} groups of duplicate tasks.</>
          ) : activeTab === 'projects' ? (
            <>Found {duplicateProjectGroups.length} groups of duplicate projects.</>
          ) : (
            <>Found {duplicateCategoryGroups.length} groups of duplicate categories.</>
          )}
          {' '}Select which version to keep for each group, then click "Clean Up Duplicates" to remove the others.
        </p>
        
        <div className="space-y-6">
          {currentGroups.length === 0 ? (
            <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No duplicate {activeTab === 'tasks' ? 'tasks' : activeTab === 'projects' ? 'projects' : 'categories'} found.
                {hasAnyDuplicates && activeTab === 'tasks' && (duplicateProjectGroups.length > 0 || duplicateCategoryGroups.length > 0) && (
                  <> Check other tabs for duplicates.</>
                )}
                {hasAnyDuplicates && activeTab === 'projects' && (duplicateTaskGroups.length > 0 || duplicateCategoryGroups.length > 0) && (
                  <> Check other tabs for duplicates.</>
                )}
                {hasAnyDuplicates && activeTab === 'categories' && (duplicateTaskGroups.length > 0 || duplicateProjectGroups.length > 0) && (
                  <> Check other tabs for duplicates.</>
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
          ) : activeTab === 'projects' ? (
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
          ) : (
            // Render category duplicates
            duplicateCategoryGroups.map((group, groupIndex) => (
              <div key={group.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                  Duplicate Group {groupIndex + 1} ({group.categories.length} copies)
                </h4>
                
                <div className="space-y-3">
                  {group.categories.map(category => (
                    <div
                      key={category.id}
                      className={`p-3 rounded border-2 transition-colors ${
                        group.selectedToKeep === category.id
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
                              checked={group.selectedToKeep === category.id}
                              onChange={() => handleCategoryKeepSelection(group.key, category.id)}
                              className="w-4 h-4 text-green-600"
                            />
                            <div>
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                                  style={{ backgroundColor: category.color }}
                                />
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {category.name}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>Created: {formatDate(category.createdAt)}</span>
                                <span>Updated: {formatDate(category.updatedAt)}</span>
                                <span>ID: {category.id.slice(0, 8)}...</span>
                                <span>Color: {category.color}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {group.selectedToKeep === category.id && (
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
              : activeTab === 'projects'
                ? `Ready to clean up ${duplicateProjectGroups.reduce((total, group) => total + group.projects.length - 1, 0)} duplicate projects.`
                : `Ready to clean up ${duplicateCategoryGroups.reduce((total, group) => total + group.categories.length - 1, 0)} duplicate categories.`}
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
              : activeTab === 'projects'
                ? duplicateProjectGroups.some(group => !group.selectedToKeep)
                : duplicateCategoryGroups.some(group => !group.selectedToKeep))}
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
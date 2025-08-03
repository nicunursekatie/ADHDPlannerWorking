import React, { useState } from 'react';
import { Plus, X, Calendar, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { Task } from '../../types';

interface FollowUpTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTask: Task;
  onConfirm: (followUpTasks: Partial<Task>[]) => void;
  onSkip: () => void;
  categories: { id: string; name: string; color: string }[];
  projects: { id: string; name: string; color: string }[];
}

interface FollowUpTaskInput {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  estimatedMinutes: string;
  categoryId?: string;
  projectId?: string;
}

export const FollowUpTasksModal: React.FC<FollowUpTasksModalProps> = ({
  isOpen,
  onClose,
  parentTask,
  onConfirm,
  onSkip,
  categories,
  projects,
}) => {
  React.useEffect(() => {
    console.log('[FollowUpTasksModal] Modal state:', {
      isOpen,
      parentTask: parentTask?.title,
      hasCategories: categories?.length > 0,
      hasProjects: projects?.length > 0
    });
  }, [isOpen, parentTask, categories, projects]);
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTaskInput[]>([
    {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      estimatedMinutes: '',
      categoryId: parentTask.categoryId,
      projectId: parentTask.projectId,
    },
  ]);

  const handleAddTask = () => {
    setFollowUpTasks([
      ...followUpTasks,
      {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        estimatedMinutes: '',
        categoryId: parentTask.categoryId,
        projectId: parentTask.projectId,
      },
    ]);
  };

  const handleRemoveTask = (index: number) => {
    setFollowUpTasks(followUpTasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, field: keyof FollowUpTaskInput, value: string) => {
    const updated = [...followUpTasks];
    updated[index] = { ...updated[index], [field]: value };
    setFollowUpTasks(updated);
  };

  const handleConfirm = () => {
    const tasksToCreate = followUpTasks
      .filter(task => task.title.trim() !== '')
      .map(task => ({
        title: task.title.trim(),
        description: task.description.trim(),
        priority: task.priority,
        dueDate: task.dueDate || undefined,
        estimatedMinutes: task.estimatedMinutes ? parseInt(task.estimatedMinutes) : undefined,
        categoryId: task.categoryId,
        projectId: task.projectId,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentTaskId: parentTask.id,
      }));

    if (tasksToCreate.length > 0) {
      onConfirm(tasksToCreate);
    } else {
      onSkip();
    }
  };

  const hasValidTasks = followUpTasks.some(task => task.title.trim() !== '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Follow-Up Tasks"
      size="xl"
      footer={
        <div className="flex justify-between">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            Skip
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasValidTasks}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={16} className="inline mr-2" />
              Create Follow-Up Tasks
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed task:</p>
          <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{parentTask.title}</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Add any follow-up tasks that came to mind while completing this task. 
              These tasks will inherit the same project and category as the parent task.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {followUpTasks.map((task, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Follow-Up Task {index + 1}
                </h4>
                {followUpTasks.length > 1 && (
                  <button
                    onClick={() => handleRemoveTask(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Task title (required)"
                    value={task.title}
                    onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Description (optional)"
                    value={task.description}
                    onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Priority</label>
                    <select
                      value={task.priority}
                      onChange={(e) => handleTaskChange(index, 'priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Estimated Time</label>
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={task.estimatedMinutes}
                      onChange={(e) => handleTaskChange(index, 'estimatedMinutes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar size={12} className="inline mr-1" />
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    value={task.dueDate}
                    onChange={(e) => handleTaskChange(index, 'dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddTask}
          className="w-full px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
        >
          <Plus size={16} className="inline mr-2" />
          Add Another Follow-Up Task
        </button>
      </div>
    </Modal>
  );
};

export default FollowUpTasksModal;
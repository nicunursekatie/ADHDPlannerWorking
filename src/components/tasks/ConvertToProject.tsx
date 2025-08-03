import React, { useState } from 'react';
import { Task, Project } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FolderPlus, ChevronRight, Calendar, Tag, Layers } from 'lucide-react';

interface ConvertToProjectProps {
  task: Task;
  onConfirm: (projectData: Partial<Project>, options: ConversionOptions) => void;
  onCancel: () => void;
  subtasks?: Task[];
}

interface ConversionOptions {
  includeSubtasks: boolean;
  createPhases: boolean;
  deleteOriginalTask: boolean;
  moveToProject: boolean;
}

const ConvertToProject: React.FC<ConvertToProjectProps> = ({ 
  task, 
  onConfirm, 
  onCancel,
  subtasks = []
}) => {
  const [projectName, setProjectName] = useState(task.title);
  const [projectDescription, setProjectDescription] = useState(task.description);
  const [projectColor, setProjectColor] = useState('#3B82F6');
  const [options, setOptions] = useState<ConversionOptions>({
    includeSubtasks: subtasks.length > 0,
    createPhases: false,
    deleteOriginalTask: false,
    moveToProject: true
  });

  const colorOptions = [
    '#EF4444', // red
    '#F97316', // orange
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
  ];

  const handleConfirm = () => {
    const projectData: Partial<Project> = {
      name: projectName,
      description: projectDescription,
      color: projectColor
    };
    
    onConfirm(projectData, options);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Convert Task to Project"
      size="medium"
    >
      <div className="space-y-6">
        {/* Task Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Converting Task:
          </h3>
          <p className="text-gray-900 dark:text-gray-100 font-medium">{task.title}</p>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
          )}
          {subtasks.length > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              <Layers className="inline w-4 h-4 mr-1" />
              {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Project Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Description
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Color
            </label>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setProjectColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    projectColor === color
                      ? 'border-gray-900 dark:border-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Conversion Options
          </h3>
          
          {subtasks.length > 0 && (
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.includeSubtasks}
                onChange={(e) => setOptions({ ...options, includeSubtasks: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include all {subtasks.length} subtasks in the project
              </span>
            </label>
          )}

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.moveToProject}
              onChange={(e) => setOptions({ ...options, moveToProject: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Keep original task as first project task
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.createPhases}
              onChange={(e) => setOptions({ ...options, createPhases: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Create project phases (Planning, Execution, Review)
            </span>
          </label>

          {!options.moveToProject && (
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.deleteOriginalTask}
                onChange={(e) => setOptions({ ...options, deleteOriginalTask: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Delete original task after conversion
              </span>
            </label>
          )}
        </div>

        {/* Preview */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            What will happen:
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li className="flex items-start">
              <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              A new project "{projectName}" will be created
            </li>
            {options.moveToProject && (
              <li className="flex items-start">
                <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                The original task will be moved to this project
              </li>
            )}
            {options.includeSubtasks && subtasks.length > 0 && (
              <li className="flex items-start">
                <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''} will be moved to the project
              </li>
            )}
            {options.createPhases && (
              <li className="flex items-start">
                <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                Project phases will be created for better organization
              </li>
            )}
            {options.deleteOriginalTask && !options.moveToProject && (
              <li className="flex items-start">
                <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                The original task will be deleted
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onCancel}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            disabled={!projectName.trim()}
            icon={<FolderPlus size={16} />}
          >
            Create Project
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConvertToProject;
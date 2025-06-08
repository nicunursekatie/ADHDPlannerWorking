import React from 'react';
import { Edit, Trash, ArrowRight } from 'lucide-react';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Button from '../common/Button';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  completedTaskCount?: number;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  taskCount,
  completedTaskCount = 0,
  onEdit,
  onDelete,
}) => {
  const completionPercentage = taskCount > 0 
    ? Math.round((completedTaskCount / taskCount) * 100)
    : 0;
    
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md hover:scale-[1.02]">
      <div 
        className="h-2"
        style={{ backgroundColor: project.color }}
      ></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
            {project.name}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(project)}
              className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all hover:scale-110"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:scale-110"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>
        
        {project.description && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {project.description}
          </p>
        )}
        
        <div className="mt-4">
          {/* Progress bar */}
          {taskCount > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>{completedTaskCount} of {taskCount} completed</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 dark:bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </div>
            
            <Link to={`/projects/${project.id}`} className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all hover:scale-110">
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
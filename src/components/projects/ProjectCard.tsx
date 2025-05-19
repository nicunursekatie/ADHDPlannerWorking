import React from 'react';
import { Edit, Trash, ArrowRight } from 'lucide-react';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContext';
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
    <div className="bg-gray-800/40 rounded-lg overflow-hidden border border-gray-700/50 transition-all hover:bg-gray-800/60 hover:border-gray-600/50">
      <div 
        className="h-2"
        style={{ backgroundColor: project.color }}
      ></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-base font-medium text-gray-100">
            {project.name}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(project)}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>
        
        {project.description && (
          <p className="mt-2 text-sm text-gray-400">
            {project.description}
          </p>
        )}
        
        <div className="mt-4">
          {/* Progress bar */}
          {taskCount > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{completedTaskCount} of {taskCount} completed</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </div>
            
            <Link to={`/projects/${project.id}`} className="text-primary-600 hover:text-primary-700">
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
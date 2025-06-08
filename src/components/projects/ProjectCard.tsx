import React, { useState } from 'react';
import { Edit, Trash, ArrowRight, Plus, Play, Pause, BarChart3, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Project } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progress: number;
  totalHours: number;
  estimatedCompletionDate: Date | null;
}

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  completedTaskCount?: number;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  stats: ProjectStats;
  isDragging?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  taskCount,
  completedTaskCount = 0,
  onEdit,
  onDelete,
  stats,
  isDragging = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getProgressColor = () => {
    if (stats.progress >= 75) return 'from-green-500 to-green-600';
    if (stats.progress >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };
  
  const getProgressTextColor = () => {
    if (stats.progress >= 75) return 'text-green-700';
    if (stats.progress >= 50) return 'text-orange-700';
    return 'text-red-700';
  };
  
  return (
    <Card
      variant="glass"
      className={`group relative overflow-hidden transition-all duration-500 border-l-4 animate-scaleIn cursor-move ${
        isDragging 
          ? 'shadow-2xl scale-105 rotate-2 z-50' 
          : 'hover:shadow-2xl hover:-translate-y-2'
      }`}
      style={{ borderLeftColor: project.color }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
        style={{ 
          background: `linear-gradient(135deg, ${project.color}20 0%, transparent 50%)` 
        }}
      />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: project.color }}
              />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {project.name}
              </h3>
            </div>
            
            {project.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {project.description}
              </p>
            )}
          </div>
          
          {/* Quick Actions - Show on Hover */}
          <div className={`flex items-center gap-1 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}>
            <button
              onClick={() => onEdit(project)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all hover:scale-110"
              title="Edit project"
            >
              ✏️
            </button>
            <button
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all hover:scale-110"
              title="Pause project"
            >
              ⏸️
            </button>
            <button
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all hover:scale-110"
              title="View details"
            >
              📊
            </button>
          </div>
        </div>
        
        {/* Enhanced Progress Bar - 3x Height */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className={`text-sm font-bold ${getProgressTextColor()}`}>
              {stats.progress}%
            </span>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-1000 ease-out flex items-center justify-center relative`}
              style={{ width: `${stats.progress}%` }}
            >
              {/* Percentage text inside progress bar */}
              {stats.progress >= 15 && (
                <span className="text-xs font-bold text-white drop-shadow-sm">
                  {stats.progress}%
                </span>
              )}
              
              {/* Animated shimmer effect */}
              {stats.progress > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>
        
        {/* Detailed Information */}
        <div className="space-y-3">
          {/* Task Count and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.totalTasks}
                </span> tasks
              </span>
              <span className="text-green-600 font-medium">
                {stats.completedTasks} done
              </span>
              {stats.overdueTasks > 0 && (
                <span className="text-red-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.overdueTasks} overdue
                </span>
              )}
            </div>
          </div>
          
          {/* Time Information */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-purple-600 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {stats.totalHours}h spent
              </span>
              <span className="text-gray-500">
                Updated {(() => {
                  try {
                    const date = new Date(project.updatedAt);
                    if (isNaN(date.getTime())) {
                      return 'recently';
                    }
                    return formatDistanceToNow(date) + ' ago';
                  } catch (error) {
                    return 'recently';
                  }
                })()}
              </span>
            </div>
          </div>
          
          {/* Estimated Completion */}
          {stats.estimatedCompletionDate && (
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <Calendar className="w-3 h-3" />
              <span>
                Est. completion: {format(stats.estimatedCompletionDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Add Task Button */}
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600"
          >
            Add Task
          </Button>
          
          {/* View Project Button */}
          <Link 
            to={`/projects/${project.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg"
          >
            <span>View Project</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {stats.progress === 100 ? (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
              ✅ Complete
            </div>
          ) : stats.progress > 0 ? (
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
              🚀 Active
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
              💤 Not Started
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;
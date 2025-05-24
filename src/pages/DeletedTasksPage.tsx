import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { DeletedTask, getDeletedTasks, restoreDeletedTask, permanentlyDeleteTask, clearAllDeletedTasks } from '../utils/localStorage';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Empty from '../components/common/Empty';
import { formatDate } from '../utils/helpers';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Calendar,
  Clock,
  Folder,
  Tag,
  X
} from 'lucide-react';

const DeletedTasksPage: React.FC = () => {
  const { projects, categories, tasks, setTasks } = useAppContext();
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DeletedTask | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load deleted tasks on mount
  useEffect(() => {
    loadDeletedTasks();
  }, []);

  const loadDeletedTasks = () => {
    const deleted = getDeletedTasks();
    // Sort by deletion date, newest first
    const sorted = deleted.sort((a, b) => 
      new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );
    setDeletedTasks(sorted);
  };

  const handleRestore = (taskId: string) => {
    const restoredTask = restoreDeletedTask(taskId);
    if (restoredTask) {
      // Reload tasks in context
      const updatedTasks = [...tasks, restoredTask];
      setTasks(updatedTasks);
      // Reload deleted tasks
      loadDeletedTasks();
    }
  };

  const handlePermanentDelete = (taskId: string) => {
    permanentlyDeleteTask(taskId);
    loadDeletedTasks();
  };

  const handleClearAll = () => {
    clearAllDeletedTasks();
    setDeletedTasks([]);
    setShowClearAllModal(false);
  };

  const getDaysAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(date);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recently Deleted</h1>
          <p className="text-gray-600 mt-1">
            Tasks are kept for 30 days before permanent deletion
          </p>
        </div>
        {deletedTasks.length > 0 && (
          <Button
            variant="danger"
            onClick={() => setShowClearAllModal(true)}
            icon={<Trash2 size={16} />}
          >
            Clear All
          </Button>
        )}
      </div>

      {deletedTasks.length === 0 ? (
        <Empty
          title="No deleted tasks"
          description="Tasks you delete will appear here for 30 days"
          icon={
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Trash2 size={32} className="text-gray-400" />
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {deletedTasks.map((deletedTask) => {
            const project = deletedTask.task.projectId 
              ? projects.find(p => p.id === deletedTask.task.projectId)
              : null;
            
            const taskCategories = categories.filter(c => 
              deletedTask.task.categoryIds?.includes(c.id)
            );

            return (
              <Card 
                key={deletedTask.task.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedTask(deletedTask);
                  setShowDetailModal(true);
                }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {deletedTask.task.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          Deleted {getDaysAgo(deletedTask.deletedAt)}
                        </div>
                        {deletedTask.task.dueDate && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            Was due {formatDate(new Date(deletedTask.task.dueDate))}
                          </div>
                        )}
                        {project && (
                          <div className="flex items-center">
                            <Folder size={14} className="mr-1" style={{ color: project.color }} />
                            <span style={{ color: project.color }}>{project.name}</span>
                          </div>
                        )}
                      </div>
                      {taskCategories.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Tag size={14} className="text-gray-400" />
                          {taskCategories.map(category => (
                            <span 
                              key={category.id}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: category.color + '20',
                                color: category.color 
                              }}
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(deletedTask.task.id);
                        }}
                        icon={<RotateCcw size={14} />}
                      >
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermanentDelete(deletedTask.task.id);
                        }}
                        icon={<X size={14} />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTask(null);
        }}
        title="Deleted Task Details"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">{selectedTask.task.title}</h3>
              {selectedTask.task.description && (
                <p className="mt-2 text-gray-600">{selectedTask.task.description}</p>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-500">
                <Clock size={16} className="mr-2" />
                Deleted {getDaysAgo(selectedTask.deletedAt)}
              </div>
              {selectedTask.task.dueDate && (
                <div className="flex items-center text-gray-500">
                  <Calendar size={16} className="mr-2" />
                  Due date was {formatDate(new Date(selectedTask.task.dueDate))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="primary"
                onClick={() => {
                  handleRestore(selectedTask.task.id);
                  setShowDetailModal(false);
                  setSelectedTask(null);
                }}
                icon={<RotateCcw size={16} />}
              >
                Restore Task
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handlePermanentDelete(selectedTask.task.id);
                  setShowDetailModal(false);
                  setSelectedTask(null);
                }}
                icon={<Trash2 size={16} />}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Clear All Deleted Tasks"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center text-red-600">
            <AlertTriangle size={20} className="mr-2" />
            <p className="font-medium">This action cannot be undone!</p>
          </div>
          <p className="text-gray-600">
            Are you sure you want to permanently delete all {deletedTasks.length} tasks? 
            They will be removed forever and cannot be recovered.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowClearAllModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleClearAll}
              icon={<Trash2 size={16} />}
            >
              Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeletedTasksPage;
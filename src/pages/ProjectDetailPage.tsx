import React, { useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContextSupabase';
import { Task } from '../types';
import { TaskDisplay } from "../components/TaskDisplay";
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { ArrowLeft, Edit, Trash, Plus, CheckCircle, Archive, RotateCcw } from 'lucide-react';
import Empty from '../components/common/Empty';
import ProjectForm from '../components/projects/ProjectForm';
import AITaskBreakdown from '../components/tasks/AITaskBreakdown';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, tasks, categories, deleteProject, deleteTask, updateTask, completeProject, archiveProject, archiveProjectCompletedTasks } = useAppContext();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [aiBreakdownTask, setAiBreakdownTask] = useState<Task | null>(null);

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }
  
  const projectTasks = tasks.filter(
    task => task.projectId === projectId && 
    !task.parentTaskId &&
    !task.deletedAt 
    // Note: Removed !task.archived to show completed/archived tasks
  );
  
  // Get ALL completed tasks in project (including subtasks) for accurate count
  const completedTasksInProject = tasks.filter(task => 
    task.projectId === projectId && 
    task.completed && 
    !task.archived &&
    !task.deletedAt
  );
  
  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };
  
  const handleOpenProjectModal = () => {
    setIsProjectModalOpen(true);
  };
  
  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
  };
  
  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };
  
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };
  
  const handleDeleteProject = () => {
    deleteProject(projectId);
    navigate('/projects');
  };
  
  const handleAIBreakdown = (task: Task) => {
    setAiBreakdownTask(task);
    setShowAIBreakdown(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div 
        className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4 border-t-4"
        style={{ borderColor: project.color }}
      >
        <div>
          <div className="flex items-center mb-1">
            <Link 
              to="/projects"
              className="text-gray-500 hover:text-gray-700 mr-2"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {project.name}
              {project.completed && (
                <span className="ml-2 text-sm font-normal text-green-600">
                  (Completed)
                </span>
              )}
              {project.archived && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Archived)
                </span>
              )}
            </h1>
          </div>
          {project.description && (
            <p className="text-gray-600">{project.description}</p>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          {!project.completed && (
            <Button
              variant="success"
              size="sm"
              icon={<CheckCircle size={16} />}
              onClick={async () => {
                await completeProject(project.id);
              }}
              title="Mark project as completed"
            >
              Complete
            </Button>
          )}
          {project.completed && !project.archived && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={16} />}
                onClick={async () => {
                  await completeProject(project.id);
                }}
                title="Mark project as incomplete"
              >
                Reopen
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Archive size={16} />}
                onClick={async () => {
                  await archiveProject(project.id);
                }}
                title="Archive completed project"
              >
                Archive
              </Button>
            </>
          )}
          {project.archived && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={16} />}
              onClick={async () => {
                await archiveProject(project.id);
              }}
              title="Unarchive project"
            >
              Unarchive
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit size={16} />}
            onClick={handleOpenProjectModal}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash size={16} />}
            onClick={handleOpenDeleteModal}
          >
            Delete
          </Button>
        </div>
      </div>
      
      {/* Task list heading */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Tasks
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({projectTasks.length})
          </span>
        </h2>
        <div className="flex space-x-2">
          {completedTasksInProject.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Archive size={16} />}
              onClick={async () => {
                await archiveProjectCompletedTasks(projectId);
              }}
              title={`Archive ${completedTasksInProject.length} completed task${completedTasksInProject.length === 1 ? '' : 's'}`}
            >
              Archive Completed ({completedTasksInProject.length})
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => handleOpenTaskModal()}
          >
            Add Task
          </Button>
        </div>
      </div>
      
      {/* Task list */}
      <div className="space-y-4">
        {projectTasks.length > 0 ? (
          projectTasks.map(task => (
            <TaskDisplay
            key={task.id}
            task={task}
            onToggle={() => updateTask({ ...task, completed: !task.completed })}
            onEdit={() => handleOpenTaskModal(task)}
            onDelete={() => deleteTask(task.id)}
            onBreakdown={handleAIBreakdown}
          />
          ))
        ) : (
          <Empty
            title="No tasks in this project yet"
            description="Get started by adding your first task to this project"
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => handleOpenTaskModal()}
              >
                Add Task
              </Button>
            }
          />
        )}
      </div>
      
      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="3xl"
      >
        <TaskForm
          task={editingTask || undefined}
          onClose={handleCloseTaskModal}
          isEdit={!!editingTask}
          initialProjectId={projectId}
        />
      </Modal>
      
      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={handleCloseProjectModal}
        title="Edit Project"
      >
        <ProjectForm
          project={project}
          onClose={handleCloseProjectModal}
          isEdit={true}
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete Project"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{project.name}"? Any tasks associated with this project will remain, but will no longer be assigned to any project.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleCloseDeleteModal}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteProject}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* AI Breakdown Modal */}
      {showAIBreakdown && aiBreakdownTask && (
        <AITaskBreakdown
          task={aiBreakdownTask}
          onClose={() => {
            setShowAIBreakdown(false);
            setAiBreakdownTask(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { RecurringTask, RecurrencePattern } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Calendar, Clock, Plus, Repeat, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { generateId, formatDate } from '../utils/helpers';

const RecurringTasksPage: React.FC = () => {
  const { recurringTasks, addRecurringTask, updateRecurringTask, deleteRecurringTask, addTask, generateTaskFromRecurring } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pattern: {
      type: 'daily' as RecurrencePattern['type'],
      interval: 1,
      time: '09:00',
    },
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedMinutes: 30,
    categoryIds: [] as string[],
    source: {
      type: 'manual' as 'manual' | 'medication' | 'bill' | 'chore',
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      pattern: {
        type: 'daily',
        interval: 1,
        time: '09:00',
      },
      priority: 'medium',
      estimatedMinutes: 30,
      categoryIds: [],
      source: {
        type: 'manual',
      },
    });
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nextDue = calculateNextDue(formData.pattern);
    
    const recurringTask: RecurringTask = {
      id: editingTask?.id || generateId(),
      title: formData.title,
      description: formData.description,
      pattern: formData.pattern,
      nextDue: nextDue.toISOString().split('T')[0],
      lastGenerated: null,
      active: true,
      source: formData.source,
      priority: formData.priority,
      estimatedMinutes: formData.estimatedMinutes,
      categoryIds: formData.categoryIds,
      projectId: null,
      tags: [],
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTask) {
      updateRecurringTask(recurringTask);
    } else {
      addRecurringTask(recurringTask);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const calculateNextDue = (pattern: RecurrencePattern): Date => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (pattern.type) {
      case 'daily':
        return new Date(today.getTime() + (pattern.interval * 24 * 60 * 60 * 1000));
      case 'weekly':
        return new Date(today.getTime() + (pattern.interval * 7 * 24 * 60 * 60 * 1000));
      case 'monthly':
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + pattern.interval);
        return nextMonth;
      default:
        return new Date(today.getTime() + (24 * 60 * 60 * 1000)); // Default to tomorrow
    }
  };

  const handleGenerateTask = (recurringTask: RecurringTask) => {
    const newTask = generateTaskFromRecurring(recurringTask.id);
    if (newTask) {
      addTask(newTask);
      
      // Update the recurring task's next due date
      const nextDue = calculateNextDue(recurringTask.pattern);
      updateRecurringTask({
        ...recurringTask,
        nextDue: nextDue.toISOString().split('T')[0],
        lastGenerated: new Date().toISOString(),
      });
    }
  };

  const handleEdit = (task: RecurringTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      pattern: task.pattern,
      priority: task.priority || 'medium',
      estimatedMinutes: task.estimatedMinutes || 30,
      categoryIds: task.categoryIds,
      source: task.source,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this recurring task?')) {
      deleteRecurringTask(taskId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recurring Tasks</h1>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          icon={<Plus size={20} />}
        >
          Add Recurring Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurringTasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-gray-900">{task.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(task)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Repeat size={14} className="mr-2" />
                {task.pattern.type === 'daily' && `Every ${task.pattern.interval} day(s)`}
                {task.pattern.type === 'weekly' && `Every ${task.pattern.interval} week(s)`}
                {task.pattern.type === 'monthly' && `Every ${task.pattern.interval} month(s)`}
                {task.pattern.time && ` at ${task.pattern.time}`}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={14} className="mr-2" />
                Next due: {formatDate(new Date(task.nextDue))}
              </div>

              {task.estimatedMinutes && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={14} className="mr-2" />
                  {task.estimatedMinutes} minutes
                </div>
              )}
            </div>

            <Button
              size="sm"
              variant="primary"
              className="mt-4 w-full"
              onClick={() => handleGenerateTask(task)}
              icon={<CheckCircle size={16} />}
            >
              Generate Task
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Recurring Task' : 'Add Recurring Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Type
              </label>
              <select
                value={formData.pattern.type}
                onChange={(e) => setFormData({
                  ...formData,
                  pattern: { ...formData.pattern, type: e.target.value as RecurrencePattern['type'] }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval
              </label>
              <input
                type="number"
                min="1"
                value={formData.pattern.interval}
                onChange={(e) => setFormData({
                  ...formData,
                  pattern: { ...formData.pattern, interval: parseInt(e.target.value) }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={formData.pattern.time}
              onChange={(e) => setFormData({
                ...formData,
                pattern: { ...formData.pattern, time: e.target.value }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Minutes
            </label>
            <input
              type="number"
              min="5"
              step="5"
              value={formData.estimatedMinutes}
              onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.source.type}
              onChange={(e) => setFormData({
                ...formData,
                source: { ...formData.source, type: e.target.value as any }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="manual">Manual</option>
              <option value="medication">Medication</option>
              <option value="bill">Bill</option>
              <option value="chore">Chore</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RecurringTasksPage;
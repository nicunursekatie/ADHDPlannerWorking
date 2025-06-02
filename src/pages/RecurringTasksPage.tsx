import React, { useState } from 'react';
import { useAppContext } from '../context/AppContextSupabase';
import { RecurringTask, RecurrencePattern } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Repeat, 
  Trash2, 
  Edit2, 
  CheckCircle,
  Pill,
  DollarSign,
  Home,
  Calendar as CalendarIcon,
  AlertCircle,
  Timer,
  Flag
} from 'lucide-react';
import { generateId, formatDate } from '../utils/helpers';

const RecurringTasksPage: React.FC = () => {
  const { recurringTasks, addRecurringTask, updateRecurringTask, deleteRecurringTask, addTask, generateTaskFromRecurring, categories } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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
      type: 'manual' as 'manual' | 'medication' | 'bill' | 'chore' | 'appointment' | 'routine',
    },
    startDate: formatDate(new Date()), // Default to today
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
      startDate: formatDate(new Date()), // Reset to today
    });
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate next due date based on the start date
    const startDate = new Date(formData.startDate);
    const nextDue = calculateNextDue(formData.pattern, startDate);
    
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

  const calculateNextDue = (pattern: RecurrencePattern, startDate?: Date): Date => {
    const now = new Date();
    const baseDate = startDate || now;
    const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    
    // If time is specified, use it
    if (pattern.time) {
      const [hours, minutes] = pattern.time.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
    }
    
    // If we have a start date and it's in the future, use it as the first occurrence
    if (startDate && startDate > now) {
      return today;
    }
    
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
      startDate: task.nextDue, // Use the next due date as start date for editing
    });
    setIsModalOpen(true);
  };

  const handleDelete = (taskId: string) => {
    deleteRecurringTask(taskId);
    setShowDeleteConfirm(null);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill size={16} className="text-pink-600" />;
      case 'bill':
        return <DollarSign size={16} className="text-green-600" />;
      case 'chore':
        return <Home size={16} className="text-blue-600" />;
      case 'appointment':
        return <CalendarIcon size={16} className="text-red-600" />;
      case 'routine':
        return <Clock size={16} className="text-purple-600" />;
      default:
        return <Repeat size={16} className="text-gray-600" />;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'medication':
        return 'bg-pink-50 border-pink-200';
      case 'bill':
        return 'bg-green-50 border-green-200';
      case 'chore':
        return 'bg-blue-50 border-blue-200';
      case 'appointment':
        return 'bg-red-50 border-red-200';
      case 'routine':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string | undefined) => {
    switch (priority) {
      case 'high':
        return <Flag size={14} className="text-red-600" />;
      case 'medium':
        return <Flag size={14} className="text-yellow-600" />;
      case 'low':
        return <Flag size={14} className="text-blue-600" />;
      default:
        return null;
    }
  };

  const groupedTasks = recurringTasks.reduce((acc, task) => {
    const type = task.source.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(task);
    return acc;
  }, {} as Record<string, RecurringTask[]>);

  const typeLabels: Record<string, string> = {
    medication: 'Medications',
    bill: 'Bills & Payments',
    chore: 'Chores & Tasks',
    appointment: 'Appointments',
    routine: 'Routines',
    manual: 'Other'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your regular activities and routines</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          icon={<Plus size={20} />}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Recurring Task
        </Button>
      </div>

      {recurringTasks.length === 0 ? (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Repeat size={32} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No recurring tasks yet</h3>
              <p className="text-gray-600 mb-4">Create your first recurring task to automate your regular activities</p>
              <Button
                onClick={() => setIsModalOpen(true)}
                icon={<Plus size={16} />}
                variant="primary"
              >
                Create First Task
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        Object.entries(groupedTasks).map(([type, tasks]) => (
          <div key={type} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {getSourceIcon(type)}
              {typeLabels[type] || type}
              <span className="text-sm font-normal text-gray-500">({tasks.length})</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <Card 
                  key={task.id} 
                  className={`relative border-2 ${getSourceColor(task.source.type)} hover:shadow-md transition-shadow`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {getSourceIcon(task.source.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            {task.title}
                            {getPriorityIcon(task.priority)}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Edit task"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(task.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Repeat size={14} className="mr-2 text-gray-400" />
                        <span className="font-medium">
                          {task.pattern.type === 'daily' && `Every ${task.pattern.interval === 1 ? 'day' : `${task.pattern.interval} days`}`}
                          {task.pattern.type === 'weekly' && `Every ${task.pattern.interval === 1 ? 'week' : `${task.pattern.interval} weeks`}`}
                          {task.pattern.type === 'monthly' && `Every ${task.pattern.interval === 1 ? 'month' : `${task.pattern.interval} months`}`}
                        </span>
                        {task.pattern.time && (
                          <span className="ml-1 text-gray-500">at {task.pattern.time}</span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        <span>Next: <span className="font-medium">{formatDate(new Date(task.nextDue))}</span></span>
                      </div>

                      {task.estimatedMinutes && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Timer size={14} className="mr-2 text-gray-400" />
                          <span>{task.estimatedMinutes} minutes</span>
                        </div>
                      )}

                      {task.categoryIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.categoryIds.map(categoryId => {
                            const category = categories.find(c => c.id === categoryId);
                            return category ? (
                              <Badge
                                key={categoryId}
                                text={category.name}
                                color={category.color}
                                className="text-sm"
                              />
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="flex-1"
                        onClick={() => handleGenerateTask(task)}
                        icon={<CheckCircle size={16} />}
                      >
                        Generate Now
                      </Button>
                      {!task.active && (
                        <Badge text="Inactive" color="red" className="text-sm" />
                      )}
                    </div>
                  </div>

                  {showDeleteConfirm === task.id && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center p-4">
                      <div className="text-center">
                        <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
                        <p className="font-medium mb-3">Delete this recurring task?</p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDelete(task.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTask ? 'Edit Recurring Task' : 'Add Recurring Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries({
                medication: { icon: Pill, label: 'Medication' },
                bill: { icon: DollarSign, label: 'Bill' },
                chore: { icon: Home, label: 'Chore' },
                appointment: { icon: CalendarIcon, label: 'Appointment' },
                routine: { icon: Clock, label: 'Routine' },
                manual: { icon: Repeat, label: 'Other' },
              }).map(([value, { icon: Icon, label }]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    source: { ...formData.source, type: value as any }
                  })}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    formData.source.type === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Take morning medication"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={2}
              placeholder="Add any notes or details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Pattern
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
                Every
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={formData.pattern.interval}
                  onChange={(e) => setFormData({
                    ...formData,
                    pattern: { ...formData.pattern, interval: parseInt(e.target.value) || 1 }
                  })}
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {formData.pattern.type === 'daily' && (formData.pattern.interval === 1 ? 'day' : 'days')}
                  {formData.pattern.type === 'weekly' && (formData.pattern.interval === 1 ? 'week' : 'weeks')}
                  {formData.pattern.type === 'monthly' && (formData.pattern.interval === 1 ? 'month' : 'months')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (optional)
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
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={formatDate(new Date())}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">First occurrence of this task</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                Estimated Time
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 5 })}
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">minutes</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.categoryIds.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          categoryIds: [...formData.categoryIds, category.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          categoryIds: formData.categoryIds.filter(id => id !== category.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Badge
                    text={category.name}
                    color={category.color}
                    className="text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RecurringTasksPage;
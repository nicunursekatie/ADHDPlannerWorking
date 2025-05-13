import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent } from '@dnd-kit/core';
import { Task, TimeBlock } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { Plus, Clock, GripVertical, Edit, Info } from 'lucide-react';
import Button from '../common/Button';
import TaskCard from '../tasks/TaskCard';
import Empty from '../common/Empty';
import { generateId, calculateDuration } from '../../utils/helpers';
import TimeBlockModal from './TimeBlockModal';
import Card from '../common/Card';
import { useDroppable, useDraggable } from '@dnd-kit/core';

interface DailyPlannerGridProps {
  date: string;
}

const DailyPlannerGrid: React.FC<DailyPlannerGridProps> = ({ date }) => {
  const { tasks, projects, categories, getDailyPlan, saveDailyPlan } = useAppContext();
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [modalBlock, setModalBlock] = useState<TimeBlock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const dailyPlan = getDailyPlan(date);
  const timeBlocks = dailyPlan?.timeBlocks || [];

  const sortedTimeBlocks = [...timeBlocks]
    .filter(block => block && typeof block.startTime === 'string')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const unscheduledTasks = tasks.filter(task => {
    if (!task || typeof task !== 'object') return false;

    const hasTimeBlock = timeBlocks.some(block =>
      block?.taskId === task.id ||
      (block?.taskIds && block.taskIds.includes(task.id))
    );

    const isIncomplete = !task.completed;

    let isDueOnOrBefore = true;
    try {
      if (task.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (!isNaN(dateObj.getTime())) {
          const taskDate = dateObj.toISOString().split('T')[0];
          isDueOnOrBefore = taskDate <= date;
        }
      }
    } catch {}

    const isTopLevelTask = !task.parentTaskId;
    return isIncomplete && !hasTimeBlock && isDueOnOrBefore && isTopLevelTask;
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const blockId = over.id as string;
    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    const updatedBlocks = timeBlocks.map(block => {
      if (block.id !== blockId) return block;
      const taskIds = block.taskIds || [];
      const newTaskIds = [...taskIds];
      if (!newTaskIds.includes(taskId)) {
        newTaskIds.push(taskId);
        draggedTask.subtasks?.forEach(subtaskId => {
          if (!newTaskIds.includes(subtaskId)) newTaskIds.push(subtaskId);
        });
      }
      return { ...block, taskId: null, taskIds: newTaskIds };
    });

    saveDailyPlan({ id: date, date, timeBlocks: updatedBlocks });
    setActiveId(null);
  };

  const handleAddBlock = () => {
    const now = new Date();
    const startHour = now.getHours() + 1;
    const endHour = startHour + 1;
    const startTime = `${String(startHour % 24).padStart(2, '0')}:00`;
    const endTime = `${String(endHour % 24).padStart(2, '0')}:00`;

    const newBlock: TimeBlock = {
      id: generateId(),
      startTime,
      endTime,
      taskId: null,
      taskIds: [],
      title: 'New Time Block',
      description: '',
    };

    setModalBlock(newBlock);
    setIsModalOpen(true);
  };

  const DroppableTimeBlock = ({ block, children }: { block: TimeBlock; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({ id: block.id });
    return <div ref={setNodeRef} className="h-full w-full">{children}</div>;
  };

  const DraggableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
        <TaskCard task={task} projects={projects} categories={categories} onDelete={() => {}} />
      </div>
    );
  };

  return (
    <>
      <Card className="bg-blue-50 border border-blue-200 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Info size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-md font-medium text-blue-800 mb-1">Flexible Time Blocking</h3>
            <p className="text-sm text-blue-700">Create blocks and drag tasks into them.</p>
          </div>
        </div>
      </Card>

      <TimeBlockModal
        block={modalBlock}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {}}
        onDelete={() => {}}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3">
            <Button onClick={handleAddBlock} icon={<Plus size={16} />}>Add Block</Button>
            {sortedTimeBlocks.map(block => (
              <DroppableTimeBlock key={block.id} block={block}>
                <div className="border rounded p-2 my-2">
                  <h4>{block.title} ({block.startTime}-{block.endTime})</h4>
                </div>
              </DroppableTimeBlock>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Unscheduled Tasks</h2>
            {unscheduledTasks.length > 0 ? (
              unscheduledTasks.map(task => <DraggableTask key={task.id} task={task} />)
            ) : (
              <p className="text-gray-500">No unscheduled tasks</p>
            )}
          </div>
        </div>
        <DragOverlay>
          {activeId && (
            <div className="opacity-50">
              <TaskCard
                task={tasks.find(t => t.id === activeId)!}
                projects={projects}
                categories={categories}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
};

export default DailyPlannerGrid;

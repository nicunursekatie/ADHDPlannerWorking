import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent } from '@dnd-kit/core';
import { Task, TimeBlock } from '../../../types';
import { useAppContext } from '../../../context/AppContextSupabase';
import { Plus, Clock, Edit, Info } from 'lucide-react';
import Button from '../../common/Button';
import { TaskDisplay } from '../../TaskDisplay';
import { generateId, calculateDuration } from '../../../utils/helpers';
import TimeBlockModal from './TimeBlockModal';
import Card from '../../common/Card';
import { useDroppable, useDraggable } from '@dnd-kit/core';

interface DailyPlannerGridProps {
  date: string;
}

const DailyPlannerGrid: React.FC<DailyPlannerGridProps> = ({ date }) => {
  const { tasks, projects, categories, getDailyPlan, saveDailyPlan, updateTask } = useAppContext();
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
    } catch {
      // Date parsing failed, ignore
    }

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
    const { updateTask } = useAppContext();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
        <TaskDisplay 
          task={task}
          onToggle={(id) => updateTask(id, { completed: !task.completed })}
          onEdit={() => {}} // Daily planner doesn't need edit
          onDelete={() => {}} // Daily planner doesn't need delete from here
        />
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
        onSave={(updatedBlock) => {
          const updatedBlocks = [...timeBlocks];
          const existingIndex = updatedBlocks.findIndex(b => b.id === updatedBlock.id);
          
          if (existingIndex >= 0) {
            updatedBlocks[existingIndex] = updatedBlock;
          } else {
            updatedBlocks.push(updatedBlock);
          }
          
          saveDailyPlan({ id: date, date, timeBlocks: updatedBlocks });
          setModalBlock(null);
          setIsModalOpen(false);
        }}
        onDelete={(blockId) => {
          const updatedBlocks = timeBlocks.filter(b => b.id !== blockId);
          saveDailyPlan({ id: date, date, timeBlocks: updatedBlocks });
          setModalBlock(null);
          setIsModalOpen(false);
        }}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Time Blocks</h2>
              <Button 
                onClick={handleAddBlock} 
                icon={<Plus size={18} />}
                variant="primary"
                size="md"
              >
                Add Time Block
              </Button>
            </div>
            
            {/* Time grid with hour labels */}
            <div className="relative">
              {/* Hour labels */}
              <div className="absolute left-0 top-0 bottom-0 w-16">
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(hour => (
                  <div key={hour} className="h-16 border-t border-gray-200 text-xs text-gray-500 pt-1">
                    {hour <= 12 ? `${hour}am` : `${hour - 12}pm`}
                  </div>
                ))}
              </div>
              
              {/* Time blocks */}
              <div className="ml-20">
            {sortedTimeBlocks.map(block => {
              const blockTaskIds = block.taskIds || [];
              const blockTasks = tasks.filter(t => blockTaskIds.includes(t.id));
              const duration = calculateDuration(block.startTime, block.endTime);
              
              return (
                <DroppableTimeBlock key={block.id} block={block}>
                  <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div 
                      className="mb-3"
                      onClick={() => {
                        setModalBlock(block);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-lg">{block.title || 'Time Block'}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={14} />
                            <span>{block.startTime} - {block.endTime}</span>
                            <span className="text-gray-400">•</span>
                            <span>
                              {typeof duration === 'object' && duration !== null
                                ? `${duration.hours}h ${duration.minutes}m`
                                : `${duration}m`}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Edit size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalBlock(block);
                            setIsModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      {block.description && (
                        <p className="text-sm text-gray-600 mb-2">{block.description}</p>
                      )}
                    </div>
                    
                    {blockTasks.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Tasks ({blockTasks.length})</h4>
                        {blockTasks.map(task => (
                          <div key={task.id} className="pl-2">
                            <TaskDisplay 
                            task={task}
                            onToggle={(id) => updateTask(id, { completed: !task.completed })}
                            onEdit={() => {}}
                            onDelete={() => {
                              const newTaskIds = blockTaskIds.filter(id => id !== task.id);
                              const updatedBlock = { ...block, taskIds: newTaskIds };
                              const updatedBlocks = timeBlocks.map(b => 
                                b.id === block.id ? updatedBlock : b
                              );
                              saveDailyPlan({ id: date, date, timeBlocks: updatedBlocks });
                            }}
                          />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-sm text-gray-500">Drop tasks here</p>
                      </div>
                    )}
                  </Card>
                </DroppableTimeBlock>
              );
            })}
              </div>
            </div>

          </div>
          
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-3">Unscheduled Tasks</h2>
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
              <TaskDisplay
              task={tasks.find(t => t.id === activeId)!}
              onToggle={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
};

export default DailyPlannerGrid;

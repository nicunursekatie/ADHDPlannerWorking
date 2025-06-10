import React, { useState, useEffect, useRef } from 'react';
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
  const { tasks, getDailyPlan, saveDailyPlan, updateTask } = useAppContext();
  const [modalBlock, setModalBlock] = useState<TimeBlock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Scroll to 8am on mount
  useEffect(() => {
    if (gridRef.current) {
      // Scroll to 8am (8 hours * 64px per hour)
      const scrollPosition = 8 * 64;
      gridRef.current.scrollTop = scrollPosition;
    }
  }, []);

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

    const planId = dailyPlan?.id || generateId();
    saveDailyPlan({ id: planId, date, timeBlocks: updatedBlocks });
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
        <TaskDisplay 
          task={task}
          onToggle={(id) => updateTask({ ...task, completed: !task.completed })}
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
          
          const planId = dailyPlan?.id || generateId();
          saveDailyPlan({ id: planId, date, timeBlocks: updatedBlocks });
          setModalBlock(null);
          setIsModalOpen(false);
        }}
        onDelete={(blockId) => {
          const updatedBlocks = timeBlocks.filter(b => b.id !== blockId);
          const planId = dailyPlan?.id || generateId();
          saveDailyPlan({ id: planId, date, timeBlocks: updatedBlocks });
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
            <div ref={gridRef} className="relative bg-gray-50 rounded-lg overflow-y-auto shadow-inner" style={{ height: '600px' }}>
              <div className="flex" style={{ height: `${24 * 64}px` }}>
                {/* Hour labels */}
                <div className="w-16 bg-gray-100 border-r border-gray-300 flex-shrink-0">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(hour => (
                    <div key={hour} className="h-16 border-t border-gray-200 text-xs text-gray-600 font-medium pt-1 pl-2">
                      {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                    </div>
                  ))}
                </div>
                
                {/* Grid background and time blocks */}
                <div className="flex-1 relative bg-white" style={{ height: `${24 * 64}px` }}>
                {/* Hour grid lines */}
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-gray-200" style={{ top: `${i * 64}px` }} />
                ))}
                
                {/* Time blocks positioned absolutely */}
                {sortedTimeBlocks.map(block => {
                  const blockTaskIds = block.taskIds || [];
                  const blockTasks = tasks.filter(t => blockTaskIds.includes(t.id));
                  
                  // Calculate position and height
                  const [startHour, startMinute] = block.startTime.split(':').map(Number);
                  const [endHour, endMinute] = block.endTime.split(':').map(Number);
                  
                  // Convert to minutes from midnight (0:00)
                  const startMinutesFromMidnight = startHour * 60 + startMinute;
                  let endMinutesFromMidnight = endHour * 60 + endMinute;
                  
                  // Handle overnight blocks (e.g., 10:40 PM to 12:30 AM)
                  if (endMinutesFromMidnight < startMinutesFromMidnight) {
                    endMinutesFromMidnight += 24 * 60; // Add 24 hours
                  }
                  
                  // Calculate pixel position (64px per hour)
                  const top = (startMinutesFromMidnight / 60) * 64;
                  let displayHeight = ((endMinutesFromMidnight - startMinutesFromMidnight) / 60) * 64;
                  
                  // Clip overnight blocks at midnight for display
                  if (endMinutesFromMidnight > 24 * 60) {
                    const minutesUntilMidnight = (24 * 60) - startMinutesFromMidnight;
                    displayHeight = (minutesUntilMidnight / 60) * 64;
                  }
                  
                  
                  return (
                    <DroppableTimeBlock key={block.id} block={block}>
                      <div 
                        className="absolute left-2 right-2"
                        style={{ 
                          top: `${top}px`, 
                          height: `${displayHeight}px`,
                          minHeight: '60px'
                        }}
                      >
                        <Card className="h-full cursor-pointer hover:shadow-lg transition-all bg-blue-50 border-2 border-blue-400 hover:border-blue-500 shadow-md overflow-hidden">
                          <div 
                            className="h-full p-3 flex flex-col"
                            onClick={() => {
                              setModalBlock(block);
                              setIsModalOpen(true);
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm truncate">{block.title || 'Time Block'}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Clock size={12} />
                                  <span>{block.startTime} - {block.endTime}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Edit size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalBlock(block);
                                  setIsModalOpen(true);
                                }}
                                className="ml-2"
                              />
                            </div>
                            
                            {block.description && displayHeight > 80 && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{block.description}</p>
                            )}
                            
                            <div className="flex-1 overflow-y-auto">
                              {blockTasks.length > 0 ? (
                                <div className="space-y-1">
                                  <h4 className="text-xs font-medium text-gray-700">Tasks ({blockTasks.length})</h4>
                                  {blockTasks.map(task => (
                                    <div key={task.id} className="scale-90 origin-left">
                                      <TaskDisplay 
                                        task={task}
                                        onToggle={(id) => updateTask({ ...task, completed: !task.completed })}
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
                                <div className="h-full flex items-center justify-center">
                                  <div className="text-center py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                    <p className="text-xs text-gray-500">Drop tasks here</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    </DroppableTimeBlock>
                  );
                })}
                
                {/* Empty state when no time blocks */}
                {sortedTimeBlocks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Clock size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 mb-3">No time blocks scheduled</p>
                      <p className="text-sm text-gray-400">Click "Add Time Block" to get started</p>
                    </div>
                  </div>
                )}
                </div>
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

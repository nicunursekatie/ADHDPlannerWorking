import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '../../types';
import { TaskDisplay } from '../TaskDisplay';
import Button from '../common/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VirtualTaskListProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskBreakdown?: (task: Task) => void;
  pageSize?: number;
  showPagination?: boolean;
  virtualScroll?: boolean;
  maxHeight?: string;
}

export const VirtualTaskList: React.FC<VirtualTaskListProps> = ({
  tasks,
  onTaskToggle,
  onTaskEdit,
  onTaskDelete,
  onTaskBreakdown,
  pageSize = 25,
  showPagination = true,
  virtualScroll = false,
  maxHeight = '600px'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: pageSize });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 120; // Approximate height of each task item
  
  const totalPages = Math.ceil(tasks.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, tasks.length);
  const currentTasks = tasks.slice(startIndex, endIndex);
  
  // Virtual scrolling logic
  const handleScroll = useCallback(() => {
    if (!virtualScroll || !containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 2, tasks.length); // Add buffer
    
    setVisibleRange({ start: Math.max(0, start - 2), end }); // Add buffer
  }, [virtualScroll, tasks.length]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !virtualScroll) return;
    
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, virtualScroll]);
  
  const visibleTasks = virtualScroll 
    ? tasks.slice(visibleRange.start, visibleRange.end)
    : currentTasks;
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when page changes
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  };
  
  // Show loading skeleton for better UX
  const TaskSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 mb-3"></div>
    </div>
  );
  
  if (tasks.length === 0) {
    return null;
  }
  
  return (
    <div>
      {/* Task count info */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {showPagination && !virtualScroll && (
          <span>
            Showing {startIndex + 1}-{endIndex} of {tasks.length} tasks
          </span>
        )}
        {virtualScroll && (
          <span>
            {tasks.length} tasks (virtualized rendering)
          </span>
        )}
      </div>
      
      {/* Task list container */}
      <div
        ref={containerRef}
        className={`space-y-3 ${virtualScroll ? 'overflow-y-auto' : ''}`}
        style={{
          maxHeight: virtualScroll ? maxHeight : undefined,
          position: virtualScroll ? 'relative' : undefined
        }}
      >
        {virtualScroll && (
          <>
            {/* Spacer for virtual scrolling */}
            <div style={{ height: visibleRange.start * itemHeight }} />
            
            {/* Visible tasks */}
            {visibleTasks.map((task) => (
              <div key={task.id} style={{ minHeight: itemHeight }}>
                <TaskDisplay
                  task={task}
                  onToggle={onTaskToggle}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onBreakdown={onTaskBreakdown}
                />
              </div>
            ))}
            
            {/* Bottom spacer */}
            <div style={{ height: (tasks.length - visibleRange.end) * itemHeight }} />
          </>
        )}
        
        {!virtualScroll && (
          <>
            {visibleTasks.map((task, index) => (
              <div 
                key={task.id} 
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TaskDisplay
                  task={task}
                  onToggle={onTaskToggle}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onBreakdown={onTaskBreakdown}
                />
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* Pagination controls */}
      {showPagination && !virtualScroll && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {/* Show first page */}
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  1
                </button>
                {currentPage > 4 && <span className="px-2">...</span>}
              </>
            )}
            
            {/* Show nearby pages */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => Math.abs(page - currentPage) <= 2)
              .map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === currentPage
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            
            {/* Show last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
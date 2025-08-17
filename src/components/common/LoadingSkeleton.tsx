import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'task' | 'project' | 'circular';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'h-4 rounded-md',
    card: 'h-32 rounded-xl',
    task: 'h-24 rounded-lg',
    project: 'h-48 rounded-xl',
    circular: 'rounded-full'
  };
  
  const skeletonStyle = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : undefined)
  };
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={skeletonStyle}
        />
      ))}
    </>
  );
};

// Task Card Skeleton
export const TaskCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start gap-3">
            {/* Checkbox skeleton */}
            <LoadingSkeleton variant="circular" width="24px" height="24px" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              {/* Title */}
              <LoadingSkeleton variant="text" width="75%" height="20px" />
              
              {/* Description */}
              <LoadingSkeleton variant="text" width="90%" height="16px" className="opacity-60" />
              
              {/* Meta info */}
              <div className="flex items-center gap-4 mt-3">
                <LoadingSkeleton variant="text" width="60px" height="20px" className="rounded-full" />
                <LoadingSkeleton variant="text" width="80px" height="20px" className="rounded-full" />
                <LoadingSkeleton variant="text" width="50px" height="20px" className="rounded-full" />
              </div>
            </div>
            
            {/* Actions skeleton */}
            <div className="flex gap-2">
              <LoadingSkeleton variant="circular" width="32px" height="32px" />
              <LoadingSkeleton variant="circular" width="32px" height="32px" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// Project Card Skeleton
export const ProjectCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <LoadingSkeleton variant="circular" width="40px" height="40px" />
              <LoadingSkeleton variant="text" width="150px" height="24px" />
            </div>
            <LoadingSkeleton variant="circular" width="32px" height="32px" />
          </div>
          
          {/* Description */}
          <LoadingSkeleton variant="text" width="100%" height="16px" className="mb-2" />
          <LoadingSkeleton variant="text" width="80%" height="16px" className="mb-4" />
          
          {/* Progress bar */}
          <div className="mb-4">
            <LoadingSkeleton variant="text" width="100%" height="8px" className="rounded-full" />
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <LoadingSkeleton variant="text" width="100px" height="16px" />
            <LoadingSkeleton variant="text" width="80px" height="16px" />
          </div>
        </div>
      ))}
    </>
  );
};

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <LoadingSkeleton variant="circular" width="40px" height="40px" />
            <LoadingSkeleton variant="text" width="60px" height="32px" />
          </div>
          <LoadingSkeleton variant="text" width="120px" height="16px" />
        </div>
      ))}
    </div>
  );
};
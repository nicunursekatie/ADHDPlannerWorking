import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ 
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
  pulse = false,
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium ring-1 ring-inset';
  
  const variantClasses = {
    success: 'bg-success-100 text-success-800 ring-success-600/20 dark:bg-success-400/10 dark:text-success-400 dark:ring-success-400/20',
    warning: 'bg-warning-100 text-warning-800 ring-warning-600/20 dark:bg-warning-400/10 dark:text-warning-400 dark:ring-warning-400/20',
    danger: 'bg-danger-100 text-danger-800 ring-danger-600/20 dark:bg-danger-400/10 dark:text-danger-400 dark:ring-danger-400/20',
    info: 'bg-focus-100 text-focus-800 ring-focus-600/20 dark:bg-focus-400/10 dark:text-focus-400 dark:ring-focus-400/20',
    neutral: 'bg-surface-100 text-surface-800 ring-surface-600/20 dark:bg-surface-400/10 dark:text-surface-400 dark:ring-surface-400/20',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  const pulseClass = pulse ? 'animate-pulse' : '';
  
  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${pulseClass} ${className}`}
    >
      {icon && (
        <span className="mr-1.5 flex-shrink-0">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
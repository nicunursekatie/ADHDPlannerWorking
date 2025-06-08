import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string | ReactNode;
  className?: string;
  headerAction?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'floating' | 'interactive';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  focus?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  headerAction,
  onClick,
  variant = 'default',
  padding = 'md',
  hover = true,
  focus = false,
}) => {
  const baseClasses = 'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-md transition-all duration-200';
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-lg',
    floating: 'shadow-xl',
    interactive: 'hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
  };
  
  const hoverClasses = onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]' : '';
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const focusClass = focus ? 'bg-primary-100/50 dark:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-600 rounded-xl animate-pulse' : '';
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${focusClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {title && (
        <div className="border-b border-surface-200 dark:border-surface-700 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-surface-50 to-white dark:from-surface-800/50 dark:to-surface-800/30">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
              {title}
            </h3>
          ) : (
            <div className="text-lg font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
              {title}
            </div>
          )}
          {headerAction && (
            <div className="text-sm text-surface-600 dark:text-surface-400">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className={`${paddingClasses[padding]} text-surface-700 dark:text-surface-300`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
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
  const baseClasses = onClick ? 'card-hover' : 'card-base';
  
  const variantClasses = {
    default: '',
    elevated: 'card-elevated',
    floating: 'card-floating',
    interactive: 'card-interactive',
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const focusClass = focus ? 'focus-highlight' : '';
  const interactiveClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${focusClass} ${interactiveClass} ${className}`}
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
        <div className="border-b border-surface-200 dark:border-surface-700 px-6 py-4 flex justify-between items-center bg-surface-50 dark:bg-surface-800/50">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
            {title}
          </h3>
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
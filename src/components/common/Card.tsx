import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerAction?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'bordered';
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  headerAction,
  onClick,
  variant = 'default',
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800/40 backdrop-blur-sm transition-all duration-200 overflow-hidden rounded-xl font-sans';
  
  const variantClasses = {
    default: 'border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none',
    elevated: 'border border-gray-200 dark:border-gray-700/50 shadow-md hover:shadow-lg dark:shadow-none dark:hover:shadow-none',
    bordered: 'border-2 border-gray-200 dark:border-gray-700/50 shadow-none hover:border-gray-300 dark:hover:border-gray-600',
  };
  
  const clickableClasses = onClick 
    ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/60 hover:-translate-y-0.5' 
    : '';
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="border-b border-gray-200 dark:border-gray-700/50 px-6 py-4 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-black dark:text-gray-100 tracking-tight font-sans">{title}</h3>
          {headerAction && <div className="text-sm">{headerAction}</div>}
        </div>
      )}
      <div className="px-6 py-5 font-sans text-gray-900 dark:text-gray-100">{children}</div>
    </div>
  );
};

export default Card;
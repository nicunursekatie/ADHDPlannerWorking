import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerAction?: ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  headerAction,
  onClick,
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800/40 backdrop-blur-sm border border-slate-200 dark:border-gray-700/50 transition-all duration-200 overflow-hidden rounded-lg shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none';
  const clickableClasses = onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800/60' : '';
  
  return (
    <div 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="border-b border-slate-200 dark:border-gray-700/50 px-5 py-3 flex justify-between items-center bg-slate-50 dark:bg-transparent">
          <h3 className="text-base font-semibold text-slate-800 dark:text-gray-100">{title}</h3>
          {headerAction && <div className="text-sm">{headerAction}</div>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
};

export default Card;
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
  const baseClasses = 'bg-gray-800 shadow-sm border border-gray-700 hover:shadow-md transition-shadow duration-200 overflow-hidden rounded-xl';
  const clickableClasses = onClick ? 'cursor-pointer hover:border-gray-600' : '';
  
  return (
    <div 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </div>
  );
};

export default Card;
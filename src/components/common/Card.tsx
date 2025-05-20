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
  const baseClasses = 'bg-white backdrop-blur-sm transition-all duration-200 overflow-hidden rounded-xl font-sans';
  
  const variantClasses = {
    default: 'border border-amber-200 shadow-sm hover:shadow-md',
    elevated: 'border border-amber-200 shadow-md hover:shadow-lg',
    bordered: 'border-2 border-amber-200 shadow-none hover:border-amber-300',
  };
  
  const clickableClasses = onClick 
    ? 'cursor-pointer hover:border-amber-300 hover:bg-amber-50/50 hover:-translate-y-0.5' 
    : '';
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="border-b border-amber-200 px-6 py-4 flex justify-between items-center bg-amber-50/50">
          <h3 className="text-lg font-bold text-amber-900 tracking-tight font-sans">{title}</h3>
          {headerAction && <div className="text-sm">{headerAction}</div>}
        </div>
      )}
      <div className="px-6 py-5 font-sans text-amber-900">{children}</div>
    </div>
  );
};

export default Card;
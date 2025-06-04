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
  const baseClasses = 'badge-base';
  
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  const pulseClass = pulse ? 'animate-pulse-gentle' : '';
  
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
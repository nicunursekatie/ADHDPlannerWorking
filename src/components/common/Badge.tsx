import React from 'react';

interface BadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  text, 
  color = '#f59e0b', // amber-500
  bgColor = '#fef3c7', // amber-100
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}
      style={{ 
        backgroundColor: `${bgColor}`,
        color: color,
        borderColor: color
      }}
    >
      {text}
    </span>
  );
};

export default Badge;
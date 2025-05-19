import React from 'react';

interface BadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  text, 
  color = 'white', 
  bgColor = '#6366f1',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${className}`}
      style={{ 
        backgroundColor: `${bgColor}30`,
        color: bgColor,
        borderColor: `${bgColor}80`
      }}
    >
      {text}
    </span>
  );
};

export default Badge;
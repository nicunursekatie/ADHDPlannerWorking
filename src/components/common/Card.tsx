import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string | ReactNode;
  className?: string;
  headerAction?: ReactNode;
  onClick?: () => void;
  variant?: 'glass' | 'glass-purple' | 'elevated' | 'glow' | 'interactive';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  headerAction,
  onClick,
  variant = 'glass',
  padding = 'lg',
  hover = true,
  glow = false,
  gradient = false,
  style,
}) => {
  // Glassmorphism base with modern dark theme
  const baseClasses = `
    relative overflow-hidden rounded-3xl
    backdrop-filter backdrop-blur-xl
    transition-all duration-500 ease-out
    group
  `;
  
  const variantClasses = {
    glass: `
      bg-white/80 border border-gray-200/60
      shadow-lg
    `,
    'glass-purple': `
      bg-primary-50/80 border border-primary-200/60
      shadow-purple
    `,
    elevated: `
      bg-white border border-gray-200
      shadow-xl
    `,
    glow: `
      bg-primary-50/80 border border-primary-300/60
      shadow-purple-lg animate-glow
    `,
    interactive: `
      bg-white/80 border border-gray-200/60
      shadow-lg hover:shadow-purple-lg
      hover:bg-white/90 hover:border-primary-200
      hover:-translate-y-1 hover:scale-[1.02]
      active:scale-[0.98]
    `,
  };
  
  const hoverClasses = hover && !onClick ? `
    hover:shadow-purple-lg hover:bg-white/90 hover:border-primary-200
    hover:-translate-y-1 hover:scale-[1.01]
  ` : '';
  
  const clickableClasses = onClick ? `
    cursor-pointer
    hover:shadow-purple-lg hover:bg-white/90 hover:border-primary-200
    hover:-translate-y-1 hover:scale-[1.02]
    active:scale-[0.98]
    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
    focus:ring-offset-white
  ` : '';
  
  const paddingClasses = {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-10',
    xl: 'p-12',
  };
  
  const glowClass = glow ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary-500/20 before:to-pink-500/20 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100' : '';
  
  const gradientOverlay = gradient ? (
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 pointer-events-none" />
  ) : null;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${clickableClasses} ${glowClass} ${className}`}
      style={style}
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
      {gradientOverlay}
      
      {/* Subtle border glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {title && (
        <div className="relative z-10 border-b border-gray-200/60 pb-4 mb-4 flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            {typeof title === 'string' ? (
              <h3 className="text-xl font-display font-bold text-text-primary tracking-tight">
                {title}
              </h3>
            ) : (
              <div className="text-xl font-display font-bold text-text-primary tracking-tight">
                {title}
              </div>
            )}
          </div>
          {headerAction && (
            <div className="text-sm text-text-tertiary flex-shrink-0 pl-4">
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      <div className={`relative z-10 ${paddingClasses[padding]} text-text-secondary`}>
        {children}
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      </div>
    </div>
  );
};

export default Card;
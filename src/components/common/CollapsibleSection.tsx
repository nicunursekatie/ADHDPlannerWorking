import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useCollapsible } from '../../hooks/useCollapsible';

interface CollapsibleSectionProps {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  icon?: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  children,
  defaultCollapsed = false,
  icon,
  className = '',
  headerClassName = ''
}) => {
  const { isCollapsed, toggle } = useCollapsible(id, defaultCollapsed);
  
  return (
    <div className={`collapsible-container ${className}`}>
      <div 
        className={`collapse-toggle ${headerClassName}`}
        onClick={toggle}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="flex-1">{title}</span>
        <ChevronDown 
          className={`collapse-toggle-icon w-5 h-5 transition-transform ${
            isCollapsed ? '' : 'rotated'
          }`}
        />
      </div>
      <div className="section-divider" />
      <div className={`collapsible-section ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        {children}
      </div>
    </div>
  );
};
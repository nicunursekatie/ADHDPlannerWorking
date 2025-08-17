import { useState, useEffect } from 'react';

export const useCollapsible = (key: string, defaultCollapsed: boolean = false) => {
  const storageKey = `dashboard-section-${key}`;
  
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : defaultCollapsed;
  });
  
  useEffect(() => {
    localStorage.setItem(storageKey, String(isCollapsed));
  }, [isCollapsed, storageKey]);
  
  const toggle = () => setIsCollapsed(prev => !prev);
  
  return { isCollapsed, toggle };
};
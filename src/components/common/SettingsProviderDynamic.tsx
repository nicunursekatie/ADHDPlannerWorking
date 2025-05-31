import React, { useEffect, useContext } from 'react';
import { AppSettings } from '../../types';

interface SettingsContext {
  settings: AppSettings;
}

export const SettingsProviderDynamic: React.FC<{ children: React.ReactNode; settings: AppSettings }> = ({ children, settings }) => {
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    switch (settings.visual.fontSize) {
      case 'small':
        root.style.fontSize = '14px';
        root.classList.remove('text-base', 'text-lg');
        root.classList.add('text-sm');
        break;
      case 'large':
        root.style.fontSize = '18px';
        root.classList.remove('text-sm', 'text-base');
        root.classList.add('text-lg');
        break;
      case 'medium':
      default:
        root.style.fontSize = '16px';
        root.classList.remove('text-sm', 'text-lg');
        root.classList.add('text-base');
        break;
    }

    // Apply layout density
    switch (settings.visual.layoutDensity) {
      case 'compact':
        root.classList.remove('space-comfortable', 'space-spacious');
        root.classList.add('space-compact');
        break;
      case 'spacious':
        root.classList.remove('space-compact', 'space-comfortable');
        root.classList.add('space-spacious');
        break;
      case 'comfortable':
      default:
        root.classList.remove('space-compact', 'space-spacious');
        root.classList.add('space-comfortable');
        break;
    }

    // Apply animations
    if (settings.visual.reduceAnimations) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (settings.visual.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply custom priority colors as CSS variables
    root.style.setProperty('--color-priority-high', settings.visual.customPriorityColors.high);
    root.style.setProperty('--color-priority-medium', settings.visual.customPriorityColors.medium);
    root.style.setProperty('--color-priority-low', settings.visual.customPriorityColors.low);

  }, [settings]);

  return <>{children}</>;
};
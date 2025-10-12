import { AppSettings } from '../types';

export const applySettingsToDocument = (settings: AppSettings) => {
  const root = document.documentElement;

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

  if (settings.visual.reduceAnimations) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  if (settings.visual.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  root.style.setProperty('--color-priority-high', settings.visual.customPriorityColors.high);
  root.style.setProperty('--color-priority-medium', settings.visual.customPriorityColors.medium);
  root.style.setProperty('--color-priority-low', settings.visual.customPriorityColors.low);
};

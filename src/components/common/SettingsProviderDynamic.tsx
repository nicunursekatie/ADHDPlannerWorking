import React, { useEffect } from 'react';
import { AppSettings } from '../../types';
import { applySettingsToDocument } from '../../utils/applySettingsToDocument';

interface SettingsContext {
  settings: AppSettings;
}

export const SettingsProviderDynamic: React.FC<{ children: React.ReactNode; settings: AppSettings }> = ({ children, settings }) => {
  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  return <>{children}</>;
};
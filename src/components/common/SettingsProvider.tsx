import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { applySettingsToDocument } from '../../utils/applySettingsToDocument';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useAppContext();

  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  return <>{children}</>;
};
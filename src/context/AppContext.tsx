// Full cleaned version of AppContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, Project, Category, DailyPlan, WhatNowCriteria, JournalEntry, AppSettings } from '../types';
import { WorkSchedule, WorkShift, ShiftType, DEFAULT_SHIFTS } from '../types/WorkSchedule';
import * as localStorage from '../utils/localStorage';
import { generateId, createSampleData, recommendTasks as recommendTasksUtil } from '../utils/helpers';
import { getTodayString, formatDateString, extractDateFromText } from '../utils/dateUtils';

const AppContext = createContext(undefined);

const UNDO_WINDOW = 5000;

const DEFAULT_SETTINGS = {
  timeManagement: {
    defaultBufferTime: 15,
    timeBlindnessAlerts: false,
    timeBlindnessInterval: 60,
    autoAdjustEstimates: false,
    gettingReadyTime: 30
  },
  visual: {
    fontSize: 'medium',
    layoutDensity: 'comfortable',
    reduceAnimations: false,
    highContrast: false,
    customPriorityColors: {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    }
  }
};

export const AppProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [workSchedule, setWorkSchedule] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadData = () => {
      try {
        let loadedTasks = [];
        let loadedProjects = [];
        let loadedCategories = [];
        let loadedWorkSchedule = null;
        let loadedJournalEntries = [];
        let loadedSettings = null;

        try {
          loadedTasks = localStorage.getTasks();
        } catch {}

        try {
          loadedProjects = localStorage.getProjects();
        } catch {}

        try {
          loadedCategories = localStorage.getCategories();
        } catch {}

        // dailyPlans intentionally skipped

        try {
          loadedWorkSchedule = localStorage.getWorkSchedule();
        } catch {}

        try {
          loadedJournalEntries = localStorage.getJournalEntries();
        } catch {}

        try {
          loadedSettings = localStorage.getSettings();
        } catch {}

        setTasks(loadedTasks);
        setProjects(loadedProjects);
        setCategories(loadedCategories);
        // setDailyPlans intentionally skipped
        setWorkSchedule(loadedWorkSchedule);
        setJournalEntries(loadedJournalEntries);
        if (loadedSettings) setSettings(loadedSettings);

        const hasData =
          loadedTasks.length > 0 ||
          loadedProjects.length > 0 ||
          loadedCategories.length > 0;

        setIsDataInitialized(hasData);
      } catch {
        setTasks([]);
        setProjects([]);
        setCategories([]);
        setDailyPlans([]);
        setWorkSchedule(null);
        setJournalEntries([]);
        setIsDataInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <AppContext.Provider value={{
      tasks,
      setTasks,
      projects,
      setProjects,
      categories,
      setCategories,
      dailyPlans,
      setDailyPlans,
      workSchedule,
      setWorkSchedule,
      journalEntries,
      setJournalEntries,
      isLoading,
      isDataInitialized,
      settings,
      setSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
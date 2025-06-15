import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContextSupabase';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProviderDynamic } from './components/common/SettingsProviderDynamic';
import { AuthForm } from './components/auth/AuthForm';
import LayoutWithAuth from './components/layout/LayoutWithAuth';

// Import pages that work with Supabase context
import SettingsPageWithMigration from './pages/SettingsPageWithMigration';
import TasksPageSupabase from './pages/TasksPageSupabase';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import PlannerPage from './pages/PlannerPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import AccountabilityPage from './pages/AccountabilityPage';
import BrainDumpPage from './pages/BrainDumpPage';
import WhatNowPage from './pages/WhatNowPage';

// Create wrapper components for pages that use localStorage context
// These will be replaced with proper Supabase-compatible versions later
const PlaceholderPage: React.FC<{ name: string }> = ({ name }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">{name}</h1>
      <p className="text-gray-600 dark:text-gray-400">
        This page is being updated for cloud storage support.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
        Please check back soon!
      </p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, isLoading, settings } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }
  
  return (
    <SettingsProviderDynamic settings={settings}>
      <Router>
        <LayoutWithAuth>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPageSupabase />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/what-now" element={<WhatNowPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/planning" element={<PlaceholderPage name="Planning" />} />
            <Route path="/settings" element={<SettingsPageWithMigration />} />
            
            {/* Memory Tools Routes */}
            <Route path="/brain-dump" element={<BrainDumpPage />} />
            <Route path="/weekly-review" element={<WeeklyReviewPage />} />
            <Route path="/accountability" element={<AccountabilityPage />} />
            <Route path="/deleted-tasks" element={<PlaceholderPage name="Deleted Tasks" />} />
          </Routes>
        </LayoutWithAuth>
      </Router>
    </SettingsProviderDynamic>
  );
};

function AppSupabase() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default AppSupabase;
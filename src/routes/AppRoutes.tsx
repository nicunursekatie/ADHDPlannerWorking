import React from 'react';
import { Route, Routes } from 'react-router-dom';

const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const TasksPageWithBulkOps = React.lazy(() => import('../pages/TasksPageWithBulkOps'));
const TasksPageSupabase = React.lazy(() => import('../pages/TasksPageSupabase'));
const ProjectsPage = React.lazy(() => import('../pages/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('../pages/ProjectDetailPage'));
const CategoriesPage = React.lazy(() => import('../pages/CategoriesPage'));
const WhatNowPage = React.lazy(() => import('../pages/WhatNowPage'));
const CalendarPage = React.lazy(() => import('../pages/CalendarPage'));
const EnhancedPlanningPage = React.lazy(() => import('../pages/EnhancedPlanningPage'));
const PlannerPage = React.lazy(() => import('../pages/PlannerPage'));
const SettingsPage = React.lazy(() => import('../pages/SettingsPage'));
const SettingsPageWithMigration = React.lazy(() => import('../pages/SettingsPageWithMigration'));
const BrainDumpPage = React.lazy(() => import('../pages/BrainDumpPage'));
const WeeklyReviewPage = React.lazy(() => import('../pages/WeeklyReviewPage'));
const AccountabilityPage = React.lazy(() => import('../pages/AccountabilityPage'));
const DeletedTasksPage = React.lazy(() => import('../pages/DeletedTasksPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/ResetPasswordPage'));

interface PlaceholderPageProps {
  name: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ name }) => (
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

interface AppRoute {
  path: string;
  localElement: React.ReactElement;
  supabaseElement?: React.ReactElement;
}

const routes: AppRoute[] = [
  { path: '/', localElement: <Dashboard /> },
  { path: '/tasks', localElement: <TasksPageWithBulkOps />, supabaseElement: <TasksPageSupabase /> },
  { path: '/projects', localElement: <ProjectsPage /> },
  { path: '/projects/:projectId', localElement: <ProjectDetailPage /> },
  { path: '/categories', localElement: <CategoriesPage /> },
  { path: '/what-now', localElement: <WhatNowPage /> },
  { path: '/calendar', localElement: <CalendarPage /> },
  { path: '/planner', localElement: <PlannerPage /> },
  { path: '/planning', localElement: <EnhancedPlanningPage />, supabaseElement: <PlaceholderPage name="Planning" /> },
  { path: '/settings', localElement: <SettingsPage />, supabaseElement: <SettingsPageWithMigration /> },
  { path: '/brain-dump', localElement: <BrainDumpPage /> },
  { path: '/weekly-review', localElement: <WeeklyReviewPage /> },
  { path: '/accountability', localElement: <AccountabilityPage /> },
  { path: '/deleted-tasks', localElement: <DeletedTasksPage />, supabaseElement: <PlaceholderPage name="Deleted Tasks" /> },
];

export const AppRoutes: React.FC<{ storageMode: 'local' | 'supabase' }> = ({ storageMode }) => (
  <Routes>
    {routes.map(({ path, localElement, supabaseElement }) => (
      <Route
        key={path}
        path={path}
        element={storageMode === 'supabase' ? supabaseElement ?? localElement : localElement}
      />
    ))}
  </Routes>
);

export const ResetPasswordRoutes: React.FC = () => (
  <Routes>
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="*" element={<ResetPasswordPage />} />
  </Routes>
);

import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './components/common/SettingsProvider';
import Layout from './components/layout/Layout';

// Lazy-loaded pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TasksPageWithBulkOps = React.lazy(() => import('./pages/TasksPageWithBulkOps'));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage'));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'));
const WhatNowPage = React.lazy(() => import('./pages/WhatNowPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const EnhancedPlanningPage = React.lazy(() => import('./pages/EnhancedPlanningPage'));
const PlannerPage = React.lazy(() => import('./pages/PlannerPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

// Memory Tools Pages
const BrainDumpPage = React.lazy(() => import('./pages/BrainDumpPage'));
const WeeklyReviewPage = React.lazy(() => import('./pages/WeeklyReviewPage'));
const AccountabilityPage = React.lazy(() => import('./pages/AccountabilityPage'));
const DeletedTasksPage = React.lazy(() => import('./pages/DeletedTasksPage'));

interface AppRoute {
  path: string;
  Component: React.ComponentType;
}

const appRoutes: AppRoute[] = [
  { path: '/', Component: Dashboard },
  { path: '/tasks', Component: TasksPageWithBulkOps },
  { path: '/projects', Component: ProjectsPage },
  { path: '/projects/:projectId', Component: ProjectDetailPage },
  { path: '/categories', Component: CategoriesPage },
  { path: '/what-now', Component: WhatNowPage },
  { path: '/calendar', Component: CalendarPage },
  { path: '/planner', Component: PlannerPage },
  { path: '/planning', Component: EnhancedPlanningPage },
  { path: '/settings', Component: SettingsPage },
  { path: '/brain-dump', Component: BrainDumpPage },
  { path: '/weekly-review', Component: WeeklyReviewPage },
  { path: '/accountability', Component: AccountabilityPage },
  { path: '/deleted-tasks', Component: DeletedTasksPage },
];

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <SettingsProvider>
          <Router>
            <Layout>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  {appRoutes.map(({ path, Component }) => (
                    <Route key={path} path={path} element={<Component />} />
                  ))}
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </SettingsProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
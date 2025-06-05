import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './components/common/SettingsProvider';
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import TasksPageWithBulkOps from './pages/TasksPageWithBulkOps';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import WhatNowPage from './pages/WhatNowPage';
import CalendarPage from './pages/CalendarPage';
import EnhancedPlanningPage from './pages/EnhancedPlanningPage';
import PlannerPage from './pages/PlannerPage';
import SettingsPage from './pages/SettingsPage';

// Memory Tools Pages
import BrainDumpPage from './pages/BrainDumpPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import AccountabilityPage from './pages/AccountabilityPage';
import DeletedTasksPage from './pages/DeletedTasksPage';

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <SettingsProvider>
          <Router>
            <Layout>
              <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPageWithBulkOps />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/what-now" element={<WhatNowPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/planning" element={<EnhancedPlanningPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Memory Tools Routes */}
            <Route path="/brain-dump" element={<BrainDumpPage />} />
            <Route path="/weekly-review" element={<WeeklyReviewPage />} />
            <Route path="/accountability" element={<AccountabilityPage />} />
            <Route path="/deleted-tasks" element={<DeletedTasksPage />} />
          </Routes>
        </Layout>
      </Router>
          </SettingsProvider>
    </AppProvider>
    </ThemeProvider>
  );
}

export default App;

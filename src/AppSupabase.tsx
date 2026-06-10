import React, { Suspense } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContextSupabase';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProviderDynamic } from './components/common/SettingsProviderDynamic';
import { AuthForm } from './components/auth/AuthForm';
import { FullPageStatus } from './components/common/FullPageStatus';
import LayoutWithAuth from './components/layout/LayoutWithAuth';
import { AppRoutes, ResetPasswordRoutes } from './routes/AppRoutes';

const isResetPasswordRoute = () => {
  const hash = window.location.hash;

  return (
    hash === '#/reset-password' ||
    hash.includes('#/reset-password') ||
    (hash.includes('type=recovery') && hash.includes('access_token'))
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading, settings } = useAppContext();

  if (isLoading) {
    return <FullPageStatus message="Loading..." />;
  }

  if (isResetPasswordRoute()) {
    return (
      <Router>
        <Suspense fallback={<FullPageStatus message="Loading..." />}>
          <ResetPasswordRoutes />
        </Suspense>
      </Router>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }

  return (
    <SettingsProviderDynamic settings={settings}>
      <Router>
        <LayoutWithAuth>
          <Suspense fallback={<FullPageStatus message="Loading..." />}>
            <AppRoutes storageMode="supabase" />
          </Suspense>
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

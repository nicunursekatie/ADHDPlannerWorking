import React, { Suspense } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './components/common/SettingsProvider';
import { FullPageStatus } from './components/common/FullPageStatus';
import Layout from './components/layout/Layout';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <SettingsProvider>
          <Router>
            <Layout>
              <Suspense fallback={<FullPageStatus message="Loading..." />}>
                <AppRoutes storageMode="local" />
              </Suspense>
            </Layout>
          </Router>
        </SettingsProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;

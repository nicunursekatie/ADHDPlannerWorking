import React, { useEffect, useState } from 'react';
import App from './App';
import { FullPageStatus } from './components/common/FullPageStatus';

const hasSupabaseCredentials = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

function AppWithAuth() {
  const [SupabaseApp, setSupabaseApp] = useState<React.ComponentType | null>(null);
  const [failedToLoadSupabase, setFailedToLoadSupabase] = useState(false);

  useEffect(() => {
    if (!hasSupabaseCredentials) {
      console.warn('Supabase credentials not found, falling back to localStorage');
      return;
    }

    let isMounted = true;

    import('./AppSupabase')
      .then((module) => {
        if (isMounted) {
          setSupabaseApp(() => module.default);
        }
      })
      .catch((error) => {
        console.error('Failed to load Supabase app', error);
        if (isMounted) {
          setFailedToLoadSupabase(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!hasSupabaseCredentials || failedToLoadSupabase) {
    return <App />;
  }

  if (SupabaseApp) {
    return <SupabaseApp />;
  }

  return <FullPageStatus message="Initializing..." />;
}

export default AppWithAuth;

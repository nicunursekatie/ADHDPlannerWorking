import React, { useState, useEffect } from 'react';
import App from './App';

function AppWithAuth() {
  const [useSupabase, setUseSupabase] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [SupabaseApp, setSupabaseApp] = useState<React.ComponentType | null>(null);

  // Check if we have Supabase credentials
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not found, falling back to localStorage');
      setUseSupabase(false);
      setIsChecking(false);
      return;
    }

    let isMounted = true;

    import('./AppSupabase')
      .then((module) => {
        if (!isMounted) return;
        setSupabaseApp(() => module.default);
        setUseSupabase(true);
      })
      .catch((error) => {
        console.error('Failed to load Supabase app', error);
        if (isMounted) {
          setUseSupabase(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Initializing...</div>
      </div>
    );
  }

  // Use Supabase version if credentials are available
  if (useSupabase && SupabaseApp) {
    return <SupabaseApp />;
  }

  // Fallback to localStorage version
  return <App />;
}

export default AppWithAuth;

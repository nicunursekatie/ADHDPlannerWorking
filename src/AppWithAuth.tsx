import React, { useState, useEffect } from 'react';
import AppSupabase from './AppSupabase';
import App from './App';

function AppWithAuth() {
  const [useSupabase, setUseSupabase] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  
  // Check if we have Supabase credentials
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not found, falling back to localStorage');
      setUseSupabase(false);
    }
    setIsChecking(false);
  }, []);
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Initializing...</div>
      </div>
    );
  }
  
  // Use Supabase version if credentials are available
  if (useSupabase) {
    return <AppSupabase />;
  }
  
  // Fallback to localStorage version
  return <App />;
}

export default AppWithAuth;
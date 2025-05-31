import { useContext } from 'react';
import { AppContext as AppContextLocal } from '../context/AppContext';
import { AppContext as AppContextSupabase } from '../context/AppContextSupabase';

// This hook attempts to use whichever AppContext is available
export const useAppContextBridge = () => {
  // Try Supabase context first
  try {
    const supabaseContext = useContext(AppContextSupabase);
    if (supabaseContext !== undefined) {
      return supabaseContext;
    }
  } catch (e) {
    // Supabase context not available
  }
  
  // Fall back to localStorage context
  try {
    const localContext = useContext(AppContextLocal);
    if (localContext !== undefined) {
      return localContext;
    }
  } catch (e) {
    // localStorage context not available
  }
  
  throw new Error('useAppContextBridge must be used within either AppProvider');
};
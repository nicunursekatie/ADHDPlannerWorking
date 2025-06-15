import React from 'react';
import Dashboard from './Dashboard';

// This wrapper allows Dashboard to work with both localStorage and Supabase contexts
const DashboardWrapper: React.FC = () => {
  return <Dashboard />;
};

export default DashboardWrapper;
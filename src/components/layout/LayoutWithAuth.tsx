import React, { ReactNode } from 'react';
import HeaderWithAuth from './HeaderWithAuth';

interface LayoutProps {
  children: ReactNode;
}

const LayoutWithAuth: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-amber-950/20">
      <HeaderWithAuth />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="space-y-8">
          {children}
        </div>
      </main>
      <footer className="mt-auto py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} ADHD Planner. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LayoutWithAuth;
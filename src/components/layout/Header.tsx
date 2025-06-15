import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ClipboardList, 
  Layout, 
  Folder, 
  Tag, 
  Calendar, 
  Clock,
  HelpCircle,
  Menu,
  X,
  Settings,
  Repeat,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Layout size={18} />, primary: true },
    { path: '/tasks', label: 'Tasks', icon: <ClipboardList size={18} />, primary: true },
    { path: '/projects', label: 'Projects', icon: <Folder size={18} />, primary: true },
    { path: '/categories', label: 'Categories', icon: <Tag size={18} />, primary: false },
    { path: '/recurring-tasks', label: 'Recurring', icon: <Repeat size={18} />, primary: false },
    { path: '/calendar', label: 'Calendar', icon: <Calendar size={18} />, primary: true },
    { path: '/planner', label: 'Planner', icon: <Clock size={18} />, primary: true },
    { path: '/settings', label: 'Settings', icon: <Settings size={18} />, primary: false },
  ];
  
  const primaryNavItems = navItems.filter(item => item.primary);
  const secondaryNavItems = navItems.filter(item => !item.primary);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-900/90 backdrop-blur-lg border-b border-surface-200 dark:border-surface-700 shadow-sm">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="skip-link"
        >
          Skip to main content
        </a>
        
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group focus:outline-none focus:ring-2 focus:ring-focus-500 rounded-xl p-1">
              <div className="p-2.5 bg-gradient-to-br from-focus-500 to-primary-600 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold text-surface-900 dark:text-surface-100 tracking-tight group-hover:text-focus-600 dark:group-hover:text-focus-400 transition-colors">
                  ADHD Planner
                </span>
                <div className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                  Focus • Organize • Succeed
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2" role="navigation" aria-label="Main navigation">
            {/* Primary Navigation */}
            <div className="flex items-center space-x-1 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-focus-600 text-white shadow-md scale-105'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
            </div>
            
            {/* Secondary Navigation */}
            <div className="flex items-center space-x-1">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-surface-100'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
          
          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-focus-500 bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {/* What Now Button */}
            <Link
              to="/what-now"
              className="hidden md:inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warning-500 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <HelpCircle size={16} className="mr-2" />
              What Now?
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-focus-500 transition-all duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div 
        className={`${
          isMobileMenuOpen ? 'block animate-slideIn' : 'hidden'
        } lg:hidden bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700`}
      >
        <div className="pt-4 pb-3 space-y-2 px-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 border-l-4 text-base font-medium transition-all duration-200 rounded-r-lg ${
                isActive(item.path)
                  ? 'bg-focus-50 dark:bg-focus-900/20 border-focus-500 text-focus-700 dark:text-focus-300'
                  : 'border-transparent text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600 hover:text-surface-900 dark:hover:text-surface-200'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </div>
            </Link>
          ))}
          
          <Link
            to="/what-now"
            className="block px-4 py-3 border-l-4 border-transparent text-base font-medium text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 hover:border-warning-300 transition-all duration-200 rounded-r-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <HelpCircle size={18} />
              <span className="ml-3">What Now?</span>
            </div>
          </Link>
          
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full text-left px-4 py-3 border-l-4 border-transparent text-base font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200 transition-all duration-200 rounded-r-lg"
          >
            <div className="flex items-center">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span className="ml-3">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
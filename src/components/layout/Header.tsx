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
    { path: '/', label: 'Dashboard', icon: <Layout size={18} /> },
    { path: '/tasks', label: 'Tasks', icon: <ClipboardList size={18} /> },  // Changed from "All Tasks"
    { path: '/projects', label: 'Projects', icon: <Folder size={18} /> },
    { path: '/categories', label: 'Categories', icon: <Tag size={18} /> },
    { path: '/recurring-tasks', label: 'Recurring', icon: <Repeat size={18} /> },
    { path: '/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    { path: '/planner', label: 'Planner', icon: <Clock size={18} /> },  // Changed from "Daily Planner"
    { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="p-2 bg-amber-500 rounded-lg shadow-sm group-hover:bg-amber-600 transition-colors">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                ADHD Planner
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-amber-50 dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {/* What Now Button */}
            <Link
              to="/what-now"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 border border-transparent transition-all duration-200"
            >
              <HelpCircle size={16} className="mr-1.5" />
              What Now?
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 transition-all duration-200"
            >
              <span className="sr-only">Open main menu</span>
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
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-all duration-200`}
      >
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-amber-50 dark:bg-gray-800 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </div>
            </Link>
          ))}
          
          <Link
            to="/what-now"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-800 hover:border-amber-300 transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <HelpCircle size={18} />
              <span className="ml-2">What Now?</span>
            </div>
          </Link>
          
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200"
          >
            <div className="flex items-center">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span className="ml-2">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
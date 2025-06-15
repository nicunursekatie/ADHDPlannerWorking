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
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContextSupabase';

const HeaderWithAuth: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAppContext();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Layout size={18} /> },
    { path: '/tasks', label: 'Tasks', icon: <ClipboardList size={18} /> },
    { path: '/projects', label: 'Projects', icon: <Folder size={18} /> },
    { path: '/categories', label: 'Categories', icon: <Tag size={18} /> },
    { path: '/recurring-tasks', label: 'Recurring', icon: <Repeat size={18} /> },
    { path: '/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    { path: '/planner', label: 'Planner', icon: <Clock size={18} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="p-2 bg-purple-600 dark:bg-purple-700 rounded-xl shadow-sm group-hover:bg-purple-700 dark:group-hover:bg-purple-600 transition-all hover:scale-105">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                  isActive(item.path)
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {/* User email display */}
            {user && (
              <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </span>
            )}
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 hover:scale-105 shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
              aria-label="Sign out"
            >
              <LogOut size={16} className="mr-1.5" />
              Sign Out
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-all duration-200 hover:scale-105"
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
          {/* User email in mobile */}
          {user && (
            <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 mb-2">
              {user.email}
            </div>
          )}
          
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 dark:border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </div>
            </Link>
          ))}
          
          
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
          
          {/* Mobile Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200"
          >
            <div className="flex items-center">
              <LogOut size={18} />
              <span className="ml-2">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderWithAuth;
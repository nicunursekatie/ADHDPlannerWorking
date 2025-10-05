import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ClipboardList, 
  Layout, 
  Folder, 
  Tag, 
  Calendar, 
  Clock,
  Menu,
  X,
  Settings,
  Repeat,
  LogOut,
  Command,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContextSupabase';
import { DarkModeToggleCompact } from '../common/DarkModeToggle';

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
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md font-semibold after:absolute after:bottom-1 after:left-2 after:right-2 after:h-0.5 after:bg-white/90 after:rounded-full'
                    : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="ml-1.5">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* User email display */}
            {user && (
              <span className="hidden xl:inline text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                {user.email}
              </span>
            )}
            
            {/* Command Palette Hint */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  ctrlKey: true,
                  bubbles: true
                });
                window.dispatchEvent(event);
              }}
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open command palette"
            >
              <Command size={12} />
              <span>⌘K</span>
            </button>
            
            {/* Theme Toggle Button */}
            <DarkModeToggleCompact />
            
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="hidden lg:inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap"
              aria-label="Sign out"
            >
              <LogOut size={16} className="mr-1.5" />
              Sign Out
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-5 w-5" />
              ) : (
                <Menu className="block h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div 
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-all duration-200`}
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
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-purple-100/70 dark:bg-purple-900/30 border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-300 font-semibold'
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
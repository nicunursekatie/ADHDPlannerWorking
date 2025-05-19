import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  icon,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900';
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md border border-transparent',
    secondary: 'bg-slate-100 dark:bg-gray-700/50 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-gray-700 focus:ring-slate-500 dark:focus:ring-gray-600 border border-slate-200 dark:border-gray-600 shadow-sm hover:shadow-md dark:shadow-none',
    outline: 'bg-transparent border-2 border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-900 dark:hover:text-gray-100 focus:ring-slate-500 dark:focus:ring-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md border border-transparent',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm font-medium leading-4',
    md: 'px-4 py-2 text-sm font-semibold',
    lg: 'px-5 py-2.5 text-base font-semibold',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
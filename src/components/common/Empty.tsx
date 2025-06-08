import React, { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const Empty: React.FC<EmptyProps> = ({
  title,
  description,
  icon = <InboxIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />,
  action,
}) => {
  const encouragements = [
    "Ready to tackle your day?",
    "Let's get started!",
    "Time to make progress!",
    "You've got this!"
  ];
  
  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  
  return (
    <div className="text-center py-12">
      <div className="inline-block mb-4 animate-bounce-slow">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
      <p className="mt-3 text-sm text-purple-600 dark:text-purple-400 font-medium animate-fadeIn">{randomEncouragement}</p>
      {action && <div className="mt-6 animate-slideUp">{action}</div>}
    </div>
  );
};

export default Empty;
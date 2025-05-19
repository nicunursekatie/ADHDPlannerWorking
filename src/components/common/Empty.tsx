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
  icon = <InboxIcon className="mx-auto h-12 w-12 text-gray-300" />,
  action,
}) => {
  return (
    <div className="text-center py-16">
      <div className="inline-block mb-4">{icon}</div>
      <h3 className="text-base font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default Empty;
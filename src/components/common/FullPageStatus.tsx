import React from 'react';

interface FullPageStatusProps {
  message: string;
}

export const FullPageStatus: React.FC<FullPageStatusProps> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-lg">{message}</div>
  </div>
);

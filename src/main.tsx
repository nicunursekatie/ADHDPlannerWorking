import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWithAuth from './AppWithAuth.tsx';
import './index.css';
import { unregister } from './utils/serviceWorkerRegistration';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithAuth />
  </StrictMode>
);

// Unregister service worker to prevent update notifications
unregister();

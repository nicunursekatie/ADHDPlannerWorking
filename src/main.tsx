import './styles/global.css'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWithAuth from './AppWithAuth.tsx';
import './index.css';
import { register } from './utils/serviceWorkerRegistration';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithAuth />
  </StrictMode>
);

// Register service worker for PWA functionality
register();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and suppress benign Vite HMR WebSocket connection errors in this environment
if (typeof window !== 'undefined') {
  const isViteWSError = (msg: string) => {
    return (
      msg.includes('WebSocket') ||
      msg.includes('vite') ||
      msg.includes('hmr') ||
      msg.includes('HMR')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message || String(event.reason || '');
    if (isViteWSError(errorMsg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    if (isViteWSError(errorMsg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

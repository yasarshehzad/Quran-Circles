import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initAnalytics} from './lib/analytics';

// Initialize Google Analytics 4 if VITE_GA_MEASUREMENT_ID is configured
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

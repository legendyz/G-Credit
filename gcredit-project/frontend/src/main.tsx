import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/axe-setup'; // Accessibility testing (dev mode only)
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

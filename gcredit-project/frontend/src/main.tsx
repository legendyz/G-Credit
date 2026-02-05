import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/accessibility.css'; // Story 8.3: WCAG 2.1 AA accessibility styles
import './lib/axe-setup'; // Accessibility testing (dev mode only)
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

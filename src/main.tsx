import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { useAuthStore } from './hooks/useStore';

// DEV-ONLY: expose the auth store so previews can inject a mock user.
if (import.meta.env.DEV) {
  (window as unknown as { __authStore?: unknown }).__authStore = useAuthStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

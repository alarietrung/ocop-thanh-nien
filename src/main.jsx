import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

if (
  import.meta.env.PROD &&
  !isFileProtocol &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator
) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nextWorker = reg.installing;
          if (!nextWorker) return;
          nextWorker.addEventListener('statechange', () => {
            if (nextWorker.state === 'installed' && navigator.serviceWorker.controller) {
              nextWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {
        // Ignore service worker registration errors in unsupported contexts
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isFileProtocol ? (
        <HashRouter>
          <App />
        </HashRouter>
      ) : (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);

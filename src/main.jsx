import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  const temizlendiAnahtari = 'braille-dev-sw-cleaned';
  Promise.all([
    navigator.serviceWorker.getRegistrations(),
    'caches' in window ? caches.keys() : Promise.resolve([])
  ]).then(async ([registrations, cacheNames]) => {
    if (registrations.length === 0 && cacheNames.length === 0) {
      sessionStorage.removeItem(temizlendiAnahtari);
      return;
    }
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ('caches' in window) {
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
    if (!sessionStorage.getItem(temizlendiAnahtari)) {
      sessionStorage.setItem(temizlendiAnahtari, '1');
      window.location.reload();
    }
  }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

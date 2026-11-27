// THE COMPANION'S OWN ENTRY (MOBILE slice 1): /m/ on the same server, its own page and its own bundle, so today's Wrizo loads none of it. Wider than 1100 px there is nothing to offer: the desk gets today's Wrizo, untouched.
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/figtree';
import '@fontsource-variable/crimson-pro';
import './mobile.css';
import { initTheme } from '../store/theme';
import { initThemePrefs } from '../store/themePrefs';
import { Companion } from './Companion';

export const DESK_MIN_WIDTH = 1100;

if (window.matchMedia(`(min-width: ${DESK_MIN_WIDTH}px)`).matches) {
  window.location.replace('/');
} else {
  initTheme();
  initThemePrefs();
  if ('serviceWorker' in navigator) {
    // the app's own files only, so the companion opens with no signal (public/m/sw.js)
    navigator.serviceWorker.register('/m/sw.js', { scope: '/m/' }).catch(() => { /* no helper: it still works with a signal */ });
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Companion />
    </React.StrictMode>,
  );
}

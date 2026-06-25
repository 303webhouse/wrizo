import React from 'react';
import ReactDOM from 'react-dom/client';
// Fonts bundled locally (no CDN) so the app renders fully offline.
// Wrizo brand: Figtree (titles/UI), Crimson Pro (body/writing surface).
import '@fontsource-variable/figtree';
import '@fontsource-variable/crimson-pro';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

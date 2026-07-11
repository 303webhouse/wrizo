import React from 'react';
import ReactDOM from 'react-dom/client';
// Fonts bundled locally (no CDN) so the app renders fully offline.
// Wrizo brand: Figtree (titles/UI), Crimson Pro (body/writing surface).
import '@fontsource-variable/figtree';
import '@fontsource-variable/crimson-pro';
// S1 — Courier Prime, scoped to the script surface only (--font-script);
// not variable-weight, so Regular + Bold load as two explicit files.
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

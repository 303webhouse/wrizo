import React from 'react';
import ReactDOM from 'react-dom/client';
// Fonts bundled locally (no CDN) so the app renders fully offline.
import '@fontsource-variable/newsreader';
import '@fontsource-variable/figtree';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

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
// TH1 Slice 2 — Flux's chromeLabel/contentLabel font slots (canon §4). Not
// variable-weight; loaded at the exact cuts the canon table names. Unused by
// Plateau today (its slot values stay Figtree/Crimson Pro) — bundled now so
// TH2 ships zero new npm deps, per the brief's constraint.
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/chakra-petch/400.css';
import '@fontsource/chakra-petch/500.css';
import { App } from './App';
import './index.css';
import { initTheme } from './store/theme';
import { initThemePrefs } from './store/themePrefs';

// TH1 — apply the theme + preference attributes to <html> before the first
// render so there is never a themeless/wrong-voice flash.
initTheme();
initThemePrefs();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

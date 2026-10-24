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
// THEME PICKER (theme-rules.md B.4 / the picker's own brief) - Flux's card wordmark, bundled
// locally like every other theme font here, no CDN. One weight: a wordmark is static display
// text, never a body face.
import '@fontsource/silkscreen/400.css';
import { App } from './App';
import './index.css';
import { initTheme } from './store/theme';
import { initThemePrefs } from './store/themePrefs';
// TH2 — registers Flux's texture/glow handlers onto TH1's effects scaffold
// (registerThemeFx side effect). Import-for-effect only; nothing here reads
// the binding. Harmless on Plateau — registration just sits unused.
import './store/fluxThemeFx';
// DELETE FOR GOOD: window.wrizoDelete + window.wrizoDestructive (store/deleteSeams.ts), registered once at start like the other seams
import './store/deleteSeams';

// TH1 — apply the theme + preference attributes to <html> before the first
// render so there is never a themeless/wrong-voice flash.
initTheme();
initThemePrefs();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

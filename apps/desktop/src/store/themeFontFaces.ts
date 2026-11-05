import { registerThemeFonts } from './themeFonts';

// MACHINA'S FACES - the literal dynamic imports, kept OUT of anything the harness store loaders bundle (see store/themeFonts.ts for why). Imported by main.tsx ONLY, for its
// registration side effect; every import() below is inside the loader function, so Vite splits each into its own lazy chunk and nothing is fetched until the theme's first use
// (ensureThemeFonts('machina')). Weights are the foundations' own: mono 500; sans 400/500/600; serif 400/500 + italic 400; Atkinson 400/700.
registerThemeFonts('machina', () => Promise.all([
  import('@fontsource/ibm-plex-mono/500.css'),
  import('@fontsource/ibm-plex-sans/400.css'),
  import('@fontsource/ibm-plex-sans/500.css'),
  import('@fontsource/ibm-plex-sans/600.css'),
  import('@fontsource/ibm-plex-serif/400.css'),
  import('@fontsource/ibm-plex-serif/500.css'),
  import('@fontsource/ibm-plex-serif/400-italic.css'),
  import('@fontsource/atkinson-hyperlegible/400.css'),
  import('@fontsource/atkinson-hyperlegible/700.css'),
  // Machina's default writing face loads with the theme [themeFontFaces §1]
  import('@fontsource-variable/source-sans-3/wght.css'),
  import('@fontsource-variable/source-sans-3/wght-italic.css'),
]));

// Arbor's default writing face (EB Garamond) loads with the theme, never eagerly; Arbor's theme id is 'plateau' [themeFontFaces §2]
registerThemeFonts('plateau', () => Promise.all([
  import('@fontsource-variable/eb-garamond/wght.css'),
  import('@fontsource-variable/eb-garamond/wght-italic.css'),
]));

// Flux's default writing face (Titillium Web) loads with the theme [themeFontFaces §3]
registerThemeFonts('flux', () => Promise.all([
  import('@fontsource/titillium-web/400.css'),
  import('@fontsource/titillium-web/400-italic.css'),
  import('@fontsource/titillium-web/700.css'),
  import('@fontsource/titillium-web/700-italic.css'),
]));

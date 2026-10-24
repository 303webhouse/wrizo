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
]));

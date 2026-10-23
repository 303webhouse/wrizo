import type { ThemeId } from './theme';

// A THEME'S OWN FACES, LOADED WHEN THE THEME IS (not at boot). Arbor and Flux import their faces eagerly in main.tsx; Machina's four slots (canon §4 /
// foundations §6: IBM Plex Mono for chrome labels, Plex Sans for content labels, Plex Serif and Atkinson Hyperlegible for prose) would be dead weight for
// every writer who never opens it - and item207-core's LOAD-ON-CHOOSE check holds the eager list where it is. So they load on first use of the theme,
// the same dynamic-import shape the font roster (store/fontRoster.ts) already uses; the bytes only travel when a writer is on Machina.
// Weights are the foundations' own: mono 500; sans 400/500/600; serif 400/500 + italic 400; Atkinson 400/700.
const loaded = new Set<ThemeId>();

export function ensureThemeFonts(theme: ThemeId): void {
  if (theme !== 'machina' || loaded.has(theme)) return;
  loaded.add(theme);
  void Promise.all([
    import('@fontsource/ibm-plex-mono/500.css'),
    import('@fontsource/ibm-plex-sans/400.css'),
    import('@fontsource/ibm-plex-sans/500.css'),
    import('@fontsource/ibm-plex-sans/600.css'),
    import('@fontsource/ibm-plex-serif/400.css'),
    import('@fontsource/ibm-plex-serif/500.css'),
    import('@fontsource/ibm-plex-serif/400-italic.css'),
    import('@fontsource/atkinson-hyperlegible/400.css'),
    import('@fontsource/atkinson-hyperlegible/700.css'),
  ]).catch(() => { loaded.delete(theme); /* offline: the CSS stacks fall back; the next switch retries */ });
}

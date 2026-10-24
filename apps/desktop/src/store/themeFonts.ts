import type { ThemeId } from './theme';

// A THEME'S OWN FACES, LOADED WHEN THE THEME IS (not at boot). Arbor and Flux import their faces eagerly in main.tsx; Machina's four slots (canon §4 /
// foundations §6: IBM Plex Mono for chrome labels, Plex Sans for content labels, Plex Serif and Atkinson Hyperlegible for prose) would be dead weight for
// every writer who never opens it - and item207-core's LOAD-ON-CHOOSE check holds the eager list where it is. So they load on first use of the theme,
// the same dynamic-import shape the font roster (store/fontRoster.ts) already uses; the bytes only travel when a writer is on Machina.
//
// WHERE THE LITERAL IMPORTS LIVE (the Oct 24 train-#6 fix): this module is reached from store/theme.ts, which the harnesses' store loaders bundle with esbuild - and a literal
// `import('@fontsource/ibm-plex-mono/500.css')` inside it made esbuild resolve the css and die on its .woff2 ("No loader for .woff2"), taking 9 files down at load. fontRoster
// never had that problem only because nothing those loaders bundle reaches it. So the literals sit in store/themeFontFaces.ts, which ONLY main.tsx imports, and REGISTER
// themselves here; this module is the registry + the first-use trigger and names no font package at all. Same load-on-choose behaviour: nothing is fetched until
// ensureThemeFonts('machina') runs (the theme's first use, or the picker card's first hover / focus), and the registration may arrive before or after that call.
type Loader = () => Promise<unknown>;

const loaders = new Map<ThemeId, Loader>();
const wanted = new Set<ThemeId>();
const loaded = new Set<ThemeId>();

function run(theme: ThemeId): void {
  const load = loaders.get(theme);
  if (!load || !wanted.has(theme) || loaded.has(theme)) return;
  loaded.add(theme);
  void load().catch(() => { loaded.delete(theme); /* offline: the CSS stacks fall back; the next switch retries */ });
}

/** Called by store/themeFontFaces.ts (main.tsx's import) - the one place a theme's face imports are written. */
export function registerThemeFonts(theme: ThemeId, load: Loader): void {
  loaders.set(theme, load);
  run(theme);
}

export function ensureThemeFonts(theme: ThemeId): void {
  if (theme !== 'machina') return;
  wanted.add(theme);
  run(theme);
}

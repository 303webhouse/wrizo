import type { ThemeId } from './theme';

// a theme's own faces load when the theme does, not at boot; the literal font imports live in store/themeFontFaces.ts (only main.tsx imports it), so the harnesses' esbuild loaders never resolve .woff2 [themeFonts §1]
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
  // any theme that registered faces loads them with the theme; none is eager [themeFonts §2]
  wanted.add(theme);
  run(theme);
}

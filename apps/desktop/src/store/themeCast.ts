import { useEffect, useState } from 'react';
import { getTheme, subscribeTheme } from './theme';

// MACHINA'S CAST (docs/theme-foundations/machina/machina-foundations.md §3/§11; docs/plans/machina-build.md §2) - a second, theme-scoped preference
// dimension: COOL (the default: steel active lines, sparks off) or NEUTRAL (orange active lines, sparks on). It is Machina's alone.
//
// WHY A FILE OF ITS OWN (the plan's open question, decided at build time per Fable's ruling "prefer extending themePrefs.ts if it already holds
// theme-scoped prefs"): themePrefs.ts holds the three CROSS-theme prefs (Voice / Page / Fade - canon §11), every one meaningful on every theme. CAST
// is meaningful on exactly one, so it does not belong in that matrix; keeping it here is what lets the matrix stay "the same three on every theme".
//
// THE LEAK LAW (the shape typewriter-scope just fixed for a different preference): the STORED value survives a theme switch (switch to Arbor and back
// and the writer's CAST is still there - canon §11's lossless round-trip), but it is only ever READ or REFLECTED under Machina. `getCast()` answers the
// fixed default 'cool' under any other theme, and `data-cast` is on <html> ONLY while the theme is Machina - a stale 'neutral' can never colour, or
// even appear on, Arbor or Flux.
//
// Zero schema: a local preference, localStorage only (foundations §13.5). Nothing here reaches sync.
export type Cast = 'cool' | 'neutral';
export const CAST_DEFAULT: Cast = 'cool';
const KEY = 'wrizo-machina-cast';

function sanitize(v: unknown): Cast {
  return v === 'neutral' || v === 'cool' ? v : CAST_DEFAULT;
}

function load(): Cast {
  try {
    return sanitize(typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null);
  } catch {
    return CAST_DEFAULT;
  }
}

let stored: Cast = load();
const subs = new Set<(c: Cast) => void>();

/** The cast the surface should wear RIGHT NOW: the stored one under Machina, the fixed default under every other theme. */
export function getCast(): Cast {
  return getTheme() === 'machina' ? stored : CAST_DEFAULT;
}

/** The writer's stored choice, whichever theme is active (for the round-trip proof and the control's own state; never a styling input). */
export function getStoredCast(): Cast {
  return stored;
}

function applyAttribute() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (getTheme() === 'machina') root.setAttribute('data-cast', stored);
  else root.removeAttribute('data-cast');
}

export function setCast(next: Cast): void {
  stored = sanitize(next);
  try { localStorage.setItem(KEY, stored); } catch { /* ignore */ }
  applyAttribute();
  subs.forEach((fn) => fn(getCast()));
}

// Called once at app boot, alongside initTheme() - the attribute must be on <html> before first paint (no flash of the wrong cast) - and it
// follows every theme switch so the attribute appears and disappears with Machina itself.
export function initThemeCast(): void {
  applyAttribute();
  subscribeTheme(() => { applyAttribute(); subs.forEach((fn) => fn(getCast())); });
}

export function useCast(): Cast {
  const [value, setValue] = useState<Cast>(getCast());
  useEffect(() => {
    const fn = (c: Cast) => setValue(c);
    subs.add(fn);
    setValue(getCast());
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

// Test/inspection seam (the resumeVocab.ts / wrizoThemePrefs pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoCast?: unknown }).wrizoCast = { get: getCast, getStored: getStoredCast, set: setCast };
}

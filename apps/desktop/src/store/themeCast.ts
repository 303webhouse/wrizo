import { useEffect, useState } from 'react';
import { getTheme, subscribeTheme } from './theme';

// Machina's cast (cool or neutral) in its own file: themePrefs holds the cross-theme three; the stored value survives a theme switch but is read only under Machina [themeCast §1]
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

import { useEffect, useState } from 'react';

// TH1 Slice 3 — the cross-theme preference matrix (canon §11). Three prefs
// exist on every theme and survive a theme switch; each theme supplies its
// own values for what the pref SELECTS WITHIN (e.g. Page:dark means nothing
// until a theme defines a dark pair). Persisted per the W1 toggle pattern
// (store/writingSettings.ts's module-level store + subscriber set).
//
// Plateau debt (canon §11, flagged not fixed): Page:dark has no Plateau
// values yet — selecting it is a documented no-op on this theme (index.css
// defines no `[data-voice]`/paper-dark rule for Plateau's dark pair). Voice
// is fully live (Plateau already ships both Figtree and Crimson Pro). Fade
// gates useChromeDissolve — default 'on' preserves today's shipped fade
// behavior exactly; 'off' is new opt-in capability, not a visual change at
// the default.
export type Voice = 'serif' | 'sans';
export type PageTone = 'dark' | 'light';
export type Fade = 'on' | 'off';

export interface ThemePrefs {
  voice: Voice;
  page: PageTone;
  fade: Fade;
}

const KEY = 'wrizo-theme-prefs';
const DEFAULTS: ThemePrefs = { voice: 'serif', page: 'light', fade: 'on' };

function load(): ThemePrefs {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ThemePrefs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let current: ThemePrefs = load();
const subs = new Set<(p: ThemePrefs) => void>();

function applyAttributes(prefs: ThemePrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-voice', prefs.voice);
  root.setAttribute('data-page', prefs.page);
  root.setAttribute('data-fade', prefs.fade);
}

export function getThemePrefs(): ThemePrefs {
  return current;
}

export function setThemePrefs(patch: Partial<ThemePrefs>): void {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  applyAttributes(current);
  subs.forEach(fn => fn(current));
}

// Called once at app boot, alongside initTheme() — attributes must be on
// <html> before first paint-adjacent render (no flash of the wrong voice).
export function initThemePrefs(): void {
  applyAttributes(current);
}

export function useThemePrefs(): ThemePrefs {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (p: ThemePrefs) => setValue(p);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoThemePrefs?: unknown }).wrizoThemePrefs = { get: getThemePrefs, set: setThemePrefs };
}

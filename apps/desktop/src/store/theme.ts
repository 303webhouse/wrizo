import { useEffect, useState } from 'react';

// TH1 Slice 0 — the theme seam's selection mechanism. A theme is a
// `data-theme` attribute on <html> plus per-theme CSS blocks (index.css);
// this store owns only WHICH theme is active, persisted, and reflects it
// onto the attribute — zero runtime cost, no component reads this value to
// render (components read CSS custom properties, never `theme` itself).
//
// TH2 — 'flux' joins the union, exactly the literal-add TH1's comment
// anticipated; later Volant/Nomad/Machina follow the same pattern.
export type ThemeId = 'plateau' | 'flux';

const REGISTERED: readonly ThemeId[] = ['plateau', 'flux'];

// PHASE 1 (S5) - PER-THEME CONFIG. What a NEW page opens with is the theme's call. Today the one field is the typewriter's default for a page that has no
// remembered value (store/writingSettings.ts, enterPageTypewriter): plateau (shown as "Arbor") on, flux off.
//   MARKED SLOTS - these themes are not registered yet (ThemeId above); each joins the union and this table in the same edit:
//     machina: { typewriterDefault: false },
//     nomad:   { typewriterDefault: true },
//     volant:  TBD - Nick has a different mode in mind; do NOT guess a boolean here.
export interface ThemeConfig { typewriterDefault: boolean }
export const THEME_CONFIG: Record<ThemeId, ThemeConfig> = {
  plateau: { typewriterDefault: true },
  flux: { typewriterDefault: false },
};
const KEY = 'wrizo-theme';
const DEFAULT: ThemeId = 'plateau';

function isRegistered(v: unknown): v is ThemeId {
  return typeof v === 'string' && (REGISTERED as readonly string[]).includes(v);
}

function load(): ThemeId {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return isRegistered(raw) ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

let current: ThemeId = load();
const subs = new Set<(t: ThemeId) => void>();

function applyAttribute(theme: ThemeId) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function getTheme(): ThemeId {
  return current;
}

export function setTheme(theme: ThemeId): void {
  if (!isRegistered(theme)) return; // unknown theme id — no-op, never a blank/broken root
  current = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  applyAttribute(current);
  subs.forEach(fn => fn(current));
}

// Called once at app boot (main.tsx) — puts the attribute on <html> before
// first paint-adjacent render so there is never a themeless flash.
export function initTheme(): void {
  applyAttribute(current);
}

export function useTheme(): ThemeId {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (t: ThemeId) => setValue(t);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoTheme?: unknown }).wrizoTheme = { get: getTheme, set: setTheme, REGISTERED };
}

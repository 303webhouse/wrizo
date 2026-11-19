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
// Flux's Jacked In 4 s idle line (Flux draft 23, 6a.9): its own switch under Skin, on by default, off = the line never shows
export type Idle = 'on' | 'off';

export interface ThemePrefs {
  voice: Voice;
  page: PageTone;
  fade: Fade;
  idle: Idle;
}

const KEY = 'wrizo-theme-prefs';
const DEFAULTS: ThemePrefs = { voice: 'serif', page: 'light', fade: 'on', idle: 'on' };

// a raw localStorage read is untrusted: each field is validated against its enum, so a bad value falls to its default instead of reaching a data-* attribute [themePrefs §1]
function sanitize(parsed: Partial<Record<keyof ThemePrefs, unknown>>): ThemePrefs {
  const voice: Voice = parsed.voice === 'serif' || parsed.voice === 'sans' ? parsed.voice : DEFAULTS.voice;
  const page: PageTone = parsed.page === 'dark' || parsed.page === 'light' ? parsed.page : DEFAULTS.page;
  const fade: Fade = parsed.fade === 'on' || parsed.fade === 'off' ? parsed.fade : DEFAULTS.fade;
  const idle: Idle = parsed.idle === 'on' || parsed.idle === 'off' ? parsed.idle : DEFAULTS.idle;
  return { voice, page, fade, idle };
}

function load(): ThemePrefs {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Record<keyof ThemePrefs, unknown>>;
    return sanitize(parsed);
  } catch {
    return { ...DEFAULTS };
  }
}

let current: ThemePrefs = load();
const subs = new Set<(p: ThemePrefs) => void>();

// NICK RULED (Nov 18, 10:06 am, via Fable): in Arbor's redesign the DAY room's page is always light - no Page: Dark is offered by day; at
// NIGHT the light/dark choice stays. The SAVED choice is never touched (a 'dark' saved by night is still 'dark', and is the page again at
// night): only the page in force follows the room. Read from <html>'s own attributes (the redesign, the theme, the room in force - arbor2/
// mount.tsx), so this store imports nothing of Arbor's. Every other theme, and Arbor without the redesign, keeps the saved choice exactly.
// #109 (FABLE, Nov 18, 1:45 pm: "night->day while typing cuts the page tone over at once: the switch waits for her next pause"): when the day room's
// force starts or stops WHILE she writes (<html data-wz-writing>), the page in force is HELD where it stands - the attribute, the pen's inks and the
// rows all read the held tone - and the switch lands at her next pause, when the room comes back (data-wz-writing leaves <html>). Either way:
// night->day and day->night. In memory only.
let held: PageTone | null = null;
function arborDay(): boolean {
  if (typeof document === 'undefined') return false;
  const r = document.documentElement;
  return r.getAttribute('data-arbor2') === 'true' && r.getAttribute('data-theme') === 'plateau' && r.getAttribute('data-arbor2-room') === 'day';
}
/** The page tone IN FORCE: the saved choice, except light in Arbor's day room (Nick, Nov 18). */
export function effectivePage(prefs: ThemePrefs = current): PageTone {
  if (held) return held;   // #109: held while she writes
  return arborDay() ? 'light' : prefs.page;
}
/** True while the page tone is not hers to choose (Arbor's day room): the Page row is not offered. */
export function pageToneForced(): boolean {
  return arborDay();
}

function applyAttributes(prefs: ThemePrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-voice', prefs.voice);
  root.setAttribute('data-page', effectivePage(prefs));
  root.setAttribute('data-fade', prefs.fade);
}

export function getThemePrefs(): ThemePrefs {
  return current;
}

export function setThemePrefs(patch: Partial<ThemePrefs>): void {
  current = sanitize({ ...current, ...patch });
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  applyAttributes(current);
  subs.forEach(fn => fn(current));
}

// Called once at app boot, alongside initTheme() — attributes must be on
// <html> before first paint-adjacent render (no flash of the wrong voice).
export function initThemePrefs(): void {
  applyAttributes(current);
  // the page in force follows the room (Nick, Nov 18): when Arbor's day room starts or stops forcing the page light (the redesign, the theme or
  // the room changed), data-page is set again (in the same task, before paint) and the rows that offer or read the tone hear of it. ONLY then:
  // a theme change that leaves the force as it was does not touch data-page, so another writer's value stands (Flux's Jacked In; bg2's raw
  // Flux dark page - train-22b, Actions 44365317556, where this observer rewrote it to the saved light on the theme flip).
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    let was = `${effectivePage()}|${pageToneForced()}`;
    let wasForced = pageToneForced();
    const put = () => { const root = document.documentElement; const page = effectivePage(); if (root.getAttribute('data-page') !== page && !root.hasAttribute('data-flux3-jacked')) root.setAttribute('data-page', page); };
    new MutationObserver(() => {
      const root = document.documentElement;
      const writing = root.getAttribute('data-wz-writing') === 'true';
      const forced = pageToneForced();
      if (forced !== wasForced) {
        wasForced = forced;
        // #109: while she writes, the page in force stays as drawn until her next pause
        if (writing && held === null) { const drawn = root.getAttribute('data-page'); held = drawn === 'dark' || drawn === 'light' ? drawn : null; }
        put();
      }
      if (!writing && held !== null) { held = null; put(); }   // her pause: the held switch lands
      const now = `${effectivePage()}|${forced}`;
      if (now !== was) { was = now; toneSubs.forEach((fn) => fn()); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-arbor2', 'data-theme', 'data-arbor2-room', 'data-wz-writing'] });
  }
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

// the page tone in force and whether it is hers to choose, for the rows that offer or read it (they re-render when the room moves it)
const toneSubs = new Set<() => void>();
export function usePageTone(): { page: PageTone; forced: boolean } {
  const prefs = useThemePrefs();
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((x) => x + 1);
    toneSubs.add(fn);
    return () => { toneSubs.delete(fn); };
  }, []);
  return { page: effectivePage(prefs), forced: pageToneForced() };
}

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoThemePrefs?: unknown }).wrizoThemePrefs = { get: getThemePrefs, set: setThemePrefs };
}

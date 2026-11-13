import { useEffect, useState } from 'react';
import type { ThemeId } from './theme';

// #63 - THE PAGE-TURN SOUND. The page no longer animates when the text crosses the sheet's height (no page-turn animation in any theme); what is left of the
// moment is a soft sound, and it is a switch the writer owns: Settings, "Page-turn sound: On / Off", remembered PER THEME on this device.
// The shipped default is Nick's ruling (Nov 11): Arbor on, Flux on, Machina off. Nothing is stored until she touches the switch: the stored map holds a theme
// only after she has set it there, so a default that changes later still reaches everyone who never touched it. Device-local, never synced.
export type TurnSound = 'on' | 'off';

export const TURN_SOUND_DEFAULT: Record<ThemeId, TurnSound> = { plateau: 'on', flux: 'on', machina: 'off' };
const KEY = 'wrizo-page-turn-sound';
const THEMES: ThemeId[] = ['plateau', 'flux', 'machina'];

// a raw localStorage read is untrusted: only a known theme with 'on' or 'off' is kept
function sanitize(raw: unknown): Partial<Record<ThemeId, TurnSound>> {
  const out: Partial<Record<ThemeId, TurnSound>> = {};
  if (raw && typeof raw === 'object') {
    for (const t of THEMES) { const v = (raw as Record<string, unknown>)[t]; if (v === 'on' || v === 'off') out[t] = v; }
  }
  return out;
}

function load(): Partial<Record<ThemeId, TurnSound>> {
  try { const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null; return raw ? sanitize(JSON.parse(raw)) : {}; } catch { return {}; }
}

let stored = load();
const subs = new Set<() => void>();

/** What the switch reads for `theme`: her own choice there if she has made one, else the shipped default. */
export function getTurnSound(theme: ThemeId): TurnSound {
  return stored[theme] ?? TURN_SOUND_DEFAULT[theme];
}

export function setTurnSound(theme: ThemeId, value: TurnSound): void {
  stored = sanitize({ ...stored, [theme]: value });
  try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* ignore */ }
  subs.forEach((fn) => fn());
}

export function useTurnSound(theme: ThemeId): TurnSound {
  const [value, setValue] = useState(() => getTurnSound(theme));
  useEffect(() => {
    const fn = () => setValue(getTurnSound(theme));
    subs.add(fn);
    fn();
    return () => { subs.delete(fn); };
  }, [theme]);
  return value;
}

// Test/inspection seam (the themePrefs.ts pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoTurnSound?: unknown }).wrizoTurnSound = { get: getTurnSound, set: setTurnSound, stored: () => ({ ...stored }) };
}

import { useEffect, useState } from 'react';

// Mode-aware editor (Phase 2) — the writer's chrome settings, behind the gear in
// the writing studio. Real toggles, persisted; read by ModeStage (rails/glow/
// progress/typewriter) and QuickSprint (top-bar fade behaviour). A tiny
// module-level store with a subscriber set so every consumer stays in sync when
// the gear changes one value.
//
//   progress  — the progress bar's metric (or hidden). Off still warms the glow.
//   fadeDepth — recede depth: how faint the chrome goes while writing (8% / gone).
//   timer     — opt-in slim session clock in the incentive layer (off by default).
//   typewriter— the line-following fade: history scrolls up and fades as you write.
//
// Return timing (3-min wait / 2-min slow fade-in) is FIXED product behaviour, not
// a setting — the prototype's Preview/Real toggle was a demo affordance, not shipped.

export type ProgressMetric = 'words' | 'time' | 'off';
export type FadeDepth = 'partial' | 'full';

export interface WritingSettings {
  progress: ProgressMetric;
  fadeDepth: FadeDepth;
  timer: boolean;
  typewriter: boolean;
}

const KEY = 'wrizo-writing-settings';
const DEFAULTS: WritingSettings = {
  progress: 'words',
  fadeDepth: 'partial',
  timer: false,
  // Typewriter is the Free-Write preference (default ON): the line-hold helps
  // generation but fights revision, so ModeStage only engages it in Free Write
  // (Journal) and never in Draft/Format, regardless of this toggle.
  typewriter: true,
};

function load(): WritingSettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<WritingSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let current: WritingSettings = load();
const subs = new Set<(s: WritingSettings) => void>();

export function getWritingSettings(): WritingSettings {
  return current;
}

export function setWritingSettings(patch: Partial<WritingSettings>): void {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

// Subscribe a React component to the settings. Returns the live value; re-renders
// on any change made anywhere (the gear, another surface).
export function useWritingSettings(): WritingSettings {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (s: WritingSettings) => setValue(s);
    subs.add(fn);
    // Re-sync in case it changed between module read and mount.
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

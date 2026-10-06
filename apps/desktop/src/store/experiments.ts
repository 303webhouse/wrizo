import { useEffect, useState } from 'react';

// ITEM 190 — the ONE place Experiment 1's own flag lives (the brief's own
// law, §8: "Both read the flag from ONE place, so 'off' cannot be
// half-true"). Both builders (PW's text side, this lane's rail side) read
// `useExperiments()`/`getExperiments()` from here and nowhere else — no
// second store, no prop-drilled boolean, no per-component default that
// could drift from the switch a writer actually sees in Settings.
//
// Mirrors store/writingSettings.ts's own shape exactly (module-level
// `current`/`subs`, a `load()` that merges onto DEFAULTS so a future flag
// added here never breaks an older stored blob): the house convention for
// a small, persisted, cross-surface toggle set, not a new pattern.
//
// §0's own acceptance claim: "WITH THE SWITCH OFF, THE APP IS v1" — every
// caller of this store gates its OWN new markup on the flag being true;
// this module itself renders nothing and owns no DOM, so it cannot be the
// thing that breaks that claim.

export interface ExperimentFlags {
  // §0 — "Connect from the page": the right-click menu's connect acts, the
  // left strip's three acts (Link / Note this / Make a card), and the
  // right rail (item 190's own zone 5) are all gated on this one flag.
  // OFF by default, his own word ("OFF by default").
  connectFromThePage: boolean;
}

const KEY = 'wrizo-experiments';

const DEFAULTS: ExperimentFlags = {
  connectFromThePage: false,
};

function load(): ExperimentFlags {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ExperimentFlags>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let current: ExperimentFlags = load();
const subs = new Set<(f: ExperimentFlags) => void>();

export function getExperiments(): ExperimentFlags {
  return current;
}

export function setExperiments(patch: Partial<ExperimentFlags>): void {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

// Subscribe a React component to the flags. Returns the live value;
// re-renders on any change made anywhere (Settings, or a future second
// surface) — the same "one store, every consumer stays in sync" shape
// store/writingSettings.ts already established.
export function useExperiments(): ExperimentFlags {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (f: ExperimentFlags) => setValue(f);
    subs.add(fn);
    setValue(current); // re-sync in case it changed between module read and mount
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

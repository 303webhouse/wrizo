import { useEffect, useState } from 'react';

// FX3 S5 — the goal system's unit PREFERENCE (components/Sliver.tsx's new
// instruments panel: "unit preference (words / lines / time)"). A tiny
// module-level store, the EXACT shape of store/writingGoal.ts/
// store/forwardLock.ts (KEY constant, DEFAULT, get/set/use hook triad) —
// zero-schema, one writer-wide value.
//
// Working value (the brief's own words: "the committee pass refines the
// panel's final contents") — this ticket wires the PREFERENCE itself
// (persisted, round-trips through the instruments panel) as a genuinely new,
// independent writer setting. It does NOT yet change how the target NUMBER
// in store/writingGoal.ts is computed or interpreted: that store stays
// exactly what it already was (a count of line-equivalents,
// store/lineEquivalents.ts), and nothing here converts a "500 words" or a
// "25 min" target into an equivalent line-equivalent count — that
// conversion is real product work the committee pass is explicitly meant to
// design, not a gap this ticket silently papered over. Kept honest rather
// than half-wired: a stored preference of 'words'/'time' currently only
// changes the LABEL the instruments panel shows next to the same
// line-equivalents number, not the underlying math.
export type GoalUnit = 'lines' | 'words' | 'time';

const KEY = 'wrizo-writing-goal-unit';
const DEFAULT_UNIT: GoalUnit = 'lines';

function load(): GoalUnit {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return raw === 'lines' || raw === 'words' || raw === 'time' ? raw : DEFAULT_UNIT;
  } catch {
    return DEFAULT_UNIT;
  }
}

let current: GoalUnit = load();
const subs = new Set<(v: GoalUnit) => void>();

export function getGoalUnit(): GoalUnit {
  return current;
}

export function setGoalUnit(next: GoalUnit): void {
  current = next;
  try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function useGoalUnit(): GoalUnit {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: GoalUnit) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

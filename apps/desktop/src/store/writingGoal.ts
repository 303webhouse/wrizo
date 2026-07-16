import { useEffect, useState } from 'react';

// CD1 S6 — the goal system's one writer-level target, in line-equivalents
// (store/lineEquivalents.ts) at the paper's canonical measure. A tiny
// module-level store, the EXACT shape of store/forwardLock.ts (KEY
// constant, DEFAULT, get/set/use hook triad) — zero-schema, one writer-wide
// value (not per-page). A default target SHIPS (the brief's own fence: 24
// line-equivalents); clearing it (null) disables every instrument
// (progress hairline + the glow) everywhere, on every page, until the
// writer sets a new one.
const KEY = 'wrizo-writing-goal-lines';
export const DEFAULT_GOAL_LINES = 24;

function load(): number | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw === null) return DEFAULT_GOAL_LINES; // never set — the shipped default
    if (raw === '') return null; // explicitly cleared
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return DEFAULT_GOAL_LINES;
  }
}

let current: number | null = load();
const subs = new Set<(v: number | null) => void>();

export function getWritingGoal(): number | null {
  return current;
}

// `next === null` clears the target (the inline edit's "clear" affordance) —
// stored as an explicit empty string so a cleared goal is distinguishable
// from "never touched" (which would otherwise both read back as null/absent
// from localStorage and silently resurrect the default on the next load).
export function setWritingGoal(next: number | null): void {
  current = next;
  try { localStorage.setItem(KEY, next == null ? '' : String(next)); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function useWritingGoal(): number | null {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: number | null) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

import { useEffect, useState } from 'react';
import { countLineEquivalents } from './lineEquivalents';
import { readLead, readMarks, removeMarkers } from './markRuns';

// CD1 S6 — the goal system's one writer-level target. A tiny
// module-level store, the EXACT shape of store/forwardLock.ts (KEY
// constant, DEFAULT, get/set/use hook triad) — zero-schema, one writer-wide
// value (not per-page). A default target SHIPS (the brief's own fence: 24
// line-equivalents); clearing it (null) disables every instrument
// (progress hairline + the glow) everywhere, on every page, until the
// writer sets a new one.
//
// The unit is stored WITH the number, so a goal always means what it was set
// as. A bare number in storage is a goal set before units existed, and it
// keeps the meaning it had then: line-equivalents (store/lineEquivalents.ts).
// Time is not a unit here: nothing records real writing minutes yet.
export type GoalUnit = 'lines' | 'words';
export interface WritingGoal { n: number; unit: GoalUnit }

const KEY = 'wrizo-writing-goal-lines';
export const DEFAULT_GOAL_LINES = 24;
const DEFAULT_GOAL: WritingGoal = { n: DEFAULT_GOAL_LINES, unit: 'lines' };

function valid(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

function load(): WritingGoal | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw === null) return DEFAULT_GOAL; // never set — the shipped default
    if (raw === '') return null; // explicitly cleared
    if (raw.trim().startsWith('{')) {
      const v = JSON.parse(raw) as { n?: unknown; unit?: unknown };
      return valid(v.n) && (v.unit === 'lines' || v.unit === 'words') ? { n: v.n, unit: v.unit } : null;
    }
    const n = Number(raw);
    return valid(n) ? { n, unit: 'lines' } : null;
  } catch {
    return DEFAULT_GOAL;
  }
}

let current: WritingGoal | null = load();
const subs = new Set<(v: WritingGoal | null) => void>();

export function getWritingGoal(): WritingGoal | null {
  return current;
}

// `next === null` clears the target (the inline edit's "clear" affordance) —
// stored as an explicit empty string so a cleared goal is distinguishable
// from "never touched" (which would otherwise both read back as null/absent
// from localStorage and silently resurrect the default on the next load).
export function setWritingGoal(next: WritingGoal | null): void {
  current = next;
  try { localStorage.setItem(KEY, next == null ? '' : JSON.stringify({ n: next.n, unit: next.unit })); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function useWritingGoal(): WritingGoal | null {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: WritingGoal | null) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

/** Words the writer wrote: line tokens and emphasis markers are not words, and neither is a lone mark like "—". */
export function countGoalWords(text: string): number {
  let n = 0;
  for (const line of text.split('\n')) {
    const rest = line.slice(readLead(line, { headings: true }).length);
    for (const w of removeMarkers(rest, readMarks(rest)).split(/\s+/)) if (/[\p{L}\p{N}]/u.test(w)) n++;
  }
  return n;
}

/** How far `text` is toward `goal`, in the goal's own unit. */
export function goalCount(text: string, goal: WritingGoal): number {
  return goal.unit === 'words' ? countGoalWords(text) : countLineEquivalents(text);
}

export function goalFraction(text: string, goal: WritingGoal | null): number {
  if (goal == null || goal.n <= 0) return 0;
  return Math.max(0, Math.min(1, goalCount(text, goal) / goal.n));
}

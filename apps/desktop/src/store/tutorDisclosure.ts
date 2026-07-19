import { useEffect, useState } from 'react';

// TU1 S5 — the Tutor's one-time plain disclosure ("What you ask the Tutor
// travels to a language model; your pages stay yours."). A local flag,
// never schema — the exact store/firstRun.ts shape (HB1 F3's own
// precedent: a client-local rite-completion flag, pre-account, never
// server-persisted). Shown exactly once per device, on the FIRST open of
// the Tutor panel ever — never re-armed by a reload, never per-page.
const KEY = 'wrizo-tutor-disclosure-seen';

function load(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let current: boolean = load();
const subs = new Set<(v: boolean) => void>();

export function getTutorDisclosureSeen(): boolean {
  return current;
}

export function setTutorDisclosureSeen(next: boolean): void {
  current = next;
  try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function useTutorDisclosureSeen(): boolean {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: boolean) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

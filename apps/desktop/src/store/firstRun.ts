import { useEffect, useState } from 'react';

// HB1 F3 — the rite runs once per device. Local-first, pre-account: a
// client-local flag, same module shape as store/forwardLock.ts. Never
// server-persisted this ticket (F3 — "do not build server persistence for
// it"); if an account later carries preferences, this flag simply isn't one
// of them yet.
const KEY = 'wrizo-first-run-complete';

function load(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let current: boolean = load();
const subs = new Set<(v: boolean) => void>();

export function getFirstRunComplete(): boolean {
  return current;
}

export function setFirstRunComplete(next: boolean): void {
  current = next;
  try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function useFirstRunComplete(): boolean {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: boolean) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

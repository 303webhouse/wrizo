import { useEffect, useState } from 'react';

// AB2 S2 — the forward lock, surfaced as an explicit persisted toggle.
// ForwardOnlyEditor's journal-mode propulsion ("the only way out is through")
// was previously implicit in `mode==='journal'` with no way to turn it off
// independent of leaving Free Write. This is the switch: ON (the default,
// matching today's shipped Free Write behavior exactly) keeps every backspace
// striking per the existing runway (store/forwardOnly.ts's strikeStep); OFF
// lets a single backspace actually erase the trailing character (eraseTail) —
// real deletion, still one character at a time, never a select-then-replace.
// A tiny module-level store, the same shape as store/writingSettings.ts.
const KEY = 'wrizo-forward-lock';
const DEFAULT = true;

function load(): boolean {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw === null) return DEFAULT;
    return raw === '1';
  } catch {
    return DEFAULT;
  }
}

let current: boolean = load();
const subs = new Set<(v: boolean) => void>();

export function getForwardLock(): boolean {
  return current;
}

export function setForwardLock(next: boolean): void {
  current = next;
  try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function useForwardLock(): boolean {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: boolean) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

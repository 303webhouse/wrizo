import { useEffect, useState } from 'react';

// TH1 Slice 4 — the Ambiance dial (canon §7/§9), a single 0-100 user pref
// scaling every theme's effects-layer rates/opacities. RC-2 rates are
// dial-center (~50). `prefers-reduced-motion` forces the EFFECTIVE dial to 0
// regardless of the stored preference — the stored value is left untouched
// so a writer's choice survives turning reduced-motion off again.
const KEY = 'wrizo-ambiance-dial';
const DEFAULT_DIAL = 50;

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function load(): number {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw === null) return DEFAULT_DIAL;
    const n = Number(raw);
    return Number.isFinite(n) ? clamp(n) : DEFAULT_DIAL;
  } catch {
    return DEFAULT_DIAL;
  }
}

let current = load();
const subs = new Set<(v: number) => void>();

export function getAmbianceDial(): number {
  return current;
}

export function setAmbianceDial(v: number): void {
  current = clamp(v);
  try { localStorage.setItem(KEY, String(current)); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The value schedulers must actually read — the stored dial, zeroed whenever
// the OS/browser asks for reduced motion.
export function effectiveAmbianceDial(): number {
  return prefersReducedMotion() ? 0 : current;
}

export function useAmbianceDial(): number {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: number) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoAmbiance?: unknown }).wrizoAmbiance = {
    get: getAmbianceDial,
    set: setAmbianceDial,
    effective: effectiveAmbianceDial,
    reducedMotion: prefersReducedMotion,
  };
}

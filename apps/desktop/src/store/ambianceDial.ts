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

// Fable's R2 (TH2 review) — `loop()`'s dial gate was a boolean (0 vs >0),
// but the brief and canon §7 both say the dial SCALES rate, not just
// switches it on. A pure interval multiplier: 50 (RC-2 center) -> 1.0,
// monotonic decreasing as the dial rises (1 -> ~1.75x slower, 100 -> ~0.55x
// faster) so a higher dial genuinely means a busier room. Two linear
// segments meeting exactly at (50, 1.0); callers read it live on every
// scheduled tick (not once at scheduler creation) and clamp the scaled
// result to their own structural floor — this function only supplies the
// multiplier, never the ≤3Hz-family safety floor itself.
export function dialIntervalScale(v: number): number {
  const clamped = Math.max(0, Math.min(100, v));
  if (clamped <= 50) {
    const t = Math.max(1, clamped); // v=0 reads as v=1's multiplier — dial 0 never schedules anyway
    return 1.75 + (1.0 - 1.75) * (t - 1) / (50 - 1);
  }
  return 1.0 + (0.55 - 1.0) * (clamped - 50) / (100 - 50);
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
    intervalScale: dialIntervalScale,
  };
}

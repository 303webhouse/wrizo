// GLITCH METER (brief docs/briefs/flux-flicker-meter-brief.md; plan docs/plans/glitch-meter.md section 2) - the intensity rule, Nick's:
//   1. a key pressed in the last 30 s means no flicker at all;
//   2. from 30 s without a keystroke it slowly intensifies, peaking at 5 minutes (the approved mockup's curve);
//   3. intensity = idle ramp x (1 - progress through the lap) - calmer near the goal, still at it; crossing the goal resets the lap.
// Pure, so the browserless check runs the real thing. The meter's live state and its harness seam live here too.
import { dialIntervalScale } from './ambianceDial';

export const IDLE_GATE_S = 30;
export const PEAK_AT_S = 300;

/** The idle ramp: 0 under the gate, then the mockup's curve (u^2 * 0.4 + u * 0.6) to 1 at the peak. "Open: the exact ramp curve" - this one. */
export function idleRamp(idleSec: number): number {
  if (!(idleSec >= IDLE_GATE_S)) return 0;
  const u = Math.min(1, (idleSec - IDLE_GATE_S) / (PEAK_AT_S - IDLE_GATE_S));
  return u * u * 0.4 + u * 0.6;
}

/** Rule 3: the ramp, calmed by the lap's progress (0..1). */
export function meterIntensity(idleSec: number, lapFrac: number): number {
  const p = Math.max(0, Math.min(1, lapFrac));
  return idleRamp(idleSec) * (1 - p);
}

/** The wait before an event's next firing: its own jittered span (Signal Loss's), stretched at low intensity (the mockup's
 *  span / max(0.22, 0.22 + 0.78 I)), scaled by the Ambiance dial (brief rule 5), never below 0.4 x its minimum (Signal Loss's own floor). */
export function nextGapMs(minMs: number, maxMs: number, intensity: number, dial: number, r: number = Math.random()): number {
  const span = minMs + r * (maxMs - minMs);
  const stretched = span / Math.max(0.22, 0.22 + 0.78 * Math.max(0, Math.min(1, intensity)));
  return Math.max(minMs * 0.4, stretched * dialIntervalScale(dial));
}

/** The brightness for an intensity between a low and a high (the mockup's bright()). */
export const bright = (intensity: number, lo: number, hi: number): number => lo + (hi - lo) * intensity;

// ---- the live meter's state and its harness seam -------------------------------------------------------------------------------------------
// Real time cannot be waited out in a harness (5 minutes of idle per check), so the clock is read through this seam, as the mockup's ?idle=
// is: setIdle(sec) moves the last keystroke back; setLapFrac pins the lap's progress (null = the page's own); setForceDouble makes the next
// dips and jumps double; fire(kind) asks for one event now (through the budget, at the current intensity). Shipped like wrizoFluxFx: it only
// reads and nudges this meter's own clock.
export type MeterKind = 'tear' | 'shear' | 'noise' | 'macro' | 'sync' | 'dip';
export const meterSeam = { lapFracOverride: null as number | null, forceDouble: false, fire: null as ((kind: MeterKind) => boolean) | null };
export const meterState = { I: 0, idleSec: 0, lapFrac: 0, reduced: false, flicker: true, running: false };
let lastKeyAt = 0;
const clock = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());
export function noteKeystroke(): void { lastKeyAt = clock(); }
export function idleSeconds(now: number = clock()): number { return (now - lastKeyAt) / 1000; }

if (typeof window !== 'undefined') {
  (window as unknown as { wrizoGlitchMeter?: unknown }).wrizoGlitchMeter = {
    setIdle: (sec: number) => { lastKeyAt = clock() - sec * 1000; },
    setLapFrac: (f: number | null) => { meterSeam.lapFracOverride = f; },
    setForceDouble: (b: boolean) => { meterSeam.forceDouble = !!b; },
    fire: (kind: MeterKind) => (meterSeam.fire ? meterSeam.fire(kind) : false),
    state: () => ({ ...meterState }),
  };
}

// GLITCH METER (docs/plans/glitch-meter.md section 3; brief's safety floor, "not optional") - THE GLOBAL FLASH BUDGET. Never more than 3
// flashes in any one second across the whole screen. EVERY flash asks here first - the ambient Signal Loss texture (store/fluxThemeFx.ts) and
// the Glitch meter (components/GlitchMeter.tsx) alike, and the SECOND pulse of a double dip or a double jump asks again (it is a flash too).
// A refused flash is skipped, never queued: a queue would bunch flashes up later. Signal Loss's per-loop floor still stands; it cannot stop
// six independent loops from coinciding, and this is the one structural guarantee that they never exceed the ceiling together.
export const FLASH_LIMIT = 3;
const WINDOW_MS = 1000;
const granted: number[] = [];

declare global { interface Window { __wzVerifyFlashes?: boolean; __wzFlashLog?: Array<{ t: number; kind: string; ok: boolean }>; __wzOnFlashGrant?: ((kind: string) => void) | null } }

const clock = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Ask to flash now: true (and counted) only if fewer than FLASH_LIMIT flashes are in the last second. `now` is for the browserless check. */
export function tryFlash(kind: string, now: number = clock()): boolean {
  while (granted.length && now - granted[0] >= WINDOW_MS) granted.shift();
  const ok = granted.length < FLASH_LIMIT;
  if (ok) granted.push(now);
  // harness mode only: every grant and refusal, for glitch-meter.mjs G4 (plain data behind a flag read at call time)
  if (typeof window !== 'undefined' && window.__wzVerifyFlashes) (window.__wzFlashLog ??= []).push({ t: now, kind, ok });
  // harness mode only: glitch-meter.mjs takes its frames ON a granted pulse (ledger 90), through this hook; unset, nothing happens
  if (ok && typeof window !== 'undefined' && typeof window.__wzOnFlashGrant === 'function') window.__wzOnFlashGrant(kind);
  return ok;
}

/** The browserless check's reset between scenarios. */
export function __resetFlashBudget(): void { granted.length = 0; }

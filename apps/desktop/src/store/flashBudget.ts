// GLITCH METER (docs/plans/glitch-meter.md section 3; brief's safety floor, "not optional") - THE GLOBAL FLASH BUDGET. Never more than
// FLASH_LIMIT flashes (3 by the brief; 2 in the interim, below) in any one second across the whole screen. EVERY flash asks here first - the ambient Signal Loss texture (store/fluxThemeFx.ts) and
// the Glitch meter (components/GlitchMeter.tsx) alike, and the SECOND pulse of a double dip or a double jump asks again (it is a flash too).
// A refused flash is skipped, never queued: a queue would bunch flashes up later. Signal Loss's per-loop floor still stands; it cannot stop
// six independent loops from coinciding, and this is the one structural guarantee that they never exceed the ceiling together.
// LEDGER 117 (the safety floor, Fable Oct 21): in 1 run of 5 the independent observer counted FOUR flashes in one sliding second while this
// budget never granted more than 3. A grant and its draw happen in the same task, but a pulse REACHES THE SCREEN (and the observer) a little
// later - the next paint, a busy main thread - so two grants a hair over 1000 ms apart could land on screen inside one second.
//   INTERIM (Fable): the limit is 2 per second - one constant, reversible - until the check proves the margin below holds 3.
//   THE FIX: the window is a second PLUS a margin, so a pulse reaching the screen up to DRAW_MARGIN_MS after its grant can never share a real
//   second with more than FLASH_LIMIT others. glitch-meter-check proves it against jittered draws; glitch-meter G4 measures grant -> draw ->
//   observed for every pulse.
// THE PROOF BRANCH (glitch-g6-limit3): the brief's 3 restored WITH the draw margin - to be merged only if glitch-meter x5 shows the observer
// never above 3 (Fable, Oct 21: "restore 3 per second only if the check proves it")
export const FLASH_LIMIT = 3;
export const DRAW_MARGIN_MS = 100;
export const WINDOW_MS = 1000 + DRAW_MARGIN_MS;
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

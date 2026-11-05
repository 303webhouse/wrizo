// the global flash budget: never more than FLASH_LIMIT flashes in any second across the screen; every flash asks first; a refused flash is skipped, never queued [flashBudget §1]
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
  // harness only: unset, nothing happens [flashBudget §2]
  if (ok && typeof window !== 'undefined' && typeof window.__wzOnFlashGrant === 'function') window.__wzOnFlashGrant(kind);
  return ok;
}

/** The browserless check's reset between scenarios. */
export function __resetFlashBudget(): void { granted.length = 0; }

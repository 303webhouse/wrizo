import { tryFlash } from './flashBudget';

// the Flux card's hover glitch is a FLASH and asks the global budget; a pulse inside the last granted pulse's window is refused, so hovers never stack [fluxCardGlitch §1]
export const FLUX_CARD_GLITCH_KIND = 'theme-picker-flux';
// Matches index.css's own wz-theme-glitch keyframes duration (.45s) — the pulse the controller
// gates is exactly as long as the animation it's gating.
export const FLUX_CARD_GLITCH_MS = 450;

const clock = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export interface FluxCardGlitchController {
  /** Call on hover-enter/focus. True = play one pulse now. False = refused (mid-pulse already,
   *  or the shared global flash budget has none left in this window) — never queued, matching
   *  flashBudget.ts's own "a refused flash is skipped" rule. */
  requestPulse(now?: number): boolean;
}

export function createFluxCardGlitchController(durationMs: number = FLUX_CARD_GLITCH_MS): FluxCardGlitchController {
  let activeUntil = 0;
  return {
    requestPulse(now: number = clock()): boolean {
      if (now < activeUntil) return false;
      if (!tryFlash(FLUX_CARD_GLITCH_KIND, now)) return false;
      activeUntil = now + durationMs;
      return true;
    },
  };
}

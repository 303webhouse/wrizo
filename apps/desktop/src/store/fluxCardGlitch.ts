import { tryFlash } from './flashBudget';

// THEME PICKER, note (e) (Fable's review, Oct 21): the Flux card's hover Glitch is a FLASH
// (theme-rules.md §A.8 - "every animation has a still state; the budget is 3/sec, measured at
// draw time with a 1,100ms window"), not a decorative CSS loop a sustained or repeated hover can
// run forever. It now asks the SAME global ceiling every other flash in the app asks
// (store/flashBudget.ts's own tryFlash — GlitchMeter.tsx's precedent), so a card hover can never
// push the screen's total flash rate over budget.
//
// Stacking is a SEPARATE hazard from the budget: a quick hover out/in, inside the pulse's own
// duration, must not start a SECOND overlapping animation on top of the first — the controller
// below refuses any request still inside its own last granted pulse's window, budget aside.
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

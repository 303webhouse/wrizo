# Rulings: `apps/desktop/src/store/fluxCardGlitch.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[fluxCardGlitch §n]` points here.

## fluxCardGlitch §1

From `apps/desktop/src/store/fluxCardGlitch.ts`, line 3 at `7f1c6a84` (the comment that stays: "the Flux card's hover glitch is a FLASH and asks the global budget; a pulse inside the last granted pulse's window is refused, so hovers never stack").

```ts
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
```

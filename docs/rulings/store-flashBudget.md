# Rulings: `apps/desktop/src/store/flashBudget.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[flashBudget §n]` points here.

## flashBudget §1

From `apps/desktop/src/store/flashBudget.ts`, line 1 at `f079d49e` (the comment that stays: "the global flash budget: never more than FLASH_LIMIT flashes in any second across the screen; every flash asks first; a refused flash is skipped, never queued").

```ts
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
```

## flashBudget §2

From `apps/desktop/src/store/flashBudget.ts`, line 31 at `f079d49e` (the comment that stays: "harness only: unset, nothing happens").

```ts
  // harness mode only: glitch-meter.mjs takes its frames ON a granted pulse (ledger 90), through this hook; unset, nothing happens
```

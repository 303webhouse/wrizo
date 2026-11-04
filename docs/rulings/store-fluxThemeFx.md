# Rulings: `apps/desktop/src/store/fluxThemeFx.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[fluxThemeFx §n]` points here.

## fluxThemeFx §1

From `apps/desktop/src/store/fluxThemeFx.ts`, line 20 at `f079d49e` (the comment that stays: "every delay reads dialIntervalScale(getDial()) live at scheduling time; minMs * FLOOR_FRACTION is this loop's structural floor (exported, so the floor is asserted mathematically)").

```ts
// Fable's R2 (TH2 review) — the dial used to be a boolean (0 vs >0); every
// scheduled delay now reads dialIntervalScale(getDial()) LIVE at scheduling
// time (not once at mount), so a mid-session dial change takes effect on
// the very next tick. `minMs * FLOOR_FRACTION` is this loop's own
// structural floor — at dial 100 (the fastest multiplier, ~0.55x) the
// scaled delay can never breach it, which is what actually protects the
// ≤3Hz-family spacing canon §7 requires; dialIntervalScale itself only
// supplies the multiplier, never the safety floor. Exported (not just used
// internally by loop() below) so the harness can assert the floor
// mathematically rather than by observing real-timer DOM mutations across
// six independently-scheduled loops, which coincidentally overlap by
// chance often enough to make that kind of test flaky.
```

## fluxThemeFx §2

From `apps/desktop/src/store/fluxThemeFx.ts`, line 76 at `f079d49e` (the comment that stays: "when reduced motion lands, a tear storm's lines still on screen go (the media query's change event); a storm under way lays no more").

```ts
  // Fable, Oct 21: the moment reduced motion lands, a tear storm's lines still on screen go (the media query's own change event - not the
  // 250 ms poll); a storm under way lays no more (tearStorm's `alive`, below). Ambiance 0 stops the loops as before.
```

## fluxThemeFx §3

From `apps/desktop/src/store/fluxThemeFx.ts`, line 92 at `f079d49e` (the comment that stays: "each event is ONE named fire asked of the budget, called by its loop and by the harness seam alike").

```ts
  // Tear-line storm — 7-12s, 3-5 lines, ~45ms stagger, ~150ms each, ~35% lime.
  // Each event is ONE named fire, asked of the budget: its loop calls it, and so does the harness seam below (ledger 90 - the loops skip
  // while the session reads busy, so a check that must see this texture pulse beside the meter forces it here, through the same code).
```

## fluxThemeFx §4

From `apps/desktop/src/store/fluxThemeFx.ts`, line 149 at `f079d49e` (the comment that stays: "one Signal Loss event now, through the flash budget like any other (true if granted and drawn)").

```ts
    // GLITCH METER (ledger 90): one Signal Loss event NOW, through the flash budget like any other (true if it was granted and drawn)
```

# Rulings: `apps/desktop/src/components/RunStrip.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[RunStrip §n]` points here.

## RunStrip §1

From `apps/desktop/src/components/RunStrip.tsx`, line 8 at `e2898deb` (the comment that stays: "Run, Machina's only progress instrument (not behind the style slot): twenty units, an orange notch on the unit in progress, the whole strip orange at the goal; sparks under NEUTRAL only; fixed counts and angles; a still state under reduced motion").

```ts
// RUN - Machina's own progress instrument (Nick, Oct 21; cursor/machina-progress-mockup @ c17b4551; the approved mockup cursor/machina-v1-mockup @ 360f3db3; Fable's ruling: "Run is
// Machina-only" - each theme has its own: Arbor the rhizome, Flux Glitch, Machina Run). It is the REPLACEMENT for the thin sprint bar under Machina, the way GlitchMeter is under Flux:
// the same gate (the framed page's lane, Progress: Words, the Rhizome|Glitch|Run style slot, a goal set), the same lap grammar (useGoalProgress - one celebration grammar, canon §9).
//
// THE ONLY INSTRUMENT (Fable, Oct 23): under Machina Run is the sole progress instrument, so it is NOT behind the Bar|Rhizome|Run style slot - a writer on the default style ("bar") gets Run, and the
// Sliver's style choice is not offered under this theme (there is nothing to choose between). Arbor's thin bar is not drawn on the framed page (DeskInstrument.tsx).
//
// WHAT IT DRAWS (the mockup, verbatim in shape): twenty identical units, each one-twentieth of the goal's lap. A finished unit is gray (--signal-live), an unfinished one the line tone,
// and the unit in progress carries a 3 x 16 px ORANGE NOTCH on its left edge. The count reads once, after the bar ("430 / 1000" - the lap's own count over the goal). At the goal the
// WHOLE strip goes orange (a .35s colour crossfade, the foundations' fill handoff) and the notch stays on the last unit; then the lap resets for the next. Orange is scarce: the notch,
// and the closed strip - nothing else here.
//
// THE ONE CELEBRATION: the closed strip IS it, in both casts. NEUTRAL adds the sparks (foundations §5: "sparks on" is NEUTRAL's temperament) - the RC's burst of eight 9 x 1 px ticks at
// ~26 degree steps, .6s, 20 ms apart, from the last unit - and they never render under COOL. Both have a still state: under reduced motion or Ambiance 0 the strip simply turns orange
// (no transition, no ticks). Fixed counts and angles - "predictable, never variable" - no randomness.
```

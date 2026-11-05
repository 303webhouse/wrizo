# Rulings: `apps/desktop/src/store/glitchMeter.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[glitchMeter §n]` points here.

## glitchMeter §1

From `apps/desktop/src/store/glitchMeter.ts`, line 1 at `7f1c6a84` (the comment that stays: "the glitch intensity rule: silent within 30s of a key, ramping to a peak at 5 minutes idle, times (1 - lap progress); pure, so the browserless check runs the real thing").

```ts
// GLITCH METER (brief docs/briefs/flux-flicker-meter-brief.md; plan docs/plans/glitch-meter.md section 2) - the intensity rule, Nick's:
//   1. a key pressed in the last 30 s means no flicker at all;
//   2. from 30 s without a keystroke it slowly intensifies, peaking at 5 minutes (the approved mockup's curve);
//   3. intensity = idle ramp x (1 - progress through the lap) - calmer near the goal, still at it; crossing the goal resets the lap.
// Pure, so the browserless check runs the real thing. The meter's live state and its harness seam live here too.
```

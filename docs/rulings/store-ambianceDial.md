# Rulings: `apps/desktop/src/store/ambianceDial.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ambianceDial §n]` points here.

## ambianceDial §1

From `apps/desktop/src/store/ambianceDial.ts`, line 50 at `7f1c6a84` (the comment that stays: "the dial SCALES the rate, not just switches it: an interval multiplier (50 -> 1.0, higher dial = busier), read live on every tick; callers clamp to their own safety floor").

```ts
// Fable's R2 (TH2 review) — `loop()`'s dial gate was a boolean (0 vs >0),
// but the brief and canon §7 both say the dial SCALES rate, not just
// switches it on. A pure interval multiplier: 50 (RC-2 center) -> 1.0,
// monotonic decreasing as the dial rises (1 -> ~1.75x slower, 100 -> ~0.55x
// faster) so a higher dial genuinely means a busier room. Two linear
// segments meeting exactly at (50, 1.0); callers read it live on every
// scheduled tick (not once at scheduler creation) and clamp the scaled
// result to their own structural floor — this function only supplies the
// multiplier, never the ≤3Hz-family safety floor itself.
```

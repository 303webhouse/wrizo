# Rulings: `apps/desktop/src/components/RhizomeField.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[RhizomeField §n]` points here.

## RhizomeField §1

From `apps/desktop/src/components/RhizomeField.tsx`, line 7 at `ded4321b` (the comment that stays: "the goal rhizome: shoots grow out of existing stems, flash brass at the goal and leave a seed; drawn behind the page and clipped from the rail, strip, header and open menus; ambient, framed stage only").

```ts
// THE GOAL RHIZOME (rewritten by Fable, 2026-10-08; growth model in store/rhizomeGrowth.ts).
//
// What the writer sees:
//   - A weed in the dark ground around the page. The goal in progress when the page is opened sprouts at the centre and
//     the shoots wander out in a spread of directions; some run longer than others. It does not carpet the ground.
//   - Every new piece grows OUT of an existing stem, and draws itself on along its length (the "growing" animation).
//   - At the goal the whole network flashes brass, then the finished plant fades out and leaves its seed: one root
//     segment, from which the next rhizome branches. One of those branches heads back toward the page.
//   - Roots grow BEHIND the page, right up to its edge, and are never drawn over it. They also never paint on the rail,
//     the strip, the header or an open menu (clip + mask). They pass under the page (unpainted) to reach the other margin.
//
// The field is ambient: aria-hidden, pointer-events none, beneath the paper (the anchor's z-index -1). Framed stage only
// (>= 1100px), as before.
```

## RhizomeField §2

From `apps/desktop/src/components/RhizomeField.tsx`, line 23 at `ded4321b` (the comment that stays: "after the hold the brass network fades over FADE_MS; under reduced motion the hold stays and the lap clears at its end").

```ts
// Nick (2026-10-10): "a bit brighter and fade back out slower" - after the hold the brass network FADES over FADE_MS instead of
// cutting. Under reduced motion there is no fade: the hold stays and the lap clears at its end.
```

## RhizomeField §3

From `apps/desktop/src/components/RhizomeField.tsx`, line 132 at `ded4321b` (the comment that stays: "the rhizome is Arbor's only: under any other theme this field draws nothing").

```ts
  // Nick's ruling: the rhizome is PLATEAU'S only. Every other theme replaces it with its own (Flux's comes later), so under
  // any other theme this field draws nothing - no growth, no flash.
```

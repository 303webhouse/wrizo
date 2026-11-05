# Rulings: `apps/desktop/src/store/rhizomeGrowth.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[rhizomeGrowth §n]` points here.

## rhizomeGrowth §1

From `apps/desktop/src/store/rhizomeGrowth.ts`, line 1 at `7f1c6a84` (the comment that stays: "the rhizome's growth model, pure and deterministic: a weed, not a carpet; growth always from the existing network; short gently curving steps; one sprout at the page's centre").

```ts
// RHIZOME GROWTH (Fable, 2026-10-08) — the goal rhizome's whole growth model, pure and deterministic.
//
// Nick's rules, in the order the code honours them:
//   1. The goal reveals a weed, it does not carpet the ground. planLap grows one plant; segmentsFor() shows the shortest
//      prefix that reaches fraction f of that plant's own coverage. At the goal the plant is whole, and the stage is not.
//   2. Growth always comes from the existing network. Every segment starts at the end of an earlier segment (a stem tip
//      extending) or at an earlier segment's end point (a side branch). No free-standing origins after the first.
//   3. Stems, not scratches. Each step is short (STEP_MIN..STEP_MAX px) and turns only a little from the one before
//      (MAX_TURN plus a small wander), so a root is a chain of short, gently curving steps.
//   4. One sprout. The goal in progress when a page is opened starts at the page's centre, and the shoots leave in a
//      spread of directions. They may pass under the page (hidden, never painted). Some shoots run longer than others.
//   5. Laps. At the goal the whole network flashes brass, then fades. One root segment persists. The next rhizome
//      branches from that segment, and one of those branches heads back toward the page.
//
// Nothing here touches the DOM. RhizomeField.tsx measures the geometry and renders; this file decides what grows.
```

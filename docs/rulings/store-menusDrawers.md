# Rulings: `apps/desktop/src/store/menusDrawers.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[menusDrawers §n]` points here.

## menusDrawers §1

From `apps/desktop/src/store/menusDrawers.ts`, line 3 at `e2898deb` (the comment that stays: "the two-drawer law: coexistence is a decision about both drawers, so it lives in one store (the useSyncExternalStore pub-sub shape); measuring here is a policy, not an anchor").

```ts
// ITEM 83 M1 — THE TWO-DRAWER LAW (R9, re-derived by R11 for opposite anchors).
//
// Nick's ruling, verbatim: "we want the menu thin enough that on a wider
// desktop screen, both the left-hand menu tabs (like Page, Plan, etc.) can be
// open at the same time as the Tools menu sliver without overlapping. On a
// smaller laptop or tablet screen, the tabs should close the other if they
// would overlap if they are both open. When one 'drawer' is opened, the other
// closes with the same animated effects as when they are opened/closed
// independently."
//
// WHY A STORE AT ALL. The two drawers own independent local state in two
// unrelated components (Cascade.tsx's `useCascade`, Sliver.tsx's `open`), and
// neither can see the other. Coexistence is a decision ABOUT BOTH, so it needs
// one place to live. This is the same tiny pub-sub shape as
// deskFrameActive.ts, and it uses useSyncExternalStore for the same reason
// that file documents at length: a consumer that mounts in the same commit as
// a writer must not miss the notification.
//
// WHY THIS MEASURES, AND WHY THAT IS LAWFUL. The wave's constitutional law is
// ANCHORS ARE LAYOUT; A POLICY QUESTION MAY MEASURE, AN ANCHOR MAY NOT.
// Nothing here positions anything — the dock is anchored by CSS against the
// paper, the cascade panel by CSS against the rail. What this file decides is
// only WHETHER BOTH MAY BE OPEN, which is a policy question about the room
// that remains, and the only honest way to answer it is to ask the rendered
// boxes. It reads the paper's and the rail's real rects; it never re-derives
// where they are from a formula, which is precisely the failure this wave was
// called to remove (a hand-synced `--sliver-paper-half` that duplicated
// `.mode-pagecol`'s width and drifted from it).
//
// THE THRESHOLD. Both drawers live in the band between the rail's right edge
// and the paper's left edge. The Tools drawer is paper-mounted and opens
// LEFTWARD (handle + body); the cascade drawer is rail-mounted and opens
// RIGHTWARD. They coexist exactly when the band holds both:
//     paper.left − rail.right  >=  handleW + toolsW + cascadeW
// Measured, every layout pass, at whatever the surface actually renders.
```

## menusDrawers §2

From `apps/desktop/src/store/menusDrawers.ts`, line 39 at `e2898deb` (the comment that stays: "the page's two hands (tools, tutor) are now MEASURED too (see canHoldBoth below)").

```ts
// PHASE 1 (Fable, Oct 12) - ONE DRAWER AT A TIME, AT EVERY WIDTH, for the page's own two hands: the Tools drawer (left, 'tools') and the Tutor drawer (right,
// 'tutor'). Opening either closes the other, through the other's own close path (so it leaves with the slide it uses when closed independently). This is NOT the
// width-measured law below, which still governs the far-left cascade against the Tools drawer: that one asks whether the band holds both; this one never asks.
// SUPERSEDED (page-size, Fable's ruling Oct 23): the two hands are now MEASURED too - see canHoldBoth below. Phase 1's text above is kept as the record.
```

## menusDrawers §3

From `apps/desktop/src/store/menusDrawers.ts`, line 74 at `e2898deb` (the comment that stays: "the paper, per surface: name the box the writer SEES (.mode-page, .board-canvas-wrap, .script-sheet), single-sourced with scripts/menus-probe.mjs; naming the wrong box disabled the law on screenplay").

```ts
/**
 * THE PAPER, PER SURFACE — single-sourced with scripts/menus-probe.mjs.
 *
 * item 83 errata E1 (2026-08-28). This list used to read
 * `.mode-page, .board-canvas, .script-page`, and BOTH of its non-prose
 * entries named a box the writer never sees:
 *
 *   - `.board-canvas` is the element INSIDE `.board-canvas-wrap`'s 1px
 *     border. The dock is anchored against the WRAP, so the policy was
 *     measuring a different box from the one the anchor is verified against.
 *   - `.script-page` is the screenplay's outer wrapper, and on the FRAMED
 *     screenplay surface it does not render at all. `querySelector` returned
 *     null, `canCoexist` took its `!paper` early return, and the two-drawer
 *     law was therefore DISABLED OUTRIGHT on screenplay — measured, not
 *     inferred: the diagnostic read `OLD l=undefined band=null` at both
 *     reference widths while `.script-sheet` read a real band of 191/348px.
 *
 * The probe's own comment records that naming the wrong box has caught this
 * project three times. The rule it landed on is the rule here: NAME THE BOX
 * THE WRITER SEES, NOT THE NEAREST ONE WITH A MATCHING CLASS.
 */
```

## menusDrawers §4

From `apps/desktop/src/store/menusDrawers.ts`, line 106 at `e2898deb` (the comment that stays: "the measurement must prove itself before its answer counts: the permissive answer only when the boxes are laid out, never inferred from the band's sign").

```ts
  // THE MEASUREMENT MUST PROVE ITSELF BEFORE ITS ANSWER COUNTS.
  //
  // Fable's ruling on this repair, and its first law: THE FIX MUST NOT HIDE
  // A FAILED MEASUREMENT BEHIND A FULL-BLEED CANVAS. A box that has not been
  // laid out yet reports 0x0, and a band computed from one means nothing. So
  // the permissive answer is reached ONLY by proving the boxes are real —
  // never by inferring it from the band's sign, which is exactly how a
  // failed measurement would come to wear a full-bleed canvas's clothes.
```

## menusDrawers §5

From `apps/desktop/src/store/menusDrawers.ts`, line 129 at `e2898deb` (the comment that stays: "a pop-out that is EXITING (data-leaving) no longer occupies the band").

```ts
// TOOLS #10 item 8: a pop-out that is EXITING (data-leaving) no longer occupies the band;
```

## menusDrawers §6

From `apps/desktop/src/store/menusDrawers.ts`, line 133 at `e2898deb` (the comment that stays: "the page's two hands, measured: both stand where there is DRAWER_MIN of desk on each side of the paper, else the later closes the other; the page never moves, so it reads the same open or shut; a failed measurement says yes").

```ts
/**
 * PAGE-SIZE (Fable's ruling, Oct 23) - THE PAGE'S TWO HANDS, MEASURED. This REPLACES Phase 1's "one drawer at a time, at every width" (Oct 12) with
 * Nick's own original ask in this file's header: on a screen with room, both stand; where they would crowd the page, the later one closes the other.
 * "Room" is the desk on EACH side of the page the writer sees: at least DRAWER_MIN of it left of the paper (the Tools drawer's side) AND right of it (the
 * Tutor's), inside the stage. The page never moves for either drawer (page primacy), so this reads the same whether they are open or shut. Same posture
 * as canCoexist above: a failed measurement says YES (it self-corrects on the next pass; a wrong NO is visible to the writer).
 */
```

## menusDrawers §7

From `apps/desktop/src/store/menusDrawers.ts`, line 155 at `e2898deb` (the comment that stays: "each drawer registers its own close path, so the exclusion handoff animates with exactly the slide it uses when closed on its own").

```ts
/** Each drawer registers its OWN close path here on mount. The exclusion
 *  handoff then calls that path rather than reimplementing a close, so the
 *  displaced drawer animates with exactly the slide it uses when closed
 *  independently — Nick's "with the same animated effects" is satisfied by
 *  reusing the path, not by copying its timing. */
```

## menusDrawers §8

From `apps/desktop/src/store/menusDrawers.ts`, line 173 at `e2898deb` (the comment that stays: "the rival yields only where the page and both hands do not fit; the guard's text is exact: one-drawer.mjs's mutants anchor on it").

```ts
  // the page's two hands: MEASURED (page-size, Oct 23) - the rival yields only where the page and both hands do not fit (canHoldBoth). The guard's text
  // is exact: one-drawer.mjs's mutants anchor on it.
```

## menusDrawers §9

From `apps/desktop/src/store/menusDrawers.ts`, line 198 at `e2898deb` (the comment that stays: "a hand that stood and closed is news to useStandingHands, even when it was not the latest opener").

```ts
// POLISH #10 item 1: a hand that stood and closed is news to useStandingHands, even when it was not the latest opener
```

## menusDrawers §10

From `apps/desktop/src/store/menusDrawers.ts`, line 219 at `e2898deb` (the comment that stays: "which of the page's two hands stand open (the board narrows beside them); a string snapshot so the store's identity is stable between changes").

```ts
/** POLISH #10 item 1 (Nick, Oct 25) - which of the page's two hands stand open right now: the Board narrows beside them. A string snapshot ('', 'T', 'U',
 *  'TU') so the store's identity is stable between changes. */
```

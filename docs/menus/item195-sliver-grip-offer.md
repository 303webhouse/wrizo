# ITEM 195 — the sliver grip under the strip · OFFER (tools lane; branch `item195-sliver-grip`)

Assigned by Fable, 2026-09-23 morning · NEW, FIRST — ahead of the queue.

## The diagnosis, inherited (not re-derived): pw.md §7 / item 176 pair 4

On a board at 1280px, 15 of the sliver grip's 16px sit under the strip and
hit-test to it:

```
{"count":1,"rect":{"x":69,"y":137,"w":16,"h":34},"receded":"false","pe":"auto","vw":1280}
{"found":false,"why":"occluded","by":"wz-strip-item"}

grip   x 69 .. 85    (measured)
strip  x  0 .. 84    (left:-38.4px + --strip-width:84px)
→ 15 of 16px occluded; only the rightmost ~1px is reachable
```

Live since `32e6721` (2026-07-18). Root cause, two parts:

1. **Why the z-indexes lie.** `.desk-frame-stage` carries `isolation:isolate`
   (FX4 S2). That seals a stacking context: the sliver anchor's `z-index:5`
   and the grip's `z-index:2` are trapped *inside* it, while
   `.desk-frame-strip` (`z-index:1`) is a sibling of the stagecol, outside
   that context. No z-index inside the stage can ever outrank the strip —
   the two numbers were never being compared.
2. **Why the grip sits so far left on board specifically.**
   `.wz-sliver-grip{right:0}` inside `.wz-sliver{width:100%}` means the
   grip's screen position is set *entirely* by the sliver anchor's own
   right edge — never by `--sliver-anchor-w`. That right edge tracked only
   the paper's own left edge plus whatever `--sliver-overflow`'s
   padding-dip allowed, and `.desk-frame-sliver-anchor--board` sets
   `--sliver-paper-pad: 0px` (board's canvas carries no padding to dip
   into) — collapsing that dip to zero by construction. The grip's
   clearance from the strip was therefore an accident of the formula's
   other terms, never a guarantee.

## The rule (Fable, 2026-09-23)

> No interactive control inside the stage ever sits in a strip's band, at
> any tested width, in prose, screenplay or board. Proof by real hit-test
> at each control's center across that matrix.

Kept: the ratified stacking (the strip outside the stage, above it). The
defect is geometry, not stacking — nothing here touches `isolation` or any
`z-index`.

## The fix — `index.css`, `.desk-frame-sliver-anchor`, additive only

Three new custom properties, one new `max()` floor on the anchor's right
edge (full derivation is in the CSS comment at the fix site):

```css
--sliver-strip-right: calc(-1 * var(--frame-host-pad-x) + var(--strip-width));
--sliver-grip-w: 16px;
--sliver-anchor-right: max(
    calc(50% - var(--sliver-paper-half) + var(--sliver-overflow)),
    calc(var(--sliver-strip-right) + var(--frame-gap) + var(--sliver-grip-w))
  );
...
left: calc(var(--sliver-anchor-right) - var(--sliver-anchor-w));
```

It is a `max()`, so it can only push the anchor (and the grip inside it)
**further** from the strip than the existing padding-dip formula already
does. Prose and screenplay — whose `--sliver-paper-half` is far smaller
and whose margin is never this tight at the tested widths — don't feel it;
this is additive to the working case, not a rewrite of it. Applies
uniformly to all three page kinds (one rule, no per-kind special case),
matching the codebase's own "one clamp rule serving every viewport"
convention already established on this same rule (`--sliver-overflow`'s
own comment, two lines up).

## The proof — `scripts/harness/item195.mjs` (built, not run)

36 checks + 1 named reproduction of the exact failing case, across the
full matrix: **3 page kinds × 3 widths** (1100 floor, 1280, 2200 — the same
band fx2.mjs's own S1 comment already identified as the one range where a
clamp-mechanism regression actually shows). Two independent proofs per
cell:

1. **Real hit-test**, via `trustedDispatch` (item 151's shared instrument)
   — the grip must be reachable by an actual pointer at its own on-screen
   point, both closed→open and open→closed. A synthetic `.click()` cannot
   see this class of bug (it bypasses hit-testing entirely) — this is the
   exact gap item 151's driver exists to close.
2. **Geometry** — the grip's rect and the strip's rect never intersect,
   sliver open and closed, the redundant non-hit-test proof matching
   fx2.mjs's own dual style for this anchor.

Plus one standalone, explicitly named check reproducing item 176 pair 4's
own exact case (board @ 1280px) — greppable on its own, not buried as one
iteration of the matrix loop.

**Park count: 0.** Item 195 is new; it falsifies no existing assertion.
fx2.mjs's own S1 sliver-clearance check (prose only, 1100px) stays true
and unedited — it simply never exercised the board case that failed, which
is exactly the gap this file closes. The empty `parkedChecks` array is
still emitted (park count, not green).

## Verified without the box

- Fresh worktree, `pnpm install` clean (285 packages).
- `tsc --noEmit`: **0 errors.**
- `pnpm run build:web`: **clean**, `dist-web/assets/index-De6ye6qU.css`
  (144.45 kB) / `index-CJcmbjbb.js` (587.38 kB).
- `sliver-strip-right` / `sliver-anchor-right` / `sliver-grip-w` all present
  in the built CSS — the fix reached the bundle.
- `node --check scripts/harness/item195.mjs`: clean.

## Scope, honestly bounded

Only the **board** case was measured failing pre-fix (item 176 pair 4).
Prose and screenplay are covered by this offer's harness because the fix's
own floor is unconditional and the rule names all three page kinds
explicitly — not because a second failure was ever observed in them.

**Named residual, not silently carried:** for board specifically, when
`--sliver-margin` floors at 0 (paper's own left edge already at or left of
the strip's right edge — a tighter case than this ticket measured), the
pre-existing formula already produced a near-zero `--sliver-anchor-w`,
which shrinks `.wz-sliver-panel` (`width:calc(100% - 16px)`) toward
degenerate. This fix does not touch that — it only guarantees the GRIP
clears the strip, which is this item's own charge. The panel's own width
floor, if it needs one, is a residual for whoever owns zone 5 next (item
190 carries the same "no interactive control in the strip's band" rule
forward — the note flags it there too).

## Status

**BUILT.** `tsc` 0 / `build:web` 0 / new custom properties confirmed in
bundle / harness syntax-checked. Not run — needs the box. **Ready for
chat 1's pair; ahead of the queue, per Fable's ruling.**

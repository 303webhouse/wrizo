# Rulings: `apps/desktop/src/store/fluxReadouts.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[fluxReadouts §n]` points here.

## fluxReadouts §1

From `apps/desktop/src/store/fluxReadouts.ts`, line 7 at `7f1c6a84` (the comment that stays: "the block caret's width: a third of the old 0.48 ratio, never under 3 px").

```ts
/** The block caret's width for a line of this height: a third of the old 0.48 ratio (Nick, Oct 23: "a slimmer caret, the block at about 1/3 width"), never under 3 px. */
```

## fluxReadouts §2

From `apps/desktop/src/store/fluxReadouts.ts`, line 12 at `7f1c6a84` (the comment that stays: "how long the chrome takes to recede while typing: Arbor keeps the engine's slow curve; Flux is quicker, so a drawer is never caught half-faded").

```ts
/** How long the chrome takes to recede while the writer types. Arbor keeps its slow curve (the engine's own base); FLUX is quicker (Nick, Oct 23: "an open drawer reaches the 0.08 floor about 1 s after the first key"), so a drawer's contents are never caught half-faded. */
```

## fluxReadouts §3

From `apps/desktop/src/store/fluxReadouts.ts`, line 44 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
// The hint lines (Fable, Oct 21): the prose surface and Wire In each get one true line; the board's landed with the Inputs work, after step 3.
```

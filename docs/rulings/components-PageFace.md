# Rulings: `apps/desktop/src/components/PageFace.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[PageFace §n]` points here.

## PageFace §1

From `apps/desktop/src/components/PageFace.tsx`, line 23 at `ded4321b` (the comment that stays: "optional, and absent means the control does not render: an unborn page has no row to patch, and a star that does not stick is worse than none").

```ts
  // PB1 (item 71) — OPTIONAL, and absent means the control does not render.
  // An unborn page (one the writer has opened but not yet written in) has no
  // row, so `patchJournalEntry` would find nothing to merge into and these
  // would silently no-op. A star that does not stick is worse than no star, so
  // the face simply does not offer them until the page has a word. Every born
  // page passes all three, exactly as before.
```

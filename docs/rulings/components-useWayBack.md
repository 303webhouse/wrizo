# Rulings: `apps/desktop/src/components/useWayBack.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[useWayBack §n]` points here.

## useWayBack §1

From `apps/desktop/src/components/useWayBack.ts`, line 109 at `ded4321b` (the comment that stays: "the restore re-asserts at rAF + 80/200/350ms to win the mount race, and cancels the later ones the moment the writer acts").

```ts
  // Restore. The rAF + 80/200/350ms re-assert ladder wins the mount-seeding
  // race (see above) — but left unchecked it also fights the WRITER: typing
  // resumed at ~300ms would get the caret yanked back mid-word by the 350ms
  // write; an immediate flick-scroll would get un-scrolled (Fable W2-R2). The
  // initial rAF apply always lands (it's what makes the return feel instant);
  // the LATER re-asserts exist only to win the settling race against the
  // surface's own mount-time adjustments, so they cancel the moment the
  // writer does anything — a real keystroke, pointer action, wheel, or touch
  // means they've already resumed and any further correction would fight them
  // instead of helping.
```

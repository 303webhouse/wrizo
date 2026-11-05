# Rulings: `apps/desktop/src/components/FluxBlockCaret.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[FluxBlockCaret §n]` points here.

## FluxBlockCaret §1

From `apps/desktop/src/components/FluxBlockCaret.tsx`, line 53 at `7f1c6a84` (the comment that stays: "the caret's row is the truth where the range gives no rect (a fresh empty line) or a rect off the row; the block stands at the row's start, on scrolls and glides too").

```ts
      // POLISH #10 item 17: the row the caret sits in is the truth where the range gives no rect (a fresh empty line) or a rect off the row; the block stands
      // at that row's start, one line tall - on a scroll or glide too, so it follows the hold instead of keeping its last place.
```

## FluxBlockCaret §2

From `apps/desktop/src/components/FluxBlockCaret.tsx`, line 83 at `7f1c6a84` (the comment that stays: "the block follows Enter at once: a rect off the caret's row is the previous line's end, so the row's start is used").

```ts
      // (Nick, Oct 25) the block follows Enter AT ONCE: a rect that is not on the caret's row is the previous line's end - the row's start is used instead.
```

## FluxBlockCaret §3

From `apps/desktop/src/components/FluxBlockCaret.tsx`, line 104 at `7f1c6a84` (the comment that stays: "the caret can move without the selection changing (the zoom, a glide, a resize), so each redraws it, batched into one frame; scroll is heard in the capture phase").

```ts
    // PAGE-SIZE (the Oct 13 addendum: the block caret went stale when Typewriter toggled) - the caret can MOVE without the selection changing:
    // the zoom transforms the page, a typewriter glide scrolls it, a resize rescales it. Each now redraws it too, batched into one frame (scroll
    // is heard in the CAPTURE phase so an inner scroller's scroll counts; `wz-caret-moved` is ModeStage's own announcement when the zoom toggles).
```

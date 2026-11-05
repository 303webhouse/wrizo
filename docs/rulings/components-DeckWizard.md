# Rulings: `apps/desktop/src/components/DeckWizard.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DeckWizard §n]` points here.

## DeckWizard §1

From `apps/desktop/src/components/DeckWizard.tsx`, line 149 at `e2898deb` (the comment that stays: "the backdrop is portalled to <body>: inside .desk-frame-stage (isolation:isolate) its z-index ranked only within the stage, and the rail painted over it").

```ts
  // deckwizard-backdrop (Fable, 2026-10-15) - the card pop-up's fix (card-close-x), applied here. The backdrop is fixed at z-index
  // 220, but it rendered inside `.desk-frame-stage`, whose `isolation:isolate` makes it a stacking context: 220 ranked only within
  // the stage, and the fixed rail (`.desk-frame-strip`, z-index 1 in the ROOT context) painted over the whole stage, backdrop
  // included - an outside click could press the rail's own buttons. Portalled to <body>, the backdrop ranks in the root context,
  // above the rail and the page's chrome. Nothing here reads its DOM ancestors, its colours are :root tokens, and React events
  // still bubble through the component tree.
```

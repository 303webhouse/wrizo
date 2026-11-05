# Rulings: `apps/desktop/src/store/deckHint.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[deckHint §n]` points here.

## deckHint §1

From `apps/desktop/src/store/deckHint.ts`, line 1 at `7f1c6a84` (the comment that stays: "the "Start Here" hint's state: device-local, keyed per board, naming only the dealt card ids - never in `boxes`, never synced").

```ts
// B3 S1 — the "Start Here" hint's own state (R6's own ruling, verbatim: "the
// first card in the sequence should subtly hint them to 'Start Here' on the
// board, but that nudge should go away once they complete any card").
//
// A client-local flag, keyed PER BOARD (not one bare shared id) — the exact
// "cross-surface 'celebrate once' state needs per-entity scoping" lesson
// this project has already learned once. Never schema: this rides
// localStorage, the SAME "device-local, pre-account, never server-
// persisted" shape store/firstRun.ts and store/tutorDisclosure.ts already
// use for exactly this class of one-time-ceremony flag — NOT the `boxes`
// jsonb array, so a dealt card's own record never carries this state (the
// "no back-reference in boxes" law stays whole). It also names nothing
// about the DECK itself (no deck id, no template identity) — only which
// CARD ids were just dealt, ordinary board-local bookkeeping in the same
// spirit as board-meta's own footerOn/canvasW/canvasH fields, just off the
// synced record entirely since it's disposable UI state, not authored data.
//
// One slot per board: the most recent deal's own first card wins. The fence
// (S1's own words): "edit = the writer's first change to a dealt card's
// content" — BoardEditor.tsx's own commitText calls noteDealtCardEdited on
// every genuine text commit; once cleared, `active` never re-arms itself
// (a card ceasing to be the newest ever again would require a fresh deal,
// which arms a brand-new hint deliberately, not a resurrection of the old
// one) — "once gone, never returns even if other cards are later edited."
```

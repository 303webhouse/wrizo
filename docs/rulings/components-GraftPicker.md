# Rulings: `apps/desktop/src/components/GraftPicker.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[GraftPicker §n]` points here.

## GraftPicker §1

From `apps/desktop/src/components/GraftPicker.tsx`, line 10 at `ded4321b` (the comment that stays: "+ Graft: Cards / Pages / Boards from any place, a check on anything already grafted; a place label only on a row from another place; a press on a checked row does nothing (the X ungrafts); a body-portalled overlay").

```ts
// BIG PROJECTS STEP 3 (3b, 3d) - "+ Graft...": the picker (Nick's approved mockup, cursor/graft-doors-mockup @ c4f34eb0, frames graft-picker-page,
// graft-picker-board, picker-came-from). A search field, then Cards / Pages / Boards from ANY place, and a check mark on anything already grafted.
// RULING (Fable, Oct 21): a place label appears ONLY on a row from another Drawer or the Journal - a row from the subject's own place has none. A press on an unchecked row grafts it (store/grafts.ts graftTo: a page_links record owned by the subject, or - a
// card on the same board - a connection box made through the board); a press on a checked row does nothing (Q10: the X in the list is the only way
// to ungraft). "Came from <surface>" is the top row only when the page was just opened from a surface (the router state the Back chip reads):
// an offered row like any other - nothing is written when the page opens.
// An OVERLAY portalled to <body> and anchored under the "+ Graft..." control: it displaces nothing (page primacy). Esc or a press outside closes it.
// W2: `boxId` makes "Came from" a STEP ("Three-Act · Midpoint": a page born by "Write this" came from that card, and is already placed on it, so the row shows checked).
```

## GraftPicker §2

From `apps/desktop/src/components/GraftPicker.tsx`, line 20 at `ded4321b` (the comment that stays: "`boxes` are the open board's live boxes; `beforePick` births a brand-new page before the graft; `mode` filters the picker (all, pages, steps)").

```ts
// `boxes`: the open board's LIVE boxes (the editor's own, ahead of its autosave), handed down by the Grafts pane that already reads the board's snapshot.
// `beforePick`: on a brand-new page, the pane's birth of the page (ruling, Oct 21: a pick CREATES the page) - run before the graft is written.
// W2 - `mode`: 'all' is the Grafts "+ Graft..." picker (Cards / Pages / Boards); 'pages' is "Place a page..." (the same picker filtered to PAGES; "Came from" still first); 'steps' is the page's "Place this..." (the Decks' steps, as "Deck · Step"
// rows; a press places THIS page on that step). `title` is the door's own word. `onPicked` runs after a press that made a graft, so the opener can redraw (a card kindles).
```

## GraftPicker §3

From `apps/desktop/src/components/GraftPicker.tsx`, line 74 at `ded4321b` (the comment that stays: "the portalled picker carries wz-tutor-zone, so a keystroke in its search is the drawer's, not "the writer resumed writing"").

```ts
  // `wz-tutor-zone` (ledger 131): the picker is portalled to <body>, so without the drawer's own marker class a keystroke in its search reads to
  // the Tutor drawer as "the writer resumed writing" and CLOSES the Grafts panel under it. With the marker it is part of the drawer's zone - the
  // mechanism Tutor.tsx's keydown listener already uses for both of its anchors.
```

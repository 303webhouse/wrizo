# Rulings: `apps/desktop/src/components/SectionsPopout.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[SectionsPopout §n]` points here.

## SectionsPopout §1

From `apps/desktop/src/components/SectionsPopout.tsx`, line 26 at `e2898deb` (the comment that stays: "the Pages pop-out (and, in boards mode, the Boards tab): it never deletes (X moves to the Journal) and never writes an order except a deliberate reorder; the old list's hooks are kept; rows use no native drag").

```ts
// BIG PROJECTS 1a (docs/plans/big-projects.md) - THE PAGES POP-OUT. Where you are (a Drawer or a Journal), the sections in it in the writer's
// own order, set headings once a second set exists, + New set, Presets, and X (out to the Journal, with Undo). It replaces the Open Pages list;
// BIG PROJECTS step 2: the SAME component in `boards` mode is the Boards tab (the pop-outs mirror each other): the place's boards instead of its pages, + New Board,
// and PRESETS that are the deck library (a preset opens a new board in the place with that deck's wizard already on its first question).
//
// WHAT THIS FILE WILL NOT DO. It never deletes (X is store/place.moveToJournal: one write, projectId). It never writes an order except from a
// deliberate reorder (a drag or the arrow keys on a grip) - the sort control is Order, the writer's own order, and nothing here sorts and saves.
// The old list's hooks are kept on purpose (wz-open-pages on the root, wz-place-page-list on the rows, data-page-id on a row, wz-open-pages-open / -more / -menu / -place):
// item 170's harness - a click on a row opens its page, the more-menu places it on a board, the menu opens inside the list - still holds on the pop-out, so only
// what really changed (the heading, the A-Z / Date sorts, the three-row viewport) is parked, with successors.
// Every row declares data-link-entry (the connector's rail drop target, ledger 87/107). The rows use no native drag-and-drop: a row marked for it
// switches the board's thumbnail drag-to-copy off. Reorder is pointer events on a grip, and the grip is exempted from that copy-drag by name.
```

## SectionsPopout §2

From `apps/desktop/src/components/SectionsPopout.tsx`, line 99 at `e2898deb` (the comment that stays: "From my pages is in the Presets list; Arbor leads with it, every other theme keeps the library's order").

```ts
  // W3 (Fable, Oct 23): From my pages is IN the Presets list - the pantser's door - and Arbor leads with it; every other theme keeps the library's own order. Its picker reads the writer's current place, so a NEW board works.
```

# Rulings: `apps/desktop/src/components/ConnectionsDrawerPanel.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ConnectionsDrawerPanel §n]` points here.

## ConnectionsDrawerPanel §1

From `apps/desktop/src/components/ConnectionsDrawerPanel.tsx`, line 5 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
// POLISH #10 item 4
```

## ConnectionsDrawerPanel §2

From `apps/desktop/src/components/ConnectionsDrawerPanel.tsx`, line 6 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
// POLISH #10 item 24
```

## ConnectionsDrawerPanel §3

From `apps/desktop/src/components/ConnectionsDrawerPanel.tsx`, line 15 at `7f1c6a84` (the comment that stays: "the Grafts pane: the subject is the open page, or on a board its selected card (or the board); + Graft first, then the paired page, the plan board folded, and the graft groups; with nothing grafted it is the + Graft control alone").

```ts
// The right drawer's second pane - the GRAFTS tab (Flux: LINKS). Its name is the theme's word, read from the lexicon, never written here.
//
// CONNECTOR-B (Nick's approved connector mockup v6) built the list: a card's connections - same-board connection boxes and page_links records - each
// with an X that asks first ("Remove graft?": the one dialog, without the "Don't ask me again" tick - an unlink keeps its own confirm). That stays.
//
// BIG PROJECTS STEP 3 ("connected to this page"; Nick's approved graft-doors mockup, cursor/graft-doors-mockup @ c4f34eb0; Fable's build notes):
//   - THE SUBJECT: the open PAGE; on a board, the SELECTED CARD (or the board itself while no card is selected). Read here, from the route and the
//     board's published snapshot, so the Tutor's drawer that mounts this pane is untouched.
//   - "+ Graft..." on top, on pages AND boards: the picker (components/GraftPicker.tsx).
//   - On a board, its PAIRED PAGE first: a plain row, no X (the plan relation, not a graft).
//   - "Connected to <subject>", then on a page its PLAN BOARD as ONE folded row, "Plan board · N cards" - the first group; opened, its cards, each
//     with an X on hover that HIDES the card from this page (pageSettings.hiddenPlanCards; the card stays on its board), with an Undo line.
//   - Groups Cards, Sources, Boards, Pages, each row with an X (connector-b's confirm, then an Undo line); then Shared tags (a tag mark, no X); a
//     faint place label on anything from another place.
//   - NO placeholder text: with nothing grafted, the pane is the "+ Graft..." control alone.
```

## ConnectionsDrawerPanel §4

From `apps/desktop/src/components/ConnectionsDrawerPanel.tsx`, line 46 at `7f1c6a84` (the comment that stays: "on a brand-new page a pick in + Graft births the page (birthWith); birth swaps the address with replaceState, which the router never hears, so the pane keeps following the id it saw unborn").

```ts
  // the subject: a board (its selected card, or the board) when a board is open; otherwise the page on the address.
  // A BRAND-NEW page (/page/new) has no row yet. RULING (Fable, Oct 21): a pick in "+ Graft..." CREATES it - through the unborn surface's own
  // birth (birthWith, the act a first word performs: the row, any pin its door asked for, the address) - and typing still follows
  // born-on-first-word. Birth swaps the address with replaceState, which the router never hears, so the route still reads /page/new after
  // it: the pane remembers the id it saw unborn and keeps following that page once it has a row.
```

## ConnectionsDrawerPanel §5

From `apps/desktop/src/components/ConnectionsDrawerPanel.tsx`, line 166 at `7f1c6a84` (the comment that stays: "dock this linked card or page beside the page (this device, one at a time) - the Tutor's dock carries it").

```ts
                  // POLISH #10 item 24: dock this linked card or page beside the page (this device; one at a time) - the Tutor's own dock carries it
```

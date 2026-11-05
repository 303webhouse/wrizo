# Rulings: `apps/desktop/src/store/grafts.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[grafts §n]` points here.

## grafts §1

From `apps/desktop/src/store/grafts.ts`, line 1 at `e2898deb` (the comment that stays: "grafts, "connected to this page": no schema change (a graft is a page_links record or a same-board connection box; a hidden plan card is an id in pageSettings.hiddenPlanCards); place labels from placeOfEntry; every reader skips built-in places and shells").

```ts
// BIG PROJECTS STEP 3 - GRAFTS, "connected to this page" (docs/plans/big-projects.md step 3 + the graft-doors addendum; mockup
// cursor/graft-doors-mockup @ c4f34eb0, Nick approved; Fable cleared step 3 Oct 19, Q10: a checked picker row is inert). The readers and
// the few writes behind the Grafts tab (components/ConnectionsDrawerPanel.tsx), the "+ Graft..." picker (components/GraftPicker.tsx) and the
// knob's landing. SCHEMA CHANGE: NONE - a graft is a page_links record (connector-b) or a same-board connection box, and a hidden plan card
// is an id in pageSettings.hiddenPlanCards (the existing whole-blob jsonb, the way pageSettings.template shipped).
//
// THE FILE SPLIT (docs/plans/big-projects-3-file-split.md, agreed with INK): this lives here, not in store/place.ts (INK's step 1a) or
// persistence.ts. PLACE LABELS come from 1a's own reader, placeOfEntry (rebased onto 1a+2 @ 4913a47f), named in the place block's own words -
// this function is the one site.
//
// EVERY reader skips a built-in place (a system board) and a delete-for-good shell; a trashed entry shows only where connector-b already
// shows one (a graft's other end, flagged `trashed`), never in the search.
```

## grafts §2

From `apps/desktop/src/store/grafts.ts`, line 20 at `e2898deb` (the comment that stays: "titles and search read the words, never a style span's marks").

```ts
// POLISH #10 item 4: titles and search read the words, never a style span's marks
```

## grafts §3

From `apps/desktop/src/store/grafts.ts`, line 154 at `e2898deb` (the comment that stays: "imported documents and Research-kind pages show under Sources, not Pages").

```ts
  // Q7 (Fable, Oct 18): Sources = imported documents (an import stamp) or Research-kind pages - shown under Sources, not under Pages
```

# Rulings: `apps/desktop/src/pages/Spread.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Spread §n]` points here.

## Spread §1

From `apps/desktop/src/pages/Spread.tsx`, line 14 at `7f1c6a84` (the comment that stays: "The spread view: the loose Journal as a grid in notebook order (getNotebookPages), each page with its ink thumbnail, a firstLine(40) caption and its position number. Drag-to-reorder (mouse drag; touch long-press ~350ms) persists via setNotebookPosition, the one ordering helper. Selection mode toggles brass borders and a count. Loose pages only. A lens row (order/content/star/tag) makes the grid a view over the one notebook-order source; lenses never write orderIndex. "Your order" is the writer-facing name; "notebook" stays internal (names only, never surfaced, accessible names included).").

```ts
// J3 — the spread view: a visual grid of the loose Journal in notebook order
// (J1's getNotebookPages), carrying each page's ink thumbnail (eraser-aware
// since J2), a firstLine(40) caption, and its position number. Drag-to-reorder
// (mouse: drag; touch: long-press ~350ms then drag) persists via
// setNotebookPosition — the SAME ordering helper createLoosePage uses, so
// there is exactly one ordering implementation. A selection mode toggles brass
// borders and a count; it wires NO actions (the Port arrives with J4). Loose
// pages only — filed/Shelf pages are a logged non-goal.
//
// J5 — the console. A quiet lens row (order/content/star/tag) turns the grid
// into a VIEW, composed on top of the one notebook-order data source; lenses
// never write orderIndex. "Your order" is the user-facing label for the
// internal notebook sequence — the vocabulary canon (2026-07-10) keeps
// "notebook" strictly internal (function/variable names only), never surfaced
// to the writer, including in accessible names.
```

## Spread §2

From `apps/desktop/src/pages/Spread.tsx`, line 422 at `7f1c6a84` (the comment that stays: ""Every" + the plural noun does not agree; the product noun is capitalized, like Journal/Shelf/Drawer").

```ts
          {/* ITEM word-diet (Fable, review fix, Oct 13) — "Every" + a now-
              always-plural noun doesn't agree ("Every loose Pages"); the
              product noun is capitalized (not lowercased), like Journal/
              Shelf/Drawer. */}
```

## Spread §3

From `apps/desktop/src/pages/Spread.tsx`, line 437 at `7f1c6a84` (the comment that stays: "never a number directly before "Pages"; the selected-count beside Select already shows it").

```ts
          {/* ITEM word-diet (Fable, review fix, Oct 13) — never a number
              directly before "Pages"; "these Pages" names the selection
              without one (the selected-count span beside Select already
              shows the number, so nothing is lost). */}
```

## Spread §4

From `apps/desktop/src/pages/Spread.tsx`, line 475 at `7f1c6a84` (the comment that stays: "empty states: one short line or nothing").

```ts
      {/* ITEM word-diet (Fable, review fix, Oct 13) — rule 4 (empty states:
          one short line or nothing); the second clause narrated what the
          Spread already is. */}
```

## Spread §5

From `apps/desktop/src/pages/Spread.tsx`, line 495 at `7f1c6a84` (the comment that stays: "`pages` is already in notebook order (Your order), whatever the click or selection sequence, as the port does").

```ts
          // R3 (Fable review, 2026-07-11): `pages` is already notebook order
          // (Your order) — sourced that way regardless of click/selection
          // sequence, matching J4's port precedent. Ratified, not a bug.
```

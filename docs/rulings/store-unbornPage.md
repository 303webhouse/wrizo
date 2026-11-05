# Rulings: `apps/desktop/src/store/unbornPage.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[unbornPage §n]` points here.

## unbornPage §1

From `apps/desktop/src/store/unbornPage.ts`, line 9 at `7f1c6a84` (the comment that stays: "born on the first word: the door's descriptor lives in the URL (/page/new + params), reload-safe by construction; nothing is written until `birth`").

```ts
// PB1 — Born on the First Word (docs/wrizo-alpha/p1-wave.md §PB1, item 71;
// the specification is docs/wrizo-alpha/pb1-unborn-surface.md).
//
// THE DESCRIPTOR LIVES IN THE URL (Fable's ruling 1, 2026-07-26). A door that
// opens a blank surface no longer creates a row; it navigates to /page/new
// carrying what the door MEANT as query params. That is reload-safe by
// construction — reload re-reads the address and the door's meaning survives
// with no storage, no store row, and no fallback rule to invent. The address
// describes a door until the writer makes it a room.
//
// Nothing here writes anything until `birth`.
```

## unbornPage §2

From `apps/desktop/src/store/unbornPage.ts`, line 38 at `7f1c6a84` (the comment that stays: "the door declares the room's KIND (prose or screenplay); a screenplay door births on arrival, since choosing Screenplay is a commitment about what the document is").

```ts
  // ITEM 104 — THE DOOR DECLARES THE ROOM'S KIND, not just its posture.
  //
  // `mode` (item 87) says which POSTURE a prose page opens in; this says what
  // KIND of document it is. Nick's verdict, verbatim: "Screenplay mode should be
  // auto-selected anyway when a user comes from a New Page where the
  // 'Screenplay' template icon was selected." That is the same seam items 91-92
  // established for the board pin and item 87 for the mode — the address
  // carrying what a page IS before it is born — extended one field further.
  //
  // Applying it is NOT a new carve-out of PB1. The ruled AMENDMENT to Fable's
  // ruling 2 already says Screenplay BIRTHS at zero words, "which is also why
  // there is no unborn script surface to hold" (see `requestScreenplay` in
  // PageEditor.tsx). A door declaring `structure=screenplay` therefore births on
  // arrival for exactly the reason the toggle does: choosing Screenplay is a
  // durable authorial commitment about what the document IS, not a decoration.
  // Every silent door keeps writing nothing, so PB1's own law is untouched.
```

## unbornPage §3

From `apps/desktop/src/store/unbornPage.ts`, line 156 at `7f1c6a84` (the comment that stays: "a page is born at 11 pt: the unborn slot already carries it, so the page draws at 11 before the first word and birth() writes it with that word; a board has no page size").

```ts
  // TOOLS #14 (Nick, Nov 2) - a page is born at 11 pt: the unborn slot already carries it, so the page draws at 11 before the first word and birth() writes it with that word. A board has no page size.
```

## unbornPage §4

From `apps/desktop/src/store/unbornPage.ts`, line 161 at `7f1c6a84` (the comment that stays: "birth: one synchronous call, the only place an unborn surface becomes a row, with its content written in the same act (never create-empty-then-save)").

```ts
// BIRTH — one synchronous call, and the only place an unborn surface becomes a
// row. The content is passed IN and written in the SAME act: never
// create-empty-then-save, because the window between those two writes is
// exactly the keystroke of loss this ticket may not introduce. The row goes
// through the ordinary saveJournalEntry path, so the first word reaches disk
// under the existing debounced-flush guarantee (persistence.ts's own ~300ms,
// offline included), identical to every other write in the app.
//
// Triggers (Fable's ruling 2): the first word, or an act that creates a durable
// relationship — pairing, porting, pinning. Plus the ruled AMENDMENT: choosing
// Screenplay births, because it transforms the document rather than decorating
// it (see the amendment's own note in PageEditor).
```

## unbornPage §5

From `apps/desktop/src/store/unbornPage.ts`, line 178 at `7f1c6a84` (the comment that stays: "ink is content, so a first stroke births the page with its strokes in the same act").

```ts
  // ITEM 121 I2 — ink is content, so ink can be a birth trigger. Exactly the
  // `boxes` shape and for exactly the `boxes` reason: the row is written WITH
  // the drawing in the same synchronous act, never created empty and filled in
  // afterwards. F6's DoD 4 already ruled that an ink-only page is NOT empty, so
  // a first stroke on an unborn Free Write page births it the way a first word
  // does. Zero schema — `strokes` is an existing column on the row.
```

## unbornPage §6

From `apps/desktop/src/store/unbornPage.ts`, line 205 at `7f1c6a84` (the comment that stays: "relationships of the same act are applied here, so the row and its relationship are never observable apart; the pin can come from the address, so it survives a reload").

```ts
  // Relationships that were part of the SAME act (ruling 2) are applied here,
  // so the row and its relationship are never observable apart.
  //
  // ITEM 91 — the descriptor is now a source for this, not just the explicit
  // opt. `opts.pinToBoardId` still wins when a caller passes it, but a door that
  // encoded the board in the ADDRESS no longer has to thread an option through
  // every intermediate component to be honoured: the four `birthWith` call sites
  // are untouched by this ticket and all four inherit the behaviour. That also
  // means the pin survives a reload of the unborn surface, because the address
  // does — a page opened from a board, left, and returned to is still born
  // pinned to that board.
```

# Rulings: `apps/desktop/src/store/persistence.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[persistence §n]` points here.

## persistence §1

From `apps/desktop/src/store/persistence.ts`, line 13 at `7f1c6a84` (the comment that stays: "page-link labels read the words").

```ts
// POLISH #10 item 4: page-link labels read the words
```

## persistence §2

From `apps/desktop/src/store/persistence.ts`, line 83 at `7f1c6a84` (the comment that stays: "the dirty registry is PERSISTED: getDirtyRecords() filters the cache by this set, so a memory-only set lost every pending row on reload, invisibly").

```ts
// --- Dirty registry -------------------------------------------------------
// Ids of records changed locally since the last sync, tracked per collection.
//
// PERSISTED (item 89). This set used to be module-scope memory only, and that
// was a work-losing defect: `getDirtyRecords()` filters the cache BY this set,
// so a reload before the next successful push emptied it and every pending row
// became unpushable — sitting on disk, enumerated normally by every local
// screen, and invisible to sync forever. Nothing surfaced the loss, because
// every list in the app reads the local cache (`getJournalPages()` and friends
// read `cache` alone), so a stranded row looks exactly like a synced one on the
// device that owns it. The only recovery was the one-shot journal backfill
// below, cleared by hand. Journaling the ids alongside the data closes it:
// what survives the reload pushes on the next connection, unattended.
```

## persistence §3

From `apps/desktop/src/store/persistence.ts`, line 139 at `7f1c6a84` (the comment that stays: "the id journal is written from flush(), in the same moment as the collection; its own write failure is reported under its own name (dirtyJournal), since a saved-but-unmarked row would never push").

```ts
// Write the id journal. Called from `flush()` so the dirty snapshot lands in
// the same synchronous moment as the collection it describes: the two can
// never disagree about a record that reached disk. `markClean()` and the
// journal backfill call it directly, since neither touches a collection.
// STORAGE-FULL STEP 1 (Fable's byte review, item 1) — this write is a save too, and it can fail on its own: a
// collection's own write can succeed while THIS one — the record of which rows are still unpushed — does not. That
// stamps a just-saved, still-unsynced record as indistinguishable from a clean one: nothing pushes it, nothing
// notices, the exact silent class this step exists to end. Reported under its OWN name (never one of COLLECTIONS'
// names) so a reader can tell "the record itself didn't save" from "the record saved, but sync doesn't know it
// needs to" — both are real, and they are different repairs.
```

## persistence §4

From `apps/desktop/src/store/persistence.ts`, line 328 at `7f1c6a84` (the comment that stays: "the id journal rides with the data: whenever a record reaches disk, the fact that it is unpushed does too").

```ts
  // The id journal rides with the data (item 89): whenever a record reaches
  // disk, the fact that it is unpushed reaches disk in the same tick.
```

## persistence §5

From `apps/desktop/src/store/persistence.ts`, line 360 at `7f1c6a84` (the comment that stays: "every mutating test seam flushes, made true here for the whole file and enforced by seed-guard.mjs: a write is debounced, and a fixture that reloads first loses it; product code keeps its own debounced cadence").

```ts
// ITEM 85-C / OBS-1 — EVERY MUTATING TEST SEAM FLUSHES, AND THIS IS THE ONE
// PLACE THAT MAKES IT TRUE.
//
// A product write is debounced (`scheduleFlush`, 300ms). A fixture that writes
// through a seam and then reloads discards the page — and the cache holding the
// row — before the timer fires, so the write never reaches storage. That killed
// 36 of 80 files on one stamped leg, every one reporting NOVERDICT.
//
// The fix was first applied only to the seams item 85-C added, which left the
// three older ones (`wrizoPinPageToBoard`, `wrizoSetPinDisplayed`,
// `wrizoSetPageHome`) carrying the same footgun and made "every seam flushes" a
// claim rather than a fact. Hoisted here so it is true OF THE FILE, and enforced
// by seed-guard.mjs so the next seam cannot quietly opt out.
//
// PRODUCT CODE IS UNTOUCHED: it calls these store functions DIRECTLY and keeps
// its own debounced cadence. This makes the SEAM durable, not the store eager.
```

## persistence §6

From `apps/desktop/src/store/persistence.ts`, line 859 at `7f1c6a84` (the comment that stays: "creates a blank page (source: 'page'); the blank-surface doors no longer call this - they open an unborn surface; it serves callers that create a page and a durable relationship in one act").

```ts
// Create a blank, directly-authored journal page (J10) and persist it. Marked
// source: 'page' so the read view renders the editable sheet instead of a
// read-only capture.
//
// PB1 (item 71) — THE CURRENT GUARANTEE, replacing the honor-discard sentence
// that used to stand here ("An empty page left untouched is discarded on exit
// by the page itself (honor-discard, J1a), so this never litters the journal").
// That was true only while these pages opened on JournalEntry.tsx, whose
// unmount soft-deleted an untouched page. FX14 routed every door to THE Page,
// which has no such cleanup, and the sentence quietly became a promise nothing
// kept — which is how ~45 empty Untitleds reached Nick's corpus.
//
// The guarantee now holds without any cleanup: **the blank-surface doors no
// longer call this.** They open an unborn surface (/page/new, store/
// unbornPage.ts) and the row is written by the first word. This function
// survives for callers that create a page AND a durable relationship in the
// same act — where the room is entered at the moment it is made — and for the
// test/inspection seam below. If you are adding a door that just opens a blank
// page, do not call this; navigate to unbornHref() instead.
//
// ITEM 82 FIX (b) — the optional `seed`. Every field here exists for ONE
// reason: to let a fixture reach the state it needs THROUGH this function
// instead of writing the row behind the cache's back. AGENTS.md's successor
// seeding law (2026-08-01) says seeding goes through the app's seams, and
// `j5.mjs` could not obey it because its four fixture pages need a NAMED id
// (`j5-src-N`, asserted by id all through the file), a STEPPED `createdAt`
// (the Spread's notebook and "Newest" orders are both derived from it — see
// pageOrder.notebookKey and Spread.tsx's newest sort), and `strokes` (the
// ink-lens fixtures). This function minted all three itself, so the fixture
// stayed a raw write — and a raw write is erased by the next flush of this
// collection, which is item 82's proven mechanism.
//
// PRODUCT DOORS MUST NOT PASS `seed`. It is not a feature of page creation;
// it is the seam's parameter list. Census at the time of writing: this
// function has ZERO call sites in `apps/desktop/src` — it is reachable only
// through `window.wrizoCreateJournalPage` below — so this extension has no
// product blast radius at all. A future door that creates a page and a
// durable relationship in one act calls this with NO argument, exactly as
// the paragraph above describes.
//
// `updatedAt` is NOT seedable and is deliberately not faked: `upsert` stamps
// it on every write (persistence.ts's one write path), and the seam does not
// get a private clock the product does not have. Nothing in the notebook's
// ordering reads it — `notebookKey` is `orderIndex ?? createdAt`, and the
// Spread's "Newest" lens sorts on `createdAt` — so a seeded page orders
// exactly as its raw-written predecessor did.
```

## persistence §7

From `apps/desktop/src/store/persistence.ts`, line 1004 at `7f1c6a84` (the comment that stays: "birth from defaults: a COPY taken at birth, so a later change to the defaults never re-dresses written pages; a page the app itself births (no seed) is born at 11 pt, a seeded call (the harness seam, a fixture) as it asks - the writer's defaults or nothing").

```ts
    // ITEM 83 M2 (R6) — BIRTH FROM DEFAULTS. Nick's ruling is that page
    // settings "reset to defaults when the user creates a new page". That is
    // implemented as a COPY taken at birth, not as a live read-through of the
    // writer's defaults: a later change to their defaults must not silently
    // re-dress pages they have already written. `undefined` when the writer
    // has never set defaults — the grandfather fixed point, byte-identical to
    // a pre-M2 page.
    //
    // MERGE NOTE (S4, both sides kept): main gave this function a `seed`
    // parameter (item 85's seam remediation) and renamed the timestamp to
    // `createdAt`, so a seeded page can be born with a supplied time. That
    // naming is taken verbatim below; birth-from-defaults is orthogonal to
    // it and rides unchanged. Neither side lost anything.
    // TOOLS #14 - a page the app itself births (no seed) is born at 11 pt; a SEEDED call (the harness seam, a fixture) is born as it asks - the writer's defaults or nothing - so a fixture is untouched.
```

## persistence §8

From `apps/desktop/src/store/persistence.ts`, line 1063 at `7f1c6a84` (the comment that stays: "test/inspection seam: a direct path to a fresh journal-origin page for fixtures; the seed may carry origin, pageType, projectId and boxes").

```ts
// B1 S6 — test/inspection seam (this file's own established pattern —
// window.wrizoPinPageToBoard/wrizoNotebook, etc.). Every harness fixture
// that predates this ticket reached a fresh, editable journal-origin page
// by clicking the RETIRED Journal list's own "New page" button
// (.journal-new-page, pages/Journal.tsx — deleted, S5) purely as
// SCAFFOLDING for testing something else entirely (autosave, way-back, the
// Spread console, and so on — none of it about the list surface itself).
// This seam gives every one of those pre-existing scenarios an equally
// direct path to the identical state, without resurrecting the retired
// room's own UI just to keep old harness plumbing working.
//
// Item 82 fix (b): callers may pass a `JournalPageSeed` (id / text /
// createdAt / strokes) — see that interface's own comment for why, and for
// why product code never does.
//
// ITEM 129 widened that seed with origin / pageType / projectId / boxes, and
// the reason is worth keeping next to the seam rather than only in the ledger:
// a seam that cannot express the fixture a harness needs does not get bypassed
// loudly. It gets bypassed QUIETLY, with a raw localStorage write that works
// perfectly until some unrelated product write flushes the cache over it — and
// then presents as a ~50% "flaky test" that no amount of polling can fix.
// bm1's S2 was item 85's first concrete victim; the remediation is to make the
// seam able to say what fixtures actually need to say. The write is DEBOUNCED like every other
// product write (`scheduleFlush`, 300ms), so a fixture that reads
// localStorage straight afterwards must wait for the row to land; the raw
// write this replaces was synchronous, and that is the one behavioural
// difference a migrating harness has to absorb.
```

## persistence §9

From `apps/desktop/src/store/persistence.ts`, line 1295 at `7f1c6a84` (the comment that stays: "the words, never a span's marks").

```ts
// POLISH #10 item 4: the words, never a span's marks
```

## persistence §10

From `apps/desktop/src/store/persistence.ts`, line 1530 at `7f1c6a84` (the comment that stays: "the containment graph (a board contains a board through a page-pin) and its ONE walker; every recursive reader uses it, and the `seen` set is mandatory: a graph can arrive already cyclic, and a walk without it hangs").

```ts
// --- PW2 S1 — THE CONTAINMENT GRAPH, AND ITS ONE WALKER --------------------
//
// A board is a RECURSIVE CONTAINER (item 128). The containment edge is the
// EXISTING `page-pin` box and nothing new: board P contains board C when P
// carries a page-pin whose `entryId` is C. So the graph's edges live across
// ENTRIES, and walking it means `getBoardsConnecting` repeatedly — NOT the
// `parentId` chain in `store/boardStructure.ts`, which is a different graph
// entirely (BM1's OUTLINE nesting, within one board's own boxes array). That
// walker's SHAPE is the precedent here; its edges are not.
//
// ⚠ ONE WALKER, AND EVERY RECURSIVE READER USES IT. The order is the safety,
// not a style: nothing on `main` walks this chain recursively yet, so this
// lands BEFORE any reader that would. A second hand-rolled walk is a second
// place for the `seen` set to be forgotten.
//
// ⚠ THE `seen` SET IS MANDATORY, and not merely for tidiness. A graph can
// arrive ALREADY CYCLIC — from an older client, through sync — and a walk
// without `seen` does not report a cycle on such data, it HANGS. So the walk
// must terminate on a pre-existing loop it did not create, which is a claim
// about READ safety, not just write refusal. `boardStructure.ts`'s own
// `wouldCycle` carries the identical guard for the identical reason.
//
// The walk is a DAG walk, not a chain walk: a board may sit in several boards
// at once, so "the parent" is a set and the frontier is a stack.
```

## persistence §11

From `apps/desktop/src/store/persistence.ts`, line 1616 at `7f1c6a84` (the comment that stays: "a page-pin is membership, not capture: it references an entry by id and never touches its record; page-pins are TALL, at the rail thumbnail's page ratio and nearly the old footprint").

```ts
// --- AB4 S2 — Pin: membership, not capture --------------------------------
// A page-pin card references an entry by id; it never copies its content and
// never touches the referenced entry's own record (origin/projectId/text all
// stay byte-unchanged — only the BOARD's `boxes` array gains a card). Rides
// the exact same `Box[]`/`saveBoardBoxes` recipe as every other card (zero
// schema — see the `Box` interface's own AB4 S2/S3 comments in types/index.ts
// for the full reasoning on why this stays inside the existing column).
// ITEM 138 — PAGE-PINS ARE TALL. Nick's thumbnail law reaches the canvas:
// "horizontal rectangles for Boards, vertical rectangles for Pages."
//
// THE NUMBERS ARE DERIVED, NOT PICKED. The ratified rail thumbnails are 22×30
// for a page (aspect h/w = 1.36) and 34×20 for a board (0.59) — index.css's own
// PW2 S2 amendment. This page silhouette is 0.16 × 0.22, aspect 1.375: the rail's
// page ratio, at very nearly the footprint the old wide default had
// (0.28 × 0.12 = 0.0336 of the canvas; 0.16 × 0.22 = 0.0352), so a card changes
// SHAPE without suddenly claiming more wall.
//
// ⚠ BOTH w AND h ARE FRACTIONS OF THE CANVAS **WIDTH** — BoardEditor renders
// `width: box.w * pageWidthPx, height: box.h * pageWidthPx`, the same scalar
// twice. So the aspect is simply `h / w`, and "taller than wide" means `h > w`
// with no viewport arithmetic. Stated because reading `h` as a fraction of
// HEIGHT would make every number here mean something else.
```

## persistence §12

From `apps/desktop/src/store/persistence.ts`, line 1640 at `7f1c6a84` (the comment that stays: "a board is wider than tall wherever it appears (more horizontal than the page-pin, so the shape reads at a glance)").

```ts
// PW2 S2 AMENDMENT (Nick) — A BOARD IS WIDER THAN TALL WHEREVER IT APPEARS.
// The rail draws a board's thumbnail as a horizontal rectangle and a page's as
// a vertical one; a nested board's card on the CANVAS obeys the same law, so
// the two faces of one board agree and the silhouette means the same thing in
// both places. Deliberately MORE horizontal than the page-pin default rather
// than equal to it — a shape that teaches has to be distinguishable at a
// glance, not on measurement.
```

## persistence §13

From `apps/desktop/src/store/persistence.ts`, line 1650 at `7f1c6a84` (the comment that stays: "the silhouette is a keyed record, so a caller must NAME which kind it places; it keys on the ENTRY kind, never the box kind (a board's card is a page-pin box too)").

```ts
// ITEM 138 — THE SILHOUETTE, AND ITS TYPE RIDER.
//
// The two shapes are a KEYED RECORD rather than four loose constants, and that is
// the rider the ledger asked for: a caller cannot reach for the wrong pair,
// because it has to NAME which kind it is placing. The old form
// (`nesting ? BOARD_CARD_W : BOARD_PIN_W`) spelled the choice twice per site and
// would have spelled it a third time at the resize lock below.
//
// ⛔ AND IT KEYS ON THE **ENTRY** KIND, NEVER THE BOX KIND — 138's ratified
// exclusion clause. A nested board's card is the SAME `page-pin` box as a page's,
// so a builder keying on `box.kind` would flip EVERY board card to tall and undo
// Nick's own wide-board ruling. The signature takes an entry (or null) precisely
// so a box cannot be passed to it by mistake.
```

## persistence §14

From `apps/desktop/src/store/persistence.ts`, line 1674 at `7f1c6a84` (the comment that stays: "the aspect a pinning card is locked to once the writer resizes it: constrain forward, never snap - never on load or a move").

```ts
/**
 * The aspect (h / w) a pinning card is LOCKED to once the writer resizes it —
 * item 138's constrain-forward lock.
 *
 * CONSTRAIN FORWARD, NEVER SNAP. This is not applied on load, on a move, or on
 * any arrival of a limit: an existing card keeps its stored geometry until the
 * writer RESIZES it (Nick's ruling — "resized only" counts as touched; a move
 * alone is not a touch). At that moment the shape the writer is already changing
 * takes the lock. Nothing the writer laid out is ever rewritten underneath them.
 */
```

## persistence §15

From `apps/desktop/src/store/persistence.ts`, line 1689 at `7f1c6a84` (the comment that stays: "`display` splits the two acts: page-side (the default) makes a membership without placing it; board-side places it, since the writer authored that arrangement").

```ts
// PW1 S3 (item 125) — `display` splits the two acts that share this function.
//
// PAGE-SIDE (the default, `false`): the writer is standing on a PAGE and
// declaring a membership — the Places checkbox, "Pin to a Board…". Membership
// without display is the default there, exactly as item 125 rules, because the
// writer has not chosen a position on that board's wall and the app must not
// choose one for them.
//
// BOARD-SIDE (`display: true`): the writer is standing ON THE BOARD and putting
// something on it — "New page card", "Place page on board", "Add an existing
// page", or opening a new page from a board's own door. That IS arrangement the
// writer authored, on the surface they are looking at, so withholding it would
// make the card they just asked for VANISH. Item 125's own reason points this
// way: the rule exists so a canvas never "arrives pre-furnished [with]
// arrangement the writer did not author" — here they authored it.
//
// Named as a judgment call, not smuggled: the brief rules that new memberships
// are not displayed, and does not enumerate the board-side doors. This split is
// what keeps `item9192`'s own regression control true (a card that vanishes
// from the board it was just made on is the symptom item 92 was about), and it
// is a one-word change to overturn if Fable or Nick reads it otherwise.
```

## persistence §16

From `apps/desktop/src/store/persistence.ts`, line 1711 at `7f1c6a84` (the comment that stays: "the membership guard: only two sites create a page-pin, and the derived one never routes here, so this simply refuses what a writer may not author; the source must resolve to a live, pinnable entry (a positive check)").

```ts
  // PW2 S1 — THE MEMBERSHIP GUARD. One seam, both laws, no mode flag.
  //
  // WHY NO MODE FLAG, measured rather than assumed: there are exactly TWO sites
  // in this file that create a `page-pin` box — this one (the AUTHORED write)
  // and `placeNewCards`, whose single caller is `reconcileSystemBoard` (the
  // DERIVED write). The derived path never routes through here, so this guard
  // does not have to tell authored from derived; it can simply refuse what a
  // writer may not author, and the condition boards keep deriving their own
  // pins untouched.
  //
  // ── LAW 1 · THE SOURCE RESOLVES TO A LIVE, PINNABLE ENTRY ─────────────────
  // Ruled as item 134's rider (a), and deliberately POSITIVE. The rider reads
  // "a drawer is never a member of anything", but a negative check —
  // `if (isDrawer) return null` — WOULD NEVER FIRE: a Drawer is not a
  // JournalEntry at all (its own row in `cache.drawers`), so a drawer id never
  // arrives typed as a drawer. It arrives as an id that RESOLVES TO NOTHING.
  //
  // THE GUARD IS ABOUT WHAT THE ID *IS*, NOT WHAT IT IS CALLED. Stated
  // positively it makes the rider true by construction AND closes the wider
  // hole the survey found underneath it: before this, nothing here verified
  // the source existed at all, so ANY foreign id — a drawer's, a project's, a
  // typo's — fell straight through and wrote a page-pin pointing at nothing.
  // A dangling membership renders as "Missing page" and is a member of a board
  // forever.
```

## persistence §17

From `apps/desktop/src/store/persistence.ts`, line 1773 at `7f1c6a84` (the comment that stays: "a new membership is NOT displayed until the writer places it: onCanvas:false is written explicitly (absence means displayed); the seat still computes for a later Display; the silhouette comes from the entry").

```ts
  // PW1 S3 (item 125) — the pin is the MEMBERSHIP record, and a new membership
  // is NOT displayed until the writer places it. `onCanvas: false` is written
  // EXPLICITLY here, never left to absence: absence means DISPLAYED (the build
  // law that keeps every already-arranged board reading unchanged), so a new
  // pin that merely omitted the field would land on the canvas at a position
  // nobody chose — the exact arrangement-the-writer-did-not-author the display
  // opt-in exists to prevent (A16; BD7). The x/y/z above still compute, so a
  // later `Display on Board` from the menu has a lawful default seat to take.
  // A nested board's card takes the board silhouette; a page's keeps the page
  // one. Existing arranged boards are untouched — every box stores its own
  // w/h, so this changes the DEFAULT a new card is born at and nothing else.
  // ITEM 138 — the silhouette comes from the ENTRY, through the one reader.
  // The old `nesting` boolean is gone with the pair of per-axis ternaries it fed;
  // the comment above still describes the behaviour, which has not changed —
  // a nested board's card takes the board silhouette, a page's takes the page one.
```

## persistence §18

From `apps/desktop/src/store/persistence.ts`, line 1796 at `7f1c6a84` (the comment that stays: "the display act: sets a membership's canvas flag, `at` being the drag's landing point; a no-op when the membership does not exist (it never creates one)").

```ts
// PW1 S3 (item 125) — the DISPLAY act, the menu half. Sets a membership's
// canvas flag; `at` (normalized x/y) is the drag half's landing point — the
// writer chooses the position, which is the whole reason display is opt-in.
// Absent `at`, the pin keeps the seat pinPageToBoard already computed for it.
// A no-op when the membership does not exist: this never CREATES one, so the
// two relations stay distinct at the seam as well as in the schema.
```

## persistence §19

From `apps/desktop/src/store/persistence.ts`, line 1833 at `7f1c6a84` (the comment that stays: "card transfer, copy only: a NEW box with a NEW id on the target board, source untouched, so edits cannot follow; threads do not travel (their endpoints are box ids on one board); a Box has no tags to carry").

```ts
// --- PW2 S3 — CARD TRANSFER (item 123). COPY ONLY. ------------------------
//
// COPY SEMANTICS, ruled: the original stays, there is NO SHARED IDENTITY, and
// edits do not follow. So this mints a NEW box with a NEW id on the target
// board and touches the source board's record not at all — which is what makes
// "edits do not follow" true by construction rather than by discipline: there
// is no shared row to diverge.
//
// ⚠ THREADS DO NOT TRAVEL, and the mechanism is worth stating because it looks
// like an omission. A thread is a `connection` box whose `connA`/`connB` are
// BOX IDS on one board. The copy has a new id and lands on a different board,
// so a copied connection would point at endpoints that do not exist there — a
// hairline to nowhere. They are therefore not copied at all, rather than
// copied-and-repaired, and the tray says so BEFORE the act.
//
// TAGS: item 123's ruling also says "tags travel with the copy". That clause is
// DEFERRED ON THE RECORD (Fable, 2026-09-13), not dropped: a `Box` has no tags
// field — tags live on `JournalEntry` — so cards cannot carry tags yet and the
// clause has nothing to act on. Its successor is C4, the cluster's tags design;
// the day cards can carry tags, the copy carries them and the tray's sentence
// regains its middle clause. The tray ships only the true clauses meanwhile.
//
// MOVE IS NOT BUILT AND MUST NOT BE. In a canon built on ownership, moving a
// card is an ownership transfer and a different act; item 123 defers it by
// name. Copy only.
```

## persistence §20

From `apps/desktop/src/store/persistence.ts`, line 1885 at `7f1c6a84` (the comment that stays: "the copy is built from a WHITELIST, not spread-and-strip: a new Box field travels only when someone says so (a strip list let sourceEntryId through)").

```ts
  // ⚠ THE COPY IS BUILT FROM A WHITELIST, NOT SPREAD-AND-STRIP. Ruled, and the
  // reason is a defect this function already had: it was written as
  // `{ ...box }` minus a strip list, and copying a PORTED card carried
  // `sourceEntryId` straight through — giving that copy a double-click that
  // TRAVELS instead of opening its editor, which is the very thing
  // `copiedFromBoardId` exists to prevent. The strip list was one field behind
  // the day it was written.
  //
  // THE LAW, because it generalizes past this function: A COPY CARRIES NOTHING
  // BY DEFAULT. A strip list is a rule that must be UPDATED every time the
  // shape grows — so it rots silently, and the failure is a field that travels
  // when nobody decided it should. A whitelist is a rule that must be EXTENDED
  // on purpose: a new `Box` field simply does not travel until someone says it
  // does, and the worst case is a field missing rather than a relationship
  // forged by accident.
  //
  // Each field below is listed because it is part of WHAT THE CARD IS, and
  // everything absent is absent on purpose:
  //   kind/text/strokes — the content itself; this is the thing being copied.
  //   w, h              — the card's authored SIZE, part of how it reads
  //                       (shape teaches the kind), so a copy is recognisably
  //                       the same card.
  //   fontFace/fontSize — ITEM 207: the card's own typeface and point size are
  //                       how it READS, exactly as w/h are; a copy that came
  //                       back in the everyday font would not be the same card.
  //   copiedFromBoardId — the new lineage, this act's own record.
  // Deliberately NOT carried:
  //   x, y, z           — a position on ANOTHER board's canvas. The target
  //                       places the copy by its own stacking, below.
  //   groupId           — names a group that exists on the SOURCE board; the
  //                       copy would join a group that is not there.
  //   seq/laneId/parentId — a position in another board's ordering; parentId
  //                       would point at a box that does not exist here.
  //   sourceEntryId/portedAt — the MIRROR relationship. A copy is independent
  //                       by item 123's own words, and inheriting these is the
  //                       exact defect above.
  //   entryId/connA/connB/canvas*/footerOn/onCanvas/systemKind/lanes — belong
  //                       to kinds a copy can never be (a copy is text or ink),
  //                       or to the board rather than the card.
```

## persistence §21

From `apps/desktop/src/store/persistence.ts`, line 1961 at `7f1c6a84` (the comment that stays: "the RAW structural scan (condition boards included): which boards carry a page-pin for this entry - for "connected" use getBoardsConnecting").

```ts
// Every board (regardless of its own home) currently pinning `entryId` — the
// RAW STRUCTURAL SCAN, condition-boards included.
//
// PW1 ERRATUM 1 (Nick's live sitting, 2026-09-09) — ⚠ THIS IS PROBABLY NOT THE
// FUNCTION YOU WANT. It answers "which boards carry a page-pin box for this
// entry", which is a question about STORAGE. It does NOT answer "which boards
// is this page CONNECTED to" — for that use `getBoardsConnecting` below, the
// same scan minus the condition-boards.
//
// The difference is not tidiness. Under the three-space canon the Shelf, Trash
// and Journal boards are DISPLAYS OF A CONDITION (loose; deleted; in-journal-
// view), not places — and their pins are DERIVED, written by
// `reconcileSystemBoard` from `qualifyingPagesFor` in reaction to that
// condition. The writer never authored them. So a page-pin on a system board is
// not a membership at all, it is a rendering, and reporting it as a connection
// tells the writer they linked something they never touched. Nick saw exactly
// that: a loose page's "Boards connected" listing the Shelf.
//
// This raw form survives for the one caller that asks the genuinely structural
// question — ExistingPagePicker's "is this page already on THIS board", where
// the host board's own kind is being tested rather than interpreted.
```

## persistence §22

From `apps/desktop/src/store/persistence.ts`, line 1988 at `7f1c6a84` (the comment that stays: "the connection reader: getBoardsPinning minus the condition boards (Shelf, Trash, Journal display a condition, not a connection); the only form that may feed a list claiming the writer connected something").

```ts
// PW1 ERRATUM 1 — THE CONNECTION READER. `getBoardsPinning` minus the
// condition-boards, and the ONLY form that may feed a sentence or a list which
// claims the writer connected something.
//
// "Shelf and Trash are displays of a CONDITION (loose; deleted), NOT places"
// (Fable's annotation on the three-space canon); the Journal board is the same
// shape by construction. A condition is not a connection — it is the app
// describing the page's state back to itself — so none of the three may appear
// under "Boards connected", in the Page face's "Also connected to…" line, or in
// the Tutor's Structure lens.
//
// Consequence worth stating, because it is the visible behaviour Nick asked
// for: a LOOSE page (which always sits on the Shelf board by derivation) now
// shows its own plan board and nothing else — and if it has no plan board, the
// zone does not render at all (PW9: absent, never empty).
```

## persistence §23

From `apps/desktop/src/store/persistence.ts`, line 2101 at `7f1c6a84` (the comment that stays: "Append to <chapter> copies the pages' TEXT in notebook order, separated by a blank line; sources are never touched").

```ts
// J5 Slice 3 — "Append to <chapter>" (COPIES): selected pages' TEXT, in
// notebook order (Your order — the J4 port precedent; click/selection
// sequence is NOT honored, Fable R3), each landing at the chapter's end
// separated by one blank line. Sources are never touched — read-only here.
```

## persistence §24

From `apps/desktop/src/store/persistence.ts`, line 2517 at `7f1c6a84` (the comment that stays: "move a page to a single home (binderId, 'shelf'/'loose', or 'journal'); 'shelf' and 'loose' both mean un-file - where it lands follows its origin; the legacy `shelved` flag is never written").

```ts
// Move a page to a single home: a binderId, 'shelf'/'loose', or 'journal'.
// Enforces exactly-one-home (filing into a binder clears the un-filed
// state; un-filing clears `projectId`). An ordinary record update — syncs
// like any edit.
//
// B2 S3 — the legacy `shelved` flag retires from every write path,
// INCLUDING this one: no branch below sets it true or false anymore (the
// column stays dormant — never dropped, never touched). 'shelf' and
// 'loose' are now plain synonyms for "un-file" — the Shelf is derived
// (T3), never filed-into, so there is no longer a distinct "shelve" act
// for this function to perform; whichever pool a just-un-filed page lands
// in (the Journal, or the Shelf) is entirely a function of its own origin
// (inJournalView/T3), never of which target string was passed. 'loose' is
// the Places panel's own name for this (S4: "Selecting Loose un-files —
// the page heads to the Shelf by T3"); 'shelf' is kept as an accepted
// synonym so every pre-existing call site (AddToSheet.tsx, PageFileMenu.tsx)
// keeps working, byte-identical in effect, with zero call-site edits forced
// by this ticket alone.
// ITEM 88a — THE TARGET IS VALIDATED, AND A REFUSAL IS REPORTABLE.
//
// This function used to accept ANY string as a binder id and assign it straight
// to `projectId`, with no existence check and a `void` return. Both halves lost
// work:
//
//   - An id naming no live binder made the page invisible to EVERY enumerator —
//     not the Journal (`projectId == null` filter), not any binder's page list,
//     not the Shelf (`belongsOnShelf` excludes filed pages), and not the
//     "Everything" export. One bad string could retire a page from the product
//     while leaving the row perfectly intact on disk.
//   - The `void` return made the `!entry` early exit indistinguishable from
//     success, which is exactly how PlacesPanel came to toast "Filed to X." over
//     a filing that never happened (item 88b, on an UNBORN page — a row PB1
//     deliberately keeps out of the store until its first word).
//
// So the outcome is now a value the caller must look at. Refusals write NOTHING:
// a filing that cannot be honoured leaves the page where it was, which is always
// recoverable, rather than somewhere no surface can reach. `getProject()` is the
// app's own definition of a live binder (it filters `deletedAt`) and is the same
// definition `getProjects()` uses to build the list the UI offers — so a target
// the writer could actually pick is always accepted, and a deleted binder is
// refused for the same reason a nonexistent one is: filing into it orphans the
// page just as completely.
```

## persistence §25

From `apps/desktop/src/store/persistence.ts`, line 2562 at `7f1c6a84` (the comment that stays: "read the cache, not getJournalEntry: getJournalEntry falls through to the unborn slot, and saving that record births an empty page by a side door").

```ts
  // ITEM 88b — READ THE CACHE, NOT `getJournalEntry`. This is the correction
  // that the harness forced, and the reasoning matters more than the line.
  //
  // Item 88's own S0 recorded 88b as "setPageHome early-returns when
  // getJournalEntry misses, which is exactly the case for an UNBORN page, so
  // the panel toasts a filing that never happened." That analysis is FALSE, and
  // `item88.mjs` falsified it on the first run: `getJournalEntry` FALLS THROUGH
  // TO THE UNBORN SLOT (see its own body below), so an unborn page IS found
  // here. The old code then mutated that record-shaped object and handed it to
  // `saveJournalEntry` — which put it in the cache, marked it dirty, and
  // scheduled it to disk. Filing an unborn page did not no-op and did not lie:
  // it BIRTHED AN EMPTY PAGE through a side door, bypassing `birth()`, leaving
  // `setUnbornEntry(null)` uncalled (so the slot still held the same id), and
  // minting exactly the `text: ''` litter PB1 exists to prevent.
  //
  // An unborn surface is deliberately "never serialized, never synced, never
  // enumerated" — it cannot appear in Places, the Journal, the Shelf, a board's
  // pin list, or an export. A thing that is in no pool cannot be moved between
  // pools, so filing is not a no-op by accident here; it is a no-op by the same
  // structural law. Reading the cache directly is what makes that true in code
  // rather than by comment: birth stays the ONE path that turns a surface into
  // a row (PB1's ruling 2), and this function can no longer take that job by
  // side effect. The refusal is reportable, so the panel can say so plainly —
  // which is Nick's own S6 verdict, "no toast on a no-op."
```

## persistence §26

From `apps/desktop/src/store/persistence.ts`, line 2686 at `7f1c6a84` (the comment that stays: "a soft delete (a synced row travels its deletion, never a hard delete); every getter already filters deletedAt").

```ts
// CD2 S3 — soft-delete a page, mirroring softDeleteDrawer's own pattern
// exactly (a synced row must travel its deletion, never hard-delete). The
// FIRST UI-reachable delete for a JournalEntry — `deletedAt` itself is not
// new (every getter above already filters `!e.deletedAt`; only Drawer had a
// live door to it before now). Zero schema: the field has existed since the
// sync adapter's own soft-delete convention was laid down. Used by the
// Cascade's Plan survey (T4's ruling: one plain confirm, then gone — "gone
// from list and store" per the brief's own S6 DoD, satisfied because every
// getJournalEntry/getBinderPages/etc. read above already excludes it).
```

## persistence §27

From `apps/desktop/src/store/persistence.ts`, line 2753 at `7f1c6a84` (the comment that stays: "re-mint is the designed behaviour (a soft-deleted board lands here too), and the stale pointer is cleared at detection, not only by the conditional re-pair below").

```ts
    // ITEM 97 — RE-MINT IS THE DESIGNED BEHAVIOUR (Nick, 2026-08-17), AND THE
    // POINTER IS CLEARED AT DETECTION.
    //
    // BE CLEAR ABOUT WHAT THIS DID AND DID NOT CHANGE, because a harness proved
    // it rather than a reading: `item97.mjs` is GREEN AGAINST THE PRE-FIX BUNDLE.
    // Minting fresh and re-pointing the page ALREADY happened on this path; the
    // decision ratifies behaviour that was there, it does not repair it.
    //
    // What changes is (i) intent and (ii) one edge. The old comment said "board
    // hard-gone", describing only HALF of what reaches here: `getJournalEntry`
    // returns null for a SOFT-DELETED row too, so a tombstoned board lands here
    // as well — incidentally, not by design. Nick has ruled that treatment
    // deliberate. And the stale pointer is cleared HERE, at detection, rather
    // than only by the re-pair at the end of this function: that re-pair is
    // conditional on re-reading the page, so if the page itself went absent in
    // between, the old code left the dangle in place.
    //
    // SCOPE, recorded so no one re-derives it — and it corrects this lane's own
    // 2026-08-03 finding, which read this function ALONE. The LOCAL trash path
    // NEVER reaches this branch: `softDeleteEntry` already unpairs a trashed
    // plan board before marking it deleted (BM1 S2 — "deleting a plan board
    // unpairs"). This branch is reachable only where a board goes absent
    // WITHOUT that path — chiefly a sync pull carrying another device's
    // tombstone, which `applyRemoteRecords` applies with no unpair.
    //
    // RESIDUAL, named rather than hidden: the WINDOW between a tombstone
    // arriving and the next flip is not closed by this. Closing it would mean
    // unpairing at apply-time, which is a larger change than the decision
    // authorised.
```

## persistence §28

From `apps/desktop/src/store/persistence.ts`, line 3148 at `7f1c6a84` (the comment that stays: "the authoring seams (test/inspection only): every seam flushes before it returns (a write is debounced); carry `origin` and `source` explicitly - an omitted key is a different row").

```ts
// ===========================================================================
// ITEM 85-C — THE AUTHORING SEAMS. Test/inspection only, in the shape
// `wrizoCreateJournalPage` and `wrizoPinPageToBoard` already established.
//
// ► IF YOU ARE WRITING A SEAM-SEEDED FIXTURE, READ THESE TWO FIRST. Both cost a
// stamped pair to learn, and neither is visible to any static check.
//
//   1. THE DEBOUNCE. A product write is debounced (`scheduleFlush`, 300ms); the
//      raw write it replaces was synchronous. A fixture that seeds and then
//      immediately reloads discards the page — and the cache holding the row —
//      before the timer fires, so the row never reaches storage and the surface
//      never mounts. Every seam below FLUSHES before returning, so you are safe
//      using them; if you reach storage by any other product path and then
//      reload, call `wrizoFlushNow()` first. On wave 1's first leg this killed
//      36 of 80 files, all reporting NOVERDICT — nothing at all.
//
//   2. `origin` AND `source` MUST BE CARRIED EXPLICITLY. `createJournalPage`
//      defaults origin to 'journal' and hardcodes source:'page', so a row that
//      OMITS either is a different row: absent `source` is what makes an entry
//      a raw capture (computeFragmentItems filters `e.source !== 'page'`), and
//      absent `origin` is the pre-AB3 grandfather shape. Pass `origin: null` /
//      `source: null` to seed a row without that field. The absence of a key is
//      a value, and counting a key's presence cannot see it.
//
// WHY THEY EXIST. Item 85's migration measured 55 harness files writing a
// persisted collection raw, and 27 of them could not stop: nothing on `window`
// authored a project, a story plan or a drawer, and nothing set a field on a
// row that already existed. A fixture that cannot say what it needs says it
// raw — and a raw row is erased by the next product write in the same run,
// which is how one file cost a day. `j5.mjs` names this in its own source:
// "no wrizo* seam authors one — item 85 phase 2".
//
// WHAT THEY ARE, AND THE LINE THEY DO NOT CROSS. Every one is a thin wrapper
// over a store path that ALREADY EXISTS and is already exercised by product
// code. No new capability, no schema, no new persistence behaviour: this
// widens the door, never the house. Product code never calls any of them —
// they are reachable only from `window`, which is how the existing two seams
// are scoped, and nothing in `src/` references them.
//
// THE ONE COMPOSITION, FLAGGED RATHER THAN SLIPPED IN. `wrizoPatchProject`
// composes `getProject` + `saveProject` because there is no first-class
// project mutator to wrap — the store has `renameDrawer` but no
// `renameProject`, and `fx9.mjs` renames a project to prove its folds are
// id-keyed. Both halves are existing exports and the composition is the same
// one `setProjectDrawer` directly above performs, so it stays inside the
// wrapper rule; it is named here because it is the only seam below that is not
// a single call forwarded.
//
// IDS ARE RETURNED, NOT SUPPLIED. `createProject`/`createStoryPlan`/
// `createDrawer` generate their own ids, and these seams do not override that
// — overriding would mean changing the creators, which is house work, not door
// work. Fixtures that hardcode ids today adopt the returned one instead, the
// same way every UI-driven fixture already reads its page id back after
// creating one. (`createJournalPage` differs only because it already accepted
// a seeded `id` before this item.)
// ===========================================================================
```

## persistence §29

From `apps/desktop/src/store/persistence.ts`, line 3214 at `7f1c6a84` (the comment that stays: "a seam returns what was STORED, not what was asked: upsert stamps updatedAt on the clone it inserts, so every creating seam re-reads its row").

```ts
  // ITEM 85-C — A SEAM RETURNS WHAT WAS STORED, NOT WHAT WAS ASKED.
  //
  // A WRITE PATH THAT ECHOES ITS INPUT CAN CERTIFY A WRITE THAT DID NOT HAPPEN.
  // Measured: seed a row with updatedAt 2020-05-05, and the seam handed back
  // 2020-05-05 while storage held 2026-09-15. `upsert` stamps `updatedAt`
  // unconditionally — and it stamps the CLONE it inserts, so the caller keeps an
  // unstamped original and never learns. Any fixture asserting on the return
  // would pass against storage that disagrees: a check passing for the wrong
  // reason, built into the write path rather than into one test.
  //
  // So every creating seam RE-READS the row it just wrote and returns that. The
  // lie cannot be inherited by a future fixture, and the fix is confined to the
  // seam block — no product path changes, because product code takes the
  // creators' return value and is entitled to whatever it has always had.
```

## persistence §30

From `apps/desktop/src/store/persistence.ts`, line 3507 at `7f1c6a84` (the comment that stays: "the proofing mirror goes out with everything else at sign-out, through its own store's function; unpushed words on this device go with it").

```ts
  // ITEM 204 PART 2 — the writer's PROOFING mirror goes out with everything else
  // (Fable's ruling: "a signed-out device keeps nothing of the writer's; it goes
  // out the same way every other writer record does"). It lives in its own store,
  // so it is cleared through that store's own function rather than by spelling its
  // storage key a second time here.
  //
  // ⚠ THE COST, NAMED: words added on this device and never pushed go out with
  // it. That is the ruled trade — the alternative was one account's dictionary
  // outliving its session on a shared device, which is worse.
```

## persistence §31

From `apps/desktop/src/store/persistence.ts`, line 3520 at `7f1c6a84` (the comment that stays: "delete for good: a purge replaces a record with its shell, marks it to sync and clears every reference; only from Trash (every purge refuses a record not already soft-deleted); the server refuses later non-purge writes").

```ts
// ---- DELETE FOR GOOD (docs/plans/delete-for-good.md, cleared Oct 18; Nick picked the purged_at column) -------------------------------
// A purge replaces a record with its SHELL - id, times, deletedAt, purgedAt, and no words - marks it to sync, and clears every reference to it.
// It is only ever offered from Trash: every purge function refuses a record that is not already soft-deleted (Trash first, always). The server
// clears the content again itself and refuses any later non-purge write (apps/server/src/sync.ts), so no device can bring it back.
```

## persistence §32

From `apps/desktop/src/store/persistence.ts`, line 3561 at `7f1c6a84` (the comment that stays: "a page_links record on another entry naming the purged one is tombstoned (an unlink's shape, so it syncs); the purged entry's own records go with its shell").

```ts
    // connector-b's page_links (ledger 107): a record on another entry that names the purged one is TOMBSTONED and its owner saved - an
    // unlink's own shape, so it syncs and every device drops it. The purged entry's own records go with its shell.
```

# Rulings: `apps/desktop/src/types/index.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[index §n]` points here.

## index §1

From `apps/desktop/src/types/index.ts`, line 333 at `4d6af3d9` (the comment that stays: "The sheet's dimension: what a page IS as paper, as opposed to its face+size, which is its VOICE. One shape serves both the per-page value and the per-user default, because "set as my default" is a copy of the open page's settings; two shapes would drift. Below it, the page's declared kind and the style guide, as PLACEHOLDERS: they render and persist per page, and nothing downstream is wired yet; what isn't built doesn't render. NOT named `PageKind`: `DeskFrame.pageKind` already means which SURFACE renders ('prose' | 'screenplay' | 'board'); this is what the writer DECLARES the page to be. Zero schema: both keys ride `journal_entries.page_settings` jsonb as optional, absent-never-null members of PageSettings, so an untouched page is byte-identical and reads `undefined` -> the defaults here. No column, no migration, no backfill.").

```ts
// ITEM 83 M2 (R6) — the sheet's dimension: what a page IS as paper, as
// opposed to Revise's face+size, which is its VOICE (the F5 split, Nick's to
// confirm). One shape serves both the per-page value and the per-user
// default, because "set as my default" is literally a copy of the open page's
// own settings — two shapes would let them drift.
// ITEM 114 — THE PAGE'S DECLARED KIND, AND THE STYLE GUIDE UNDER RESEARCH.
// Built as PLACEHOLDERS by Nick's own word ("so we don't forget to go back to
// it"): they render and they persist per page, and NOTHING downstream is wired
// — the Revise linkage and footnotes are deferred by his word, not by omission.
// Nothing is greyed either: what isn't built doesn't render (G3).
//
// WHY IT IS NOT CALLED `PageKind`, named so a later hand does not marry them:
// `DeskFrame.pageKind` already exists and means something else entirely —
// 'prose' | 'screenplay' | 'board', which SURFACE is rendering. This is what
// the writer DECLARES the page to be. Two different questions; the app should
// never answer one with the other.
//
// ZERO SCHEMA. Both keys ride the existing `journal_entries.page_settings`
// jsonb (apps/server/src/migrate.ts) as OPTIONAL, absent-never-null members of
// PageSettings below — the same grandfather fixed point `tutor`/`origin`/
// `planBoardId` all keep, so an untouched page is byte-identical and reads
// `undefined` -> the defaults here. No column, no migration, no backfill.
```

## index §2

From `apps/desktop/src/types/index.ts`, line 358 at `4d6af3d9` (the comment that stays: "preselected: Normal is the page's kind until the writer says otherwise, and MLA is the style guide on Research's FIRST reveal. Read through `?? PAGE_KIND_DEFAULT`, never written at birth: writing them would dirty every page that never asked.").

```ts
// Preselected, per the ruling: Normal is the page's kind until a writer says
// otherwise, and MLA is the style guide on Research's FIRST reveal. Read
// through `?? PAGE_KIND_DEFAULT`, never written at birth — writing them would
// dirty every page that never asked.
```

## index §3

From `apps/desktop/src/types/index.ts`, line 377 at `4d6af3d9` (the comment that stays: "Proofing: the writer's dictionary, dialect and ignore blob. One nullable jsonb column, `users.proofing`, on `users.page_defaults`' recipe: per WRITER, not per page, so it is neither `pageSettings` nor a second tenant of `page_defaults` (that column is the starting DRESS; proofing is a different concept).").

```ts
// ITEM 204 PART 2 — PROOFING: the writer's dictionary, dialect and ignore blob.
// Rides ONE nullable jsonb column, `users.proofing` (Nick's schema word), on
// `users.page_defaults`' recipe — per WRITER, not per page, so it is neither
// `pageSettings` nor a second tenant of `page_defaults` (that column is the
// starting DRESS; proofing is a different concept and would overload it).
```

## index §4

From `apps/desktop/src/types/index.ts`, line 390 at `4d6af3d9` (the comment that stays: "the default, changeable and never prompted for").

```ts
/** Fable's stated default, changeable and never prompted for. */
```

## index §5

From `apps/desktop/src/types/index.ts`, line 393 at `4d6af3d9` (the comment that stays: "A removed word's tombstone expires after this many days (compaction, not a cap). Named rather than inlined because the consequence is a behaviour a reader should be able to find: a device offline longer than this can bring a removed word back.").

```ts
/**
 * A removed word's tombstone expires after this many days (Fable's ruling:
 * compaction, not a cap). Named rather than inlined because the consequence is
 * a behaviour a reader should be able to find: a device offline longer than this
 * can bring a removed word back.
 */
```

## index §6

From `apps/desktop/src/types/index.ts`, line 446 at `4d6af3d9` (the comment that stays: "optional and ABSENT (never null) on every page that never chose, which keeps an older row byte-identical. Not in PAGE_SETTINGS_FALLBACK below: the fallback is the app's DRESS floor, and a page's kind is not its dress; readers default through PAGE_KIND_DEFAULT / STYLE_GUIDE_DEFAULT.").

```ts
  // ITEM 114 (item 83 errata E4) — see the note above these two types. Optional
  // and ABSENT (never null) on every page that never chose, which is what keeps
  // a grandfathered row byte-identical. Deliberately NOT added to
  // PAGE_SETTINGS_FALLBACK below: the fallback is the app's DRESS floor, and a
  // page's kind is not its dress — the readers default through
  // PAGE_KIND_DEFAULT / STYLE_GUIDE_DEFAULT instead.
```

## index §7

From `apps/desktop/src/types/index.ts`, line 542 at `4d6af3d9` (the comment that stays: "a TEXT card's own face and size (the options live in the card's tool strip; the default is the everyday font). Additive inside `boxes` (jsonb), zero schema, and ABSENT on every card that never chose.").

```ts
  // ITEM 207 - a TEXT card's own face and size (Nick's Q3: the options live in the card's tool strip; the default is the
  // everyday font). Additive inside `boxes` (jsonb) - zero schema - and ABSENT on every card that never chose.
```

## index §8

From `apps/desktop/src/types/index.ts`, line 546 at `4d6af3d9` (the comment that stays: "A DEALT STEP IS A QUESTION, NOT TEXT. Two additive optional fields inside the board's `boxes` jsonb (zero schema: sync stores the blob whole, as with fontFace / seq / onCanvas), written ONLY by a NEW deal of a Tier 1 deck: prompt - the step's question, resolved at deal time (store/guided.ts, decks/content.ts). The card's PLACEHOLDER, shown while it has no body, never in `text`, so it is never exported, copied, counted, synced as body or read by the Tutor as the writer's words (harness guided-w3 pins that no reader names `.prompt`). A written card keeps the field and stops showing it; delete the words and the question returns. deckStep - which step of which deck this card was dealt as ({ deck: 'three-act', step: 'hook' }): the key the "?" reads its sentence and example by, and what the Walk and coverage read. The card owes the deck nothing else.").

```ts
  // W3 (guided paths, Nick Oct 23) - A DEALT STEP IS A QUESTION, NOT TEXT. Two additive optional fields inside the board's own `boxes` jsonb (zero schema - sync stores the blob whole;
  // the fontFace / seq / onCanvas precedent, ledgered), written ONLY by a NEW deal of a Tier 1 deck and absent on every other card, including every card dealt before W3:
  //   prompt   - the step's question, RESOLVED AT DEAL TIME (store/guided.ts, decks/content.ts). It is the card's PLACEHOLDER: shown while the card has no body, never body text - never
  //              in `text`, so it is never exported, copied, counted, synced as body or read by the Tutor as the writer's words (every such reader reads `text`; harness guided-w3 pins that
  //              no reader names `.prompt`). A card the writer has written into keeps the field and simply stops showing it; delete the words and the question returns.
  //   deckStep - which step of which deck this card was dealt as ({ deck: 'three-act', step: 'hook' }): the key the "?" reads its sentence and example by, and what W1's Walk and W5's
  //              coverage will read. It owes the deck nothing else (the engine's "the deck forgets itself" stands for the CARD's text; this one pointer is the single exception).
```

## index §9

From `apps/desktop/src/types/index.ts`, line 555 at `4d6af3d9` (the comment that stays: "The writer marks a step FINISHED by hand. One additive optional field inside the board's `boxes` jsonb (zero schema: sync stores the blob whole, like seq / onCanvas / deckStep). `true` = lit; ABSENT = not lit (unmarking REMOVES the key, so there is one way to be unlit), unmarked from the same door. A statement of the writer's, never a measurement: it never counts toward coverage (kindled() ignores it), never completes a Deck and never celebrates (store/guided.ts withLit, store/deckRewards.ts).").

```ts
  // W5 (guided paths, Nick Oct 26: LIT IS APPROVED) - the writer marks a step FINISHED by hand. One additive optional field inside the board's own `boxes` jsonb (zero schema: no column, no migration, no server
  // change - sync stores the blob whole, like seq / onCanvas / deckStep). `true` = lit; ABSENT = not lit (unmarking REMOVES the key, so there is one way to be unlit). The writer can unmark it from the same door.
  // It is a statement of the writer's, never a measurement: it never counts toward coverage (kindled() ignores it), never completes a Deck and never celebrates (store/guided.ts withLit, store/deckRewards.ts).
```

## index §10

From `apps/desktop/src/types/index.ts`, line 559 at `4d6af3d9` (the comment that stays: "The writer sized this card by hand. One additive optional field inside the board's `boxes` jsonb (zero schema: sync stores the blob whole, like lit / seq / deckStep). `true` = hand-sized, the card KEEPS its size; ABSENT = auto, the card fits its content (grows and, once the writer has acted on it, shrinks). Set ONLY by a resize the writer performs on a text card; resizing back to its content height CLEARS it (the key is removed, so there is one way to be auto). Never set by a deal, a move, an edit or the reflow.").

```ts
  // BUG 32c (Nick APPROVED, Oct 30: new saved data) - THE WRITER SIZED THIS CARD BY HAND. One additive optional field inside the board's own `boxes` jsonb (zero schema: no column, no migration, no server change -
  // sync stores the blob whole, like lit / seq / deckStep). `true` = hand-sized, the card KEEPS its size; ABSENT = auto, the card fits its content (grows and, once the writer has acted on it, shrinks). Set ONLY by a
  // resize the writer performs on a text card; resizing it back to its content height CLEARS it (the key is removed, so there is one way to be auto). Never set by a deal, a move, an edit or the reflow.
```

## index §11

From `apps/desktop/src/types/index.ts`, line 579 at `4d6af3d9` (the comment that stays: "MEMBERSHIP IS NOT DISPLAY. A 'page-pin' Box is the membership record; the card on the canvas is one display of it. This flag gates the canvas and nothing else: `getBoardsPinning` reads membership by the pin's PRESENCE and never consults it, so a withheld card is still a member of the board everywhere. ABSENCE MEANS DISPLAYED: boards arranged before this field read `undefined` as "on the canvas" (no backfill, no migration); only an explicit `false` withholds. New memberships write `false` explicitly (pinPageToBoard), since a position is the writer's act. The `footerOn` shape: an additive optional field inside the board's `boxes` jsonb; sync.ts maps the whole blob (`JSON.stringify(e.boxes ?? null)` / `r.boxes ?? undefined`) with no per-field enumeration, so it costs zero schema, migration or server change.").

```ts
  // PW1 S3 (item 125) — MEMBERSHIP IS NOT DISPLAY. A 'page-pin' Box is the
  // MEMBERSHIP RECORD; the card on the canvas is one DISPLAY of it. This flag
  // gates the canvas and nothing else — `getBoardsPinning` reads membership by
  // the pin's PRESENCE and never consults it, so a withheld card is still, in
  // every list and every sentence, a member of the board.
  //
  // ABSENCE MEANS DISPLAYED — the build law, and the storage shape serves it
  // rather than the reverse. Every board a writer has already arranged predates
  // this field entirely, so `undefined` MUST read as "on the canvas": no
  // backfill, no migration, and a first launch after this ships is byte-for-byte
  // the arrangement they left. Only an explicit `false` withholds. New
  // memberships write `false` EXPLICITLY (pinPageToBoard), because opting in to
  // a position is the writer's act — the whole reason display is opt-in.
  //
  // The exact shape `footerOn` above already established (and canvasW/canvasH/
  // systemKind/seq/laneId/parentId/lanes before it): an additive optional field
  // inside the board's own `boxes` jsonb. S0 measured the round trip — sync.ts
  // writes `JSON.stringify(e.boxes ?? null)` and reads `r.boxes ?? undefined`,
  // a WHOLE-BLOB mapper with no per-field enumeration at either end — so this
  // costs zero schema, zero migration, and zero server change. Approved as the
  // storage home by Fable, on this S0's measurement (item 125).
```

## index §12

From `apps/desktop/src/types/index.ts`, line 601 at `4d6af3d9` (the comment that stays: "A DELETED CARD IS A TOMBSTONE, NOT A REMOVAL. Three additive optional fields inside the board's `boxes` jsonb (zero schema: sync stores the blob whole): deletedAt - stamped when the card is sent to Trash; the box stays in `boxes`, hidden from every reader (store/boxTombstones.ts: liveBoxes), listed on the Trash board; Restore clears it. updatedAt - the per-box CHANGE TIME. Set when a card is deleted or restored; absent on every card that predates it. It alone decides which side of a merge wins. purgedAt - a permanent delete from Trash replaces the box with `{ id, kind, purgedAt }` + zeros. Final: a stale save cannot resurrect it.").

```ts
  // BOARD CONTEXT MENU (Oct 15) - A DELETED CARD IS A TOMBSTONE, NOT A REMOVAL. Three additive optional fields inside the board's own `boxes` jsonb (zero schema - sync stores the blob whole):
  //   deletedAt  - stamped when the card is sent to Trash; the box stays in `boxes`, hidden from every reader (store/boxTombstones.ts: liveBoxes), listed on the Trash board; Restore clears it.
  //   updatedAt  - the per-box CHANGE TIME. Set when a card is deleted or restored; absent on every card that predates this. It, and nothing else, decides which side of a merge wins.
  //   purgedAt   - a permanent delete from Trash replaces the box with `{ id, kind, purgedAt }` + zeros. Final: a stale save cannot resurrect it.
```

## index §13

From `apps/desktop/src/types/index.ts`, line 611 at `4d6af3d9` (the comment that stays: "A COPY GETS ITS OWN FIELD. `sourceEntryId` means "this card MIRRORS that entry", and BoardEditor's double-click dispatch is built on it: a text card carrying it TRAVELS to its source instead of opening the edit popup. A copy is the opposite relationship, independent (edits do not follow), so reusing the mirror field would cost a copy the editing gesture. One field, one relationship: additive optional, the `onCanvas` pattern, zero schema (`Box` rides the board's `boxes` jsonb). Read for the lineage line only (text, no travel); the dispatch is untouched.").

```ts
  // PW2 S3 (item 123) — A COPY GETS ITS OWN FIELD. Ruled, and the reason is
  // the whole of it: `sourceEntryId` means "this card MIRRORS that entry", and
  // BoardEditor's double-click dispatch is built on that meaning — a text card
  // carrying it TRAVELS to its source instead of opening the edit popup. A copy
  // is the OPPOSITE relationship: independent by item 123's own words ("edits do
  // not follow"). Reusing the mirror field would have cost a copy the editing
  // gesture every other card has.
  //
  // ONE FIELD, ONE RELATIONSHIP. Additive optional, the `onCanvas` pattern, zero
  // schema — `Box` rides the board's own `boxes` jsonb. Read for the lineage
  // line ONLY (text; no travel in PW2 — a door there is a later refinement), and
  // the dispatch is left untouched.
```

## index §14

From `apps/desktop/src/types/index.ts`, line 639 at `4d6af3d9` (the comment that stays: "TWO TRUE KINDS, Board and Book, as two optional additive fields on this board-meta box inside the board's `boxes` jsonb (the systemKind precedent: zero schema, no column, no migration, no server change). NOT named `kind`: Box.kind is the box discriminator ('text' / 'ink' / 'page-pin' / 'connection' / 'board-meta'). boardKind - 'board' | 'book'. Absent = a Board. The Journal's kind is DERIVED from systemKind and never stored on it; no other Book exists yet. homeView - the view the board opens in until the writer has chosen one on this device (the device-local "last shown as", store/boardMode.ts, beats it). Absent = the kind's default: a Board opens in Open, a Book in Flip. A Deck is a Board whose homeView is 'walk'. A value the kind does not have is ignored (store/boardKind.ts homeViewOf). It syncs (the whole boxes blob; last write wins): store/boardKind.ts withHomeView stamps this box's `updatedAt`, so the newer write wins the box-level merge (mergeBoxLists) rather than a tie going to whichever side won the entry.").

```ts
  // W1 (the Walk, board kinds and "Show as" - Nick's option C, Fable Oct 23) - TWO TRUE KINDS, Board and Book, as two optional additive fields on this SAME board-meta box inside the board's own `boxes` jsonb
  // (the systemKind precedent: zero schema, no column, no migration, no server change; ledgered). NOT named `kind`: Box.kind is the box discriminator ('text' / 'ink' / 'page-pin' / 'connection' / 'board-meta').
  //   boardKind - 'board' | 'book'. Absent = a Board. The Journal's kind is DERIVED from systemKind and never stored on it; no other Book exists yet (no "New Journal" door).
  //   homeView  - the view the board opens in until the writer has chosen one on this device (the device-local "last shown as", store/boardMode.ts, beats it). Absent = the kind's default: a Board opens in Open, a Book in Flip.
  //               A Deck is a Board whose homeView is 'walk' (born from a Preset). A value the kind does not have is ignored (store/boardKind.ts homeViewOf).
  // IT SYNCS (the whole boxes blob; last write wins): store/boardKind.ts withHomeView stamps this box's `updatedAt`, so the newer write wins the box-level merge (mergeBoxLists) rather than a tie going to whichever side won the entry.
```

## index §15

From `apps/desktop/src/types/index.ts`, line 677 at `4d6af3d9` (the comment that stays: "linking is NOT a new shape: a card-to-card link is the EXISTING 'connection' box (connA/connB, an olive hairline BENEATH card faces, deletable, jsonb-in-`boxes`). FragmentLink is the rhizome ancestor; 'connection' is its board-side descendant. Open's thread gesture IS linking: no field added here.").

```ts
  // BM1 S5 — linking is NOT a new shape: a card→card link is the EXISTING
  // 'connection' box (AB4 S3 — connA/connB, drawn as an olive hairline BENEATH
  // card faces, deletable, zero-migration jsonb-in-`boxes`). FragmentLink is
  // the rhizome ancestor; 'connection' is its board-side descendant, already
  // shipped. "Linking absorbed into Open" (Nick's scrapping of Commonplace)
  // means: OPEN's existing thread gesture IS v1 linking — no field added here.
```

## index §16

From `apps/desktop/src/types/index.ts`, line 685 at `4d6af3d9` (the comment that stays: "The Tutor's per-page conversation thread: one nullable jsonb column on `journal_entries` (`tutor`, additive only, no default, no CHECK, like `origin`/`script`), mapped both ways in sync.ts (rowToJournalEntry / upsertJournalEntries). It holds the writer<->Tutor exchange for THIS page and its read cursor, nothing else: lens results and nudges are DERIVED, recomputed on every approach, never stored (a page's jsonb holds authored or generated content, never a cache of a computation that can be re-run). null <-> undefined is a fixed point through every client mutation path (persistence.ts's getTutorThread/saveTutorThread) and both sync directions: a page with no thread is absent, never an empty {messages:[]}. `role` is 'writer' | 'tutor' only; the system prompt binding the Tutor to the ghostwriter rail lives server-side, per request, never stored. `lastRead?: { at, chars }` is the listener's cursor, how much of the page's text the Tutor has read: a fact about the conversation, not a lens result or a nudge. It is optional because a thread with no cursor yet means "read from the start", never "read nothing"; it advances ONLY via persistence.ts's advanceTutorCursor, ONLY on a successful reply, and ONLY on a thread that already exists, so a page that never talked to the Tutor gains no persisted tutor state.").

```ts
// TU1 S1 — the Tutor's per-page conversation thread (fragments-under-Pages
// citizen #3, the `script`/`boxes` recipe once more: one nullable jsonb
// column on `journal_entries`, additive only — `add column if not exists
// tutor jsonb`, no default, no CHECK — matching the `origin`/`script`
// precedent exactly, both sync-mapper directions (sync.ts's rowToJournalEntry
// / upsertJournalEntries). It holds ONE thing: the writer<->Tutor exchange
// for THIS page. Nothing else is ever persisted here — S3's lens results
// (Consistency/Structure/Fragments observations) and S4's nudges are
// DERIVED, recomputed fresh on every approach, never stored (the sheet
// law's own instinct — a page's jsonb columns hold authored/generated
// content, never a cache of a computation that can be re-run) applied to
// the Tutor's room. Grandfather clause: null <-> undefined must be a fixed
// point through every client mutation path (persistence.ts's
// getTutorThread/saveTutorThread) and both sync-mapper directions — a
// legacy page with no thread behaves byte-identically to today, forever
// (absent, not an empty {messages:[]} — a subtly different, wrong
// "grandfathered" state the ticket's own harness proves against). `role`
// is 'writer' | 'tutor' (never a third value — no system-message leakage
// into the persisted thread; the system prompt binding the Tutor to A13's
// ghostwriter rail lives server-side only, per-request, never stored).
//
// TU2 S2 — a charter amendment to this comment's own "Nothing else is
// ever persisted here," made on Nick's word at the TU2 brief's
// ratification, 2026-07-21 (the brief's own text: "Amend TutorThread...
// the tutor jsonb may now also carry lastRead?: { at: string; chars:
// number } — a charter amendment to TU1 S1's 'nothing else is ever
// persisted,' made on Nick's word at this brief's ratification"): the
// listener's cursor, marking how much of the page's text the Tutor has
// already read. This is NOT a lens result and NOT a nudge (both of those
// stay DERIVED, recomputed fresh, never stored, exactly as above) — it is
// a small, genuinely-authored fact about the conversation's own history:
// where it last looked. `lastRead` is optional for the same grandfather
// reason `tutor` itself is optional on JournalEntry: a thread predating
// TU2, or a thread whose writer has not sent a message since TU2 shipped,
// has no cursor yet, and the absence of `lastRead` on an otherwise-real
// thread means "read from the start" (TU2 S2's own grandfather clause),
// never "read nothing." It advances ONLY via persistence.ts's own
// advanceTutorCursor, ONLY on a successful reply (a failed call advances
// nothing), and ONLY on a thread that already exists — a page that has
// never talked to the Tutor still cannot gain ANY persisted tutor state,
// cursor included; that fixed point is untouched by this amendment.
```

## index §17

From `apps/desktop/src/types/index.ts`, line 765 at `4d6af3d9` (the comment that stays: "The Screenplay Room's document (conformant per `docs/fragments-under-pages-canon.md` §3). One styled block per element; a Scene is the addressable unit (its heading and body elements are fragments OF the scene, but links and ports always point at the Scene, never an element). `dual`/`struck`/`number`/`omitted`/`beatId` are reserved, not built: present here, never written by the UI.").

```ts
// S1 — the Screenplay Room's document (fragments-under-Pages citizen #2, ruled
// conformant in `docs/fragments-under-pages-canon.md` §3). One styled block per
// element; a Scene is the addressable unit (its heading + body elements are
// fragments OF the scene, but links/ports always point at the Scene, never an
// element). `dual`/`struck`/`number`/`omitted`/`beatId` are reserved-not-built —
// present here, never written by S1's UI.
```

# Rulings: `apps/desktop/src/components/CascadePanels.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[CascadePanels §n]` points here.

## CascadePanels §1

From `apps/desktop/src/components/CascadePanels.tsx`, line 133 at `e2898deb` (the comment that stays: "excerpts are plain text").

```ts
// item 210: excerpts are plain text
```

## CascadePanels §2

From `apps/desktop/src/components/CascadePanels.tsx`, line 140 at `e2898deb` (the comment that stays: "FoldSection: one disclosure for every list-bearing section, keyed by a stable content-independent id; the collapsed body stays mounted (for the height transition) but inert and aria-hidden").

```ts
// ---------------------------------------------------------------------------
// FX9 S1/S2 — the fold: a header disclosure toggle shared by every
// list-bearing section this ticket touches (DrawersPanel's per-project
// clusters + its documents list, JournalPanel's recent list). ONE component,
// not a per-panel reimplementation — S1's own grammar (whole-header hit
// target, quiet olive chevron, ~180ms/instant-under-reduced-motion, proper
// button semantics) is a single law, not a per-surface judgment call.
//
// `sectionKey` is the S2-ruled stable, content-independent identity (a
// project cluster passes its project id, never its title — callers below
// build the key, this component just stores under whatever it's handed).
// `itemCount` feeds the count-based first-ever default (sectionFold.ts);
// once the writer has ever touched THIS key's toggle, useSectionFold makes
// their choice sovereign and itemCount stops mattering for it.
//
// The collapsed body stays MOUNTED (not conditionally rendered) so the
// height transition below has something real to animate between 0 and its
// content's own natural height — but goes genuinely `inert` (FirstRunGate's
// own established pattern for the same React/TS JSX-typing gap: `inert`
// isn't in this project's @types/react version, so it's set imperatively
// via a ref) plus `aria-hidden` while collapsed, so a collapsed section's
// rows are neither keyboard-focusable nor announced — S3's "the header
// carries its own name and its chevron, that is all it carries" holds for
// the accessibility tree too, not just the paint.
```

## CascadePanels §3

From `apps/desktop/src/components/CascadePanels.tsx`, line 215 at `e2898deb` (the comment that stays: "no row until the first word; the door's origin rides in the address").

```ts
  // PB1 (item 71) — no row until the first word; the door's origin rides in the address.
```

## CascadePanels §4

From `apps/desktop/src/components/CascadePanels.tsx`, line 249 at `e2898deb` (the comment that stays: "the Page pop-out: New Page (a loose page via createLooseHomePage, opened at /page/:id), then the Page face, then Places").

```ts
// ---------------------------------------------------------------------------
// Page — the Page face, carried forward whole (S3's own words), now with an
// unmissable "New Page" action at its own head (FX6 S2a — "the New Page
// discoverability gap," Nick's own words). A SEPARATE door from
// JournalPanel's own pre-existing New-page button above (cascadeJournalNewPage
// — unrelated to this ticket, and a genuinely different kind of page: that
// one homes in the Journal): a writer already looking at THIS page's own
// face (star/tags/homing) shouldn't have to remember the Journal category
// is where page creation lives — the door travels with the writer instead.
// Reuses createLooseHomePage() verbatim — the SAME "give me a blank page,
// no assumptions about where it files" door Arrival.tsx's own Write door
// already uses (AB3 S4 — `loose` is a legitimate, permanent home, never
// nudged to file), opening at `/page/:id` (PageEditor, mode-aware) — never
// a bespoke creation path or a new route. Olive-lane chrome
// (`wz-cascade-action-door`, index.css) makes it unmissable via CONTRAST
// against its plain neighbors, not urgency color — "nothing orange at
// rest" holds.
// ---------------------------------------------------------------------------
// B2 S5 gave the Page pop-out two doors: "New Journal Entry" and "New Page".
// FX15 S3 (the Quiet Page) RETIRES "New Journal Entry" — it was a second,
// redundant door to journal-origin creation (the Journal category's own
// button and Catch still perform that exact act, unchanged), and "journal
// entry" as a page KIND is dead SV6 vocabulary (the Journal is a home/origin,
// not a type). The Page pop-out now carries one door: New Page, then the Page
// face, then Places.
```

## CascadePanels §5

From `apps/desktop/src/components/CascadePanels.tsx`, line 306 at `e2898deb` (the comment that stays: "page setup: the paper is the preview (margins and spacing write custom properties on the live sheet, no Apply); numbers, headers and footers are stored for print and export and do not paint on screen").

```ts
// ITEM 83 M3 (R6) — PAGE SETUP.
//
// Nick's ruling: "general page options that govern the opened page (margins,
// line spacing, page numbers + their placement, headers, footers, etc.) ...
// linked to the current page a user is on but reset to defaults when the user
// creates a new page. (There should also be a setting for the user to set
// their own default page settings at the bottom of the PAGE menu.)"
//
// THE PAPER IS THE PREVIEW. Margins and line spacing write CSS custom
// properties onto the live sheet, so the change is visible on the writer's own
// page as they choose it — no modal preview, no Apply ceremony, no
// committed-versus-draft state. A decision that is expensive to unmake will
// not be made (RV4's reasoning, which applies to the sheet as much as to the
// voice). Numbers/headers/footers are STORED but do not paint on screen:
// F6's default is that they are sheet furniture for print and export, and the
// screen page stays continuous. The zone says so on its face rather than
// leaving a writer to wonder why a number never appeared.
```

## CascadePanels §6

From `apps/desktop/src/components/CascadePanels.tsx`, line 340 at `e2898deb` (the comment that stays: "the export note sits behind a "?" beside the heading").

```ts
        {/* ITEM word-diet (Nick, Oct 13) — the export note moves behind a
            "?", one plain sentence, beside the heading rather than always
            standing below the rows. */}
```

## CascadePanels §7

From `apps/desktop/src/components/CascadePanels.tsx`, line 450 at `e2898deb` (no comment stays: the code reads plainly).

```ts
// ITEM 163 — RETIRED IN FAVOUR OF ONE READER. This returned the drawer name
// BARE, which is the defect Nick read as a subtitle; `drawerCaptionFor` below
// already returned the ruled "in <drawer>" form for the zone caption. Two
// spellings of one fact, one right and one wrong. Both now call `boardDrawerLine`
// (store/pageHome.ts) — 131(a)'s shape, fix the class.
```

## CascadePanels §8

From `apps/desktop/src/components/CascadePanels.tsx`, line 456 at `e2898deb` (the comment that stays: "computed from the PAGE alone, independent of `project`: a loose page can own a plan board and be pinned to boards").

```ts
// PW1 S1 + Fable's ruling 2 — computed from the PAGE ALONE, deliberately
// independent of `project`. A loose page can own a plan board (minted with
// `projectId: null`) and can be pinned to boards; hiding its real connections
// behind creation doors because it has no drawer yet would answer a question
// the writer did not ask with doors they did not need.
```

## CascadePanels §9

From `apps/desktop/src/components/CascadePanels.tsx`, line 485 at `e2898deb` (the comment that stays: "the Plan panel reopens on the board last opened from this page, resolved only when the category opens (so `‹` back to the list stays put) and re-validated against the live connections").

```ts
// PW1 S5 — STICKINESS (Nick, Q6: YES). The Plan panel reopens on the board
// whose contents were last open, PER PAGE. Not a configured relationship — the
// machine declining to forget, restoring only what the writer THEMSELVES
// opened. Second and later visits cost two presses instead of three.
//
// Resolved at the moment the category OPENS (Cascade.tsx's own toggle), which
// is what makes it stick without fighting the writer: pressing the survey's `‹`
// walks back to the list and STAYS there, because nothing re-resolves until the
// panel is opened afresh. The `‹` is always the way back to the list.
//
// The remembered board is re-validated against the LIVE connection set every
// time, so a board that was deleted, or unpinned from this page since, simply
// does not restore — a stale id can never become a survey onto nothing (G3).
```

## CascadePanels §10

From `apps/desktop/src/components/CascadePanels.tsx`, line 510 at `e2898deb` (the comment that stays: "one act per row: a press opens the board's contents; a double-click travels, and `Open the board` in the row's `⋯` is that gesture's keyboard twin").

```ts
// PW1 S1/S2 — one board row. ONE ACT PER ROW (PP4): a press opens that board's
// contents and does nothing else. Double-click TRAVELS to the board (Nick, Q4),
// and — PW22, the twin law — that gesture is never the only path: `Open the
// board` rides the same `⋯` the row already carries, so the keyboard and the
// unfamiliar hand keep a way in. The preceding single click merely opens the
// survey, which the travel then supersedes; nothing is lost either way.
```

## CascadePanels §11

From `apps/desktop/src/components/CascadePanels.tsx`, line 545 at `e2898deb` (the comment that stays: "the connections are computed before the no-project fork so both branches render them; no connections means no zone at all, never an empty one").

```ts
  // CD2 build call (flag at review): a page with no project yet has no
  // board/plan to open — "Create a Board"/"Plot a Story" both promote the
  // page into a fresh project first, reusing JournalEntry.tsx's own
  // existing "grow a plan from any unplanned page" doorway
  // (createQuickSprintProject) verbatim rather than inventing a second
  // promotion path; "Open…" has nothing to survey yet, so it's simply
  // absent (not greyed — M1's own "no plan to project" silent-degrade law,
  // reused here for "no project to plan").
  // PW1 S1 — the connections, computed BEFORE the no-project fork so both
  // branches can render them (Fable's ruling 2). ABSENT, NEVER EMPTY (PW9;
  // G3): no connections → the zone does not render at all. Not a zone
  // containing "No boards yet." — nothing announces a capability the writer
  // has not reached for; the zone arrives the moment they pin, because THEY
  // pinned. `cascadePlanEmpty` retires from this path with it.
```

## CascadePanels §12

From `apps/desktop/src/components/CascadePanels.tsx`, line 572 at `e2898deb` (the comment that stays: "the heading's uppercase is CSS; the lexicon term carries sentence case; here the nouns mean GO, so no verb heading").

```ts
      {/* The engraved heading. Presentation uppercase rides the zone register
          in CSS; the LEXICON term carries Nick's own sentence case (Q2). No
          verb heading — here the nouns mean GO, and the writer's learned
          grammar is already right (PW1; PP1 applied, opposite output). */}
```

## CascadePanels §13

From `apps/desktop/src/components/CascadePanels.tsx`, line 577 at `e2898deb` (the comment that stays: "the drawer is the zone's caption, not a row (an inert row among pressable ones is forbidden); not pressable until a drawer has a surface of its own, when it becomes the door to it").

```ts
      {/* PW2 S2 (item 128, ruling A + Fable's refinement) — THE DRAWER IS THE
          ZONE'S CAPTION, NOT A ROW. On a board, this zone names its drawer as
          well as its parent boards; making the drawer a ROW would have meant
          an INERT row sitting among pressable ones, which PP4 forbids. As a
          caption nothing is inert and the rule holds as written.

          IT IS NOT PRESSABLE, AND THAT IS G3, NOT AN OVERSIGHT: a drawer has
          no surface of its own yet, and a door onto a surface that does not
          exist is exactly the destination-blind gesture item 118's unlink and
          item 133 were both about. Routing it to the all-drawers list was
          considered and REFUSED for the same reason — landing on a list of
          every drawer does not answer "show me this one".

          ⚠ SUCCESSOR, RECORDED HERE SO IT IS ADDED DELIBERATELY RATHER THAN
          DISCOVERED MISSING: the day the drawer's own surface ships, this
          caption becomes the door to it. */}
```

## CascadePanels §14

From `apps/desktop/src/components/CascadePanels.tsx`, line 601 at `e2898deb` (the comment that stays: "the Boards tab mirrors the Pages pop-out (SectionsPopout in boards mode); the connected-boards zone stays here as a bridge, and is absent when there is nothing to show").

```ts
  // BIG PROJECTS step 2 - THE BOARDS TAB. The panel is the Pages pop-out's mirror (components/SectionsPopout.tsx, boards mode): where you are, New Board, the place's
  // boards in the writer's own order, New set, and PRESETS (the deck library). The creation doors this panel carried - Create a Board, Plot a Story - and the "file this
  // page to a drawer first" lead are GONE: a board is filed into wherever the writer is (nothing is homeless), and the presets are the decks.
  //
  // THE ZONE STAYS, AS A BRIDGE: "Boards grafted" (the boards THIS page is connected to, PW1) keeps its rows and its stickiness here until step 3 gives it its home in
  // Grafts ("Connected to [page]"), where it becomes the Boards group. It is absent when there is nothing to show, as it always was.
  //
  // PARKED so the retirement is legible (A4) - this panel used to end with two action buttons (create a board, plot a story) and, when nothing was connected, the lead
  // sentence telling a page with no drawer to file itself first. The lexicon keeps those terms; nothing renders them now.
```

## CascadePanels §15

From `apps/desktop/src/components/CascadePanels.tsx`, line 616 at `e2898deb` (the comment that stays: "Per-board quiet disclosure: Move (AddToSheet's Move/Copy grammar) and Delete (one plain confirm; destructive colour only inside it)").

```ts
// Per-board quiet disclosure: Move (AddToSheet, the SAME Move/Copy grammar
// PageFace's own verb already uses) + Delete (T4's ruling — one plain
// confirm, then gone; destructive color ONLY inside the confirm).
```

## CascadePanels §16

From `apps/desktop/src/components/CascadePanels.tsx`, line 632 at `e2898deb` (the comment that stays: "the `drawers` category is the place switcher (PlaceSwitcher.tsx); boards are listed by the Boards pop-out, and every row carries data-link-entry for the connector").

```ts
// ---------------------------------------------------------------------------
// Drawers (B2 S7, A17's chrome) — a large-tile cascade panel, never a new
// route or full-screen surface (the anti-file-manager rule binds). Grouping
// is DERIVED, never authored: a project's cluster IS Nick's "drawer," from
// projectId alone (zero new entities — this reuses the SAME `Project`
// storage row the pre-existing Drawer-entity tree does NOT touch; that
// older, separate `/drawers` full-browse surface and its own `Drawer` row
// — Drawers D1, unrelated ontology — are untouched by this ticket, see the
// build report). The Shelf renders as the FIRST tile (T4's proposal);
// loose docs reuse T3's own derivation (getShelfEntries — "one definition,
// two consumers," the Shelf Board's own reconcile being the other). Every
// OTHER system board keeps its own separate door (Journal/Trash/Shelf all
// still have their own strip categories) — only the Shelf ALSO earns a
// tile here.
// ---------------------------------------------------------------------------
// BIG PROJECTS 1a - the `drawers` category is the PLACE SWITCHER now (components/PlaceSwitcher.tsx): Drawers, Journals, + New Drawer. The tiles
// that used to stand here (every board of every Drawer, the Shelf door) retire with it; boards are listed by the Boards pop-out (step 2), and
// every row carries data-link-entry so the connector can still land on it.
```

## CascadePanels §17

From `apps/desktop/src/components/CascadePanels.tsx`, line 687 at `e2898deb` (the comment that stays: "the Cast row exists only under Machina: the stored value is kept across themes but means nothing outside it").

```ts
      {/* MACHINA CAST (Fable's ruling: ONE Controls row, "Cast: Cool | Neutral"; the foundations' two temperaments of the one theme). Present only under Machina - the stored
          value is kept across themes but means nothing outside it (the leak law, store/themeCast.ts), so no other theme draws the row. */}
```

## CascadePanels §18

From `apps/desktop/src/components/CascadePanels.tsx`, line 750 at `e2898deb` (the comment that stays: "a card's title and excerpt are plain text").

```ts
// item 210: a card's title and excerpt are plain text
```

## CascadePanels §19

From `apps/desktop/src/components/CascadePanels.tsx`, line 769 at `e2898deb` (the comment that stays: "a board's own cards (connections and board-meta filtered out); a page-pin travels to its page, any other card to the board itself").

```ts
  // PW1 S1/PW3 — THE `'plan'` BRANCH RETIRES. It surveyed
  // `getBinderPages(projectId)` — every board in this page's DRAWER — which is
  // the wrong subject (co-location, not connection) and the exact defect this
  // slice exists to correct. The board list is now the PANEL (PlanPanel's own
  // "Boards connected" zone), so this layer is reached directly from a board
  // row one layer up and nothing opens a board LIST survey any more. Its
  // `renderMenu` moves with it: BoardRowMenu now rides the panel's board rows,
  // where it gained `Open the board` as the double-click's twin (PW22).
  // PARKED, quoted verbatim (A4) — the successor is PlanPanel above:
  //   if (kind.category === 'plan') {
  //     const boards = getBinderPages(kind.projectId).filter((p) => p.pageType === 'board').sort(byRecent);
  //     const items: SurveyItem[] = boards.map((e) => ({ id: e.id, title: boardTitle(e) }));
  //     return {
  //       title: deskTerm('stripPlan'),
  //       items,
  //       onTravel: (id) => {
  //         const b = boards.find((x) => x.id === id);
  //         if (b) ctx.openSurvey({ category: 'plan-board', projectId: kind.projectId, boardId: id, boardTitle: boardTitle(b) });
  //       },
  //       renderMenu: (item) => <BoardRowMenu id={item.id} />,
  //     };
  //   }
  // 'plan-board' — one board's own cards (S1: "large thumbnails — title
  // plus a two-line excerpt... with a quiet back affordance to the board
  // list"). Connections are hairlines, not cards — filtered out here, the
  // same discipline BoardEditor.tsx applies when it separates them from the
  // positioned-card render loop. A page-pin card travels to its own page; a
  // plain text/ink card travels to the board itself (nothing else to open),
  // so the board stays reachable from the survey exactly as the old
  // board-list click used to be, just one layer further in.
```

## CascadePanels §20

From `apps/desktop/src/components/CascadePanels.tsx`, line 801 at `e2898deb` (the comment that stays: "the board's own reading order, y then x - the arrangement the writer authored, never the boxes array's creation order").

```ts
  // PW1 S2, Q14 — THE BOARD'S OWN READING ORDER. Sort by `y`, THEN `x`: the
  // arrangement the writer authored, read the way a page is read. What shipped
  // before was the boxes ARRAY's order — creation order — and Fable's words on
  // it bind: "an order nobody chose is an order nobody can rely on." This rail
  // is a FOURTH display of a container and may not contradict the other three.
```

## CascadePanels §21

From `apps/desktop/src/components/CascadePanels.tsx`, line 808 at `e2898deb` (the comment that stays: "two sections: the board's own cards, then the pages linked to it (a page-pin is a membership, so it reads under its own heading)").

```ts
  // PW1 S2, Q4 — TWO SECTIONS. The board's own Cards first (board-owned
  // content), then the Pages linked to this board beneath them, with page
  // titles. A page-pin is a MEMBERSHIP (item 125), which is why it reads under
  // its own heading rather than as one more card in the pile.
```

## CascadePanels §22

From `apps/desktop/src/components/CascadePanels.tsx`, line 814 at `e2898deb` (the comment that stays: "memberships split into two labelled sections, boards and pages, so the kind reads at a glance without a badge on every row").

```ts
  // PW2 S2 AMENDMENT (Nick, verbatim: "group them together but section off
  // Boards from Pages clearly and use a different thumbnail") — the memberships
  // split into two LABELLED sections under one heading. A nested board is still
  // a membership exactly as a page is (125 unchanged); what changes is that the
  // writer can see at a glance which kind they are looking at, without reading
  // a badge on every row.
```

## CascadePanels §23

From `apps/desktop/src/components/CascadePanels.tsx`, line 903 at `e2898deb` (the comment that stays: "only membership rows drag, and the payload names the board and the box, so a canvas refuses a row from another board's survey (that would be card transfer, not display)").

```ts
    // PW1 S3 — the DRAG half (Nick, Q4): drag a membership row onto the canvas
    // and it lands WHERE DROPPED. Only membership rows are draggable (a card is
    // already on the wall), and the payload names BOTH the board and the box so
    // the canvas can refuse a drop from some OTHER board's survey — moving a
    // card between boards is card transfer (item 123), not display, and this
    // act must not quietly become it.
```

## CascadePanels §24

From `apps/desktop/src/components/CascadePanels.tsx`, line 922 at `e2898deb` (the comment that stays: "a per-kind menu: a free or text card offers `Copy to <board>…`; a page-pin or board-card is a membership and offers no copy verb; copiedFromLine names the board a copy came from").

```ts
// PW2 S3 (item 123) — CARD TRANSFER's menu, on the row it belongs to.
//
// THE VERBS TEACH THE KIND (CA1), and the canon does the sorting — which is
// why this is a per-kind decision and not one verb with a disabled state:
//   free / text card → `Copy to <board>…`  — board-owned CONTENT; a copy is a
//                                            new card owned where it lands
//   page-pin         → no copy verb        — MEMBERSHIP, not content. "Copying"
//                                            it is just a second membership,
//                                            which the Places checkbox makes
//   board-card       → no copy verb        — membership too
// An absent verb says "this is not that kind of thing" more cleanly than a
// greyed one, and PP4 holds: a quiet disclosure is not a competing act.
// PW2 S3 — the lineage line for a copied card, or undefined for one that was
// authored here. `sourceEntryId` names the board it came FROM.
```

## CascadePanels §25

From `apps/desktop/src/components/CascadePanels.tsx`, line 937 at `e2898deb` (the comment that stays: "reads copiedFromBoardId only, as text: no travel from this line").

```ts
  // Reads `copiedFromBoardId`, never the mirror fields — TEXT ONLY, no travel
  // from this line in PW2; a door here is a later refinement (ruled).
```

## CascadePanels §26

From `apps/desktop/src/components/CascadePanels.tsx`, line 967 at `e2898deb` (the comment that stays: "the copy note sits behind a "?" beside the sheet's title").

```ts
          // ITEM word-diet (Nick, Oct 13) — the copy-note moves behind a
          // "?", one plain sentence, beside the sheet's own title.
```

## CascadePanels §27

From `apps/desktop/src/components/CascadePanels.tsx`, line 978 at `e2898deb` (the comment that stays: "the menu half of the two display acts: it moves an existing membership on and off the canvas, so there is no unlink here and hiding never removes the member").

```ts
// PW1 S3 (item 125) — the two display acts, menu half (Nick, Q4). Membership is
// made elsewhere (the Places checkbox); this only ever moves an EXISTING
// membership on and off the canvas, which is why there is no "unlink" here and
// why removing display never removes the member.
```

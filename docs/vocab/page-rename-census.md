# "Page" → "Pages" rename census (Arbor only)

Nick's ruling, verbatim: "In Arbor, 'Page' as the name of the writer's document
becomes 'Pages' (singular use too, as a document name). Examples: the rail
label, New Page, Page Kind, 'From a page'. Where 'page' means the physical
sheet or surface (Page Scroll, page edge or break, page numbers), it stays.
Flux keeps Doc / Docs."

**No strings are changed in this commit.** This is the sort Fable asked for,
before anything is touched: every literal occurrence of "page"/"Page" in the
VALUES of `themeLexicon.ts` and `deskLexicon.ts` (not in term-id names, not in
code comments), bucketed, with a proposed rewrite wherever (c) applies. Found
by grepping the live source directly (both single- and double-quoted string
literals), not by re-reading `docs/vocab/label-census.md` — that file is
already slightly stale against today's `deskLexicon.ts` (it does not list
`railPageKind`, added since), so this list is built from disk.

**Buckets**
- **(a) Document name** — "Page" names the writer's document (or a thing
  that refers to one: a button, a section, a kind, a count). Becomes "Pages"
  (or is already compliant — several Arbor strings already say "pages" in a
  natural plural and need no change at all).
- **(b) Physical page** — "page" means the sheet/surface/position (margins,
  numbers, scroll, a book's front matter, "page one" as a position). Stays,
  per Nick's own examples.
- **(c) Needs a reword** — the sentence breaks grammatically under a bare
  swap (mostly "a page" / "this page" constructions — English doesn't let an
  indefinite or demonstrative article sit in front of a plural-looking proper
  noun the way it can in front of an ordinary singular noun). Each row below
  carries my own proposed rewrite; none of these are applied here.

Term ids are given exactly as they appear in `deskLexicon.ts`/`themeLexicon.ts`.

## 1. themeLexicon.ts

| Term id | Current Arbor value | Bucket | Proposed |
|---|---|---|---|
| `page` | `{ one: 'Page', many: 'Pages' }` | (a) | `{ one: 'Pages', many: 'Pages' }` — the master term; both forms collapse to the one word, per "singular use too." Flux's own `{ one: 'Doc', many: 'Docs' }` is untouched. |

## 2. deskLexicon.ts — (a) document name, straightforward

| Term id | Current value | Proposed |
|---|---|---|
| `boardPageDoor` | `Page` | `Pages` |
| `zoneStage` | `Page` | `Pages` |
| `drawerPage` | `Page` | `Pages` *(this is "the rail label" from Nick's own examples — Strip.tsx's section header)* |
| `beginNewPageCard` | `New Page Card` | `New Pages Card` |
| `cascadePageNewPage` | `New Page` | `New Pages` *(Nick's own "New Page" example)* |
| `cascadeJournalNewPage` | `New page` | `New pages` |
| `railPageKind` | `Page kind` | `Pages kind` *(Nick's own "Page Kind" example — note: the FLUX side of this exact term is separately becoming "Doc Type" per the flux-words ticket; this row is Arbor only)* |
| `boardNewPageCard` | `New page card` | `New pages card` |
| `boardCanvasEmpty` | `Nothing here yet — Add card, or New page card, from the tools.` | `Nothing here yet — Add card, or New pages card, from the tools.` |
| `boardAddExistingPage` | `Existing page…` | `Existing pages…` |

## 2a. deskLexicon.ts — (a) document name, ALREADY COMPLIANT (no change needed)

These already read as a natural plural ("pages", not "a page"/"this page"), so
the ruling is already satisfied — listed for the audit trail, not because
anything needs editing.

| Term id | Current value |
|---|---|
| `cascadeJournalAll` | `All pages →` |
| `cascadePlanSectionPages` | `Pages` |
| `tutorDisclosureBody` (v1, dead — see §4) | `...your pages stay yours.` |
| `syncPullShort` | `Your account sent {pulled} pages but {live} are showing — reload to try again` |
| `openPagesHeading` | `Open Pages` |
| `openPagesSort` | `Sort Pages` |
| `placePageEmpty` | `No pages yet.` |

## 3. deskLexicon.ts — (b) physical page, stays unchanged

| Term id | Current value | Why physical |
|---|---|---|
| `pageSetupHeading` | `Page setup` | margins/numbers/headers/footers — the sheet's own layout |
| `pageSetupNumbers` | `Page numbers` | Nick's own example |
| `pageSetupSaveDefaults` | `Set as my default page settings` | same page-setup cluster |
| `pageSetupExportNote` | `Numbers, headers and footers appear on export and print — the page on screen stays continuous.` | the simulated paper sheet |
| `twPageScroll` | `Page Scroll` | Nick's own example |
| `templateTitlePage` | `Title page` | a manuscript's physical front-matter sheet, not a Wrizo document |
| `tutorDraftStretchNeedsSelection` | `Select a stretch on the page first` | spatial — "on" the visible sheet |
| `deckWorldbuildingHistoryBody` | `What happened long before page one that still shapes it?` | "page one" = a position in the manuscript, like "page numbers" |

## 4. deskLexicon.ts — (c) needs a reword

The recurring snag: "a page" / "this page" / "the page's" put an
indefinite/demonstrative/possessive article directly on a word that's
becoming a plural-looking proper noun ("a Pages", "this Pages's", "Pages
isn't") — none of those parse as English. Each proposal below either (i)
drops the article and keeps "Pages" bare, (ii) swaps in a neutral word
("one"/"document") to dodge the grammar, or (iii) leaves it unchanged where
rewording seems to cost more clarity than it buys. Fable/Nick's call on which
of these actually reads right — I'm not confident in several of them.

| Term id | Current value | Proposed | Note |
|---|---|---|---|
| `boardPairWithPage` | `Pair with a page…` | `Pair with Pages…` *(or: `Pair with one…`)* | board's pairing door |
| `beginConnectPage` | `Graft a Page` | `Graft Pages` | empty-board door; sibling of `beginNewPageCard` which already has no article |
| `boardPortedBadge` | `From a page` | `From Pages` | this is Nick's own 4th example; a small card badge, brevity matters |
| `pageEscHint` | `Press Escape to leave the page` | `Press Escape to leave the Pages` *(low confidence — may just read fine, or may not)* | screen-reader-only, never drawn visibly; lowest stakes of this whole list |
| `boardTelos` | `The plan serves the page.` | `The plan serves the Pages.` *(low confidence)* | one static chrome line atop the board |
| `inkInstrument` | `The page's instrument` | `The Pages' instrument` *(possessive of a word already ending "s")* | Ink-wave switch naming Text vs Ink |
| `cascadePlanNoProject` | `File this page to a drawer first to plan around it.` | `File this document to a drawer first to plan around it.` *(swaps the noun rather than forcing "Pages" after "this")* | — |
| `tutorConversationUnborn` | `Write a word first — this page isn't saved yet, so nothing was sent.` | `Write a word first — this hasn't saved yet, so nothing was sent.` *(drops the noun entirely)* | shown when the page has no first word yet |
| `placesHomeHeading` | `This page lives in…` | `This page lives in…` *(recommend: leave unchanged)* | "This Pages lives/live in…" breaks verb agreement either way I tried it |
| `cascadePlanJustAPage` | `Just need a page? New Page is in the Page section.` | `Just need one? New Pages is in the Pages section.` | three sub-issues in one sentence; "need one?" dodges the only real snag, the other two match the plain (a) rows above |
| `structureKindLabel` | `This page is` | `This page is` *(recommend: leave unchanged)* | heading directly above the Normal/Screenplay/Research picker; "This Pages is" reads broken |
| `structureActLabel` | `Change the page itself` | `Change the page itself` *(recommend: leave unchanged)* | "Change the Pages itself/themselves" has a number mismatch either way |
| `openPagesMore` | `More for this Page` | `More for this one` | dodges "this Page/Pages"; sits beside `openPagesHeading`/`openPagesSort`, already both "Pages" |
| `placesBoardsZoneLabel` | `Boards this page can join` | `Boards this Pages can join` *(or: `Boards this one can join`)* | zone label header |
| `publishDownloadPageMd` | `This Page (.md)` | `This Pages (.md)` *(low confidence — breaks parallelism with the sibling row `publishDownloadBinder` = "This Binder", which stays singular since it isn't being renamed)* | download menu row |
| `publishDownloadPageTxt` | `This Page (.txt)` | `This Pages (.txt)` *(same parallelism note as above)* | download menu row |
| `tutorDisclosureBodyV2` | `...any new writing on this page since the Tutor last read it...travels...Your pages remain yours.` | `...any new writing you've made since the Tutor last read it...travels...Your pages remain yours.` *(drops "this page", keeps the already-compliant "Your pages")* | version history — see §4 note below on whether this is even live |

### A note on which of these are actually rendered

Per `docs/vocab/label-census.md`, `tutorDisclosureBody` (v1) and
`tutorDisclosureBodyV2`/`V3` are **superseded in render by v4** —
`tutorDisclosureBodyV4` is the one Nick's writers actually see. I still
listed V1–V3 above/below for completeness (every occurrence, as asked), but
would not touch dead history for this — only V4 carries real stakes.

| Term id | Current value | Proposed | Note |
|---|---|---|---|
| `tutorDisclosureBodyV4` (**live**) | `Nothing leaves your desk unasked: an ask sends your words, this page's recent changes, and your Bible; a counsel that reads more names it on the button and sends only that, only then.` | `Nothing leaves your desk unasked: an ask sends your words, your recent writing, and your Bible; a counsel that reads more names it on the button and sends only that, only then.` | this is live, trust-sensitive disclosure copy — flagging for Nick directly rather than guessing confidently; "this page's" → "your recent writing" drops the noun rather than forcing a possessive onto "Pages" |
| `tutorDisclosureBodyV3` (dead) | `...any new writing on this page since the Tutor last read it...travels...Your pages remain yours.` | *(no change — dead, not rendered)* | superseded by v4 |

## 5. A related finding, not part of this ruling

Flux's own existing override for `beginConnectPage` already reads `'Link a
Page'` — a literal "Page" inside FLUX's vocabulary, which is supposed to say
Doc/Docs, not Page. This predates both this ruling and flux-words; flagging
it rather than touching it, since Nick's ruling here is scoped to Arbor and
I don't want to fold an unrelated fix into either ticket's branch.

## Summary counts

- (a) document name, needs a word swap: 10
- (a) document name, already compliant: 7
- (b) physical page, stays: 8
- (c) needs a reword, proposal given: 15 (2 of which I'd lead with "leave
  unchanged")
- themeLexicon's own `page` term: 1 (the master; everything above assumes
  this one changes)

40 value occurrences total across both files (39 Arbor/CANONICAL strings +
the 1 themeLexicon term), plus the 1 pre-existing Flux-side inconsistency
noted in §5.

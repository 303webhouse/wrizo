# B2 (v2) — the Shelf, the Drawers, and the Places · build brief · 2026-07-20

**SUPERSEDES b2-shelf-and-drawers-brief.md (v1).** Reconcile any
in-flight v1 work per the FX6 recovery discipline: preserve WIP,
carry forward what still matches (S1–S3 below are v1's Shelf slices
unchanged in substance), rebuild the rest to this text. Branch,
zero-schema expectation, STOP-and-report, per-slice commits,
pre-authorized merge, and Fable's post-merge review all stand as v1
stated.

## Architects' record (the consult behind the revisions)
Nick's sketch (2026-07-20): the Page pop-out offers kinds of pages
(New Journal Entry, New Page, Add Page) with toggled lists of
drawers and New Drawer; pages join locations by checkbox — a
journal page shows Journal checked, plus checkable boards/drawers.
Architects' rulings: (1) the checkbox panel is TWO ZONES — Boards
as true many-of checkboxes (pin/unpin), HOME as single-select
(Journal / a Drawer / Loose) because the one-home law (A16, R2's
dress) is stored truth; changing home is the real filing act and
carries its existing one-shot confirmation; no checkbox ever
deletes. (2) DRAWER SUBSUMES PROJECT IN CHROME — storage keeps
projectId (zero schema); the writer-facing word "Project" retires
app-wide in favor of "Drawer"; "New Drawer" creates what storage
calls a project. B3's future wizard seeds "the plan board in your
drawer." PENDING NICK'S ONE-WORD CONFIRM — build S6's swap last;
STOP before it if his word hasn't arrived. (3) Journal Board
membership pinned: origin 'journal' AND no project home; filing
removes from the Journal Board; origin (provenance) never changes;
new journal entries appear with no sorting, ever. (4) "Add Page"
read as: the Board's Add flow gains an existing-page picker; the
Page pop-out stays creation + Places. Nick may flip by one line.

## T3 — the Shelf's law (unchanged from v1, Nick-ratified)
A page belongs on the Shelf iff ALL hold: not deleted; not a system
board; no project home; not journal-homed; zero user-board pins.
Starring is irrelevant. Pinning anywhere removes it at next
reconcile.

## S0 — records first
Ledger: open/annotate B2 as v2-superseded; record Nick's Shelf
ratification and his sketch verbatim; record the Architects'
rulings above; note the two pending one-word gates (the Drawer
word swap; "Add Page" reading). Commit this brief beside v1 (v1
stays on disk as record; this file is the build's text).

## S1 — the third system Board (v1 S1 verbatim)
systemKind 'shelf'; every B1 system-board law by the same code
paths: idempotent find-or-create, origin 'system', derived
membership per T3, authored arrangement sacred, Add structurally
absent, Delete inert, Move/Copy/Pin inert on its own face (Port
live), excluded from resume/pin-leaves/self-carding, way-back
non-participation, backTo '/'. Idempotence proven the B1 way.

## S2 — the Shelf works for its living (v1 S2 verbatim)
Shelf card selection adds **Pin to a Board** (existing sheet);
pinning removes it at next reconcile. Empty state: one quiet fact.

## S3 — the `shelved` flag retires (v1 S3 verbatim)
All UI reads/writes retire; any manual Shelve verb retires; column
dormant; effect audited honestly in the report.

## S4 — the Places panel (the two-zone checkbox truth)
On every page's Page category pop-out, a **Places** section:
- **Home zone (single-select):** Journal / [the drawer list] /
  Loose — the current home shown selected as fact. Selecting a
  different home performs the EXISTING filing/move act (same store
  paths, same one-shot confirmation the Moves verb carries today —
  this panel is that verb's successor). Selecting Loose un-files
  (page heads to the Shelf by T3). A journal-born page filed to a
  drawer leaves the Journal Board (S7's derivation); its origin
  never changes. **New Drawer** appears inline at the list's foot:
  create-and-file in one act (creates a project in storage).
- **Boards zone (true checkboxes):** every board the page COULD
  join (its drawer's boards + any-drawer boards per existing pin
  law), current pins checked. Check = pinPageToBoard; uncheck =
  remove that board's card (the page, never). System boards never
  listed. No count, no badge.
The old "Add to..." Moves flow is SUPERSEDED by this panel — its
UI retires; its store paths are exactly what Places calls; its
harness checks park at A4 (quoted, live successors here).

## S5 — the Page pop-out roster
The cascade's Page section reorders to: **New Journal Entry** (the
Catch path's own creation — journal-origin, appears on the Journal
Board unbidden), **New Page** (FX6's loose door, unchanged), then
**Places** (S4) for the page underfoot. The Board's Add flow gains
**Existing page…** beside FX6's New page card: a quiet picker
(reuse the Pin sheet's leaf pattern) that pins a chosen page —
membership, never filing. deskLexicon for every label.

## S6 — the word swap (GATED on Nick's confirm)
"Project" retires from all writer-facing chrome; "Drawer" replaces
it everywhere (labels, empty states, the truthful membership line's
phrasing where it names a project home, the Drawers panel's
grouping headers). Storage identifiers untouched. BUILD THIS SLICE
LAST; if Nick's confirming word has not arrived, STOP and report
with the swap staged but uncommitted.

## S7 — derivations pinned + the Drawers panel (v1 S4, amended)
Journal Board derivation updated to the pinned law: origin
'journal' AND projectId null. The Drawers panel as v1 S4 specified
(cascade section C relabeled "Drawers"; derived grouping — a
drawer's cluster IS its boards; Shelf as first tile; loose docs via
T3's derivation reused; last-opened anchored; quiet tiles, no
counts/badges/timestamps; anti-file-manager rule binding; tile tap
travels; miniature previews a named future refinement).

## S8 — harness (b2.mjs)
Everything v1 S5 listed (T3 truth table incl. starred-irrelevant;
idempotence; authored-position survival; the Pin-to-a-Board round
trip; inherited inertness via shared checks; shelved retirement
both directions; Drawers roster/grouping/anchor/quiet-DOM; lexicon
discipline; 1280/2200 + 1099 floor; legacy byte-identical) PLUS:
the Places panel's two-zone truth (home single-select reflects and
performs filing with the one-shot confirmation intact; a
journal-born page filed away leaves the Journal Board and returns
on un-filing to Loose→Shelf per T3; board checkboxes round-trip
pin/unpin with the page's stored truth byte-identical throughout —
the A16 assert on every Places action); the superseded Moves flow
unreachable (parks quoted, successors named); the Existing-page
picker pins without filing (origin/projectId untouched, asserted);
the pop-out roster order; S6's swap asserted ONLY once Nick's word
lands (a parked-armed check until then, per the cd2.1 discipline).
Trusted-event discipline per pointer claim. Full suite green, both
HARNESS_PARKED settings.

## Non-goals
Miniature live previews; manual shelve verbs; Drawer as a NEW
stored entity (it IS the project row, renamed in chrome only);
B3's wizard; V1/TS1/C1 (second sitting still awaits Nick's
ratification); the threshold; anything schema.

## Invariants
Zero schema. A16 verbatim on every Places action — checkboxes
write membership; only the home zone's explicit act writes
projectId; nothing writes origin, ever. Anti-solicitation; olive/
orange lanes; square corners (the pin circle's lone exception);
deskLexicon; copy-out Publish-only; legacy <1100 byte-identical;
both widths + floor; report = push.

## Definition of done
Nick, after redeploy: opens the Page pop-out and finds New Journal
Entry, New Page, and Places; sees Journal checked on a journal
page as plain fact; checks two boards and finds his card on both;
files the page into a drawer from the same panel and watches
Journal uncheck itself and the page leave the Journal Board;
un-files to Loose and finds it waiting on the Shelf; creates a
drawer inline without leaving the panel; adds an EXISTING page to
a board from the board's own Add flow and confirms its home never
moved; opens Drawers and sees his clusters under their names,
last-opened anchored; and — once his word lands — never sees the
word "Project" anywhere on the desk again.

— Fable, from Nick's sketch and the Architects' consult, 2026-07-20

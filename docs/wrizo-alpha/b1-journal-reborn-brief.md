# B1 — the Journal Reborn (+ the Trash) · build brief · 2026-07-19

**Branch:** b1-journal-reborn off main. QUEUED — builds after FX6's
post-merge review lands (one brief per ticket; FX6 holds the slot).
Zero schema expected — everything below lives in existing columns
(origin, deletedAt, pageType) and the boxes array; STOP-and-report
the moment any slice wants a column. Merge pre-authorized
(zero-schema rule); Fable reviews post-merge.
**Authority:** the Boards committee pass, ratified by Nick
2026-07-19 — R1–R7 (R2 with his concern on record, resolved on
merits; R6 as modified by his wizard rulings, which belong to B3,
not this ticket), canon amendments A16 (the Arrangement Law), A17
(the Drawer Law), A18 (the Trash Amendment), phases B1–B3
confirmed. Nick's data-preservation waiver is on record: no legacy-
compat shims; dev data is disposable if structure fights.

## The one law this whole ticket serves (A16, restated)
The Board is the only arrangement surface. On a SYSTEM Board the
system decides WHAT is present (derived membership); the writer
decides WHERE it sits (authored arrangement). Arrangement never
alters stored truth: origin, projectId, deletedAt, and homes are
written only by the real acts that own them.

## S0 — records first
Ledger: open B1's item; record the full ratification block (R1–R7
as ruled, R2's exchange summarized, R6's wizard rulings verbatim —
B3 material; A16/A17/A18 RATIFIED; B1–B3 confirmed). Commit
boards-committee-pass.md to docs/wrizo-alpha/ (Nick supplies the
file). Commit this brief.

## S1 — system Boards exist (the mechanism)
A system Board is a REAL board page (pageType 'board'), created
find-or-create idempotently on first approach, marked by a new
optional field on the existing 'board-meta' element in its own
boxes: systemKind: 'journal' | 'trash' (the FX4 board-meta
precedent — additive optional Box fields, zero schema). System
Boards: have no project home; never appear as cards on any system
Board (exclusion asserted); never appear in the Pin sheet's board
leaves (no project → already excluded; assert it anyway); sync
like any page (arrangement persists across devices by the existing
boxes round-trip). Header comment on the systemKind field carries
this paragraph.

## S2 — derived membership (the reconcile)
On mount of a system Board (and on store changes while mounted),
reconcile its cards against the truth:
- JOURNAL BOARD: every journal-origin, non-deleted page has exactly
  one card; qualifying pages missing a card gain one; cards whose
  page no longer qualifies (deleted, or re-homed by a real act)
  leave.
- TRASH BOARD: same rule over deletedAt-bearing pages (any origin).
Cards are the EXISTING page-pin kind (entryId, live title/excerpt,
double-click travels) — reuse, don't fork. New cards auto-place
into open space (a quiet flow; deterministic; no overlap on
arrival); EXISTING cards' authored positions/sizes are never moved
by reconcile. Reconcile is idempotent and cheap (run it twice,
byte-identical boxes).

## S3 — arrange, never author (system-board interactions)
On a system Board the writer may: move, resize, overlap, layer,
thread, and toggle the footer — the full FX5 hand. The writer may
NOT: Add cards (the sliver's Add is absent; Trash's sliver carries
no Add either), hand-delete derived cards (Delete on one is inert
— quiet no-op, harness-asserted), or pin the system Board anywhere.
User Boards are untouched by this slice — fully authored, exactly
as they are today.

## S4 — the Trash, surfaced (A18)
Deletion already soft-deletes (deletedAt); B1 SURFACES it. Every
existing delete path stays quiet and unconfirmed (Delete-is-
Delete's anti-nag core, quoted in A18, holds — no dialogs, no
toasts, no counts, no badges, ever). The Trash Board shows deleted
pages as cards; a selected card offers RESTORE (the FX5 action-row
precedent): restore clears deletedAt — the page returns to its
home and to the Journal Board's derivation if journal-origin.
Permanent purge is OUT of v1 (recoverable means recoverable;
purge gets its own ruling later). Cards/threads deleted on user
boards remain genuinely removed — A18 scopes to Pages, verbatim.

## S5 — the doors re-pointed, the old room retired
Cascade section A: Catch (quick capture) stays byte-identical —
it keeps writing journal-origin pages, which simply appear on the
Journal Board at next reconcile. The section's Journal destination
now travels to the Journal BOARD; the old Journal module surface
(the list/home experience) is RETIRED the same day — routes and
links to it re-point to the Journal Board (retirement-by-
replacement, never a hole). THE PAPER STAYS: JournalEntry as the
untyped-page WRITING surface is untouched — B1 retires the room,
never the page. Open's no-resume fallback re-points to the Journal
Board (HB1 review ruling 5's revisit, landing here). The Trash
entry joins the cascade quietly at the foot of section C —
reachable within the two-action law, never prominent, no count.

## S6 — harness (b1.mjs) + parks
Reconcile correctness: capture → card appears; delete → card moves
Journal→Trash; restore → round-trips home (deletedAt cleared,
Journal card back, arrangement of OTHER cards untouched); reconcile
idempotence (run twice, boxes byte-identical); authored positions
survive reload + re-derivation; system-card Delete inert; no Add on
system slivers; system boards never card themselves or appear in
pin leaves; the Catch flow byte-identical; the fallback re-point;
the retired room genuinely unreachable (old links re-point, no 404
hole); both reference widths + the 1100 floor on any new geometry.
Trusted-gesture discipline applies to any new pointer claim
(restore is a plain button — say so in the check). Park sweep: any
checks asserting the old Journal module surface (list/home
navigation, its links) — A4 discipline, quoted, live successors
against the Journal Board; s1.mjs's dormant resume check and the
w-family fallback assertions re-derived to the new target. Full
suite green, both HARNESS_PARKED settings.

## Non-goals
The Shelf Board and the `shelved` flag's retirement (B2); Drawers
thumbnails + the lexicon sitting (B2, A17's chrome); Projects as
seeded Boards + the wizard + Start Here (B3 — Nick's rulings
recorded, untouched here); hand-removal of system cards (T2,
deferred by the pass); purge; card metadata fields (committee's
second sitting); the threshold (tabled); anything schema.

## Invariants
Zero schema. A16 verbatim: arrangement never alters stored truth.
Origin/homes/provenance written only by their own real acts.
Capture never breaks for a single commit. Anti-solicitation
absolute (no counts, badges, toasts — the Trash is a place, not a
nag). Olive/orange lanes; square corners (the pin circle's
recorded exception stands alone); deskLexicon for every new
string. Copy-out stays Publish-only. Legacy <1100 chrome
byte-identical. Report = push.

## Definition of done
Nick, after redeploy: catches a quick thought and finds it as a
card on the Journal Board without lifting a finger; arranges his
Journal like a wall — moves, overlaps, threads two thoughts —
reloads, and it's exactly where he left it; tries to Add or Delete
on the Journal Board and finds the system politely absent; deletes
a page from anywhere with no dialog and finds it waiting on the
Trash Board; restores it and finds it home again, his arrangement
undisturbed; opens the app cold with nothing to resume and lands
on his Journal Board instead of the old broken room; and never
once sees a badge, a count, or a toast telling him about any of
it.

— Fable, from the ratified Boards pass, 2026-07-19

# B2 — the Shelf and the Drawers · build brief · 2026-07-20

**Branch:** b2-shelf-and-drawers off main (post-B1). Zero schema
expected — the third systemKind, the derivations, and the panel all
live in existing truth (origin, projectId, deletedAt, boxes);
STOP-and-report the moment any slice wants a column. Merge
pre-authorized (zero-schema rule); Fable reviews post-merge.
Incremental per-slice commits from the start (the FX6 practice).
**Authority:** the ratified Boards pass (R1–R7, A16/A17/A18; B2
confirmed) + Nick's waiver (the `shelved` flag RETIRES rather than
being dressed) + his T4 ruling (pending one word — see S0) + the T3
definition below, stated as this brief's own law.

## T3 — the Shelf's law (this brief's ruling)
A page belongs on the Shelf iff ALL hold: not deleted; not a system
board; no project home; not journal-homed; and it appears as a
page-pin card on ZERO user boards (membership is connection).
Starred status is irrelevant — attention is not organization; a
starred loose page stays shelved until it finds a home. A shelved
page that gets pinned anywhere leaves the Shelf at next reconcile.

## S0 — records first
Ledger: open B2; record Nick's deploy word (FX6 + B1, enumerated)
and his T4 ruling verbatim when it arrives (the brief may build on
the proposal — all five names kept, section C relabeled "Drawers,"
Shelf as its first tile — unless his word says otherwise; if it
says otherwise, STOP before chrome and report). Commit this brief.

## S1 — the third system Board
systemKind gains 'shelf' (board-meta, the B1 precedent verbatim).
The Shelf Board inherits EVERY B1 system-board law by the same
code paths, not copies: idempotent find-or-create; origin 'system';
derived membership per T3 with authored arrangement sacred; Add
structurally absent; Delete inert; Move/Copy/Pin inert on its own
face (Port live); excluded from resume, from pin leaves, from
carding itself or other system boards; way-back non-participation;
backTo '/'. Reconcile idempotence proven the B1 way (two mounts,
byte-identical boxes).

## S2 — the Shelf works for its living
On the Shelf Board, selecting a page-pin card adds **Pin to a
Board** to the action row — the existing PinToBoardSheet, entryId =
the card's page, nothing new invented. Pinning it removes it from
the Shelf at the next reconcile (T3 doing its job, felt
immediately). The empty Shelf carries one quiet line ("Nothing
waiting.") — a fact, not a celebration.

## S3 — the `shelved` flag retires (Nick's waiver)
Every UI read and write of the legacy `shelved` flag retires; any
manual "Shelve" verb retires with it (the Shelf is automatic now —
derived, never filed-into). The column stays dormant (we never drop
columns; zero schema). Effect audited honestly in the report:
old-shelved pages that are genuinely unconnected appear on the new
Shelf via T3 anyway; old-shelved pages that are connected correctly
do not — they were already organized. No data is touched, only
readings of it.

## S4 — the Drawers panel (A17's chrome)
Cascade section C becomes **Drawers** (label per T4's ruling): a
large-tile view in the cascade's own panel — never a new route,
never a full-screen surface (the anti-file-manager rule is part of
A17's ratified text and binds here):
- **Grouping is derived, never authored:** user boards cluster
  under their project's name — a project's cluster IS Nick's
  "drawer," from projectId alone, zero new entities. Loose docs
  (the T3 derivation reused — one definition, two consumers) render
  beside them. System boards keep their own doors and stay OUT of
  the tile roster, except the Shelf, which renders as the FIRST
  tile (T4's proposal).
- **Last-opened anchors first** (Nick's word) — the most recently
  opened board or doc renders in the anchor slot at the panel's
  head; ordering beneath is deterministic (project name, then board
  title).
- **Tiles are quiet:** title + a kind mark (board vs doc,
  abstract, non-literal) in the Stacked family's dress — square,
  Plateau tokens, NO counts, NO badges, NO timestamps (facts on
  request, never ambient). Genuine miniature board previews are a
  named future refinement, NOT v1 — say so in a comment where the
  tile renders.
- A tile tap travels (board → the board; doc → its page). The
  desk remains the app's anchor state; the panel dissolves by the
  standing vanish law like every cascade layer.

## S5 — harness (b2.mjs)
The T3 truth table (each disqualifier independently flips
membership — deleted, system, project-homed, journal-homed,
pinned-anywhere; starred proven irrelevant both ways); reconcile
idempotence; authored positions surviving reload + re-derivation;
the Pin-to-a-Board action removing a card at next reconcile (full
round trip); every inherited system-board inertness re-asserted on
the Shelf via the SHARED checks pattern; `shelved` retirement (no
UI read/write reachable; the old-shelved-connected page absent
from the Shelf, the old-shelved-unconnected present); the Drawers
roster (derived grouping correct, anchor-first ordering, Shelf
tile first, system boards otherwise absent, zero
counts/badges/timestamps in the DOM); every new string through
deskLexicon; geometry at 1280/2200 + the 1099 floor; legacy
(<1100) chrome byte-identical — no tile leak, DeskRail roster
unchanged. Trusted-event discipline for any pointer claim,
disclosed per check. Park sweep at A4: any checks asserting the
old shelved-flag UI or section C's compound label — quoted
verbatim, live successors named. Full suite green, both
HARNESS_PARKED settings.

## Non-goals
Miniature live board previews (named future refinement); any
manual shelve/unshelve verb (the Shelf is derived, full stop);
Drawer as a stored entity (grouping is derived — if a real Drawer
entity is ever wanted, that is a committee question); B3's wizard
and seeded Projects (its own brief, Nick's recorded rulings);
V1/TS1/C1 (await the second sitting's ratification); the
threshold (tabled); anything schema.

## Invariants
Zero schema. A16 verbatim — arrangement never alters stored truth;
the Shelf's reconcile writes cards, never origins/homes/flags.
Anti-solicitation absolute (the Drawers panel shows facts, calls
for nothing). Olive/orange lanes; square corners (the pin circle's
lone exception stands); deskLexicon for every string. Copy-out
Publish-only. Legacy <1100 byte-identical. Both widths + the 1099
floor on geometry asserts. Report = push.

## Definition of done
Nick, after redeploy: writes a loose page and finds it waiting on
the Shelf without filing anything; stars it and finds it still
there (attention isn't organization); pins it to a real board from
the Shelf's own action row and watches it leave; opens Drawers and
sees his project's boards clustered under its name — his plot,
his characters, his draft, one drawer — with his last-opened
anchored first and loose docs beside them; taps a tile and
travels; finds no count, badge, or timestamp anywhere; narrows
below the gate and finds legacy chrome untouched; and never once
finds a "Shelve" button, because the Shelf now simply knows.

— Fable, from the ratified Boards pass and Nick's rulings, 2026-07-20

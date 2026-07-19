# The Boards Pass — committee double-pass · organizing architecture · 2026-07-19

**Charter:** Nick's commission of 2026-07-19 (ledger, verbatim block):
Journal retired-and-rebuilt on Page-is-Primary; Journal / Projects /
Shelf reconceived as Boards; Trash as recoverable removal; Drawers as
containers of Boards; the Drawers cascade as large thumbnails with the
last-opened anchoring home. Committee reviews before anything builds.

**The governing constraint, named by Nick in session:** he is blocked
constantly by broken features and bugs; the pass optimizes for a
USABLE desk soonest, not for maximal rearchitecture.

---

## Chamber summaries (double-pass, condensed to findings)

**Experts (the why).** The sketch is the constitution completing
itself. Law 1 says the Page is the primitive; this pass adds its dual:
THE BOARD IS THE ONLY ARRANGEMENT. Journal, Project, Shelf, and Trash
stop being four bespoke container mechanisms (arborescent, striated —
each with its own logic, its own bugs) and become four DRESSES worn by
one surface (smooth space; territories as arrangements, not
structures). The Deleuzian read is unusually clean: pre-built Boards
are territorializations of a single plane — the same move the theme
arc makes with visual identity, now made with structure. The panel
flags no canon violation in the direction itself; the violations would
all live in careless execution (see Opposition).

**Architects (the how — and the fork that decides everything).**
There are two ways to make "Journal is a Board" true:

- *(a) The collapse:* migrate homes/origins/projectId/shelved into
  literal board membership. Honest cost: schema surgery, data
  migration on Nick's live writing, weeks of scaffolding, and the A2
  provenance law rewritten. This is the slow path wearing a fast
  path's clothes.
- *(b) The dress:* homes and origins remain the underlying truth
  (A2 intact, untouched); system Boards are REAL board pages whose
  card sets are DERIVED from that truth (journal-origin pages appear
  as cards on the Journal Board automatically; deletedAt pages on the
  Trash Board; unconnected pages on the Shelf Board), while
  ARRANGEMENT stays authored (positions persist in the board's own
  boxes, the FX5 interactions work). Zero data migration. Nick's
  existing pages appear correctly on day one.

The Architects choose (b) unanimously and name it the **derived-
membership / authored-arrangement rule**: on a system Board, the
system decides WHAT is present; the writer decides WHERE it sits.
Hand-removal of a system card is not deletion — it is the underlying
act it stands for (a Trash card restored, a Journal card re-homed) or
it is quietly unavailable in v1. User Boards remain fully authored,
exactly as built.

**Opposition (marketing, growth, and the skeptical writer).**
Four risks, each with a binding mitigation:
1. *File-manager drift.* Large-thumbnail Drawers could turn the app
   into Finder. Mitigation, binding: thumbnails live only in the
   cascade's reach-range panel; full Boards remain travel
   destinations; the desk (a Page, mounted) remains the anchor state
   of the app. The home Page anchor Nick described is preserved
   exactly because of this rule.
2. *Naming soup.* Board/Drawer/Shelf/Journal all sound like
   containers. Mitigation: a one-sitting writer-facing lexicon pass
   before B2 ships chrome (the D&G naming discipline already on the
   books applies).
3. *Capture homelessness.* Retiring the broken Journal surface must
   never orphan quick capture for a single day. Mitigation, binding:
   the catch flow keeps writing journal-origin pages unchanged; only
   the broken SURFACE retires, replaced in the same build by the
   Journal Board (retirement-by-replacement, never retirement-by-
   hole). This also beats bug-by-bug triage of the old Journal for
   speed — the panel explicitly endorses replacement over repair.
4. *The demo is the onboarding.* "Everything is a corkboard, and your
   Project walks in pre-seeded" is the strongest positioning sentence
   the app has produced; Growth asks that Projects-as-seeded-Boards
   (B3) not be rushed, because it is the first-session story and
   deserves the P-arc's walkthrough done properly.

---

## THE RECOMMENDATION (single, unified)

**R1 — One arrangement primitive.** The Board becomes the only
organizing surface. Journal, Shelf, Trash, and (later) Projects are
system Boards wearing dresses; Drawers contain Boards.

**R2 — The dress, not the collapse.** Derived membership, authored
arrangement (Architects' rule above). Homes, origins, projectId, and
deletedAt remain the stored truth; A2 stands untouched. Any future
true collapse is a separate, schema-flagged decision nobody is making
today.

**R3 — Nothing is ever forced into a Board to exist.** Nick's open
question, answered by Law 3's spirit: membership is never required;
loose docs appear beside Boards in the Drawer view; the Shelf Board
catches the unconnected automatically. Keeping is never conditioned
on filing.

**R4 — Trash raises the floor without adding nag.** Deletion becomes
a quiet move to the Trash Board (derived from the existing deletedAt
soft-delete — pages are already recoverable in storage, unsurfaced).
No confirmation dialogs are added anywhere: the Delete-is-Delete
ruling's anti-nag core survives; only its finality is amended.
Card/thread trash remains future work (genuinely removed today; new
semantics needed; explicitly out of v1).

**R5 — Drawers are the shelf of Boards.** The cascade's Drawers
section becomes the large-thumbnail view Nick described (Boards +
loose docs, last-opened anchored at home), governed by Opposition
mitigation #1. This supersedes the current section roster and is a
canon amendment (below), not a silent restyle.

**R6 — Projects convergence is one design, not two.** Projects-as-
seeded-Boards absorbs the earlier wizard-beats-as-cards commission
and lands with the P-arc walkthrough — the last phase, done once,
done right.

**R7 — The sitting order serves the constraint.** Build phases below
are sequenced so the most broken surface (Journal) is replaced first
and every phase leaves the app MORE usable than before it.

---

## Named tensions (honest, unresolved-by-fiat)

**T1** Derived vs authored membership on system Boards — resolved for
v1 by R2, but the fork is recorded; a future writer-facing "remove
from Journal Board" gesture must map to a real re-homing act, and
that mapping is design work, not plumbing.
**T2** Whether hand-removal of system cards exists at all in v1
(recommend: not yet; arrange-only) — Nick may overrule at the device.
**T3** "Unconnected" needs a precise definition for the Shelf Board
(no board membership AND no project home is the working definition;
edge cases — starred loose captures — get ruled at B2's brief).
**T4** The lexicon (Board/Drawer/Shelf naming legibility) — one
sitting, before B2's chrome ships.
**T5** First-run: Open's no-resume fallback and the threshold's
fixtures currently point at the old Journal; B1 re-points them at the
Journal Board (the ruling that "revisit when the Places-rail lands"
already anticipated this — the revisit lands here).

---

## Canon amendments proposed (Nick ratifies each by name)

**A16 — The Arrangement Law.** The Board is the only arrangement
surface; system Boards carry derived membership with authored
arrangement; the writer's stored truth (home, origin, project,
deletion state) is never altered by arrangement alone.
**A17 — The Drawer Law.** Drawers contain Boards (and loose docs);
the cascade's Drawers section presents them as large thumbnails with
the last-opened anchored at home; the desk remains the app's anchor
state (the file-manager mitigation is part of the law's text).
**A18 — The Trash Amendment.** Deletion is a quiet, unconfirmed move
to the Trash Board; restoration is a quiet move back. Delete-is-
Delete's anti-nag core is quoted and preserved inside the amendment;
only finality changes. (Applies to Pages in v1; cards/threads
explicitly excluded until their own semantics exist.)

---

## The phased plan (each phase independently shippable)

**B1 — Journal reborn + Trash (first; replaces the most broken
surface).** The Journal Board (derived membership over journal-origin
pages; authored arrangement; capture flow untouched; cascade section
A re-pointed; old surface retired the same day its replacement
ships). The Trash Board (derived over deletedAt; restore = un-delete;
rail/cascade entry). First-run fallback re-pointed (T5). Zero
schema expected; STOP-and-report stands.
**B2 — Shelf + Drawers.** The Shelf Board (T3's definition ruled in
its brief); the Drawers thumbnail cascade (A17); the lexicon sitting
(T4) rides immediately before its chrome. Zero schema expected.
**B3 — Projects as seeded Boards.** The P-arc walkthrough seeding
structure cards; the wizard-cards commission lands here; the biggest
phase, briefed only after B1/B2 are felt and ratified on the device.

**Untouched by all phases:** the writing surfaces, the typewriter,
the Tutor, forward-lock, homes/origins in storage, copy-out law,
the threshold (still tabled).

---

## What this pass does NOT decide

The per-mode tool strips, the staged vanish, and the card metadata
chamber (titles/tags/footer fields) are the same committee's SECOND
sitting — deliberately sequenced after this pass so the card chamber
inherits this ontology instead of contradicting it. It follows as
Fable's next deliverable after Nick's ratification words here.

— The committee, assembled by Fable · 2026-07-19

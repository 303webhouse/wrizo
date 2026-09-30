# VW4 BUILD BRIEF — EMPTY TRASH: THE CONFIRM, AND ITS COUNT
### PLAN desk · 2026-09-13 · item 134, brief 4 of 4 · decision-complete **to its seam**

> **⚠ AMENDED 2026-09-24 — `b168-rulings-and-item201-delete-permanently.md` §9** (Nick: *"Delete Permanently" per item and for the whole bin*; the hard-delete seam is now specified as a TOMBSTONE, item 201). **S4's "no per-item permanent delete" is SUPERSEDED; §0's "hard delete" premise is replaced by the tombstone (the stop rule stands until the `purged_at` column is answered); the confirm stays IN PLACE. Kept as written below.**

**WORKTREE:** `.claude/worktrees/vw4-empty` · **BRANCH:** `vw4-empty` · **OFF:** `origin/main`.
**Never the primary checkout.** **This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — one machine, one browser pool. Read the box
> ordering on the ledger or ask chat 1 before any run; never infer your turn from quiet.

**RULING:** Nick, 2026-09-13 — **"3. Show it."**
**GATE:** **brief 2 (Shelf/Trash) must land first** — this control mounts in its foot.

---

## ⛔ §0 · THE SEAM THIS BRIEF STOPS AT — read before anything

**This brief builds the CONFIRM. It does NOT build the delete.**

Per Fable and the item-134 ledger entry: **EMPTY TRASH = HARD DELETE = ITS OWN PERSISTENCE ITEM**,
in **Fable's review scope**, opened when brief 2 is final. And the standing order of 2026-09-11 is
explicit: **anything touching persistence / sync / server is NOT merge-on-chat-1's-verification.**

> *"A hard delete is the one operation this house has no undo for, so it earns the heavier gate
> by its nature."*

**So:**
- Build the control, the confirmation, the count, the absence rule, and the harness.
- **Call into a single named seam** — e.g. `emptyTrash()` — **and if that seam does not exist,
  STOP AND REPORT. Do not write it.** A stubbed no-op is acceptable *only* if it is explicitly
  named as such in the build report and asserted as a no-op by the harness.
- **Nothing in this brief may touch `persistence.ts`'s delete paths, `sync.ts`, or the server.**

*The one operation with no undo is the one where a builder must not improvise, and the seam is
where this brief's authority ends.*

---

## S1 · THE CONFIRM LIVES IN THE TRASH VIEW (TV2)

**Never a modal over the writer's work. Never a surface switch.** It opens **in place**, in the
Trash view's foot, where the Empty control sits.

**Reuse the built shape** — `wz-cascade-confirm` / `-confirm-q` / `-confirm-row` /
`-confirm-danger` / `-confirm-cancel`, which `BoardRowMenu` already uses. **T4's ruling, verbatim
in spirit: one plain confirm, then gone; destructive colour ONLY inside the confirm.** The Empty
control itself is ordinary chrome — olive-rest like everything else — and **only the confirm's
own danger button carries the destructive register.**

**Pressing Empty replaces the control with the confirm** (the built pattern), so the foot's
height does not jump and nothing lunges.

## S2 · THE COUNT — Nick's "Show it" (TV3)

**The confirmation reads:**

> **`Empty the Trash? 12 items, permanently.`** · `Empty` · `Cancel`

**THE CLAUSE, RULED AND NOW LAW:** the standing no-count law (A14/A18; BD4's *listed, never
counted*) **gains one exception — a count is lawful INSIDE a destructive confirmation and
NOWHERE ELSE.** Ambient chrome is unchanged: **no count on the Trash tab, none in the rail, none
in the view's heading, none anywhere a writer has not already asked to destroy something.**

**Why the exception is narrow and must stay narrow:** the no-count law was written against
**ambient** numbers that nag. A destructive, irreversible confirmation is **not ambient — it is
the single moment where the number IS the information.** *"Empty the Trash?"* tells a writer
nothing about whether they are discarding two things or two hundred.

**The number counts what will actually be destroyed** — every item the view lists, pages and
boards alike. **If the count and the view ever disagree, the count is wrong**; it is computed
from the same source the view renders, never from a second query.

## S3 · ABSENT, NEVER DISABLED (TV4)

**An empty Trash renders NO Empty control at all** — not greyed, not inert. G3, and the only
reading that is honest: there is nothing to empty, so there is no act to offer.

## S4 · NOTHING ELSE (TV5)

**Restore (brief 2) and Empty Trash (this brief). That is the whole roster.**
**No** per-item permanent delete · **no** multi-select · **no** auto-purge · **no** "empty items
older than…". *Item 90 is superseded by item 134 and is satisfied by exactly these two verbs plus
openability — the ledger says it was never built, so there is nothing to preserve and nothing to
add.*

---

## S5 · THE HARNESS — `apps/desktop/scripts/harness/vw4.mjs`

Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path**.

**Checks owed:**
1. Empty opens the confirm **in the view**; **no modal, no overlay over the writing surface, no
   route change.**
2. **The count is TRUE** — seed *n* items, assert the confirm says *n*; **re-seed a different n
   and assert it follows.** *A hardcoded number passes a single-fixture test; two fixtures are
   what make the check mean anything.*
3. The count **matches the number of items the view renders** — asserted against the DOM, not
   against the fixture, so the two cannot drift.
4. **No count appears anywhere else** — a static/DOM assertion that the rail tab, the view
   heading and the foot carry **no digit** outside the confirm. *This is the clause's own guard:
   the exception is narrow, and only a check keeps it narrow.*
5. **Cancel restores the Empty control** and destroys nothing.
6. **Empty Trash: the control is ABSENT from the DOM**, not disabled.
7. **Destructive colour appears ONLY inside the confirm** — the Empty control's own resting
   colour is the ordinary register.
8. **The seam:** if `emptyTrash()` is a stub, **assert it is a no-op** and say so in the report.
   *Never let a stub be mistaken for a working delete by a later reader.*
9. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

---

## §CLOSE

1. **Confirm the gate: brief 2 has landed** and the Trash view's foot exists.
2. **Confirm §0's seam** — does a hard-delete function exist? **If not, STOP, report, and build
   the confirm against a named no-op.**
3. Build S1–S5; `tsc` + `build:web` + selftest + full suite, **both settings**, green,
   independently re-run at branch tip.
4. **Push the branch. Do not merge.** **If any commit in this branch touches persistence, sync or
   the server, it is NOT merge-on-chat-1's-verification — it takes Fable's gate.** Say in the
   offer which it is.
5. **A FOUNDER SITTING IS OWED** — *"Empty's number is true"* is a meaning claim, and the one
   operation with no undo is the one to watch a person perform before calling it done.

**Nothing deploys on this lane's word.**

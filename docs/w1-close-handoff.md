# W1 close + committee ratification handoff — for CC · 2026-07-12

> **EXECUTED IN FULL — 2026-07-14.** Steps 1–4 (W1 merge/deploy, the
> committee-artifact commit, W2 build → review → merge → deploy, M1 build →
> review → merge → deploy) all closed; see `docs/open-threads.md` items 6
> and 13, and `docs/backlog.md`. Kept for pattern reference — the ledger
> (`docs/open-threads.md`) is the living tracker now.

**Place at:** `docs/w1-close-handoff.md`. Self-contained; a fresh CC session
can execute this top to bottom with no chat context.

## Authorization state (read first)

- **Nick's word, 2026-07-12:** (1) merge W1; (2) ratification of the two
  committee canons is **delegated to Fable** — Nick: "I'll defer to you on
  the other options for now, but I want to prioritize progress over
  perfection... as long as the architecture isn't fundamentally broken."
  Fable ratifies both canons under that delegation.
- **Delegation scope is exactly that:** the two canon ratifications plus the
  M1 resequencing below. **Merge words remain Nick's. Device verdicts remain
  Nick's and still close tickets.** Progress-over-perfection does not skip
  the review pipe or the harness law — those are the architecture protection
  the directive presumes.
- **Fable's resequencing under the directive:** W2 build authorized
  immediately post-merge; M1 build authorized after W2's review/merge cycle
  (one-brief-per-ticket law holds); the consolidated hardware session no
  longer gates *build starts*, only *ticket closures* — the J4/J5/S1
  precedent.
- **Expected repo state:** `w1-writing-surface-polish` at `a4aa651` (fix
  batch), delta-reviewed GREEN by Fable (`docs/w1-review-fable.md`). Five
  new files placed in `docs/` by Nick alongside this one: the two canons,
  the two briefs.

## Step 1 — Merge W1 (Nick's word given)

1. Merge `w1-writing-surface-polish` into `main`. Expect clean; if
   `docs/open-threads.md` conflicts, resolve in favor of the branch's more
   current item text (the J5 precedent).
2. Full suite on merged `main`: `tsc` (desktop + server) + `build:web` +
   selftest + `j4.mjs` (26) + `j5.mjs` (40) + `s1.mjs` (87) + `w1.mjs` (18).
3. Push; `railway up`. **Zero-schema deploy** (W1 touches no server files) —
   liveness check only, per the J5 precedent.
4. Log merge + deploy in `docs/backlog.md`; strike ledger item 5 to
   **DONE — merged/deployed 2026-07-12** (device gates stay open in item 2).

## Step 2 — Commit the committee artifacts (one docs commit)

1. `docs/page-primacy-canon.md` — edit the status line to:
   **RULED — 2026-07-12, on Nick's delegated word via Fable** (quote the
   delegation above).
2. `docs/progress-milestones-canon.md` — same status flip, same notation.
3. `docs/m1-milestones-brief.md` — amend the **Sequenced** line to:
   "after W2's review/merge cycle; designed with B4 via tokens —
   `pfill-celebrate` is the interim calibration reference until B4 ratifies
   the ember grammar." (Fable's amendment under Nick's directive; note it in
   the commit message.)
4. `docs/w2-way-back-brief.md` and this file — commit as-is.
5. Apply each canon's "Proposed ledger delta" to `docs/open-threads.md`
   (replacing items 11 and 12), with item 12's tail matching the M1
   sequencing above.
6. **Do NOT touch `AGENTS.md` in this commit** — the PAGE IS PRIMARY rule
   ships inside the W2 ticket (canon, brief S4) so the rule and its harness
   assertions land together.
7. Commit message records: the delegation, the ratifications, the M1
   resequencing.

## Step 3 — Build W2 (authorized now)

~~Branch `w2-way-back` off post-merge `main`; execute
`docs/w2-way-back-brief.md` S0→S4 as written. House laws in full force:
harness committed (`scripts/harness/w2.mjs`), propose-never-ship on any
config, flag harness-invisible feel items for the hardware session.
**Report = push.** Fable reviews the branch; merge on Nick's word.~~

**EXECUTED — 2026-07-13.** Built, pushed, reviewed (`docs/w2-review-fable.md`,
REQUIRED — 2), merged (pre-authorized, fix-forward mode), w2.1 folded
(R1 + R2 + harness growth 21→31), pushed again for the delta spot-check.
See `docs/open-threads.md` item 6 and `docs/backlog.md`.

## Step 4 — Build M1 (authorized after W2's cycle closes)

~~**Arms once w2.1's delta spot-check comes back green** (per
`docs/w2-review-fable.md`'s merge/close protocol) — not yet started as of
this edit. Execute `docs/m1-milestones-brief.md`. **S0 is a hard gate:** if
the beat status vocabulary has no terminal value, STOP and return to
Fable — do not invent schema mid-build.~~

**EXECUTED — 2026-07-14.** Built, pushed, reviewed (`docs/m1-review-fable.md`,
REQUIRED — 1), R1 + the A1 comment amendment + two doc promotions folded,
merged, deployed. See `docs/open-threads.md` item 13 and `docs/backlog.md`.
This handoff is now fully spent — all four steps closed.

## On completion

Strike this file's steps in place as they close (the ledger pattern), and
update `docs/open-threads.md` — it is the living tracker; a fresh session
orients there first.

— Fable

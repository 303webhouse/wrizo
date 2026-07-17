# FX2 — the Second Sitting · build brief · 2026-07-16

**Branch:** `fx2-second-sitting` off `main`.
**Place at:** `docs/wrizo-alpha/fx2-second-sitting-brief.md`.
**Why:** Nick's sitting with the composed desk returned two verdicts.
**Zero schema, zero new deps.** Merge pre-authorized (zero-schema
rule); Fable reviews post-merge, gating close and redeploy.

## S1 — the grip clearance law

Nick's laptop: the sliver's grip overlaps the writing surface. The law
this fixes into place: **persistent chrome never enters the text
measure, at any viewport.** Transient chrome (the open sliver) may
overlay the paper's edge zone while open — it dissolves on keystroke —
but the grip lives there always, so it may ride the paper's border and
padding gutter and NEVER cross into the text column.

- Clamp the grip's anchor: when the stage's outer margin ≥ grip width,
  the grip sits fully outside the paper's edge (today's intent, wide
  screens). When the margin is thinner (laptop), the grip straddles
  the paper's border over its own left padding — its right edge never
  passes the paper's content-box boundary.
- The open sliver: prefer the outer margin; at narrow widths it may
  overlay up to the paper's padding zone with an opaque surface.
  Width clamps rather than covering text
  (fence: `clamp(160px, margin + paper-padding, 200px)` — tune).
  The paper's rect still never moves (standing law; keep the assert).
- Verify on BOTH laptop (~1280px) and wide (~2200px) viewports; the
  clamp is one rule serving all widths.

## S2 — typewriter on Draft, with the ten-line exception

Nick's rule, verbatim intent: **Draft opens with typewriter active —
unless the page already holds 10+ lines when opened.** Opening onto
substantial existing work means reading first; a near-blank draft
means forward flow.

- On a page opening into Draft: typewriter ON if the page holds fewer
  than the threshold in line-equivalents (reuse `lineEquivalents.ts`
  at the canonical measure — one counting rule everywhere; fence:
  threshold 10, tunable), OFF if at or above it.
- The writer's explicit toggle wins for the rest of the session —
  never re-impose after a hand has chosen.
- Mid-session mode switches don't re-evaluate; the rule fires at open.
- Free Write unchanged: typewriter on, as today.
- Record in the ledger as a defaults rider beside the Law 8 / A6
  cluster — no canon edit; it's an opening default, not a law change.

## S3 — harness (`fx2.mjs`)

- Grip/text disjointness: the grip's rect and the text column's rect
  never intersect, asserted at viewport 1280px AND 2200px, sliver
  closed and open (grip persists both states).
- Open sliver: opaque computed background; paper rect byte-identical
  open/closed at both viewports (extends cd1.mjs's law to the laptop
  width it never tested).
- Draft threshold, both sides: seed a ~3-line page → opens Draft with
  typewriter ON; seed a ~15-line page → opens Draft with typewriter
  OFF. Explicit toggle then persists across a mode switch and back
  within the session. A fresh Free Write page: ON, unchanged.
- Full suite green, both HARNESS_PARKED settings.

## Non-goals

Everything else on the sitting's list (the glow, the journal-paper
question, the drawer at rest, the wide field — Nick's remaining
verdicts arrive on his own clock and nothing here presumes them); no
canon edits; AB4.

## Invariants

Zero schema. The paper never reflows for chrome. One vanishing
engine. Legacy below the gate byte-identical. Olive/orange lanes.
deskLexicon for any new strings. Report = push.

## Definition of done

Nick, on his laptop and his desktop after redeploy: the grip rides
the paper's edge without ever touching a word; a near-blank page
opens in Draft already flowing; CHAPTER 1I-sized pages open still and
readable, typewriter waiting on his toggle.

— Fable, from the second sitting, 2026-07-16

# FX6 — Undo and the Doors · Fable's post-merge review · 2026-07-20

**Verdict: GREEN. Required: 0. Advisories: 1.** Tip 6bdea06 (ledger
5aaefa0). Census pulled directly on the widest commit (76fea35: all
apps/desktop — BoardEditor, CascadePanels, Sliver, index.css,
deskLexicon, two harness gen-notes); remaining commits' files fully
enumerated in their own messages (textUndo.ts new, ForwardOnlyEditor,
PinToBoardSheet, persistence, fx5/fx6/runtime-verify). Zero server
files. Zero-schema TRUE at that disclosed depth. Record depth stands
on the slice messages, the independent review (zero defects — first
fully clean FX-arc review since TU1, credible from a reviewer with a
fault-finding record), and the full suite green both PARKED settings.

**The recovery, ratified as process:** first attempt orphaned by an
unrelated session interrupt; root-caused via transcript inspection,
not guessed; WIP preserved on a renamed branch; clean rebuild with
per-slice commits. The wedged-session discipline from the house's own
history, applied correctly. On the record so it stays the standard.

**Rulings:**
1. **The undo mechanism (path b — app-level coalesced snapshot
   stack) RATIFIED** with its documented reasoning: surgical DOM
   preservation would mean rewriting draftDecoration into an
   incremental diff engine — larger and riskier than this ticket's
   invariants welcome. The brief's either/or was written for exactly
   this judgment; the header comment carries it. Word-ish coalescing
   (runs + boundary char; >600ms pause; discrete edits isolate)
   matches the granularity guidance; Nick tunes by feel at the DoD.
2. **The scope law — Nick's own sentence — held at three levels:**
   by diff (every hunk inside the `if (drafting)` branch), by
   trusted live proof (a genuinely trusted Ctrl+Z is a complete
   no-op inside forward-locked Free Write), and by the existing
   deletion-discipline asserts still standing. Proven, not promised.
3. **The em-dash fold landed BETTER than specified:** the FX5 shim
   retires entirely; the substitution records as two ordinary steps,
   so one Ctrl+Z reverts just the dash with no special-cased revert
   — and the revert now generalizes beyond "immediately after,"
   which the old shim never could. ENDORSED.
4. **The olive door — a lane-law precedent, now named:** at-rest
   affordances stay OUT of the brass lane (nothing-orange-at-rest;
   the field never burns); brass remains for armed, active, and
   earned moments only. A persistent "New Page" door therefore
   wears olive-as-contrast, and this ruling is the standing answer
   for every future resting action-door. Both doors reuse
   createLooseHomePage verbatim — one creation door in the whole
   app, never a bespoke path; homing laws asserted untouched.
5. **The inspection seam** (window.wrizoPinPageToBoard — needed
   because S3's own UI exclusion makes the store guard otherwise
   unreachable to prove) ACCEPTED as the established pattern;
   recorded here so the seam census stays honest.
6. **app.keyCombo closes FX5's disclosed keyboard-fidelity gap** —
   every undo/redo claim drives through genuinely trusted CDP key
   presses; no residual gap to disclose. The harness estate keeps
   compounding. The fixture-seeding race found and fixed in the
   harness itself (the known seed-then-reload class) — honest,
   pattern-matched, endorsed.
7. **Generation-3 park on ab4.mjs** (the exactly-N-tools lineage,
   twice re-derived, now noted a third time, quoted in place, live
   successor named) — the accretion precedent working at depth. The
   independent review's retracted candidate finding (a suspected
   lexicon miss, checked against the actual file, withdrawn rather
   than padded) — anti-false-positive honesty ENDORSED.

**A1 (advisory, one-line answer wanted):** the snapshot stack's
DEPTH — confirm a cap exists (last-N steps) or add one, fold-class.
Word-ish coalescing keeps step counts sane, but a marathon Draft
session accumulating full-text snapshots without a ceiling is a
memory-growth risk this review could not rule out at record depth.
Answer in the next report; a missing cap is a one-line fold, not a
re-open.

**Close conditions:** (1) this review on disk — this file;
(2) **B1 UNBLOCKS NOW** — this review was its gate; the Journal
Reborn builds from its committed brief on receipt; (3) deploy on
Nick's word — manifest since 6759777 = FX6 (one code ticket) +
docs riders, enumerated as always; FX6 can ride alone or share a
deploy with B1 later, Nick's call; (4) Nick's FX6 DoD script
whenever his hands are free: mangle a Draft paragraph and Ctrl+Z
back out step by step, redo, bold-then-undo, one em dash + one
undo, forward-lock still a one-way road, New Page found in two
seconds, a page-card born on a board in one act, self-pin
impossible, and the truthful "create a project first" line.

— Fable, 2026-07-20

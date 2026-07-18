# AB4 — the Wall · Fable's post-merge review · 2026-07-18

**Verdict: GREEN. Required fixes: 0.** No data-loss-class, no
architecture findings, no law violations. Merge tip `f1ba899`
(ledger record `e1b2803`), census-verified: 20 files, all
`apps/desktop` + docs — zero server files, zero migrations.
**Zero-schema TRUE at census level.**

**Depth disclosed:** full-patch read of BoardEditor.tsx (S3/S4/S5
whole), the bb3638f foundation (types/persistence/pageHome/
deskLexicon), PinToBoardSheet.tsx whole, and the S0 canon append
(A12–A15 + the composition line with Nick's revisit note verbatim —
confirmed on disk). S1 survey swap, styling, chip wiring, and
ab4.mjs verified at census + record depth, standing on the
independent review's direct testing (incl. its own
delete-with-active-connections script — the CD2-ratified method,
applied again, endorsed again).

**Rulings of record:**
1. **S3 storage RATIFIED; the brief's sketch was Fable's own
   defect.** The brief implied a sibling-field shape citing the
   `script` precedent; the build verified against migrate.ts/sync.ts
   that this codebase's per-field-jsonb-column architecture makes
   any sibling field a real `alter table` — not zero-schema.
   Connections as same-array elements ('connection'-kind Box,
   connA/connB, position always derived live) is the only genuinely
   zero-schema shape and the lowest blast radius. No STOP was owed:
   STOP fires when a column beckons; the investigation found the
   shape where none does. Erratum recorded against
   ab4-wall-brief.md S3 (the sketch, not the requirement).
2. **Deletion cleanup endorsed:** removeSelected sweeps referencing
   connections in the same filter pass; one snapshot restores card +
   threads together on Undo; the SVG layer null-guards missing
   endpoints as the second net.
3. **Legacy reading endorsed:** byte-identity proven by literal diff
   for the legacy chrome wrapper; the shared board canvas evolving
   for both regimes is the correct reading of the invariant (legacy
   VIEWS pins/threads; chrome is framed-only, per every prior AB
   ticket's scope).
4. **The "nothing to park" audit accepted:** dedicated grep pass
   with per-category reasons; four stale comments fixed for honesty
   without false parks — the erratum-vs-supersession distinction
   applied correctly.

**Advisories (carried, none blocking):**
- **A1 — self-pin reachable.** PinToBoardSheet's leaf lists every
  board in the chosen project without excluding the invoking entry;
  pinPageToBoard has no self-guard. Two taps from a board's own
  Page face pins it to itself. No data harm (idempotent, deletable);
  nonsense composition. One-line fix at either end; fold candidate
  at next touch. Note also: a board-to-OTHER-board pin travels
  correctly but the target board renders no "Back to the board"
  chip (the chip landed on the three prose/script surfaces only) —
  acceptable v1, an eye on it if board-to-board pinning sees use.
- **A2 — empty-state copy.** "File this page into one first" implies
  filing is required to pin; it isn't (membership ≠ filing; loose
  pages pin lawfully). Truthful copy: "create a project first."
- **A3 — goalText="" on boards SUSTAINED** (the build's flagged
  question): the goal system measures writing; a board holds
  arrangement; furniture reading a permanent zero is noise. A
  board-native measure, if ever wanted, is a committee question
  under the anti-gamification rails, not a fold.

**Close conditions:** (1) this review on disk — this commit;
(2) redeploy on Nick's word — deploy manifest: `6692c00..HEAD`
resolves to exactly AB4 + docs, no unnamed riders; (3) Nick's
device look per the brief's DoD (pin + truthful membership line,
docked cards through typing, thread draw/delete, resize across
reload, double-click travel + one-step back, the sliver's exact two
tools) — may ride the consolidated sitting or its own after deploy.

Ledger: item 31 notes this review GREEN, advisories A1–A3 carried,
brief erratum on S3 recorded as Fable's own. TU1's slot opens per
the one-brief rhythm — its order against hb1.2 is Nick's word,
riding the sitting.

— Fable, 2026-07-18

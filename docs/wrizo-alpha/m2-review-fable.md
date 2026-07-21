# M2 — the Rhizome · Fable's post-merge review · 2026-07-21

**Verdict: GREEN — no fold.** Two sitting questions for Nick's eye, one
advisory, one open item to lift out of a harness comment and onto the
ledger.

**Depth disclosed:** census on the widest commit (37766d4 — seven files,
`DeskFrame.tsx`, `RhizomeField.tsx`, `WritingIncentives.tsx`,
`index.css`, `JournalEntry.tsx`, `PageEditor.tsx`, `rhizomeEngine.ts`;
**all `apps/desktop/*`, zero server files, zero migration, zero
dependencies** — the floor met); the full commit chain read whole; and
targeted direct reads of the built `RhizomeField.tsx` (state discipline,
origin substitution, scope header) and `index.css` (token, animation,
reduced-motion branches) at the merge SHA. Standing on the independent
review's own work: two real defects found and fixed, ~45,000 stress
segments across deliberately hostile geometries with zero paper
violations, and a full 30-file historic suite run under genuine resource
contention, still clean. That is a properly-netted ticket and this
review does not duplicate it.

## Rulings of record

1. **The S3 scope deviation is ACCEPTED — and the brief was wrong, not
   the build.** My S2/S3 anchored the rhizome to "the progress row's own
   measured midpoint" and required the row to persist with its rightSlot
   intact. **There is no incentive row in the framed path** — FX1 S5's
   "meter track stays empty," reaffirmed in both `PageEditor.tsx`'s and
   `JournalEntry.tsx`'s own framed-branch comments, all three cited in
   code. The build substituted the paper's own bottom-center, disclosed
   it in the component header AND again at the exact line of
   substitution, and declined to un-park a parked decision to satisfy a
   brief written on a false premise. That is the right call in every
   part. My error, on the record.
2. **Framed-only mounting is correct, and the setting is correctly
   gated** — offered only when framed AND Progress:Words; legacy
   (<1100px) unconditionally byte-identical regardless of stored style.
   Consistent with offered-never-greyed. Consequence, named: the
   Rhizome is a desk feature, not a narrow-viewport one — which matches
   the laptop/tablet-first target rather than fighting it.
3. **The boundary fix (ea65c66) is the empirical standard again.**
   `segmentTouchesRect` sampled t=0 — a shoot's own already-valid tip —
   and so flagged every segment growing from a boundary-sitting point,
   driving growth to zero from a real geometry. Found while building the
   harness, proven by a standalone Node run against the live module
   before and after, then swept across 40 seeds. Same family as the
   revert-reproduce-restore proof ratified at FX7, applied to a math
   bug. RATIFIED.
4. **The StrictMode fix (99893d0) is sound — verified in the file.**
   `updateState` computes the next state from `stateRef.current`, writes
   the ref, then calls `setState` with a plain VALUE — a function
   updater can never double-invoke the PRNG again. Both the growth
   effect and the burst effect read and write that same ref, so the
   cross-effect ordering guarantee survives the change. The reset effect
   writes both in step. No desync path found.
5. **Token discipline holds; the seam is genuinely cut.**
   `--rhizome-ink` is a new theme token, `--ember` is the existing
   branding token (not a fresh literal), and the component reads no
   Plateau value directly. A future theme re-points one slot and
   inherits the whole growth-form — the mechanical half of the
   growth-form principle, delivered. Reduced-motion verified in the
   stylesheet: segments appear instantly, the flash becomes a single
   transition-driven cross-fade, no strobe. Nothing orange at rest; the
   ember is evental only.

## Sitting questions — Nick's eye rules

**Q1 — nothing visibly swaps in framed mode.** Because there is no bar
in the framed path, choosing Rhizome does not replace a visible line:
the rhizome simply appears where nothing was, and the background glow
keeps carrying progress exactly as it always has. If what you pictured
was a bar yielding to a rhizome on your own screen, the bar you're
picturing lives below 1100px. Whether the framed desk should have a
visible progress row at all is FX1 S5's parked question reopening — its
own ticket, not a rhizome fix. (Consequence for the record: the M1 R1
rightSlot guard passes vacuously in framed mode.)

**Q2 — is "barely visible" visible enough?** `--rhizome-ink` `#4A3A28`
against the desk ground `#1F1A16` is roughly 1.5:1 — exactly the "light
brown, barely visible against the brown background" you asked for, and
close enough to the floor that a dim or glossy panel may render it
effectively invisible until the ember flash. One token line to warm if
your eye says so.

**Advisory — the unit proof is weaker than the brief's words.** S5
proves the engine *unit-agnostic* (per-event and bulk growth are
byte-identical), which is a good property but not the same as
exercising word-mode and line-mode end to end as "growth on both unit
settings" asked. Honestly disclosed by the build. Low risk given the
engine taps the same `unitCount` the bar already consumes; noted so it
isn't mistaken for coverage it doesn't have.

**Open item to lift onto the ledger:** the determinism check was
"shape-normalized to sidestep an unrelated, separately-confirmed
pre-existing geometry defect" affecting revisiting the same entry within
a session. That defect is real, now twice-sighted, and currently
documented only inside a harness file's Section A comment. It deserves
its own ledger item rather than living in a code comment where the next
session won't find it.

## Close conditions

(1) This review — met. (2) Nick's deploy word — FX8 + M2 together, plus
docs riders. (3) Nick's device sitting: the growth wandering out from
under the paper, the ember flare on goal, the ground filling without
ever touching the page — and the two questions above answered by eye.

— Fable, post-merge, 2026-07-21

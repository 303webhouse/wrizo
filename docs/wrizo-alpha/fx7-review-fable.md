# FX7 — the second sitting's fixable bugs · Fable's post-merge review · 2026-07-21

**Reviewed:** the chain fe67f1a (item 41 verbatim) → 614aca4 (CC-authored
brief) → bb6f079 (item 42 open) → 79c0c7f (S1–S4) → 7cc7235 (S5–S8) →
f458202 (S9, investigation-only) → 90d2ef9 (independent review's two-gap
fix) → 9148be0 (merge) → 9bd2c40 (item 42 record), every message read
whole. **Census verified, not taken on faith:** 79c0c7f (the widest
product commit) touches exactly seven files, all `apps/desktop/*` —
fx7.mjs (new, 358), index.css, Sliver, PageEditor, ForwardOnlyEditor,
deskLexicon, draftFormat — zero server files; 90d2ef9's own text confirms
its scope is harness files only with `apps/desktop/src` untouched;
f458202 is zero product diff by declaration and message. Depth per the
B3 precedent: census + full chain, standing on three layers upstream —
fx7.mjs's 46 checks, the independent review's from-scratch verification
(screenshots at three widths, the full 26-file historic suite the build
itself never ran, and its own experimental proof), and CC's 54/54 third
pass. I re-ran nothing this sitting and read no full patches
line-by-line; the S5–S8 gesture class gets its final word at Nick's
device sitting per the trusted-pointer law, CDP `isTrusted:true` proofs
notwithstanding.

## Verdict

**GREEN — no fold required.** The ticket's own review cycle already did
the folding (90d2ef9, both gaps). One ADVISORY for Nick's eye, below.
The build's own final report stalling on a placeholder is noted without
alarm: the independent review re-derived everything from scratch, which
is the system's second net doing exactly its job — but a build that
ships without writing its own report is a rhythm miss, recorded.

## Rulings of record

1. **The revert-reproduce-restore proof (S5/S8) — RATIFIED as the
   standard for regression claims.** Temporarily reverting the suspected
   cause, watching the predicted failure appear, restoring clean: this
   is diagnosis as experiment, and it is now the named bar for any
   "prior ticket X caused this" assertion.
2. **S6's non-fix — RATIFIED.** Delete was never broken; saying so
   plainly instead of inventing a phantom fix to match the finding is
   exactly the honesty the house runs on.
3. **S9's untouched door — RATIFIED.** Both of B3's doors verified
   live-correct; what Nick reached was the pre-existing "Plot a Story" →
   old StructureWizard route. Its fate remains the parked
   StructureWizard/BeatWizard question — pointer refreshed, decision
   still Nick's and mine, taken up with J6 below or on its own.
4. **Gap 1's fix pattern — RATIFIED, with a standing-practice
   promotion.** "Update the reach-mechanism, keep the claim" at all ~15
   call sites matches FX4 S5's own precedent. The promoted lesson: a
   harness technique used across many files is itself a shared
   dependency — **any change to input synthesis or hit-testing runs the
   FULL historic suite before push, not just the ticket's own file.**
   FX7's build ran only fx7.mjs; the second net caught it; the first
   net now carries the rule.
5. **Gap 2's A4 parking — VERIFIED at record depth.** Supersession
   chains quoted verbatim, live successors named, per the law.
6. **ADVISORY — the Ink placeholder vs. the no-greyed-states
   precedent.** S2 ships a visibly-disabled ink toggle ("Ink — coming
   soon outside the Journal") against M1's own "offered only when it
   exists — no greyed states" pattern and the never-a-visible-locked-
   door frame. But item 41's finding 3 is Nick's own words asking for
   "ink options for when we reinstate the ink feature" — the build
   honored his word, and his word outranks the precedent's
   generalization. Standing as built; flagged for his deliberate eye at
   the sitting: keep the disclosed placeholder, or prefer absent-until-
   real. One word settles it.
7. **Record hygiene, no action:** fe67f1a's commit message says "six
   findings"; the recorded item holds eleven. Message imprecision only;
   the ledger's content is correct and verbatim.

## The concurrent-session collision — conduct ratified, one rule proposed

CC's mid-merge handling was exemplary: verified non-overlap before
touching anything, explicit merge commit, no force or reset, TU2's
branch and worktree untouched, full disclosure. This is the shared-tree
class's third occurrence (CD1.1/HB1 twice on 2026-07-16, now
docs-commits-during-merge), and it recurs because docs-to-main has had
no lawful path except the primary checkout. **Proposed for Nick's
ratification — the S0-push rule:** a session's records commits (brief,
ledger item) are authored in its OWN worktree as the first commit(s) on
its own branch, parented on the current `origin/main` tip, and land on
main by fast-forward push (`git push origin <sha>:main`) — never by
commits made in the primary checkout; if origin/main has moved, fetch
and re-parent first. The primary checkout is reserved for merge
operations only, serialized by Nick's merge words. This keeps the early
ledger visibility that let FX7's session discover item 43 at all — the
disk-first coordination worked — while removing the shared-tree surface
entirely.

## Close conditions

(1) This review — met. (2) Nick's deploy word — the manifest as of this
writing: **FX7 is the only merged-unshipped code on `main`** (plus docs
riders: the TU2 brief and ledger/backlog commits, named as riders);
TU2's own code sits unmerged on `tu2-listener` and joins a manifest
only after its merge. (3) Nick's device sitting on the fixes — the
S5–S8 gesture class and the S1 screenplay geometry especially, per the
trusted-pointer law. Findings 1 and 11 are not FX7's — ruled separately
(J6 — One Paper; FX8 — the Folded Lists), briefs to follow TU2's
review.

— Fable, post-merge, 2026-07-21

# FX5 — the Felt Verdicts · Fable's post-merge review · 2026-07-19

**Verdict: GREEN. Required: 0. Advisories: 2.** Tip 9c26de5
(fast-forward; ledger b8bb778). Census pulled directly on the two
widest commits (201f0ac, 557bc1a) — all apps/desktop, zero server
files; remaining code commits single-surface, files enumerated in
their own messages. Zero-schema TRUE at that disclosed depth.
Record depth stands on the build's diagnostic commit messages, the
independent review's two real catches, and CC's clean third pass
(42/42, tsc, build:web, zero discrepancies).

**The standing discipline vindicated three ways:**
1. S8's true root cause (edge-jitter cancelling the dwell clock —
   a writer could hover forever and never resurface) was PHYSICALLY
   INVISIBLE to synthetic dispatch; found only under trusted CDP
   events; fixed with a leave-grace window; FX4's inZone fix
   re-verified under real events; sliver/tool fade untouched.
2. The independent review caught the build violating the ticket's
   OWN discipline (S5 pin-drag proven synthetic-only, undisclosed)
   and closed it with a genuinely trusted press-drag-release proof
   — not a disclosure note. ENDORSED.
3. The review's second catch — an untracked rAF chain in S1's
   catch-up escaping cleanup on unmount/prop-flip, able to nudge
   scrollTop from a stale closure — is exactly the chartered
   "page moves on its own" defect class. Folded into the tracked
   raf; motion values verified byte-identical. ENDORSED.
Harness estate permanently gains trusted-event capability
(app.mouseMove/mouseDown/mouseUp) — Chromium's pointer-capture
machinery confirmed live to ignore page-side synthetic
PointerEvents entirely.

**Rulings:**
- The olive pin CIRCLE: a knowing square-corners exception, RATIFIED
  with provenance — Nick's own verdict specified "a small green
  circle (the 'pin')"; exception scoped to this one glyph, the law
  otherwise intact.
- S6 reveal-adjacent-to-caret RATIFIED with its documented reason:
  display:none/visibility:hidden markers are excluded from
  Element.innerText by spec — always-hidden would silently strip
  markers from storage. Draft's own register untouched, verified by
  its own harness line.
- S7's purpose-built em-dash undo shim ACCEPTED as disclosed (the
  felt one-step requirement delivered; see A2 for what the diagnosis
  uncovered).
- S4's root cause (pointer capture only after the 6px threshold —
  fast real drags routed events off-canvas mid-gesture) fixed at
  the first pointerdown. The S10-caused sliver-anchor regression
  caught pre-merge by fx2.mjs's own floor check — the estate
  working as designed. Park sweep clean at A4 discipline, including
  ab4's THIRD-generation park of the same gesture lineage and
  cd1's generation-2 note exactly as S10 specified.

**A1 (Nick's eye):** ported cards' double-click now TRAVELS to
source (page-pin consistency); editing moved to a visible "Edit
copy" button — a reasoned divergence from Nick's "double-click any
card to edit." Keep or overturn at the sitting, one word.
[RESOLVED post-review: KEPT on Nick's word 2026-07-19 — "cards are
not meant to be the place where writers will do a lot of text
editing." Recorded here so the file carries its own closure.]

**A2 (backlog, real priority):** native undo (Ctrl/Cmd+Z AND
execCommand) is nonfunctional in Draft's free editor and the card
popup — both rewrite innerHTML wholesale per input, invalidating
the browser's undo stack. Pre-existing, out of scope, honestly
disclosed by the build. For a writing app this deserves its own
ticket; recorded here with the diagnosis so it never has to be
rediscovered.
[RESOLVED post-review: COMMISSIONED as FX6 S1 on Nick's word, with
his scope law — typewriter/forward-lock's deletion discipline
untouched; undo restored everywhere else.]

**Close conditions:** (1) this review on disk — this commit;
(2) deploy on Nick's word — THE MANIFEST RULE'S FIRST TWO-TICKET
DEPLOY: 1dc0003..HEAD = TU1 + FX5, both named, plus docs riders;
(3) post-deploy in order: TU1's REQUIRED prod round-trip (scratch
account, populated thread, byte-for-byte); TUTOR_API_KEY on
Railway (Nick's step, his timing); Nick's combined DoD sitting
(TU1's script + FX5's script + the A1 double-click read). Item
27's tabled list keeps separately.
[Conditions 2 and the round-trip: DISCHARGED 2026-07-19 — deploy
39bbe424 @ 6759777, manifest clean; round-trip PASS, key-order-
insensitive byte match with message order exact, grandfather held
live. Remaining: Nick's key + his sittings.]

— Fable, 2026-07-19

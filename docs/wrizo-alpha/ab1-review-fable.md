# AB1 — the Page and its Desk · Fable's post-merge review · 2026-07-14

**Place at:** `docs/wrizo-alpha/ab1-review-fable.md` (CC commits this file in
the ab1.1 fold).
**Reviewed:** `d95429a` (S0) → `7a12bce` (S1–S5) → `bb871fe` (S6) →
`fba81c7` (CC's own review fold) → `c375a08` (ledger), full patches, on
merged `main`. Merge was pre-authorized; this review gates the close.

## Verdict

**REQUIRED FIXES — 2** (one small code fix, one docs-only ruling-recorder).
**No data-loss-class findings. No architecture findings.** The frame is
sound: fixed tracks hold the page rect by construction and by harness, the
flourishes are genuinely unmounted with their zones visibly reserved, the
containment bug is dead with permanent coverage, and the parked-check
disposition is honest and verifiable. CC's own pre-merge review pass caught
two real defects (the gate-floor overflow and Board's unwired vanishing
law) — both fixes verified correct in this review. Fixes fold as **ab1.1**;
item 21 closes on the fold plus Nick's device look.

---

## In plain words

The new desk holds. The page sits in fixed tracks that cannot move when
tools open or modes switch — proven at a comfortable width and at the exact
1100px floor. Typing makes the room vanish on all three surfaces. Two
things remain: on the script and board pages, one row of chrome (the
breadcrumb and its buttons) forgets to vanish with everything else — a
small fix. And the Journal's own page never moved into the new frame — the
build recorded this honestly rather than hiding it, and my ruling is that
it was the right call for this ticket but may not slip further: it becomes
a named part of AB2, on the record, below.

---

## Required fixes (fold as ab1.1)

### R1 — The vanishing law misses the nav row on framed Script and Board

The brief's S3: *"any words-producing input (keydown, pen stroke)
dissolves every non-page zone together."* On the framed text surface, the
whole room vanishes — frame tracks via `data-writing`, DeskRail and the
corner glyph via the shared WritingSession (`useChromeDissolve` drives
`setWriting(dissolved)` — verified in the engine), and the breadcrumb row
via `chrome-fade` under the host's `data-chrome-receded`. On framed
**Script** and **Board**, everything vanishes **except the `sprint-nav`
row** (breadcrumb + Done/Undo): it carries no `chrome-fade` class and its
host carries no `data-chrome-receded` attribute. Same finding class as the
Board gap CC's own pass already judged "a real gap, not a Nick-level scope
call" and fixed.

**Fix (framed branches only — legacy stays byte-identical):** mirror
PageEditorView's proven pattern.

```
ScriptEditor framed host:  data-chrome-receded={scriptDissolve.dissolved ? 'true' : 'false'}
ScriptEditor framed nav:   className="chrome-fade chrome-top sprint-nav"
BoardEditor framed host:   data-chrome-receded={boardDissolve.dissolved ? 'true' : 'false'}
BoardEditor framed nav:    className="chrome-fade chrome-top sprint-nav"
```

**Harness:** +2 checks in `ab1.mjs` — after the existing S3 typing steps on
Script and on Board, assert the nav row is receded using the
transition-independent signal the file already uses (computed
`pointer-events: none`, or `closest('[data-chrome-receded]')?.dataset
.chromeReceded === 'true'`), and that the existing edge-dwell resurface
restores it.

### R2 — The JournalEntry S2 deviation gets its ruling on the record

The brief's S2 mount list reads: *"the existing delegates (text, board,
script) **and the Journal's editor**."* JournalEntry shipped
**absorb-deferred** (inventory row 6 — recorded honestly, ledger-flagged;
only the capture stub relocated). **Ruling: the deferral is SUSTAINED and
the work is re-homed to AB2 as a named slice.** Reasoning: JournalEntry's
shell is the most entangled of the four (its own tab row, spread console,
ink layer, metadata band) — a poor fit for a fix-fold, which the house
keeps small; and its natural frame entry is AB2, where the Free Write tool
rail — the brief's own "final home" for the Journal's capture items — gets
built. What the ruling forbids is drift: dissolving the Journal-as-place is
the arc's thesis (Desk design Part 4), so it may not slip past AB2. I am
writing "JournalEntry enters the frame" into the AB2 brief with its own
DoD. QuickSprint's deferral is likewise sustained (it was never in S2's
list; "not the Page" is the correct classification — its finish-ritual
flow needs its own design pass).

**Fix (docs-only, one commit line):** annotate
`docs/wrizo-alpha/ab1-page-frame-brief.md` S2 with one sentence — the
Journal's editor deferred per inventory row 6, ruled re-homed to AB2
(Fable review, 2026-07-14) — so brief and build agree on disk.

---

## Rulings (no code change; recorded here as the decision of record)

1. **Strings seam naming — RATIFIED as built.** `store/deskLexicon.ts`
   over the handoff's `desk/strings.ts`. Sibling-to-`themeLexicon.ts` is
   the stronger convention (one `store/` home for lexicon seams; a `desk/`
   directory for one file fragments it), and the casing-collision
   rationale — themeLexicon's `freewrite` byte-pinned to legacy lowercase
   "Free write" vs. the ratified title-case "Free Write" — is precisely
   the kind of separation that prevents a silent regression. All future
   docs reference `store/deskLexicon.ts`; carried into the AB2 brief and
   the succession dossier by me.
2. **The ≥1100px gate — RATIFIED as built.** The brief's own S1 ("owning
   the viewport at ≥1100px") and non-goal ("mobile <1100px keeps current
   behavior") support it, and the gate is what made the parked-check
   disposition near-free (the legacy branch is byte-identical, so the
   existing 304 checks exercise it untouched — corroborated by the full
   suite running green with zero harness-file changes). Recorded
   consequence: the frame is desktop/large-tablet-first, matching the
   standing device priority; any future gate-widening re-opens the S6
   parked audit, and `ab1.mjs`'s scaffold is built to receive exactly that.
3. **Finding 1 ("the page is oddly small") — argued dead-by-composition;
   the death certificate is Nick's device look.** The harness comment's
   typography argument is correct: 60ch is the right reading measure, and
   the brief itself specifies `min(760px, 60ch)` — raw width was never the
   complaint; orphaned composition was. Composition quality is
   harness-invisible by nature; item 21's close already routes through
   Nick's device look, which is where finding 1 formally dies. Note for
   that look: at the 1100px floor the prose measure lawfully compresses to
   roughly 450px (no overlap — proven at the exact floor). Look at both a
   wide viewport and near-floor.
4. **SyncIndicator's global silence — RATIFIED.** A scope expansion beyond
   the frame, but the constitution's rule is global by nature ("Saving is
   assumed; only a failure to save is allowed to speak"), the change only
   removes benign status text, and no harness asserted the old strings.
5. **CC's self-review pass — endorsed as process; one attribution
   correction.** Both catches were real, and the gate-floor overflow is
   exactly the class a review exists to hunt (the build's own checks all
   ran at 1400px; the reviewer went to the floor). One correction for the
   audit trail: the fold commit's message calls itself "Fable's review /
   CC-folds-the-fixes pass" — it was CC's own independent pass; **this**
   document is the Fable review. The ledger already states it correctly;
   future commit messages should stay literal about whose pass is whose.
6. **The ModeStage dwell fix — endorsed, in scope, correctly diagnosed.**
   The rootRef array literal's per-render identity churn re-armed the
   summon effect on every render, and a pointer *resting* at the edge
   fires no new `pointermove` to restart the cleared dwell — an
   intermittent starvation on any surface with periodic renders (the 1s
   session-timer tick alone). Real pre-existing bug, minimal fix, benefits
   every ModeStage caller.

---

## Advisories (carry — none block the close)

- **A1 — The active mode tab is resting orange at maximum register**
  (`.desk-mode-tab.active{ background:var(--brass) }`). The canon's
  findings-of-record indicted resting orange *on tabs* specifically. One
  lit tab plus the brass-press corkboard heading is defensibly within a
  resting ceiling, and the strip does dissolve during writing — but the
  Plateau foundations doc (mine, this week) must rule the active-mode
  expression explicitly; my prior is a quieter treatment (edge/underline/
  tint) with brass reserved for evental moments. Nick's device look can
  pre-empt the ruling.
- **A2 — The corner-glyph popover has no outside-click or Escape close**
  (glyph toggle and frame-unmount only). Small UX debt; fold
  opportunistically with any AB2-adjacent GlobalHeader touch.
- **A3 — `deskFrameActive` is a single boolean.** If AB3's open-beside
  ever mounts a second frame, the first unmount clears the flag under the
  survivor. Likely moot (open-beside is a reference page inside the same
  frame), but the AB3 brief (mine) will design the signal accordingly.
- **A4 — `useDeskLexicon`'s `setTick` effect is redundant** (`useTheme` is
  already the reactive source; the effect only forces a second render on
  theme change). Harmless; delete opportunistically.
- **A5 — The `@media (max-width:1099px){ .desk-frame{display:none} }`
  rule can bite.** Between CSS applying and React swapping branches on a
  downward resize cross, the mounted frame — page included — is
  `display:none` for a frame: a one-frame blank and a needless hazard
  class. Prefer deleting the rule (the JS gate is the real boundary) and
  keeping the comment.
- **A6 — Board's action row (Ungroup/Remove) never dissolves.** It sits
  inside the stage as DeskFrame children. Defensible (selection-scoped,
  tools-at-hand), but it is chrome by the category table; noting it for
  the AB2 tool-rail design, its natural future home.

---

## Scrutiny list, item by item (the handoff's five)

| Item | Finding |
|---|---|
| Five-track grid rect invariance, all three pageTypes | **HOLDS** — by construction (fixed `200px · minmax(0,1fr) · 260px` tracks; wayfinding gutter pre-reserved) and by harness (mode-toggle, gear-open, cross-pageType toolrail position, and — post-fold — the exact 1100px floor with no overlap and no horizontal scroll). |
| Vanishing law blast radius | **One gap → R1** (Script/Board framed nav rows). Engine verified: one `useChromeDissolve` per surface, no second fade system; DeskRail + corner glyph recede via the shared WritingSession on all three surfaces. |
| Parked-harness gating | **HOLDS, better than specced** — the audit found nothing needed parking (no existing harness sets a ≥1100px viewport; legacy branch byte-identical), recorded plainly and falsifiably; `HARNESS_PARKED=1` scaffold committed and ready. Parked ≠ deleted honored: zero deletions anywhere. |
| Containment on script | **DEAD (finding 4)** — `.desk-frame-scroll-cap` bounds the sheet; harness proves overflow scrolls inside the cap and the document never grows past the viewport, after 19 lines of real typed input. |
| Nothing flourish-shaped mounted | **HOLDS** — `framed` gates typewriter, incentive row (progress/laps/celebration/milestones/word-count), ambient glow, both ModeStage rails, and the connect modal; harness asserts the negative on all four flourish classes and that the meter track is exactly one and empty. Pen/format bar and gear correctly retained (words-on-page, not flourish). |

**Zero-schema:** confirmed at file level — no server files in any AB1
commit. **No new deps:** confirmed — imports are all house modules.
**Substrate untouched:** confirmed — no persistence/sync/editor-core files
in the diffs; the KEEP list is intact.

## Close conditions for ledger item 21

1. CC folds ab1.1 (R1 code + harness, R2 docs line, this file committed),
   re-runs the full suite, reports = pushes.
2. I spot-check the ab1.1 delta.
3. Nick's device look (wide + near-floor; the finding-1 composition
   verdict and A1's orange read are his to make there). No deploy is owed
   before it — merge-not-deployed is a lawful state for this look, or
   `railway up` first on Nick's word; single-user prod makes either safe.

— Fable, 2026-07-14

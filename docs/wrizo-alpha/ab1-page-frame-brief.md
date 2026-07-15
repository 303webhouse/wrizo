# AB1 — the Page and its Desk (build brief · v2)

**v2 — supersedes v1 (2026-07-14). Changes: Nick's three rulings folded —
(1) mode strings ratified: Free Write · Draft · Revise · Workshop ·
Publish; (2) FLOURISHES UNMOUNTED — the new frame ships as a clean word
processor with every zone reserved but the incentive layer not mounted;
(3) module names become theme-scoped vocabulary ("Journal" is Plateau's
word for the capture module).**

**Branch:** `ab1-page-frame` · off current `main`
**Authorized by:** Nick's 2026-07-14 constitution + rulings +
`docs/wrizo-alpha/the-desk-design.md` (whose Part 6 decisions are now both RULED —
annotate that doc's status line when committing this one).
**Audience:** CC.

## Why

One frame replaces the separate worlds, and it ships **quiet**: a clean,
excellent writing surface first. The ADHD-friendly flourishes (typewriter,
progress bar, celebrations, milestones, ambient glow) are *parked, not
deleted* — they re-mount later into zones the frame reserves from day one.
Nick's words: the bones must know sections around the page are coming.

## Scope (slices)

- **S0 — shell inventory (gate).** Unchanged from v1: enumerate every
  top-level composition wrapping a writing surface; committed table
  (`docs/wrizo-alpha/ab1-shell-inventory.md`) of keep-inside-frame / absorb / delete;
  reviewed in the AB1 review.
- **S1 — `DeskFrame`.** One component owning the viewport at ≥1100px.
  **All five zone tracks exist in the grid from day one** — wayfinding
  rail · tool-rail track · stage · corkboard track · meter track — even
  where empty. An empty track renders as desk ground at its reserved
  width; re-adding a feature later means mounting into a home that already
  exists, never re-cutting the grid. Stage centers the page (prose
  `min(760px, 60ch)`; screenplay keeps its courier measure); surrounding
  space is desk ground (`--desk-ground` over `--ground`, Plateau-dressed;
  the Plateau foundations doc is incoming this week — until it lands, the
  shipped palette IS the spec). Fixed tracks; page bounding rect invariant
  under every toggle (PAGE IS PRIMARY assertions extend here).
- **S2 — one page, every surface, quiet.** Mount the existing delegates
  (text, board, script) and the Journal's editor inside the stage. The
  unified mode strip renders above the stage everywhere — strings, exactly:
  **Free Write · Draft · Revise · Workshop · Publish**. **Do NOT mount:**
  the typewriter effect or its toggle, the progress bar / laps /
  celebration, the milestone circles, the ambient glow. The meter track
  stays an empty reserved zone. Ink tools remain available (pen mode is
  words-on-page, not a flourish). Journal's CAPTURE items relocate into
  the frame (interim: corkboard track's Journal tab; final home is AB2's
  Free Write tool rail). **Erratum (Fable review, 2026-07-14):** the
  Journal's own editor (JournalEntry) shipped absorb-deferred per the
  shell inventory's row 6, not mounted in AB1 — the deferral is sustained
  and the work is ruled re-homed to AB2 as a named slice, on the record in
  `docs/wrizo-alpha/ab1-review-fable.md`.
- **S3 — the vanishing law, generalized.** Constitutional, not a flourish
  — stays exactly as v1: any words-producing input (keydown, pen stroke)
  dissolves every non-page zone together; edge-reach/pause resurfaces per
  existing dwell rules. With the meter track empty this governs the mode
  strip and rails for now; the law's blast radius already covers the
  flourishes when they return.
- **S4 — the chrome purge + containment.** Unchanged from v1: top-bar
  orphans collapse to one corner glyph + gear; "saved" goes silent (only
  failure speaks); "Copy page text" leaves top chrome (home is Publish,
  wired in AB2); fix the unbounded page growth — the stage scrolls, the
  page never extends past the frame; verify on script.
- **S5 — strings as the theme-vocabulary seam.** `desk/strings.ts`
  centralizes every user-facing zone/module/mode name, keyed so a theme
  can supply its own lexicon later (Nick's ruling: "Journal" is the
  Plateau name; other themes will likely rename the capture module). One
  flat map, theme-key-ready; no theme machinery built — just the seam.
- **S6 — harness (`scripts/harness/ab1.mjs`) + parked-check disposition.**
  Zone-grammar assertions as v1 (rect invariance across pageTypes; strip
  present everywhere incl. script; vanishing on keydown + simulable
  pointer; containment; corner glyph; exactly one meter track and it is
  EMPTY). **Parked-feature harness law:** existing `w1.mjs`/`m1.mjs`
  checks that assert the flourishes' presence will fail as surfaces
  migrate into the frame — move those checks into a clearly-marked PARKED
  section gated behind `HARNESS_PARKED=1` (skipped by default, one-line
  reason each, never deleted), so re-mounting a flourish re-arms its
  checks by flipping the gate. Document the disposition in the harness
  header and the ship report. Non-parked checks in those suites still run
  and must stay green.

## Non-goals

Per-mode tool rails, forward lock, the Structure picker, rich-text Draft
tools (all AB2 — note: AB2's brief will carry the committee's answer to
the one real architectural question the "word processor" ruling opens,
namely how formatted Draft text is stored; do not pre-build toward any
answer here). Corkboard depth (AB3). Re-mounting any flourish. Theme
machinery beyond the strings seam. Mobile (<1100px keeps current
behavior). Any substrate, sync, or editor-core change.

## Invariants

Zero schema. No new deps. Substrate untouched (`docs/wrizo-alpha/app-bones-canon.md`
KEEP list). Fixed tracks; PAGE IS PRIMARY self-check every slice.
Two-regime orange in the new frame (resting ceiling; evental lane).
Parked ≠ deleted — no flourish component or its harness is removed from
the codebase.

## Definition of done

`tsc` ×2 + `build:web` + selftest + full suite (parked sections gated,
everything else green) + `ab1.mjs` green; findings 1 and 4 dead; the frame
reads as a clean word processor on a warm desk with every future zone
visibly reserved as calm space; report = push; review per the week's
compressed rhythm; Nick's device look folds into AB gates.

— Fable

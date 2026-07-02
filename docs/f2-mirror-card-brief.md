# F2 — The mirror card (warm start) — build brief

**Branch:** `f2-mirror-card` — created FIRST, before the first edit (F1 repeated the
mid-stream branch; keep the invariant this time). Off F1's merge target.
**Arc:** F — "From open to flow" · ticket 2 of 6 · FEEL WORK — tablet gate before deploy
**Canon:** `docs/state-of-wrizo-2026-07.md` Rev 2 (Finding 2, Part IV) · Written 2026-07-02
**Feel source:** `apps/desktop/scratch/wrizo-f-arc-design-a2.html` (delivered with this
brief — reference for hierarchy/typography/behavior, not shipped code)

## Why

Resume is now trustworthy and typed (F1), but the Desk renders none of it: a
label-only button while `lastLine`, `daysAgo`, `kind`, `pageType`, and `home` are
computed and dropped. F2 makes the Desk a mirror — the writer's own last sentence
becomes the primary action's justification, and landing carries a warm start that
releases into flow. This is the ticket that turns "the app opens to your last
sentence" from a roadmap line into the product's one-screen demo.

## Principles (binding)

- **Mirror, not persona:** the card renders ONLY from the typed pointer.
- **One primary (B4):** the card replaces the primary button; nothing else gains
  prominence on the Desk.
- **Calm register:** the `relativeDays` voice; no streaks, no guilt, no "you've
  been away a while."
- **Render-only:** nothing in this ticket writes to entry text. Clean-save
  invariant untouched, harness-asserted.

## Slices

### Slice 0 — feel source in-repo
`apps/desktop/scratch/wrizo-f-arc-design-a2.html` lands alongside this brief.
Reference only. Match its hierarchy: eyebrow / form tag / crumb / last line (prose
voice) / when + action / optional structural link. The demo strip is demo-only.

### Slice 1 — `describeTarget()`: the vocabulary (pure function)
In `resume.ts` (or a sibling `resumeVocab.ts`):
`describeTarget(t: ResumeTarget) → { tag: string; crumb: string[]; note?: string }`
- `tag` = FORM · SURFACE, from the pointer alone:
  - kind labels: book→BOOK, story→STORY, screenplay→SCREENPLAY; other/undefined →
    the project's drawer name uppercased if it has one, else PROJECT.
  - pageType labels: manuscript→MANUSCRIPT, character→CHARACTER PAGE,
    worldbuilding→WORLDBUILDING, research→RESEARCH, note→NOTE.
  - home overrides: journal→"JOURNAL · UNFILED"; shelf→"SHELF · UNFILED".
  - legacy project target (no entry): kind label alone.
- `crumb` pieces: [drawer?, project?, page firstLine(40)] — reuse the `firstLine`
  util; loose pages: ['Journal', firstLine or 'Untitled'].
- Pure and unit-checkable in the harness (direct import; `window.wrizoResume`
  gives live pointers to feed it).

### Slice 2 — the return card (Desk)
When a resume target exists, the primary block becomes the card:
- eyebrow "PICK UP WHERE YOU LEFT OFF" · `tag` right-aligned (accent, small caps)
- crumb line (Figtree, tan); then the `lastLine` in quotes — `--font-prose`
  italic ~19px, `--text-hi`, clamped to 2 lines; fall back to the page title or
  "Untitled" when `lastLine` is null (blank page)
- when-row: `relativeDays(daysAgo)` left · primary button "Keep writing" →
  `target.route`
- Support-page targets (pageType ≠ manuscript, home 'binder'): a quiet
  structural link "…or back to the manuscript → {title}" — the newest
  manuscript-type page in the SAME binder (`getBinderPages(id)` already sorts
  newest-first; find pageType==='manuscript'). Omit if the binder has none.
  A fact of the binder, never a prediction about the writer.
- Loose/shelf targets: a quiet note "file it later from the Shelf, or never"
  (no link needed — the rail owns the Shelf).
- No target → the existing "Start something" primary, unchanged.
- Styling: square corners, panel bg, 1px `--line` border; orange ONLY on the
  action and the tag. New CSS under `.wz-return*` beside the desk styles.
- The "New page" secondary row stays exactly as-is this ticket — F3 owns Catch.

### Slice 3 — warm-start landing
- The card's navigate passes one-shot state:
  `navigate(route, { state: { warmStart: true } })`.
- PageEditor + JournalEntry (authored view): when `location.state?.warmStart`:
  - caret to end (both already focus/place-caret on mount — verify the
    ForwardOnlyEditor path lands caret-at-end; add a focusEnd seam if not);
  - transient warm emphasis on the LAST paragraph — a render-layer decoration
    (overlay positioned over the last block, or a class on a non-editor
    wrapper; MUST NOT alter text nodes or editable DOM): background
    `rgba(255,152,0,.11)` + inset 3px left rule `var(--accent)`;
  - releases on the first forward keystroke (hook the existing
    noteWrite/onForward seam) OR after 6s; release transition ~1.3s;
  - `prefers-reduced-motion`: static tint, no transition, still clears on the
    first keystroke;
  - chrome behavior untouched — the dissolve engine already owns it;
  - one-shot: consume/replace the history state so back/refresh never re-glows.
- Drive-by papercut (from the F1 review): PageEditor's `backTo` for a shelved
  typed page → `/shelf` when `entry.shelved` (currently exits to `/journal`).

### Slice 4 — Change-4 reconciliation
Deep resume replaces overview-resume for page targets. Verify orientation
survives: the crumb renders on landing in PageEditor (it does — Drawer / Binder /
Page), JournalEntry keeps its journal back link, and ProjectHome's "continue"
marker still works for overview arrivals (legacy targets). No other overview
changes.

## Non-goals (other tickets)
Catch (F3); the writing picker + title-later (F4); SessionLog / TTFK (F5); the
first-line invitation (F6); drawers-glance redesign; any schema or server change;
any editor-mode logic change; big-screen layout.

## Invariants
- B4 one-primary; calm copy only; `--font-prose` for the quoted line; orange =
  action/tag only; square corners, solid borders.
- Warm emphasis is render-only — the saved text is byte-identical before and
  after a warm-start landing (harness-assert).
- Reduced-motion honored via the existing pattern.
- Legacy targets (untyped filed, loose, shelf) land in `/journal/:id` with the
  same warm-start behavior.
- No new collections; no server changes; sync untouched.

## Definition of done (in-harness + hardware)
1. The card renders correctly for each pointer shape: binder manuscript / binder
   support (with the structural link) / loose journal / shelf / legacy sprint
   project / no target ("Start something"). Seed each via the store; screenshot
   each state.
2. `describeTarget` unit checks: the six shapes return the specified tag + crumb.
3. Keep writing → lands in the right editor; caret at end; last paragraph warm;
   the first keystroke releases it (CDP-composed input); saved text is
   byte-identical before and after the landing.
4. The 6s auto-release path works; the reduced-motion path (CDP emulation) shows
   a static tint that still clears on the first keystroke.
5. Back/refresh after a warm landing does NOT re-glow (one-shot state consumed).
6. Shelved-page "Done" exits to `/shelf` (papercut fixed).
7. `tsc` (desktop + server) + `build:web` + selftest green.
8. TABLET GATE: warm-emphasis subtlety, card typography, and tap targets
   eyeballed on hardware BEFORE `railway up`. The deploy holds for Nick's pass.

## Working environment
- Branch `f2-mirror-card` FIRST, before the first edit.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always.
- Log the shipped ticket to `docs/backlog.md`. The feel source stays in
  `scratch/` — never imported by app code.

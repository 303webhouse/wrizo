# ab2.1 — fix brief: the Journal page's collapsed width (+ one lawful color sweep)

**Found by:** Nick's device look against the live deploy, 2026-07-15
(desktop, wide viewport, Journal page 12/12, Free Write). Screenshot on
record: the paper renders as a ~80px vertical sliver.
**Branch/rhythm:** fold as ab2.1 per the AB rhythm; report = push.

## F1 — the paper lost its width source (REQUIRED)

**Root cause** (from the S6 patch, `pages/JournalEntry.tsx` framed
branch): pageBody is wrapped in
`<div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>`.
`align-items:center` overrides the default `stretch`, so every block
child — including the `position:relative` wrapper around
`.paper-page.entry-full` — collapses to fit-content width. In legacy,
the paper's width came from block-flow stretch inside the
`maxWidth:720` `.page.journal-page` host; the framed wrapper removed
that width context without replacing it. An empty page's fit-content is
the placeholder's min-content ≈ the sliver Nick photographed.

**Fix:** restore a legacy-equivalent width context inside the stage.
Replace the wrapper's style with:

```
style={{ width: 'min(100%, 720px)', display: 'flex', flexDirection: 'column' }}
```

— no `alignItems` (default `stretch` restores full-width children,
matching legacy block flow exactly); the stage row's own
`justify-content:center` centers the bounded column. 720 matches the
legacy `.page.journal-page` measure. Verify the metadata/star band,
tag row, and incentive gates all align under the paper exactly as they
do below the gate.

## F2 — harness: rendered-geometry sanity (REQUIRED, the class fix)

Add to `ab2.mjs` (and this is the lesson, so cover every framed
surface, not just the one that broke): at the 1400×900 fixture, assert
the primary writing surface's rendered width is sane —

- framed JournalEntry: `.paper-page.entry-full` clientWidth in
  [600, 760];
- framed prose page: `.mode-pagecol` width in [600, 800];
- framed script: `.script-sheet` width ≥ 400;
- framed board: `.board-canvas-wrap` width ≥ 400.

Presence checks proved mounting; these prove composition has a floor.
Cheap, transition-independent, and this exact failure becomes
machine-visible.

## F3 — DeskRail's active place goes olive (lawful sweep; Nick may veto on sight)

Nick's screenshot shows the rail's Journal item resting in full orange
— the "spine" site the findings of record indicted, untouched by
AB1/AB2 because DeskRail predates both. The Plateau foundations
(committed law) now rule this square: *olive marks where you are;
orange marks what you do*, and the resting-orange allowance is engraved
headings only. The rail's active-place indicator is a where-you-are at
rest → it wears `--accent-rest`, not brass.

**Fix:** in DeskRail's active-item styling, swap the brass
color/highlight for `var(--accent-rest)` (color and/or hairline edge to
match the strip's register; keep the treatment quiet). This is shared
chrome (all routes, both sides of the gate) — correct under the
foundations since Plateau is the only shipped theme; the value rides
the token, so future themes re-point it for free. One harness check:
the rail's active item computed color is not brass.

## Not in scope (recorded for Nick's look, not for this fold)

- **The mode strip's presentation** — it ships as a full-width bar with
  tabs hugging the left; Fable's mockups drew it as a centered
  engraving hugging its own words above the page. Composition call,
  Nick's to make while he's looking; a one-line CSS follow-up either
  way (`inline-flex` + `align-self:center` if he rules centered).
- Everything else in the screenshot matches built intent: engraved
  strip live, rail tools present, corkboard and meter tracks empty and
  reserved, metadata below the page, corner glyph quiet.

**DoD:** F1–F3 in, full suite green including the new geometry checks,
report = push, redeploy on Nick's word so the re-look happens against
live.

— Fable, 2026-07-15

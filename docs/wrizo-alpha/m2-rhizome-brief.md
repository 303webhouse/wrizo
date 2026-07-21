# M2 — the Rhizome · build brief · 2026-07-21

**Place at:** `docs/wrizo-alpha/m2-rhizome-brief.md`.
**Branch:** `m2-rhizome` off `main` (post-TU2-merge), own worktree per
ONE CHECKOUT PER AGENT. **Sequencing:** queued behind TU2's merge;
parallel with FX8 is lawful (no surface overlap); serialize against J6
if both touch PageEditor — first to merge wins the base, the other
rebases.
**Authority:** Nick's commission of 2026-07-21 with Fable's eight
design rulings (session-scoped forward-only; seeded determinism; ground
never paper; rightSlot and glow survive; milestones = existing grammar
events only; offered-never-greyed; decaying growth; the growth-form
principle carried to future themes). The progress-milestones canon
binds whole: coverage never verdicts, one celebration grammar, B4 the
final authority on the ember treatment. **ZERO SCHEMA, ZERO NEW
DEPS** — any slice wanting a column or a package is STOP-and-report.
Merge pre-authorized as zero-schema per the AB4 precedent; Fable
reviews post-merge. Report = push; deploy is Nick's separate word.

## S0 — records first
Ledger: open M2's item (this brief; the eight rulings recorded; the
growth-form principle recorded as PROPOSED CANON awaiting Nick's
ratification at his next words). Commit this brief.

## S1 — the setting (offered, never greyed)
A new desk setting, Progress style: **Bar** (default) | **Rhizome** —
stored exactly like the existing Progress/Timer settings (client
settings store, no schema), every string through deskLexicon. The
control renders ONLY when Progress is Words (M1's own "offered only
when" precedent — under Progress:Project it is absent, not disabled).
Bar remains the shipped default; a legacy device with no stored style
is byte-identical to today in every mode.

## S2 — the growth engine (seeded, bounded, forward-only)
A single component (`RhizomeField`) rendering one SVG layer,
absolutely positioned within the desk stage, clipped to it, `z-index`
beneath paper and all chrome, `pointer-events: none`,
`aria-hidden="true"` — purely ambient; it can never intercept a click
or carry a control (the harness walks it to prove so).
- **Seed:** a tiny in-repo PRNG (mulberry32-class, ~10 lines, no
  dependency), seeded from entry id + session start — same session,
  identical growth; re-renders never reshuffle.
- **Origin:** the horizontal midpoint of the progress row's own
  measured rect (the row persists in both styles — see S3), first
  shoot rooted there.
- **Growth event:** the SAME unit event the bar already consumes
  (word or line per the writer's existing unit setting) — the rhizome
  taps that one source, never keystrokes, never persistence writes
  (item 18's force-render ceiling is not to be aggravated: no new
  subscriptions to the write bus).
- **Per event:** extend a random existing shoot one segment (~80%) or
  branch a new shoot from a random existing point (~20%; the first
  event always roots the origin shoot). Segment: 8–16px, direction =
  previous ± up to 40°, gentle outward drift; any segment that would
  enter the paper's rect or exit the stage turns away instead —
  clamped by reflection, never clipped mid-stroke.
- **Decay and cap:** every event grows to 200 segments; every 2nd to
  400; every 4th to 600; hard stop at 600 and 24 shoots. The rhizome
  NEVER removes a segment — forward-only, the app's own thesis in the
  ground.
- **Render:** per-segment path elements; each new segment eases in
  ~180ms (the house timing); `prefers-reduced-motion` appears
  instantly, no transition.
- **Rest color:** a new theme token `--rhizome-ink`, Plateau default a
  light brown one step above the desk ground — barely visible by
  design, per Nick's own words. Token-driven throughout: no Plateau
  literals in the component, so future themes reskin without touching
  the engine (the growth-form principle's mechanical half).

## S3 — the row in Rhizome style
With style=Rhizome, the progress row keeps its container, its measured
position (the origin anchor), and its ENTIRE rightSlot — page number
and timer identical to Bar style, the M1 R1 regression guarded by name
— while the linear track itself does not render. The background glow's
progress coupling is UNTOUCHED in both styles: the rhizome replaces
the line, never the light.

## S4 — the milestone burst (one grammar, B4's authority)
On the SAME events that already celebrate today (goal reached in
Words mode; nothing invented, no quarter-marks): a burst of +12
segments staggered ~600ms across live shoots, and the flash — every
path's stroke transitions to the theme's ember/orange token, holds
~400ms, eases back to `--rhizome-ink` over ~800ms, growth kept whole.
Timing and color read from the celebration grammar's existing
constants/tokens wherever they exist (M1's celebration machinery),
literals only where no token yet does — each such literal commented as
B4-provisional, so B4's ember-accent finish inherits the rhizome for
free. Reduced-motion: the flash becomes a single soft cross-fade to
ember and back, no strobe. Orange lane law holds: nothing orange at
rest, ever; the flash is evental and earned.

## S5 — harness (`m2.mjs`) + the bar
Determinism (same seed + same event count → byte-identical path data,
proven twice); growth on both unit settings (word and line); the
first-event root at the measured row midpoint; spawn-vs-extend both
observed on a seeded run; paper-rect avoidance and stage clamp at
1100 (floor, mandatory) / 1280 / 2200 — no segment point inside the
paper's rect, no overflow, no scrollbar introduced; decay schedule and
the 600/24 caps; burst + flash class lifecycle (ember on, held,
returned, segments retained); reduced-motion branch; the layer walk —
`pointer-events:none`, `aria-hidden`, zero interactive descendants;
rightSlot present and identical in both styles (M1 R1 guard); the
style control absent under Progress:Project; legacy default —
no stored style renders the Bar byte-identically to today. Park sweep
expected small (additive; any ProgressBar-track assertions that assumed
the track's unconditional presence park per A4 with live successors).
Full suite green, both `HARNESS_PARKED` settings. `tsc` ×2,
`build:web`, selftest.

## Non-goals
Cross-session persistence of growth (its own ticket if ever wanted);
rhizome under Progress:Project; other themes' growth-forms (the theme
arc is parked — this ticket cuts the token seam only); any numeric
readout inside the field; sound; any new celebration events; any
dependency.

## Invariants
Coverage never verdicts; one celebration grammar, B4 final authority;
nothing orange at rest; olive/orange lanes; every string through
deskLexicon; both-reference-widths + the 1100 floor on all geometry
asserts; the paper's rect is inviolate; zero schema, zero deps, server
census zero files; forward-only growth — the rhizome never un-grows;
report = push.

## Definition of done
Nick, after merge and his deploy word, on his own device: switches
Progress style to Rhizome and the track yields to quiet ground; writes,
and something faint begins at the middle and wanders — sometimes the
same shoot, sometimes a new one; keeps writing and the ground slowly
fills, never touching his paper, never asking to be looked at; hits his
goal and the whole living thing flares briefly ember and settles back
to brown, keeping every inch it grew; checks the clock and page number
and finds them exactly where they always were; switches back to Bar
and today returns untouched. Nothing counted him. Something grew.

— Fable, from Nick's commission and the eight rulings, 2026-07-21

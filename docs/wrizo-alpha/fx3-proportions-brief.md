# FX3 — the Proportions · build brief · 2026-07-17

**Branch:** `fx3-proportions` off `main`.
**Place at:** `docs/wrizo-alpha/fx3-proportions-brief.md`.
**Why:** Nick's desktop sitting — including a verdict he wrote into the
test page itself. **Zero schema, zero new deps.** Merge pre-authorized
(zero-schema rule); Fable reviews post-merge, gating close and
redeploy.

## S1 — the paper fills down

Far too much dead space below the paper on desktop. The paper's height
extends to fill the stage: bottom edge reaches within a small margin
of the stage's bottom (fence: 32–48px; tune). No fixed aspect, no
height cap short of the stage. The dead band below the frame goes with
it.

## S2 — the paper scales up on wide screens

The paper takes a larger share of a desktop viewport by SCALING — type
size and paper dimensions grow together, so the measure (readable line
length in characters) is preserved. Law 1's constant is the measure,
not the pixel width. Fence: scale factor ramps from 1.0 at ≤1440px to
~1.2 at ≥1920px (tune by eye on Nick's monitor; a CSS token, themes
inherit). Widening the measure itself is NOT in scope — that word is
Nick's alone if the scaled paper still isn't enough.

## S3 — the typewriter start, tuned by the page's own testimony

Nick's test page, verbatim finding: the text starts "too far down on
the page," reads broken to a fresh eye, and the first scroll engaged
late. Lower the start offset (fence: top of text block ≈ 30–35% of
stage height, from 45%; tune) and ensure the scroll/fade engages
within the first few lines of the band rather than lagging. Journal
start-offset carve-out unchanged (ink coordinates; standing ruling).

## S4 — the top bar, right-aligned (trial)

Modes right-aligned as a trial: the strip sits toward the right, Done
remains rightmost with clear separation. One-line revert if Nick's eye
rejects it — record as a working-value experiment, not law.

## S5 — the paper sheds the gear; the sliver's foot gains a row

The settings gear leaves the paper entirely. The sliver's foot gains a
quiet icon row beneath the goal block: the typewriter toggle as ICON
ONLY (the word "Typewriter" and the READING label text go; aria-label
keeps the word for assistive tech), the writing-settings gear, and a
NEW instruments icon opening a minimal panel for the progress bar and
glow — on/off, unit preference (words / lines / time), target value.
Working values; the committee pass refines the panel's final contents.
Resting icons quiet per the olive/orange law (brass only evental) —
sweep any resting brass in the sliver while here.

## S6 — harness (`fx3.mjs`)

Paper bottom within the fence of the stage bottom at 1280px and
2200px; scale token applied at wide and not at laptop; typewriter
first-line offset within the new band; no gear node on the paper; the
sliver foot row present with three icons and no "Typewriter" text
node; top-bar computed alignment right; instruments panel opens,
carries the three controls, and closes on keystroke (one vanishing
engine). Full suite green, both HARNESS_PARKED settings.

## Non-goals

The cascade (CD2 — awaits the committee pass and Nick's words); the
Wall (AB4 — re-scoped by the pass); any measure widening; canon edits.

## Invariants

Zero schema. The paper never reflows for chrome. Legacy below the
gate byte-identical. Geometry checks at BOTH reference widths
(standing law). deskLexicon for any new strings. Report = push.

## Definition of done

Nick, on desktop after redeploy: the paper runs nearly to the bottom
of his screen and reads larger without longer lines; a fresh
typewriter page starts high enough to look intentional; the top bar
sits right; the paper carries no chrome at all; the sliver's foot
holds three quiet icons, and the instruments panel answers to him.

— Fable, from the desktop sitting, 2026-07-17

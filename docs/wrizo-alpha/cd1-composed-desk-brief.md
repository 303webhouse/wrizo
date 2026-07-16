# CD1 — the Composed Desk · build brief · 2026-07-16

**Branch:** `cd1-composed-desk` off `main`.
**Place this file at:** `docs/wrizo-alpha/cd1-composed-desk-brief.md`.
**Authority:** the committee pass (`composed-desk-committee-pass.md`,
committed alongside this brief) as ratified by Nick, 2026-07-16: A3–A7
RATIFIED · Script in scope APPROVED · glow DEFAULT-ON · Catch SCRAPPED
from the UI (parked, not rehomed — Nick's word overrules the
committee's top-bar proposal).
**Zero schema. Zero new deps.** Merge pre-authorized (zero-schema
rule); Fable reviews post-merge, gating close and deploy.

## S0 — records first

Commit the committee pass doc; append amendments A3–A7 to
`page-and-homes-canon.md` with the ratification record (Nick's word,
2026-07-16); ledger: items 21/23/25 CLOSED on Nick's word (standing
vetoable rulings — Ruling 3's notebook, FX1's centered-start skip —
remain vetoable at any future sitting, block nothing); open item for
CD1.

## S1 — the top line

The mode strip moves to the frame's header row: FREE WRITE · DRAFT ·
REVISE · WORKSHOP · PUBLISH, engraved register (CSS presentation only;
canonical title-case strings untouched), olive hairline active,
left-set. **The top-bar title retires** — the paper names itself; the
drawer's Page face carries it. Right corner: **Done alone** (Catch is
scrapped from the UI per Nick's word — park the affordance and its
door wiring, never delete).

## S2 — the sliver

A slim grip riding the paper's left edge on every framed writing
surface (visible hairline tab + glyph; olive when open; focusable;
shortcut-bound — pick an unclaimed chord, document it in deskLexicon's
vicinity). Opens a ~200px vertical strip **overlaying** the stage
margin — the paper's rect NEVER moves (geometry law; assert it).
Contents = the mode's hand tools, moved whole from today's rail:
Draft's format/structure; Free Write's typewriter toggle, ink choices
(journal-furniture-lawful pages only), forward lock (mode furniture,
everywhere), capture items (journal-lawful only). Foot = the goal
block: timer as one quiet numeral line (`--text-mid`), the 2px
progress hairline beneath, one inline goal edit. Keystroke dissolves
the open sliver (the one vanishing engine — no second implementation);
the grip persists. Boards' notecards exempt (Nick's rider, standing).

## S3 — the drawer slims

The tools face retires. The drawer rests on the **Page face**; faces =
Page and Places only. Fixed geometry byte-identical across both faces
(re-floor the assertion). Nothing else about the drawer changes.

## S4 — the far-left rail retires (framed only)

`.desk-rail` no longer mounts on framed surfaces (≥1100px). Legacy
below the gate keeps it byte-identical — the retirement is framed-side
only. Library's stub leaves with it (no empty doors). The resume
pointer's interim home is the drawer's Journal place face (already
lists recent); its final home is the HB-arc's landing question —
recorded, not solved here.

## S5 — composition on wide

The frame (drawer | stage | wall-track) caps at a working max
(fence: `--frame-max: 1720px`, tune on Nick's monitor) and centers;
the desk-ground texture owns the outer field. **The corkboard track
adopts the FX1 S5 law: renders only with content** — nothing passes
content yet, so it renders nothing until AB4's Wall claims it. Paper
centered in stage; the sliver lives in the margin centering creates.

## S6 — the goal system (glow by default — Nick's word)

One writer-level target in **line-equivalents at the paper's canonical
measure** (hard newlines + soft wraps computed against the canonical
width, viewport-independent; a poem's short line counts 1). Stored in
writingSettings (zero-schema). **Default target ships** (fence: 24
line-equivalents); the inline edit changes it; clearing it disables
every instrument. Instruments, on any page where a target exists:
the progress hairline (sliver foot) and **the glow** — a warm radial
behind the paper mapping to progress fraction, hard-capped (fence:
the cap is a subtle halo; define as a CSS token so themes can dial it
but never exceed it — the field never burns), easing to rest at full.
**No numbers announced, no completion event, no deficit state, no
color shift at arrival — fullness is the only arrival.** The HB-arc's
first-run gate will reuse this glow; build it as the one
implementation.

## S7 — Script joins; ToolRail dies

ScriptEditor gains the drawer (Page + Places faces on script pages)
and the sliver (script hand tools: structure, typewriter, forward
lock). With Board's track already bare, **the ToolRail component
retires entirely** — the sliver and the drawer divide its estate.
Board's own drawer/sliver stays AB4 (with the pageKind cleanup, per
Ruling 2's carry, now shrunk).

## S8 — loose pages open in Free Write

`origin === 'loose'` only; other untyped support pages keep Draft.
(FX1 review finding 4, committee-settled, ratified in A7.)

## S9 — harness (`cd1.mjs`) + the park sweep

- Geometry: paper rect byte-identical with sliver closed/open/dissolved;
  drawer track byte-identical across Page/Places; frame centered with
  symmetric outer margins at a wide viewport (set viewport ≥ 2200px for
  the check).
- Top line: exact engraved labels; no title node in the header; Done
  present; no Catch affordance anywhere framed.
- Sliver: grip present on prose AND script framed pages; open carries
  the mode's tools (spot-check format in Draft, forward lock in Free
  Write on a loose fixture — set the mode explicitly, the FX1 lesson);
  keystroke dissolves; grip persists; goal block present with a target,
  absent when cleared.
- Glow: with the default target, partial progress yields the glow
  element with intensity var between 0 and the cap; simulate full —
  intensity == cap, and NO new DOM (no toast, no event node) appears at
  arrival.
- Loose fixture: active mode tab is Free Write on first mount.
- ToolRail: zero `.desk-toolrail` nodes on any framed surface.
- **The park sweep:** the rail's retirement and ToolRail's death
  falsify live checks across ab1/ab2/ab3/fx1 and older j/s harnesses
  (every `.desk-rail` presence assert, the zones check's wayfinding
  clause, every `.desk-toolrail-*` selector assert). Park EVERY
  falsified check per A4 — quoted verbatim, SUPERSEDED species,
  opposite or successor reassertion live — in each check's own file.
  Enumerate the full sweep in the fold's commit message. This is the
  largest park in the project's history; the discipline is the ticket's
  real test.
- Full suite green, both HARNESS_PARKED settings.

## Non-goals

AB4 (the Wall, Board's drawer/sliver, pinned glance); the HB-arc's
arrival/landing; theme dialects for sliver and glow (theme arc); any
AI-assistant surface (parked at Nick's word — requires its own
committee pass against the anti-slop canon before design begins);
Catch's future home (parked, undecided).

## Invariants

Zero schema. Legacy <1100px byte-identical (rail retirement and all
chrome changes are framed-side only; S1 typewriter feel from FX1
already lawfully spans both). One vanishing engine. Olive/orange
lanes: grip olive-when-open, glow is warmth never brass, nothing
orange at rest. Anti-solicitation: the grip invites nothing, the goal
never asks, empty states never beg. Every new string rides
deskLexicon (Flux coherence pass included). The paper never reflows
for chrome. Report = push; one commit per slice or sensible grouping.

## Definition of done

Nick, on the live deploy (redeploy on his word after Fable's
post-merge review): modes on the top line and the paper naming
itself; the grip at the paper's edge opening his hand tools with the
timer and hairline at its foot; the drawer resting on the Page face;
the far-left rail gone and nothing missed; his wide monitor showing a
composed desk — more wood, not more furniture; the glow warming as he
writes toward the default goal and resting quietly at full; the
screenplay page carrying the same drawer and sliver as prose; a fresh
loose page opening in Free Write.

— Fable, from the ratified committee pass, 2026-07-16

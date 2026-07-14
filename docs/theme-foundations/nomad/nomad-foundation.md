# Nomad — Theme Foundation

**Place at:** `docs/theme-foundations/nomad-foundation.md` (folder convention set by the
Volant chat's Theme Foundation work — if its folder name differs, this file moves to match
at relay time). **Status: TENTATIVELY APPROVED** by Nick, 2026-07-14 — a pre-canon
consolidation, complete enough to graft Nomad onto a more mature app without access to the
originating session. The binding canon doc ships after the open verdicts in §10 close.
Governing framework: `docs/flux-theme-canon.md` §1 (a theme is four maps and zero forks:
token remap + lexicon map + effects layer + font slots, riding the CSS-variable seam).
**Normative visual reference: `docs/design/nomad-rc3.html`** — where this prose and RC-3
disagree, RC-3 wins pending errata. Committee double-pass ran 2026-07-14 (Experts /
Architects / Marketing, propose → critique → single recommendation); trims recorded in §8.

---

## 1. What Nomad is

**The roster (five stages, not four):** Plateau · Flux · Machina · Nomad · Volant.
A deterritorialization gradient, not a catalog — Nick's canonical progression. Register
line: **Plateau settles, Flux agitates, Machina recedes, Nomad ranges, Volant lifts.**
Volant was not retired; it was promoted to the fifth and likely final stage (near-white,
free of color and shape — built in a parallel chat). Nomad is the fourth.

**Nomad is the roster's only land.** Plateau is a desk, Flux a console, Machina an
instrument room, Volant has no terrain at all. Nomad alone is ground, horizon, weather.
Grounding: Deleuze & Guattari's Nomadology (smooth vs. striated space, the war machine
exterior to the State, rhizome vs. arborescence).

**The thesis — no imposed grid, deep custom.** Smooth space is not lawless: nomads are
custom-rich and grid-free. What Nomad sheds is grid *emphasis* — the faintest hairlines
in the roster, the most aggressive chrome fade, the quietest labels, no boxes, no borders.
Page primacy, the way back, the two-verb law all stand: those are the customs. The walls
come down; the floor stays. Sell freedom-within-form, never "no rules" (Marketing panel,
on record).

**Night doctrine: the fading sun and the fire — never starry night** (Nick's ruling).
The Nomad drifts to sleep with the last light or writes by a fire with shadows on the
rock. This ruling retired the BLUESHIFT board (indigo "eternal blue sky" night — starry
by construction) and re-storied REDSHIFT's red-black night as firelight. Blue is banned
from Nomad's night fields.

**Points subordinate to the path.** The water point is reached only to be left behind.
The hand-drawn mark encodes it (§4): a line that threads the O and keeps going, hook
behind, point ahead. Process over destination, drawn.

**Menu register (Nick's ruling):** circles and triangles drawn in the sand with a stick,
not machinery built by other machines. Geometric but without Machina's defined boundaries
and utility. Freedom and simplicity.

## 2. Variants — the Machina-pattern toggle

Nomad ships **two user-toggleable palette variants** (per Nick, mirroring the Machina
precedent; no single winner is picked):

- **STEPPE** — green days, fire nights. Renamed from REDSHIFT on Nick's word (the board
  had gone green-day/red-night; Savannah was considered and rejected — wrong continent;
  Steppe is the Nomadology's own terrain). On-record flag: "Steppe" echoes "Plateau's"
  landform register — different tiers (variant vs. theme), accepted.
- **AFTERGLOW** — the fading sun. The sky ten minutes after sundown; magenta-rose night.

**Benched candidate:** SAXAUL ("the living scrub," green persists day and night) — Nick
liked all three boards; SAXAUL is preserved in §3 as a possible third variant, no
commitment. **Retired:** BLUESHIFT (starry-night, off-thesis).

**TH1 seam flag:** the variant toggle graduates from RC-meta control to a real per-theme
setting — the theme seam needs a per-theme variant slot (see §11).

## 3. Tokens

Single hard invariant across all themes: **accent `#FF9800`**. Nomad's four sanctioned
orange placements: **wordmark · caret (craft) · active-tab marker · Relay (Publish)**.
Orange means *the writer acted* and nothing else. Adjacency rule: no dim/mark token may
approach `#FF9800` in hue-and-luminance.

**Two-lane color doctrine** (vs. Flux's four lanes): **the land** (every field token,
including the glow at every level) **and the writer** (orange). System states borrow the
land's mark color. Fewer lanes *is* smooth space.

### STEPPE (v2)

| Slot | NIGHT | DAY |
|---|---|---|
| ground | `#140708` | `#F5F4E6` |
| panel (chip bg) | `#200D0E` | `#EDECD8` |
| ink | `#F0E9D6` | `#333A24` |
| muted | `#C9A98A` | `#6E754F` |
| faint | `#8A6450` | `#A7AC85` |
| dim (ticks/rules/sel-bg) | `#8C2F3F` | `#7E8C5F` |
| hairline | `rgba(240,233,214,.10)` | `rgba(51,58,36,.16)` |
| track | `#351216` | `#D8D8BE` |
| pubink (on orange) | `#2A100C` | `#2E2413` |
| selection bg / text | `#8C2F3F` / `#F0E9D6` | `#E1E4C8` / `#333A24` |
| glow | `rgba(200,70,60,.38)` | `rgba(190,170,100,.14)` |
| mark (wordmark color) | `#B7BC9A` | `#6E754F` |

### AFTERGLOW (v2)

| Slot | NIGHT | DAY |
|---|---|---|
| ground | `#1E0D15` | `#F6F0DE` |
| panel | `#2C1220` | `#EFE7CE` |
| ink | `#F4E4D6` | `#40381F` |
| muted | `#D0A0A6` | `#7A744D` |
| faint | `#96606E` | `#ABA37E` |
| dim | `#9E3A55` | `#85894F` |
| hairline | `rgba(244,228,214,.10)` | `rgba(64,56,31,.16)` |
| track | `#3A1626` | `#E4DCC0` |
| pubink | `#2A1208` | `#2E2413` |
| selection bg / text | `#9E3A55` / `#F4E4D6` | `#EAE6C9` / `#40381F` |
| glow | `rgba(210,80,90,.36)` | `rgba(200,175,105,.15)` |
| mark | `#B7BC9A` | `#7A744D` |

### SAXAUL (benched, RC-1 values)

| Slot | NIGHT | DAY |
|---|---|---|
| ground | `#10120B` | `#F5EDD6` |
| panel | `#1A1D12` | `#EDE4CC` |
| ink | `#EFE7CB` | `#3B3120` |
| muted | `#BDB088` | `#7D6F51` |
| faint | `#7E7B5F` | `#ACA07F` |
| dim | `#41603C` | `#5F7C4B` |
| hairline | `rgba(239,231,203,.10)` | `rgba(59,49,32,.16)` |
| track | `#232816` | `#E4DCC3` |
| pubink | `#291607` | `#2A1F0E` |
| selection bg / text | `#41603C` / `#EFE7CB` | `#E6E3C8` / `#3B3120` |
| glow | `rgba(150,80,40,.30)` | `rgba(200,170,110,.13)` |

Palette history: v2 applied Nick's direction "more olive green in the daytime, more
reds/oranges/magentas at night." Known consequence, accepted for now: the two day fields
converged (both olive-forward; they differ in ground temperature — STEPPE cooler
cream-green, AFTERGLOW warmer sand). STEPPE v1's sage-celadon night ramp was traded for
the warm ramp; if missed, it returns as a variant, not a revert.

**Nomad has no `page` token: the page is the ground.** The prose column sits directly on
the field — no panel, no border, no edge (proposal shipped in RC-1..3; verdict pending).
"The steppe has no fences."

## 4. The mark

**Origin:** hand-drawn by Nick in pen (photo `16938.jpg`), traced with wobble intact —
doubled strokes, the coil's overlap, jag caps. Never geometric-perfected. The O-device —
a coil-drawn circle pierced by one long line entering under a hooked terminal and exiting
through a small eyelet to a fine point — is the thesis drawn (§1).

**Extraction pipeline (reproducible):** illumination-flatten (divide by σ=60 Gaussian
background), luminosity threshold ramp lo=.45/hi=.75 with smoothstep, connected-component
cleanup — first by area ≥200px, then by **max inscribed stroke thickness** (pen runs
20–40px at source res, ruling fragments 4–10px; threshold R≥6 removed thirteen strays
with zero risk to lettering).

**The polarity lesson (hard-won):** this project's `potracer` build traces **zero-pixels
as foreground**. The first vector export shipped as a 96%-filled slab with letter-shaped
holes ("solid orange background"). Standing rule: **every vector export of the mark is
gated numerically** — rasterize the SVG back and require fill-fraction ≈ source and
IoU ≥ .8 against the source bitmap. Never trust the eyeball alone on this asset.

**Assets (all in the relay batch, §13):**
- `nomad-mark.svg` — master trace, full fidelity, `fill="currentColor"` (one asset; the
  theme colors it via CSS). IoU .90. ~380 KB — every hesitation of the pen; a lighter
  simplification pass is available if chrome weight ever matters.
- **Bold chrome plate** (inlined in RC-3): full-res plate dilated +6px (~3× ink), traced
  at 0.30 scale, IoU .962, 18 KB. Use this weight at header scale; the fine master fuses
  below ~40px tall.
- Colorway PNGs (exact raster ink-lifts, transparent): orange `#FF9800`, sage `#B7BC9A`,
  cream `#EDEFD9`, white, ink-olive `#333A24`. (`nomad-mark-colorways.png` proof sheet
  predates the v2 grounds — marks valid, sheet swatches stale.)

**Mark color, ruled:** olive, field-aware — **sage `#B7BC9A` at night; the variant's deep
olive by day** (`#6E754F` STEPPE / `#7A744D` AFTERGLOW), because sage vanishes on sand.
Bold plate mandatory at chrome scale.

**Two-tier rule:** the mark is the writer's hand (orange *allowed*, olive chosen); the
**ornament dialect derived from it renders only in the land's colors (dim/faint) — never
orange.** Orange scarcity is the point.

**Per-stage marks program (Fable's call, unchallenged):** each stage ships a Nick-hand
mark in its register as the default wordmark until the writer replaces it with their own
(extends ledger item 14's replaceable-wordmark seam). In-app chrome only; the external
brand (site/blog/stores) keeps the one production mark.

## 5. The glyph dialect — stick-drawn geometry

**Five moves derived from the mark:** the pierced circle, the hook terminal, the eyelet,
the coil-stroke, the jag. Strictly geometric and abstract — landscape grounds the theme;
the culture is not costume (no lifted ornamental patterns).

**Implementation (production-viable, not a mockup trick):** clean geometry warped through
an SVG displacement filter. Stroke spec: `fill:none; stroke:currentColor;
stroke-width:1.7; stroke-linecap:round` (waypoints 1.6). Filters:

```svg
<filter id="sand"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.026"
  numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>
<filter id="sandx"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.016"
  numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.4"/></filter>
```
(`#sand` for 24px glyphs; `#sandx` for long strokes — tab underline, dune arc.)

**Glyph inventory (24×24 viewBox; authoritative path data lives in RC-3):**
Camp = open triangle · Fireside = smoke spiral · Leaves = three written lines ·
Route = meander threading two waypoint circles · Script = alternating-indent strokes ·
Drift = a single unmarked meander (the line of flight) · Waybook = open book arcs ·
Vista = three-stroke fan · Clearing = wobble circle + three stone-dots · Cairn = three
stacked stones, shrinking upward · Saddlebag = open basket + handle · Bundle = tied
pouch · Way-back chip = arc-arrow · Relay = the mark's pierced-circle device,
miniaturized · Orbit tools: Timer (circle + gnomon), Scroll (line + held circle),
Voice (quill stroke + nib flick), Fade (line dissolving into dots).

**Waypoint states on the sprint bar** (skin only — read-only beat coverage per
`docs/progress-milestones-canon.md`, never verdicts): **passed = pierced circle** (the
path went through it), **current = kindled** (center dot), **ahead = open ring** (faint).

## 6. Lexicon — the journey register (display-only)

Per the Flux lexicon law: canonical nouns persist in data, schema, routes, sync, search;
a single-source lookup maps to display strings. Zero-schema.

| Canonical | Nomad |
|---|---|
| Home | **Camp** |
| Journal | **Fireside** |
| Pages | **Leaves** |
| Plan | **Route** |
| Script | Script |
| Free-write | **Drift** |
| Notebook | **Waybook** |
| Spread | **Vista** |
| Board | **Clearing** |
| Shelf | **Cairn** |
| Drawer(s) | **Saddlebag** |
| Binder | **Bundle** |
| Boxes | **Stones** |
| Milestones | **Waypoints** |
| Publish | **Relay** — the single sanctioned verb rename (the water point left behind) |
| Voice Wall | **the Watch** — speaks only when it acts ("THE WATCH · PASTE TURNED AWAY"); no persistent chip (Flux §12 pattern) |

**The fenceless nav (ruled):** no group labels anywhere — "Rooms" and "Furniture" were
rejected as antithetical (no boundaries, no permanent possessions). Two clusters
separated by whitespace only: *Camp Fireside Leaves Route Script Drift* · gap ·
*Waybook Vista Clearing Cairn Saddlebag Bundle*. The gap is custom; the label was the
State. **Fallback if unlabeled clusters fail wayfinding: "The Going" / "The Carried"**
(drop-in, no rework). Rejected alternative on record: verb-labels (Go/Keep/Send) — right
instinct, wayfinds badly.

## 7. Typography (trial — device verdict pending)

| Slot | Nomad |
|---|---|
| chromeLabel | **Julius Sans One** — monoline geometric caps (near line-art letterforms), letter-spaced ~.2em, uppercase. Single weight 400: acceptable for labels, flag on record. |
| contentLabel | **Alegreya Sans** (humanist, calligraphic roots) |
| proseSerif | **Crimson Pro** (voice-continuity law across themes) |
| proseSans | **Alegreya Sans** |

Ships via fontsource packages (Courier Prime / S1 precedent). Endurance verdicts join the
consolidated hardware session.

## 8. Effects layer

**Ambient doctrine inherits Flux §6's two classes:** TEXTURE damps while typing;
RESPONSE persists — writing steadies the light. The page is the only stable signal;
everything renders behind it, transform/opacity only, zero layout participation.

**Chrome fade (live in RC-3, W1 constants):** typing dissolves chrome — header, rail,
tool orbit, entry tag, footer, dune texture — to **5% opacity over 0.7s**; restore on
**4.2s idle** or pointer intent (return transition ~1.4s). **The glow persists while
typing — the fire does the remembering.** Proposal standing with the Architects: fade
constants ride the theme map as themed values on W1's dissolve machinery — Nomad runs
the slowest fades in the roster. Compose, don't rebuild.

**Glow (RESPONSE):** radial ember pool anchored low behind the prose (fixed, bottom
-center, ~132vw × 48vh, `radial-gradient(ellipse at 50% 100%, var(--glow), transparent
62%)`), breathing 7.5s ease. Per-variant colors in §3. **Ember ceiling: the glow warms
toward deep red/rose but never approaches `#FF9800`** — the horizon is the land's warmth;
orange is only ever the writer. **Ratified design intent not yet in RC:** the horizon
walks noon→dusk with sprint progress ("follow the sunset"), same machinery class as
Flux's progress glow — predictable, never variable. RC-3 ships the static dusk state.

**Texture dialect: the sparsest in the roster — emptiness is the dialect.** Rare, slow,
singular events only (a dune-shadow drift over minutes; a tumbleweed-class event every
40–90s at dial-center; nothing else). RC-3 carries one static dune arc at 6% opacity as
the placeholder. All texture damps while typing.

**Committee trims (Pass 2, on record):** literal layout anarchy (dies on page-primacy
canon *and* zero-forks); continuous ambient sand motion; wall-clock-reactive sunset
(punishes night writers — progress-linked is the honest version).

**Guardrails (unconditional):** nothing above 3Hz; `prefers-reduced-motion` zeroes
texture and animation; rewards predictable-never-variable; no scores/streaks/leaderboard
mechanics; one celebration grammar app-wide, B4 the final authority; S0 hard gates,
zero-schema, read-only projections, token seams.

## 9. Structure proposals riding with the theme

- **Borderless page** — no page panel/border; prose column (~60ch) directly on ground.
- **Fenceless nav** — §6.
- **Tool orbit** — Timer / Scroll / Voice / Fade as stick glyphs at the page's right
  edge; fades with chrome (tools orbit the page; page primacy).
- **Tabs** — Workshop / Relay; active tab marked by a hand-stroked orange underline
  (one of the four sanctions).

## 10. Open verdicts (Nick's eyeball / hardware session)

1. **Fireside** as the Journal rename — the boldest lexicon call; entry tag in RC-3
   reads "Fireside · The Long Crossing" to feel it in place.
2. **Unlabeled-cluster wayfinding** — fallback labels staged (§6).
3. **Fonts** — Julius Sans One legibility/endurance; Alegreya Sans; long-session verdict.
4. **Day-field convergence** — STEPPE vs. AFTERGLOW days differ mainly in warmth; is
   that enough?
5. **SAXAUL** — third variant or archive?
6. **Borderless page** — freedom or something missing?
7. Glow strength/breathe at night; olive day-mark values; bold-plate weight on hardware.

## 11. TH1 / seam flags

1. **Per-theme variant slot** (STEPPE/AFTERGLOW toggle as a real setting — Machina
   precedent).
2. **RESPONSE layer shape**: parameter (radial pool vs. low horizon band) or new
   primitive? Nomad wants the band eventually.
3. **Texture dialect**: pluggable renderers in the one compositor layer, or Flux's
   renderers with config? Nomad's events are new renderers.
4. **Fade constants as themed values** on W1 machinery.
Per flux canon §1, a theme joins as pure data unless it wants new effect primitives —
items 2–3 are exactly that question; small either way, named here so TH1 answers them.

## 12. Ledger notes (for the CC relay)

- Horizon item 14 roster annotation: **five stages** — Plateau · Flux · Machina · Nomad ·
  Volant (Volant promoted to fifth, near-white, built in a parallel chat; "Volant/Nomad
  as the remaining pair" is superseded). **Coordination: the roster line lands once** —
  whichever Foundation doc (Volant's or this one) reaches `main` first carries it; the
  other references it (J5 item-3 conflict-class lesson).
- Nomad Foundation landed at `docs/theme-foundations/nomad-foundation.md`; visual ref at
  `docs/design/nomad-rc3.html`; mark assets under `docs/theme-foundations/nomad-assets/`
  (or the brand-asset home of record).
- Nomad build remains **unscheduled** — grafts after the writing-experience bones mature;
  queue position is Nick's.

## 13. Asset manifest (this relay batch)

| File | Destination | Note |
|---|---|---|
| `nomad-foundation.md` | `docs/theme-foundations/` | this document |
| `nomad-rc3.html` | `docs/design/` | **normative** — variants, fade, lexicon, glyphs live |
| `nomad-rc2.html` | `docs/design/` | superseded (writable+fade debut, Rooms/Furniture era) — optional archive |
| `nomad-rc1.html` | `docs/design/` | superseded (3-board comparison incl. SAXAUL live) — optional archive |
| `nomad-mark.svg` | assets home | master trace, currentColor, polarity-fixed, IoU .90 |
| `nomad-mark-{orange,sage,cream,white,ink-olive}.png` | assets home | raster ink-lifts, transparent |
| `nomad-mark-colorways.png` | assets home | proof sheet; ground swatches predate v2 |

*Everything above was decided in the Nomad design session of 2026-07-14. Anything not
recorded here or in RC-3 was not decided.*

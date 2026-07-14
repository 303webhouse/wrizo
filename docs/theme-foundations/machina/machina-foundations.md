# Machina — theme foundations

**Status:** LOCKED — Nick's word, 2026-07-14. Design arc closed; build NOT armed.
**Location:** `docs/theme-foundations/` (beside `machina-rc1.html`, this doc's
normative visual twin, and the sibling theme foundations).
**Consumers:** the future agent who authors the TH-Machina build plan, and the
committee that reviews it. This document plus the RC is sufficient to build the
theme without access to the design chats.
**Authority chain:** `docs/flux-theme-canon.md` binds all themes; this doc
supplies Machina's four maps and theme-scoped laws; `machina-rc1.html` is the
normative visual reference — **where this prose and the RC disagree, the RC
wins.** The sibling arc document (`theme-arc.md`, this folder) owns theme-arc
mechanics (order, unlock, disclosure); this doc owns Machina only.

---

## 0. Orientation protocol for the future agent

1. **Ledger first.** Read `docs/open-threads.md` from the repo before trusting
   anything, including this doc's sequencing claims. Fable's internal state can
   be a working day behind; the ledger is truth.
2. **Do not arm from this document.** Nick is doing app-bones work before
   themes are grafted. The TH-Machina build plan is authored on his word only,
   and queues behind the theme-seam work (TH1) and Flux (TH2) at minimum.
3. **Canon before build.** Read `docs/flux-theme-canon.md` in full. Machina
   introduces **no new effect primitives**, so per canon §1 it needs no
   conformance committee pass — the aesthetic pass closed 2026-07-14. Any
   deviation from this doc that adds a primitive reopens that question.
4. **Open the RC in a browser** and live in it before writing the plan. Type
   past the 30-word sprint, ride both temperaments, both paper pairs, both
   voices.

---

## 1. Position in the arc

The canonical progression: **Plateau → Machina → Flux → Nomad → Volant.**
Machina is the second territory — the utilitarian instrument between the home
desk and the dystopian city. Arc mechanics (ordering, unlock, progressive
disclosure under the M1 anti-gamification frame) are `theme-arc.md`'s lane;
nothing in this doc creates an unlock condition or a verdict surface.

Register: business, academic, and technical writing — high-stakes content
whose audience judges (committee, client, editor, regulator). The largest and
most theme-skeptical user segment; Machina is the theme for writers who would
bounce off Flux entirely.

## 2. Philosophy — the fiction is function

**Thesis:** *Plateau = the quiet desk; Flux = the live city; Machina = the
machine's room — output owns it, and the human persists in sparks.*

Nick's framing, canonical (2026-07-14): output and efficiency take priority;
the human recedes; orange persists only as sparks — hints — of humanity in the
machine.

Differentiation from Plateau (the design's central problem, solved as
follows): both themes are quiet, in different registers. Plateau's quiet is
**warmth** — calm, domestic, your own desk. Machina's quiet is **neutrality**
— precision, professional, the instrument. The room carries zero affect so the
writer's judgment is the only judgment in it.

Deleuzian grounding (the name survives the 100th-use test without this, but
the philosophy is load-bearing for anyone who digs): *Anti-Oedipus* opens on
machines — a machine defined by nothing except what it produces; it does not
express, does not signify, has no face. It works. Machina is the interface as
pure machinic function. The human is the residual flow in the apparatus, and
orange marks wherever desire still cuts in. The mark says it in one glyph
(§7): the O — the human — squared off by civilization. Names considered and
declined at concept stage: Axiom (D&G's capitalist axiomatic — named the
register, not the room), Stratum (striated space — drifted into the terrain
lane).

## 3. The two temperaments — Machina's central mechanism

One control, **CAST**, values **COOL | NEUTRAL**, default **COOL**. The
temperament governs the ladder, the system-accent color, and the sparks, as
one bound decision (Nick's rulings, B3–B4; the earlier STEEL and SPARK
controls were retired into it):

**COOL (default) — the machine.** Cool-cast ladder (~2% blue). All
`line-active` carriers — focus rings, the active tab underline, the rail
active edge — speak **steel `#7FA0BC`**. Sparks OFF. Orange exists only at
positions, completions, Publish, and the mark (§5).

**NEUTRAL — the human.** True-neutral ladder. The same `line-active` carriers
go **theme orange**. Sparks ON: the selection wash and the way-back glyph.

CAST is **Machina-scoped** — it must not leak into other themes' preference
surface. Where theme-scoped prefs live in the settings model is a seam
question for the build plan (§13). The control label is CAST as shipped in the
RC; its user-facing presentation is a build-plan detail.

## 4. Token pack — both temperaments

Semantic slot names below match the RC. Production re-points Plateau's
material-named variables under `[data-theme="machina"]` per TH1 Slice 0
(zero component edits); `--brass` IS the orange invariant. `line-active` and
`signal-live` are the TH1-minted carrier-less slots.

**COOL (default):**

| Slot | Value | Slot | Value |
|---|---|---|---|
| ground | `#0A0B0E` | ink (room) | `#E6E9F1` |
| chrome | `#12141A` | meta | `#878E9C` |
| rail | `#0E1015` | muted | `#6C7482` |
| line | `#252933` | page (dark) | `#16181F` |
| line-strong | `#343A46` | page-border (dark) | `#2F3541` |
| **line-active** | **`#7FA0BC` (steel)** | page-ink (dark) | `#E6E9F1` |
| signal-live | `#9DA5B4` | page (light) | `#F8F9FC` |
| accent | `#FF9800` (invariant) | page-border (light) | `#D3D8E1` |
| | | page-ink (light) | `#13161C` |

**NEUTRAL:**

| Slot | Value | Slot | Value |
|---|---|---|---|
| ground | `#0A0A0A` | ink (room) | `#E9E9E9` |
| chrome | `#121212` | meta | `#8A8A8A` |
| rail | `#0E0E0E` | muted | `#6F6F6F` |
| line | `#242424` | page (dark) | `#161616` |
| line-strong | `#333333` | page-border (dark) | `#2E2E2E` |
| **line-active** | **`#FF9800` (= accent)** | page-ink (dark) | `#E9E9E9` |
| signal-live | `#A3A3A3` | page (light) | `#FAFAFA` |
| accent | `#FF9800` (invariant) | page-border (light) | `#D6D6D6` |
| | | page-ink (light) | `#141414` |

Scoping law learned in mockup revision (encode it): **page ink is independent
of room ink.** The Page pref flips only `page`, `page-border`, `page-ink`;
chrome text never inherits the paper's ink.

## 5. Orange doctrine — the spark law (Machina-scoped)

Orange is the human. Sites are enumerated as classes, not a count:

- **Positions** (both temperaments): the prose caret (`caret-color` on every
  editable — "the only color in the room is where you are") and the sprint
  bar's caret notch ("the human's position in the work"). The notch is orange
  in flight and at rest; it never takes steel.
- **Completions** (both): the celebration surge; the bar rests orange after.
- **Publish** (both): the human's act, per cross-theme precedent.
- **The mark** (both): the wordmark O-square (§7).
- **Touches — the sparks** (NEUTRAL only): the selection wash
  (`rgba(255,152,0,.22)` on dark paper, `.28` on light) that exists only while
  the hand is on the words; and the way-back — the return chip's `◂` glyph —
  memory as the human residue. Under COOL both revert to gray
  (`rgba(190,190,190,.28)` dark / `rgba(0,0,0,.13)` light; glyph inherits).

Scarcity doctrine: the world speaks grayscale — cool or neutral — and orange
is only ever the human. A benched candidate, recorded so it isn't re-litigated:
an orange focus ring (attention-as-spark) — rejected because it fires on
system chrome and spends the scarcity budget on toggle buttons.

## 6. Typography — locked

| Slot | Face | Notes |
|---|---|---|
| chromeLabel | **IBM Plex Mono** 500 | uppercase, 10–11px, tracking .08–.11em — the readout voice |
| contentLabel | **IBM Plex Sans** 400/500/600 | rail items, buttons, wordmark |
| proseSerif | **IBM Plex Serif** 400 (+500, i400) | locked via Nick's blanket approval of the RC state |
| proseSans | **Atkinson Hyperlegible** 400/700 | decided by name (B4) — the humane typeface as the human's voice |

**Prose size: 11pt, both voices** — set in points, document-world units
(Nick's ruling). Serif line-height 1.75, sans 1.8. Titles 17pt serif / 15pt
sans. Calibration note for the hardware gate: Atkinson's x-height runs large;
if 11pt reads big on glass, the agreed fallback notch is **10.5pt** — Nick's
device verdict decides, not the build agent.

Fonts ship as fontsource packages, never runtime CDN (canon law; the RC's
Google-CDN link is a standalone-demo exception): `@fontsource/ibm-plex-mono`,
`@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-serif`,
`@fontsource/atkinson-hyperlegible`. Verify availability at build time.

## 7. The mark — the O-square

The wordmark is **WRIZ + an orange outlined square as the terminal O**. The
mark and the wordmark are one object; the brand's spark sits inside its own
name. Nick's reading, canonical: **the human, squared off by civilization.**

Spec (scale-relative, from the RC at 13.5px wordmark): side ≈ **0.70em** of
the wordmark size (9.5px), stroke ≈ **0.15em** (2px — matched to the
600-weight caps), seated **on the baseline** at cap height (inline-block,
`vertical-align: baseline` — the earlier below-the-line rendering was a bug,
fixed in B3), ~2px gap after the Z (the wordmark tracks at .06em). Wordmark
face: IBM Plex Sans 600, ls .06em.

Lane note: the app's production mark remains the hand-drawn logo (Journal
origin). The O-square is **Machina's wordmark treatment**; its interplay with
the hand-drawn mark is a launch-branding item (ledger horizon 14), not a
build-plan concern.

## 8. Chrome geometry & the hairline law

Grid: fixed tracks `52px / 1fr / 56px` rows, `176px / 1fr` columns — no
layout shift from any effect, ever. Page: max 720px, padding 58/66/70,
min-height 620, bordered sheet on the ground; page metadata right-aligned
beneath the page (page-primacy: metadata fades with chrome, the page never
does). **Hairline law:** every active marker in the chrome is 1px — the tab
underline and the rail active edge match (Nick's ruling, B4). Square corners
and solid borders throughout — the v1 floor, which Machina wears natively.
Sprint track 240×4px.

## 9. Lexicon — the identity map

**Zero renames. Zero verbs.** Every canonical noun (Journal, Pages, Plan,
Board, Shelf, Milestones, Publish, Voice Wall, …) appears as itself. The
refusal is the theme statement: for this user, renames are frills — *your
journal is called Journal.* The Voice Wall speaks canonically on its blocking
events (`VOICE WALL · PASTE BLOCKED`), guard-speaks-when-it-acts, no
persistent status chips. Conformant with canon §5 by triviality: the display
projection is the identity function — but the build plan must still register
the (identity) lexicon map explicitly rather than skipping registration.

## 10. Effects — the empty layer, and the one celebration

**TEXTURE class: none.** Machina ships at Ambiance-dial-0 aesthetics by
nature; `prefers-reduced-motion` and the dial have almost nothing to zero.
**RESPONSE class: exactly one element** — the app-wide celebration grammar
(B4 celebration canon remains the finish authority), skinned gray→orange:

| Constant | Value |
|---|---|
| sweep | .55s ease-out; 36%-width band, gradient transparent → light gray (.85) → accent |
| fill handoff | background-color .35s ease (signal-live → accent); bar rests orange |
| burst | 8 hairline ticks 9×1px, angles −90°…+90° in ~26° steps, .6s ease-out, 20ms stagger |
| total | ≈1.15s (hard cap 1.6s); identical every time; peripheral; zero layout shift |
| celebrate-summon | bottom bar defies the chrome fade for 2.5s |
| reduced motion | sweep and burst skipped; crossfade handoff only |
| notch pulse | 1.8s ease-in-out, opacity 1↔.4 — the sole repeating motion (<3Hz floor holds); solid after completion |

Chrome fade (cross-theme behavior, Machina's constants): typing fades all
chrome + page metadata to opacity .05 over .7s; idle return after 4.2s at
.9s; any pointer movement summons immediately; FADE·OFF disables. Wall chip:
fixed, top-center, .18s ease in/out, visible 2.2s. Sprint fill width .25s
ease. Selection alphas per §5.

## 11. Preferences

Cross-theme matrix (canon §11) — Machina supplies: **Voice** serif|sans
(faces §6), **Page** dark|light (pairs §4 — the pref flips paper only, §4's
scoping law), **Fade** on|off (constants §10). Plus the Machina-scoped
**CAST** cool|neutral (§3), default cool, persisted with the user's prefs.
Prefs survive theme switches per canon; CAST simply has no meaning outside
Machina and must not render in other themes' surfaces.

## 12. The RC and its demo-only affordances

`machina-rc1.html` (this folder) is the normative reference — B4 promoted
without visual change, header consolidated. Interactive: type to feel the
fade, run the 30-word sprint for the surge, paste to meet the Voice Wall,
toggle everything. **Demo-only, not product spec:** the RESET control, the
30-word goal value, the toggle row rendered as top-bar chrome (real prefs
live in the app's settings surfaces), and the starter copy. **Not part of
the lock:** the ROOM light-room experiment — it lives quarantined in
exploration mockup C only; pursuing it would extend the canon §11 pref
matrix and needs Nick's ruling (and likely a committee pass) first. Do not
graft it.

## 13. What the TH-Machina build plan must cover

Written here as requirements, not as the plan (the future agent authors that
on Nick's word):

1. **Ride the TH1 seam.** Token pack under `[data-theme="machina"]`
   re-pointing material names; two temperament variants — recommend a nested
   `data-cast` attribute mirroring the RC, cool default; zero component
   edits; new values only into the TH1-minted carrier-less slots.
2. **Font slots** via the four fontsource packages (§6); confirm
   availability; wordmark treatment per §7.
3. **Lexicon registration** as an explicit identity map (§9).
4. **Effects registration:** empty TEXTURE set; celebration skin parameters
   (§10); notch and caret carriers; wall-chip styling with canonical copy.
5. **Prefs:** CAST joins persisted preferences, theme-scoped (§11); confirm
   the persistence pattern in `apps/desktop/src/store/persistence.ts` —
   **zero-schema**: no new collections, no sync surface (if any pref does
   touch sync, both push and pull handlers in `apps/server/src/sync.ts` per
   the sync-completeness law).
6. **Harness** committed alongside: `scripts/harness/th-machina.mjs` —
   temperament token assertions, caret/notch carriers, celebration timing
   caps, reduced-motion fallbacks, fade constants, 1px hairline assertions.
7. **Hardware-gate DoD** (harness-invisible class — Nick's eyeball):
   Atkinson 11pt endurance on laptop + tablet (10.5pt fallback ruling);
   steel-on-hairline legibility at desk brightness; O-square optical seat
   across zooms; temperament switch feel (no flash on swap); fade rhythm;
   ≥1700px scale; S25 battery/feel.
8. **Sequencing:** behind TH1/TH2; armed only on Nick's word after the
   app-bones work; one brief per ticket; report = push; merge words and
   device verdicts are Nick's.

## 14. Ruling ledger

- **2026-07-14 — concept.** Nick's brief: minimalist black/gray, business /
  academic / technical writers, no frills, invisible UI for high-stakes
  content; name **Machina** (Deleuzian alternatives offered and declined).
  Committee frame v0 ratified by proceeding: instrument thesis,
  orange-scarcity, identity lexicon, empty effects, engineered type.
- **Mockups A/B/C** (Graphite / Instrument / Caliper) — exploration,
  superseded by the RC. C retains value solely as the ROOM quarantine record.
- **B2.** O-square wordmark (mark folds into the name); sparks proposed
  (selection touch, the way back); **thesis refined by Nick:** output and
  efficiency take priority, the human recedes to sparks; CAST/STEEL ported
  into the frame file.
- **B3.** Cool becomes default; **bar notch joins the writer's lane**
  (orange, in flight and at rest); prose-sans bake-off (Plex / Instrument /
  Public / Atkinson); O-square corrected to a true letterform; the
  "squared off by civilization" gloss goes canonical.
- **B4.** **Atkinson Hyperlegible decided.** **11pt both voices.**
  **Temperament collapse:** COOL = machine (steel accents, no sparks),
  NEUTRAL = human (orange accents, sparks) — STEEL and SPARK controls
  retired into CAST. Rail active edge to 1px.
- **2026-07-14 — LOCK.** Nick, blanket approval of the B4 state — which
  closes the serif as **IBM Plex Serif**. B4 promoted to **RC1** unchanged.
- **Benched / declined / unruled:** focus-ring spark (benched, §5); Axiom
  and Stratum (declined names, §2); ROOM light-room (**unruled**, §12).

## 15. File manifest

- `machina-foundations.md` — this document.
- `machina-rc1.html` — normative visual reference (authority over this prose).
- Exploration files `machina-a-graphite.html`, `machina-b-instrument.html`
  (+ B2/B3 revisions), `machina-c-caliper.html` — superseded; archiving is
  optional, but if any is kept, keep **C** for the ROOM quarantine record.

— Fable, end of the Machina design arc, 2026-07-14

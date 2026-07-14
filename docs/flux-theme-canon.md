# Flux theme canon — TH-arc

**Place at:** `docs/flux-theme-canon.md`. Ratified 2026-07-13 across four design
sessions (full committee double-pass, then a joint Architects + Experts
cognition/ADHD bench for revisions). Nick's rulings are final throughout.
Converts ledger horizon item 14 into the TH-arc. Normative visual reference:
`docs/design/flux-rc2.html` — **where this prose and RC-2 disagree, RC-2 wins**
pending errata.

## 1. What a theme is

A theme is four maps and zero forks: **token remap + lexicon map + effects
layer + font slots**, riding the existing CSS-variable seam. No parallel
components. Compose, don't rebuild. The seam (TH1) is theme-agnostic from day
one — Flux is the proving theme; Volant and Nomad join later as pure data
files, no new committee pass required unless a theme wants new effect
primitives (mirrors the fragments-under-pages §2 pattern).

**Single hard invariant (per ledger item 14): the orange accent `#FF9800`.**
Everything else is theme-scoped by permission.

## 2. Lanes — who owns which color

| Color | Hex | Lane |
|---|---|---|
| Orange | `#FF9800` | **The writer.** Appears in exactly four places: prose caret, bar completion surge, Connect, the mark. Nowhere else. Scarcity is the point. |
| Lime | `#A6FF3D` | **Live.** The work in flight: sprint-bar fill, ~35% of texture events, celebration support sparks. |
| Electric blue | `#00C2FF` | **System.** Active borders/focus, the bar's pulsing caret, system readouts, ~65% of texture events. |
| Teal family | grounds/lines below | **The world.** The room itself, including the glow at every progress level. |

The room speaks entirely in teal, blue, and lime. Orange is only ever you.

## 3. Tokens (Flux values, RC-2)

Exact CSS custom-property names are pinned in TH1 Slice 0 against
`apps/desktop/src/index.css`; these are the semantic slots and values.

| Slot | Flux value |
|---|---|
| ground | `#04141A` |
| chrome surface | `rgba(9,30,36,.9)` over ground |
| rail surface | `rgba(4,17,22,.78)` |
| line | `#1D4A52` |
| line-active (new slot, all themes) | `#00C2FF` |
| signal-live (new slot, all themes) | `#A6FF3D` |
| page (dark) | `#0B2429`, border `#2A6A76` |
| page (light) | `#EDF6F3` |
| ink (dark / light) | `#E3F1EC` / `#14231F` |
| meta (dark / light) | `#57D0F5` / `#0B7C9E` |
| text muted | `#8FB4AC`, dimmer `#6E958D`, counts `#5E837C` |
| accent (invariant) | `#FF9800` |

Square corners and solid borders hold in Flux v1.

## 4. Typography — four font slots

The theme font seam has **four slots** (TH1 finding):

| Slot | Plateau | Flux |
|---|---|---|
| chromeLabel (system labels: RACKS, CONNECT, DOC //, nav, readouts, toggles) | Figtree | **Rajdhani** 500/600/700, letter-spaced, uppercase |
| contentLabel (tab names, cache/rack item names) | Figtree | **Chakra Petch** (tabs 12px, items 12.5px) |
| proseSerif | Crimson Pro | **Crimson Pro** (voice continuity across themes) |
| proseSans | Figtree (debt: confirm) | **Chakra Petch** 14px / 1.75 |

Flux ships with zero Figtree glyphs outside the wordmark stand-in; the
production mark is the hand-drawn logo, so effectively none. Chakra's
endurance flag stands on record for the long-session device verdict — not
relitigated before then. Fonts ship via fontsource packages (Courier Prime /
S1 precedent).

## 5. Lexicon (final; display projection only)

Canonical nouns persist in data, schema, routes, sync, and search. A
single-source lookup keyed by term IDs (same shape as `planVocab`) maps to
display strings; canonical terms keep working everywhere. Zero-schema.

| Canonical | Flux |
|---|---|
| Pages | **Docs** |
| Shelf | **Cache** |
| Drawer | **Rack** |
| Binder | **Cartridge** |
| Boxes | **Nodes** |
| Board | **Circuit** |
| Notebook | **Deck** |
| Journal | **Logs** |
| Plan | **Schematic** |
| Milestones | **Checkpoints** |
| Free-write | **Overclock** |
| Home | **Safehouse** |
| Voice Wall | **Firewall** |
| Publish | **Connect** — the single sanctioned verb rename |
| Script | Script (already dual-natured) |

**Number forms (TH1 R1 fold):** each row above names the term's canonical
form loosely — in the implementation every term carries two independent
forms, `one` and `many` (pluralization isn't algorithmic from a single
string), and a theme overriding a term may supply either form alone, with
the other falling through to Plateau's canonical form for that number.

## 6. Ambient doctrine — two classes, opposite damping

- **TEXTURE** (the failing-monitor events): random, narratively empty, and
  **damps while typing** — fast damp (~0.45s to ~13% opacity), slow
  re-emergence (~9s), spawn schedulers skip while typing.
- **RESPONSE** (the progress glow): the room answering the work, so it
  **persists while typing**; its sputter *pauses* while keys flow — writing
  steadies the light.

**The page is the only stable signal.** All texture renders behind the page
and never enters the prose column. Effects live in one compositor layer:
absolutely positioned, pointer-events none, transform/opacity animation only,
zero layout participation (W1 fixed-track grid untouched), no focus or scroll
theft (W2 restore untouched).

## 7. Texture spec — Signal Loss dialect at RC-2 rates

Dialect = event vocabulary; the Ambiance dial (0–100, user pref) scales rates
and opacities. RC-2 rates are dial-center. All events are stochastic
(jittered timers, randomized position/size/color), sub-second, and capped.

| Event | RC-2 interval | Notes |
|---|---|---|
| Tear-line storm | 7–12s | 3–5 lines, ~45ms stagger, ~150ms each; ~35% lime / 65% blue |
| Shear band | 9–15s | 26px band, skewX(-12deg), ~160ms |
| Noise patch | 8–14s | 130×56 striped patch, ~150ms |
| Macroblock cluster | 2.6–4.8s | 5–9 blocks 10–30px, 80–210ms each |
| Sync jump | 9–15s | texture layer ±4px, ~80ms; 40% double-jump |
| Backlight dip | 10–17s | black overlay to .13 for ~400ms; 50% double-dip |

Hard rules: nothing flashes above 3Hz anywhere at any dial position;
`prefers-reduced-motion` zeroes the entire layer (dial forced to 0); dial 0 =
fully static Flux.

## 8. Glow spec (RESPONSE)

Radial teal-blue pool anchored behind the page (~56% / 52%). With sprint
progress `g` in [0,1]: opacity `= .1 + g × .52`, scale `= .5 + g × .85`,
transitions .6s ease. **Stays in the teal family at every progress level** —
the earn-the-orange hue shift applies to the bar only, never the glow (RC-2
ruling). Bulb sputter: constant-character irregular flicker (4.3s cycle,
dips to ~.7–.86) plus jittered deep sputters (~130ms to ~24% opacity, every
6–12s). Sputter is never behavior-contingent — except its honest inverse:
it pauses while typing. Deletion eases the glow down (600ms); it never
snuffs. Completion = a brightness bloom (teal intensity spike, ~0.9s), then
steady at full.

## 9. Sprint bar and the completion surge

This is the W1 incentives sprint bar (self-set goal). **Checkpoints remain
read-only coverage facts and never surge** — the progress-milestones canon is
untouched.

In flight: lime fill, electric-blue caret notch pulsing at 1.8s. On crossing
the goal: ignition sweep (white→orange gradient, .55s) → fill and notch hand
off to orange → 14-spark burst (orange core, ~30% lime) → bar rests calm
orange. Binding guardrails: the reward is **predictable, never variable** —
identical every time; variable reward schedules are banned on this surface.
One-shot ≤1.6s, fully peripheral (no focus steal, no layout shift, no sound
v1), reduced-motion falls back to a plain crossfade. One celebration grammar
app-wide; B4 remains the final authority on its finish.

## 10. Chrome fade — cross-theme invariant

All chrome (top bar, rail, bottom bar) and page metadata fade on active
writing (~0.7s to ~5% opacity); return on idle (~4.2s) or pointer/edge-dwell
intent. Production shares W1's dissolve machinery and constants — compose,
don't rebuild. **Celebrate-summon rule:** the completion surge overrides the
fade on the bottom bar for ~2.5s, then re-fades — the dopamine is never
delivered to an empty room. Division of labor: in flow you *feel* progress
(glow); at rest you *read* it (bar).

## 11. Cross-theme preference matrix

Three user preferences exist on **every** theme, persist via the W1 toggle
pattern, and survive theme switches; each theme supplies its own values:

- **Voice** — serif | sans (Flux: Crimson Pro | Chakra Petch)
- **Page** — dark | light (Flux: `#0B2429` | `#EDF6F3` pairs above)
- **Fade** — on | off (chrome fade)

Plateau debt (TH1): define Plateau's dark paper pair, sans voice, and its
four font-slot values.

## 12. Firewall ruling

The guard speaks only when it acts. No persistent status chip in writing
chrome. "FIREWALL ▪ PASTE BLOCKED" appears transiently on the blocking event
(self-teaching); provenance ("all you, verified") surfaces at Connect time.
The anti-paste rail itself remains its own horizon ticket — TH2 binds the
chip to whatever the Voice Wall blocks today and does not smuggle the rail in.

## 13. Block caret

Flux uses a wide orange block caret on writing surfaces (blink 1.05s,
width ≈ 0.48 × line-height, min 7px). Production rides W2's
`store/caretOffset.ts` — no new caret machinery.

## 14. Standing guardrails carried into this arc

S0 hard gates, zero-schema invariants, read-only projections, token seams —
unconditional. Anti-gamification: no scores, streaks, or leaderboard
mechanics; word-count restyling ("SPRINT n / goal") is flavor on a fact, not
a new metric. Photosensitivity ceiling ≤3Hz. `prefers-reduced-motion`
honored everywhere. Motivation surfaces stay within the one celebration
grammar.

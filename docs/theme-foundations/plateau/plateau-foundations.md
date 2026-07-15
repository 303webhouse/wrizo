# Plateau — foundations · the desk by the garden
**Status:** FOUNDATIONS · authored on Nick's word, 2026-07-14. Ruled entries below carry his word and date; the casts pass (§7) is the recorded variation channel.
**Answers to:** `docs/theme-foundations/theme-arc.md` — territory #1, register *warmth*: home — the room holds you.
**Place at:** `docs/theme-foundations/plateau-foundations.md` (the volant-established home for foundations; the week-plan's `docs/wrizo-alpha/` parenthetical yields to folder consistency, deviation recorded here).

---

## 1. The register, told properly

Plateau is the desk a writer returns to — but not an office desk. It is
the desk Tolkien or Lewis might have sat at between tea in the garden:
lamplit wood, parchment, a window somewhere near. And the plateau is not
only a room; it is a natural feature — **soil and green life, fed by an
orange sun and by humans diligent enough to tend it.** Territorial
origin, in the arc's terms: the warmth that everything else departs from
and circles back to.

This paragraph is design law, not decoration. It cashes out three ways:

- **The connection to nature lives in material and light, never in
  ornament.** No drawn vines, no leaf glyphs, no skeuomorphic garden.
  The Shire is *felt* — in the soil-dark browns, the parchment, the one
  cultivated green, the sun that touches little — or it is not there at
  all. Any future nature-flavored flourish must pass the relevance law
  and the quiet rules like everything else.
- **The green is tended, not wild.** One olive, disciplined, doing one
  job (§3). Growth under a careful hand — which is also the theme's
  statement about the writer.
- **The sun feeds everything and touches little.** Plateau's orange law
  is §4.

## 2. The soil and the parchment — the locked base

The shipped palette stands, reaffirmed and named into the allegory:

| token | value | in the allegory |
|---|---|---|
| `--ground` | `#110600` | the deep soil; the room beyond the lamplight |
| `--panel` (chrome/rail surfaces) | `#1b0d03` | turned earth; the desk's wood in shadow |
| `--line` (`--ink-border` family) | `#3a2613` | root and grain; every border, 1px, solid |
| `--paper` | `#f7efe1` | parchment; the page under the lamp |
| `--brass` | `#FF9800` | the sun (§4) |

Square corners and solid borders remain locked. Text tones
(`--text-hi/mid/low`) and `--brass-press` keep their shipped values —
this document does not restate hexes it does not change. Typefaces
locked as shipped: **Figtree** (the room's hand — UI) and **Crimson
Pro** (the writer's voice — prose), riding the TH1 font slots.

## 3. The green life — the olive (locked here)

**New material token: `--olive: #96a05a`**, consumed through a new
purpose slot **`--accent-rest`** (the seam pattern: components read the
slot; themes re-point it; the casts pass may tune the material value).

**The usage law, ruled by Nick 2026-07-14:** *olive marks where you
are; orange marks what you do.* Olive carries resting state — the
active-mode hairline, selection, the located-here accents wayfinding
will need. It never celebrates, never urges, never fills a control at
rest. Measured contrast (computed, approximate): olive on `--panel`
≈ 6.8:1, on `--ground` ≈ 7.1:1 — text-grade if it is ever asked to
carry words, though the ruled duties are lines and edges.

## 4. The sun — Plateau's two-regime orange law

The founding invariant is untouched: the orange is never removed from
any territory. Plateau, the warm room, expresses it thus:

- **Evental (the full sun, `--brass`):** celebrations, press states,
  and any future live-moment expression (a caret flare, if Plateau ever
  adopts one). Orange appears when a human acts, at full warmth.
- **Resting (the ember, `--brass-press`):** exactly one allowance — the
  engraved zone headings (JOURNAL, PLAN, DRAWERS) may rest in the ember
  tone. Nothing else rests orange: not tabs (ruled out 2026-07-14, see
  §5), not fills, not interactive rest states, not meters. This is
  Plateau's resting ceiling, and it is deliberately smaller than what
  shipped before the App Bones pivot — the findings of record indicted
  the old aggregate, and this law is its correction.

## 5. Ruled entries of 2026-07-14 (Nick's word, incorporated)

1. **The active writing mode wears a 1px olive hairline** — brightened
   ink, no fill, the hairline at the room's own 1px line weight. Brass
   leaves the strip entirely. (This closes the AB1 review's advisory A1
   by ruling; the AB2 brief's S7 builds it.)
2. **The mode strip renders in the engraved register** — uppercase,
   letterspaced, sharing the zone headings' voice. Presentation only:
   the canonical strings remain the ratified title case ("Free Write" ·
   "Draft" · "Revise" · "Workshop" · "Publish"); the engraving is
   Plateau's dress, applied in CSS, so the exact-string checks, the
   lexicon seams, and assistive reading are all untouched. Scoped to
   Plateau; each territory rules its own dress for the same five words.
3. **Open question, presented not ruled:** the casing of *chooseable*
   menu items (panel verbs such as Open · File · Peek, the corner menu's
   entries, the drawer names). A Title Case proposal was mocked and set
   aside when it turned out to transcribe a misread; shipped strings are
   sentence case. The casts/detail pass (§7) or Nick's word settles it.
   Until then, new surfaces follow shipped convention (sentence case)
   and route every string through the lexicon seams so the eventual
   ruling is a sweep, not surgery.

## 6. What Plateau may never touch

The grammar (Desk design Part 3): Page center, Modes above, Tools left,
Organizers right, meters below; the vanishing law; the relevance law;
the two-action table; the orange invariant. Five rooms, one skeleton —
this document dresses the skeleton and owns nothing structural.

## 7. The casts pass — recorded, not armed (Nick's note, 2026-07-14)

Nick wants **several casts** of Plateau explored later: darker, richer
browns, and different warmth/coolness settings — variations of the base
climate, the way a room reads differently by candlelight and by
morning. Recorded here as a future pass with these rails already set:

- Casts re-point **material token values only** (`--ground`, `--panel`,
  `--line`, `--paper`, `--olive` tunings); purpose slots, structure,
  and every law in this document are cast-invariant.
- The base cast is the locked palette in §2–§3; it remains the default.
- Delivery follows the house pattern: side-by-side rc HTML comparisons
  (the flux-rc/volant-rc lineage) for Nick's eye, then a ruling.
- Not armed. A future session convenes it on Nick's word; nothing in
  the AB-arc waits on it.

---

*Authored by Fable for the committees, on Nick's direction of
2026-07-14. The build-facing pieces (the hairline, the engraving, the
`--accent-rest` slot) are specified in
`docs/wrizo-alpha/ab2-tools-by-mode-brief.md` S7. Committed by CC on
relay — a direct Fable write was attempted on Nick's word and refused
by the connector's read-only credential, which remains the recorded
tooling state.*

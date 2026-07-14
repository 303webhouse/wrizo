# Volant Foundations
**Status:** Locked 2026-07-14 · consolidated from the full design arc (v1 divergence boards → rc2)
**Normative visual reference:** `volant-rc2.html` (this folder; supersedes rc1 and the lexicon sketches)
**Companion doctrine:** `theme-arc.md` (this folder)
**Build status:** NOT armed. Nick is doing foundational work on the app's bones first; themes lay over afterward. A future agent authors the TH5 brief **from this document** when the word comes.

---

## §0 · How to use this document

Everything here carries one of three statuses:
- **LOCKED** — Nick's explicit rulings. Immovable without a new ruling from him.
- **STANDING** — committee completions ratified by freeze or by silence. Stable; strike-able by Nick only.
- **OPEN** — deferred to hardware verdict or to a future decision. Listed in §10.

House laws apply in full: `docs/open-threads.md` remains the living ledger for *state* (this document is *doctrine*); one brief per ticket; harnesses committed alongside every ticket; report = push; merge words and device verdicts are Nick's alone.

---

## §1 · Grounding & doctrine

**Volant is the fifth theme and the capstone of the arc** (see `theme-arc.md`): the plane of deterritorialization, the body without organs. It is not another place — it is the dissolution of place. Where Plateau settles, Machina recedes, Flux agitates, and Nomad wanders, Volant **lifts**.

**Design law — nearly white, never white** (LOCKED by the arc of rulings). The plane is reached with a fine file, not a sledgehammer. Volant retains small strata: a whisper of tone in the field, the momentum instruments, the human thread held as potential. A pure void would be the botched BwO — the blank page weaponized against the app's own anti-perfectionism thesis.

**Register** (LOCKED, Nick's words): simplicity, hyperfocus, and minimalism in a freeing way.

**Core semantics** (LOCKED across the arc):
- **White marks = being. Orange events = acting.**
- **The only words in the room are the writer's.** The chrome is mute.
- Identity dissolves; relation persists. Machina removes the *room's* affect so the writer's judgment stands alone; Volant removes the *writer's own insignia*.

**Access** (STANDING): Volant is reached by progressive disclosure — it appears at depth. Mechanics TBD under the M1 anti-gamification guardrails: gated on engagement-facts the app already displays, never on solicited targets; no visible locked door, ever. Once open, movement between themes is free in all directions.

---

## §2 · Orange — the two-regime law

Invariant: `#FF9800`. Founding rationale (rebrand session): the irreducible human connection; can never be removed, recolored, or themed away.

**Two regimes** (LOCKED by the Volant errata):
1. **Resting orange** — governed by the four-site ceiling (wordmark · craft · active-tab marker · Publish). Themes classify each site **burning** (orange at rest), **live** (ignites on approach), or **dormant** (mark persists in mark-substance; orange withdrawn).
2. **Evental orange** — governed by the **lane law: "orange is for humans acting."** Orange appears transiently wherever, and only where, the writer acts (input, hover, focus, press) or where completed work is revealed (earned patterns). Flux's earn-the-orange was the first evental instance; the doctrine is cross-theme, each theme earning it in its own dialect.

**Floor law (amended):** every theme keeps orange *reachable* — at least one burning site or a live/evental lane. Latency is not disconnection; the thread is always one gesture away.

**Volant's declaration — the first all-evental theme** (LOCKED):

| site | state | rendering |
|---|---|---|
| wordmark | dormant | Jost 400 · 16px · .28em · uppercase · `var(--mark)` |
| active-tab marker | dormant | vertical bar 2px × 13px · left −10px · `var(--mark)` · no ink lift on active glyph |
| craft (progress) | evental | orb is white light at rest; **earned streak** ignites orange at completion |
| Publish | live | mark-substance chassis at rest; ignites on hover / focus-visible / active |
| activation lane | evental | all interactive chrome takes `--accent` on hover / focus-visible / active |
| text caret | evental | orange in motion; cools to ink ~1.4s after last input |

On the unmarked plane, the only color left is the human — and it appears exactly when the human acts.

---

## §3 · Tokens (LOCKED)

### Day field
| token | value | notes |
|---|---|---|
| ground | `#DFDFDC` | Ground III |
| panel | `#E9E9E6` | tonal step; no borders anywhere |
| paper | `#FFFFFF` | brightest plane — page-primacy held optically |
| ink | `#4E545B` | Ink II · 7.7:1 on paper |
| muted | `#82878D` | secondary chrome |
| faint | `#A6AAAD` | tertiary chrome; resting tabs incl. active |
| streak-mid | `#D2D2CF` | streak shoulders |
| selection | `#E3E9EF` | bg; text = ink |
| pubink | `#241204` | text-on-orange (fill fallback only) |
| **mark** | `#FFFFFF` | the mark-substance: wordmark, tab bar, Publish chassis |

### Night field — the void
| token | value | notes |
|---|---|---|
| ground | `#0A0B0D` | |
| panel | `#0F1114` | |
| paper | `#14161A` | |
| ink | `#D9DBD8` | softened — halation guard |
| muted | `#969BA1` | |
| faint | `#565C62` | |
| streak-mid | `#101216` | |
| selection | `#1D2A38` | |
| pubink | `#241204` | |
| **mark** | `#7E848B` | **Night Mark II** (~4.7:1) — LOCKED this arc |

`--mark` history: marks were originally "made of paper"; hardware-in-miniature (Nick's own screen) rejected that at night. The token decouples: day marks are true white; night marks are lifted light. The white void and the black void remain the two faces of the same unmarked plane.

---

## §4 · Typography (LOCKED)

- **Chrome:** Jost. Base 300 / letter-spacing .14em / uppercase. Tabs 12.5px context; toggles and rail 11.5px. Wordmark: Jost **400** / 16px / .28em / uppercase / `var(--mark)`.
- **Prose pair** (theme-declared faces; the *preference* is the user's and global — seam law, §11):
  - serif — **Crimson Pro** 400 · 19.5px · lh 1.72 · titles 600/30px
  - sans — **Manrope** 400 · 18.5px · lh 1.7 · titles 600/28px
- Publish carries no text (see §5); when the Plateau label system is selected, its word renders in chrome register (500 / uppercase).

---

## §5 · Language & glyphs

**Wordless register** (LOCKED): Volant's native label system is symbols only. No words in chrome, no hover reveals. **Discovery is by play** — click the mark and see where you land; a little reason to play is the point, and divergence is free. Accessible names remain in the DOM (`aria-label` on every control); wordless is a paint-layer register with zero semantic cost.

**Safety architecture** (STANDING): exploratory clicks are consequence-free because the **Publish dialog is the second gate** — the tap opens the naming moment; it never fires the act. Consequence gets named in the dialog, not in chrome.

**Escape hatch** (LOCKED): a label-system picker, exposed **in Volant only**, offering any theme's labeling system — Plateau (base words, permanent fallback), Machina, Flux, Nomad, or Volant's symbols (default). Stored as a per-theme preference. Other themes speak their own fiction; Volant alone may wear any territory's vocabulary, because it is the plane they all decompose onto.

**Glyph system — "Orientations of One Stroke"** (LOCKED):
One element — the stroke — at four orientations. Nothing depicted, everything distinct; the mapping is convention, learned by play. **Abstract over concrete** is law: marks differ, they never resemble.

| control | glyph | spec (18×18 viewBox · stroke 1.5 · currentColor · square caps) |
|---|---|---|
| Journal | — (0°) | line (3,9)→(15,9) |
| Notebook | / (45°) | line (4,14)→(14,4) |
| Board | \| (90°) | line (9,3)→(9,15) |
| Script | \ (135°) | line (4,4)→(14,14) |
| Publish | ⫽ steep ascent | lines (4.5,15)→(9.5,3) and (8.5,15)→(13.5,3) |

- **Rotation mapping** (STANDING): the nav is one stroke turning — 0° → 45° → 90° → 135° — and the turn loops back to 0°, like the arc.
- **Publish exception** (STANDING): the system's one principled break — two strokes, joined, at a unique steeper angle. One stroke alone through every territory; joined only at the door to the Other.
- **Rectilinear law** (STANDING): straight strokes only. Curvature belongs to the orb alone.
- Rest color: tabs `--faint`; ignition `--accent` per the lane. Publish glyph rides the chassis in `--mark`.
- Rail count reduces to numerals in symbol mode (`1,204 · d1`); full words under Plateau labels.
- No renames anywhere: **Volant renames nothing; it removes.**

---

## §6 · Geometry (LOCKED)

- **Borderless tonal surfaces.** No hairlines; edges carried by one-step tone shifts. Striation is lines; Volant has none.
- **Vertical active-tab marker**, 2px × 13px, left −10px, `var(--mark)`. **No ink lift on the active item** — the line does the job (wayfinding guard overruled on record; check lives in §10).
- **The orb is the sole curvature** in the theme. Square corners everywhere else.

---

## §7 · Craft & motion (LOCKED)

- **Streak rail:** 3px; transparent at both ends; `streak-mid` shoulders at 18%/82%; `paper` peak at 50%.
- **The orb:** 10px, pure `#FFFFFF` with glow (`0 0 6px` rgba(255,255,255,.95) + `0 0 14px` .55) in **both** fields — it is light, not paper; at night it is the single star on the void.
- **Earn-the-orange ignition (completion):** orb glides to 100% (600ms, cubic-bezier(.4,0,.2,1)) → orange streak sweeps left-to-right (700ms clip-path reveal; orange gradient mirrors the resting streak at .55/1/.55) → orb blooms once (800ms, scale 1→1.9→1) and settles over the lit band with a whisper of orange in its glow.
- **Text caret:** 1.5px ink bar, 1.15s blink; flares `--accent` on input, cools to ink 1400ms after the last keystroke (transition 300ms).
- **Drift:** fixed radial layer (55%×45% at 32%/30%), alpha ≤ .035, 140s ease-in-out alternate. Sub-perceptual by intent — a horizon for the eye, not content.
- **Reduced motion:** drift off; ignition collapses to state changes; bloom and flare transitions disabled.

---

## §8 · Behaviors (LOCKED)

- **Activation lane:** `:hover`, `:focus-visible`, `:active` ignite `--accent` on every interactive chrome element. On touch, the press *is* the ignition — actualization coincides with the act. Keyboard traversal ignites via focus-visible.
- **Publish:** rest = transparent fill, 2px `var(--mark)` chassis, `--mark` glyph. Ignition = chassis and glyph to `--accent` with inner .5px shadow (thickens without layout shift).
- **Transient orange on the light field** runs ~1.9:1 — sanctioned as a state-change signal paired with intent, never as reading text. **Named fallback if hardware rejects it:** hover-fill (orange ground, `pubink` glyph/text).

---

## §9 · Decision log (chronological, for provenance)

1. Five-board arc conceived; three divergence boards (Vellum / Cirrus / Vacuum) → **Cirrus chosen**.
2. Ink softened from ~16:1; identity marks (wordmark, tab marker) moved to paper-substance; wordmark typeset (the one theme where the hand lifts off the page — chosen on record). Jost locked after a four-face cycle.
3. Publish converted from resting orange to **ignition on approach** (virtual → actual); day field deepened; ink options issued.
4. **Ink II (7.7:1)** locked; caret ruled square + orange (craft confirmed burning); streak rail replaces flat track; earn-the-orange dialect adopted; ground dial issued.
5. **Ground III** locked; caret → **white orb** (presence as light); **lane law declared: "orange is for humans acting"** — Volant becomes the first all-evental theme; vertical tab marker (2px); prose pair + seam law raised; custom-font upload relegated to backlog with the anti-gamification frame.
6. Active tab loses its ink lift (wayfinding guard overruled on record). **Design freeze at rc1.**
7. Lexicon arc: symbols-only proposed with cross-theme label borrowing; evental word-reveal proposed by committee.
8. Word-reveal **struck** — discovery by play; Publish-keeps-its-word **overruled** — Publish goes symbolic; abstraction law declared; night `--mark` token introduced.
9. **"Orientations of One Stroke"** locked; **Night Mark II** locked; foundations consolidated; **bones-first** ruled — TH5 deferred, unarmed.

---

## §10 · OPEN items — hardware verdict dials & pending strikes

Harness-invisible class; Nick's eyeball gates DONE:
1. Night marks at Mark II on real hardware (wordmark, tab bar, Publish chassis).
2. Active-tab findability in both fields, post ink-lift removal.
3. **Glyph discriminability at 18px and at saccade speed — especially the mirror pair / vs \** (Notebook/Script). Micro-differentiation in length or weight is permitted if the eyeball demands it.
4. Ink II across a genuinely long writing session.
5. ≥1700px — the expanse of the field at scale.
6. Orb glow at low display brightness.
7. Caret-flare feel while actually typing (rhythm, not distraction).
8. Transient hover-orange legibility (triggers the fill fallback, §8).

Pending strikes (STANDING until Nick rules): rotation mapping; Publish ⫽ glyph.
Pending decisions: Volant unlock mechanics (M1 frame); label-picker generalization beyond Volant (not planned; noted only).

---

## §11 · Seam & cross-theme implications

- **Prose-pair law:** every theme declares `--prose-serif` / `--prose-sans`. Preference global (user's), faces themed. Persistence per the W1 typewriter-toggle pattern; if preferences ride sync, the **sync-completeness law** applies (push handler + pull response + rowTo*/upsert* mirroring in `sync.ts`).
- **Lexicon layer:** single-source label map extending the `planVocab` pattern — `labelKey → {plateau, machina, flux, nomad, volant}`; Plateau is base vocabulary with fallback; the resolver returns a **render descriptor** `{glyph?, name, text?}`, never a bare string; accessible names always present. Picker exposure Volant-only; `labelSystem` stored per-theme.
- **`--mark` joins the token schema** (mark-substance for identity marks; day/night values per theme; other themes may alias it to paper or ink as their canon dictates).
- Sequencing note: resolver + map + prose-pair tokens are **seam work serving all themes** (TH1-addendum territory if TH1 remains open, else a small follow-on); glyph assets + picker + Volant tokens are the theme ticket. Resolve the split against the ledger when the theme work resumes.

---

## §12 · Build-plan pointers (for the future agent — this is not the brief)

- **Prerequisites:** app-bones work complete per Nick; TH1 seam state confirmed from the ledger; TH2 (Flux) and any TH3/TH4 assignments respected under the one-brief law; seam split from §11 resolved first or alongside.
- **Acceptance:** parity with `volant-rc2.html` plus every table in §§2–8; both fields; reduced-motion paths; aria-names on all wordless chrome; Plateau-label fallback functional.
- **Harness:** `scripts/harness/th5.mjs` committed with the ticket — token snapshots, computed-style assertions, lane-state checks, label-resolver round-trips. §10 is the explicit harness-invisible list; the ticket is not DONE until Nick's device verdict lands.
- **Backlog relays already framed:** custom font upload → user-authored identity cluster (progressive disclosure; device-local binaries — font files don't ride the JSON sync rows). Volant unlock mechanics → same cluster, same frame.
- **Ledger annotations at relay:** roster reads five themes; Volant foundations live at `docs/theme-foundations/`; TH5 unarmed pending bones work; seam decisions (§11) pending.

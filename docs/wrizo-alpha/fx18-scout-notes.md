# FX18 — the Chrome Aligned · scout map (VERIFIED against source) + build decisions

Research folded to disk (a scout that vanishes is budget spent twice). Every seam below
was CONFIRMED by chat 1's own read; the scout was research, not authorization
([[scout-output-is-research-not-authorization]]). Item 75, branch `fx18-chrome-aligned`.

## S1 (SV25) — the drawer arrow mirrors
- **Root, verified:** `Tutor.tsx:451` and `Sliver.tsx:200` are BYTE-IDENTICAL
  `{open ? '›' : '‹'}`. Two independent literals (no shared helper), so they point the SAME
  way in any state instead of mirroring — the right (Tutor) handle is wrong. No CSS transform
  corrects it (grip-glyph rules set only font-size/line-height).
- **Fix (applied):** `Tutor.tsx:451` → `{open ? '‹' : '›'}` (the mirror). Sliver.tsx:200
  UNTOUCHED (the correct reference — a naive global replace would re-break it). One shared
  Tutor component → all four Tutor surfaces (PageEditor:748, JournalEntry:1174,
  BoardEditor:2167, ScriptEditor:745) inherit the fix.
- Parks: none — no existing harness asserted arrow direction.

## S2 (SV24/SV26) — one panel-overlap layout law
- **Root, verified:** the OPEN Tutor panel `.wz-tutor-panel` (index.css:3426) used full
  `width:var(--tutor-panel-open-w)` with NO margin clamp, while the DOCKED rule (3446-3447)
  already clamps `clamp(120px, var(--tutor-panel-margin), var(--tutor-panel-open-w))`.
  `--tutor-panel-margin` (2977) is a pure calc()/percent (always available, no JS). So the
  undocked panel overran the viewport / covered its grip / collided with the left toolbar,
  esp. on the Board (tiny margin) and at narrow widths. ONE law, several surfaces.
- **Fix (applied):** give the OPEN panel base (index.css:3426) the SAME margin-aware clamp
  the docked rule uses. Margin-proportional: full `--tutor-panel-open-w` where the margin
  allows, compressed toward the margin (floored 120px) where it doesn't → always in the room.
- **Companion (applied):** `.desk-frame-tutor-panel-anchor--screenplay` was empty (inherited
  prose's `--tutor-panel-paper-half`); the 8.5in screenplay needs `min(50%, 4.25in)`
  (mirroring the grip anchor) so the margin clamp measures the screenplay correctly. Split
  from the prose rule + set.
- **Grip reachability — SCOUT CLAIM FALSIFIED by fx18.mjs (disk wins):** the scout said "the
  clamp keeps the panel in the margin, so the grip stays reachable — no separate grip seam
  needed." WRONG. The clamp keeps the panel *in the room* but NOT off its own grip: the docked
  panel's near edge lands on the paper's right edge — exactly where the grip sits — so the open
  panel (panel-anchor z-index:6) buries the grip (grip-anchor z-index:5). fx18.mjs's grip
  hit-test proved it: all 9 S2 checks passed `inRoom` but failed `gripReachable` (the panel
  center-covers the grip on every surface/width). This IS SV24 proper ("covers its own close
  arrow") — the clamp alone never cured it. **Real fix (applied):** lift the grip anchor to
  z-index:7 (above the panel anchor) + `pointer-events:none` on the anchor / `:auto` on the
  grip, so the grip rides atop the open panel as its click-through left-edge tab (the panel's
  `border-left:none` was always drawn to join it) while the rest of the panel stays live. The
  sliver twin needed no such lift — its panel is inset 16px (`.wz-sliver-panel{right:16px}`),
  its grip sits in an uncovered gutter; the tutor panel is a flex-end child, geometrically
  decoupled from its grip, so it takes the stacking cure instead of the inset one.
- **Parks — SCOUT ESTIMATE WRONG (5 owed, not 0):** fx10 DOES assert the open panel reaches
  full `--tutor-panel-open-w`. Its "S1 geometry" checks (page@1100/1280, board@1100/1280/2200)
  fail against the clamp — the panel is now margin-aware (237px page@1100, 120px board floor),
  legitimately SUPERSEDING "full open-w" (which was the SV24/SV26 overrun itself). Those 5 take
  A4-parks (verbatim + successor asserting the margin-aware invariant) in the SAME commit as the
  S2 clamp — landed at the post-hold verify against MEASURED widths, not approximated.

## S2 — FX10-vs-FX18 CONFLICT (needs Fable's ruling before the clamp is final)
The scout treated "the open panel lacks the docked margin-clamp" as the SV24/SV26 bug and
added the clamp. But that missing clamp is NOT an oversight — it is **FX10 S1, Fable's own
corrected ruling** (index.css:2993-3003 + fx10.mjs:163-171): the OPEN panel is a fixed
`clamp(320px, 34vw, 460px)` that **OVERLAYS the paper** (CD2 overlay law), deliberately NOT
margin-compressed ("overlays the paper below the width where it can't fit, exactly as today").
- My margin-clamp **reverses** that: the open panel now compresses to the available margin
  (237px page@1100, **120px floor on the Board**) and no longer overlays the paper.
- The BRIEF's S2 title says "panels do not overlap each other **OR THE PAGE**" — which, read
  straight, *authorises* exactly this reversal (don't cover the writing surface). So the clamp
  is likely right — but it (a) supersedes a standing Fable ruling and (b) floors the Board's
  Tutor panel to 120px (the board is near-zero-margin), which the brief may not have reckoned.
- **FORK for Fable (surfaced 2026-07-29, chat 1):**
  (A) FX18 supersedes FX10 S1 → keep the margin-clamp; A4-park the 5 fx10 "full open-w"
      assertions (with a note FX18's "don't overlap the page" supersedes FX10's overlay law);
      accept Board Tutor = 120px, or add a Board-only overlay exception.
  (B) FX10 S1 stands → revert the open-panel clamp; fix SV24-overrun (Board app-edge) by
      anchor/positioning and SV26 (toolbar overlap) without width compression.
- The **grip z-index lift is independent of this fork** (SV24 "covers its close arrow") and
  stays either way.
- **RULED (Fable, 2026-07-29): (A), refined — FX18 SUPERSEDES FX10 S1.** A founder's device
  verdict (Nick's SV24/SV26 on the shipped surface) outranks an architect's earlier
  convenience ruling; and FX13's measure-effect is now the proven pattern for this class.
  The **three-regime law**:
  1. WRITING surface (page/script), margin >= ~280px usable floor: the panel OCCUPIES the
     margin, `min(margin, open-w)`, never covers the sacred paper. The norm.
  2. WRITING surface, margin < ~280px: OVERLAYS the paper at natural open-w "as before" —
     the documented narrow-screen degradation (a downward discontinuity at 280 that CSS
     clamp can't express → Tutor.tsx measure-effect flips `data-overlay`).
  3. BOARD: overlay exception — natural open-w, MAY overlay the canvas (arrangement surface,
     own scroll), bounded to the app edge, grip atop. NO 280 floor, no useless sliver.
  The 5 fx10 assertions take full A4 parks (verbatim + SV24/SV26 authority + successors).
- **Implemented (branch, pending post-hold verify):** index.css floor 120→280 + `--board`
  overlay rule + `[data-overlay]` override; Tutor.tsx `USABLE_PANEL_FLOOR_PX=280` +
  `overlayMode` measure-effect (reuses `availableTutorMargin`); fx18.mjs S2 asserts all 3
  regimes by name (margin measured per leg); fx10.mjs A4-park in place. Real margins from the
  pre-hold fail details: page@1100 ~237px (already degradation — measure, don't assume),
  page@1280 ~322px (wide law). NOTHING harness-verified until the browser-hold lifts.

## S3 (SV27) — the Board's top menu parallels the Page's
- **Root, verified:** `.board-mode-tab`/`.board-door` (index.css:4348-4353) are title-case +
  the framed header is inline `justify-content:space-between` (BoardEditor:2131); the Page's
  `.desk-mode-tab` (3232) is `text-transform:uppercase; letter-spacing:.08em` and its nav is
  `justify-content:flex-end` (4185).
- **Fix (applied):** (casing) a new rule `.board-mode-tab, .board-door{ text-transform:
  uppercase; letter-spacing:.08em; }` — scoped to the Board bar, NOT the Page's
  `.page-plan-door` (which shares the base rule). Paint only; DOM textContent unchanged.
  (alignment) BoardEditor:2131 header → `flex-end`; crumb gets `marginRight:auto` (stays
  left); actions get inline `marginLeft:0` (neutralise the CSS `margin-left:auto` so the mode
  bar + actions group right). Board-only inline — no shared-CSS / legacy-sprint impact.
- Parks: low risk — no assertion pinned the board bar to title-case/centre (verify).

## Harness — fx18.mjs (NEW file; the combinatorial case is Fable's stated point)
- S1: framed prose page → sliver + tutor grip glyphs in BOTH states.
- S2: Page/Board/Script × 1100 / 1366x768 / 2200 → open the panel(s); assert the Tutor panel
  wholly in the room, its grip hit-testable, and (Page/Script) no overlap with the sliver
  panel. Board has no sliver — Tutor in-room + reachable only.
- S3: framed board → `.board-mode-tab` computed text-transform === 'uppercase'; mode bar left
  edge past the nav centre while the crumb stays left.
- Zero schema, zero server. Deploy held (P2 wave: FX16 · BG2 · FX17 · FX18, one word).

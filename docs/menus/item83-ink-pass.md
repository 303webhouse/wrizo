# ITEM 83 · FREE WRITE — THE INK PASS
### menus lane · 2026-09-06 · Nick's ruling via Fable/Chat 1
**Governing frame, Nick's analog law, verbatim:** Free Write is *"a
typewriter for text and a journal page/sketch pad for drawing or
notetaking."* Every chrome decision below answers to it — no digital
styling, no fonts, no formatting on that surface; the Text/Ink toggle is
**the page choosing which analog instrument it is.**
**Ruling recorded:** Free Write's STYLING section is REMOVED (B·I·U leave —
a surface that does not decorate offers no styling buttons; G3 applied to
R1, which this supersedes) and REPLACED by a TEXT / INK toggle with ink
options: brush tip · thickness · color. R2's INK charter is absorbed here.
**Mockups:** `item83-mock-ink-a.html` (toggle at the desk's head) ·
`item83-mock-ink-b.html` (toggle in the band) — both interactive, both
widths, both carrying a rig-only FACE preview for §5's question ·
`item83-mock-draft-type.html` (§6's zone order).

---

## §0 · S0 — FROM DISK: the app already draws
Found, not remembered — `apps/desktop/src/pages/JournalEntry.tsx` and
`apps/desktop/src/store/ink.ts` at `main`:

**What exists (the legacy Journal's J-series, where the logo was drawn):**
- **J9 — a stylus ink layer over the sheet.** A `<canvas>` laid over the
  entry's sheet; **pen-only** (`pointerType !== 'pen'` falls through —
  palm, finger and mouse rejected); listeners attached in the **capture
  phase** so the sheet intercepts a pen before the OS's handwriting-to-text
  can claim it; `touch-action:none` hardening from I0 slice 2 (Samsung
  S25 / Chrome S-Pen — Nick's device); text selection suppressed for the
  stroke's duration. *A pen never types; a key never inks.*
- **J8 — strokes as pure geometry.** Points **normalized 0..1 by the
  sheet's width**, denormalized at paint by the current width on both axes
  (a circle stays a circle); **no colour or width stored per stroke** —
  the one pen reads `--ink-stroke` at render, width is the constant
  `INK_LINE_WIDTH = 1.4`. Persisted to `entry.strokes` via
  `saveJournalEntry`, merged with live text so a pending typed run is never
  clobbered.
- **The sheet model (J9's stated tradeoff):** *ink anchors to the sheet,
  not to words* — text reflows at another width, ink stays where it was
  drawn.
- **J2 — eraser**: a toggle (session-scoped, pen re-arms on open) plus the
  hardware eraser bit as a bonus signal; erase strokes are geometry painted
  `destination-out` at `ERASER_WIDTH = 22`; a quiet ring previews the
  eraser's diameter under the hovering pen.
- **Unified one-level undo** across the last typed run or the last stroke.
- **J12 — thumbnails**: `renderThumbnail` for ink-bearing entries in browse.
- `ink.ts` is explicitly isolated so a smoother (perfect-freehand) can drop
  into `renderStroke()` without touching capture or persistence.

**What PORTS to the framed Free Write page, unchanged in kind:** the
capture pipeline (capture-phase pointer listeners, the S-Pen hardening, the
selection suppression), the normalized-by-width stroke geometry, the
DPR-synced canvas, `paintCommitted`, persistence to the page's strokes,
undo, the eraser and its ring, and the sheet-anchoring tradeoff — with the
**paper column** (`min(760px, 60ch)`) as the new sheet, so the width the
strokes normalize to is the paper's.

**What is NEW, and must be named as new:**
1. **Per-stroke attributes.** Tip, thickness and colour are Nick's ruling;
   J8 stores none of them. The stroke model grows — `tip · width · color`
   per stroke (or a pen-change record between strokes). **Schema-shaped**:
   the strokes field's shape changes; the build brief must say so and
   migrate old strokes as *pen · regular · the ink token*.
2. **The pointer contract changes under a mode.** The Journal decides by
   *device* (pen inks, everything else falls through). Under the analog law
   the page decides by *instrument*: in INK the page is a sketch pad and
   the pointer draws — pen first, and **mouse or finger on a desk without
   a stylus** (the laptop is the primary target); in TEXT the page is a
   typewriter and the ink layer is inert. Pen-only rejection becomes
   *finger-is-scroll* on the tablet only when a pen is present.
3. **Tips.** Three tips (pen · pencil · marker) as inline-SVG icons per R8;
   each a render profile in `renderStroke()` (the isolation J9 promised) —
   pen: round cap, uniform; pencil: slightly textured, lighter; marker:
   broad, square cap, translucent. Pressure is not stored today; tips ship
   pressure-blind first, pressure rides a later slice.
4. **Thickness as stops, not a slider.** Fine · Regular · Broad. A slider is
   a digital control; a nib is chosen, not dialled.
5. **Colour as the theme's inks.** Four swatches supplied by the theme's
   ink tokens (Plateau: walnut · iron · oxblood · sea), never a colour
   picker — a journal has the inks on the desk.

## §1 · THE TOGGLE'S GRAMMAR — a mode of the page, not a tool
The toggle is not an instrument *in* the desk; it says which instrument the
page *is*. That is why it cannot be a zone among zones. Two lawful seats,
rendered as the pair for Nick's eye:
- **A · the desk's head.** A two-state engraved switch — TEXT | INK — above
  every zone, in the drawer but not of it; the INK options row reveals in
  place beneath it (G4). Argument: the Desk is where the writer picks up an
  instrument; the switch is the first thing the hand meets.
- **B · the band.** The switch sits beside the location line, page-level
  chrome for a page-level state, visible with the drawer closed. Argument:
  a mode of the page belongs where the page's other states are read; and
  on the tablet with the drawer shut, the writer still sees which instrument
  the page is. Cost: the band is tight at 1366 (measured in the mockup).
**Committee lean:** B for grammar, A for reach — the pass presents both and
leans B, because *"which instrument am I"* is state the writer must read
without opening anything (the bench's visibility law). One word picks.

**The switch's dress:** olive engraved at rest, the active side wearing the
olive hairline; the flip is an evental press (brass flash); the page's
caret goes dormant in INK (the typewriter is put down) and the pen's
ring/point appears — the instrument change is *visible on the paper*, not
only in the switch.

## §2 · THE OPTIONS ROW — Plateau register
Revealed only in INK (in place; nothing grayed in TEXT — the typewriter has
no nibs). Three groups, one line: **TIP** (three icons, radio) · **NIB**
(Fine · Regular · Broad, radio) · **INK** (four swatches, radio) · and the
**eraser** as the Journal built it (toggle, ring preview). Olive rest,
olive hairline on the chosen, brass on press. No labels beyond the three
engraved group heads; the analog desk has no captions on its pens.
**One question surfaced, not decided:** should the eraser belong to the
**pencil tip only** (a pen and a marker do not erase — the strictest analog
reading), or stay tip-agnostic as built? Default: **as built** (tip-
agnostic), the pencil-only reading offered for Nick's word.

## §3 · THE INK STRATUM — over, sheet-anchored, one page
Over the text, as a transparent sheet laid on the typewritten page — the
analog act is writing *on* the page with a pen. **Not under** (ink behind
type is hidden by type). **Not a separate page** (two pages breaks the
analog law: one page, two instruments). **Sheet-anchored, not word-
anchored**, porting J9's tradeoff knowingly: text reflows, ink stays; the
paper column's width is the normalizing width. The layer never intercepts
in TEXT; in INK it intercepts everything on the paper.

## §4 · TABLET / S-PEN POSTURE — Nick's own devices
Port I0's hardening whole. In INK on the tablet: pen draws; finger scrolls
the page; palm is rejected by the capture pipeline as today. On the laptop:
mouse or trackpad draws in INK (the primary target must draw). Flip
gesture: the switch is one tap and sits where the pen already is; the
S-Pen's barrel button as a flip is *deferred* (hardware-reserved, like
BD1's seat). The eraser ring survives. Hover where the device reports it.

## §5 · THE QUESTION FOR NICK — typewriter as BEHAVIOR or also as FACE
The analog law says *typewriter*. Two readings, both lawful, one word:
- **Behavior only.** Forward-only, strike-through, no styling — and the
  text keeps **the app's prose serif** (Crimson Pro under the cross-theme
  prose-pair law). The typewriter is how the page *acts*.
- **Behavior and face.** Free Write's text set in a **monospace typewriter
  face**; the page *looks* like the instrument it is. This touches the
  cross-theme prose-pair law and each theme's seam (Plateau's Crimson Pro,
  Machina's Plex, Volant's Manrope) — so the word is Nick's **and the theme
  arc's**, not this pass's.
Both mockups carry a **rig-only FACE preview** (serif ↔ mono) so the eye
can decide; the mockup's default is the current law (serif).

## §6 · LAYOUT — Draft's Desk gains a TYPE zone (112-C)
Zone order, top to bottom, reading from the sentence outward: **STYLING**
(marks on words) → **FORMAT** (shapes of blocks) → **TYPE** (the page's
dress: face · size, 112-C's section mounting here per Nick) → **STRUCTURE**
(the document's structure, at the tab's foot per the walkthrough errata).
TYPE sits **immediately above STRUCTURE**: the page's dress is the largest
scope before the document's, and the errata's foot placement is preserved.
Rendered in `item83-mock-draft-type.html`.

## §7 · RECORD APPEND (for the rulings file, on Nick's paste)
**R15 · FREE WRITE IS ANALOG.** The analog law verbatim (above). STYLING
removed from Free Write (R1 superseded for that surface; Draft keeps B·I·U).
R2's INK charter absorbed: TEXT / INK toggle as the page's instrument;
options tip · nib · ink; layer over, sheet-anchored; eraser as built.
Open words: the toggle's seat (A/B); the eraser's tip binding; the FACE
question (§5, with the theme arc); the S-Pen button flip (deferred).

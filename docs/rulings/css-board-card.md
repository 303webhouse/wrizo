# Rulings: `apps/desktop/src/styles/09-board-card.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[board-card §n]` points here.

## board-card §1

From `apps/desktop/src/styles/09-board-card.css`, line 1 at `25112784` (the comment that stays: "THE BOARD-CARD (PW2 S2): a nested board on its parent's canvas, riding the same .board-pin box a page does. Its kind is told by shape, never colour: a doubled edge drawn by ::before at z-index -1. No isolation here on purpose: a new stacking context would trap the pseudo-element in front of the card").

```css
/* ===== PW2 S2 — THE BOARD-CARD (item 128) ================================
   A nested board on its parent's canvas. It rides the SAME `.board-pin` box a
   page does — the membership is the same relation — so this rule adds only the
   face.

   SHAPE TEACHES THE KIND, AND SPENDS NO COLOUR. The silhouette is a DOUBLED
   EDGE: a second border offset behind the card, drawn by `::before` at
   z-index:-1 (Journey D's `.brdcard`). "A thing that holds things", said in
   geometry. This is the job Pass 5 routed to item 96 as colour-as-kind-signal
   — shape does it instead, so a third card kind costs the Plateau ember
   ceiling nothing and reads the same in every theme.

   `isolation:isolate` is NOT set here on purpose: the pseudo-element must sit
   BEHIND the card's own background, and a new stacking context would trap it
   in front. The card already paints an opaque `--panel` ground, so z-index:-1
   lands it between the card and the canvas rather than under the canvas. */
```

## board-card §2

From `apps/desktop/src/styles/09-board-card.css`, line 49 at `25112784` (the comment that stays: "the olive pin, the connection grab at the card's top-left on every card: a circle (the one exception to square corners, as .status-dot), olive because it is a connection, never brass. A domed sphere-top: an off-centre highlight lit from the top left, as the card's shadow is, darkening to a hand-computed olive rim; the 1px border keeps the dome contained (fx5.mjs S5 asserts the radius)").

```css
/* FX5 S5 — the olive pin: the connection grab, at the card's own top-left
   corner, on every card, always (not selection-gated — see BoardEditor.tsx's
   own onDown comment for why the two-step arm-then-drag gesture it replaces
   is gone whole). A genuine circle — Nick's own ruling, quoted in the brief
   — the one deliberate exception to this file's square-corners law for a
   small state/grab indicator (matching .status-dot's own existing
   precedent, above). Olive (--accent-rest) marks it as a STATE/connection
   affordance, never brass (brass is reserved for actions like the resize
   handle) — the lane law holds.
   FX8 S1 — Nick's words: "the green pins on the cards don't really look
   like pins... Can we make the pins look a bit more like the top of a
   green sphere instead of a 2D circle?" A flat single-color fill reads as
   an outlined disc; a domed sphere-top needs the two things a flat fill
   can never fake — a light source (an off-center highlight, NOT centered,
   so it reads as reflecting light from one direction) and a rim that
   darkens as it curves away from that light. `radial-gradient(circle at
   35% 28%, ...)` puts the highlight upper-left (a conventional top-left
   light source, matching the card stock's own drop-shadow direction below-
   right — `.board-text`'s `box-shadow:2px 2px 0...4px 5px 10px...` — so
   the pin's own implied light and the card's own implied shadow agree),
   fading through the SAME --accent-rest hue family to a hand-darkened rim
   tone (this codebase has no color-mix()/filter precedent anywhere in this
   file for deriving a shade FROM a custom property at runtime — every
   other gradient here hard-codes its own literal stops, e.g. the wz-bloom/
   wz-cascade-thumb radial-gradients above — so #D9DEB8/#4F5730 are hand-
   computed lighter/darker steps off --accent-rest's OWN #96a05a working
   value, the same "olive hue family" the brief asks for, not a different
   color). The 1px --ink-950 border stays (unlike the handle's OWN border
   removal in S2, just above) — it's what keeps the domed gradient reading
   as a contained sphere rather than a soft blob bleeding into the card
   behind it. The box-shadow is a small, downward-right offset (1px 2px
   3px) — the SAME lighting direction as the card's own shadow, "the way a
   raised sphere would cast one against the card's own shadowed surface"
   (the brief's own words), not a generic centered glow. Same ~12px size,
   same border-radius:50% (fx5.mjs's own S5 check still asserts this
   verbatim — confirmed unbroken, no A4 park needed). */
```

## board-card §3

From `apps/desktop/src/styles/09-board-card.css`, line 86 at `25112784` (the comment that stays: "the grabbing cursor while a move-drag is held: a canvas-level data-dragging flag, read as data-thread-armed is; board-wide, since only one drag is ever in flight").

```css
/* FX8 S3 — Nick's own DoD line: "drags it with one continuous motion" —
   a `grab`-family cursor throughout would already communicate "you CAN
   drag this," but the brief explicitly invites (and CC's own build report
   discloses the choice to take) the extra `grabbing` swap the instant a
   real move-drag is actually held, the same closed-hand convention this
   codebase already established for the pin's own thread-drag above (one
   line up) and for the canvas's own `data-thread-armed` attribute pattern
   — reused here verbatim, not reinvented: `data-dragging` is a plain
   canvas-level flag (BoardEditor.tsx's own `isDragging` state, set true
   only in `beginMove` — the REAL "past the 6px threshold, actually moving"
   phase, never `pending`/`resizing`/`threadDrag` — and cleared in `finish`
   on every gesture end) read here the identical way `data-thread-armed`
   already is. Scoped board-wide rather than per-box: only one drag can
   ever be in flight at a time (a single pointer), and the dragged card
   moves WITH the pointer by construction (onMove adds the same delta to
   both), so the cursor is never wrong about which card it's hovering. */
```

## board-card §4

From `apps/desktop/src/styles/09-board-card.css`, line 116 at `25112784` (the comment that stays: "fit to text: a small square icon on a hand-sized card beside the resize grip; shown on hover or focus (a real button, so Tab reaches it), receding with the chrome; guidance colour at rest, --choice only while pressed; square, flat, no shadow; its words from the lexicon").

```css
/* BUG 32d - FIT TO TEXT (Nick, Oct 30): a small square icon on a HAND-SIZED card (sizedByHand), beside the resize grip on the card's bottom edge. Quiet: it shows only while the card is hovered or holds focus (it is a real button, so Tab
   reaches it and :focus-within shows it), and goes with the rest of the chrome in the recede. GUIDANCE colour at rest (--badge-on-card: olive in Arbor, cyan in Flux, the steel / grey of the machine's cards), the HUMAN-ACTION colour
   (--choice) only while it is pressed. Square edges, flat 1 px, no shadow. Its words come from the lexicon (boardFitToText, per theme). */
```

## board-card §5

From `apps/desktop/src/styles/09-board-card.css`, line 148 at `25112784` (the comment that stays: "line widths: lines 1px, the arm 1.25px, a selected line 2px; non-scaling-stroke keeps them true if the board's svg is scaled").

```css
/* Widths per the approved mockup spec (Fable, Oct 15): lines 1px, the arm 1.25px, a selected line 2px. non-scaling-stroke: the widths stay true if the board's svg is ever scaled. */
```

## board-card §6

From `apps/desktop/src/styles/09-board-card.css`, line 219 at `25112784` (the comment that stays: "the close X sits at the strip's right end, the card's top-right corner, in the card's own ink (it sits on the cream stock, not the page); the editor's bottom padding takes the room a foot used to give").

```css
/* card-close-x (2026-10-13) - the foot and its "Close" button retired; the editor's bottom padding
   takes over the room the foot gave the text. The X sits at the strip's right end, the card's
   top-right corner, in the card's own ink (flux-card-ink: --ink-on-card and its -low, not
   --ink-on-paper — this X sits on the card's own cream stock, not the page). */
```

## board-card §7

From `apps/desktop/src/styles/09-board-card.css`, line 271 at `25112784` (the comment that stays: "the screenplay sheet is a page of its own: US Letter at 12pt, where 1in = 6em and Courier's 1ch = 0.6em, so the page (51em by 66em), the margins (9em left, 6em right, top and bottom), the 60ch measure and the 1em line all follow from one number. Every dimension is em, so changing that number scales the whole sheet as one object and the grid never reflows. box-sizing:border-box makes width:51em the page including its margins; height is exact, so every sheet in the sequence is the same page").

```css
/* FX1 S2 — font-family lives on the sheet itself now, not just the legacy
   `.script-page` wrapper: the framed branch (DeskFrame's `.desk-frame-host`)
   never carried that class, so the courier convention was silently missing
   there (part of Nick's "collapsed, wrong-dimension box with misaligned
   text" verdict — courier's fixed advance width is what the WIDTH_CH/ch
   measures in store/scriptMetrics.ts assume). Legacy stays byte-identical
   (still inherits the same value from .script-page either way).

   SC1 S1 (Nick's first screenplay sitting, SC-V2/SC-V3) — the page becomes a
   PAGE. Root cause, measured before anything was touched (not read off the
   CSS): this rule set margins in real inches but never set a page, so the
   sheet had no width of its own — inside `.mode-pagecol` (a flex COLUMN) its
   `margin:0 auto` turns off cross-axis stretch, and the paper shrink-wrapped
   its own content. Measured at 1280px: a fresh page's sheet rendered 424px
   wide, and typing ONE long slugline grew it to 615px — the paper physically
   changed size as the writer typed (Law 1's own inverse). The 1in/1.5in
   paddings, being real inches, then ate 240px of those 424px and left a
   184px text column: ~19 characters per line where the trade's page carries
   60. That single defect is what Nick saw three ways — "the page is in a
   weird spot" (SC-V1), "the font is too big" (SC-V2, type that is correct at
   12pt reading as enormous against a 19-character measure), and "the size of
   the page is not commiserate to one page of screenwriting" (SC-V3).

   The standard, pinned by the SC committee (docs/wrizo-alpha/
   sc-committee-pass.md): US Letter 8.5 x 11in; Courier 12pt = 10 characters
   per inch, 6 lines per inch; margins left 1.5in, right 1in, top 1in,
   bottom 1in; text measure 6.0in = 60 characters.

   ONE derivation makes all of that fall out, so nothing here can drift:
   at 12pt, 1em = 16px = 1/6in, so **1in = 6em** exactly, and Courier's 0.6em
   advance makes **1ch = 0.6em** exactly. Every dimension below is therefore
   the trade's own inch measure written in em —
     8.5in page = 51em     11in page = 66em
     1in margin = 6em      1.5in margin = 9em
     6.0in measure = 51 - 9 - 6 = 36em = 60ch  (the grid in
     store/scriptMetrics.ts is stated in ch and lands on it by construction)
     6 lines/inch = 1em per line = `line-height:1`
   — so the page, the margins, the measure, the metric and the leading are
   all one number's consequences. THE SCALING LAW is that number's own
   definition, below: 1rem (12pt, the page at its true size) until the room is
   genuinely narrower than a page, and `100cqw / 51` — the container's own
   inline size divided by the page's width in em — from there down. Because
   every dimension is em, changing that one number scales the WHOLE sheet as a
   single object: every inch shrinks by the identical ratio, no inch ever
   compresses independently, and the grid never reflows.
   `box-sizing:border-box` (this file's line 4) is load-bearing: `width:51em`
   is the page INCLUDING its margins, exactly as a sheet of paper is.

   Height WAS `min-height`, not `height` — SC1's lawful interim, disclosed in
   its own brief: until SC2 derived page breaks, a script that overflowed 11in
   simply grew taller. SC2 S2b closes it. `height:66em` is now exact and every
   sheet in the sequence is the same page: a sheet that could grow is a sheet
   whose height is a function of its content, and then "page 12" is not a page,
   it is however much text happened to land there. The arithmetic decides what
   goes on a page; the paper never negotiates. */
```

## board-card §8

From `apps/desktop/src/styles/09-board-card.css`, line 329 at `25112784` (the comment that stays: "the scaling is one-directional: true size (816px, 12pt) is the most a page ever is, never multiplied by --paper-scale (a screenplay page is a physical reference); below 816px of room the min() arm scales the whole page as one object").

```css
/* The scaling law is one-directional, exactly as the SC1 brief states it:
     the sheet keeps true proportions "below its natural width," and its
     natural width is a US Letter page at 12pt — 816px — full stop. This is
     deliberately NOT multiplied by `--paper-scale` the way prose's measure is:
     prose has no true size, so a wide monitor may lawfully enlarge its paper,
     but a screenplay page IS a physical reference (the whole point of SC-V3),
     and 12pt is the trade's own number. Nick's "the font is too big" verdict
     was recorded at a ~2560px sitting, where `--paper-scale` is 1.2 — type
     rendering at an effective 14.4pt. Below 816px of room the min() arm takes
     over and the WHOLE page scales as one object (every inch by the identical
     ratio, no inch compressing on its own, the grid never reflowing). */
```

## board-card §9

From `apps/desktop/src/styles/09-board-card.css`, line 348 at `25112784` (the comment that stays: "THE SEQUENCE, and the gap between sheets: the gap is chrome, never body. In rem, never the sheet's em, so it does not scale with the paper; not a multiple of --script-line (1.5 lines at 24px), so no one can mistake it for blank lines; and flex gap, so nothing can render into it (sc2.mjs asserts none does). align-items:stretch keeps each sheet filling the column").

```css
/* SC2 S2b — THE SEQUENCE, AND THE GAP BETWEEN SHEETS.
   The gap is CHROME, never body. That distinction is the whole design of this
   rule, and it is load-bearing in three ways:

   1. It is expressed in `rem` — the app's own root unit — and NEVER in the
      sheet's `em`. `em` on this surface is the PAGE's unit: 1em is one 12pt
      line box and every dimension of the paper is written in it. A gap in `em`
      would scale with the paper under SC1's scaling law, as though the space
      between two sheets were part of a sheet. It is not; it is the desk showing
      between them.
   2. For the same reason it is not `var(--script-line)` or any multiple of it.
      The line unit is what the ledger counts in, and a gap of N line units is a
      gap a reader — or a later maintainer — can mistake for N blank lines of
      screenplay. 24px against a 16px line box is 1.5 lines: not a whole number
      of lines in any state, which is the point.
   3. Nothing may be rendered INTO it. The sequence owns the gap as flex `gap`,
      so it is space between flex items and cannot contain a child at all. That
      is asserted rather than assumed (sc2.mjs: no `.script-el` lies between one
      sheet's bottom border and the next's top, and no element's rect straddles
      a sheet boundary).

   `align-items:stretch` (the default) is what lets `.desk-frame-stage
   .script-sheet{width:100%}` keep filling the column, exactly as it did when
   the sheet was the column's own child. */
```

## board-card §10

From `apps/desktop/src/styles/09-board-card.css`, line 376 at `25112784` (the comment that stays: "the line unit, and the rules that keep the render wrapping as store/scriptLedger.ts counts (sc2.mjs compares the two): --script-line is one line box, so N blank lines render as N line-heights; overflow-wrap:anywhere breaks an over-long word at the measure; hyphens:none, because a hyphenating browser would break every count").

```css
/* SC2 S1 — the line unit, and the three rules that keep the RENDER wrapping
   exactly the way store/scriptLedger.ts's arithmetic says it does. The ledger
   is the truth and this is what is checked against it (sc2.mjs compares an
   over-measure element's rendered line count against the ledger's), so any
   divergence here is a defect, not a difference.

   --script-line is ONE LINE BOX. `.script-sheet` sets line-height:1 at 12pt, so
   a line is exactly 1em of the sheet's own font-size and scales with it under
   SC1's scaling law. Vertical spacing is expressed in THIS unit and never in px
   or em, so N blank lines of arithmetic render as exactly N line-heights.

   overflow-wrap:anywhere — a word longer than its measure must break AT the
   measure (a 70-character URL in an action line occupies ceil(70/60) lines).
   Without it the word would overflow the measure while claiming one line, and
   the paginator would place a break the page contradicts.

   hyphens:none — screenplays do not hyphenate, and a browser that decided to
   would break every count by one, silently. */
```

## board-card §11

From `apps/desktop/src/styles/09-board-card.css`, line 401 at `25112784` (the comment that stays: "the first element of a page contributes no space above it: here at document start, and the paginator applies the same rule at every page top (store/scriptLedger.ts reports intrinsic spacing, so it stays position-independent); it also keeps the sheet from being pushed down by a first child's margin").

```css
/* SC2 S1 — "the first element of a page contributes no space above it." At
   document start that is this rule; S2's paginator applies the identical rule
   at every page top. It lives in the CONSUMER, never in the ledger, which
   reports each element's INTRINSIC spaceBefore so it stays position-independent
   (and so elementStyle() stays a pure function of the type, which is what lets
   S5 freeze one style object per type).

   It is also geometry protection: a first child's margin-top would otherwise
   push the whole sheet down, re-opening the very defect SC1 closed — SC-V4,
   "the cursor starts by floating in the middle of the page." The screenplay
   begins at the top margin, and this is one of the two things keeping it
   there. */
```

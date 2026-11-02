# Rulings: `apps/desktop/src/styles/13-desk-frame.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[desk-frame §n]` points here.

## desk-frame §1

From `apps/desktop/src/styles/13-desk-frame.css`, line 40 at `25112784` (the comment that stays: "the strip is flush at the screen's left edge while the paper stays centred in the viewport: the strip is out of the grid's flow (position:absolute), the host's padding is symmetric (--frame-host-pad-x) and the strip's negative offset cancels it with the same token, so the two cannot drift; leftover width splits evenly around the paper (fx5.mjs S10)").

```css
/* FX4 S3 — the strip flushes to the SCREEN's own left edge, not merely the
   frame's: the host's own left inset (previously `clamp(16px,3vw,40px)`,
   symmetric with the right) is killed outright (right/top/bottom keep their
   existing values — only left changes) and the grid itself trades its old
   `margin:0 auto` CENTERING for a LEFT-anchor (`margin-right:auto` only) —
   without that second change the grid would still float centered inside
   the now-wider host box, undoing the point. Two measurable consequences,
   both intended: (1) near the DESKFRAME_MIN_WIDTH floor, where the grid
   isn't yet capped by --frame-max, the reclaimed ~16-40px of host padding
   feeds straight into `minmax(0,1fr)` (the stage track — the only track
   that isn't a fixed width), literally the "reclaimed width feeds the
   stage" the brief names; (2) at a wide viewport where the grid IS capped
   at --frame-max, the leftover space (viewport minus frame-max) now sits
   entirely on the RIGHT instead of split as symmetric margins — the old
   cd1.mjs symmetric-margins assert is SUPERSEDED by this deliberate change
   (parked in cd1.mjs, live successor in fx4.mjs asserting strip x===0 at
   both reference widths + the 1100 floor instead).

   FX5 S10 (Nick's A1 verdict, generation 2 — cd1.mjs's own parked check
   gains a note pointing here, the accretion precedent) — the FX4 S3 shape
   above turned out to be the WRONG asymmetry: flushing the strip also
   dragged the PAPER off-center at a wide viewport (all the leftover width
   piling on the right, exactly what cd1.mjs's OLD parked check used to
   assert as wrong the OTHER way). The composition law now: strip flush at
   the screen's own left edge STAYS (Nick never asked to lose that), but
   the paper returns to true viewport-center, with leftover width split
   symmetrically around IT specifically — not the same symmetric-margins
   claim restored (that measured the whole GRID's margins), a NEW one
   (measures the PAPER's own gap on each side, strip's width excluded from
   the measure per the brief's own words). Two changes make this true at
   once: (1) `.desk-frame-strip` (below) pulls itself OUT of the grid's own
   flow (`position:absolute`) — its DOM position inside `.desk-frame-grid`
   is now irrelevant to layout (grid auto-placement skips out-of-flow
   items), so `.desk-frame-grid`'s own template drops the strip's track
   entirely and its content is JUST stage(+corkboard) again; (2) this
   host's own padding goes back to SYMMETRIC (`--frame-host-pad-x` on both
   sides) so the grid's restored `margin:0 auto` (below) true-centers
   within a viewport-centered content box, not a left-biased one. The
   strip's own negative left offset (below) exactly cancels this padding
   to land back at x=0 — the two rules share one token, `--frame-host-pad-
   x` (:root, above), so they can never drift out of step with each other
   the way two independently-typed `clamp(16px,3vw,40px)` calls could.
   Verified empirically (not derived on paper alone, this ticket's own
   standing discipline): with the strip out of the grid's own width
   budget, the paper's own centering math collapses to the PLAIN "centered
   directly in the viewport" formula regardless of the stage track's own
   width (nested centering inside centering is still just centering) —
   confirmed the strip's own 84px + --frame-gap's 28px (112px total) never
   overlaps the paper's own natural left margin even at the 1100px floor
   (measured ~200px of clearance there, the tightest case — see fx5.mjs's
   own S10 section for the live rect proof at all three reference
   widths). */
```

## desk-frame §2

From `apps/desktop/src/styles/13-desk-frame.css`, line 142 at `25112784` (the comment that stays: "the strip hangs flush off the top bar's dividing line: top:-16px cancels the spacer the editors render under the bar, and the strip drops its own top border and corner rounding").

```css
/* Nick's own call — the strip rides FLUSH up to the top bar's own dividing
   line: `top:-16px` cancels the 16px spacer between the top bar and the
   frame (PageEditor/ScriptEditor/JournalEntry all render that same spacer),
   and the strip drops its own top border + top corner-rounding so it hangs
   straight off that line instead of drawing a second one just below it. */
```

## desk-frame §3

From `apps/desktop/src/styles/13-desk-frame.css`, line 147 at `25112784` (the comment that stays: "the strip must win its own band: z-index:1, so the stage that follows it in the DOM cannot cover it for a real pointer. Geometry would move the paper, which never reflows for chrome; 1 is the smallest value that beats auto, and nothing else legitimately overlaps the strip").

```css
/* ITEM 130 (2026-09-09) — THE STRIP MUST WIN ITS OWN BAND.
   The strip is absolute and pulled out to x=0; `.desk-frame-stagecol` is the
   normal-flow sibling that FOLLOWS it in the DOM and begins at the host's own
   padding-left. Both were `z-index:auto`, so DOM order decided and the stage
   painted on top: at 1280px `--frame-host-pad-x` resolves to 38.4, the stage
   covered the strip's 38.4-84 band, and `elementFromPoint` at a strip item's
   own centre (x~42) returned `.desk-frame-stage` — roughly the right 54% of
   the strip was unreachable by a REAL pointer. Every harness had reached these
   controls with `.click()`, which never consults the hit-testing stack, so
   nothing caught it until pw1.mjs drove real pointer events.

   WHY z-index AND NOT GEOMETRY. Moving the stage clear of the strip would move
   the PAPER, and paper never reflows for chrome — the probe asserts the dock
   flush at 0.00px. A geometry fix would trade one law for the other. Raising
   the strip changes hit-testing without changing layout at all.

   WHY z-index:1 IS SAFE, censused rather than assumed: the cascade panel, the
   tool sliver and the tutor panel/grip are all absolutely positioned INSIDE
   `.desk-frame-stage` and sit right of the band (the cascade is anchored flush
   at the strip's own right edge, x=84), so nothing legitimately overlaps the
   strip and nothing falls under it. Modals, backdrops and toasts are `fixed`
   at z-index 80-300, far above this. 1 is the smallest value that beats
   `auto`, chosen so this rule claims no more of the stack than it needs. */
```

## desk-frame §4

From `apps/desktop/src/styles/13-desk-frame.css`, line 170 at `25112784` (the comment that stays: "Trash reaches the foot: min-height does not make a height definite, so the strip's height:100% fell back to auto; this element is a flex column and the strip takes flex:1, so its foot's margin-top:auto has room to push against (item137.mjs)").

```css
/* ITEM 137 (2026-09-13) — THE TRASH REACHES THE FOOT.
   Founder: "the trash has never been aligned at the bottom of the rail - it's
   inline with the rest of the menu options." MEASURED, headful, before any
   change (docs/menus/item137-s0-measurement.md):

     1366x768   gap 8.8px    .wz-strip 544.4px   aside 545.2px
     1366x1200  gap 303.6px  .wz-strip 544.4px   aside 840.0px

   `.wz-strip` rendered the SAME 544.4px at both viewport heights while this
   aside tracked 70vh exactly (0.70 x 1200 = 840). Its `height:100%` resolves
   against this element's HEIGHT, and `min-height` does not make that height
   definite - so the percentage fell back to auto, the strip went content-tall,
   and `.wz-strip-foot{margin-top:auto}` had no free space to push against.
   At 768 the gap is only 8.8px, which is why it reads as "inline" rather than
   as a broken pin; the taller the window, the further Trash strands.

   THE FIX IS GEOMETRY ONLY AND ADDITIVE: this element becomes a flex column so
   its child has a definite box to stretch into, and `.wz-strip` takes `flex:1`
   in place of the percentage (below). Nothing else here moves - ITEM 130's
   `z-index:1` on this same rule is untouched, and its hit-test coverage runs
   beside the new pin check in item137.mjs so the two cannot trade places. */
```

## desk-frame §5

From `apps/desktop/src/styles/13-desk-frame.css`, line 267 at `25112784` (the comment that stays: "the script page mounts the same .mode-pagecol geometry prose uses, at the same width band, so the paper's measure is the one constant; Courier's ch measures are relative to the sheet's own font size").

```css
/* FX1 S2 — Law 1 (the paper's measure is the one inviolable constant): the
   script page now mounts the SAME `.mode-pagecol` geometry class prose uses,
   at the SAME width band, rather than forcing its own wider (900px/70ch)
   measure on the bare stage track. This is the fix for Nick's "collapsed,
   wrong-dimension box with misaligned text" verdict — the old
   `.desk-frame-stage--screenplay` rule sized the STAGE, not a paper inside
   it, and .desk-frame-scroll-cap/.script-sheet had no width of their own to
   inherit, so the flex item shrank to fit-content instead. Courier's
   per-element ch measures (store/scriptMetrics.ts) are unaffected — they're
   relative to the sheet's own font size, not the page's pixel width. */
```

## desk-frame §6

From `apps/desktop/src/styles/13-desk-frame.css`, line 285 at `25112784` (the comment that stays: "THE PROSE PAGE IS A LETTER PAGE, in page units (docs/plans/page-size.md): 8.5 x 11 page-inches, margins in page-inches (pageDress.ts), type in points (fontSize.ts). One number, --wz-letter-in, written on this stage from its size (store/pageScale.ts), scales all three, so the page grows in shape only and every line breaks where it did; the value here is scale 1, for the first paint. Every anchor reads --wz-page-w / --wz-page-half").

```css
/* PAGE-SIZE (Fable + Nick, Oct 23; docs/plans/page-size.md) - THE PROSE PAGE IS A LETTER PAGE, in PAGE UNITS. The FX3 S2 measure above
   (`min(760px x scale, 60ch)`) is retired for prose: the page is 8.5 x 11 page-inches, its margins are page-inches (pageDress.ts) and its type is
   points in page units (12 pt = 16px at scale 1, fontSize.ts). ONE number scales all three - `--wz-letter-in`, one page-inch, written on this stage
   by DeskFrame's observer from the STAGE's size alone (store/pageScale.ts; ruling c) - so the page grows in SHAPE only and every line breaks where
   it did. The value here is scale 1, for the first paint. `--wz-page-w`/`--wz-page-half` are what every anchor that used to hand-copy the page's
   width now reads (the sliver, both Tutor anchors, the glow, the instrument, the cascade). */
```

## desk-frame §7

From `apps/desktop/src/styles/13-desk-frame.css`, line 291 at `25112784` (the comment that stays: "the page lays out at scale 1 always and is painted at --wz-k by a transform (below), so every line breaks where it does at 1366; the anchors read the painted width (--wz-anchor-w, --wz-page-half), the zoomed width while zoomed").

```css
/* AS BUILT (the lane run on fb1e28fb): the page LAYS OUT at scale 1 always - --wz-letter-in is the scale-1 inch - and is PAINTED at the base scale
   --wz-k by a transform (below), so every line breaks where it does at 1366 at every size. The anchors (sliver, Tutor, glow, instrument, cascade)
   read the PAINTED width: --wz-anchor-w / --wz-page-half - the zoomed width while the zoom is on. */
```

## desk-frame §8

From `apps/desktop/src/styles/13-desk-frame.css`, line 309 at `25112784` (the comment that stays: "a definite height, so the letter-tall page shrinks to the stage instead of growing the column past it").

```css
/* a DEFINITE height, so the letter-tall page below shrinks to the stage (ruling d) instead of growing the column past it */
```

## desk-frame §9

From `apps/desktop/src/styles/13-desk-frame.css`, line 368 at `25112784` (the comment that stays: "the prose page: letter height capped to the stage (a flex item that may shrink; the text scrolls inside it); margins in page-inches (normal 1in, narrow 0.684, wide 1.526), top and bottom 0.85in. --paper-scale:1 inside the page, because page units carry the scale here; --wz-page-pad-x is the finished margin the scrollbar cancellation reads").

```css
/* PAGE-SIZE - the prose page: letter height, capped to the stage (ruling d - a flex item that may shrink, so on a short screen the sheet stops at
   the stage's fence and the text scrolls inside it as it always has); margins in page-inches (ruling b: normal 1in, narrow 0.684, wide 1.526);
   the top and bottom margin 0.85in (Cursor's mockup). `--paper-scale:1` INSIDE the page: page units carry the scale here, so any rule inside
   the page that still multiplies by --paper-scale (TOOLS' scrollbar-flush cancellation on .mode-scroll among them) multiplies by 1 - correct
   whichever of the two branches merges first. `--wz-page-pad-x` is the one FINISHED margin length that cancellation reads. */
```

## desk-frame §10

From `apps/desktop/src/styles/13-desk-frame.css`, line 378 at `25112784` (the comment that stays: "the layout height DeskFrame computes (letter, or what the stage holds once painted at --wz-k); the transform paints it at k").

```css
/* the LAYOUT height DeskFrame computes (letter, or what the stage holds once painted at --wz-k - ruling d); the transform paints it at k */
```

## desk-frame §11

From `apps/desktop/src/styles/13-desk-frame.css`, line 386 at `25112784` (the comment that stays: "THE ZOOM: the same page transformed by --wz-zoom (1.6, capped to the stage's width), scale never reflow, so its layout box and every line break stay as in the normal view. The column widens to the stage so the band mask spans the zoomed page. THE BAND, in line-heights (--tw-lh) from the anchor at 50% of the column (--tw-lead keeps the .12 stop 56px or more from the top): 0 at the top, .12 / .40 / .72 at 6.6 / 4.2 / 2.2 lines above, full from 0.15 above to 1.45 below, .40 at 2.8 below, 0 from 4.4 below. Text and paper fade into the desk together; this band replaces the scroller's top mask").

```css
/* PAGE-SIZE (spec point 3; Cursor's mockup @ e3c4e462, FINAL) - THE ZOOM. The SAME page, transformed ~1.6x (--wz-zoom, DeskFrame's observer:
   1.6 capped to what fits the stage's width) - scale, never reflow: the page's own layout box, its width and every line break stay exactly as in
   the normal view. The column widens to the stage so the band mask (drawn in ITS box) spans the zoomed page; the page keeps its own width.
   THE BAND: Cursor's final stops, in line-heights (--tw-lh, the real line height x the zoom, written by the typewriter engine) from the anchor
   (50% of the column since polish #10 item 19, 60% before - the engine holds the writing line's top there; --tw-lead keeps the .12 stop 56px or more from the
   top, so the top rows stay in the theme's ground at 1366, where 6.6 lines above a 50% anchor is 13px - polish10-ground G1): 0 at the top, .12 / .40 / .72 at 6.6 / 4.2 / 2.2 lines above, full from
   0.15 above to 1.45 below (the writing line alone), .40 at 2.8 below, 0 from 4.4 below. Text AND paper fade into the desk together - the paper
   is never framed by an edge or a shadow while zoomed. The old top-of-scroller mask (a .15 floor) stands down: this band replaces it. */
```

## desk-frame §12

From `apps/desktop/src/styles/13-desk-frame.css`, line 394 at `25112784` (the comment that stays: "while zoomed the Sliver keeps DRAWER_MIN by growing rightward from its anchor, over the zoomed band (a tool overlays, nothing is displaced); never leftward, under the strip; its grip stays on top, so it still closes").

```css
/* PAGE-SIZE - while zoomed the drawers' anchors follow the ZOOMED edge, which leaves the Sliver only the zoom's gutter of desk: opened there, it
   was crushed to 48px (2560) / 22px (3840) with its own buttons outside it (screens on 67ebc075). Opened while zoomed it keeps DRAWER_MIN by
   growing RIGHTWARD from its anchor, OVER the zoomed band (a tool overlays; nothing is displaced). Not leftward: at 1366 that ran it under
   the strip, which covered its own buttons (c9b8035b). Its grip (z-index 2 within the Sliver) stays on top of it, so it still closes. */
```

## desk-frame §13

From `apps/desktop/src/styles/13-desk-frame.css`, line 399 at `25112784` (the comment that stays: "while zoomed the column fills the stage: .mode-stage is a content-sized flex item, so a 100% column inside it would stay narrow and the band mask would cut the enlarged page at its sides").

```css
/* the zoomed column must REALLY be stage-wide: `.mode-stage` is a content-sized flex item of the stage, so a 100% column inside it stayed 620px
   and the band mask - drawn in the column's box - CUT the enlarged page at its sides (screens on 7ff7b8ea). While zoomed, it fills the stage. */
```

## desk-frame §14

From `apps/desktop/src/styles/13-desk-frame.css`, line 404 at `25112784` (the comment that stays: "the middle (the engine writes the same value from ZOOM_ANCHOR)").

```css
/* polish #10 item 19: the middle (the engine writes the same value from ZOOM_ANCHOR) */
```

## desk-frame §15

From `apps/desktop/src/styles/13-desk-frame.css`, line 422 at `25112784` (the comment that stays: "the script sheet grows to fill a short script's column (flex-grow on the sheet, flex-shrink 0 so a long script is never compressed; the scroll-cap scrolls it). The scroll-cap itself takes no main-axis flex-grow, mirroring .mode-stage: its width stays content-sized so the stage can centre the page, and the height fill comes from cross-axis stretch; min-width:0 and max-width:100% guard overflow near the floor (fx7.mjs S1)").

```css
/* The script sheet has no bounded height of its own by design (see
   .desk-frame-scroll-cap's own comment below — it wraps content that grows
   with the document); FX3 S1 replaced the SCROLL-CAP's old fixed
   height:min(64vh,620px) with a stage-fill treatment, and gives
   .mode-pagecol (script's own copy of the same class) min-height:100% so a
   short script's sheet still fills down. The sheet ITSELF (the visible
   paper — background/border) then needs its own flex-grow to actually
   stretch to that floor, or the extra space would sit empty inside
   .mode-pagecol below an unstretched sheet. flex-shrink stays at its
   default (0 via the shorthand's third value) so a long script's sheet is
   never compressed — .desk-frame-scroll-cap's overflow-y:auto handles that
   overflow exactly as it already did pre-FX3.

   FX7 S1 — root-caused live (not guessed): FX3's own `flex:1 1 auto` here
   was NOT actually "the same stage-fill flex-grow prose's stage link gets"
   as its comment claimed — `.desk-frame-stage > .mode-stage` (prose's own
   direct flex-item counterpart, immediately above) carries NO flex-grow at
   all; its height-fill comes for free from `.desk-frame-stage`'s default
   `align-items:stretch` (a row-flex CROSS-axis behavior, independent of
   flex-grow), while its WIDTH stays content-sized (`.mode-pagecol`'s own
   forced measure) so `.desk-frame-stage{ justify-content:center }` — the
   stage's MAIN-axis property — can actually center it. Giving the
   scroll-cap `flex-grow:1` instead made IT (not `.mode-pagecol`) the flex
   item that fills the stage's full MAIN-axis (horizontal) width — so the
   scroll-cap stretched edge-to-edge across the whole stage, and
   `.mode-pagecol` (an ordinary block child with no margin:auto of its own)
   rendered flush against the scroll-cap's own LEFT edge instead of
   centered within it: exactly Nick's "the page itself is in a different
   location, way too small, and not centered" verdict, and exactly why the
   sliver/tutor anchors then "float away from the page" — both anchors'
   own CSS math (`--sliver-margin`/`--tutor-margin`, above/below) assumes
   `.mode-pagecol` sits centered at the stage's own 50%, which it hadn't
   been. This is a genuine FX3-introduced regression (its own comment
   mis-stated the parity with prose's path), not a TU1 anchor defect — the
   two-anchor Tutor wiring itself (DeskFrame.tsx/ScriptEditor.tsx) was
   already correct; confirmed by measuring the mounted page's own rects
   (scripts/harness/fx7.mjs's own S1 section), not by reasoning on the CSS
   alone. Fix: drop the main-axis flex-grow (mirrors `.mode-stage`'s own
   zero-flex-grow default exactly — `flex:0 1 auto`, spelled out here
   rather than left implicit, so the parity with the rule above is visible
   in the source) and add the SAME `min-width:0; max-width:100%;` anti-
   overflow guard `.mode-stage` already carries for the identical near-
   floor reason (the "Review fix" comment above) — height-fill is
   untouched (cross-axis stretch never depended on flex-grow). */
```

## desk-frame §16

From `apps/desktop/src/styles/13-desk-frame.css`, line 504 at `25112784` (the comment that stays: "the sliver's anchor is absolutely positioned inside the stage, so it can never move the paper in any state. Its right edge lands on the paper's left edge, so the grip never enters the text measure; its width is clamped to the margin between the Drawer's right edge and the paper (--frame-gap is the fixed remainder), dipping at most --sliver-paper-pad (38px, hand-synced with .mode-page's padding) into the paper's padding, never the text: clamp(160px, margin + padding, 200px)").

```css
/* CD1 S2 — the sliver's anchor: an ABSOLUTELY POSITIONED overlay inside
   `.desk-frame-stage` (position:relative, above). Being `position:absolute`
   is the geometry guarantee itself: this box is OUT OF FLOW, so it cannot
   resize/reposition `.desk-frame-stage`'s in-flow child (the paper)
   regardless of its own open/closed/dissolved state — S2's hard invariant,
   structural, not merely visual. Untouched by FX2 S1 below.

   FX2 S1 — the grip clearance law: persistent chrome (the grip) never
   enters the paper's text measure, at any viewport. Empirically verified
   at 1100-2200px via the headless harness (not just read off the CSS,
   per this project's own precedent) before writing this fix — the finding
   changed the diagnosis from the brief's own working hypothesis:
     - The GRIP was never actually the problem. `.wz-sliver-grip` sits at
       `right:0` INSIDE this anchor, and this anchor's own right edge
       (`left` + `width`, below) is defined so it always lands exactly on
       the paper's left edge — the same `min(380px,30ch)` half-measure
       `.mode-pagecol` itself uses, so the two cancel out by construction.
       Measured flush (to sub-pixel rounding only) at every width from
       DESKFRAME_MIN_WIDTH (1100px) up — the grip structurally cannot
       cross into the paper regardless of what the width math below does,
       because it rides this anchor's right edge, never its left.
     - The REAL bug: this anchor's WIDTH was a flat, unconditional 200px
       with no floor on how much room actually exists to its left. At the
       1100px gate the anchor's LEFT edge landed ~77px INSIDE the Drawer's
       own track (measured) — and because `.wz-sliver` (this anchor's
       child, filling it at 100%/100%) carries no `pointer-events:none`,
       that invisible overlap silently ate hit-testing meant for the
       Drawer's pull tabs underneath, and the OPEN panel's opaque
       background visibly painted over part of the Drawer. That's the
       actual "chrome overlapping chrome" Nick's laptop hit — not the grip
       touching a word, but the sliver's own footprint outgrowing the
       margin the Drawer left it.
   The fix clamps this anchor's WIDTH (not its right edge, which stays
   pinned to the paper) to whatever margin genuinely exists between the
   Drawer's own right edge and the paper — expressible in pure CSS, no JS
   measurement, because the Drawer's own width cancels out of "Drawer's
   right edge, relative to the stage's left edge" (both scale together
   with the grid), leaving only the grid's column-gap (`--frame-gap`) as
   the fixed remainder. Below that margin, per the brief's own allowance,
   the anchor may dip into the paper's own left PADDING — `.mode-page`'s
   `padding:30px 38px` (hard-coded here as `--sliver-paper-pad`; CSS can't
   read a sibling rule's declared value, so this is hand-synced the same
   way `store/lineEquivalents.ts`'s CANONICAL_MEASURE_CH mirrors this
   file) — rather than the text itself. The dip is HARD-CAPPED at that
   38px pad depth (`clamp()`'s own MAX arm), not merely aimed at the
   160px floor below — this is what keeps "never covers text" a provable
   guarantee rather than a target an unlucky font metric could blow
   through. 160px is the brief's own fencepost (`clamp(160px, margin +
   paper-padding, 200px)`), tuned here to the actually-measured worst
   case: at the 1100px gate, margin (~123px) + the full pad (38px) lands
   at ~161px, just clearing the floor with the SAME formula that governs
   every other width — one clamp rule serving all viewports, per the
   brief's own "the clamp is one rule" instruction. The panel
   (`.wz-sliver-panel`, `width:calc(100% - 16px)`) and the grip both ride
   this anchor's width/position, so neither needs its own separate clamp. */
```

## desk-frame §17

From `apps/desktop/src/styles/13-desk-frame.css`, line 560 at `25112784` (the comment that stays: "raised above a busy board's cards, which outrank z-index 5 within this stage's context; the panel is inset 16px, so its grip needs no separate lift").

```css
/* ITEM tutor-drawer-mirror (Nick, review fix) — raised for the SAME
     reason as the tutor anchor's own comment (below, .desk-frame-tutor-
     anchor): a busy board's own cards (BoardEditor.tsx, unbounded box.z)
     already outrank z-index:5 within this stage's isolated context. One
     value, not a grip/panel pair — Sliver's own panel is inset 16px, so
     its grip already sits in an uncovered gutter and needs no separate lift. */
```

## desk-frame §18

From `apps/desktop/src/styles/13-desk-frame.css`, line 628 at `25112784` (the comment that stays: "the screenplay anchors ride the page itself: half of 8.5in scaled by the column's own token, floored at the stage's half (the min(50%, ...) idiom --board uses) so a clamped page cannot push the anchor off the stage").

```css
/* SC1 S4 (SC-V1, "the side menus are floating in space") — root-caused live,
   and it is NOT an anchor defect: fx7.mjs's own S1 checks are green today and
   stay green, because they measure this anchor against `.mode-pagecol` and it
   IS flush against it (measured: 0px, every reference width). What Nick saw
   is that the PAPER wasn't the column — the sheet shrink-wrapped its content
   INSIDE the column, so the anchors rode the column's edges while the paper
   floated 66-115px away inside them (measured at 1100/1280/2200 on plateau;
   37-45px on Flux, whose stage tracks differ — the same defect, not a
   Flux-only one). S1's `width:100%` closes that gap by construction, and this
   rule keeps the anchor's own math honest now that the screenplay column
   carries a page's width rather than prose's: half of 8.5in, scaled by the
   same token the column is, floored at the stage's own half so a clamped
   (max-width:100%) page can't push the anchor off the stage — the same
   `min(50%, ...)` idiom `--board` uses just below, for the same reason. */
```

## desk-frame §19

From `apps/desktop/src/styles/13-desk-frame.css`, line 669 at `25112784` (the comment that stays: "the board narrows beside an open drawer: BoardEditor writes --board-l, --board-r and --board-strip on the stage, and the anchors read the board's real edges, so the Tools tab sits on the board's left edge with the room the board left it").

```css
/* POLISH #10 item 1 (Nick, Oct 25) - the board narrows beside an open drawer (BoardEditor writes --board-l / --board-r on the stage: the board's offsets
   from the stage's edges, and --board-strip, how far the strip stands over the stage). The anchors read the board's REAL edges, so the Tools drawer's
   tab sits on the board's left edge with its panel beside it, and the drawer has exactly the room the board left it. */
```

## desk-frame §20

From `apps/desktop/src/styles/13-desk-frame.css`, line 742 at `25112784` (the comment that stays: "z-index 56 over 55: within the stage's isolated context a board's cards rank too, and box.z climbs unbounded, so the drawer sits in the stage's safely-above-content tier (.board-create-ghost's 50), the grip one above its panel").

```css
/* ITEM tutor-drawer-mirror (Nick, review fix, 2026-10-15) — z-index 6/7
     only ranked WITHIN this stacking context (.desk-frame-stage's own
     isolation:isolate), where a board's own cards ALSO rank: box.z climbs
     with every new card/reorder (BoardEditor.tsx, `z: maxZ + 1`), unbounded,
     so a busy board's own cards already outrank 6/7 and draw over the open
     drawer. Raised to the SAME "safely above ordinary board content" tier
     this stage already establishes elsewhere (.board-create-ghost's own
     z-index:50) rather than a number picked to beat today's card count —
     56/55 keeps the grip-above-panel relationship this file's own history
     already proves out (one more than the panel, not a bare coincidence). */
```

## desk-frame §21

From `apps/desktop/src/styles/13-desk-frame.css`, line 796 at `25112784` (the comment that stays: "a pop-out on the page never extends past the page surface: the page's drawers end at its foot (--wz-page-foot, written by DeskFrame) and scroll inside; where the page runs past the stage (the zoom), at the stage's foot").

```css
/* POLISH #10 item 3 (Nick, Oct 25) - A POP-OUT ON THE PAGE NEVER EXTENDS PAST THE PAGE SURFACE: the page's drawers end at its foot (DeskFrame writes
   --wz-page-foot, the painted page's bottom from the stage's top) and scroll inside; where the page runs past the stage (the zoom), the stage's foot. */
```

## desk-frame §22

From `apps/desktop/src/styles/13-desk-frame.css`, line 822 at `25112784` (the comment that stays: "the Tutor's tab rides the board's right edge, its panel standing against it").

```css
/* POLISH #10 item 1 - the Tutor's tab rides the board's right edge (its panel stands against it: Tutor.tsx's measure, the board in the mirror regime) */
```

## desk-frame §23

From `apps/desktop/src/styles/13-desk-frame.css`, line 826 at `25112784` (the comment that stays: "raised with the grip anchor above, one below it").

```css
/* ITEM tutor-drawer-mirror (Nick, review fix) — raised with the grip
     anchor above (same comment there); one below it, same relationship. */
```

## desk-frame §24

From `apps/desktop/src/styles/13-desk-frame.css`, line 833 at `25112784` (the comment that stays: "the Tutor panel's width is a reading measure, clamp(320px, 34vw, 460px), declared once so the open rule and the docked rule's ceiling read the same value").

```css
/* FX10 S1 — Fable's own corrected ruling, replacing TU2 S4's "exactly 2x
     --strip-width" spec (~168px — the brief's own acknowledged error, not a
     build defect: TU2 built that spec faithfully). "A genuine reading
     measure, not a multiple of the strip": `clamp(320px, 34vw, 460px)`,
     literally — `vw` is the CSS unit for "% of the viewport," so this needs
     no JS measurement, unlike --tutor-panel-margin above (a calc()/percent
     custom property, per Cascade.tsx's own documented getComputedStyle
     resolution gap). Declared ONCE here so both the open rule and the
     docked rule's own ceiling (below) read the identical value — never two
     copies of the formula to drift apart. */
```

## desk-frame §25

From `apps/desktop/src/styles/13-desk-frame.css`, line 890 at `25112784` (the comment that stays: "THE BAR COMES HOME: the progress instrument renders under the page in the rhizome's lane, inside the 40px fence the stage already reserves (--fx3-paper-fence), as an absolutely positioned descendant of an overlay anchor, so the paper's rect is immune to it. The track spans the paper's width at every scale (the goal-glow anchor's measure math); pointer-events:none, so an instrument can never become a control").

```css
/* M4 S3 (SV15) — THE BAR COMES HOME. The progress instrument renders under
   the page, in the rhizome's own lane (the anchor above): "bar and rhizome
   are two styles of one instrument and share one location." The band it
   occupies is the one the framed stage already reserves — FX3 S1's
   --fx3-paper-fence, the 40px fence between the paper's bottom edge and the
   stage's own — so nothing above it moves: this is an absolutely positioned
   descendant of a stage-spanning overlay anchor, and the paper's rect is
   structurally immune to it exactly as it is to the growth layer and the
   goal glow (CD1 S2's hard geometry law, third instance).
   NOT `.desk-frame-meter`: FX1 S5 killed that always-empty shell on Nick's
   "the dead bar" verdict and it stays dead (nothing passes DeskFrame's
   `meter` prop). NOT `.mode-incentive-row` either — that row is still
   `!framed` in ModeStage.tsx, untouched, so legacy (<1100px) chrome remains
   byte-identical and the framed desk gains no second progress row.
   The measure math is the goalglow anchor's own, verbatim (font-size pin +
   scaled px cap, FX3 S2): the track spans exactly the paper's canonical
   width at every --paper-scale step instead of drifting out of alignment
   with it at wide viewports. pointer-events:none is inherited from the
   anchor and restated here for the same belt-and-suspenders reason the
   growth layer restates it — an instrument in the writing surface's own
   ground can never become a control. */
```

## desk-frame §26

From `apps/desktop/src/styles/13-desk-frame.css`, line 955 at `25112784` (the comment that stays: "THE GOAL RHIZOME: the anchor sits behind the paper (z-index -1), the roots in --rhizome-ink. The field's viewBox equals its pixel size, so 1 user unit is 1 CSS px; no vector-effect, since non-scaling-stroke can break the pathLength draw-on in Chromium").

```css
/* THE GOAL RHIZOME (Fable, 2026-10-08) — replaces every earlier .wz-rhizome-* rule and @keyframes wz-rhizome-* in index.css.
   Keep: .desk-frame-rhizome-anchor (z-index:-1 behind the paper) and the --rhizome-ink token (var(--accent-rest)).
   The field's viewBox equals its measured pixel size, so 1 user unit = 1 CSS px and no vector-effect is needed (and none is
   used: non-scaling-stroke can break the pathLength-based draw-on in Chromium). */
```

## desk-frame §27

From `apps/desktop/src/styles/13-desk-frame.css`, line 1001 at `25112784` (the comment that stays: "while typing, everything off the page goes to 0: on the framed desk the floor is 0 (--fade-min lives only on .mode-stage, never an ancestor here), and the chrome outside the dissolve classes (the wordmark, the ember dot, the progress lane, the glitch meter) recedes with it, keyed on data-wz-writing; it returns on the engine's curve (--fade-dur)").

```css
/* POLISH #10 item 23 (Nick, Oct 25) - WHILE TYPING, EVERYTHING OFF THE PAGE GOES TO 0. The desk's own chrome read --fade-min, which is defined only on
   .mode-stage - never an ancestor of it - so it always fell back to .08 (the rail "ghosting"). On the framed desk the floor is 0 (whatever the Recede
   setting says; it still governs the narrow, unframed layout). And the chrome that lives outside the desk's dissolve classes - the wordmark, the ember
   dot, the progress lane (the rhizome, the bar, Machina's run strip), Flux's glitch meter - recedes with it while the desk writes (ModeStage writes
   data-wz-writing on the root). Only the page and the drawers' tab arrows stay. It returns as today (the engine's own curve, --fade-dur). */
```

## desk-frame §28

From `apps/desktop/src/styles/13-desk-frame.css`, line 1008 at `25112784` (the comment that stays: "the recede's exceptions: the page, the drawer tab arrows, progress strips that are on, and docked panels").

```css
/* Nick's rulings (via Fable, Oct 25): PROGRESS STRIPS STAY visible and live while typing when they are on (the rhizome, the bar, Machina's run strip,
   Flux's glitch meter), and so do DOCKED panels (they never carried the dissolve). The recede's exceptions: the page, the tab arrows, progress, docks. */
```

## desk-frame §29

From `apps/desktop/src/styles/13-desk-frame.css`, line 1081 at `25112784` (the comment that stays: "the unified mode strip: its own class family so ModeSwitcher.tsx cannot drift under it; no brass, the active tab is brightened ink and a 1px olive hairline; uppercase and letterspacing are presentation only (text-transform), the DOM keeps the title-case strings").

```css
/* The unified mode strip (S2) — five ratified strings, title case. Visually
   modeled on .mode-tab/.mode-tabs (the strip it supersedes inside the
   frame), kept as its own class family so ModeSwitcher.tsx's own styling
   (still used by QuickSprint, unchanged) can't drift underneath it.
   AB2 S7 (Nick's rulings, 2026-07-14) — the strip quiets: orange leaves it
   entirely (the active tab's brass fill is gone), replaced by brightened
   ink + a 1px olive hairline (--accent-rest); the whole strip renders in
   the engraved register — uppercase, letterspaced — as PRESENTATION only
   (CSS text-transform). The canonical strings stay exactly the ratified
   title case in the DOM (ModeStrip.tsx / store/deskLexicon.ts untouched;
   ab1.mjs's exact-string .textContent assertions untouched) — this is a
   paint, not a rewrite. */
```

## desk-frame §30

From `apps/desktop/src/styles/13-desk-frame.css`, line 1093 at `25112784` (the comment that stays: "the mode tabs sit directly in the sprint-nav with no box of their own, so no second line is drawn under its bottom line").

```css
/* The mode tabs sit DIRECTLY in the sprint-nav now — no inner box of their
   own. Their old container border drew a second line just under the tabs,
   redundant with the sprint-nav's own bottom line (Nick's "redundant
   separator just underneath the Writing Modes tabs"); dropped here. */
```

## desk-frame §31

From `apps/desktop/src/styles/13-desk-frame.css`, line 1111 at `25112784` (the comment that stays: "the "?" sits beside a tab, never inside it (a button cannot nest a button): an inline-flex wrapper reads the pair as one unit without changing the strip's gap").

```css
/* help-buttons (Nick approved Oct 12) — the "?" sits beside a tab, never
   inside it (ModeStrip.tsx's own comment says why: a <button> cannot nest
   another <button>). A plain inline-flex wrapper so the pair reads as one
   unit without disturbing the strip's own tight gap between every OTHER tab. */
```

## desk-frame §32

From `apps/desktop/src/styles/13-desk-frame.css`, line 1155 at `25112784` (the comment that stays: "THE POP-OUT HOLD: a foot pop-out fades after fifteen words written or a period entered, never on a clock (Sliver.tsx sets data-popout-hold). It adds no fade: while the flag stands it out-specifies the two recede rules (0,5,0 and 0,4,0 over 0,3,0 and 0,2,0), and [data-open='true'] keeps a closed drawer closed").

```css
/* item 83 errata E1 (2026-09-03) — THE POP-OUT HOLD. Nick's ruling: a foot
   pop-out fades after FIFTEEN WORDS WRITTEN or A PERIOD ENTERED, never on a
   clock. Sliver.tsx counts and sets `data-popout-hold`; this rule is the whole
   of what the flag does.

   IT ADDS NO FADE AND NO CURVE. The transition already declared on
   `.wz-sliver-panel` above governs both directions, so releasing the hold
   recedes on the SAME `--fade-dur` the vanish engine writes (2.8s on a write)
   and the SAME reduced-motion opt-out below kills it. What the rule does is
   narrower than a fade: while the flag stands it OUT-SPECIFIES the two ambient
   recede rules that would otherwise hide this panel —
     `.desk-frame[data-writing='true'] .desk-dissolve`      (0,3,0)
     `[data-chrome-receded='true'] .chrome-fade`            (0,2,0)
   — at 0,5,0 and 0,4,0, so neither can win by source order later.

   `[data-open='true']` is load-bearing, not decoration: a CLOSED drawer must
   stay closed, so the hold can never resurrect one. And with no tray open the
   flag reads 'false' and this rule does not match at all — every fade on this
   surface is byte-identical to before. */
```

## desk-frame §33

From `apps/desktop/src/styles/13-desk-frame.css`, line 1177 at `25112784` (the comment that stays: "PHASE 1 - THE SLIDING LAYER, shared by both side drawers: the menu slides out from behind its tab and fades in together. The panel is the clip and the scroller and keeps the fade; the visible box and the slide live on this layer, on their own tokens, never --fade-dur").

```css
/* PHASE 1 - THE SLIDING LAYER, shared by both side drawers (Nick, Oct 9: "the menu slides out from behind the tab AND fades in, together;
   closing slides back AND fades out").
   The panel (outer) is the CLIP and the scroller: it ends at the tab, so whatever slides is hidden behind it; it also keeps the fade and
   the dissolve exactly as before (opacity on --fade-dur, whose fallback is this same .2s, so at rest the fade and the slide run together).
   The visible box - background, border - and the slide live on THIS layer. The slide uses its own tokens, never --fade-dur.
   Open is read from the panel's data-open; nothing here knows which drawer it is in except the side. */
```

## desk-frame §34

From `apps/desktop/src/styles/13-desk-frame.css`, line 1188 at `25112784` (the comment that stays: "the contents are not live until the slide settles: for --drawer-dur the sliding layer takes no pointer input, so an early press does nothing rather than hit a neighbour (scripts/evidence/click-mid-open.mjs); an animation, because pointer-events is discrete; focus is unaffected").

```css
/* THE CONTENTS ARE NOT LIVE UNTIL THE SLIDE HAS SETTLED (Fable, Oct 12; measured by scripts/evidence/click-mid-open.mjs: the Screenplay button travels ~184px in ~150ms, so a press
   aimed at it inside that window lands where it WAS, on a neighbour). For the length of the slide (--drawer-dur; the short fade under reduced motion) the sliding layer takes no pointer
   input: an early click falls through to the drawer's own (inert) panel and does NOTHING - never the wrong control. It is an animation, not a transition, because pointer-events is a
   discrete property and a keyframe holds 'none' until the last moments and then hands control back; once it ends the layer inherits the panel's 'auto' again. Keyboard focus is not
   affected (the closed drawer is already inert, and an open one is reachable by Tab as before). It restarts on every open because it hangs on [data-open='true']. */
```

## desk-frame §35

From `apps/desktop/src/styles/13-desk-frame.css`, line 1195 at `25112784` (the comment that stays: "THE TAB ROW: the chosen tab and the drawer's arrow tab both mark where you are, so both are olive; brass stays for action controls").

```css
/* PHASE 1 (S2) - THE TAB ROW. ROUND 2 (tutor-drawer-mirror, Nick's live bug
   report: "the open tab shows brass — open menu tabs are olive (Oct 9
   ruling)"; confirmed live by scripts/harness/tutor-drawer-probe.mjs,
   measured rgb(255,152,0) on the open TUTOR tab). The ORIGINAL Oct 9 ruling
   quoted below drew a distinction between the drawer's own arrow tab
   ("where you are", olive) and the chosen tab ("what you chose", brass) -
   Nick's later Oct 9 ruling supersedes that split: choosing a tab is ALSO
   "where you are" (which section is showing), the same state the arrow
   already marks, so both read olive now and brass stays reserved for
   actual action controls, the lane's own standing law.
   SUPERSEDED (quoted verbatim): "The chosen tab wears a BRASS OUTLINE and
   brass text and NOTHING else - no fill (Nick, Oct 9). The drawer's arrow
   tab is olive (where you are); this is brass (what you chose)." */
```

## desk-frame §36

From `apps/desktop/src/styles/13-desk-frame.css`, line 1220 at `25112784` (the comment that stays: "pointer events back on the "?" itself, because the row is pointer-events:none and a real press would otherwise land on nothing").

```css
/* FIX (Fable, Oct 17, ledger 88-90) — "ignores the pointer except on the '?'
   itself" (comment above) was true for the OLD .wz-drawer-note wrapper (its
   own pointer-events:auto, below) but never carried over when helpGrafts
   moved onto the shared .wz-help (HelpButton.tsx) — a bare button with no
   such restoration. A real press here hit the row's pointer-events:none and
   landed on nothing underneath; a page-side .click() never noticed, since it
   bypasses hit-testing entirely. */
```

## desk-frame §37

From `apps/desktop/src/styles/13-desk-frame.css`, line 1228 at `25112784` (the comment that stays: "this row's stretch-to-the-margins override, scoped by specificity (two classes) so it wins over the shared .wz-drawer-note rules whatever the order").

```css
/* .wz-drawer-note/-btn/-pop's own GENERAL rules moved below (merge with
   word-diet, 2026-10-14) to the single definition every caller now shares;
   only this row's own stretch-to-the-margins override stays here, scoped
   by specificity (two classes) rather than by source order, so it wins
   over the general rule regardless of which is declared first. */
```

## desk-frame §38

From `apps/desktop/src/styles/13-desk-frame.css`, line 1258 at `25112784` (the comment that stays: "REDUCED MOTION: fade only, short, no slide. The two panels carry their own !important duration, because the global floor (every transition 0.01ms !important) would flatten the fade, and opacity is not motion; a class selector out-ranks the floor's universal selector. The sliding layer is not exempt: it stays instant").

```css
/* REDUCED MOTION (Nick): fade only, short. No slide at all; the fade runs on its own short token. (This replaces the two old
   'transition:none' opt-outs: the writer who asked for less motion still sees the drawer arrive, just without travel.)
   THE APP'S GLOBAL REDUCED-MOTION FLOOR (the universal rule near the top of this file: every transition and animation 0.01ms !important)
   would flatten this fade to nothing too. Opacity is not motion, and Nick ruled that the drawer still FADES, so the two panels carry their
   own !important duration: a class selector out-ranks the floor's universal selector at equal importance. The sliding layer is NOT exempt -
   it has no travel under reduced motion, and the floor keeps it instant. */
```

## desk-frame §39

From `apps/desktop/src/styles/13-desk-frame.css`, line 1272 at `25112784` (the comment that stays: "the Structure zone's sub-labels and the rule between its halves: one zone reads as two, so a kind chip named Screenplay is never mistaken for the conversion door. Quieter than .wz-sliver-h; no accent (a sub-label is neither a state nor an act); the chips reuse .wz-page-setup-chip").

```css
/* ITEM 114 (item 83 errata E4) — the Structure zone's SUB-LABELS and the rule
   between its two halves. This is the visual half of the answer to the
   Screenplay name collision: one zone now reads as two, so a kind chip named
   "Screenplay" cannot be mistaken for the conversion door beside it. Quieter
   than `.wz-sliver-h` on purpose — the eyebrow names the ZONE, these name the
   two questions inside it, and a second engraved heading would read as a second
   zone rather than a distinction within one.
   No accent anywhere here: olive marks where you are and orange marks what you
   do (R7/FX1 S6), and a sub-label is neither. The chips themselves reuse
   `.wz-page-setup-chip` verbatim — the same control family, already carrying
   the olive-at-rest selection law — rather than a second chip that would drift
   from it. */
```

## desk-frame §40

From `apps/desktop/src/styles/13-desk-frame.css`, line 1287 at `25112784` (the comment that stays: "the sliver's eyebrow labels are information, not events: quiet, neither olive nor orange").

```css
/* FX1 S6 (Nick's first-sitting verdict, "the orange-at-rest sweep") — the
   sliver's eyebrow labels (READING/STRUCTURE/CAPTURE/etc.) are
   informational, not evental: olive marks where you are, orange marks what
   you do, and an eyebrow label is neither — it's just quiet. */
```

## desk-frame §41

From `apps/desktop/src/styles/13-desk-frame.css`, line 1291 at `25112784` (the comment that stays: "the engraved zone heading is the menus' one resting accent: olive").

```css
/* item 83 M1 (R7, "menus rest olive") — Nick's word: "the accent color on
   the menus should be the olive green, not brass." The engraved zone heading
   is the menus' one resting-accent site (Pass 0's G5, as amended by R7 from
   the ember to the olive register); it was --text-mid, which read as body
   copy rather than an engraving. */
```

## desk-frame §42

From `apps/desktop/src/styles/13-desk-frame.css`, line 1321 at `25112784` (the comment that stays: "a row name's "?" sits beside its row, never inside it: the wrap is the flex row, and .wz-template-row keeps filling it").

```css
/* help-buttons (Fable, Oct 18) — a theme-unique row name's own "?" sits
   beside its row, never inside it (the row itself stays exactly the
   rect/hit-target it already was). The wrap is the flex row; .wz-template-row
   keeps filling it. */
```

## desk-frame §43

From `apps/desktop/src/styles/13-desk-frame.css`, line 1336 at `25112784` (the comment that stays: "brass on the press, and brass at rest on the template the page already is (aria-pressed): brass marks a choice made").

```css
/* PAGE-TEMPLATES-MOVE - brass on the press; and, by Nick's standing rule that brass marks a choice the writer has MADE, brass
   at rest on the template the page already is (a screenplay page's Screenplay template, aria-pressed). */
```

## desk-frame §44

From `apps/desktop/src/styles/13-desk-frame.css`, line 1355 at `25112784` (the comment that stays: "the scoped Typeface section: two scopes over the roster as a list; brass marks the scope in force and its current face (none for a mixed highlight); a dead Selection is dimmed and inert; choosing is the preview, no Apply; nothing moves the page").

```css
/* FONT-SPAN (cursor/font-choices @ 6cc5f529, Nick approved Oct 15) - the scoped Typeface section, where words can be highlighted
   (Draft, a card): the two scopes over the roster SHOWN as a list. Brass marks the current choice - the scope in force and the face
   that is current for it (none for a mixed highlight); a dead Selection (nothing highlighted) is dimmed and inert. Choosing is the
   preview, no Apply; nothing here moves the page. */
```

## desk-frame §45

From `apps/desktop/src/styles/13-desk-frame.css`, line 1359 at `25112784` (the comment that stays: "a scope label is never cut: each button is as wide as its label and grows to share the row; when the two cannot sit side by side, the second wraps under the first. No ellipsis").

```css
/* typeface-scope-label (Fable, Oct 16: "Whole document" clipped to "Whole doc…" on a Page, both themes): a scope label is never cut. Each
   button is as wide as its label (and grows to share the row); when the two cannot sit side by side at the drawer's width, the second
   wraps under the first, each then the full width. No ellipsis. */
```

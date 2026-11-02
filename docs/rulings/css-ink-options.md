# Rulings: `apps/desktop/src/styles/14-ink-options.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[ink-options §n]` points here.

## ink-options §1

From `apps/desktop/src/styles/14-ink-options.css`, line 38 at `25112784` (the comment that stays: "an ON toggle is a where-you-are state, so it rests olive (brass stays for the :active flash); the knob is --ink-950 for contrast on olive").

```css
/* item 83 M1 (R7) — an ON toggle is a WHERE-YOU-ARE state, not an act, so it
   rests olive. This was the menus' most literal breach of "no resting orange":
   a brass-filled switch sat lit for the whole session on every page with a
   toggle on. Olive marks state, brass stays evental (the :active flash, F7's
   retained default). The knob rides --ink-950 for contrast on olive, where it
   previously used --on-brass. */
```

## ink-options §2

From `apps/desktop/src/styles/14-ink-options.css`, line 47 at `25112784` (no comment stays: the rule reads plainly).

```css
/* SWEPT (item 83, R13.iv/M6-M11) — the Structure picker (S4) and its
   two-way Prose | Screenplay segmented control were withdrawn from the
   sliver: structure is chosen at the page's making, not re-picked from a
   tool drawer. The rules below it had no markup left to style, so they go
   with it rather than lingering as dead weight. Its FX1 S6 active-state
   reasoning (brass -> --accent-rest) survives at .desk-mode-tab.active and
   .wz-strip-item.active, which is where that law now lives. */
```

## ink-options §3

From `apps/desktop/src/styles/14-ink-options.css`, line 63 at `25112784` (the comment that stays: "the progress bar's line is shared with Full screen: one flex row with align-items:center puts the hairline and the toggle on one line by layout, never by nudged margins (the probe checks the centres within 0.6px); the hairline flexes, the toggle does not; min-width:0 lets it shrink").

```css
/* item 83 errata E2 (2026-09-03) — THE PROGRESS BAR'S LINE, SHARED WITH FULL
   SCREEN. Nick's walkthrough ruling: "Full screen ALIGNS WITH THE PROGRESS
   BAR." One flex row with `align-items:center` puts the 2px hairline's own
   vertical centre and the toggle's on the same line BY LAYOUT — the brief's
   own fence, "aligned by layout, not by nudged margins". A hand-tuned offset
   would be a number hand-synced against a font size and a border width, which
   is the exact class of drift the anchor law was written against; the probe
   asserts the two rendered centres agree within 0.6px instead of trusting one.
   The hairline flexes and the toggle does not, so the bar yields exactly the
   width the toggle needs, at any drawer width. `min-width:0` because a flex
   item's default `min-width:auto` would refuse to shrink below its content. */
```

## ink-options §4

From `apps/desktop/src/styles/14-ink-options.css`, line 137 at `25112784` (no comment stays: the rule reads plainly).

```css
/* SUPERSEDED (item arbor-quiet-brass) — this override used to repaint a Seg's selected
   option olive inside the sliver (a "where you are" marker, matching the sliver's other
   active states), while the stage's own gear kept it brass-filled. Both are gone now:
   `.mode-seg button.on`'s own base rule (ModeStage's own base rule, above) is brass
   OUTLINE everywhere, theme-invariant (a segmented option is a CHOICE, not a persisted
   mode — unlike the tabs, which keep the where-you-are olive treatment). Nothing left to
   override; the base rule alone governs the sliver's gear too. */
```

## ink-options §5

From `apps/desktop/src/styles/14-ink-options.css`, line 171 at `25112784` (the comment that stays: "the Tutor panel moves exactly as the tool pop-out (.wz-sliver-panel): the same opacity and transform transition on --fade-dur (.2s fallback, ease), only the nudge mirrored; its width is static (the clamp, a custom property), never part of the transition; closed, it is invisible and inert whatever its footprint").

```css
/* The panel: a flex child of `.desk-frame-tutor-panel-anchor` (packed
   flush against THAT anchor's own right edge, which is the stage's right
   edge — see the anchor's own header comment for why this is what keeps
   an open panel from ever being clipped).
   FX10 S1 — the motion SHAPE, corrected. TU2's own retrofit (superseded
   below) reused a bare `180ms ease` literal — Cascade.tsx's own dock-panel
   constant, NOT the tool pop-out's — via a width/max-width/border-width
   COLLAPSE (0 -> open, mirroring `.wz-cascade-panel[data-visible=false]`'s
   own technique). Nick's own words name a different reference entirely:
   "fade-in and come out of the page... exactly the same way as the tools
   pop-out to the left" — the tool pop-out IS the sliver (Tutor.tsx's own
   header comment already calls this component "the sliver, mirrored"; see
   `.wz-sliver-panel` above). Read LIVE (not assumed) before writing this
   rule: `.wz-sliver-panel`'s own real, mounted transition is
   `opacity var(--fade-dur,.2s) ease, transform var(--fade-dur,.2s) ease`
   — a STATIC width, `transform:translateX(6px)` closed -> `translateX(0)`
   open — never a width collapse at all. TU2 matched neither this shape nor
   even this duration (200ms, not 180ms). Mirrored here exactly: same
   property list, same `--fade-dur` custom property (so an ancestor's
   useChromeDissolve write ever affects both surfaces identically), same
   `.2s` fallback, same `ease` curve — only the sign of the horizontal
   nudge flips (the tutor panel sits on the paper's RIGHT and settles in
   from a few px further right, toward its own resting spot — the mirror
   image of the sliver's own leftward settle). Width is now STATIC too
   (the FX10-ruled clamp, below — a custom property so the open and docked
   rules can't drift apart), matching `.wz-sliver-panel`'s own unconditional
   `width:calc(100% - 16px)` precedent: never itself part of the
   transition, whether open or closed — a closed panel is invisible
   (opacity:0) and inert (pointer-events:none) regardless of its own
   footprint, exactly like the sliver's already does today. */
```

## ink-options §6

From `apps/desktop/src/styles/14-ink-options.css`, line 202 at `25112784` (the comment that stays: "min-height:0, because as a real flex item its default min-height:auto could grow it past its box with a long lens section, scrolling the document instead of the panel (the same escape .desk-frame-stage uses)").

```css
/* ITEM tutor-drawer-mirror (Nick, review fix) — unlike `.wz-sliver-panel`
     (position:absolute, taken out of flow, no flex constraint at all),
     this panel is a GENUINE flex item of `.desk-frame-tutor-panel-anchor`'s
     flex row. A flex item's default min-height:auto can resolve to its own
     CONTENT's min-content height, overriding `height:100%` and letting a
     long lens section (Consistency, on a page with many near-duplicates)
     grow the panel taller than its box instead of scrolling inside it —
     the DOCUMENT scrolls instead, "the scrollbar outside the panel." The
     same min-height:0 escape `.desk-frame-stage` itself already uses
     (index.css, that rule's own header) for the identical reason. */
```

## ink-options §7

From `apps/desktop/src/styles/14-ink-options.css`, line 213 at `25112784` (the comment that stays: "three regimes, set by Tutor.tsx's measure-effect from the true margin (stage right minus paper right): on a writing surface with 280px or more it occupies the margin at min(margin, open-w), flush to the paper; with less it overlays at open-w; on a board it keeps open-w and may overlay. The clamp here is only the fallback before the effect runs").

```css
/* FX18 S2 (SV24/SV26) — Fable's ruling (2026-07-29): FX18 SUPERSEDES FX10 S1's fixed-vw
     OVERLAY law (a founder's device verdict outranks the architect's earlier "no-JS,
     overlay-as-today" convenience ruling; FX13's measure-effect is now the house's proven
     pattern for exactly this adjustment). THREE regimes, driven by Tutor.tsx's measure-effect
     which sets an inline px width from the TRUE geometric margin (stage.right - paper.right,
     measured — NOT this calc, which adds --frame-gap and so overshoots the paper by 28px):
       (1) WRITING SURFACE, geoMargin >= ~280px usable floor: OCCUPY the margin at
           min(geoMargin, open-w) — flush to the paper's right edge, never covering it.
       (2) WRITING SURFACE, geoMargin < ~280px: OVERLAY at natural open-w (the documented
           narrow-screen degradation) — a downward discontinuity at 280 that CSS clamp cannot
           express, hence the measured inline width.
       (3) BOARD: keeps natural open-w and MAY overlay the canvas (an arrangement surface, not
           sacred paper) — the --board rule below; grip rides atop via the z-lift above.
     The clamp below is only the FALLBACK before the effect runs (wide screens already correct
     by CSS alone; the inline width supersedes it). The 5 fx10 "full open-w" A4 parks stand. */
```

## ink-options §8

From `apps/desktop/src/styles/14-ink-options.css`, line 234 at `25112784` (the comment that stays: "the link dock's reader (a linked card or page, read-only, beside the page): square, no shadow, the theme's own words and tokens; its words select and copy as plain text").

```css
/* POLISH #10 item 24 - the LINK DOCK's reader (a linked card or page, read-only, beside the page): square, no shadow, the theme's own words and tokens;
   its words are selectable and copy as plain text. */
```

## ink-options §9

From `apps/desktop/src/styles/14-ink-options.css`, line 246 at `25112784` (the comment that stays: "the board regime: the board is an arrangement surface, not paper, so its Tutor panel keeps open-w and may overlay the canvas; Tutor.tsx leaves the width to this rule on a board").

```css
/* FX18 S2 regime (3) — the BOARD overlay exception (Fable's ruling): the board is an
   arrangement surface, not sacred paper, so its Tutor panel keeps its natural open-w and
   may overlay the canvas (bounded to the app edge by the flex-end dock; the grip rides atop
   it via the z-lifted anchor). Tutor.tsx leaves panelWidthPx null on Board, so this rule
   owns the width — pure CSS, no flash of the writing-surface fallback. Regime (2), the
   writing-surface narrow-screen degradation (overlay at open-w), is set by the same measure-
   effect's inline width, not a CSS attribute — see Tutor.tsx. */
```

## ink-options §10

From `apps/desktop/src/styles/14-ink-options.css`, line 271 at `25112784` (the comment that stays: "a closed drawer is hidden whatever the dissolve says: visibility:hidden (no opacity can bring it back; it leaves the tab order), plus opacity 0 at a higher specificity in both dissolve contexts. The close still fades and slides: visibility flips after the longer of --fade-dur and --drawer-dur; opening shows at once").

```css
/* THE GHOST FIX (Nick, Oct 10; first landed on main by branch drawer-ghost-fix) - A CLOSED DRAWER IS HIDDEN, WHATEVER THE DISSOLVE SAYS. The writing
   dissolve parks chrome at a DIMMED level (`.desk-frame[data-writing='true'] .desk-dissolve{opacity:var(--fade-min)}`, 0,3,0), and that out-specified a
   closed panel's own `opacity:0` (0,1,0): while writing, a CLOSED left drawer showed its contents as a faint ghost. A dissolve is a rule about chrome
   that is SHOWING; a closed drawer is not. So a drawer that is not open is `visibility:hidden` (no opacity can bring it back; it also leaves the tab
   order and the accessibility tree, beside the `inert` S1 already sets), and the two dissolve contexts get an explicit opacity:0 for it at a higher
   specificity (belt and braces: the claim does not rest on one property).
   THE CLOSE STILL FADES AND STILL SLIDES: visibility flips only AFTER both are done - the delay is the longer of the fade (--fade-dur) and the slide
   (--drawer-dur), so a short --fade-dur can never cut the sliding layer off mid-travel. OPENING shows at once (the open state declares no visibility
   transition). Every open-drawer rule and the pop-out hold require [data-open='true'], which this rule excludes. */
```

## ink-options §11

From `apps/desktop/src/styles/14-ink-options.css`, line 285 at `25112784` (the comment that stays: "a closing drawer fades on the drawer's own duration, not the writing dissolve's slow --fade-dur, so a keystroke-closed Tutor fades as fast as the Tools drawer").

```css
/* POLISH #10 item 21 (Fable, Oct 28): THE TUTOR MIRRORS TOOLS ON EVERY PATH, THE KEYSTROKE CLOSE INCLUDED. A drawer's CLOSE fades on the drawer's own duration - the writing
   dissolve's slow --fade-dur (2.8s on a write) belongs to the open chrome, not to a drawer that is leaving: a keystroke closes the Tutor (A15) in the middle of a write, and
   without this it faded 2.8s against the Tools drawer's 0.2s. The rule above still reads --fade-dur; a closed panel just carries the drawer token as its value. */
```

## ink-options §12

From `apps/desktop/src/styles/14-ink-options.css`, line 294 at `25112784` (the comment that stays: "under reduced motion the closed panel fades on --drawer-dur-reduced and is hidden when that is done; the delay holds the hide back").

```css
/* Reduced motion keeps its short fade (Nick's ruling above): the closed panel fades on --drawer-dur-reduced and is hidden when that is done. The
   `!important` duration above (the floor override) applies to this list too; the delay is what holds the hide back. */
```

## ink-options §13

From `apps/desktop/src/styles/14-ink-options.css`, line 301 at `25112784` (the comment that stays: "the dock toggle: a small quiet icon-only corner control, sized like the drawer note's "?"").

```css
/* ITEM tutor-drawer-mirror (Nick, review fix) — the standing "THE TUTOR"
   header retires whole (REMOVE); the dock toggle survives as a small quiet
   corner control (no header row to carry it), icon-only, matching
   DrawerNote's own "?" button's size/border look rather than the former
   text-scale link. */
```

## ink-options §14

From `apps/desktop/src/styles/14-ink-options.css`, line 311 at `25112784` (the comment that stays: "DrawerNote.tsx's CSS, the one definition every caller shares; the tab row's override lives beside .wz-drawer-tabnotes, scoped by specificity").

```css
/* DrawerNote.tsx's own CSS — the SINGLE definition every caller shares
   (merged with phase1-drawers, 2026-10-14; that branch's own near-identical
   copy, flagged as a future conflict when word-diet first ported this
   component, is consolidated into this one block). The tab row's own
   stretch-to-the-margins override lives beside .wz-drawer-tabnotes above,
   scoped by specificity so it wins there without duplicating the rest. */
```

## ink-options §15

From `apps/desktop/src/styles/14-ink-options.css`, line 326 at `25112784` (the comment that stays: "a note beside an uppercase heading would inherit its transform; a note's words are never a heading, so it is reset here once").

```css
/* ITEM word-diet review (Fable, Oct 13) — a DrawerNote beside an UPPERCASE
     heading (the Fragments lens, .wz-tutor-h) otherwise inherits that
     transform into the note's own prose; the note's words are never a
     heading, so reset it explicitly rather than per-call-site. */
```

## ink-options §16

From `apps/desktop/src/styles/14-ink-options.css`, line 331 at `25112784` (the comment that stays: "near the right edge the pop opens leftward from the button's right edge (DrawerNote.tsx measures at open time), so it stays inside the viewport").

```css
/* ITEM word-diet review (Fable, Oct 13, W4) — a "?" near the right edge
   (the Tutor Ask box) opens its pop RIGHTWARD from left:0, running off the
   viewport. Measured at open-time (DrawerNote.tsx); this modifier anchors
   from the button's right edge instead, opening leftward, so the pop stays
   inside the viewport near any edge. */
```

## ink-options §17

From `apps/desktop/src/styles/14-ink-options.css`, line 338 at `25112784` (the comment that stays: "HELP BUTTONS (store/help.ts, HelpButton/HelpPop; docs/mockups/help-buttons/index.html): one shared overlay, position:fixed in a body portal, so it can never move or resize the page it sits over. --help (never brass) means more words available").

```css
/* HELP BUTTONS (Nick approved Oct 12, cursor/help-buttons @ d4d1c835;
   docs/mockups/help-buttons/index.html is the approved reference). A
   SEPARATE component from DrawerNote (store/help.ts, HelpButton/HelpPop),
   not a re-skin of it: DrawerNote's own "?" is per-instance and
   position:absolute (brass when expanded — the thing this ticket says
   never to do); this is ONE shared overlay, position:fixed in a body
   portal, so it can never move or resize the page it sits over (page
   primacy holds by construction, not by convention) — the mockup's own
   mechanism, carried over exactly. The --help token (not brass) marks it
   as "more words available", distinct from --accent-rest's "where you
   are" and --brass's "current choice". */
```

## ink-options §18

From `apps/desktop/src/styles/14-ink-options.css`, line 406 at `25112784` (the comment that stays: "the conversation renders under the head and has no scrollbox of its own: the panel scrolls as one column, a bubble grows to its content, and no second scrollbar exists in this subtree (fx10.mjs S1 asserts it)").

```css
/* FX10 S1 — the conversation is now the panel's own center of gravity (the
   room is wide enough, per Nick's own words, for the composer and the
   exchange to "read as the main event"): moved to render right under the
   head (Tutor.tsx), and its own message log LOSES its private nested
   scrollbox here — `max-height:220px; overflow-y:auto` (superseded) was
   exactly the "conversation trapped in its own tiny nested scrollbox"
   defect Nick's screenshot showed. The panel scrolls as ONE column now
   (`.wz-tutor-panel`'s own `overflow-y:auto`, above) — a message bubble
   grows to its content and the log grows with it; there is no second
   scrollbar anywhere inside this subtree (fx10.mjs's own S1 section
   asserts computed overflow across every panel descendant, not just this
   one previously-offending element). */
```

## ink-options §19

From `apps/desktop/src/styles/14-ink-options.css`, line 434 at `25112784` (the comment that stays: "the Free Write roster and its one standing draw, only in Free Write (absent elsewhere). Zero resting orange: presets rest olive, brass on hover, --brass-press on press. Figtree, since these label presets and never become the writer's words. No overflow of any kind (the panel scrolls as one column; fx10.mjs checks); it wraps").

```css
/* ITEM 84, THE DECK PHASE — the Free Write roster (three presets) and the one
   standing draw. Rendered ONLY in Free Write (Tutor.tsx's `freeWrite` branch);
   in Draft, on screenplay and on Board this block has nothing to style, which
   is G3's "absent, not disabled" holding at the CSS layer too.
   G5's ember ceiling: ZERO resting orange. The presets rest OLIVE
   (`--accent-rest` — "olive marks where you are"), go brass on hover and
   `--brass-press` on press ("orange marks what you do"), exactly the
   olive-rest / brass-hover / orange-press ladder the mockups carried.
   Figtree, not Crimson Pro: lock line 6's chip-voice ruling covers chips that
   BECOME the writer's words; these are UI labels naming a preset, and the line
   the preset draws is rendered as an ordinary tutor turn below.
   Deliberately no `overflow` of any kind — the panel scrolls as ONE column
   (FX10 S1), and fx10.mjs asserts computed overflow across every panel
   descendant, this row now included. It wraps instead. */
```

## ink-options §20

From `apps/desktop/src/styles/14-ink-options.css`, line 454 at `25112784` (the comment that stays: "the spent ask is styled by data-spent, never :disabled: it must answer a fourth press with a note, so it stays pressable and quiet until the hundred words arrive").

```css
/* The spent ask — a TRANSIENT gate on real capability, never an unbuilt feature
   wearing paint. Styled by `data-spent`, NOT by `:disabled`, on Nick's refill
   ruling: a spent ask must answer a fourth press with a note, and a disabled
   control cannot answer anything. It stays pressable, and stays quiet until the
   hundred words arrive. */
```

## ink-options §21

From `apps/desktop/src/styles/14-ink-options.css`, line 566 at `25112784` (the comment that stays: "the strip rests bright (--text-hi) and lights brass on hover; the open-category marker (olive) still wins on an active item").

```css
/* Resting register lifted to the old mouse-over brightness (--text-hi), so
   the whole strip reads bright at rest; mouse-over now LIGHTS UP brass (the
   icons + label take the warm accent) — Nick's own call. The open-category
   marker below (olive) still wins on an active item. */
```

## ink-options §22

From `apps/desktop/src/styles/14-ink-options.css`, line 573 at `25112784` (the comment that stays: "hover is not an act: it lifts to --text-hi, and brass moves to :active, the press").

```css
/* item 83 M1 (R7) — hover is not an act. The two-regime law the menus now
   run: olive marks where you are, brass marks what you DO — and "what you do"
   is the press, not the approach. Hover lifts to --text-hi (the mockups' own
   `.row:hover`); the brass moves to :active, where the founding invariant's
   sub-second flash belongs (F7 default: the flash stays). */
```

## ink-options §23

From `apps/desktop/src/styles/14-ink-options.css`, line 589 at `25112784` (the comment that stays: "icons and labels 20% larger: 17 to 20.4, 18 to 21.6, 9 to 10.8").

```css
/* Icons + labels 20% larger (Nick's own call): 17->20.4, 18->21.6, 9->10.8. */
```

## ink-options §24

From `apps/desktop/src/styles/14-ink-options.css`, line 600 at `25112784` (the comment that stays: "the cascade's overlay anchor: absolutely positioned inside the stage (it cannot move the paper), anchored from the strip's right edge because layers grow rightward from the strip; display:flex so docking is ordinary flex reflow. Its left cancels both the host padding and the grid's own centring margin (--fx7-cascade-grid-margin reproduces max(0px, (100vw - 2 x pad - frame-max) / 2)), so it sits on the strip's edge at every viewport (fx7.mjs S3 checks 1100, both reference widths and 2200)").

```css
/* CD2 S2 — the cascade's overlay anchor (DeskFrame.tsx's `cascadeLayers`
   prop). Mirrors .desk-frame-sliver-anchor's own structural guarantee
   (position:absolute inside .desk-frame-stage, which is position:relative
   — out of flow, so it cannot resize/reposition the paper regardless of
   state) but anchors from the STRIP'S OWN RIGHT EDGE rather than the
   paper's right-relative offset, since layers grow RIGHTWARD from the
   strip, not leftward from the paper (S2's own wording). display:flex so
   the survey sliding into the panel's vacated slot when it docks (S2's
   own "the dock") is ordinary flex reflow, animated by transitioning the
   panel's own width to 0 rather than any manual `left` arithmetic.

   FX7 S3 — root-caused live (not guessed): this anchor's own `left` used
   to be a bare `0`, i.e. flush against `.desk-frame-stage`'s OWN left
   edge — true back when CD2 shipped (the strip still occupied the grid's
   own first column then, immediately adjacent to the stage). FX5 S10 (a
   LATER ticket, "the composition law now") pulled the strip clean OUT of
   the grid's flow — `position:absolute`, pinned to the SCREEN's own
   left edge (`--frame-host-pad-x` cancelled out, see .desk-frame-strip
   below) — and gave `.desk-frame-stage` back the FULL reclaimed width,
   so the stage's own left edge no longer coincides with the strip's own
   right edge at all: it sits `--frame-host-pad-x` (a 16-40px, 3vw-scaled
   clamp) from the true screen edge, while the strip's own right edge sits
   a FIXED `--strip-width` (84px) out — at every viewport, host-pad-x is
   well under 84px, so `left:0` here landed the whole cascade panel
   40-70px to the LEFT of the strip's own right border: not a literal
   empty gap (confirmed by measuring the mounted page, this project's own
   "verify, don't assume" discipline: the panel actually OVERLAPPED and
   partly occluded the strip's own icons by ~44-68px) but exactly the
   underlying defect Nick's "float away from it... not flush" verdict
   names — the panel floats at an offset that has nothing to do with the
   strip's own true edge, rather than genuinely emerging flush from it.
   FX5 S10 already solved this EXACT class of drift for the sliver anchor
   (`--sliver-margin`'s own `+ var(--frame-host-pad-x) - var(--strip-width)`
   correction, above) — the cascade anchor never received the same fix
   because it doesn't share that formula (it anchors from the LEFT via a
   literal `left`, not from center via a paper-half-width subtraction), so
   the drift went unnoticed there (S10 fixed the sliver's, not this one).

   This mirrors that same correction in this anchor's own left-anchored
   terms, with ONE extra term the sliver's centered formula never needed:
   the strip's own screen-left is always 0 (`.desk-frame-strip`'s own
   `-1 * --frame-host-pad-x` cancels the host's padding exactly), so its
   screen-right is always `--strip-width` — but `.desk-frame-grid` itself
   (the stage's own ancestor) is CENTERED via `margin:0 auto` once the
   viewport grows wide enough for its content (100vw minus the host's own
   2x --frame-host-pad-x padding) to exceed `--frame-max`, which pushes the
   stage's OWN screen-left past `--frame-host-pad-x` by however much extra
   margin the centering adds on each side — found live, not assumed:
   fixing only the `--frame-host-pad-x` term (mirroring the sliver
   verbatim) reproduced the sliver's own known-good gap at every width up
   to ~1720px combined-available-width, then silently DRIFTED to a ~200px
   gap at 2200px specifically — measured, not guessed, via fx7.mjs's own
   S3 section (which is why BOTH reference widths AND the 1720px --frame-
   max seam are asserted there, not just the 1100px floor). The extra term
   below (`--fx7-cascade-grid-margin`) reproduces the grid's OWN centering
   math exactly (`max(0px, (100vw - 2*pad - frame-max) / 2)`) so this
   anchor's `left`, relative to the STAGE, correctly cancels however much
   the grid's own centering pushed the stage away from the strip's fixed
   screen position, at every viewport — verified flush, zero-gap, at both
   reference widths, the 1100px floor, AND a wide (2200px) viewport past
   the --frame-max seam. */
```

## ink-options §25

From `apps/desktop/src/styles/14-ink-options.css`, line 662 at `25112784` (the comment that stays: "z-index 60: above the drawers (55, 56) in the same isolated stage, so a real press on a cascade row never lands on the Sliver's wrapper; below the dialogs (200 and up)").

```css
/* tutor-drawer-v2 (Chat 1 ledger 64, bisected; revert 409d9e3f) — raised
     from 6 to 60. tutor-drawer-mirror raised the Sliver/Tutor drawer
     anchors to 55/56 to beat a busy board's own unbounded card z-index
     (BoardEditor.tsx, box.z) within THIS SAME isolated stage
     (.desk-frame-stage{isolation:isolate}) - but never checked this
     anchor, which lives in the identical isolated context and sat at only
     z-index:6. The result: .wz-sliver (the Tools drawer's own wrapper,
     always mounted at its anchor's position whether open or closed) now
     out-ranked the cascade panel underneath it everywhere their boxes
     overlap (CD2 S2's own design: both anchor near the strip's edge, by
     construction) - a real click on a Pages/Plan/Drawers row landed on
     the invisible Sliver wrapper instead and never opened the page (pw1
     4/32, pw2 2/20, item170 1/19 red; chat1's own bisection + revert note
     named wz-sliver as the topmost element verbatim). 60 restores the
     correct order: board (unbounded, but realistically well under 55) <
     drawers (55/56) < this panel (60) < dialogs (board-sheet/popup,
     already 200+, untouched either way). */
```

## ink-options §26

From `apps/desktop/src/styles/14-ink-options.css`, line 688 at `25112784` (the comment that stays: "the drawer sits flush on the rail: no --frame-gap term, pure layout math over the same tokens the strip uses, so it cannot drift from the strip it targets").

```css
/* SUPERSEDED IN ONE TERM — item 83 M1 (R10.i, "flush drawers"). FX7 S3's
     derivation above stands verbatim and is still the reason this anchor
     cancels the grid's centering at all; only its DESTINATION changes.
     Nick, twice, on rendered screenshots: "there is still a large gap
     between the left menu strip and the opened Page tab." Measured on this
     tree before the change (menus-probe, prose, 1366 AND 1680): strip.right
     = 84.0, panel.left = 112.0 — a 28.0px gap, i.e. exactly the
     `+ var(--frame-gap)` term below. FX7's "flush" meant flush-to-strip
     PLUS one gap, which was that ticket's intent; R10(i) retires the gap
     for drawers ("an open drawer sits FLUSH against what it opened from").
     The term is dropped, nothing else. The anchor stays pure layout math
     over the SAME two tokens the strip's own rule uses (`--strip-width`,
     `--frame-host-pad-x`, .desk-frame-strip above) — one source of truth,
     so this cannot drift from the strip it targets. */
```

## ink-options §27

From `apps/desktop/src/styles/14-ink-options.css`, line 728 at `25112784` (the comment that stays: "flush on the rail, the seam is the rail's own border-right: no border-left here (it would read as a hairline gap) and square left corners (a radius at a flush seam is a notch)").

```css
/* item 83 M1 (R10.i) — the drawer now sits FLUSH on the rail, so the seam
     is the rail's own border-right; a border-left here would paint a second
     1px line against it and read as a hairline gap at exactly the join the
     ruling was written to close. The left corners square off for the same
     reason: a radius at a flush seam is a visible notch. */
```

## ink-options §28

From `apps/desktop/src/styles/14-ink-options.css`, line 749 at `25112784` (the comment that stays: "the rail pop-outs slide and fade as the Tools strip does, on its tokens (--drawer-dur, --drawer-ease; the short fade alone under reduced motion); backwards fill on the way in; leaving layers take no input; overlay only, nothing moves the page").

```css
/* TOOLS #10 item 8 - the rail pop-outs (Pages, Boards, ...; their surveys) use the Tools strip's slide-and-fade in every theme: they slide out from the rail AND fade in together, and on close slide back AND fade out, on the
   strip's own tokens (--drawer-dur / --drawer-ease; the short fade alone under reduced motion). `backwards` fill on the way in: once it has played, the ordinary rules (the dock's collapse above) govern again. The leaving layers
   (Cascade.tsx keeps them drawn for the exit, data-leaving) take no input. Overlay only: nothing here moves the page. */
```

## ink-options §29

From `apps/desktop/src/styles/14-ink-options.css`, line 764 at `25112784` (the comment that stays: "the cascade drawer's engraved heading: one olive accent per menu, at rest").

```css
/* item 83 M1 (R7) — the cascade drawer's engraved heading, same register as
   .wz-sliver-h above: one accent site per menu, olive, at rest. */
```

## ink-options §30

From `apps/desktop/src/styles/14-ink-options.css`, line 781 at `25112784` (the comment that stays: "THEME PICKER (theme-menu-brief.md, theme-rules.md section C): brand cards, not a button list. The card art is never scoped by [data-theme]: a card shows its own theme's look whatever theme is active, so --tp-cyan and --tp-lime are local constants; --brass, theme-invariant, marks the current card").

```css
/* THEME PICKER (step 2, Oct 21 build queue; theme-menu-brief.md / theme-rules.md §C,
   cursor/theme-picker-mockup @ 1a057bea). Brand cards, not a button list. The CARD ART below is
   deliberately NOT scoped by [data-theme] - a card shows its OWN theme's look regardless of the
   ambient active theme, so --tp-cyan/--tp-lime are local constants here, not the theme-token
   system (Flux's own --line-active would resolve to whatever theme is CURRENTLY active, which is
   exactly the value a cross-theme card must not take). --brass is the one real exception: it is
   already theme-invariant everywhere (theme-rules.md A.1), so the current-card outline reuses it
   directly. */
```

## ink-options §31

From `apps/desktop/src/styles/14-ink-options.css`, line 850 at `25112784` (the comment that stays: "the hover glitch is a flash within the global flash budget: ThemePicker.tsx's controller (store/fluxCardGlitch.ts) asks the budget first and runs this class for one iteration, never an infinite hover loop, and never stacks a second").

```css
/* note (e) (Fable's review, Oct 21): the hover Glitch is a FLASH (theme-rules.md §A.8's 3/sec
   budget), so it can no longer be a plain CSS `:hover -> infinite` loop a sustained hover runs
   forever — ThemePicker.tsx's own FluxCardGlitchController (store/fluxCardGlitch.ts) asks the
   shared global flash budget first and toggles this class for exactly one iteration
   (`animation-iteration-count:1`, not `infinite`); a refused or mid-pulse re-trigger (quick
   hover out/in) never stacks a second one on top. */
```

## ink-options §32

From `apps/desktop/src/styles/14-ink-options.css`, line 875 at `25112784` (the comment that stays: "the theme choice is a choice, not a where-you-are state: a brass outline, theme-invariant").

```css
/* ITEM arbor-quiet-brass, round 2 — SUPERSEDED: the theme list's own selection was
   olive (S3's original "current marked olive"), but Fable's ruling makes this a
   CHOICE, not a where-you-are tab state — brass outline, theme-invariant, same as
   every other choice in this ticket (the segmented options, the page-setup chips). */
```

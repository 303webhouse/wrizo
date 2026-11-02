# Rulings: `apps/desktop/src/styles/19-beginnings.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[beginnings §n]` points here.

## beginnings §1

From `apps/desktop/src/styles/19-beginnings.css`, line 1 at `25112784` (the comment that stays: "BG1 and BG2, the Beginnings (docs/wrizo-alpha/p1-wave.md, p2-wave.md): one row, one grammar, two surfaces; olive icon-and-label doors, never a grid, nothing counted, no completion state (the rhizome stays out of the olive family, so olive means a door). The container is pointer-events:none, so the caret is live under the row from the first frame; only the doors take the pointer").

```css
/* ==========================================================================
   BG1 — the Beginnings (docs/wrizo-alpha/p1-wave.md §BG1), as revised by
   BG2 — the Beginnings, Seen (docs/wrizo-alpha/p2-wave.md §BG2, item 73).
   ONE row, one grammar, two surfaces: olive icon+label doors, never a grid,
   nothing counted and no completion state. Olive is the door color per BG1's
   brief and M4 S2's reservation of the hue — the rhizome's ground deliberately
   stays OUT of this family so that olive keeps meaning "this is a door."
   BG2 keeps every one of those laws and changes only what Nick could not see:
   size, stacking, and the olive's VALUE (see the BG2 S1 block below).

   The container is pointer-events:none — the `.fl-invite` / rhizome
   precedent, and load-bearing for S2: the page's caret is live UNDER this row
   from the first frame and the row may never intercept it. Only the doors
   take the pointer back.
   ========================================================================== */
```

## beginnings §2

From `apps/desktop/src/styles/19-beginnings.css`, line 16 at `25112784` (the comment that stays: "the grammar in one place, both surfaces inheriting: icons above labels, about 50% larger, in the door olive (--accent-door). Dark olive at rest, brass on hover, orange only on press; no resting opacity, so the colour the eye sees is the token's (bg2.mjs computes the contrast)").

```css
/* BG2 S1 (SV19/SV20) — the grammar revised in ONE place, both surfaces
   inheriting. Nick's verdict on the shipped row was "much too small" and "can
   barely see," and that it did not read as a set of MODES. Three changes, all
   here: icons ABOVE their labels (was inline), everything ~50% larger, and the
   door olive stepped down in value so it carries against cream (`--accent-door`,
   slotted per theme at the top of this file).
   The lane law: DARK OLIVE at rest — brass on hover — orange only on press.
   The resting opacity is GONE deliberately: a translucent door means the colour
   the eye sees is not the colour the token declares, which would make BG2's own
   computed-contrast assertion a lie. The door is quiet because of its value now,
   not because it is faded. */
```

## beginnings §3

From `apps/desktop/src/styles/19-beginnings.css`, line 46 at `25112784` (the comment that stays: "one placement rule: both surfaces centre the row, spanning the surface (left 0, right 0) with justify-content:center, never left:50% and a translate, which would offer the row only half the room and wrap it into two lines").

```css
/* BG2 S2/S3 — ONE placement rule now, which is the truest reading of "one
   grammar" this row has had. SV20 confirmed the board's centering as correct;
   SV19 asks for the page's row to be centered on the sheet too, reading as a
   set of modes rather than a footnote under the caret. So both surfaces take
   the same centering, and the page's old "beside the cursor" offset (the
   committee's placement) is SUPERSEDED by Nick's own word.
   This also strengthens the S2 invariant rather than weakening it: centered on
   the sheet, the row is further from the caret than it has ever been, so the
   first line is clearer still. The caret stays live from the first frame, the
   container stays pointer-events:none, and typing still dismisses.

   Centered by SPANNING the surface (left:0/right:0) and letting flexbox do the
   centering, NOT by `left:50%` + a translate. At BG1's smaller size the latter
   happened to fit; at BG2's size it silently wrapped the row into two lines —
   an absolutely-positioned shrink-to-fit box offered only the space from its
   left edge to the containing block's right edge, i.e. half the room. The row
   must never become a grid (BG1's law), so the box gets the whole width and
   `justify-content:center` places it. */
```

## beginnings §4

From `apps/desktop/src/styles/19-beginnings.css`, line 75 at `25112784` (the comment that stays: "the empty board's starters: a thin square outline at about 40% opacity, lifted by hover and focus, fading on the first press (--faded); the board row only; the outline takes currentColor, so it reads on whatever paper the theme lays").

```css
/* BOARD START (Nick approved the mockup, Oct 14): the empty board's starters are a thin SQUARE OUTLINE at about 40% opacity, quiet until reached for (hover and keyboard focus lift them), and they
   fade out on the first press (the --faded rule above). The board row only: the same row on the page and in STORYBOARD/OUTLINE keeps its look. The canvas is today's light paper - the outline
   takes the door's own colour (currentColor), so it reads on whatever paper the theme lays. */
```

## beginnings §5

From `apps/desktop/src/styles/19-beginnings.css`, line 103 at `25112784` (the comment that stays: "a chip's chosen value reads brass: a choice outline, diverging on purpose from the where-you-are olive of tabs").

```css
/* SUPERSEDED (item arbor-quiet-brass, Fable's explicit ruling): "brass is the
   through-line in Flux too: choice outlines in brass" — the chip's chosen value now
   reads brass, not olive's where-you-are treatment (R7's original reasoning, kept here
   as the reason this diverges from the tab/segmented-option law elsewhere in this file). */
```

## beginnings §6

From `apps/desktop/src/styles/19-beginnings.css`, line 136 at `25112784` (the comment that stays: "Open Pages shows three rows and scrolls: a viewport, not a cap, so the fourth page stays reachable; three rows of about 27px plus a sliver of the fourth tell the eye there is more").

```css
/* ITEM 170 (re-scoped) — OPEN PAGES SHOWS THREE ROWS AND SCROLLS. Nick's
   ruling: "the last three pages created or edited, scrollable". Read as a
   VIEWPORT, not a population cap — a cap of three would put the fourth page out
   of reach, which is S0's fault 4 in miniature, and a sort over three items
   says nothing. A row is ~27px, so three rows plus a sliver of the fourth tell
   the eye there is more below. */
```

## beginnings §7

From `apps/desktop/src/styles/19-beginnings.css`, line 199 at `25112784` (the comment that stays: "the grip sits at the card's edge and the dock opens beyond it: no negative margin, so neither piece of chrome crosses the card's rect (the harness measures both against the card)").

```css
/* ITEM 159 — THE GRIP SITS AT THE CARD'S EDGE AND THE DOCK OPENS BEYOND IT.
   Nick also reported the STYLING tab "slightly overlapping the card edge": the
   dock carried `margin-right:-1px`, deliberately pulling it one pixel ONTO the
   card to share its border seam. With a grip between the two there is no seam
   to share, so the negative margin goes and neither piece of chrome crosses the
   card's rect. That is a consequence of the redesign, not a guess at his
   pixel — the harness MEASURES both rects against the card's.
   NOTE: item 166's law ("no pop-out overlaps the page") does not govern this
   pair; it names the Card pop-up AND its Styling dock as an exception. The
   overlap being fixed here is dock-against-CARD, a different pair of rects. */
```

## beginnings §8

From `apps/desktop/src/styles/19-beginnings.css`, line 210 at `25112784` (the comment that stays: "flush: 1px is the card's own border, so the grip's edge is the card's edge").

```css
/* POLISH #10 item 16: FLUSH - 1px is the card's own border, so the grip's edge IS the card's edge (it was 2px: one px off) */
```

## beginnings §9

From `apps/desktop/src/styles/19-beginnings.css`, line 218 at `25112784` (the comment that stays: "the dock meets the grip (18px wide), no gap").

```css
/* item 16: the dock meets the grip (18px wide), no gap */
```

## beginnings §10

From `apps/desktop/src/styles/19-beginnings.css`, line 257 at `25112784` (the comment that stays: "THE SPLASH: the hand-drawn Wrizo over the live app. It cannot block writing: pointer-events:none on the container and both children, so input reaches whatever is underneath. z-index 400, above the whole stack (modals top out at 300). Its size is set inline by Splash.tsx from the asset's measured ink box, about a quarter of the screen").

```css
/* THE SPLASH (item 187) — Nick's own hand-drawn Wrizo over the live app.
   "at most 1/5 the size of the screen with the regular app interface blurred
   out in the background."

   IT CANNOT BLOCK WRITING, BY CONSTRUCTION. `pointer-events:none` on the
   container and on both children means this overlay is invisible to hit
   testing: a click during the splash reaches whatever is underneath exactly as
   if the splash were not mounted. The PASSIVE window listeners in Splash.tsx
   stay for the same reason (ITEM splash-hold: they no longer dismiss early,
   below, but input still passes through them untouched), never by this layer
   catching anything.

   z-index 400 sits above the app's whole existing stack (modals, backdrops
   and toasts top out at 300) — deliberately, because at boot this is the
   frontmost thing on the screen and nothing should paint over it.

   The SIZE is not set here: Splash.tsx computes width/height inline off the
   asset's measured INK bounding box (3077x2458 inside a 3374x2699 canvas) —
   about a quarter of the screen's area, capped so the dimmed app always
   shows on all four sides (item 187). */
```

## beginnings §11

From `apps/desktop/src/styles/19-beginnings.css`, line 277 at `25112784` (the comment that stays: "the drawing stays truly centred: the loading line is positioned absolutely, never a flex participant, so it cannot move the mark").

```css
/* ITEM splash-hold ROUND 5 (Fable's review): SUPERSEDED the flex-direction:column
   + gap below — putting the loading line IN the centred flex stack shifted the
   drawing 14.8px off true centre (the line's own height, halved, pushing the group
   up). The drawing's centring is load-bearing (S4's whole claim); the loading line
   is positioned absolutely instead (.wz-splash-loading, below), never a flex
   participant, so nothing it does can move the mark again. */
```

## beginnings §12

From `apps/desktop/src/styles/19-beginnings.css`, line 287 at `25112784` (the comment that stays: "the background is a solid block of the theme's own ground (--ink-950), dimmed, never blurred: nothing of the app shows through").

```css
/* ITEM splash-hold (Nick, live): "the background should be faded out, not
   blurred" — SUPERSEDED the backdrop-filter blur below (the app no longer
   reads as blurred-but-present; it reads as dimmed-but-present). The tint is
   the THEME's own ground colour (--ink-950, already per-theme: Arbor's own
   warm brown-dark #110600, Flux's own teal-dark #04141A), via color-mix — so
   Arbor dims brown-dark and Flux dims teal-dark, never one fixed colour
   painted over both. ROUND 2 (Nick, live frames): 75% let the front door's
   logo and the Write door ghost through and clash with the sketch — raised
   to 90%. ROUND 6 (Nick, live): "make it a solid block" — 100% now; nothing
   of the app shows through at all. 100% of a theme's own ground colour IS
   that colour, so `color-mix(... 100%, transparent)` and the bare token
   paint identically — written as the bare token for clarity, not left as a
   color-mix whose only remaining "mix" is the whole thing. */
```

## beginnings §13

From `apps/desktop/src/styles/19-beginnings.css`, line 303 at `25112784` (the comment that stays: "a short hold, then a 0.45s fade").

```css
/* splash-sweep (Nick's brief): "a short hold, then a 0.45s fade" — was .38s. */
```

## beginnings §14

From `apps/desktop/src/styles/19-beginnings.css`, line 316 at `25112784` (the comment that stays: "the cycling loading line, in the theme's UI font and a quiet colour; key-remounted per line (Splash.tsx) so the fade restarts; positioned absolutely from --mark-h (the drawing's measured height), so it sits just below the drawing and never moves it").

```css
/* ITEM splash-hold ROUND 3 — the cycling loading line, in the theme's own UI
   font and a quiet colour (both already per-theme tokens; no Flux override
   needed). `key`-remounted on every line change (Splash.tsx) restarts this
   fade; reduced motion drops the animation below, an instant swap.
   ROUND 5 — SUPERSEDED being a flex participant (it shifted the drawing off
   true centre, S4's own claim). Positioned absolutely instead, anchored to
   `--mark-h` (Splash.tsx's own measured box.height, passed as a CSS custom
   property on .wz-splash) so it always sits just below the drawing's own
   rendered edge, whatever that edge currently is. */
```

## beginnings §15

From `apps/desktop/src/styles/19-beginnings.css`, line 381 at `25112784` (the comment that stays: "BOARD CONTEXT MENU: the small themed menu, the Send to Trash dialog and the Settings switch; all overlays (position:fixed in a portal), so none moves anything beneath it; tokens only").

```css
/* BOARD CONTEXT MENU (Nick, Oct 15; cursor/board-context-menu mockup @ 0df8bf30) - the small themed menu, the "Send to Trash?" dialog, and the Settings switch. All overlays (position:fixed in a portal):
   page primacy - none of them moves or resizes anything beneath it. Tokens only, so Arbor and Flux both wear them. */
```

## beginnings §16

From `apps/desktop/src/styles/19-beginnings.css`, line 431 at `25112784` (the comment that stays: "CONNECTOR-B: the Grafts and Links list in the right drawer, the rail thumbnails' circles in connection mode, the drag ghost, and the viewport-level overlay the arm travels in (it must reach the rail, so it cannot live in the board canvas, which clips)").

```css
/* CONNECTOR-B (Nick's approved connector mockup v6) - the Grafts / Links list in the right drawer; the circles the rail's thumbnails wear while a card is in connection mode; the ghost a thumbnail leaves under the
   pointer when it is dragged onto a board; and the viewport-level overlay the connector's arm travels in (it must reach the rail, so it cannot live inside the board canvas, which clips). */
```

## beginnings §17

From `apps/desktop/src/styles/19-beginnings.css`, line 450 at `25112784` (the comment that stays: "Grafts across places and the graft doors: + Graft on top, the paired page, the plan board's one folded row, the groups, Shared tags, the Undo line, the picker (an overlay on body, displacing nothing) and the brass graft knob on a selected card's right edge (no card or board rect changes). A row's X shows on hover and focus").

```css
/* BIG PROJECTS STEP 3 - Grafts across places and the graft doors (Nick's approved mockup, cursor/graft-doors-mockup @ c4f34eb0). "+ Graft..." on top,
   the paired page and "Connected to", the plan board's ONE folded row, the groups with a faint place label, Shared tags, the Undo line, the picker (an
   overlay on body - it displaces nothing), and the brass graft knob on a selected card's right edge (a rect on the card's own edge: no card or board
   rect changes). The X on a row shows on hover (and on keyboard focus). */
```

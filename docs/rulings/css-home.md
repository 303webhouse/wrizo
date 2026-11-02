# Rulings: `apps/desktop/src/styles/08-home.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[home §n]` points here.

## home §1

From `apps/desktop/src/styles/08-home.css`, line 61 at `25112784` (the comment that stays: "the front door's wordmark, tagline and doors stay hidden while the splash holds (Splash.tsx sets the attribute) and fade in as it leaves; transition:none makes the hide instant, the base rule's transition still governs the reveal").

```css
/* ITEM splash-hold ROUND 3 (Nick's ruling, "no ghost") — the front door's own
   wordmark/tagline/doors stay hidden for the splash's own hold (the attribute
   below is set/cleared by Splash.tsx on document.documentElement — the two
   components never need to know about each other directly) and fade in
   exactly as the splash leaves, via each element's own opacity transition
   above/below. Reduced motion already drops to a plain .2s linear fade for
   every .wz-home descendant (the existing blanket rule, below in this file) —
   these three ride that same rule, no new one needed.
   ROUND 5 (Fable's review) — `transition:none` HERE makes the HIDE instant:
   without it, the moment this attribute lands the element would fade from
   whatever it was (1, or .92) down to 0 over .38s, which is itself a visible
   flash the opposite direction. The base rule's own `transition:opacity .38s
   ease` still governs the REVEAL — once the attribute is gone this selector
   no longer matches, so the element falls back to that transition and the
   leaving-fade is unaffected. */
```

## home §2

From `apps/desktop/src/styles/08-home.css`, line 79 at `25112784` (the comment that stays: "pointer-events:none so a hidden door cannot be pressed (opacity never gates hit-testing); focus and keys are unaffected").

```css
/* ITEM splash-hold ROUND 4 (Fable's review) — opacity:0 alone still leaves Write and
   Open genuinely clickable (opacity never gates hit-testing). pointer-events:none
   closes that: a hidden door can't be pressed. Keyboard input is unaffected — this
   only ever changes POINTER hit-testing, never focus or keydown, so keystrokes keep
   reaching the app exactly as before. Scoped to the doors only (Fable's own words
   named "hidden Write and Open"); logo/tagline were never interactive. */
```

## home §3

From `apps/desktop/src/styles/08-home.css`, line 166 at `25112784` (the comment that stays: "the board: square corners, brass only on selection. A card is stacked stock: lighter than the board, a 1px hairline, a 2px hard edge and a soft shadow").

```css
/* J4 — the Board. Square corners; brass appears ONLY on selection (the
   anti-Canva guard extends to chrome: no decoration, ever).
   FX4 S7 — Stacked (board-card-studies.html variant B, Nick's ratified
   pick): lighter stock than the board itself, a 1px hairline, thickness
   told by a 2px offset hard edge + a soft shadow — "card stock, not
   glass." Values matched precisely from the reference file, not
   approximated from the brief's prose alone. */
```

## home §4

From `apps/desktop/src/styles/08-home.css`, line 173 at `25112784` (the comment that stays: "the board canvas joins the paper-toned scrollbar group: it sits on --paper, a light surface, so the dark default would not suit it").

```css
/* FX5 S3 (a) — Plateau's own scrollbar treatment, born here for
   `.board-canvas-wrap` (BoardEditor.tsx's own inline overflow:auto): thin,
   low-contrast, square, no OS chrome — visible-but-quiet, since a board
   that scrolls needs a legible affordance that it does.
   FX7 S4 — promoted to a SYSTEMIC, app-wide default (see the `:root`
   scrollbar rule near the top of this file, right after the reset) rather
   than staying a one-off tuned to this class alone — Nick's own "bulky and
   most white... dominate visually" verdict named EVERY scrollable region,
   not just the board.
   SCROLLBAR-FLUSH, CORRECTED (Fable Oct 23, Nick: INK's light board shows
   a thick dark thumb at the bottom): the sentence this comment used to
   carry — "`.board-canvas-wrap` no longer needs its own copy... the
   systemic default already produces byte-identical values" — was wrong.
   The systemic default is the DARK-chrome pair (`--ink-border-strong`),
   tuned for dark surfaces; `.board-canvas`'s own background is
   `var(--paper)` (BoardEditor.tsx's inline style), a LIGHT-paper surface
   in both themes by default (Arbor always; Flux unless Page:dark) — the
   exact mismatch FX7 S4's own comment above already names for
   `.mode-scroll`. `.board-canvas-wrap` now joins that paper-toned group
   (`.mode-scroll, .desk-frame-scroll-cap, .board-canvas-wrap`, near the
   top of this file) instead of relying on the dark default. */
```

## home §5

From `apps/desktop/src/styles/08-home.css`, line 225 at `25112784` (the comment that stays: "the wrap paints the board surface (--paper), so the bars in its gutter and below it sit on the surface their paper-toned thumb was chosen for; background only, no geometry moves").

```css
/* SCROLLBAR-FLUSH (Fable Oct 23): the wrap paints the BOARD SURFACE (--paper, the same token `.board-canvas` paints inline). The vertical bar lives in this
   wrap's stable gutter BESIDE the canvas and the horizontal bar BELOW it - with no background of its own the wrap showed the dark desk ground there, so the
   paper-toned thumb (--ink-on-paper-low, set with the paper group at the top of this file) was dark-on-dark and, in Flux light, effectively invisible.
   On the paper, both bars sit on the surface their tone was chosen for. Background only - no geometry moves. */
```

## home §6

From `apps/desktop/src/styles/08-home.css`, line 249 at `25112784` (the comment that stays: "the move cursor over a card: pure affordance, the drag itself is BoardEditor.tsx's; the pin, handle and layer toggle are siblings, so the browser resolves their own cursors and no exclusion is needed").

```css
/* FX8 S3 — "whenever the cursor is over the bounds of a box... the
     cursor should change showing that the user can now move the card
     around with one click" (Nick's own words). The drag mechanism itself
     is untouched (BoardEditor.tsx's own onDown/onMove state machine,
     FX5 S4(a)/FX7 S5-S8-hardened) — this is pure visual affordance,
     replacing the old unstated `cursor:default`. `.board-pin-grab`/
     `.board-handle`/`.board-layer-toggle` are DOM SIBLINGS of this card-
     face element (BoardEditor.tsx's own JSX: all three sit alongside the
     BoardInkBox/BoardPinBox/BoardTextBox that renders `.board-text`, never
     nested inside it), so no exclusion selector is needed at all — the
     browser's own hit-testing already resolves the cursor from whichever
     small element is actually under the pointer, not from this class. */
```

## home §7

From `apps/desktop/src/styles/08-home.css`, line 276 at `25112784` (the comment that stays: "the resize handle: a 10px solid brass square with no border, centred on the card's corner (-5px); a diagonal cursor, since it resizes freely on both axes and shows only on the selected box").

```css
/* FX8 S2 — Nick's words: "shrink the size of the orange square... remove
   the border from the square so it is just an orange box." Shrunk 14px ->
   10px (a genuinely smaller footprint, not a token change — CC's own
   judgment call, disclosed in the build report) and the 1px `--ink-950`
   border dropped whole (solid brass fill only, matching the pin's OWN
   border-retention decision going the other way — see .board-pin-grab's
   own comment below for why ITS border stays). Re-centered on the card's
   own corner (right/bottom -5px = half the new 10px size, was -7px = half
   of 14px) so the visual anchor point doesn't drift. `cursor:nwse-resize`
   is UNCHANGED — S2's own live investigation (disclosed in the build
   report) found no actual inconsistency to fix: the handle only ever
   renders on the SELECTED box (BoardEditor.tsx's own conditional render),
   sits at the box's own bottom-right corner, and resizes freeform on BOTH
   axes from that corner (FX4 S4) — a plain diagonal resize cursor is the
   textually correct affordance, not a guess. */
```

## home §8

From `apps/desktop/src/styles/08-home.css`, line 300 at `25112784` (the comment that stays: "while a card's corner is held the whole canvas wears the diagonal resize arrow, so a pointer that lags the corner never flips to the I-beam").

```css
/* CARD-RESIZE-AXIS (Nick, Oct 15): while a card's corner is held the whole canvas - and everything on it - wears the diagonal resize arrow. A pointer that lags the corner (a proportional card moves
   its corner along a diagonal) used to fall onto card text or the empty canvas and flip to the I-beam / default; now it never leaves the arrow until the corner is let go. */
```

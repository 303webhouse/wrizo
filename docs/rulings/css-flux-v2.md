# Rulings: `apps/desktop/src/styles/06-flux-v2.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[flux-v2 §n]` points here.

## flux-v2 §1

From `apps/desktop/src/styles/06-flux-v2.css`, line 1 at `25112784` (the comment that stays: "FLUX V2 - the shell: the rules that are not just a token. Orange is scarce (the caret, the sprint surge, Uplink, the mark, the current item's left bar); every other selected state is cyan, because --brass is cyan under Flux. The frame's edge, grid, brackets and readouts are an overlay ring that recedes with the chrome; nothing here changes the page's size or position").

```css
/* ============================================================================
   FLUX V2 (Fable's brief, Nick Oct 21) - the new shell. Tokens above; this block is the rules that are not just a token.
   ORANGE IS SCARCE: the caret (.flux-block-caret, above), the sprint surge (.mode-pfill.celebrate), Uplink, the mark, and the thin LEFT bar on the current list item.
   Every other "selected" is cyan - and that comes for free, because --brass (the generic selection token) is cyan under Flux.
   The page frame: a thin cyan edge, a faint grid and four corner brackets on the FRAME only (an overlay ring - never under text), and the readouts, all of which carry chrome-fade
   and so recede with the chrome while the writer types. Nothing here changes the page's size or position: the readouts sit in the paper's own padding.
   ========================================================================== */
```

## flux-v2 §2

From `apps/desktop/src/styles/06-flux-v2.css`, line 54 at `25112784` (no comment stays: the rule reads plainly).

```css
/* (the Flux-only vignette rule that stood here is COLLAPSED into the one base rule - body::after, under the atmosphere overlays below - which puts the vignette
   behind the page in EVERY theme: page-size, Fable Oct 23. flux-v2.mjs VG1b checks the base rule; flux-v2-part2 F9 still reads Flux's computed -1.) */
```

## flux-v2 §3

From `apps/desktop/src/styles/06-flux-v2.css`, line 56 at `25112784` (the comment that stays: "the rail's hover and active states are electric blue (--line-active): no brown tile, no olive, no brass").

```css
/* the rail's hover and active states are ELECTRIC BLUE (#00C2FF, --line-active): no brown tile, no olive, no brass (Nick, Oct 23) */
```

## flux-v2 §4

From `apps/desktop/src/styles/06-flux-v2.css`, line 61 at `25112784` (the comment that stays: "FLUX V2 - the screens: every input reads the Flux glass (never Arbor brown); Flux shows its own orange WRIZO mark top left; a board card is a dark-glass node, its tokens re-pointed inside the canvas only; the rail's place block wraps").

```css
/* ---- FLUX V2 - the screens against the mockup (Fable, Oct 22) ---------------------------------------------------------------------------------------------------------------
   (1) the Ask box, Add Note, the search fields and every other input read --ink-800 / --ink-900 / --color-surface: Arbor's espresso browns. The Flux root block now carries the Flux glass
       for both, so no input (dark page or light) can paint Arbor brown.
   (2) Arbor's hand-drawn watermark is a PNG mask painted brass at the bottom right. Flux shows its own WRIZO mark: orange (one of orange's few homes), top left, set in the chrome label face.
   (3) A board card is a dark-glass NODE: glass fill, a thin cyan edge, a cyan uppercase first line (its title), and the card tokens re-pointed INSIDE the canvas only (a card's popup and the
       deck wizard keep their own sheet). The board's frame carries the same grid ring and corner brackets as the page's.
   (4) The rail's place block wraps ("RACK ▸ The Late Ferry") instead of truncating. */
```

## flux-v2 §5

From `apps/desktop/src/styles/06-flux-v2.css`, line 74 at `25112784` (the comment that stays: "Flux marks a card's first line by colour only: capitals, spacing or another face would widen the line and make the card taller; a skin changes only the skin").

```css
/* POLISH #10 item 12: Flux marks a card's first line by COLOUR only. Capitals, letter-spacing, the chrome font and weight made that line wider than Arbor's, so a long first line wrapped and the auto-grow made the Flux card taller (measured: +15.6 px). A skin changes only the skin: the same text breaks in the same places in every skin. */
```

## flux-v2 §6

From `apps/desktop/src/styles/06-flux-v2.css`, line 92 at `25112784` (the comment that stays: "the arrival's Write door is the choice colour (cyan), not brass: orange keeps only its fixed homes").

```css
/* the arrival's Write door is the CHOICE colour (cyan), not brass: orange keeps only its fixed homes (the caret, the sprint surge, Uplink, the mark, the current item's bar) - Fable, Oct 23 */
```

## flux-v2 §7

From `apps/desktop/src/styles/06-flux-v2.css`, line 96 at `25112784` (the comment that stays: "the card's resize and connect corner and the drop target are the choice colour (cyan): a handle on a selected node is a choice, and orange is scarce").

```css
/* the card's resize / connect corner and the drop-target circle: the CHOICE colour (cyan), never brass - a handle on a selected node is a choice, and orange is scarce (the screens, Oct 23) */
```

## flux-v2 §8

From `apps/desktop/src/styles/06-flux-v2.css`, line 111 at `25112784` (the comment that stays: "one line with an ellipsis; the full name is the button's title").

```css
/* POLISH #10 item 14: ONE line with an ellipsis (FX V2 had it wrap); the full name is the button's title */
```

## flux-v2 §9

From `apps/desktop/src/styles/06-flux-v2.css`, line 163 at `25112784` (the comment that stays: "GLITCH METER (docs/briefs/flux-flicker-meter-brief.md; components/GlitchMeter.tsx): Flux's progress animation over the whole screen, never while typing. Its own layer portalled to body: fixed, no pointer events, no layout; above the page and chrome, below the block caret (60). Its Signal Loss events are the ambient texture's .theme-fx-* elements at the meter's intensity (--op)").

```css
/* GLITCH METER (brief docs/briefs/flux-flicker-meter-brief.md; components/GlitchMeter.tsx) - Flux's progress animation, OVER the whole
   screen, page and text included (Nick's ruling: it never runs while typing). Its own layer, portalled to <body>: fixed, pointer-events none,
   zero layout participation - above the page and the chrome, below the block caret (60); it takes no input, so a modal or a menu under it is
   still pressed through it. The Signal Loss events inside it are the same .theme-fx-* elements as the ambient texture's, at the meter's
   intensity (--op). */
```

## flux-v2 §10

From `apps/desktop/src/styles/06-flux-v2.css`, line 172 at `25112784` (the comment that stays: "the still: a faint scan-and-grain overlay, opacity = intensity x 0.42, no motion; under reduced motion the global rule makes it simply appear; the 2.4s ease is for Ambiance 0, where that rule does not apply").

```css
/* the still: a faint scan-and-grain overlay, opacity = intensity x 0.42 (set per frame) - no motion at all. Under the OS's reduced motion the
   global rule below (every transition 0.01 ms) applies to it too, and is honoured (Fable, Oct 17, ledger 90): there it simply APPEARS. The
   2.4 s ease is for Ambiance 0, Wrizo's own "no motion", where the global rule does not apply. */
```

## flux-v2 §11

From `apps/desktop/src/styles/06-flux-v2.css`, line 191 at `25112784` (the comment that stays: "one caret: !important, because the editor sets its pen ink as an inline caret colour, which would leave the native line drawn over the orange block").

```css
/* POLISH #10 item 18 (Nick, Oct 25): ONE caret - !important, because the page's editor carries its pen ink as an INLINE caret colour, which beat this
   attribute rule and left the native line drawn on top of the orange block. */
```

## flux-v2 §12

From `apps/desktop/src/styles/06-flux-v2.css`, line 199 at `25112784` (the comment that stays: "themed, never an Arbor literal (the same move as .wz-splash-veil)").

```css
/* theme-leftovers (Nick approved Oct 16) — was a hardcoded Arbor literal,
     never themed (the one place --ink-950 existed to prevent exactly this).
     Themed now, matching .wz-splash-veil's own identical move. */
```

## flux-v2 §13

From `apps/desktop/src/styles/06-flux-v2.css`, line 229 at `25112784` (the comment that stays: "the vignette sits behind the content in every theme, so it shades the room, never the page; one rule, so a theme added later cannot bring the band back. isolation:isolate on body keeps it visible above the lamp background (page-size.mjs V, MV and V-room check it from paint)").

```css
/* PAGE-SIZE (Fable, Oct 23): the vignette sits BEHIND the content in EVERY theme - it shades the room, never the page.
   At z-index 2 it was painted over everything, so the paper's foot wore a grey band wherever the page reached the viewport's edge (Arbor's light page,
   deploy #5's screens; INK fixed the same for Flux alone in flux-inputs). One rule here, not one per theme, so a theme added later cannot bring it back.
   `isolation:isolate` on body is what keeps it VISIBLE: html carries its own background, so body's lamp background is painted as body's own block - and
   a bare z-index:-1 in the root stacking context would sit under that lamp too, deleting the vignette everywhere. With body its own stacking context, the
   vignette paints above the lamp and below everything in #root. Checked by page-size.mjs V/MV (never on the page) and V-room (still on the room), from paint. */
```

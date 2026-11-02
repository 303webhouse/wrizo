# Rulings: `apps/desktop/src/styles/18-desk-rail.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[desk-rail §n]` points here.

## desk-rail §1

From `apps/desktop/src/styles/18-desk-rail.css`, line 84 at `25112784` (the comment that stays: "the board's name is a button (the rename control) that reads as plain crumb text (the family, size, colour and weight of .crumb-here) with a text cursor, the cue that clicking edits it").

```css
/* The board's name is a <button> (Item 133: the name is the rename control) and had NO rule of its own, so it wore the browser's grey button face (Fable, Oct 15). It reads as the plain crumb
   text now - same family, size, colour and weight as .crumb-here - with a text cursor, the cue that clicking edits it. */
```

## desk-rail §2

From `apps/desktop/src/styles/18-desk-rail.css`, line 115 at `25112784` (the comment that stays: "in the zoom the ink sheet covers the visible page: it reaches over the scroller's start and end paddings with matching negative margins and paddings, so its text stays put; ink is measured from where the text starts (InkStratum.tsx inkOriginY), so strokes keep their place in both views").

```css
/* POLISH #10 item 5 (Nick, Oct 25) - IN THE ZOOM THE INK SHEET COVERS THE VISIBLE PAGE. The scroller's huge paddings (the start offset above, the end
   room below) left the sheet - and so the pen - only as tall as the text: a fresh page's one line. The sheet reaches over both with matching negative
   margins and paddings, so its text stays exactly where it was; ink is measured from where the text starts (InkStratum.tsx inkOriginY), so a stroke
   keeps its place against the words in both views. */
```

## desk-rail §3

From `apps/desktop/src/styles/18-desk-rail.css`, line 123 at `25112784` (the comment that stays: "the modes move toward the right and Done stays rightmost with a fixed gap, on the framed host only (the legacy sprint-nav layout is untouched); a trial value: delete this block to revert").

```css
/* FX3 S4 — TRIAL (Nick's own working-value experiment; not settled law).
   The modes move toward the right instead of sitting flush left; Done
   stays the rightmost element with a fixed gap (not auto-margin) keeping
   it clearly separated from the modes rather than glued to them. Scoped to
   `.desk-frame-host` (framed, >=1100px, only) — `.sprint-nav`/
   `.sprint-actions` are the SAME shared classes the legacy (<1100px)
   3-child layout (crumb + ModeSwitcher + actions, PageEditor.tsx's/
   ScriptEditor.tsx's non-framed branch) still relies on its own
   `margin-left:auto` to push Done past the other two — `.desk-frame-host`
   never renders there, so that layout is untouched by this block.
   REVERT (one line each): delete this whole block — the base
   `.sprint-nav`/`.sprint-actions` rules above already reproduce the
   pre-FX3 (flush-left strip, right-pinned actions) layout on their own. */
```

## desk-rail §4

From `apps/desktop/src/styles/18-desk-rail.css`, line 220 at `25112784` (the comment that stays: "the deck engine's pop-out (components/DeckWizard.tsx): the same shape as .board-popup-backdrop and .board-popup, so it reads as the pop-out the writer already knows; on a board it reuses .board-canvas-blurred, and CreateProject.tsx, with no board under it, uses the .deck-wizard-blur pair (identical values)").

```css
/* B3 S1 — the deck engine's own pop-out (components/DeckWizard.tsx). R6's
   own ruling, verbatim: "as a pop-out with a faded background like the
   Card pop-outs now" — the backdrop/dialog pair below is DELIBERATELY the
   SAME shape as .board-popup-backdrop/.board-popup (FX4 S5) rather than
   .board-sheet's plain solid-black overlay (Pin/Port/Existing-page's own
   dialog): same centered-fixed-overlay geometry, same card-stock dialog
   with the accent top rule, so the wizard reads as "the same kind of
   pop-out" the writer has already seen on this board. On BoardEditor.tsx,
   the underlying board reuses .board-canvas-blurred VERBATIM (the
   pre-existing card-popup blur) rather than a second copy of the same
   rule; CreateProject.tsx (which has no board underneath it at all) uses
   the .deck-wizard-blur-wrap/.deck-wizard-blurred pair below instead —
   identical values, a fresh name since it's a different, non-board host. */
```

## desk-rail §5

From `apps/desktop/src/styles/18-desk-rail.css`, line 247 at `25112784` (the comment that stays: "the sheet is cream card stock, so its text takes the card's ink (--ink-on-card, 4.5:1 or more in every tone; flux-card-ink.mjs C5), never --ink-on-paper, which a dark page flips light. Labels stand apart by mono caps, a picked option by an olive border, a hovered row by an olive underline").

```css
/* deckwizard-ink (Chat 1 ledger 53; Fable, Oct 15) - the sheet is the same un-themed cream as a card (--card-stock), so its text
   takes the CARD's ink, never --ink-on-paper, which Flux's dark page flips light (1.08:1 on cream - the illegible deck titles).
   Every text here is --ink-on-card, >= 4.5:1 in every tone (flux-card-ink.mjs C5 measures each): the -low tier was not used on
   this sheet when this was written, because it then measured under 4.5:1 on cream in Plateau and Flux light (3.77 / 4.43 -
   card-label-contrast's subject). faint-text-sweep has since darkened --ink-on-paper-low/--ink-on-card-low itself (both now
   >=4.5:1 on every stock this app ships), so that reason no longer holds - this dialog simply never needed the dimmer tier
   at all (every string here is a real label or title, not a meta/hint line), and stays on --ink-on-card unchanged.
   The small labels stay apart by their type (mono caps), a picked option by its olive border, a hovered row by an olive underline. */
```

## desk-rail §6

From `apps/desktop/src/styles/18-desk-rail.css`, line 289 at `25112784` (the comment that stays: "Machina's deck wizard is portalled to body, so it reads :root tokens, where Machina's card family is not set; it wears Machina's own dress on the theme's tokens: the chrome surface, a 1px hairline, square, no shadow, Plex. Names --text-hi (7:1 or more), labels --text-mid or better (4.5:1); hover and pick carried by --accent-rest as a bar or border, never text colour").

```css
/* MACHINA'S DECK WIZARD (Nick, Oct 24: Board -> Presets -> "CHOOSE A DECK" was a tall cream panel with near-invisible pale text). ROOT CAUSE: the wizard is portalled to <body>, so it reads :root tokens - and Machina sets the card family
   (--card-stock, --ink-on-card ...) only inside `.board-canvas` (where cards live), so at :root they fall through to Arbor's cream stock while --ink-on-paper is the dark page's PALE ink. Pale on cream. The fix is Machina's own dress,
   on the theme's tokens only: the chrome surface, a 1px hairline, square, NO shadow, Plex (mono for the small labels, sans for the names); COOL and NEUTRAL follow their tokens, and the chrome is dark on both page tones. Names
   (deck titles, the question, the options) are --text-hi (>= 7:1); labels (the eyebrow, the room headings, the buttons, the note) are --text-mid or better (>= 4.5:1). A hovered row / a picked option is carried by --accent-rest
   (steel under COOL, orange under NEUTRAL) as a left bar or a border - never as text colour. Its fuller form (Forms + Intake) comes later from the mockups. */
```

## desk-rail §7

From `apps/desktop/src/styles/18-desk-rail.css`, line 311 at `25112784` (the comment that stays: "MACHINA FORMS: the deck library as a 600-wide panel inside the stage, never past its foot, the list scrolling inside; name, cover line and a mono block count per row; hover and focus are a 2px --choice left bar and the --ink-800 fill, never text colour. Square, a hairline, no shadow, no motion; a clear backdrop, so the rail stays in view").

```css
/* MACHINA FORMS (m7 / m8; Fable's brief Oct 24 §1): the deck library as a panel 600 wide inside the stage - never past its bottom, the list scrolling inside - a FORMS header, the Intake row boxed in a hairline, seven mono kickers,
   rows of name (Plex Sans 14, --text-hi) - cover line (--text-mid) - the block count right-aligned in mono. Hover / focus = a 2 px left bar in --choice (steel COOL / orange NEUTRAL) + the --ink-800 fill; the carrier is never text at
   rest. Square, a hairline, no shadow, and NO MOTION (cuts only): nothing in the panel transitions. The backdrop is clear - Forms is a tool over the stage, the rail beside it stays in view. */
```

## desk-rail §8

From `apps/desktop/src/styles/18-desk-rail.css`, line 350 at `25112784` (the comment that stays: "guided paths: a dealt step's question is the card's placeholder, painted from data-prompt by a pseudo-element, so it is never text (not selected, copied or counted); it shows only while the card has no body. Olive is guidance, so Arbor's question is olive italic in --badge-on-card (7.1:1 on cream); the "?" turns --choice on hover or open; Flux shows its dim readout prompt line").

```css
/* ── W3 / W11a - guided paths: a dealt step's QUESTION and its "?" (Wrizors' game plan wave 1; Fable's frames 06 / 08 / 09 of board-kinds-final) ───────────────────────────────────────
   THE QUESTION is the card's placeholder, painted from data-prompt by a pseudo-element: it is never a text node, so it cannot be selected, copied or counted, and textContent stays the
   stored text. It shows only while the card has no body (store/guided.ts promptToShow; in the pop-up, data-body-empty) and the first keystroke into the body hides it.
   Colours follow Nick's Oct 23 rule: GREEN (olive) = options, books, guidance - so Arbor's question is olive italic (the card's own --badge-on-card: #4F5730, 7.1:1 on cream, never the lighter
   #8f9a58 of the frame, which is 2.9:1); BRASS = human action only - the "?" turns --choice on hover/open. Flux: the dim readout prompt line  > question ▮ . Any other theme: its muted card text. */
```

## desk-rail §9

From `apps/desktop/src/styles/18-desk-rail.css`, line 386 at `25112784` (the comment that stays: "flat 1px edge, no blur").

```css
/* flat 1 px edge, no blur (Nick's standing dress rule for new work) */
```

## desk-rail §10

From `apps/desktop/src/styles/18-desk-rail.css`, line 403 at `25112784` (the comment that stays: "Flux's own type (Chakra Petch), not Arbor's italic serif").

```css
/* Flux's own type (Chakra Petch), not Arbor's italic serif - Fable, Oct 23 */
```

## desk-rail §11

From `apps/desktop/src/styles/18-desk-rail.css`, line 406 at `25112784` (the comment that stays: "THE WALK, SHOW AS, the Journal as a Book, thumbnails by kind (docs/guided-paths/w1-walk-brief.md). Square edges, flat 1px edges, no shadows; circles only for marks. Arbor: brown and cream surfaces, olive for options and guidance, brass for the human act only; decorative lines muted. The swipe is a pure slide (transform only, both cards opaque, 280ms, a soft edge mask); reduced motion cuts").

```css
/* ── W1 - THE WALK, "SHOW AS", the Journal as a Book, thumbnails by kind (brief docs/guided-paths/w1-walk-brief.md; Fable's board-kinds-final frames 01 / 02 / 04 / 07 / 10 + 02-trace) ──────────────────────────────────────────────
   DRESS (Nick's standing rules for new work): SQUARE edges on every box, FLAT 1 px edges, NO drop shadows; circles only for MARKS (the "?" badge, the rail). Arbor colour rule: brown / cream = surfaces; OLIVE = options and guidance
   (doors, the Show-as icons, rail marks at rest); BRASS = human action only (the current / chosen view, hover, press). Decorative lines are muted, never brass. Flux: brackets, TRK n/m, pixel ticks (hollow, lime, cyan with a thin
   ORANGE LEFT bar for the current one), [NOTE]. The swipe is a PURE SLIDE: its keyframes move TRANSFORM only (both cards stay opaque - never a cross-fade), 280 ms, a soft edge mask on the window; reduced motion = a cut. */
```

## desk-rail §12

From `apps/desktop/src/styles/18-desk-rail.css`, line 439 at `25112784` (the comment that stays: "the caret stands on the body's empty first line, so the dealt question is pulled up onto that line (one editor line: 1.6 x 17px x the card type scale) and reads as where the writer begins").

```css
/* the caret lands in the card (Nick, Oct 25): it stands on the body's empty first line, so the dealt question - the placeholder - is pulled up onto THAT line, one editor line (1.6 x 17px x the card type scale) back, and the question reads as where the writer begins */
```

## desk-rail §13

From `apps/desktop/src/styles/18-desk-rail.css`, line 579 at `25112784` (the comment that stays: "the Outline starts clear of the Sliver's grip, the 16px chevron tab on the stage's left edge").

```css
/* POLISH #10 item 13b - the stage's left chevron tab (the Sliver's grip, 16 px wide, flush on the stage's left edge) used to sit over the Outline's first column (the row numbers): the Outline starts clear of it. */
```

## desk-rail §14

From `apps/desktop/src/styles/18-desk-rail.css`, line 583 at `25112784` (the comment that stays: "square").

```css
/* POLISH #10 item 13c: square (was 6px) */
```

## desk-rail §15

From `apps/desktop/src/styles/18-desk-rail.css`, line 604 at `25112784` (the comment that stays: "the text keeps a gap of its own from the title input, whatever the title's width").

```css
/* POLISH #10 item 13a: the text keeps a gap of its own from the title input, whatever the title's width */
```

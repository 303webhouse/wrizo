# Rulings: `apps/desktop/src/store/pageScale.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[pageScale §n]` points here.

## pageScale §1

From `apps/desktop/src/store/pageScale.ts`, line 1 at `e2898deb` (the comment that stays: "the page scale, pure: the prose page is a US Letter sheet; it always lays out at scale 1 and is painted by a transform, so lines break the same at any scale; the scale comes from the stage alone, never an open panel").

```ts
// PAGE-SIZE (Fable, Oct 23; Nick's ruling c) - THE PAGE SCALE. Pure: no imports, no store, no DOM.
//
// The prose page is a US Letter sheet (docs/plans/page-size.md). At scale 1 it is 620 x 803px: Cursor's mockup sized the text column to a
// 75-character line of 12 pt (16px) type and made that column the letter page's 6.5in between 1in margins, so ONE page-inch is 620 / 8.5 px.
// Everything on the page - its width and height, its margins, its type - is a multiple of that inch. The page always LAYS OUT at scale 1 and is
// PAINTED at the scale by a transform, so it grows in SHAPE only and every line breaks exactly where it did at any scale (scaling the layout
// itself re-broke lines at 2560 and 3840 - the lane run on fb1e28fb: glyph advances do not scale exactly linearly).
//
// THE LAW (ruling c): the scale comes from the STAGE's size alone, never from an open panel (paper never reflows for chrome). It is smooth, not
// stepped: the largest scale at which the whole letter page fits the stage's height with a small margin, never below 1.0. The width term keeps
// the page between the two drawers at their minimum whether or not they are open - a CONSTANT reserve, never their open state.
// The ZOOM (Typewriter and its theme names) is the same page ~1.6x from that base, capped to the largest that fits the stage's width with the
// panels tucked; it is a transform, so it never reflows a line.
```

## pageScale §2

From `apps/desktop/src/store/pageScale.ts`, line 28 at `e2898deb` (the comment that stays: "never less than this past anything already standing over the stage's edge (the fixed strip reaches into the stage at 1100)").

```ts
// ...and never less than this past anything that already stands over the stage's edge: the strip is position:fixed at the window's left and
// reaches 51px into the stage at 1100, so 48 a side put the zoomed page 3px UNDER it (the lane run on d80010ae, cd2 S1/S5 + fx2 S1 @ 1100). The
// page is centred, so the larger intrusion is kept on both sides.
```

## pageScale §3

From `apps/desktop/src/store/pageScale.ts`, line 32 at `e2898deb` (the comment that stays: "the middle of the visible page; the band's stops are drawn from this same anchor (--tw-anchor)").

```ts
// POLISH #10 item 19 (Nick, Oct 25): the MIDDLE of the visible page - "seems too low on the screen to start" at Cursor's 0.6. The band's stops are drawn
// from this same anchor (index.css --tw-anchor), so they move with it.
```

## pageScale §4

From `apps/desktop/src/store/pageScale.ts`, line 45 at `e2898deb` (the comment that stays: "the page's LAYOUT height at base scale k: the letter height, or less where the stage cannot hold the painted page (the text scrolls inside)").

```ts
/** The page's LAYOUT height at base scale `k`: the letter height, or less where the stage cannot hold the painted page (ruling d - capped to the
 *  stage, the text scrolls inside). Painted, it is this x k. */
```

## pageScale §5

#133 (Nick, Nov 25, 2:24 pm, relayed by Fable in orders-nov25.md; POLISH). Nick, on a 17" 4K laptop (a window of about 1536 x 864):
"the writing surface seems too small. I think we need it to be bigger in proportion to the available screen real estate than on my large
32" monitor, even if that means that part of the page is always below the screen edge or the rail and Front menus can't remain open at
the same time." This changes ruling c (§1) on screens narrower than 2560.

- The page scales by the window's width. At 1600 and narrower it takes 62% of the stage's width (`SMALL_SHARE`); from 2560 it is the
  letter fit of ruling c; between, it eases (smoothstep). It is never smaller than the letter fit.
- The page still lays out at scale 1 and is painted by a transform, so no line breaks anywhere else. Where it is taller than the stage,
  the sheet is capped to the stage and the text scrolls inside it, as before (ruling d).
- The Typewriter zoom is not scaled up on top: the zoomed page keeps the size it had from the letter fit, or the normal page's where that
  is larger.
- At 1600 and narrower one side panel stands at a time (menusDrawers §11). Panel widths and openers: desk-frame §22, §23.
- Prose page only. The board and the screenplay page keep their own sizing.

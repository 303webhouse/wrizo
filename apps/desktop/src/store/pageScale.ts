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
export const LETTER_W_IN = 8.5;
export const LETTER_H_IN = 11;
export const PAGE_W_BASE = 620;                              // px at scale 1
export const LETTER_IN_BASE = PAGE_W_BASE / LETTER_W_IN;     // 72.94px: one page-inch at scale 1
export const PAGE_H_BASE = LETTER_IN_BASE * LETTER_H_IN;     // 803.5px
export const PAGE_FENCE = 40;                                // the small margin below the page (index.css --fx3-paper-fence)
// each side, the desk the drawers keep beside the page. 320 (not DRAWER_MIN + the grip, 216): the Sliver's anchor spends part of its side on the
// strip's gap and its own grip lane, and at wide screens its contents grow with --paper-scale - at 216 a width-bound page (3840) squeezed it to
// 144px (64e5b7f9), at 260 to 172px (7ff7b8ea), its own buttons clipped both times. 320 leaves it ~210 and the Tutor its DRAWER_MIN floor.
export const DRAWER_RESERVE = 320;
export const ZOOM = 1.6;
// the zoomed page keeps this much of the stage's width free - 48px a side, the grips' lane: at 48 in all (64e5b7f9) the grips, which follow the
// painted edge, were pushed onto the strip at 1100 (fx2 S1)
export const ZOOM_GUTTER = 96;
// ...and never less than this past anything that already stands over the stage's edge: the strip is position:fixed at the window's left and
// reaches 51px into the stage at 1100, so 48 a side put the zoomed page 3px UNDER it (the lane run on d80010ae, cd2 S1/S5 + fx2 S1 @ 1100). The
// page is centred, so the larger intrusion is kept on both sides.
export const ZOOM_CLEAR = 8;
export const ZOOM_ANCHOR = 0.6;                              // the writing line's hold, as a fraction of the page column's height (Cursor's --anchor)

/** The base page scale for a stage of this size, with the page's top this far below the stage's top. Never below 1. */
export function pageScaleFor(stageW: number, stageH: number, pageTop: number): number {
  if (!(stageW > 0) || !(stageH > 0)) return 1;
  const byHeight = (stageH - Math.max(0, pageTop) - PAGE_FENCE) / PAGE_H_BASE;
  const byWidth = (stageW - 2 * DRAWER_RESERVE) / PAGE_W_BASE;
  const k = Math.min(byHeight, byWidth);
  return Number.isFinite(k) && k > 1 ? k : 1;
}

/** The page's LAYOUT height at base scale `k`: the letter height, or less where the stage cannot hold the painted page (ruling d - capped to the
 *  stage, the text scrolls inside). Painted, it is this x k. */
export function pageLayoutHeightFor(stageH: number, pageTop: number, k: number): number {
  if (!(stageH > 0) || !(k > 0)) return PAGE_H_BASE;
  const room = (stageH - Math.max(0, pageTop) - PAGE_FENCE) / k;
  return Math.max(0, Math.min(PAGE_H_BASE, room));
}

/** The zoom for a page of base scale `k` on a stage this wide: ~1.6, or less where 1.6 would not fit (panels tucked). Never below 1.
 *  `sideInset`: how far chrome already stands over the stage's side (the strip) - the page keeps ZOOM_CLEAR beyond it. */
export function zoomFor(stageW: number, k: number, sideInset = 0): number {
  if (!(stageW > 0) || !(k > 0)) return ZOOM;
  const gutter = Math.max(ZOOM_GUTTER, 2 * (Math.max(0, sideInset) + ZOOM_CLEAR));
  const fit = (stageW - gutter) / (PAGE_W_BASE * k);
  const z = Math.min(ZOOM, fit);
  return Number.isFinite(z) && z > 1 ? z : 1;
}

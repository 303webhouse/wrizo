// PAGE-SIZE (Fable, Oct 23; Nick's ruling c) - THE PAGE SCALE. Pure: no imports, no store, no DOM.
//
// The prose page is a US Letter sheet (docs/plans/page-size.md). At scale 1 it is 620 x 803px: Cursor's mockup sized the text column to a
// 75-character line of 12 pt (16px) type and made that column the letter page's 6.5in between 1in margins, so ONE page-inch is 620 / 8.5 px.
// Everything on the page - its width and height, its margins, its type - is a multiple of that inch, so the page grows in SHAPE only and every
// line breaks where it did at any scale.
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
export const DRAWER_RESERVE = 216;                           // each side: menusDrawers' DRAWER_MIN (200) + the grip's 16
export const ZOOM = 1.6;
export const ZOOM_GUTTER = 48;                               // the zoomed page keeps this much of the stage's width free
export const ZOOM_ANCHOR = 0.6;                              // the writing line's hold, as a fraction of the page column's height (Cursor's --anchor)

/** The base page scale for a stage of this size, with the page's top this far below the stage's top. Never below 1. */
export function pageScaleFor(stageW: number, stageH: number, pageTop: number): number {
  if (!(stageW > 0) || !(stageH > 0)) return 1;
  const byHeight = (stageH - Math.max(0, pageTop) - PAGE_FENCE) / PAGE_H_BASE;
  const byWidth = (stageW - 2 * DRAWER_RESERVE) / PAGE_W_BASE;
  const k = Math.min(byHeight, byWidth);
  return Number.isFinite(k) && k > 1 ? k : 1;
}

/** The zoom for a page of base scale `k` on a stage this wide: ~1.6, or less where 1.6 would not fit (panels tucked). Never below 1. */
export function zoomFor(stageW: number, k: number): number {
  if (!(stageW > 0) || !(k > 0)) return ZOOM;
  const fit = (stageW - ZOOM_GUTTER) / (PAGE_W_BASE * k);
  const z = Math.min(ZOOM, fit);
  return Number.isFinite(z) && z > 1 ? z : 1;
}

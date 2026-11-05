// the page scale, pure: the prose page is a US Letter sheet; it always lays out at scale 1 and is painted by a transform, so lines break the same at any scale; the scale comes from the stage alone, never an open panel [pageScale §1]
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
// never less than this past anything already standing over the stage's edge (the fixed strip reaches into the stage at 1100) [pageScale §2]
export const ZOOM_CLEAR = 8;
// the middle of the visible page; the band's stops are drawn from this same anchor (--tw-anchor) [pageScale §3]
export const ZOOM_ANCHOR = 0.5;                              // the writing line's hold, as a fraction of the page column's height (Cursor's --anchor)

/** The base page scale for a stage of this size, with the page's top this far below the stage's top. Never below 1. */
export function pageScaleFor(stageW: number, stageH: number, pageTop: number): number {
  if (!(stageW > 0) || !(stageH > 0)) return 1;
  const byHeight = (stageH - Math.max(0, pageTop) - PAGE_FENCE) / PAGE_H_BASE;
  const byWidth = (stageW - 2 * DRAWER_RESERVE) / PAGE_W_BASE;
  const k = Math.min(byHeight, byWidth);
  return Number.isFinite(k) && k > 1 ? k : 1;
}

// the page's LAYOUT height at base scale k: the letter height, or less where the stage cannot hold the painted page (the text scrolls inside) [pageScale §4]
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

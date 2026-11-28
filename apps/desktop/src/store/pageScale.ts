// the page scale, pure: the prose page is a US Letter sheet; it always lays out at scale 1 and is painted by a transform, so lines break the same at any scale; the scale comes from the window and its stage, never an open panel [pageScale §1] [pageScale §5]
export const LETTER_W_IN = 8.5;
export const LETTER_H_IN = 11;
export const PAGE_W_BASE = 620;                              // px at scale 1
export const LETTER_IN_BASE = PAGE_W_BASE / LETTER_W_IN;     // 72.94px: one page-inch at scale 1
export const PAGE_H_BASE = LETTER_IN_BASE * LETTER_H_IN;     // 803.5px
// #143 (Nick, Nov 27): her type is laid out for this page scale, so there a point paints as a CSS point (13-desk-frame.css --wz-pt holds the same number)
export const TYPE_SCALE = 1.456;
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

// #133 - the page on a small screen: at SMALL_W and narrower it takes SMALL_SHARE of the stage's width; from LARGE_W it is the letter fit; between, it eases [pageScale §5]
export const SMALL_W = 1600;
export const LARGE_W = 2560;
export const SMALL_SHARE = 0.62;
/** One side panel at a time in a window this narrow (the page leaves no room for two). */
export const onePanelAt = (winW: number): boolean => winW > 0 && winW <= SMALL_W;

/** The largest scale at which the whole letter page fits this stage between its two drawers, with the page's top this far below the stage's top. Never below 1. */
export function fitScaleFor(stageW: number, stageH: number, pageTop: number): number {
  if (!(stageW > 0) || !(stageH > 0)) return 1;
  const byHeight = (stageH - Math.max(0, pageTop) - PAGE_FENCE) / PAGE_H_BASE;
  const byWidth = (stageW - 2 * DRAWER_RESERVE) / PAGE_W_BASE;
  const k = Math.min(byHeight, byWidth);
  return Number.isFinite(k) && k > 1 ? k : 1;
}

/** The base page scale: by width on a small screen, the letter fit on a wide one, never smaller than the letter fit [pageScale §5]. */
export function pageScaleFor(stageW: number, stageH: number, pageTop: number, winW = 0): number {
  const today = fitScaleFor(stageW, stageH, pageTop);
  if (!(winW > 0) || winW >= LARGE_W || !(stageW > 0) || !(stageH > 0)) return today;
  const t = Math.max(0, Math.min(1, (winW - SMALL_W) / (LARGE_W - SMALL_W)));
  const ease = t * t * (3 - 2 * t);
  const small = (SMALL_SHARE * stageW) / PAGE_W_BASE;
  const eased = small + (today - small) * ease;
  return Math.max(today, eased);
}

// #138 (Nick, Nov 26: an open menu never covers the page surface, margins included): the page yields only what the open menu needs, from that menu's side only -
// its other edge and its top stay. `centre` is the page's centre at rest; `leftLimit` / `rightLimit` are the nearest the page may come to each side (null: no menu
// there). It is a change of painted scale and a sideways shift, never a re-lay of the lines. Never under YIELD_FLOOR.
export const YIELD_FLOOR = 0.7;
export function pageYieldFor(centre: number, k: number, leftLimit: number | null, rightLimit: number | null): { k: number; shift: number } {
  const half = (PAGE_W_BASE * k) / 2;
  const left = Math.max(centre - half, leftLimit ?? -Infinity);
  const right = Math.min(centre + half, rightLimit ?? Infinity);
  if (left <= centre - half && right >= centre + half) return { k, shift: 0 };   // nothing to give: exactly the rest, no rounding
  const yk = Math.max(Math.min(k, YIELD_FLOOR), Math.min(k, (right - left) / PAGE_W_BASE));
  const w = PAGE_W_BASE * yk;
  // where the floor stops the page short of the room asked, the edge away from the one menu still holds
  const mid = leftLimit != null && rightLimit == null ? centre + half - w / 2 : rightLimit != null && leftLimit == null ? centre - half + w / 2 : (left + right) / 2;
  return { k: yk, shift: mid - centre };
}

// #143: her type is laid out TYPE_SCALE times smaller, so the Typewriter zooms that much more to keep today's size on screen. Where the whole page must stay clear
// of the rail it goes only as far as that allows (`share` 1); Flux's Wire In keeps today's size, the paper's blank margins passing under the rail, her words never
// (`share`: the text column's part of the paper). Never less than the zoom as it was.
// Outside Flux it also keeps `side` px of desk each side (ZOOM_DOCK_SIDE: Fable, Nov 28, Q1 B - the rail's survey still docks beside the zoomed page), her type then painting a little smaller.
export const ZOOM_DOCK_SIDE = 121;   // the docking floor (Cascade.tsx DOCK_FLOOR_PX, 120), and one for rounding
export function zoomForType(zoom: number, k: number, stageW: number, sideInset: number, share: number, side = 0): number {
  if (!(stageW > 0) || !(k > 0)) return zoom;
  const gutter = Math.max(ZOOM_GUTTER, 2 * (Math.max(0, sideInset) + ZOOM_CLEAR), 2 * side);
  const most = (stageW - gutter) / (PAGE_W_BASE * share * k);
  const z = Math.max(zoom, Math.min(zoom * TYPE_SCALE, most));
  return Number.isFinite(z) && z > 1 ? z : 1;
}

// the page's LAYOUT height at base scale k: the letter height, or less where the stage cannot hold the painted page (the text scrolls inside) [pageScale §4]
export function pageLayoutHeightFor(stageH: number, pageTop: number, k: number): number {
  if (!(stageH > 0) || !(k > 0)) return PAGE_H_BASE;
  const room = (stageH - Math.max(0, pageTop) - PAGE_FENCE) / k;
  return Math.max(0, Math.min(PAGE_H_BASE, room));
}

/** The zoom for a page of base scale `k` on a stage this wide: ~1.6, or less where 1.6 would not fit (panels tucked). Never below 1.
 *  `sideInset`: how far chrome already stands over the stage's side (the strip) - the page keeps ZOOM_CLEAR beyond it.
 *  `fitK`: the letter fit, where `k` has grown past it (#133): the zoomed page stays the size it was from the letter fit, unless the
 *  normal page is already larger, so the zoom is never smaller than either [pageScale §5]. */
export function zoomFor(stageW: number, k: number, sideInset = 0, fitK = k): number {
  if (!(stageW > 0) || !(k > 0)) return ZOOM;
  const gutter = Math.max(ZOOM_GUTTER, 2 * (Math.max(0, sideInset) + ZOOM_CLEAR));
  const from = fitK > 0 ? fitK : k;
  const fromZoom = Math.max(1, Math.min(ZOOM, (stageW - gutter) / (PAGE_W_BASE * from)));
  const z = (fromZoom * from) / k;
  return Number.isFinite(z) && z > 1 ? z : 1;
}

// FLUX 3 - THE CURRENT'S DRAWING RULES (Fable, Nov 21, 4:56 pm; flux-full-look-for-monday.md §2): pure functions over rectangles, so the rules can be proved without a browser
// (scripts/harness/flux3-current-unit.mjs runs this file and three mutants of it). Nothing here touches the page.
//
// THE STAGE SPARK (v2, subtle, Nick 4:47 pm): when she changes stage, a 1 px cyan streak about 60 px long leaves the pressed button along the top bar's lower edge to each side, then runs ONE LAP
// around each menu's edge (a closed menu: around its opener tab). It stays in the top bar and the gutters, outside the page's rectangle (law 1: never over the words). A side with no menu has no path.

export interface Rect { left: number; top: number; right: number; bottom: number }
export type Pt = [number, number];

/** the spark: about 60 px long, one lap in about 0.55 s */
export const SPARK_PX = 60;
export const SPARK_MS = 550;
const CYAN = '#00C2FF';
const HEAD = '#BEEBFF';

export interface StageGeom {
  /** the pressed stage button */
  btn: Rect;
  /** the top bar's lower edge */
  barBottom: number;
  /** the page's rectangle: the spark never enters it */
  page: Rect;
  /** each menu's box (open) or its opener tab (closed); null when it has none (Wire In) */
  left: Rect | null;
  right: Rect | null;
}

const half = (n: number): number => Math.round(n) + 0.5;   // a 1 px line on the pixel grid

/** the path's length */
export function pathLength(pts: readonly Pt[]): number {
  let n = 0;
  for (let i = 1; i < pts.length; i += 1) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return n;
}

/** does any segment of the path pass through the rectangle's interior? (axis-aligned segments, as every path here is) */
export function crossesRect(pts: readonly Pt[], r: Rect): boolean {
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const lo = Math.min(x0, x1), hi = Math.max(x0, x1), top = Math.min(y0, y1), bot = Math.max(y0, y1);
    if (hi > r.left && lo < r.right && bot > r.top && top < r.bottom) return true;
  }
  return false;
}

/** one side: from the button along the bar's lower edge to the menu, then one lap round the menu's edge */
function side(g: StageGeom, m: Rect, dir: -1 | 1): Pt[] {
  const bx = (g.btn.left + g.btn.right) / 2;
  let y0 = half(g.barBottom - 0.5);
  // BAR-EDGE
  y0 = Math.min(y0, half(g.page.top - 2.5));   // a page whose top is above the bar's lower edge: the run along the bar stays above it
  let ml = m.left;
  let mr = m.right;
  // CLAMP
  if (dir < 0) { ml = Math.min(ml, g.page.left - 1); mr = Math.min(mr, g.page.left - 1); } else { ml = Math.max(ml, g.page.right + 1); mr = Math.max(mr, g.page.right + 1); }
  const mt = Math.max(m.top, y0 + 1);
  const mb = Math.max(m.bottom, mt + 1);
  const near = dir < 0 ? mr : ml;      // the corner on the page's side is where the run along the bar turns down
  const far = dir < 0 ? ml : mr;
  const pts: Pt[] = [[bx, y0], [near, y0], [near, mt], [far, mt], [far, mb], [near, mb]];
  // LAP-CLOSE
  pts.push([near, mt]);
  return pts;
}

/** both sides' paths; a side with no menu is null */
export function stagePaths(g: StageGeom): { left: Pt[] | null; right: Pt[] | null } {
  return { left: g.left ? side(g, g.left, -1) : null, right: g.right ? side(g, g.right, 1) : null };
}

export interface SparkLayer {
  /** the dash's length: the streak, its tail fading along it */
  len: number;
  opacity: number;
  width: number;
  color: string;
  /** stroke-dashoffset at the start and at the end: the dash's head runs from the path's start to its end and out of it, so nothing stays lit */
  offsetFrom: number;
  offsetTo: number;
}

/** the streak is four layers that end at one head: 60 px at a whisper, 30 and 12 brighter, and a 3 px head in the pale cyan */
export function sparkLayers(total: number): SparkLayer[] {
  const mk = (len: number, opacity: number, width: number, color: string): SparkLayer => ({ len, opacity, width, color, offsetFrom: len, offsetTo: -total });
  return [mk(SPARK_PX, 0.22, 1, CYAN), mk(SPARK_PX / 2, 0.5, 1, CYAN), mk(12, 0.85, 1, CYAN), mk(3, 1, 1.5, HEAD)];
}

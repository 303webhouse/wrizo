// ARBOR v2 MOCKUP - the page stays a whole sheet, and the room's light never crosses it (Fable, Oct 29, after the CI frames).
//
// Free Write runs Typewriter's zoom: the column carries a band mask that fades the words AND the paper into the room above and below the
// writing line (index.css `.mode-pagecol[data-zoom='true']`, the ruled page-size exception). In Arbor's rooms that read wrong twice:
//   - by NIGHT the paper became a lit band floating in the dark ("the night fade must not turn the paper into a band");
//   - by DAY the pergola's slats showed through the see-through paper ("NEVER cross the prose column", spec §7.1).
// Under the flag only, two things follow the visible page (the page's box cut to its column, in viewport pixels):
//   PAPER  .arbor2-paper, an opaque sheet in the page's own paper colour behind the column. The band mask still fades the WORDS, but they
//          now fade into paper, not into the room. It sits at z-index -1 in body (behind every surface; the page, drawers and tabs paint over
//          it), takes no pointer, and never moves or resizes the page (it follows the page's rect; it does not set it).
//   HOLE   the sun layer (sun.ts) gets an evenodd clip-path with a hole over the visible page of ANY mounted prose page, zoomed or not, so no
//          slat or leaf is drawn there by any route. The room's vignette (body::after) gets a hole there too (--arbor2-vignette-mask).
//   The visible page stops at the stage's progress row, which keeps the room behind it.
// UNFRAMED (Fable, Oct 29: "The Typewriter rule stands: the zoomed page is unframed, so give the opaque night sheet no visible edge"). The
// sheet is the only paper while zoomed: the page's own background, shadow and border stand down (data-arbor2-sheet on <html>, CSS), the
// sheet carries no glow, and its mask fades it to nothing over FEATHER px at every side. The vignette's hole is a mask too, the sheet's exact
// complement (vignette = 1 - paper at every point), so the room darkens just as the paper thins and no line is drawn where the paper ends.
// A page that is not zoomed keeps its own opaque paper and a hard hole (feather 0), exactly as before.
// Measuring is two getBoundingClientRect reads, on resize, on the zoom's own event, on route change and every 300 ms (never on a keystroke).
// Nothing is stored.
export const FEATHER = 48;
const BLACK = 'rgb(0,0,0)', CLEAR = 'rgba(0,0,0,0)';
const px = (n: number) => `${Math.round(n * 10) / 10}px`;
type Box = { l: number; t: number; r: number; b: number };

export function visiblePage(): { box: Box; zoomed: boolean; paper: string } | null {
  const p = document.querySelector('.mode-page') as HTMLElement | null;
  if (!p) return null;
  const a = p.getBoundingClientRect();
  if (a.width < 2 || a.height < 2) return null;
  const col = p.closest('.mode-pagecol') as HTMLElement | null;
  const c = col ? col.getBoundingClientRect() : a;
  // the zoomed page reaches past the stage's progress row (the column's box does too): the sheet stops at that row, so the goal line and the
  // word count keep the room behind them (on cream they lost their contrast - the first green frames, run 40986639311)
  // (the row's own box can be 0 tall - its pieces carry the height - so the top of its first VISIBLE piece is the foot; run 40987236296
  // read the row's box alone and the sheet still ran under "31 words")
  let foot = Infinity;
  document.querySelectorAll('.mode-progress, .mode-progress *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top > a.top + 40 && r.left < a.right && r.right > a.left) foot = Math.min(foot, r.top);
  });
  const box = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight, foot) };
  if (box.r - box.l < 2 || box.b - box.t < 2) return null;
  // the paper colour is the page's own --paper token (its background is see-through while the sheet stands in for it)
  return { box, zoomed: col?.getAttribute('data-zoom') === 'true', paper: getComputedStyle(p).getPropertyValue('--paper').trim() };
}

/** The evenodd clip for a layer at (ox, oy) of size w x h, with one hole at `hole` (viewport pixels). */
export function holePath(w: number, h: number, ox: number, oy: number, hole: Box): string {
  const f = (n: number) => String(Math.round(n * 10) / 10);
  const l = hole.l - ox, t = hole.t - oy, r = hole.r - ox, b = hole.b - oy;
  return `path(evenodd, "M0 0H${f(w)}V${f(h)}H0Z M${f(l)} ${f(t)}H${f(r)}V${f(b)}H${f(l)}Z")`;
}

/** The sheet's own mask (its layers INTERSECT): 0 at each side, 1 from `f` px in. Offsets are in the sheet's box (w x h). */
export function sheetMask(w: number, h: number, f: number): string {
  const g = (dir: string, n: number) => `linear-gradient(${dir}, ${CLEAR} 0px, ${BLACK} ${px(f)}, ${BLACK} ${px(n - f)}, ${CLEAR} ${px(n)})`;
  return `${g('to right', w)}, ${g('to bottom', h)}`;
}

/** The vignette's mask (its layers ADD), in viewport px: 1 outside `hole`, 0 from `f` px inside it - the sheet's complement. f = 0 is a hard hole. */
export function vignetteMask(hole: Box, f: number): string {
  const g = (dir: string, a: number, b: number) => `linear-gradient(${dir}, ${BLACK} ${px(a)}, ${CLEAR} ${px(a + f)}, ${CLEAR} ${px(b - f)}, ${BLACK} ${px(b)})`;
  return `${g('to right', hole.l, hole.r)}, ${g('to bottom', hole.t, hole.b)}`;
}

/** The feather a sheet of w x h can carry: FEATHER, or less on a sheet too small to hold two (never a band of nothing). */
export function featherFor(w: number, h: number): number {
  return Math.max(0, Math.min(FEATHER, Math.floor(Math.min(w, h) / 4)));
}

export function mountPaper(): void {
  const sheet = document.createElement('div');
  sheet.className = 'arbor2-paper';
  sheet.setAttribute('aria-hidden', 'true');
  document.body.appendChild(sheet);   // after the sun layer: same z-index, later in order, so it paints over the slats

  let last = '';
  const update = () => {
    const v = visiblePage();
    const sun = document.querySelector('.arbor2-sun') as HTMLElement | null;
    // the room is in the key: by night the sun layer is display:none (a 0x0 box), so its clip is measured again when the day comes back
    const room = document.documentElement.getAttribute('data-arbor2-room');
    const key = v ? `${v.box.l},${v.box.t},${v.box.r},${v.box.b},${v.zoomed},${v.paper},${innerWidth},${innerHeight},${room}` : `none,${innerWidth},${room}`;
    if (key === last) return;
    last = key;
    const root = document.documentElement;
    const f = v && v.zoomed ? featherFor(v.box.r - v.box.l, v.box.b - v.box.t) : 0;
    if (v && v.zoomed) {
      const w = v.box.r - v.box.l, h = v.box.b - v.box.t;
      sheet.style.cssText = `left:${v.box.l}px;top:${v.box.t}px;width:${w}px;height:${h}px;background:${v.paper};`
        + `mask-image:${sheetMask(w, h, f)};mask-composite:intersect`;
      sheet.setAttribute('data-on', 'true');
      root.setAttribute('data-arbor2-sheet', 'on');   // after the sheet is drawn: the page lets go of its own paper only once this one is there
    } else {
      root.removeAttribute('data-arbor2-sheet');
      sheet.removeAttribute('data-on');
    }
    if (sun) {
      if (v) {
        const s = sun.getBoundingClientRect();
        sun.style.clipPath = holePath(s.width, s.height, s.left, s.top, v.box);
      } else {
        sun.style.clipPath = '';
      }
    }
    // the room's vignette (index.css body::after, fixed inset 0) paints AFTER the sheet in body's stacking context, so where the zoomed page
    // is see-through it greyed the paper's top and bottom (night's band, still there in run 40986639311): it gets a hole over the page - a
    // MASK, so that over the sheet's feather it is exactly what the paper leaves (the hard clip it replaces drew a line there)
    if (v) root.style.setProperty('--arbor2-vignette-mask', vignetteMask(v.box, f));
    else root.style.removeProperty('--arbor2-vignette-mask');
  };
  update();
  addEventListener('resize', update);
  addEventListener('hashchange', () => requestAnimationFrame(update));
  document.addEventListener('wz-zoom-changed', () => requestAnimationFrame(update));
  setInterval(update, 300);
}

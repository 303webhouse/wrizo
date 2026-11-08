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
//   HOLE   the sun layer (sun.ts) gets a mask with a hole over the visible page of ANY mounted prose page, zoomed or not, so no
//          slat or leaf is drawn there past its soft outer rim (below). The room's vignette (body::after) gets a hole there too (--arbor2-vignette-mask).
//   The visible page stops at the stage's progress row, which keeps the room behind it.
// UNFRAMED (Fable, Oct 29: "The Typewriter rule stands: the zoomed page is unframed, so give the opaque night sheet no visible edge"). The
// sheet is the only paper while zoomed: the page's own background, shadow and border stand down (data-arbor2-sheet on <html>, CSS), the
// sheet carries no glow, and its mask fades it to nothing over FEATHER px at every side. The vignette's hole is a mask too, the sheet's exact
// complement (vignette = 1 - paper at every point), so the room darkens just as the paper thins and no line is drawn where the paper ends.
// A page that is not zoomed keeps its own opaque paper and a hard hole (feather 0), exactly as before.
// THE PERGOLA'S SOFT EDGE (Fable, Oct 29: "Feather the pergola's page hole with a ~24 px soft edge (§7.1), never over the prose column"):
// the sun layer's hard clip is replaced by a mask - the light is whole at the page's edge and fades to nothing SUN_EDGE px inside it, the
// spec's "the page's outer 24 px may catch a soft edge". The prose sits ~100 px or more inside the page, so it never catches any.
// Measuring is two getBoundingClientRect reads, on resize, on the zoom's own event, on route change and every 300 ms (never on a keystroke).
// Nothing is stored.
// r5 (spec §10b, Fable Oct 31: "No diffused or vignetted paper edges on the zoomed page: the zoom and the fading text are the only
// flourishes"; Arbor-only, still unframed): the sheet's feather is 0 - a hard rectangle with no mask, no border, no shadow, and the
// vignette's hole over it is hard too. (Oct 29's 48 px feather - "no visible edge" - is superseded.) The pergola keeps its own soft edge.
// r22 (Fable, Nov 8, ruling 1 on Nick's walk: "while Typewriter is on, Arbor's page draws no fill or edge of its own; the words sit on the
// room's ground under the lamplight glow; the text floors hold, measured on the room; leaving restores the page exactly"): THE SHEET RETIRES,
// with its feather and its mask (FEATHER, sheetMask, featherFor). The zoomed page is bare (styles/arbor-v2.css), nothing stands in for it, and
// the vignette gets no hole over it (the room's shade crosses it unbroken). Only the sun layer's soft hole stays, so no slat crosses the words.
// A page that is not zoomed is exactly as before: its own opaque paper and the vignette's hard hole. Leaving Typewriter is that page again.
export const SUN_EDGE = 24;
const BLACK = 'rgb(0,0,0)', CLEAR = 'rgba(0,0,0,0)';
const px = (n: number) => `${Math.round(n * 10) / 10}px`;
type Box = { l: number; t: number; r: number; b: number };

export function visiblePage(): { box: Box; zoomed: boolean; paper: string; room: Box } | null {
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
  const row = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
  document.querySelectorAll('.mode-progress, .mode-progress *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top > a.top + 40 && r.left < a.right && r.right > a.left) {
      foot = Math.min(foot, r.top);
      row.l = Math.min(row.l, r.left); row.t = Math.min(row.t, r.top); row.r = Math.max(row.r, r.right); row.b = Math.max(row.b, r.bottom);
    }
  });
  const box = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight, foot) };
  if (box.r - box.l < 2 || box.b - box.t < 2) return null;
  // the paper colour is the page's own --paper token (its background is see-through while the sheet stands in for it)
  // r5: the PERGOLA's hole also takes in the progress row under the page - the count there is the one label on
  // the bare room, so no shadow or vignette ever falls on it (it keeps the plaster's own contrast: quiet #5E6A3F 4.86:1)
  // (the margin clears the pergola's own soft edge: its light fades over SUN_EDGE px INSIDE the hole, so a 4 px margin still lit the count at
  // .89 - zoomProof V6 on arbor2-6, run 41241802502 - and the hole reaches SUN_EDGE + 4 px past the row)
  const M = SUN_EDGE + 4;
  const room = row.r > row.l ? { l: Math.min(box.l, row.l - M), t: box.t, r: Math.max(box.r, row.r + M), b: Math.min(innerHeight, Math.max(box.b, row.b + M)) } : box;
  return { box, zoomed: col?.getAttribute('data-zoom') === 'true', paper: getComputedStyle(p).getPropertyValue('--paper').trim(), room };
}

/** The evenodd clip for a layer at (ox, oy) of size w x h, with one hole at `hole` (viewport pixels). */
export function holePath(w: number, h: number, ox: number, oy: number, hole: Box): string {
  const f = (n: number) => String(Math.round(n * 10) / 10);
  const l = hole.l - ox, t = hole.t - oy, r = hole.r - ox, b = hole.b - oy;
  return `path(evenodd, "M0 0H${f(w)}V${f(h)}H0Z M${f(l)} ${f(t)}H${f(r)}V${f(b)}H${f(l)}Z")`;
}

/** The vignette's mask (its layers ADD), in viewport px: 1 outside `hole`, 0 from `f` px inside it. f = 0 is a hard hole. */
export function vignetteMask(hole: Box, f: number): string {
  const g = (dir: string, a: number, b: number) => `linear-gradient(${dir}, ${BLACK} ${px(a)}, ${CLEAR} ${px(a + f)}, ${CLEAR} ${px(b - f)}, ${BLACK} ${px(b)})`;
  return `${g('to right', hole.l, hole.r)}, ${g('to bottom', hole.t, hole.b)}`;
}

export function mountPaper(): void {
  let last = '';
  const update = () => {
    const v = visiblePage();
    const sun = document.querySelector('.arbor2-sun') as HTMLElement | null;
    // the room is in the key: by night the sun layer is display:none (a 0x0 box), so its clip is measured again when the day comes back
    const room = document.documentElement.getAttribute('data-arbor2-room');
    const key = v ? `${v.box.l},${v.box.t},${v.box.r},${v.box.b},${v.room.l},${v.room.r},${v.room.b},${v.zoomed},${v.paper},${innerWidth},${innerHeight},${room}` : `none,${innerWidth},${room}`;
    if (key === last) return;
    last = key;
    const root = document.documentElement;
    if (sun) {
      if (v) {
        // in the layer's own box (it sits at inset -80px): whole at the page's edge, nothing SUN_EDGE px in (the hard clip drew a line there)
        const s = sun.getBoundingClientRect();
        const b = { l: v.room.l - s.left, t: v.room.t - s.top, r: v.room.r - s.left, b: v.room.b - s.top };
        sun.style.maskImage = vignetteMask(b, SUN_EDGE);
        sun.style.maskComposite = 'add';
      } else {
        sun.style.maskImage = '';
      }
    }
    // the room's vignette (index.css body::after, fixed inset 0) paints AFTER the sheet in body's stacking context, so where the zoomed page
    // is see-through it greyed the paper's top and bottom (night's band, still there in run 40986639311): it gets a hole over the page - a
    // MASK, so that over the sheet's feather it is exactly what the paper leaves (the hard clip it replaces drew a line there)
    // (the vignette's hole is the PAGE itself, hard: widened to the room's hole it left a pale unshaded band around the page that read as a
    // frame - seen in the r5 day frames at 1920, run 41243059463; only the pergola's hole takes the count row in)
    // r22: the zoomed page has no hole - the room's shade crosses it unbroken, like the ground and the glow (a hole would draw its edge)
    if (v && !v.zoomed) root.style.setProperty('--arbor2-vignette-mask', vignetteMask(v.box, 0));
    else root.style.removeProperty('--arbor2-vignette-mask');
  };
  update();
  addEventListener('resize', update);
  addEventListener('hashchange', () => requestAnimationFrame(update));
  document.addEventListener('wz-zoom-changed', () => requestAnimationFrame(update));
  setInterval(update, 300);
}

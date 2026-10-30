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
//          slat or leaf is drawn there by any route.
// Measuring is two getBoundingClientRect reads, on resize, on the zoom's own event, on route change and every 300 ms (never on a keystroke).
// Nothing is stored.
type Box = { l: number; t: number; r: number; b: number };

export function visiblePage(): { box: Box; zoomed: boolean; paper: string } | null {
  const p = document.querySelector('.mode-page') as HTMLElement | null;
  if (!p) return null;
  const a = p.getBoundingClientRect();
  if (a.width < 2 || a.height < 2) return null;
  const col = p.closest('.mode-pagecol') as HTMLElement | null;
  const c = col ? col.getBoundingClientRect() : a;
  const box = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight) };
  if (box.r - box.l < 2 || box.b - box.t < 2) return null;
  return { box, zoomed: col?.getAttribute('data-zoom') === 'true', paper: getComputedStyle(p).backgroundColor };
}

/** The evenodd clip for a layer at (ox, oy) of size w x h, with one hole at `hole` (viewport pixels). */
export function holePath(w: number, h: number, ox: number, oy: number, hole: Box): string {
  const f = (n: number) => String(Math.round(n * 10) / 10);
  const l = hole.l - ox, t = hole.t - oy, r = hole.r - ox, b = hole.b - oy;
  return `path(evenodd, "M0 0H${f(w)}V${f(h)}H0Z M${f(l)} ${f(t)}H${f(r)}V${f(b)}H${f(l)}Z")`;
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
    if (v && v.zoomed) {
      sheet.style.cssText = `left:${v.box.l}px;top:${v.box.t}px;width:${v.box.r - v.box.l}px;height:${v.box.b - v.box.t}px;background:${v.paper}`;
      sheet.setAttribute('data-on', 'true');
    } else {
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
  };
  update();
  addEventListener('resize', update);
  addEventListener('hashchange', () => requestAnimationFrame(update));
  document.addEventListener('wz-zoom-changed', () => requestAnimationFrame(update));
  setInterval(update, 300);
}

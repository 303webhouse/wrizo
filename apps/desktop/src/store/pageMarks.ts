// PAGE BREAKS - THE MARKS (the Wrizors' spec draft 3, APPROVED: Nick, Nov 19). A T-square in BOTH margins on each break line: ├ left, ┤ right.
// The stem is 14 px, centred on the break line (the line box top of the next page's first line); the arm is 8 px on the break line, its tip 12 px
// from the text column (the column's edges, never the ragged line ends). 2 px stroke (Machina 1 px), on whole device pixels; they grow with the
// page like the words (the zoom's 1.6: 22 / 13 / 3, Machina 2). Drawn in a layer beside the editor (in its wrapper, never inside the editable),
// so they cannot be typed into, copied, counted or exported; aria-hidden, nothing to press; they scroll with the text and take the typewriter's
// fade (the mask is on the scroller / the zoomed column). Page 1 never has a mark; a section after the first opens with a pair [pageMarks §1]
import { cleanPoint } from './pageMeasure';

const STEM = 14, ARM = 8, GAP = 12;
const LAYER = 'wz-pb-marks';

function layerFor(ed: HTMLElement): HTMLElement | null {
  const wrap = ed.parentElement;
  if (!wrap || !wrap.classList.contains('forward-only-editor-wrap')) return null;
  let L = wrap.querySelector(`:scope > .${LAYER}`) as HTMLElement | null;
  if (!L) {
    L = document.createElement('div');
    L.className = LAYER;
    L.setAttribute('aria-hidden', 'true');
    wrap.appendChild(L);
  }
  return L;
}

export function clearMarks(ed: HTMLElement | null): void {
  const L = ed?.parentElement?.querySelector(`:scope > .${LAYER}`);
  if (L) L.remove();
}

/** Draw a pair at each offset in `at` (clean offsets of the lines that open a page). Positions come from the live page's own layout. */
export function drawMarks(ed: HTMLElement, at: readonly number[]): void {
  const L = layerFor(ed);
  if (!L) return;
  const wrap = L.parentElement as HTMLElement;
  const wr = wrap.getBoundingClientRect();
  const s = wrap.offsetWidth ? wr.width / wrap.offsetWidth : 1;   // the page's painted scale (k, times the zoom)
  if (!(s > 0)) return;
  const dpr = window.devicePixelRatio || 1;
  const fine = document.documentElement.getAttribute('data-theme') === 'machina';
  const D = (v: number) => Math.max(1, Math.round(v * s * dpr));   // a size in device px
  const T = D(fine ? 1 : 2), H = D(STEM), A = D(ARM), G = D(GAP);
  // the text column, in device px
  const es = getComputedStyle(ed);
  const er = ed.getBoundingClientRect();
  const colL = Math.round((er.left + (ed.clientLeft + (parseFloat(es.paddingLeft) || 0)) * s) * dpr);
  const colR = Math.round((er.left + (ed.clientLeft + ed.clientWidth - (parseFloat(es.paddingRight) || 0)) * s) * dpr);
  const toLocalX = (dev: number) => (dev / dpr - wr.left) / s;
  const toLocalY = (dev: number) => (dev / dpr - wr.top) / s;
  const len = (dev: number) => dev / dpr / s;
  const R = document.createRange();
  const out: string[] = [];
  for (const o of at) {
    const pt = cleanPoint(ed, o);
    let y: number | null = null;
    if (pt && pt.node.nodeType === Node.TEXT_NODE) {
      const t = pt.node as Text;
      const row = t.parentElement?.closest('.wz-row') as HTMLElement | null;
      for (let k = pt.offset; k < Math.min(t.data.length, pt.offset + 4) && y === null; k++) {
        R.setStart(t, k); R.setEnd(t, k + 1);
        const q = Array.from(R.getClientRects()).find((r) => r.height >= 4);
        if (!q) continue;
        if (row) {
          // the line's box top, in the walk's own unit: the row's top plus (its line index) x (row height / row lines), never a guess at the leading
          const rr = row.getBoundingClientRect();
          const tops = lineTops(row);
          const idx = tops.filter((v) => v < q.top - 3).length;
          y = rr.top + idx * (rr.height / Math.max(1, tops.length));
        } else {
          // Free Write's flow (no rows): the glyph box less half the leading of its own line-height
          const lh = parseFloat(getComputedStyle(t.parentElement as Element).lineHeight);
          y = q.top - (Number.isFinite(lh) ? (lh * s - q.height) / 2 : 0);
        }
      }
    }
    if (y === null) continue;
    const Y = Math.round(y * dpr);
    const stemTop = Y - Math.round(H / 2), armTop = Y - Math.round(T / 2);
    const lTip = colL - G, rTip = colR + G;
    const piece = (x: number, top: number, w: number, h: number) =>
      `<i style="left:${toLocalX(x).toFixed(3)}px;top:${toLocalY(top).toFixed(3)}px;width:${len(w).toFixed(3)}px;height:${len(h).toFixed(3)}px"></i>`;
    out.push(`<span class="wz-pb-pair" data-at="${o}">`
      + `<span class="wz-pb-mark" data-side="left">${piece(lTip - A, stemTop, T, H)}${piece(lTip - A, armTop, A, T)}</span>`
      + `<span class="wz-pb-mark" data-side="right">${piece(rTip + A - T, stemTop, T, H)}${piece(rTip, armTop, A, T)}</span>`
      + '</span>');
  }
  const html = out.join('');
  if (drawn.get(L) !== html) { L.innerHTML = html; drawn.set(L, html); }
}
const drawn = new WeakMap<HTMLElement, string>();

// the distinct line tops of a row's text (a count, as the walk counts them)
function lineTops(row: HTMLElement): number[] {
  const R = document.createRange();
  R.selectNodeContents(row);
  const tops = Array.from(R.getClientRects()).filter((q) => q.height >= 4).map((q) => q.top).sort((a, b) => a - b);
  const out: number[] = [];
  for (const t of tops) if (!out.length || t - out[out.length - 1] > 3) out.push(t);
  return out.length ? out : [row.getBoundingClientRect().top];
}

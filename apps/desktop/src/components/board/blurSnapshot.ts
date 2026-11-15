// LOOK B (Nick's pick, Nov 14 5:29 pm; Fable's ruling 6:18 pm): the board behind a card's popup is blurred ONCE, when the popup opens, and then held still.
// Why: a live `filter: blur(6px)` over the board is re-run by the compositor on every frame, and every key the card's text changes under it. The box measured it (bug #102,
// Nov 15): over Flux's board the live blur holds the FIRST FRAME at 22.5 ms against 12.1 in Arbor, and a static image costs what "filter off" costs.
//
// This draws the board's own DOM (its canvases, cards, lines) into ONE canvas, blurred with the 2D context's own filter, and the hook (useBoardBlurSnap.ts) lays it over the board.
// No dependency: the DOM is cloned with its computed styles inlined, serialised into an SVG <foreignObject>, loaded as an image and drawn once. The canvas is only ever DISPLAYED (never read
// back), so the foreignObject's cross-origin taint does not matter. If ANY step fails (no ctx.filter, an image that will not decode, a timeout) this returns null and the caller keeps the
// live blur: today's look, unchanged. Nothing here reads the board's data or writes anything.

// the computed properties copied onto every element of the clone (the standalone SVG document has none of the page's stylesheets)
const PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'box-sizing',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'background-clip', 'background-origin',
  'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-transform', 'text-indent',
  'text-decoration-line', 'text-decoration-color', 'text-shadow', 'white-space', 'word-break', 'overflow-wrap', 'overflow-x', 'overflow-y', 'text-overflow',
  'opacity', 'visibility', 'transform', 'transform-origin', 'box-shadow', 'z-index', 'mix-blend-mode', 'clip-path', 'object-fit', 'object-position',
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-items', 'align-self', 'align-content', 'justify-content', 'justify-items', 'justify-self', 'order', 'gap', 'row-gap', 'column-gap',
  'grid-template-columns', 'grid-template-rows', 'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end', 'grid-auto-flow',
  'float', 'clear', 'vertical-align', 'list-style-type', 'outline-width', 'outline-style', 'outline-color', 'outline-offset',
  '-webkit-text-stroke-width', '-webkit-text-stroke-color', '-webkit-text-fill-color', '-webkit-background-clip',
] as const;

// what an element INSIDE an inline <svg> needs (its class-based fill and stroke are lost in the standalone document)
const SVG_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'fill-opacity', 'stroke-opacity', 'opacity', 'visibility', 'display', 'color', 'font-family', 'font-size', 'font-weight'] as const;

const TIMEOUT_MS = 2500;

function inline(o: Element, c: Element): void {
  const cs = getComputedStyle(o);
  const style = (c as HTMLElement | SVGElement).style;
  if (!style) return;
  const list = o instanceof SVGElement && !(o instanceof SVGSVGElement) ? SVG_PROPS : PROPS;
  for (const p of list) {
    const v = cs.getPropertyValue(p);
    if (v) style.setProperty(p, v);
  }
}

// ::before and ::after are not in the clone (cloneNode copies elements): each one with content becomes a real <span> with the pseudo's own computed style, so a theme's card chrome (corner brackets, glows) is drawn
function pseudo(o: Element, c: Element): void {
  for (const which of ['::before', '::after'] as const) {
    const ps = getComputedStyle(o, which);
    const content = ps.content;
    if (!content || content === 'none' || content === 'normal' || ps.display === 'none') continue;
    const span = document.createElement('span');
    for (const p of PROPS) { const v = ps.getPropertyValue(p); if (v) span.style.setProperty(p, v); }
    const m = /^"(.*)"$/.exec(content) || /^'(.*)'$/.exec(content);
    if (m && m[1]) span.textContent = m[1].replace(/\\(.)/g, '$1');
    if (which === '::before') c.insertBefore(span, c.firstChild); else c.appendChild(span);
  }
}

function walk(o: Element, c: Element, scrolls: Array<{ c: Element; left: number; top: number; w: number; h: number }>): void {
  const cs = getComputedStyle(o);
  if (cs.display === 'none') { c.remove(); return; }
  // a replaced element becomes an image of what it shows now
  if (o instanceof HTMLCanvasElement) {
    const img = document.createElement('img');
    try { img.setAttribute('src', o.toDataURL('image/png')); } catch { /* a tainted canvas draws nothing */ }
    inline(o, img);
    c.replaceWith(img);
    return;
  }
  if (o instanceof HTMLVideoElement || o instanceof HTMLIFrameElement || o instanceof HTMLObjectElement || o instanceof HTMLEmbedElement) { c.remove(); return; }
  inline(o, c);
  // a scroll box draws no scrollbar in the snapshot (the live blur never showed one at this strength; the first frames showed a pale thumb)
  if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) { (c as HTMLElement).style.overflow = 'hidden'; }
  if (o instanceof HTMLImageElement && o.complete && o.naturalWidth > 0 && !/^data:/.test(o.currentSrc || o.src)) {
    try {
      const cv = document.createElement('canvas');
      cv.width = o.naturalWidth; cv.height = o.naturalHeight;
      cv.getContext('2d')?.drawImage(o, 0, 0);
      c.setAttribute('src', cv.toDataURL('image/png'));
      c.removeAttribute('srcset');
    } catch { /* a cross-origin image draws blank */ }
  }
  if (o instanceof HTMLTextAreaElement) c.textContent = o.value;
  if (o instanceof HTMLInputElement) c.setAttribute('value', o.value);
  if (o instanceof HTMLElement && (o.scrollLeft > 0 || o.scrollTop > 0) && /(auto|scroll|hidden)/.test(cs.overflowX + cs.overflowY)) {
    scrolls.push({ c, left: o.scrollLeft, top: o.scrollTop, w: o.scrollWidth, h: o.scrollHeight });
  }
  const oc = Array.from(o.children), cc = Array.from(c.children);   // (taken before the pseudo-elements are added, so the two lists still line up)
  pseudo(o, c);
  for (let i = 0; i < oc.length; i += 1) if (cc[i]) walk(oc[i], cc[i], scrolls);
}

export async function snapshotBlurred(src: HTMLElement, blurPx = 6): Promise<HTMLCanvasElement | null> {
  try {
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe || !('filter' in probe)) return null;   // no ctx.filter (an older Safari): keep the live blur
    const r = src.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w < 8 || h < 8) return null;
    const clone = src.cloneNode(true) as HTMLElement;
    const scrolls: Array<{ c: Element; left: number; top: number; w: number; h: number }> = [];
    // the root is the wrap itself: drawn at full strength and still (its own dim and blur are the live treatment this replaces)
    const oc = Array.from(src.children), cc = Array.from(clone.children);
    inline(src, clone);
    pseudo(src, clone);
    for (let i = 0; i < oc.length; i += 1) if (cc[i]) walk(oc[i], cc[i], scrolls);
    for (const s of scrolls) {
      // a scrolled box: its contents move up and left by what it scrolled, inside a clipped box of its own size
      const inner = document.createElement('div');
      inner.style.cssText = `position:absolute;left:0;top:0;width:${s.w}px;height:${s.h}px;transform:translate(${-s.left}px,${-s.top}px);`;
      while (s.c.firstChild) inner.appendChild(s.c.firstChild);
      s.c.appendChild(inner);
      (s.c as HTMLElement).style.overflow = 'hidden';
      if (!(s.c as HTMLElement).style.position || (s.c as HTMLElement).style.position === 'static') (s.c as HTMLElement).style.position = 'relative';
    }
    clone.style.cssText += `;opacity:1;filter:none;transition:none;animation:none;margin:0;position:relative;left:0;top:0;width:${w}px;height:${h}px;overflow:hidden;visibility:visible;`;
    const xhtml = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}">${xhtml}</foreignObject></svg>`;
    const img = new Image();
    img.decoding = 'async';
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await Promise.race([img.decode(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('snapshot timeout')), TIMEOUT_MS))]);
    // the live blur bleeds past the wrap's edge as a soft fade: pad by three radii and lay the canvas out that far beyond the wrap
    const pad = Math.ceil(blurPx * 3);
    const canvas = document.createElement('canvas');
    canvas.width = w + 2 * pad; canvas.height = h + 2 * pad;
    canvas.style.cssText = `position:absolute;display:block;left:${-pad}px;top:${-pad}px;width:${w + 2 * pad}px;height:${h + 2 * pad}px;`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    (ctx as CanvasRenderingContext2D & { filter: string }).filter = `blur(${blurPx}px)`;
    ctx.drawImage(img, pad, pad, w, h);
    return canvas;
  } catch {
    return null;
  }
}

// GLITCH v2 - THE SCREEN BAND (the flourish spec draft 2 §1.2-1.3). One band across the window for one beat. NOTHING REAL MOVES: the chrome "slips" because an overlay shifts what is behind it (an SVG
// filter used as the overlay's backdrop, so only that copy of the screen's own pixels moves: no new colour, nothing brighter than what it covers). THE PAGE IS NEVER TOUCHED: the overlay is cut to
// the left and the right of the page; across the page there are only the band's two 1 px fringe lines (cyan at its top, pale steel at its foot, both 55%).
const SVG = 'http://www.w3.org/2000/svg';

function filterFor(layer: HTMLElement, slip: number, split: number): string {
  const id = `f3-slip-${slip}-${split}`;
  if (layer.querySelector(`#${id}`)) return id;
  let svg = layer.querySelector<SVGSVGElement>('svg[data-glitch-filters]');
  if (!svg) {
    svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('data-glitch-filters', '');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    layer.appendChild(svg);
  }
  const f = document.createElementNS(SVG, 'filter');
  f.setAttribute('id', id); f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', '100%'); f.setAttribute('height', '100%'); f.setAttribute('color-interpolation-filters', 'sRGB');
  const add = (tag: string, attrs: Record<string, string>) => { const e = document.createElementNS(SVG, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); f.appendChild(e); };
  add('feOffset', { in: 'SourceGraphic', dx: String(slip), dy: '0', result: 'slipped' });
  if (split > 0) {
    // the screen's own colours, pulled apart: its red one way, its green and blue the other
    add('feColorMatrix', { in: 'slipped', type: 'matrix', values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'red' });
    add('feColorMatrix', { in: 'slipped', type: 'matrix', values: '0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0', result: 'rest' });
    add('feOffset', { in: 'red', dx: String(split), dy: '0', result: 'redOut' });
    add('feOffset', { in: 'rest', dx: String(-split), dy: '0', result: 'restOut' });
    add('feBlend', { in: 'redOut', in2: 'restOut', mode: 'screen' });
  }
  svg.appendChild(f);
  return id;
}

export interface BandSpec { top: number; height: number; slip: number; split: number; page: DOMRect | null; width: number }

/** Draws one band into the layer and returns its pieces (the caller removes them when the beat leaves). */
export function drawBand(layer: HTMLElement, { top, height, slip, split, page, width }: BandSpec): HTMLElement[] {
  const made: HTMLElement[] = [];
  const piece = (kind: string, left: number, w: number, y: number, h: number): HTMLElement | null => {
    if (w < 1 || h < 1) return null;
    const el = document.createElement('div');
    el.className = `flux3-glitch-${kind}`;
    Object.assign(el.style, { left: `${left}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    layer.appendChild(el);
    made.push(el);
    return el;
  };
  const filter = `url(#${filterFor(layer, slip, split)})`;
  const over = !!page && page.top < top + height && page.bottom > top;
  const spans: [number, number][] = over ? [[0, Math.floor(page!.left)], [Math.ceil(page!.right), width]] : [[0, width]];
  for (const [from, to] of spans) {
    const el = piece('band', from, to - from, top, height);
    if (el) { el.style.backdropFilter = filter; el.style.setProperty('-webkit-backdrop-filter', filter); }
  }
  piece('fringe-top', 0, width, top, 1);
  piece('fringe-foot', 0, width, top + height - 1, 1);
  return made;
}

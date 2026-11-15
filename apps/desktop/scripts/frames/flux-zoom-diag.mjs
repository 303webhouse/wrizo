// FLUX ZOOM, THE LINKS PROBE (Nov 14, after the Wrizors' zoom pass 1: below 1.00 the dashed links leave their cards): the SAME seed and the SAME zoom as flux-zoom1.mjs's zoom-outer (the frames job's own flow), but instead of
// trusting the shot it MEASURES where every canvas and every dashed thing is. Prints, per canvas on the page: its class and parent, its rect, its backing size, and the screen-space bounding box of the pixels it drew (alpha > 24),
// then every SVG line/path with a dash array (DOM links), then the layer's held transform.   Run as a frames screen so it shares the job's page, tone and timing:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=flux -f widths=1366 -f screens=zoom-outer-probe,zoom-050-probe -f screens_file=apps/desktop/scripts/frames/flux-zoom-probe.mjs
// (the seed and the zoom are copied from flux-zoom1.mjs verbatim: a screens file is run from the tooling checkout, so it imports nothing)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

const seed = async (app) => {
  const id = `fz1-frames-${Date.now()}`;
  const at = new Date().toISOString();
  const doc = `${id}-doc`;
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: doc, text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  const T = (bid, x, y, z, text, extra = {}) => ({ id: bid, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (bid, a, b, z) => ({ id: bid, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [
    T('f3-a', 0.05, 0.05, 1, 'Card A'), T('f3-b', 0.5, 0.05, 2, 'Card B'), T('f3-c', 0.05, 0.4, 3, 'Card C'), T('f3-d', 0.5, 0.4, 4, 'Card D'),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('f3-h', 0.75, 0.05, 8, 'The hook', { deckStep: { deck: 'three-act', step: 'hook' }, lit: true }),
    { id: 'f3-p', kind: 'page-pin', entryId: doc, x: 0.75, y: 0.75, w: 0.2, h: 0.15, z: 9 },
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12), L('f3-ad', 'f3-a', 'f3-d', 13),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1800 },
  ];
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Zoom step 1', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await sleep(500);
  await app.evalJs(`history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('[data-flux3-layer]') && !!document.querySelector('.board-box[data-box-id=\"f3-a\"]')", { label: 'the Schema', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await sleep(1500);
};
const zoomTo = async (app, s) => { await app.evalJs(`window.wrizoFluxZoomTo(${s})`); await sleep(1400); };   // the camera paints at once; the ground resumes ~0.6 s after

const PROBE = `(() => {
  const out = { canvases: [], dashed: [], layer: null };
  for (const c of document.querySelectorAll('canvas')) {
    const r = c.getBoundingClientRect(); const row = { cls: String(c.className || '').slice(0, 40), parent: (c.parentElement && (c.parentElement.getAttribute('data-flux3-layer') !== null ? 'layer-el' : String(c.parentElement.className || '').slice(0, 40))) || '', px: [c.width, c.height], rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], drawn: null };
    if (c.width && c.height && c.width * c.height < 6e6) {
      try {
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
        for (let y = 0; y < c.height; y += 1) for (let x = 0; x < c.width; x += 1) if (d[(y * c.width + x) * 4 + 3] > 24) { n += 1; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        const kx = r.width / c.width, ky = r.height / c.height;
        row.drawn = n ? { n, box: [Math.round(r.left + x0 * kx), Math.round(r.top + y0 * ky), Math.round(r.left + x1 * kx), Math.round(r.top + y1 * ky)] } : { n: 0 };
      } catch (e) { row.drawn = 'unreadable'; }
    }
    out.canvases.push(row);
  }
  for (const e of document.querySelectorAll('svg line, svg path, svg polyline, svg rect')) {
    const cs = getComputedStyle(e); if (!cs.strokeDasharray || cs.strokeDasharray === 'none') continue;
    const r = e.getBoundingClientRect(); out.dashed.push({ tag: e.tagName.toLowerCase(), cls: String(e.getAttribute('class') || '').slice(0, 40), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], dash: cs.strokeDasharray.slice(0, 20) });
  }
  const layer = document.querySelector('[data-flux3-layer]');
  out.layer = layer ? { n: document.querySelectorAll('[data-flux3-layer]').length, held: layer.firstElementChild ? layer.firstElementChild.style.transform : null, rect: (() => { const r = layer.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })() } : null;
  const cv = document.querySelector('.board-canvas'); out.canvasEl = cv ? { transform: cv.style.transform, rect: (() => { const r = cv.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })() } : null;
  return out;
})()`;

const probe = async (app, name) => {
  const m = await app.evalJs(PROBE);
  console.log(`FLUX-ZOOM-PROBE ${name} layer ${JSON.stringify(m.layer)} canvasEl ${JSON.stringify(m.canvasEl)}`);
  for (const c of m.canvases) console.log(`FLUX-ZOOM-PROBE ${name} canvas ${JSON.stringify(c)}`);
  for (const d of m.dashed.slice(0, 20)) console.log(`FLUX-ZOOM-PROBE ${name} dashed-svg ${JSON.stringify(d)}`);
  console.log(`FLUX-ZOOM-PROBE ${name} dashed-svg count ${m.dashed.length}`);
};

const css = async (app, name) => {
  const r = await app.evalJs("(() => { const cv = document.querySelector('.board-canvas'), w = document.querySelector('.board-canvas-wrap'); const g = (e) => { const c = getComputedStyle(e); return { transition: c.transition.slice(0, 120), transitionProperty: c.transitionProperty.slice(0, 80), duration: c.transitionDuration, animation: c.animationName, willChange: c.willChange, transform: c.transform }; }; const rr = (e) => { const x = e.getBoundingClientRect(); return [x.left, x.top, x.width, x.height].map((n) => Math.round(n * 10) / 10); }; return { canvas: cv ? g(cv) : null, wrap: w ? g(w) : null, rectNow: cv ? rr(cv) : null, anims: cv ? cv.getAnimations().map((a) => ({ type: a.constructor.name, prop: a.transitionProperty || a.animationName, state: a.playState })) : null }; })()");
  console.log('FLUX-ZOOM-DIAG ' + name + ' css ' + JSON.stringify(r));
  await sleep(700);
  const r2 = await app.evalJs("(() => { const cv = document.querySelector('.board-canvas'); const x = cv.getBoundingClientRect(); return [x.left, x.top, x.width, x.height].map((n) => Math.round(n * 10) / 10); })()");
  console.log('FLUX-ZOOM-DIAG ' + name + ' rect 700 ms later ' + JSON.stringify(r2));
};
const dump = async (app, name) => {
  const log = await app.evalJs('(window.__f3log || []).slice()');
  console.log('FLUX-ZOOM-DIAG ' + name + ' ' + log.length + ' events');
  for (const l of log) console.log('FLUX-ZOOM-DIAG ' + name + ' | ' + l);
};
const reduce = (app) => app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
export default {
  'zdiag-rm-outer': async (app) => { await reduce(app); await seed(app); await app.evalJs('window.__f3log = []'); await zoomTo(app, 0.0001); await dump(app, 'rm-outer'); await css(app, 'rm-outer'); await probe(app, 'rm-outer'); },
  'zdiag-on-outer': async (app) => { await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]); await seed(app); await app.evalJs('window.__f3log = []'); await zoomTo(app, 0.0001); await dump(app, 'on-outer'); await css(app, 'on-outer'); await probe(app, 'on-outer'); },
};

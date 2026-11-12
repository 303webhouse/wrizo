// FLUX ZOOM, STEP 1 - the frames the Wrizors asked for (claude/wrizors/flux-zoom-step1.md §6), for the frames job:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=flux -f widths=1366,1920 \
//      -f screens=zoom-outer,zoom-050,zoom-100,zoom-200,zoom-400,zoom-mid,zoom-reduced,zoom-stack -f screens_file=apps/desktop/scripts/frames/flux-zoom1.mjs
//   (tones default to light,dark; the capture sets the tone before each screen; 1366 and 1920 are the widths)
// The same nine-card board flux3-s1 seeds (through the app's seam, never raw storage), opened under ?flux3=1. Each screen sets the scale through the camera's own door (window.wrizoFluxZoomTo, the same clamp
// and paint as a key), waits for the camera and the ground to settle, and prints what it stood on ("FLUX-ZOOM1-FRAME <screen> {...}"): the scale, the readout, the frame's rect, the footer in shot.
//   zoom-outer   the outer limit (the whole board fills 60% of the stage's shorter side)       zoom-050 / zoom-100 / zoom-200 / zoom-400   0.50, 1.00, 2.00, 4.00
//   zoom-mid     MID-ZOOM: three Ctrl-wheel notches in, shot at once (the ground is still held, the figure is mid-climb)
//   zoom-reduced reduced motion on: Ctrl + `+` jumps (no easing) to 1.25
//   zoom-stack   zoomed in, then the Stack opened: zoom is OFF there (the scale is back to 1.00 and the readout names the Stack)
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
const centre = (app) => app.evalJs("(() => { const r = document.querySelector('.board-canvas-wrap').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
const zoomTo = async (app, s) => { await app.evalJs(`window.wrizoFluxZoomTo(${s})`); await sleep(1400); };   // the camera paints at once; the ground resumes ~0.6 s after
// scroll the frame so a card sits in its middle (a scroll is a pan, as today), then wait for the ground to settle
const reveal = async (app, id) => { await app.evalJs(`(() => { const wrap = document.querySelector('.board-canvas-wrap'), e = document.querySelector('.board-box[data-box-id="${id}"]'); if (!wrap || !e) return; const r = e.getBoundingClientRect(), w = wrap.getBoundingClientRect(); wrap.scrollLeft += (r.left + r.width / 2) - (w.left + wrap.clientWidth / 2); wrap.scrollTop += (r.top + r.height / 2) - (w.top + wrap.clientHeight / 2); })()`); await sleep(1500); };
const stood = (app, screen) => app.evalJs(`(() => {
  const cv = document.querySelector('.board-canvas'), wrap = document.querySelector('.board-canvas-wrap');
  const cr = cv && cv.getBoundingClientRect(), wr = wrap && wrap.getBoundingClientRect();
  const tele = [...document.querySelectorAll('.flux3-tele > span')].map((s) => s.textContent.trim());
  return { screen: ${JSON.stringify(screen)}, flag: document.documentElement.hasAttribute('data-flux3'), page: document.documentElement.getAttribute('data-page'),
    scale: cr && cv.offsetWidth ? +(cr.width / cv.offsetWidth).toFixed(4) : null, zoomed: cv && cv.getAttribute('data-f3-zoomed'), frame: wr && { l: Math.round(wr.left), t: Math.round(wr.top), w: Math.round(wr.width), h: Math.round(wr.height) }, tele };
})()`).then((s) => console.log('FLUX-ZOOM1-FRAME ' + JSON.stringify(s)));

export default {
  'zoom-outer': async (app) => { await seed(app); await zoomTo(app, 0.0001); await stood(app, 'zoom-outer'); },
  'zoom-050': async (app) => { await seed(app); await zoomTo(app, 0.5); await stood(app, 'zoom-050'); },
  'zoom-100': async (app) => { await seed(app); await stood(app, 'zoom-100'); },
  'zoom-200': async (app) => { await seed(app); await zoomTo(app, 2); await reveal(app, 'f3-d'); await stood(app, 'zoom-200'); },
  'zoom-400': async (app) => { await seed(app); await zoomTo(app, 4); await reveal(app, 'f3-d'); await stood(app, 'zoom-400'); },
  'zoom-mid': async (app) => {
    await seed(app);
    const c = await centre(app);
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y, pointerType: 'mouse', buttons: 0 });
    for (let i = 0; i < 3; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: c.x, y: c.y, deltaX: 0, deltaY: -120, modifiers: 2 }); await sleep(30); }
    await stood(app, 'zoom-mid');   // shot at once: the ground is still held, the figure is mid-climb
  },
  'zoom-reduced': async (app) => {
    await seed(app);
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: '=', code: 'Equal', windowsVirtualKeyCode: 187, nativeVirtualKeyCode: 187, modifiers: 2 });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: '=', code: 'Equal', windowsVirtualKeyCode: 187, nativeVirtualKeyCode: 187, modifiers: 2 });
    await sleep(1400);
    await stood(app, 'zoom-reduced');
  },
  'zoom-stack': async (app) => {
    await seed(app);
    await zoomTo(app, 2);
    await app.evalJs("(() => { const b = document.querySelector('[data-flux3-stack-tab]'); if (b) b.click(); })()");
    await sleep(1500);
    await stood(app, 'zoom-stack');
  },
};

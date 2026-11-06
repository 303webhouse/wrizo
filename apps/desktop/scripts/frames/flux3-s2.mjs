// FLUX3 S2 - THE STACK, THE HOLOGRAM AND SEQUENCE as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/
// flux3-s2.mjs -f screens=schema-stack,schema-hologram,schema-sequence). The same board flux3-s2.mjs seeds (through the app's seam, never raw
// storage), opened under ?flux3=1. schema-stack: the Stack open, two nodes along. schema-hologram: its centre opened as the hologram.
// schema-sequence: the board's Sequence view in Flux's dress. Each screen prints what it stood on ("FLUX3-S2-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

const seed = async (app) => {
  const id = `f3s2-frames-${Date.now()}`;
  const at = new Date().toISOString();
  const doc = `${id}-doc`;
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: doc, text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  const T = (bid, x, y, z, text, extra = {}) => ({ id: bid, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (bid, a, b, z) => ({ id: bid, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [
    T('f3-a', 0.05, 0.05, 1, 'Card A', { laneId: 'act1', seq: 2 }), T('f3-b', 0.5, 0.05, 2, 'Card B', { laneId: 'act1', seq: 1 }),
    T('f3-c', 0.05, 0.4, 3, 'Card C', { laneId: 'act2', seq: 1 }), T('f3-d', 0.5, 0.4, 4, 'Card D', { laneId: 'act2', seq: 2 }),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('f3-h', 0.75, 0.05, 8, 'The hook', { deckStep: { deck: 'three-act', step: 'hook' }, lit: true, laneId: 'act1', seq: 3 }),
    { id: 'f3-p', kind: 'page-pin', entryId: doc, x: 0.75, y: 0.75, w: 0.2, h: 0.15, z: 9 },
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12),
    { id: `${id}-meta`, kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, lanes: [{ id: 'act1', title: 'Act I' }, { id: 'act2', title: 'Act II' }] },
  ];
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Schema S2', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await sleep(500);
  await app.evalJs(`history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('[data-flux3-stack-tab]') && !!document.querySelector('.board-box[data-box-id=\"f3-a\"]')", { label: 'the Schema', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await sleep(1200);
};
const point = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const click = async (app, p) => {
  await app.mouseMove(p.x, p.y);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
  await app.mouseMove(8, 8);
};
const stack = async (app) => {
  const p = await point(app, '[data-flux3-stack-tab]');
  if (p) await click(app, p);
  await sleep(1500);
  for (let i = 0; i < 2; i += 1) { await app.key('ArrowRight'); await sleep(450); }
  await sleep(900);
};
const stood = (app) => app.evalJs("({ flag: document.documentElement.hasAttribute('data-flux3'), theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), stack: (document.querySelector('.board-canvas-wrap')?.parentElement || {}).dataset?.flux3Stack || null, centre: document.querySelector('.board-box[data-flux3-stack=\"centre\"]')?.dataset.boxId || null, sequence: !!document.querySelector('.board-storyboard'), level: document.querySelector('.flux3-tele-lvl')?.textContent || null })");

export default {
  'schema-stack': async (app) => {
    await seed(app);
    await stack(app);
    console.log(`FLUX3-S2-FRAME schema-stack ${JSON.stringify(await stood(app))}`);
  },
  'schema-hologram': async (app) => {
    await seed(app);
    await stack(app);
    const c = await point(app, '.board-box[data-flux3-stack="centre"]');
    if (c) await click(app, c);
    await sleep(1400);
    console.log(`FLUX3-S2-FRAME schema-hologram ${JSON.stringify(await stood(app))}`);
  },
  'schema-sequence': async (app) => {
    await seed(app);
    const p = await point(app, '.show-as [data-view="storyboard"]');
    if (p) await click(app, p);
    await waitSoft(app, "!!document.querySelector('.board-storyboard .board-sb-card')", { label: 'Sequence', timeout: 6000 });
    await sleep(900);
    console.log(`FLUX3-S2-FRAME schema-sequence ${JSON.stringify(await stood(app))}`);
  },
};

// FLUX3 S1 - THE SCHEMA LIVE VIEW as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/flux3-s1.mjs
// -f screens=schema-rest,schema-selected). The same board flux3-s1.mjs seeds (through the app's seam, never raw storage), opened under ?flux3=1.
// schema-rest: nothing selected (the links' moving dashes, the ground). schema-selected: card A selected (its links hot, their electrons), card B
// typed into once (the LAST-touched node's orange bar and the LAST readout). Each screen prints what it stood on ("FLUX3-S1-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

const seed = async (app) => {
  const id = `f3s1-frames-${Date.now()}`;
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
  ];
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Schema S1', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await sleep(500);
  await app.evalJs(`history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('[data-flux3-layer]') && !!document.querySelector('.board-box[data-box-id=\"f3-a\"]')", { label: 'the Schema', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await sleep(1500);
};
const cardPoint = (app, bid, fx, fy) => app.evalJs(`(() => { const e = document.querySelector('.board-box[data-box-id="${bid}"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width * ${fx}), y: Math.round(r.top + r.height * ${fy}) }; })()`);
const click = async (app, p) => {
  await app.mouseMove(p.x, p.y);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
};
const stood = (app) => app.evalJs("({ flag: document.documentElement.hasAttribute('data-flux3'), theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), layers: document.querySelectorAll('[data-flux3-layer]').length, records: document.querySelectorAll('.flux3-node').length, tele: document.querySelector('.flux3-tele')?.textContent || null })");

export default {
  'schema-rest': async (app) => {
    await seed(app);
    console.log(`FLUX3-S1-FRAME schema-rest ${JSON.stringify(await stood(app))}`);
  },
  'schema-selected': async (app) => {
    await seed(app);
    const b = await cardPoint(app, 'f3-b', 0.5, 0.4);
    if (b) {
      await app.doubleClick(b.x, b.y);
      await waitSoft(app, "!!document.querySelector('.board-popup-editor')", { label: 'card editor', timeout: 4000 });
      await app.evalJs("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
      await app.typeKeys(' touched');
      await sleep(300);
      await click(app, { x: 20, y: 300 });
      await sleep(700);
    }
    const a = await cardPoint(app, 'f3-a', 0.3, 0.3);
    if (a) await click(app, a);
    await sleep(2200);   // the layer settles (600 ms after the release) and runs a while
    console.log(`FLUX3-S1-FRAME schema-selected ${JSON.stringify(await stood(app))}`);
  },
};

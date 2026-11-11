// BUG #57 - the live board links, for Nick (both Page tones): a board with two cards and the link between them, in connection mode, RESTING and SELECTED.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=bug57-live-board-links -f themes=flux -f screens=link-resting,link-selected -f widths=1366 \
//      -f screens_file=apps/desktop/scripts/frames/bug57-links.mjs      (tones default to light,dark; the capture sets the tone before each screen)
// The frame tool puts the Flux theme and the Page tone in place; the page is made through the app's own seam.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const dbl = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y, { clickCount: 1 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 1 }); await sleep(60); await mouse(app, 'mousePressed', x, y, { clickCount: 2 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 2 }); await sleep(250); };
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);

const board = async (app) => {
  const id = `b57-frames-${Date.now()}`;
  const boxes = [
    { id: 'b-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.12, z: 1, text: 'Card A' },
    { id: 'b-c', kind: 'text', x: 0.05, y: 0.45, w: 0.2, h: 0.12, z: 3, text: 'Card C' },
    { id: 'b-ac', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 5, connA: 'b-a', connB: 'b-c' },
  ];
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'B57 board', pageType: 'board', boxes, createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.board-canvas [data-box-id=\"b-a\"]')", { label: 'board', timeout: 15000 });
  await sleep(900);
  const a = await R(app, '[data-box-id="b-a"]');
  await click(app, Math.round(a.l + a.w * 0.3), Math.round(a.t + a.h * 0.3)); await sleep(700);
  const h = await R(app, '[data-box-id="b-a"] .board-handle');
  await dbl(app, Math.round(h.l + h.w / 2), Math.round(h.t + h.h / 2));
  await sleep(400);
};
const selectLine = async (app) => {
  const line = await app.evalJs(`(() => { const hit = document.querySelector('.board-connection-hit'); if (!hit) return null; const c = document.querySelector('.board-canvas').getBoundingClientRect(); return { x: Math.round((+hit.getAttribute('x1') + +hit.getAttribute('x2')) / 2 + c.left), y: Math.round((+hit.getAttribute('y1') + +hit.getAttribute('y2')) / 2 + c.top) }; })()`);
  if (line) { await click(app, line.x, line.y); await sleep(500); await app.mouseMove(8, 8); await sleep(300); }
  return line;
};

export default {
  'link-resting': async (app) => {
    await board(app);
    console.log('BUG57-FRAME link-resting ' + JSON.stringify(await app.evalJs("(() => { const l = document.querySelector('.board-connection-line'); return l ? { stroke: getComputedStyle(l).stroke, sw: getComputedStyle(l).strokeWidth, sel: l.getAttribute('data-selected') } : null; })()")));
  },
  'link-selected': async (app) => {
    await board(app);
    await selectLine(app);
    console.log('BUG57-FRAME link-selected ' + JSON.stringify(await app.evalJs("(() => { const l = document.querySelector('.board-connection-line'); return l ? { stroke: getComputedStyle(l).stroke, sw: getComputedStyle(l).strokeWidth, sel: l.getAttribute('data-selected') } : null; })()")));
  },
};

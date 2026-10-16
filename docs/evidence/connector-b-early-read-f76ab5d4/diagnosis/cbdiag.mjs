// connector-b.mjs crash diagnosis (this desk): its fixture (a board with cb-a, cb-b and a pin card), then the select-click it makes (30% / 30% of cb-a), then what is on the page.
// WT names the worktree. Prints CBDIAG lines; asserts nothing.
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
const state = (app, label) => app.evalJs(`(() => { const c = document.querySelector('[data-box-id="cb-a"]');
  return { label: ${JSON.stringify(label)}, card: !!c, cardClass: c ? String(c.className).slice(0, 90) : null, handlesInDoc: document.querySelectorAll('.board-handle').length, handlesInCard: c ? c.querySelectorAll('.board-handle').length : null,
    selectedBoxes: [...document.querySelectorAll('.board-canvas [data-box-id]')].filter((e) => e.matches('[data-selected="true"], .selected, .is-selected')).map((e) => e.getAttribute('data-box-id')),
    handleParents: [...document.querySelectorAll('.board-handle')].map((h) => String((h.closest('[data-box-id]') || {}).getAttribute ? h.closest('[data-box-id]').getAttribute('data-box-id') : null)),
    sliverOpen: !!document.querySelector('.wz-sliver[data-open="true"]'), tutorOpen: !!document.querySelector('.wz-tutor-panel[data-open="true"]'), hash: location.hash }; })()`);
await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  const now = () => new Date().toISOString();
  const boxes = [{ id: 'cb-a', kind: 'text', x: 0.05, y: 0.06, w: 0.2, h: 0.12, z: 1, text: 'Card A' }, { id: 'cb-b', kind: 'text', x: 0.5, y: 0.06, w: 0.2, h: 0.12, z: 2, text: 'Card B' }];
  const id = 'cbd-board', nest = 'cbd-nest';
  for (const row of [{ id, text: 'Link board', pageType: 'board', boxes, createdAt: now(), origin: null, source: null }, { id: nest, text: 'Nested board', pageType: 'board', boxes: [], createdAt: now(), origin: null, source: null }]) await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(nest)}, ${JSON.stringify(id)}, { display: true })`);
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"cb-a\"]')", { label: 'the board', timeout: 9000 });
  await sleep(800);
  if (process.env.OPENDRAWERS === '1') { await app.evalJs("document.querySelector('.wz-strip-item[data-category=drawers]')?.click()"); await sleep(600); }
  console.log('CBDIAG ' + JSON.stringify({ there, openDrawers: process.env.OPENDRAWERS === '1', panelRect: await R(app, '.wz-drawers-panel, .wz-cascade-panel, .wz-sliver-panel'), ...(await state(app, 'before the select click')) }));
  const r = await R(app, '[data-box-id="cb-a"]');
  const x = Math.round(r.l + r.w * 0.3), y = Math.round(r.t + r.h * 0.3);
  await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); await sleep(700);
  console.log('CBDIAG ' + JSON.stringify({ click: { x, y }, rect: r, ...(await state(app, 'after the select click (700 ms)')) }));
  await sleep(1500);
  console.log('CBDIAG ' + JSON.stringify(await state(app, 'after another 1.5 s')));
  const top = await app.evalJs(`(() => { const e = document.elementFromPoint(${x}, ${y}); return e ? { tag: e.tagName, cls: String(e.className).slice(0, 80), box: (e.closest('[data-box-id]') || {}).getAttribute ? e.closest('[data-box-id]').getAttribute('data-box-id') : null } : null; })()`);
  console.log('CBDIAG ' + JSON.stringify({ topmostAtClick: top }));
});

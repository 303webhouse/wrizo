// FLUX3 S4b L2 - THE COMMAND-BOX RAIL as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/flux3-s4b-l2.mjs
// -f screens=rail-journal,rail-drawer,rail-last). Both tones come from the job (-f tones=light,dark). Pages are made through the app's seams, never raw storage.
//   rail-journal: a Page room in the Journal (3 pages, 2 boards): the Journal pin is your place (orange), the door above it is the switcher's rack glyph, ONE Log
//   rail-drawer:  a Page room inside a Drawer's set (2 pages, 1 board): the place block's name is your place (orange); the Journal pin reads the Journal's own count
//   rail-last:    a Schema room after one card is moved: Circuits shows LAST 0x.... in orange
// Each screen prints what it stood on ("FLUX3-S4B-L2-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
let seq = 0;
const mkPage = (app, id, text, extra = {}) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date(Date.now() + (seq += 1)).toISOString(), origin: 'loose', source: 'page', ...extra })})`);
const mkBoard = (app, id, extra = {}) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: `Board ${id}`, pageType: 'board', boxes: [{ id: `${id}-b1`, kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Card A' }, { id: `${id}-b2`, kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.1, z: 2, text: 'Card B' }], createdAt: new Date(Date.now() + (seq += 1)).toISOString(), origin: null, source: null, ...extra })})`);
const openRoom = async (app, id) => {
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');");
  await sleep(300);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor') || !!document.querySelector('.board-canvas-wrap')", { label: 'the room', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.mouseMove(8, 8);
  await sleep(2000);
};
const stood = (app) => app.evalJs("(() => { const s = document.querySelector('.wz-strip'); const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }; return { flag: document.documentElement.hasAttribute('data-flux3'), page: document.documentElement.getAttribute('data-page'), items: s ? [...s.querySelectorAll('.wz-strip-item')].map((b) => [b.getAttribute('data-category'), (b.querySelector('.wz-strip-label') || {}).textContent, (b.querySelector('.wz-strip-readout') || {}).textContent, (b.querySelector('.wz-strip-last') || {}).textContent, (b.querySelector('[data-theme-icon]') || { getAttribute: () => null }).getAttribute('data-theme-icon')]) : null, strip: r('.wz-strip'), pageRect: r('.mode-page') }; })()");

export default {
  'rail-journal': async (app) => {
    await mkPage(app, 'l2f-p1', 'The first page of the Journal.\nA second line of her text.'); await mkPage(app, 'l2f-p2', 'Another page.'); await mkPage(app, 'l2f-p3', 'And a third.');
    await mkBoard(app, 'l2f-b1'); await mkBoard(app, 'l2f-b2');
    await sleep(500);
    await openRoom(app, 'l2f-p1');
    console.log(`FLUX3-S4B-L2-FRAME rail-journal ${JSON.stringify(await stood(app))}`);
  },
  'rail-drawer': async (app) => {
    await mkPage(app, 'l2f-j1', 'A page in the Journal.'); await mkPage(app, 'l2f-j2', 'Another Journal page.'); await mkPage(app, 'l2f-j3', 'A third.');
    const d = await app.evalJs("window.wrizoCreateDrawer('Cartridge')");
    const s = d ? await app.evalJs(`window.wrizoCreateBinder('Set A', 'book', ${JSON.stringify(d.id)})`) : null;
    if (s) { await mkPage(app, 'l2f-d1', 'A page in the drawer.\nA second line.', { projectId: s.id, origin: null }); await mkPage(app, 'l2f-d2', 'Another page in the drawer.', { projectId: s.id, origin: null }); await mkBoard(app, 'l2f-db1', { projectId: s.id }); }
    await sleep(500);
    await openRoom(app, 'l2f-d1');
    console.log(`FLUX3-S4B-L2-FRAME rail-drawer ${JSON.stringify(await stood(app))}`);
  },
  'rail-last': async (app) => {
    await mkPage(app, 'l2f-lp1', 'A page.'); await mkBoard(app, 'l2f-lb1');
    await sleep(500);
    await openRoom(app, 'l2f-lb1');
    const c = await app.evalJs("(() => { const e = document.querySelector('.flux3-node'); if (!e) return null; const r = e.parentElement.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    if (c) {
      const mouse = (type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
      await app.mouseMove(c.x, c.y); await mouse('mousePressed', c.x, c.y);
      for (let i = 1; i <= 8; i += 1) { await app.mouseMove(c.x + i * 8, c.y + i * 4); await sleep(30); }
      await mouse('mouseReleased', c.x + 64, c.y + 32);
      await app.mouseMove(8, 8);
      await sleep(1200);
    }
    console.log(`FLUX3-S4B-L2-FRAME rail-last ${JSON.stringify(await stood(app))}`);
  },
};

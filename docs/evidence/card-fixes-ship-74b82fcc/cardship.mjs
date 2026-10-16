// CARD FIXES, LIVE (this desk's capture script, run against PRODUCTION with WS_TARGET_URL): per theme (Arbor = plateau, Flux):
//  R-a the card selected with its resize handle           R-b after a REAL resize of the corner (grows)
//  R-c after an IMMEDIATE second resize (the second press carries clickCount 2, as hardware does) - it must grow again, no popup
//  X-a the card pop-up OPEN, its X in the header's corner  X-b after a REAL click on the X (pop-up gone)
//  X-c the pop-up open again, then a REAL click at the CENTRE OF THE RAIL (the old hole) - the pop-up closes
// Anonymous throwaway profile; no sign-in surface is shot, so no field can carry an autofilled address.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/cf-ship/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const CARD = '[data-box-id="crr-card"]';
const CE = '.board-popup-editor';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const handleAt = (app) => app.evalJs(`(() => { const h = document.querySelector('${CARD} .board-handle'); if (!h) return null;
  const r = h.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const dragCorner = async (app, dx, dy, clickCount = 1) => {
  const p = await handleAt(app);
  if (!p) return false;
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  for (let i = 1; i <= 5; i += 1) { await mouse(app, 'mouseMoved', p.x + (dx * i) / 5, p.y + (dy * i) / 5, 0, 1); await sleep(16); }
  await mouse(app, 'mouseReleased', p.x + dx, p.y + dy, clickCount, 0);
  return true;
};
const facts = (app) => app.evalJs(`(() => {
  const card = document.querySelector('${CARD}'); const cr = card ? card.getBoundingClientRect() : null;
  const ed = document.querySelector('${CE}');
  const x = [...document.querySelectorAll('button')].find((b) => /close/i.test(b.getAttribute('aria-label') || '') && !/keep dock/i.test(b.textContent));
  const xr = x ? x.getBoundingClientRect() : null; const bd = document.querySelector('.board-popup-backdrop');
  const sl = getSelection(); const cv = document.querySelector('.board-canvas');
  return { hash: location.hash, theme: document.documentElement.getAttribute('data-theme'), origin: location.origin,
    bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''),
    splashPresent: !!document.querySelector('.wz-splash'),
    cardWidth: cr ? Math.round(cr.width) : null, cardHeight: cr ? Math.round(cr.height) : null, handle: !!(card && card.querySelector('.board-handle')),
    popupOpen: !!ed,
    closeButton: x ? { ariaLabel: x.getAttribute('aria-label'), title: x.getAttribute('title'), text: x.textContent.trim(), rect: [Math.round(xr.left), Math.round(xr.top), Math.round(xr.width), Math.round(xr.height)] } : null,
    textButtonClose: [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Close').length,
    backdrop: bd ? { parentIsBody: bd.parentElement === document.body, position: getComputedStyle(bd).position, zIndex: getComputedStyle(bd).zIndex } : null,
    selectionInBoard: !!sl && sl.rangeCount > 0 && !sl.isCollapsed && !!cv && cv.contains(sl.anchorNode) };
})()`);
const shot = async (app, name, extra = {}) => {
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  const row = { frame: name, file: `${name}.png`, ...(await facts(app)), ...extra }; rows.push(row); console.log(JSON.stringify(row));
  return row;
};
const openCard = async (app) => {
  await app.evalJs(`(() => { const el = document.querySelector('${CARD}'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()`);
  await app.waitFor(`!!document.querySelector('${CE}')`, { label: 'card popup' }); await sleep(700);
};

await withHarness(async (app) => {
  for (const [id, theme] of [['arbor', 'plateau'], ['flux', 'flux']]) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme','${theme}'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'crr-board', text: 'Card fixes live', pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(),
      boxes: [{ id: 'crr-card', kind: 'text', x: 0.1, y: 0.08, w: 0.22, h: 0.14, z: 1, text: 'A card to resize, then open with the X.' }, { id: 'crr-other', kind: 'text', x: 0.58, y: 0.5, w: 0.2, h: 0.12, z: 2, text: 'A second card.' }] })})`);
    await sleep(400); await app.reload();
    await app.evalJs("location.hash = '#/page/crr-board'");
    await app.waitFor(`!!document.querySelector('${CARD}')`, { label: 'the card' }); await sleep(900);
    // select it with a real click on its body (the handle shows on the selected card)
    const c = await app.evalJs(`(() => { const r = document.querySelector('${CARD}').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    await mouse(app, 'mousePressed', c.x, c.y, 1, 1); await mouse(app, 'mouseReleased', c.x, c.y, 1, 0);
    await sleep(700);
    const a = await shot(app, `${id}-Ra-card-selected-with-handle`);
    await dragCorner(app, 60, 30, 1); await sleep(250);
    const b = await shot(app, `${id}-Rb-after-first-resize`, { widthBefore: a.cardWidth });
    await dragCorner(app, 60, 30, 2); await sleep(500);
    await shot(app, `${id}-Rc-after-immediate-second-resize`, { widthBeforeSecond: b.cardWidth, firstGrew: b.cardWidth > a.cardWidth + 20 });
    // the pop-up: open, X, click the X, open again, click the rail's centre
    await openCard(app);
    await shot(app, `${id}-Xa-popup-open-with-X`);
    const pt = await app.evalJs(`(() => { const x = [...document.querySelectorAll('button')].find((b) => /close/i.test(b.getAttribute('aria-label') || '') && !/keep dock/i.test(b.textContent)); if (!x) return null; const r = x.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (pt) { await app.mouseMove(pt.x, pt.y); await sleep(150); await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); }
    await sleep(700);
    await shot(app, `${id}-Xb-after-click-on-X`, { clickedAt: pt });
    await openCard(app);
    await app.mouseMove(42, 502); await sleep(150); await app.mouseDown(42, 502); await app.mouseUp(42, 502);
    await sleep(700);
    await shot(app, `${id}-Xc-after-click-at-rail-centre`, { clickedAt: { x: 42, y: 502 } });
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`CARD SHIP FRAMES: ${rows.length} frames -> ${OUT}`);

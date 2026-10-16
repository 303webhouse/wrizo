// CARD SELECTED, NO POP-UP (this desk's capture script) from the ship tree's own dist-web: per theme (Arbor = plateau, Flux):
//  S0 the board with nothing selected         S1 a TEXT card selected by a real click, no pop-up         S2 a PAGE-PIN card selected, no pop-up
// Facts per frame: the canvas's top edge (must not move on selection), whether a pop-up is open, the interim action row (present? inside the canvas wrap?),
// the card's class, the header strip's rect. An anonymous throwaway profile; seeded through the app's own seam (wrizoCreateJournalPage).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/bc-ship3/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const facts = (app, sel) => app.evalJs(`(() => {
  const cv = document.querySelector('.board-canvas'); const wrap = document.querySelector('.board-canvas-wrap');
  const card = ${sel ? `document.querySelector('${sel}')` : 'null'};
  const row = document.querySelector('.board-action-row'); const rr = row ? row.getBoundingClientRect() : null; const wr = wrap ? wrap.getBoundingClientRect() : null;
  const strip = document.querySelector('.crumb-here, .crumb'); const sr = strip ? strip.closest('header, .desk-strip, .wz-strip, nav') : null;
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  return { hash: location.hash, theme: document.documentElement.getAttribute('data-theme'), origin: location.origin,
    bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''),
    splashPresent: !!document.querySelector('.wz-splash'),
    canvasTop: cv ? Math.round(cv.getBoundingClientRect().top * 10) / 10 : null, canvasRect: r(cv),
    popupOpen: !!document.querySelector('.board-popup, .board-popup-editor'),
    cardRect: r(card), cardSelected: !!card && (card.classList.contains('selected') || card.getAttribute('aria-selected') === 'true' || !!card.querySelector('.board-handle')),
    removeRowText: [...document.querySelectorAll('button')].filter((b) => /^remove$/i.test(b.textContent.trim())).length,
    actionRow: row ? { text: row.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60), rect: r(row), insideWrap: !!wr && rr.left >= wr.left && rr.right <= wr.right && rr.top >= wr.top && rr.bottom <= wr.bottom } : null,
    titleRect: r(document.querySelector('.crumb-rename-btn, .crumb-here')) };
})()`);
const shot = async (app, name, sel, extra = {}) => {
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  const row = { frame: name, file: `${name}.png`, ...(await facts(app, sel)), ...extra }; rows.push(row); console.log(JSON.stringify(row)); return row;
};
const clickCentre = async (app, sel) => {
  const c = await app.evalJs(`(() => { const el = document.querySelector('${sel}'); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  if (!c) return null;
  await mouse(app, 'mouseMoved', c.x, c.y, 0, 0); await sleep(120);
  await mouse(app, 'mousePressed', c.x, c.y, 1, 1); await mouse(app, 'mouseReleased', c.x, c.y, 1, 0);
  await sleep(900);
  return c;
};
const clickEmpty = async (app) => {   // a real click on empty canvas (deselects; with a card selected the first empty click only deselects)
  await mouse(app, 'mouseMoved', 900, 700, 0, 0); await sleep(100);
  await mouse(app, 'mousePressed', 900, 700, 1, 1); await mouse(app, 'mouseReleased', 900, 700, 1, 0); await sleep(700);
};

await withHarness(async (app) => {
  for (const [id, theme] of [['arbor', 'plateau'], ['flux', 'flux']]) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme','${theme}'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'cs-target', text: 'A page pinned to the board. It has a few words.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'cs-board', text: 'Selected card board', pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(),
      boxes: [{ id: 'cs-text', kind: 'text', x: 0.08, y: 0.1, w: 0.26, h: 0.16, z: 1, text: 'A text card, selected with a click and no pop-up.' },
              { id: 'cs-pin', kind: 'page-pin', x: 0.5, y: 0.18, w: 0.24, h: 0.12, z: 2, entryId: 'cs-target' }] })})`);
    await sleep(500); await app.reload();
    await app.evalJs("location.hash = '#/page/cs-board'");
    await app.waitFor("!!document.querySelector('[data-box-id=\"cs-text\"]')", { label: 'board cards' }); await sleep(900);
    const s0 = await shot(app, `${id}-S0-nothing-selected`, null);
    await clickCentre(app, '[data-box-id="cs-text"]');
    await shot(app, `${id}-S1-text-card-selected-no-popup`, '[data-box-id="cs-text"]', { canvasTopBefore: s0.canvasTop });
    await clickEmpty(app);
    await clickCentre(app, '[data-box-id="cs-pin"]');
    await shot(app, `${id}-S2-page-pin-card-selected-no-popup`, '[data-box-id="cs-pin"]', { canvasTopBefore: s0.canvasTop });
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`CARD-SELECTED FRAMES: ${rows.length} frames -> ${OUT}`);

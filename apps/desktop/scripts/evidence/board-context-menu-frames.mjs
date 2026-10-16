// BOARD CONTEXT MENU - THE FRAMES (Fable, Oct 15), for Nick: each menu, the dialog, the Trash showing a deleted card, and the restored card back on its board. Arbor and Flux, dark and light page tone.
//   01 a plain card's menu (Delete)          02 a grouped card's menu (Ungroup, separator, Delete)          03 the empty-board menu (New Card, Delete board)
//   04 a board tile's menu in the Drawers panel (Delete board)          05 the "Send to Trash?" dialog          06 the Trash board showing the deleted card
//   07 the Trash card's menu (Restore, separator, Delete)          08 the restored card back on its board
// Evidence, not a check: scripts/evidence/ (run-suite runs every file in scripts/harness/, and this writes PNGs into the tracked tree). Run by hand.
// "Light" for Arbor: `data-page` paints only under Flux, so Arbor's light frames may be byte-identical to their dark ones - every light frame is compared to its dark twin by MD5 and the row says so.
// Run: node scripts/evidence/board-context-menu-frames.mjs   (from apps/desktop, dist-web built, box turn granted)     FRAMES_ONLY=<combo> for one
// Output: docs/evidence/board-context-menu/<combo>/<frame>.png plus frames.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', '..', 'docs', 'evidence', 'board-context-menu');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOARD = 'bcmf-board';
const COMBOS = [
  { id: 'arbor-dark', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'arbor-light', theme: 'plateau', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
].filter((t) => !process.env.FRAMES_ONLY || process.env.FRAMES_ONLY === t.id);
const rows = []; const hashes = new Map();
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const BOXES = [
  { id: 'bcmf-a', kind: 'text', x: 0.05, y: 0.06, w: 0.22, h: 0.13, z: 1, text: 'The harbour scene\nWhere Mara first sees the ship.' },
  { id: 'bcmf-b', kind: 'text', x: 0.5, y: 0.06, w: 0.22, h: 0.13, z: 2, text: 'The letter\nWhat the captain left unsaid.' },
  { id: 'bcmf-g1', kind: 'text', x: 0.05, y: 0.34, w: 0.22, h: 0.13, z: 3, text: 'Mara\nHer reasons for staying.', groupId: 'bcmf-grp' },
  { id: 'bcmf-g2', kind: 'text', x: 0.3, y: 0.34, w: 0.22, h: 0.13, z: 4, text: 'The storm\nTurning point.', groupId: 'bcmf-grp' },
  { id: 'bcmf-ab', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 5, connA: 'bcmf-a', connB: 'bcmf-b' },
];

const freshBoard = async (app, combo) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(combo.prefs))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)});
    localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Harbour board', pageType: 'board', boxes: BOXES, createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${BOARD}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"bcmf-a\"]')", { label: 'the board', timeout: 9000 });
  await sleep(1000);
  return there;
};
const pointIn = (app, sel, fx = 0.3, fy = 0.3) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width * ${fx}), y: Math.round(r.top + r.height * ${fy}) }; })()`);
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const rightClick = async (app, x, y) => {
  await app.mouseMove(x, y);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'right', buttons: 2, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'right', buttons: 0, clickCount: 1, pointerType: 'mouse' });
  await sleep(350);
};
const pick = (app, label) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-ctx-item')].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); if (!b) return false; b.click(); return true; })()`);
const state = (app) => app.evalJs(`(() => ({ menu: (() => { const m = document.querySelector('.wz-ctx'); return m ? [...m.children].map((c) => (c.classList.contains('wz-ctx-sep') ? '---' : c.textContent.trim())) : null; })(),
  dialog: document.querySelector('.wz-delete-title')?.textContent || null, attrs: { theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page') } }))()`);
const shot = async (app, combo, name) => {
  const dir = join(OUT, combo.id); mkdirSync(dir, { recursive: true });
  let file = `${name}.png`; let md5 = null;
  try { const buf = Buffer.from(await app.screenshot(), 'base64'); writeFileSync(join(dir, file), buf); md5 = createHash('md5').update(buf).digest('hex'); } catch (e) { file = `SHOT-FAILED ${e.message}`; }
  hashes.set(`${combo.id}/${name}`, md5);
  const twin = combo.id.endsWith('-light') ? combo.id.replace('-light', '-dark') : null;
  rows.push({ combo: combo.id, frame: name, file: `${combo.id}/${file}`, md5, sameAsDarkTwin: twin ? hashes.get(`${twin}/${name}`) === md5 : null, ...(await state(app)) });
};

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    if (!(await freshBoard(app, combo))) { rows.push({ combo: combo.id, frame: 'FIXTURE', error: 'the board did not open' }); continue; }
    // 01 / 02 / 03 - the three menus on the board
    const pa = await pointIn(app, '[data-box-id="bcmf-a"]');
    await rightClick(app, pa.x, pa.y); await shot(app, combo, '01-card-menu'); await app.key('Escape'); await sleep(250);
    const pg = await pointIn(app, '[data-box-id="bcmf-g1"]');
    await rightClick(app, pg.x, pg.y); await shot(app, combo, '02-grouped-card-menu'); await app.key('Escape'); await sleep(250);
    const ep = await app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
      for (let y = r.top + 330; y < Math.min(r.bottom, innerHeight - 140); y += 25) for (let x = r.left + 40; x < r.right - 160; x += 25) if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) };
      return null; })()`);
    if (ep) { await rightClick(app, ep.x, ep.y); await shot(app, combo, '03-board-menu'); await app.key('Escape'); await sleep(250); }
    // 04 - a board tile in Drawers
    await app.evalJs("document.querySelector('.wz-strip-item[data-category=drawers]')?.click()"); await sleep(600);
    const tile = await app.evalJs(`(() => { const t = [...document.querySelectorAll('.wz-drawers-tile')].find((b) => b.textContent.includes('Harbour board')); if (!t) return null; const r = t.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (tile) { await rightClick(app, tile.x, tile.y); await shot(app, combo, '04-drawers-board-menu'); await app.key('Escape'); await sleep(250); }
    await app.evalJs("document.querySelector('.wz-strip-item[data-category=drawers]')?.click()"); await sleep(400);
    // 05 - the dialog (delete the first card)
    await rightClick(app, pa.x, pa.y); await pick(app, 'Delete'); await sleep(450);
    await shot(app, combo, '05-send-to-trash-dialog');
    await app.evalJs("document.querySelector('.wz-delete-go')?.click()"); await sleep(600);
    // 06 / 07 - the Trash
    await app.evalJs('window.wrizoFlushNow()');
    await app.goto('/trash');
    await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'the Trash board', timeout: 9000 }); await sleep(800);
    await shot(app, combo, '06-trash-shows-the-deleted-card');
    const tid = await app.evalJs("(() => { const b = (window.wrizoBoard() || []).find((x) => x.trashedFrom); return b ? b.id : null; })()");
    if (tid) {
      const pt = await pointIn(app, `[data-box-id="${tid}"]`);
      await rightClick(app, pt.x, pt.y); await shot(app, combo, '07-trash-card-menu');
      // 08 - Restore, and the board again
      await pick(app, 'Restore'); await sleep(700);
      await app.evalJs(`location.hash = '#/page/${BOARD}'`);
      await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"bcmf-a\"]')", { label: 'the restored card on its board', timeout: 8000 }); await sleep(800);
      await shot(app, combo, '08-restored-card-back-on-its-board');
    }
  }
  const same = rows.filter((r) => r.sameAsDarkTwin === true).map((r) => r.combo + '/' + r.frame);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'frames.json'), JSON.stringify({ rows, lightFramesByteIdenticalToDarkTwin: same }, null, 2));
  // eslint-disable-next-line no-console
  console.log(`BOARD-CONTEXT-MENU-FRAMES: ${rows.length} frames written to ${OUT}; light frames byte-identical to their dark twin: ${same.length ? same.join(', ') : 'none'}`);
});

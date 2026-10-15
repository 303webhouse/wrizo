// BOARD START - THE FRAMES (Fable, Oct 14), for Nick: the empty board's starters (a thin square outline at about 40% opacity), the ghost outline while a card is being dragged out, the starters
// fading on the first press, and the card pop-up a plain click opens. Arbor (plateau) and Flux, dark and light page tone. The board keeps today's light paper canvas.
//   01 the empty board, starters at rest        02 a starter reached for (hover)        03 mid-drag: the ghost outline following the pointer
//   04 the first press HELD: the starters faded away     05 a plain click: the new card's pop-up open at once
// Evidence, not a check: scripts/evidence/ (run-suite runs every file in scripts/harness/, and this writes PNGs into the tracked tree). Run by hand.
// "Light" for Arbor: `data-page` paints only under Flux, so Arbor's light frames may be byte-identical to its dark ones - every light frame is compared to its dark twin by MD5 and the row says so.
// Run: node scripts/evidence/board-start-frames.mjs   (from apps/desktop, dist-web built, box turn granted)     FRAMES_ONLY=<combo> for one
// Output: docs/evidence/board-start/<combo>/<frame>.png plus frames.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', '..', 'docs', 'evidence', 'board-start');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOARD = 'bs-board';
const COMBOS = [
  { id: 'arbor-dark', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'arbor-light', theme: 'plateau', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
].filter((t) => !process.env.FRAMES_ONLY || process.env.FRAMES_ONLY === t.id);
const rows = []; const hashes = new Map();
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

const freshBoard = async (app, combo) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(combo.prefs))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)});
    localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Board', pageType: 'board', boxes: [], createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${BOARD}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'the board', timeout: 9000 });
  await sleep(1000);
  return there;
};
const emptyPoint = (app) => app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
  for (let y = Math.max(r.top, 0) + 60; y < Math.min(r.bottom, window.innerHeight - 200); y += 30) for (let x = r.left + 60; x < r.right - 420; x += 30) {
    if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) }; } return null; })()`);
const state = (app) => app.evalJs(`(() => { const st = document.querySelector('.wz-beginnings[data-beginnings="board"]'); const b = st && st.querySelector('.wz-beginning'); const g = document.querySelector('.board-create-ghost');
  return { starters: st ? { opacity: getComputedStyle(st).opacity, visibility: getComputedStyle(st).visibility, faded: st.dataset.faded, doors: st.querySelectorAll('.wz-beginning').length } : null,
    door: b ? { opacity: getComputedStyle(b).opacity, border: getComputedStyle(b).borderTopWidth + ' ' + getComputedStyle(b).borderTopStyle, radius: getComputedStyle(b).borderTopLeftRadius } : null,
    ghost: g ? { display: getComputedStyle(g).display, w: Math.round(g.getBoundingClientRect().width), h: Math.round(g.getBoundingClientRect().height) } : null,
    canvasBg: getComputedStyle(document.querySelector('.board-canvas')).backgroundColor, popup: !!document.querySelector('.board-popup'),
    attrs: { theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page') } }; })()`);
const shot = async (app, combo, name, extra = {}) => {
  const dir = join(OUT, combo.id); mkdirSync(dir, { recursive: true });
  let file = `${name}.png`; let md5 = null;
  try { const buf = Buffer.from(await app.screenshot(), 'base64'); writeFileSync(join(dir, file), buf); md5 = createHash('md5').update(buf).digest('hex'); } catch (e) { file = `SHOT-FAILED ${e.message}`; }
  hashes.set(`${combo.id}/${name}`, md5);
  const twin = combo.id.endsWith('-light') ? combo.id.replace('-light', '-dark') : null;
  rows.push({ combo: combo.id, frame: name, file: `${combo.id}/${file}`, md5, sameAsDarkTwin: twin ? hashes.get(`${twin}/${name}`) === md5 : null, ...(await state(app)), ...extra });
};

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    if (!(await freshBoard(app, combo))) { rows.push({ combo: combo.id, frame: 'FIXTURE', error: 'the board did not open' }); continue; }
    await shot(app, combo, '01-empty-board-starters');
    // 02 - a starter reached for
    const door = await app.evalJs("(() => { const b = document.querySelector('.wz-beginning[data-beginning=\"newCard\"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    if (door) { await app.mouseMove(door.x, door.y); await sleep(450); await shot(app, combo, '02-starter-hover'); await app.mouseMove(5, 5); await sleep(300); }
    // 03 - mid-drag, the ghost following the pointer
    const p = await emptyPoint(app);
    if (p) {
      await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(80);
      for (let i = 1; i <= 8; i += 1) { await app.mouseMove(p.x + 36 * i, p.y + 18 * i); await sleep(25); }
      await sleep(150);
      await shot(app, combo, '03-drag-ghost', { drag: { from: p, to: { x: p.x + 288, y: p.y + 144 } } });
      await app.mouseUp(p.x + 288, p.y + 144);
      await waitSoft(app, "!!document.querySelector('.board-popup')", { timeout: 4000 }); await app.key('Escape'); await sleep(600);   // closed empty: discarded
    }
    // 04 - the first press HELD: the starters have faded
    await freshBoard(app, combo);
    const p2 = await emptyPoint(app);
    if (p2) {
      await app.mouseMove(p2.x, p2.y); await app.mouseDown(p2.x, p2.y); await sleep(750);
      await shot(app, combo, '04-first-press-starters-faded');
      await app.mouseUp(p2.x, p2.y); await waitSoft(app, "!!document.querySelector('.board-popup')", { timeout: 4000 });
      // 05 - a plain click: the pop-up opened at once
      await sleep(500);
      await shot(app, combo, '05-plain-click-popup');
      await app.key('Escape'); await sleep(400);
    }
  }
  const same = rows.filter((r) => r.sameAsDarkTwin === true).map((r) => r.combo + '/' + r.frame);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'frames.json'), JSON.stringify({ rows, lightFramesByteIdenticalToDarkTwin: same }, null, 2));
  // eslint-disable-next-line no-console
  console.log(`BOARD-START-FRAMES: ${rows.length} frames written to ${OUT}; light frames byte-identical to their dark twin: ${same.length ? same.join(', ') : 'none'}`);
});

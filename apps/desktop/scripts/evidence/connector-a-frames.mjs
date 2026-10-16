// CONNECTOR-A - THE FRAMES (Fable, Oct 15), for Nick: connection mode on the board, Arbor and Flux, dark and light page tone.
//   01 the mode on (just entered: the origin square is a circle, this card's link drawn to its linked peer, the peer's circle solid)
//   02 the arm over an OPEN card (snapped to its corner; its circle open)       03 the arm over a LINKED card (its circle solid; the origin circle solid)
//   04 just after linking (the new line and the two circles flash, then hide)   05 a line selected (heavier), ready for Delete
// Evidence, not a check: scripts/evidence/ (run-suite runs every file in scripts/harness/, and this writes PNGs into the tracked tree). Run by hand.
// "Light" for Arbor: `data-page` paints only under Flux, so Arbor's light frames may be byte-identical to their dark ones - every light frame is compared to its dark twin by MD5 and the row says so.
// Run: node scripts/evidence/connector-a-frames.mjs   (from apps/desktop, dist-web built, box turn granted)     FRAMES_ONLY=<combo> for one
// Output: docs/evidence/connector-a/<combo>/<frame>.png plus frames.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', '..', 'docs', 'evidence', 'connector-a');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOARD = 'ca-frames-board';
const COMBOS = [
  { id: 'arbor-dark', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'arbor-light', theme: 'plateau', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
].filter((t) => !process.env.FRAMES_ONLY || process.env.FRAMES_ONLY === t.id);
const rows = []; const hashes = new Map();
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const BOXES = [
  { id: 'ca-a', kind: 'text', x: 0.05, y: 0.06, w: 0.22, h: 0.13, z: 1, text: 'The harbour scene\nWhere Mara first sees the ship.' },
  { id: 'ca-b', kind: 'text', x: 0.52, y: 0.06, w: 0.22, h: 0.13, z: 2, text: 'The letter\nWhat the captain left unsaid.' },
  { id: 'ca-c', kind: 'text', x: 0.05, y: 0.4, w: 0.22, h: 0.13, z: 3, text: 'Mara\nHer reasons for staying.' },
  { id: 'ca-d', kind: 'text', x: 0.52, y: 0.4, w: 0.22, h: 0.13, z: 4, text: 'The storm\nTurning point.' },
  { id: 'ca-ac', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 5, connA: 'ca-a', connB: 'ca-c' },
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
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Board', pageType: 'board', boxes: BOXES, createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${BOARD}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"ca-a\"]')", { label: 'the board', timeout: 9000 });
  await sleep(1000);
  return there;
};
const rectOf = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), l: r.left, t: r.top, r: r.right, b: r.bottom }; })()`);
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const glide = async (app, from, to, steps = 8) => { for (let i = 1; i <= steps; i += 1) { await app.mouseMove(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps)); await sleep(20); } };
const state = (app) => app.evalJs(`(() => { const cs = (e) => (e ? getComputedStyle(e) : null);
  return { armed: document.querySelector('.board-canvas').dataset.threadArmed, lines: document.querySelectorAll('.board-connection-line').length,
    arm: !!document.querySelector('.board-connect-arm') && cs(document.querySelector('.board-connect-arm')).display !== 'none',
    circles: [...document.querySelectorAll('.board-tcircle')].filter((e) => cs(e).display !== 'none').map((e) => ({ card: e.parentElement.dataset.boxId, solid: e.dataset.solid })),
    handle: (() => { const h = document.querySelector('.board-handle'); return h ? { circle: h.dataset.circle, solid: h.dataset.solid } : null; })(),
    selectedLine: !!document.querySelector('.board-connection-line[data-selected="true"]'),
    attrs: { theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page') } }; })()`);
const shot = async (app, combo, name) => {
  const dir = join(OUT, combo.id); mkdirSync(dir, { recursive: true });
  let file = `${name}.png`; let md5 = null;
  try { const buf = Buffer.from(await app.screenshot(), 'base64'); writeFileSync(join(dir, file), buf); md5 = createHash('md5').update(buf).digest('hex'); } catch (e) { file = `SHOT-FAILED ${e.message}`; }
  hashes.set(`${combo.id}/${name}`, md5);
  const twin = combo.id.endsWith('-light') ? combo.id.replace('-light', '-dark') : null;
  rows.push({ combo: combo.id, frame: name, file: `${combo.id}/${file}`, md5, sameAsDarkTwin: twin ? hashes.get(`${twin}/${name}`) === md5 : null, ...(await state(app)) });
};
const dbl = async (app, x, y) => {
  await app.mouseMove(x, y);
  await mouse(app, 'mousePressed', x, y, { clickCount: 1 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 1 });
  await sleep(60);
  await mouse(app, 'mousePressed', x, y, { clickCount: 2 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 2 });
  await sleep(300);
};

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    if (!(await freshBoard(app, combo))) { rows.push({ combo: combo.id, frame: 'FIXTURE', error: 'the board did not open' }); continue; }
    const a = await rectOf(app, '[data-box-id="ca-a"]');
    await click(app, Math.round(a.l + (a.r - a.l) * 0.3), Math.round(a.t + (a.b - a.t) * 0.3));
    await sleep(700);
    const h = await rectOf(app, '[data-box-id="ca-a"] .board-handle');
    if (!h) { rows.push({ combo: combo.id, frame: 'FIXTURE', error: 'the selected card showed no corner square' }); continue; }
    // 01 - the mode on
    await dbl(app, h.x, h.y);
    await shot(app, combo, '01-mode-on');
    // 02 - the arm over an OPEN card (B)
    const b = await rectOf(app, '[data-box-id="ca-b"]');
    await glide(app, h, b); await sleep(250);
    await shot(app, combo, '02-arm-over-open-card');
    // 03 - the arm over a LINKED card (C)
    const c = await rectOf(app, '[data-box-id="ca-c"]');
    await glide(app, b, c); await sleep(250);
    await shot(app, combo, '03-arm-over-linked-card');
    // 04 - just after linking (release on B)
    await glide(app, c, b);
    await mouse(app, 'mousePressed', b.x, b.y); await mouse(app, 'mouseReleased', b.x, b.y);
    await sleep(220);
    await shot(app, combo, '04-just-after-linking');
    await sleep(2400);
    // 05 - a line selected: back into the mode, click the A-C line in the gap between the cards
    const h2 = await rectOf(app, '[data-box-id="ca-a"] .board-handle');
    await dbl(app, h2.x, h2.y);
    const mid = { x: Math.round((a.r + c.r) / 2), y: Math.round((a.b + c.b) / 2) };
    await click(app, mid.x, mid.y); await sleep(300);
    await shot(app, combo, '05-line-selected');
    await app.key('Escape'); await sleep(300);
  }
  const same = rows.filter((r) => r.sameAsDarkTwin === true).map((r) => r.combo + '/' + r.frame);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'frames.json'), JSON.stringify({ rows, lightFramesByteIdenticalToDarkTwin: same }, null, 2));
  // eslint-disable-next-line no-console
  console.log(`CONNECTOR-A-FRAMES: ${rows.length} frames written to ${OUT}; light frames byte-identical to their dark twin: ${same.length ? same.join(', ') : 'none'}`);
});

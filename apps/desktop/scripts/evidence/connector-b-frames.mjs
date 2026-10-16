// CONNECTOR-B - THE FRAMES, for Nick: the connector reaching the rail, Arbor and Flux, dark and light page tone.
//   01 the arm over a rail thumbnail (its circle OPEN)      02 just after linking (the thumbnail's circle SOLID for a beat; the card's footer names it)
//   03 the arm over a thumbnail the card is ALREADY linked to (its circle SOLID)      04 the Grafts / Links tab listing the selected card's connections, each with an X
//   05 the "Remove graft?" dialog (no "Don't ask me again")      06 a thumbnail dragged onto the board - the ghost under the pointer      07 the LINKED COPY on the board
// Evidence, not a check: scripts/evidence/ (run-suite runs scripts/harness/, and this writes PNGs). Run by hand.   Run: node scripts/evidence/connector-b-frames.mjs   (from apps/desktop, dist-web built, box turn granted)   FRAMES_ONLY=<combo>
// Output: docs/evidence/connector-b/<combo>/<frame>.png plus frames.json (light frames are compared to their dark twin by MD5).
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', '..', 'docs', 'evidence', 'connector-b');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMBOS = [
  { id: 'arbor-dark', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'arbor-light', theme: 'plateau', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
].filter((t) => !process.env.FRAMES_ONLY || process.env.FRAMES_ONLY === t.id);
const rows = []; const hashes = new Map();
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ID = 'cbf-board', B2 = 'cbf-research', B3 = 'cbf-characters';
const BOXES = [
  { id: 'cbf-a', kind: 'text', x: 0.05, y: 0.06, w: 0.22, h: 0.13, z: 1, text: 'The harbour scene\nWhere Mara first sees the ship.' },
  { id: 'cbf-b', kind: 'text', x: 0.5, y: 0.06, w: 0.22, h: 0.13, z: 2, text: 'The letter\nWhat the captain left unsaid.' },
  { id: 'cbf-c', kind: 'text', x: 0.05, y: 0.4, w: 0.22, h: 0.13, z: 3, text: 'Mara\nHer reasons for staying.' },
  { id: 'cbf-ac', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 4, connA: 'cbf-a', connB: 'cbf-c' },
];
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
const centre = (r) => ({ x: Math.round(r.l + r.w / 2), y: Math.round(r.t + r.h / 2) });
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const glide = async (app, from, to, steps = 10) => { for (let i = 1; i <= steps; i += 1) { await app.mouseMove(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps)); await sleep(20); } };
const tile = (app, title) => app.evalJs(`(() => { const t = [...document.querySelectorAll('.wz-drawers-tile[data-link-entry]')].find((b) => b.textContent.includes(${JSON.stringify(title)})); if (!t) return null; const r = t.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
const shot = async (app, combo, name) => {
  const dir = join(OUT, combo.id); mkdirSync(dir, { recursive: true });
  let file = `${name}.png`; let md5 = null;
  try { const buf = Buffer.from(await app.screenshot(), 'base64'); writeFileSync(join(dir, file), buf); md5 = createHash('md5').update(buf).digest('hex'); } catch (e) { file = `SHOT-FAILED ${e.message}`; }
  hashes.set(`${combo.id}/${name}`, md5);
  const twin = combo.id.endsWith('-light') ? combo.id.replace('-light', '-dark') : null;
  rows.push({ combo: combo.id, frame: name, file: `${combo.id}/${file}`, md5, sameAsDarkTwin: twin ? hashes.get(`${twin}/${name}`) === md5 : null });
};
const enterMode = async (app) => {
  const a = await R(app, '[data-box-id="cbf-a"]'); await mouse(app, 'mousePressed', Math.round(a.l + a.w * 0.3), Math.round(a.t + a.h * 0.3)); await mouse(app, 'mouseReleased', Math.round(a.l + a.w * 0.3), Math.round(a.t + a.h * 0.3)); await sleep(600);
  const h = centre(await R(app, '[data-box-id="cbf-a"] .board-handle'));
  await app.mouseMove(h.x, h.y);
  await mouse(app, 'mousePressed', h.x, h.y, { clickCount: 1 }); await mouse(app, 'mouseReleased', h.x, h.y, { clickCount: 1 }); await sleep(60);
  await mouse(app, 'mousePressed', h.x, h.y, { clickCount: 2 }); await mouse(app, 'mouseReleased', h.x, h.y, { clickCount: 2 }); await sleep(300);
  return h;
};

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
      localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(combo.prefs))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)});
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    const now = new Date().toISOString();
    for (const row of [
      { id: ID, text: 'Harbour board', pageType: 'board', boxes: BOXES, createdAt: now, origin: null, source: null },
      { id: B2, text: 'Research board', pageType: 'board', boxes: [], createdAt: now, origin: null, source: null },
      { id: B3, text: 'Characters', pageType: 'board', boxes: [], createdAt: now, origin: null, source: null },
    ]) await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(450);
    await app.evalJs(`location.hash = '#/page/${ID}'`);
    if (!(await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"cbf-a\"]')", { label: 'the board', timeout: 9000 }))) { rows.push({ combo: combo.id, frame: 'FIXTURE', error: 'the board did not open' }); continue; }
    await sleep(900);
    await app.evalJs("document.querySelector('.wz-strip-item[data-category=drawers]')?.click()"); await sleep(600);
    const t2 = await tile(app, 'Research board'), t3 = await tile(app, 'Characters');
    if (!t2 || !t3) { rows.push({ combo: combo.id, frame: 'FIXTURE', error: 'the Drawers tiles are not in the rail' }); continue; }
    // 01 / 02 - the arm over a thumbnail, then linking
    const h = await enterMode(app);
    await glide(app, h, centre(t2)); await sleep(250);
    await shot(app, combo, '01-arm-over-a-rail-thumbnail');
    await mouse(app, 'mousePressed', ...Object.values(centre(t2))); await mouse(app, 'mouseReleased', ...Object.values(centre(t2))); await sleep(300);
    await shot(app, combo, '02-just-after-linking');
    await sleep(1800);
    // 03 - the arm over a thumbnail it is already linked to
    const h2 = await enterMode(app);
    await glide(app, h2, centre(t2)); await sleep(250);
    await shot(app, combo, '03-arm-over-an-already-linked-thumbnail');
    await app.key('Escape'); await sleep(300);
    // 04 / 05 - the Grafts / Links tab, and its confirm
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700);
    await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(500);
    await shot(app, combo, '04-grafts-links-tab');
    await app.evalJs("document.querySelector('.wz-links-item .wz-links-x')?.click()"); await sleep(450);
    await shot(app, combo, '05-remove-graft-dialog');
    await app.evalJs("document.querySelector('.wz-delete-btn:not(.wz-delete-go)')?.click()"); await sleep(300);
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(500);
    // 06 / 07 - drag a thumbnail onto the board
    const drop = await app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
      for (let y = r.top + 330; y < Math.min(r.bottom, innerHeight - 140); y += 25) for (let x = r.left + 300; x < r.right - 320; x += 25) if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) };
      return null; })()`);
    if (drop) {
      const p = centre(t3);
      await app.mouseMove(p.x, p.y); await mouse(app, 'mousePressed', p.x, p.y);
      await glide(app, p, drop, 12); await sleep(150);
      await shot(app, combo, '06-dragging-a-thumbnail-onto-the-board');
      await mouse(app, 'mouseReleased', drop.x, drop.y); await sleep(700);
      await shot(app, combo, '07-the-linked-copy');
    }
  }
  const same = rows.filter((r) => r.sameAsDarkTwin === true).map((r) => r.combo + '/' + r.frame);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'frames.json'), JSON.stringify({ rows, lightFramesByteIdenticalToDarkTwin: same }, null, 2));
  // eslint-disable-next-line no-console
  console.log(`CONNECTOR-B-FRAMES: ${rows.length} frames written to ${OUT}; light frames byte-identical to their dark twin: ${same.length ? same.join(', ') : 'none'}`);
});

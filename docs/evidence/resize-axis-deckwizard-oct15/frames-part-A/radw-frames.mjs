// CARD-RESIZE-AXIS + DECKWIZARD-BACKDROP - THE FRAMES (this desk's capture script; neither branch ships a frames tool), from the rd worktree's own dist-web:
//  Part A (Arbor): a PAGE PIN selected, then its corner dragged RIGHT, then DOWN - the size follows the pointer on both axes and the card keeps its proportions.
//  Part B (Arbor and Flux): the deck wizard open over the rail - the backdrop covers the rail (a point at the rail's centre hits the backdrop).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/rd/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const prefsFor = (theme) => JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' });
const freshDesk = async (app, theme) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(prefsFor(theme))}); localStorage.setItem('wrizo-theme', '${theme}');
    localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
};
const facts = (app, sel) => app.evalJs(`(() => {
  const el = ${sel ? `document.querySelector('${sel}')` : 'null'}; const r = el ? el.getBoundingClientRect() : null;
  const rail = document.querySelector('.desk-frame-strip'); const rr = rail ? rail.getBoundingClientRect() : null;
  const pt = rr ? document.elementFromPoint(Math.round(rr.left + rr.width / 2), Math.round(rr.top + rr.height / 2)) : null;
  const bd = document.querySelector('.deck-wizard-backdrop');
  return { origin: location.origin, theme: document.documentElement.getAttribute('data-theme'),
    bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''), splashPresent: !!document.querySelector('.wz-splash'),
    rect: r ? { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), ratioHW: Math.round((r.height / r.width) * 1000) / 1000 } : null,
    selectedHandle: !!(el && el.querySelector('.board-handle')),
    railCentreHit: pt ? (typeof pt.className === 'string' && pt.className ? pt.className.split(' ')[0] : pt.tagName) : null,
    wizard: bd ? { parentIsBody: bd.parentElement === document.body, position: getComputedStyle(bd).position, zIndex: getComputedStyle(bd).zIndex } : null }; })()`);
const shot = async (app, name, sel, extra = {}) => {
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  const row = { frame: name, file: `${name}.png`, ...(await facts(app, sel)), ...extra }; rows.push(row); console.log(JSON.stringify(row)); return row;
};
const handleAt = (app, sel) => app.evalJs(`(() => { const h = document.querySelector('${sel} .board-handle'); if (!h) return null; const r = h.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const drag = async (app, sel, dx, dy) => {
  const p = await handleAt(app, sel); if (!p) return null;
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0); await mouse(app, 'mousePressed', p.x, p.y, 1, 1);
  const tx = p.x + dx, ty = p.y + dy;
  for (let i = 1; i <= 8; i += 1) { await mouse(app, 'mouseMoved', Math.round(p.x + ((tx - p.x) * i) / 8), Math.round(p.y + ((ty - p.y) * i) / 8), 0, 1); await sleep(20); }
  await mouse(app, 'mouseReleased', tx, ty, 1, 0); await sleep(350);
  return { from: p, to: { x: tx, y: ty } };
};

await withHarness(async (app) => {
  // ---- Part A: a page pin, resized right and down (Arbor)
  await freshDesk(app, 'plateau');
  for (const r of [
    { id: 'rz-wall', text: 'Resize wall', origin: null, source: null, projectId: null, pageType: 'board', boxes: [{ id: 'rz-text', kind: 'text', x: 0.62, y: 0.55, w: 0.2, h: 0.12, z: 9, text: 'A free text card' },
      { id: 'rz-pin', kind: 'page-pin', x: 0.08, y: 0.06, w: 0.2506, h: 0.3446, z: 1, entryId: 'rz-page', onCanvas: true }] },
    { id: 'rz-page', text: 'A page pinned to the wall. It has a few words in it.', origin: null, source: null, projectId: null, pageType: 'manuscript' }]) {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(r)})`);
  }
  await sleep(500); await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });
  const pinned = 'inline page-pin box (placed on-screen; the seam put it below the fold)';
  await app.evalJs('window.wrizoFlushNow()');
  await app.evalJs("location.hash = '#/page/rz-wall'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the wall' }); await sleep(800);
  const pinId = await app.evalJs("((window.wrizoBoard() || []).find((b) => b.kind === 'page-pin') || {}).id || null");
  const sel = `[data-box-id="${pinId}"]`;
  const c = await app.evalJs(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await mouse(app, 'mouseMoved', c.x, c.y, 0, 0); await sleep(100); await mouse(app, 'mousePressed', c.x, c.y, 1, 1); await mouse(app, 'mouseReleased', c.x, c.y, 1, 0); await sleep(800);
  const a0 = await shot(app, 'arbor-A0-page-pin-selected', sel, { pinned, pinId });
  const d1 = await drag(app, sel, 140, 0);
  const a1 = await shot(app, 'arbor-A1-after-drag-right', sel, { drag: d1, before: a0.rect });
  const d2 = await drag(app, sel, 0, 90);
  await shot(app, 'arbor-A2-after-drag-down', sel, { drag: d2, before: a1.rect });
  // ---- Part B: the deck wizard over the rail, both themes
  for (const theme of (process.env.PART === 'A' ? [] : ['plateau', 'flux'])) {
    await freshDesk(app, theme);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'dwb-board', text: 'Deck board', pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(),
      boxes: [{ id: 'dwb-card', kind: 'text', x: 0.1, y: 0.08, w: 0.22, h: 0.14, z: 1, text: 'A card on the board' }] })})`);
    await sleep(500); await app.reload();
    await app.evalJs("location.hash = '#/page/dwb-board'");
    await app.waitFor("!!document.querySelector('[data-box-id=\"dwb-card\"]')", { label: 'the board' }); await sleep(800);
    const pressed = await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-sliver-item-btn')].find(x => x.textContent.trim() === 'From a deck…'); if (!b) return false; b.click(); return true; })()");
    const open = pressed && await waitSoft(app, "!!document.querySelector('.deck-wizard-backdrop')", { label: 'deck wizard', timeout: 4000 });
    await sleep(500);
    await shot(app, `${theme === 'plateau' ? 'arbor' : 'flux'}-B-deck-wizard-over-the-rail`, null, { pressed, open });
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`RESIZE-AXIS / DECKWIZARD FRAMES: ${rows.length} frames -> ${OUT}`);

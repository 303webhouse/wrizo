// FLUX CARD INK - THE FRAMES (this desk's capture script; the branch ships a harness, no frames tool): a board with cards, per combo
// Flux dark, Flux light and Arbor (the control the ticket says is fine), from the fci worktree's own dist-web.
//   B0 the board, nothing selected, three text cards + a page-pin card      B1 one text card selected (no pop-up)
// Per frame the computed ink of each card's text, the card's own opaque background, and the WCAG 2.x contrast ratio between them (computed in the page).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/fci/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const COMBOS = [
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'arbor-control', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
];
const ink = (app) => app.evalJs(`(() => {
  const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const opaqueBg = (el) => { for (let n = el; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; const m = b.match(/[\\d.]+/g); if (m && (m.length < 4 || Number(m[3]) === 1)) return b; } return null; };
  const out = [];
  for (const card of document.querySelectorAll('[data-box-id]')) {
    const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (t.textContent.trim().length > 2 ? 1 : 3) });
    const t = w.nextNode(); if (!t) { out.push({ id: card.dataset.boxId, text: null }); continue; }
    const el = t.parentElement; const col = getComputedStyle(el).color; const bg = opaqueBg(el);
    const L1 = lum(col), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    out.push({ id: card.dataset.boxId, text: t.textContent.trim().slice(0, 30), color: col, bg, contrast: Math.round(ratio * 100) / 100 });
  }
  return out; })()`);
const shot = async (app, combo, name, extra = {}) => {
  writeFileSync(join(OUT, `${combo.id}-${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  const f = await app.evalJs(`({ origin: location.origin, theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'),
    bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''), splashPresent: !!document.querySelector('.wz-splash'),
    popupOpen: !!document.querySelector('.board-popup') })`);
  const row = { frame: `${combo.id}-${name}`, file: `${combo.id}-${name}.png`, ...f, cards: await ink(app), ...extra }; rows.push(row); console.log(JSON.stringify(row).slice(0, 700)); return row;
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
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fc-target', text: 'A page pinned to the board. It has a few words in it.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fc-board', text: 'Card ink board', pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(),
      boxes: [{ id: 'fc-a', kind: 'text', x: 0.07, y: 0.08, w: 0.24, h: 0.16, z: 1, text: 'The harbour scene. Where Mara first sees the ship.' },
              { id: 'fc-b', kind: 'text', x: 0.4, y: 0.08, w: 0.24, h: 0.16, z: 2, text: 'The letter. What the captain left unsaid.' },
              { id: 'fc-c', kind: 'text', x: 0.07, y: 0.45, w: 0.24, h: 0.16, z: 3, text: 'Mara. Her reasons for staying.' },
              { id: 'fc-pin', kind: 'page-pin', x: 0.4, y: 0.45, w: 0.24, h: 0.12, z: 4, entryId: 'fc-target' }] })})`);
    await sleep(500); await app.reload();
    await app.evalJs("location.hash = '#/page/fc-board'");
    await app.waitFor("!!document.querySelector('[data-box-id=\"fc-a\"]')", { label: 'board cards' }); await sleep(900);
    await shot(app, combo, 'B0-board-nothing-selected');
    const c = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="fc-a"]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    await mouse(app, 'mouseMoved', c.x, c.y, 0, 0); await sleep(120);
    await mouse(app, 'mousePressed', c.x, c.y, 1, 1); await mouse(app, 'mouseReleased', c.x, c.y, 1, 0); await sleep(900);
    await shot(app, combo, 'B1-one-card-selected');
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`FLUX-CARD-INK FRAMES: ${rows.length} frames -> ${OUT}`);

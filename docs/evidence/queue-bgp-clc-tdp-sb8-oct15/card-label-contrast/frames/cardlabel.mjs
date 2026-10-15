// CARD LABEL CONTRAST - THE FRAMES (this desk's capture script; the branch ships a harness, no frames tool), from the clc worktree's own dist-web:
// a board with cards that carry footers (a linked pair) and a PAGE PIN (badge + excerpt), Arbor, Flux dark, Flux light. One frame each.
// Per frame the computed ink, the card stock behind it and the WCAG 2.x contrast of the card footer, the pin badge and the pin excerpt.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/clc/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const COMBOS = [
  { id: 'arbor', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
];
const measure = (app) => app.evalJs(`(() => {
  const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const opaqueBg = (el) => { for (let n = el; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; const m = b.match(/[\\d.]+/g); if (m && (m.length < 4 || Number(m[3]) === 1)) return b; } return null; };
  const one = (sel) => { const els = [...document.querySelectorAll(sel)]; return els.map((el) => { const col = getComputedStyle(el).color; const bg = opaqueBg(el); const op = getComputedStyle(el).opacity;
    const r = (Math.max(lum(col), lum(bg)) + 0.05) / (Math.min(lum(col), lum(bg)) + 0.05); return { text: el.textContent.trim().slice(0, 36), color: col, bg, opacity: op, contrast: Math.round(r * 100) / 100 }; }); };
  return { footer: one('.board-card-footer'), badge: one('.board-pin-badge'), excerpt: one('.board-pin-excerpt'), toggle: one('.board-layer-toggle') }; })()`);
const shot = async (app, combo) => {
  writeFileSync(join(OUT, `${combo.id}-footers-and-page-pin.png`), Buffer.from(await app.screenshot(), 'base64'));
  const f = await app.evalJs(`({ origin: location.origin, theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'),
    bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''), splashPresent: !!document.querySelector('.wz-splash') })`);
  const row = { frame: `${combo.id}-footers-and-page-pin`, file: `${combo.id}-footers-and-page-pin.png`, ...f, ...(await measure(app)) }; rows.push(row); console.log(JSON.stringify(row).slice(0, 900));
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
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'cl-target', text: 'A page pinned to the board. It has a few words in it, enough for an excerpt.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'cl-board', text: 'Card label board', pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(),
      boxes: [{ id: 'cl-a', kind: 'text', x: 0.05, y: 0.06, w: 0.22, h: 0.13, z: 1, text: 'The harbour scene\nWhere Mara first sees the ship.' },
              { id: 'cl-b', kind: 'text', x: 0.52, y: 0.06, w: 0.22, h: 0.13, z: 2, text: 'The letter\nWhat the captain left unsaid.' },
              { id: 'cl-c', kind: 'text', x: 0.05, y: 0.4, w: 0.22, h: 0.13, z: 3, text: 'Mara\nHer reasons for staying.' },
              { id: 'cl-pin', kind: 'page-pin', x: 0.52, y: 0.4, w: 0.24, h: 0.14, z: 4, entryId: 'cl-target' },
              { id: 'cl-ac', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 5, connA: 'cl-a', connB: 'cl-c' }] })})`);
    await sleep(500); await app.reload();
    await app.evalJs("location.hash = '#/page/cl-board'");
    await app.waitFor("!!document.querySelector('[data-box-id=\"cl-a\"]')", { label: 'board cards' }); await sleep(1000);
    await shot(app, combo);
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`CARD-LABEL FRAMES: ${rows.length} frames -> ${OUT}`);

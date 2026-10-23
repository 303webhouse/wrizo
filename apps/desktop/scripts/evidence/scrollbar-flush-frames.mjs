// SCROLLBAR-FLUSH - THE SCREENS, for Fable's clear (Oct 23): the page scrollbar, Arbor and Flux, margins narrow / normal / wide, and the LIGHT
// board canvas. Evidence, not a check: scripts/evidence/ (run-suite runs scripts/harness/, and this writes images). Run by hand.
//   Run: node scripts/evidence/scrollbar-flush-frames.mjs   (from apps/desktop, dist-web built; needs a box turn)
// Output: docs/evidence/scrollbar-flush/<combo>/<frame>.jpg (JPEG q80, 1400 wide - the evidence commit rule) plus frames.json with, per frame, the
// numbers the picture is meant to show (the gap from the page edge, the bar's width, the resolved colour), so a frame is never the only witness.
// Each page frame is also scrolled mid-page: a bar at rest and a bar being used are different pictures.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', '..', 'docs', 'evidence', 'scrollbar-flush');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMBOS = [
  { id: 'arbor-light', theme: 'plateau', page: 'light' },
  { id: 'flux-light', theme: 'flux', page: 'light' },
  { id: 'flux-dark', theme: 'flux', page: 'dark' },
].filter((c) => !process.env.FRAMES_ONLY || process.env.FRAMES_ONLY === c.id);
const MARGINS = ['narrow', 'normal', 'wide'];
const LONG_TEXT = Array.from({ length: 120 }, (_, i) => `Line ${i + 1}. The harbour was quiet that morning, and Mara counted the masts twice before she believed them.`).join('\n\n');
const rows = [];

const shot = async (app, combo, name, extra = {}) => {
  const dir = join(OUT, combo.id); mkdirSync(dir, { recursive: true });
  const file = `${name}.jpg`;
  try { writeFileSync(join(dir, file), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80 })).data, 'base64')); }
  catch (e) { rows.push({ combo: combo.id, frame: name, error: String(e.message || e) }); return; }
  rows.push({ combo: combo.id, frame: name, file: `${combo.id}/${file}`, ...extra });
};

const setMargin = async (app, margin) => {
  const label = margin === 'normal' ? 'Normal' : margin === 'narrow' ? 'Narrow' : 'Wide';
  await app.evalJs("document.querySelector('[data-category=\"page\"]')?.click()");
  await app.waitFor("!!document.querySelector('.wz-page-setup-seg')", { label: 'PAGE SETUP open' });
  await app.evalJs(`[...document.querySelectorAll('.wz-page-setup-seg [role="radio"]')].find((b) => b.textContent.trim() === ${JSON.stringify(label)})?.click()`);
  await sleep(150);
  await app.evalJs("document.querySelector('[data-category=\"page\"]')?.click()");
  await sleep(300);
};

const measure = (app) => app.evalJs(`(() => {
  const s = document.querySelector('.mode-scroll'); const p = document.querySelector('.mode-page');
  if (!s || !p) return null;
  const cs = getComputedStyle(s);
  return { gapFromPageEdge: p.getBoundingClientRect().right - s.getBoundingClientRect().right, barWidth: s.offsetWidth - s.clientWidth,
    scrollbarWidth: cs.scrollbarWidth, scrollbarColor: cs.scrollbarColor };
})()`);

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    const prefs = JSON.stringify(JSON.stringify({ voice: 'serif', page: combo.page, fade: 'on' }));
    // ---- the page, three margins
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)}); localStorage.setItem('wrizo-theme-prefs', ${prefs});`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk ${combo.id}` });
    await app.evalJs(`window.wrizoCreateJournalPage({ id: 'sbfr-${combo.id}', text: ${JSON.stringify(LONG_TEXT)}, createdAt: new Date().toISOString(), origin: null, source: 'page' })`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });
    await app.evalJs(`location.hash = '#/page/sbfr-${combo.id}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `page ${combo.id}` });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone (page)' });
    await sleep(500);
    for (const margin of MARGINS) {
      await setMargin(app, margin);
      await app.evalJs("document.querySelector('.mode-scroll').scrollTop = 0");
      await sleep(250);
      await shot(app, combo, `page-${margin}-rest`, { margin, ...(await measure(app)) });
      await app.evalJs("(() => { const s = document.querySelector('.mode-scroll'); s.scrollTop = Math.round((s.scrollHeight - s.clientHeight) * 0.4); })()");
      await sleep(250);
      await shot(app, combo, `page-${margin}-mid-scroll`, { margin, ...(await measure(app)) });
    }
    // ---- the board canvas (a tall card and one past the right edge, so the wrap scrolls both ways)
    await app.emulateDpr(1, 1400, 800);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)}); localStorage.setItem('wrizo-theme-prefs', ${prefs});`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk board ${combo.id}` });
    await app.evalJs(`window.wrizoCreateJournalPage({ id: 'sbfr-board-${combo.id}', text: 'Board', pageType: 'board', createdAt: new Date().toISOString(), origin: null,
      boxes: [{ id: 'sbfr-a', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 3, z: 1, text: 'The harbour scene\\nWhere Mara first sees the ship.' }, { id: 'sbfr-b', kind: 'text', x: 0.55, y: 0.1, w: 0.3, h: 0.25, z: 2, text: 'The letter\\nWhat the captain left unsaid.' }, { id: 'sbfr-c', kind: 'text', x: 0.9, y: 0.45, w: 0.3, h: 0.2, z: 3, text: 'A card past the right edge - the bottom bar.' }] })`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/sbfr-board-${combo.id}'`);
    await app.waitFor("!!document.querySelector('.board-canvas-wrap')", { label: `board ${combo.id}` });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone (board)' });
    await sleep(600);
    const board = await app.evalJs(`(() => { const w = document.querySelector('.board-canvas-wrap'); const cs = getComputedStyle(w);
      return { vBar: w.offsetWidth - w.clientWidth - (parseFloat(cs.borderLeftWidth) || 0) - (parseFloat(cs.borderRightWidth) || 0),
        hBar: w.offsetHeight - w.clientHeight - (parseFloat(cs.borderTopWidth) || 0) - (parseFloat(cs.borderBottomWidth) || 0), scrollbarWidth: cs.scrollbarWidth, scrollbarColor: cs.scrollbarColor,
        canvasBackground: getComputedStyle(document.querySelector('.board-canvas')).backgroundColor }; })()`);
    await shot(app, combo, 'board-rest', board);
    await app.evalJs("(() => { const w = document.querySelector('.board-canvas-wrap'); w.scrollTop = Math.round((w.scrollHeight - w.clientHeight) * 0.5); })()");
    await sleep(250);
    await shot(app, combo, 'board-mid-scroll', board);
    // A/B - a PROPOSAL, not shipped CSS: the vertical bar sits in the wrap's stable gutter beside the canvas (over the desk ground) while the
    // horizontal bar overlays the canvas (over the paper), so one thumb colour is right for only one of them. Painting the wrap with the paper
    // puts both on the board surface. Injected here only, for the picture.
    await app.evalJs("(() => { const st = document.createElement('style'); st.id = 'sbfr-ab'; st.textContent = '.board-canvas-wrap{ background:var(--paper); }'; document.head.appendChild(st); })()");
    await app.evalJs("(() => { const w = document.querySelector('.board-canvas-wrap'); w.scrollTop = 0; w.scrollLeft = 0; })()");
    await sleep(300);
    await shot(app, combo, 'board-rest-PROPOSAL-wrap-paper', { ...board, proposal: 'wrap background = var(--paper) (injected, not shipped)' });
    await app.evalJs("(() => { const w = document.querySelector('.board-canvas-wrap'); w.scrollTop = Math.round((w.scrollHeight - w.clientHeight) * 0.5); w.scrollLeft = Math.round((w.scrollWidth - w.clientWidth) * 0.4); })()");
    await sleep(250);
    await shot(app, combo, 'board-mid-scroll-PROPOSAL-wrap-paper', { ...board, proposal: 'wrap background = var(--paper) (injected, not shipped)' });
  }
  return [];
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2));
// eslint-disable-next-line no-console
console.log(JSON.stringify(rows, null, 2));
process.exit(rows.some((r) => r.error) ? 1 : 0);

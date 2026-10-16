// WORD-DIET frames (this desk's capture script) from the wd-ship worktree's own dist-web (main + word-diet): per theme (Arbor = plateau, Flux):
//  W1a/b/c the page header place line: an UNFILED page, a JOURNAL page, a DRAWER page      W2 the Places panel
//  W3 an EMPTY board ("+ Pages" and "+ Filed Pages")                                         W4 the Tutor with the "?" beside Ask opened
//  W5 the Tutor ERROR with "Try again" (forced through the harness's tutor double: fail=true)  W6 the "..." menu with the Recede "?" opened
//  W7 the Fragments "?" opened
// Each frame records the visible words it is about (crumb text, button labels, the note's own text) so the image is not the only evidence.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/wd4/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const facts = (app, probe) => app.evalJs(`(() => {
  const txt = (sel) => [...document.querySelectorAll(sel)].map((e) => e.textContent.trim().replace(/\\s+/g, ' ')).filter(Boolean).slice(0, 12);
  const base = { hash: location.hash, theme: document.documentElement.getAttribute('data-theme'),
    bundle: ([...document.scripts].map((s) => s.src).find((s) => /assets\\/index-/.test(s)) || '').replace(/^.*assets\\//, ''), splashPresent: !!document.querySelector('.wz-splash') };
  const extra = (() => { try { return (${probe || '() => ({})'})(); } catch (e) { return { probeError: String(e.message) }; } })();
  return { ...base, ...extra };
})()`);
const shot = async (app, name, probe) => {
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  const row = { frame: name, file: `${name}.png`, ...(await facts(app, probe)) }; rows.push(row); console.log(JSON.stringify(row));
};
const fresh = async (app, theme) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme','${theme}'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 }); await sleep(700);
};
const openPage = async (app, id) => {
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await waitSoft(app, "!!document.querySelector('.forward-only-editor, [data-box-id], .board-canvas, .sprint-crumb')", { label: 'page', timeout: 8000 });
  await sleep(1200);
};
const CRUMB = `() => ({ crumb: (document.querySelector('.sprint-crumb') || {}).textContent || null, crumbEls: [...document.querySelectorAll('.crumb-item')].map((e) => e.textContent), headerText: (document.querySelector('.desk-mode-strip, .mode-strip, header') || {}).textContent?.slice(0, 160) || null })`;

await withHarness(async (app) => {
  for (const [id, theme] of [['arbor', 'plateau'], ['flux', 'flux']]) {
    await fresh(app, theme);
    // seed: a Journal page, a project in a drawer with a page in it, an empty board
    await app.evalJs(`(async () => {
      const proj = await window.wrizoCreateProject('The Harbour Book'); const dr = await window.wrizoCreateDrawer('Fiction');
      await window.wrizoSetProjectDrawer(proj.id, dr.id);
      await window.wrizoCreateJournalPage({ id: 'wd-journal', text: 'A journal page about the morning.', createdAt: new Date().toISOString(), origin: 'journal', source: 'page' });
      await window.wrizoCreateJournalPage({ id: 'wd-drawer', text: 'A page filed in a drawer.', createdAt: new Date().toISOString(), origin: null, source: 'page', projectId: proj.id });
      await window.wrizoCreateJournalPage({ id: 'wd-board', text: 'An empty board', createdAt: new Date().toISOString(), origin: null, source: 'page', pageType: 'board', boxes: [] });
      await window.wrizoCreateJournalPage({ id: 'wd-loose', text: 'A loose page with a few words in it.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
      return true; })()`);
    await sleep(500); await app.reload(); await sleep(1200);
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    // W1: the place line, three pages
    await openPage(app, 'wd-loose');   await shot(app, `${id}-W1a-place-line-unfiled`, CRUMB);
    await openPage(app, 'wd-journal'); await shot(app, `${id}-W1b-place-line-journal`, CRUMB);
    await openPage(app, 'wd-drawer');  await shot(app, `${id}-W1c-place-line-drawer`, CRUMB);
    // W2: the Places panel (the rail's Page button opens the cascade's page face)
    await openPage(app, 'wd-loose');
    await app.evalJs(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Pages?$/.test(x.textContent.trim()) || /^Pages?\\b/.test((x.getAttribute('aria-label') || ''))); if (b) b.click(); })()`);
    await waitSoft(app, "!!document.querySelector('.wz-places')", { label: 'places', timeout: 4000 }); await sleep(600);
    await shot(app, `${id}-W2-places-panel`, `() => ({ places: !!document.querySelector('.wz-places'), title: (document.querySelector('.wz-places-title') || {}).textContent || null, radios: [...document.querySelectorAll('.wz-places-radio')].map((e) => e.textContent.trim()) })`);
    // W3: the empty board
    await openPage(app, 'wd-board');
    await shot(app, `${id}-W3-empty-board`, `() => ({ buttons: [...document.querySelectorAll('button')].map((b) => b.textContent.trim().replace(/\\s+/g, ' ')).filter((t) => t && t.length < 40).slice(0, 40), hasPlusPages: !![...document.querySelectorAll('button')].find((b) => /\\+ Pages/.test(b.textContent)), hasPlusFiled: !![...document.querySelectorAll('button')].find((b) => /\\+ Filed Pages/.test(b.textContent)) })`);
    // W8: the left rail on a page
    await openPage(app, 'wd-loose');
    await shot(app, `${id}-W8-left-rail`, `() => ({ rail: [...document.querySelectorAll('button')].map((b) => b.textContent.trim().replace(/\\s+/g, ' ')).filter((t) => /^(Pages?|Plan|Drawers|Journal|Log|Shelf|Settings|Themes|Trash)$/.test(t)) })`);
    // W4: the Tutor, the "?" beside Ask opened  /  W7: the Fragments "?"
    await openPage(app, 'wd-loose');
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await waitSoft(app, "!!document.querySelector(\".wz-tutor-panel[data-open='true']\")", { label: 'tutor open', timeout: 4000 }); await sleep(1100);
    await app.evalJs(`document.querySelector('.wz-drawer-note-btn[aria-label="What travels when you ask"]')?.click()`); await sleep(400);
    await shot(app, `${id}-W4-tutor-ask-note`, `() => { const pop = document.querySelector('.wz-drawer-note-pop'); const panel = document.querySelector('.wz-tutor-panel'); const pr = pop ? pop.getBoundingClientRect() : null; const qr = panel ? panel.getBoundingClientRect() : null; let clipper = null; for (let e = pop && pop.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (/(hidden|clip|auto|scroll)/.test(cs.overflowX + cs.overflowY)) { const r = e.getBoundingClientRect(); if (pr && (pr.left < r.left - 0.5 || pr.right > r.right + 0.5 || pr.top < r.top - 0.5 || pr.bottom > r.bottom + 0.5)) { clipper = { cls: String(e.className).slice(0, 60), overflow: cs.overflowX + '/' + cs.overflowY, ancestor: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] }; break; } } } return { noteText: (pop || {}).textContent || null, noteRect: pr ? [Math.round(pr.left), Math.round(pr.top), Math.round(pr.right), Math.round(pr.bottom)] : null, panelRect: qr ? [Math.round(qr.left), Math.round(qr.top), Math.round(qr.right), Math.round(qr.bottom)] : null, viewport: [innerWidth, innerHeight], insideViewport: !!pr && pr.left >= 0 && pr.top >= 0 && pr.right <= innerWidth && pr.bottom <= innerHeight, clippedByAncestor: clipper, noteButtons: [...document.querySelectorAll('.wz-tutor-panel .wz-drawer-note-btn')].map((b) => b.getAttribute('aria-label')) }; }`);
    await app.evalJs(`document.querySelector('.wz-drawer-note-btn[aria-label="What travels when you ask"]')?.click()`); await sleep(300);
    await app.evalJs(`document.querySelector('.wz-drawer-note-btn[aria-label="About Fragments"]')?.click()`); await sleep(400);
    await shot(app, `${id}-W7-fragments-note`, `() => ({ noteText: (document.querySelector('.wz-drawer-note-pop') || {}).textContent || null })`);
    await app.evalJs(`document.querySelector('.wz-drawer-note-btn[aria-label="About Fragments"]')?.click()`); await sleep(300);
    // W5: the Tutor error with "Try again": the harness double's fail=true, then ask something
    await app.evalJs(`fetch('/api/_tutor_mode', { method: 'POST', body: JSON.stringify({ configured: true, fail: true }) }).then((r) => r.status)`);
    await app.evalJs(`(() => { const t = document.querySelector('.wz-tutor-convo-composer textarea, .wz-tutor-panel textarea, .wz-tutor-panel input[type="text"]'); if (!t) return false; t.focus(); return true; })()`);
    await app.typeKeys('What is the weather in this scene?'); await sleep(200);
    await app.evalJs(`document.querySelector('.wz-tutor-convo-send')?.click()`);
    await waitSoft(app, "!!document.querySelector('.wz-tutor-retry')", { label: 'try again', timeout: 6000 }); await sleep(500);
    await shot(app, `${id}-W5-tutor-error-try-again`, `() => ({ retry: (document.querySelector('.wz-tutor-retry') || {}).textContent || null, status: [...document.querySelectorAll('.wz-tutor-convo-status')].map((e) => e.textContent.trim().replace(/\\s+/g, ' ')) })`);
    await app.evalJs(`fetch('/api/_tutor_mode', { method: 'POST', body: '{}' })`);
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(600);
    // W6: the "..." menu with the Recede "?" opened (the left drawer's instruments menu)
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'left open', timeout: 4000 }); await sleep(1100);
    await app.evalJs("document.querySelector('.wz-sliver-instruments-btn')?.click()"); await sleep(500);
    await app.evalJs(`document.querySelector('.wz-drawer-note-btn[aria-label="About Recede depth"]')?.click()`); await sleep(400);
    await shot(app, `${id}-W6-dots-menu-recede-note`, `() => ({ noteText: (document.querySelector('.wz-drawer-note-pop') || {}).textContent || null, recedeBtn: !!document.querySelector('.wz-drawer-note-btn[aria-label="About Recede depth"]') })`);
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`WORD-DIET FRAMES: ${rows.length} frames -> ${OUT}`);

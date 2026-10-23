// FLUX SCREENS - the ten frames Fable clears the Flux build against (cursor/flux-v2-mockup @ 7a020755): Inputs panel (picker open), the board with its hint + X · Y, the arrival logo, the card pop-up and
// the deck wizard - each in DARK and LIGHT. A capture (frames out, nothing asserted beyond "the surface really appeared": a frame of the wrong screen is worse than none), run on a box turn.
// Run: node scripts/harness/flux-screens.mjs <outDir>      writes <outDir>/<name>-<dark|light>.png (the lane converts to JPEG q80 <= 1400 px before committing, only frames it has LOOKED at)
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2];
if (!out) { console.error('usage: flux-screens.mjs <outDir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');
await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name, tone) => { fs.writeFileSync(path.join(out, `${name}-${tone}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(350); return true; };
  const fresh = async (tone) => {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(700);
    await q("window.wrizoTheme && window.wrizoTheme.set('flux')");
    await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${tone}' })`);
    await sleep(500);
  };
  const seed = async () => {
    await q(`(() => { const d = window.wrizoCreateDrawer('The Late Ferry');
      const man = window.wrizoCreateProject('Manuscript', 'creative'); const wor = window.wrizoCreateProject('Worldbuilding', 'creative');
      window.wrizoSetProjectDrawer(man.id, d.id); window.wrizoSetProjectDrawer(wor.id, d.id);
      [['fx-m1', man.id, 1], ['fx-m2', man.id, 2], ['fx-m3', man.id, 3], ['fx-w1', wor.id, 4]].forEach(([id, pid, at]) => window.wrizoCreateJournalPage({ id, text: 'Chapter ' + at + '\\nThe kettle clicks off and she still does not turn around.', projectId: pid, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:0' + at + '.000Z' }));
      window.wrizoCreateJournalPage({ id: 'fx-board', text: 'Chapter map', pageType: 'board', projectId: man.id, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:05.000Z',
        boxes: [{ id: 'b1', kind: 'text', x: 0.05, y: 0.06, w: 0.22, h: 0.12, z: 1, text: 'Mara at the window\\nShe watches the ferry light before she turns the kettle on.' },
                { id: 'b2', kind: 'text', x: 0.33, y: 0.05, w: 0.2, h: 0.12, z: 2, text: 'The blue cup\\nTheir mother\\'s. He won\\'t say so.' },
                { id: 'b3', kind: 'text', x: 0.18, y: 0.3, w: 0.2, h: 0.12, z: 3, text: 'Second horn\\nThere isn\\'t one. She counts anyway.' },
                { id: 'b4', kind: 'text', x: 0.46, y: 0.28, w: 0.22, h: 0.12, z: 4, text: 'The ferryman\\'s coat\\nHangs by the door.' }] });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
  };
  const open = async (id, sel) => { await q(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${sel}')`, { label: id }); await sleep(900); };
  for (const tone of ['dark', 'light']) {
    // arrival (the logo): the front door, Flux
    await fresh(tone);
    await shot('arrival', tone);
    const logo = await q("(() => { const l = document.querySelector('.wz-arrival .wz-logo'); return l ? l.tagName + ':' + l.textContent : null; })()");
    ok(`[${tone}] arrival: Flux's own WRIZO wordmark is on screen`, logo === 'SPAN:WRIZO', String(logo));
    await seed();
    // Inputs panel, with the picker open
    await open('fx-m2', '.forward-only-editor');
    await q("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900);
    await q("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(600);
    const added = await click('.wz-graft-add'); await sleep(600);
    ok(`[${tone}] inputs: the Inputs tab is open and its picker is showing`, added && (await q("!!document.querySelector('.wz-graft-picker')")), String(added));
    await shot('inputs', tone);
    await q("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    // the page with both panels (the mockup's page-both-panels): the Docs pop-out on the left, the Operator drawer on the right
    await q("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
    await click('.wz-strip [data-category="page"]'); await sleep(700);
    await q("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g && g.getAttribute('data-open') !== 'true') g.click(); })()"); await sleep(900);
    await q("document.querySelector('#wz-tutor-tab-tutor')?.click()"); await sleep(500);
    await waitSoft("!!document.querySelector('.wz-tutor-panel[data-open=\"true\"]')", { label: 'operator drawer', timeout: 3000 });
    ok(`[${tone}] page: the Docs pop-out is open beside the page and the Operator drawer is open`, !!(await q("!!(document.querySelector('.wz-sections') && document.querySelector('.wz-tutor-panel[data-open=\"true\"]'))")), '');
    await shot('page', tone);
    // an EMPTY page (the mockup's flux-light frame: a flat page, no grey bands top and bottom)
    await app.goto('/page/new'); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'empty page' }); await sleep(1200);
    await shot('emptypage', tone);
    // board: a card selected (its knob), the hint and X · Y
    await open('fx-board', '.board-canvas .board-text');
    await click('.board-canvas .board-text'); await sleep(500);
    ok(`[${tone}] board: a card is selected with its knob, the hint and a coordinate on screen`, (await q("!!(document.querySelector('.board-graft-knob svg') && document.querySelector('.flux-board-frame .flux-readout-hint') && document.querySelector('.flux-card-coord'))")), '');
    await shot('board', tone);
    // card pop-up: a real double-click on a hand-typed card
    const cp = await point('.board-canvas .board-text');
    if (cp) await app.doubleClick(cp.x, cp.y);
    const pop = await waitSoft("!!document.querySelector('.board-popup')", { label: 'card popup', timeout: 5000 }); await sleep(600);
    ok(`[${tone}] pop-up: the card's pop-up is open`, pop, String(pop));
    await shot('popup', tone);
    await q("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(500);
    // deck wizard: the first deck preset from the Circuits pop-out
    await click('.wz-strip [data-category="plan"]'); await sleep(500);
    const dk = await click('.wz-sections-preset'); await sleep(900);
    const wiz = await waitSoft("!!document.querySelector('.deck-wizard-dialog')", { label: 'deck wizard', timeout: 6000 }); await sleep(600);
    ok(`[${tone}] wizard: the deck wizard is open (preset pressed: ${dk})`, wiz, String(wiz));
    await shot('wizard', tone);
  }
});
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nFLUX-SCREENS: FAIL - ${failed.length}/${checks.length} (a missing surface means a frame of the wrong screen)` : `\nFLUX-SCREENS: PASS (${checks.length} surfaces shown; frames in ${out})`);
process.exit(failed.length ? 1 : 0);

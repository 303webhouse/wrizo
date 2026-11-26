// VISUAL 1a.2 - RICHER STROKES, PART ONE: any size, any colour (the custom row of the reorg's colour picker), see-through ink. [DATA] D1 (Nick: yes). The three fields ride inside today's
// `strokes` (no migration). Classic drawer (the driver pins the reorg off). Page side: scripts/harness/visual-ink/page.js. Paint rules, browserless: visual-ink-strokes-unit.mjs.
//   R0-R6  what a stroke carries for each control (and that an untouched pen stores exactly what it did before); each brush keeps its own size and see-through
//   R7     after a reload the new fields read back and paint in that colour, see-through (the pixel is read)
//   R8     an old stroke still paints as before; junk in the new fields paints as the default (seeded through window.wrizoPatchEntry)
//   H1-H2  never taller than the sheet, face two lines, with the longer Brushes row, in three themes at 1366 and 1920
//   T3     a colour code typed with real keys never reaches her page, and Enter sets it
// Run: node scripts/harness/visual-1a2.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
import { withHarness } from '../runtime-verify.mjs';

const PAGE = fs.readFileSync(new URL('./visual-ink/page.js', import.meta.url), 'utf8');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);
const add = (list, tag = '') => { for (const c of list) ok(`${c.name}${tag}`, c.pass, c.detail); };

const fresh = async (app, width = 1366, height = 768) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
  await app.evalJs(PAGE);
};
const openInk = (app) => run(app, "await window.__vi.openDrawer(); await window.__vi.instrument('ink'); await window.__vi.sleep(900);");
const reboot = async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page after reload' });
  await sleep(900);
  await app.evalJs(PAGE);
};

await withHarness(async (app) => {
  await fresh(app);
  const id = await run(app, "return await window.__vi.freePage('machina');");
  await openInk(app);
  add(await run(app, `return await window.__vi.richer(${JSON.stringify(id)});`));
  const n = await run(app, `return window.__vi.strokesOf(${JSON.stringify(id)}).findIndex((s) => s.hex === '#2F7D4F' && s.alpha === 0.4);`);
  await reboot(app);
  add(await run(app, `return window.__vi.readBack(${JSON.stringify(id)}, ${n});`));

  // ---- T3: real keys into the colour field ----
  await openInk(app);
  await run(app, "await window.__vi.openRow('colour'); await window.__vi.click('.wz-ink-row-body [data-colour-custom]', 500);");
  await app.typeKeys('884422');
  await app.key('Enter');
  await sleep(2800);
  const typed = await run(app, `window.__vi.flush(); const list = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); return { last: document.querySelector('.wz-ink-last').getAttribute('data-last'), editor: document.querySelector('.forward-only-editor').innerText.trim(), stored: (list.find((e) => e.id === ${JSON.stringify(id)}) || {}).text };`);
  ok('T3: a colour code typed with real keys sets her colour, and not one character reaches her page', typed.last === '#884422' && typed.editor === '' && !typed.stored, typed);

  // ---- old strokes and junk ----
  await fresh(app);
  const old = await run(app, "const id = window.wrizoCreateJournalPage().id; await window.__vi.seedOld(id); return id;");
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(old)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'seeded page' });
  await sleep(900);
  await run(app, "document.querySelector('.desk-mode-tab[data-mode-key=\"freewrite\"]').click(); await window.__vi.sleep(900);");
  add(await run(app, `return window.__vi.oldPaints(${JSON.stringify(old)});`));

  // ---- the tab's size and shape with the longer rows ----
  for (const theme of ['machina', 'plateau', 'flux']) {
    for (const [w, h] of [[1366, 768], [1920, 1080]]) {
      await fresh(app, w, h);
      await run(app, `await window.__vi.freePage(${JSON.stringify(theme)});`);
      await openInk(app);
      add(await run(app, 'return await window.__vi.height();'), ` [${theme}]`);
    }
  }
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
console.log(pass ? `\nVISUAL 1A2 VERIFY: PASS (${checks.length} checks)` : `\nVISUAL 1A2 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

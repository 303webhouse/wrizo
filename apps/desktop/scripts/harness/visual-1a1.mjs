// VISUAL 1a.1 - THE INK TAB'S NEW SHAPE (VISUAL's build list, slice 1; the kit's ink-tab-plan §1). The two-line quick-note face, one Studio door that opens downward, rows that fold away when one
// opens, only built rows, never taller than the sheet, and the drawing code loaded only on the first INK open. Classic drawer (the driver pins the reorg off): in the reorg, Free Write has no Front menu.
// The page side is scripts/harness/visual-ink/page.js (also runnable from the dev server).
//   F1-F15  the shape and what each control does          H1 never taller than the sheet, at 1366 x 768, 1536 x 864 and 1920 x 1080, in Machina, Arbor and Flux
//   L1-L4   what loads: nothing of the ink code on a page with no ink and no INK; all three on the first INK open; the painter alone on a page with saved ink; the ink painted
//   T1-T2   a trusted pen stroke is stored after the face's picks; typing lands after INK and her words are all there
// Run: node scripts/harness/visual-1a1.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
import { withHarness } from '../runtime-verify.mjs';

const PAGE = fs.readFileSync(new URL('./visual-ink/page.js', import.meta.url), 'utf8');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SIZES = [[1366, 768], [1536, 864], [1920, 1080]];

const fresh = async (app, width = 1366, height = 768) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
  await app.evalJs(PAGE);
};
const reboot = async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page after reload' });
  await sleep(700);
  await app.evalJs(PAGE);
};
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);

await withHarness(async (app) => {
  // ---- the loads: a page with no ink, INK never opened ----
  await fresh(app);
  const id = await run(app, "return await window.__vi.freePage('machina');");
  await reboot(app);   // a clean page load ON the page, so nothing an earlier surface fetched is counted
  await run(app, 'await window.__vi.openDrawer();');
  const cold = await run(app, 'return window.__vi.loads();');
  ok('L1: a page with no ink, its drawer open on TEXT, has loaded none of the ink code (painter, tab, stroke input)', cold.painter === 0 && cold.tab === 0 && cold.capture === 0, cold);
  await run(app, "await window.__vi.instrument('ink'); await window.__vi.sleep(900);");
  const warm = await run(app, 'return window.__vi.loads();');
  ok('L2: the first INK open loads all three', warm.painter > 0 && warm.tab > 0 && warm.capture > 0, warm);

  // ---- the shape ----
  for (const c of await run(app, `return await window.__vi.shape(${JSON.stringify(id)});`)) ok(c.name, c.pass, c.detail);

  // ---- trusted pen, then typing ----
  const before = (await run(app, `return window.__vi.strokesOf(${JSON.stringify(id)}).length;`));
  await app.penStroke('.wz-ink-sheet', [{ x: 0.2, y: 0.12 }, { x: 0.4, y: 0.14 }, { x: 0.6, y: 0.12 }]);
  await sleep(700);
  const after = await run(app, `await window.__vi.flush(); const s = window.__vi.strokesOf(${JSON.stringify(id)}); return { n: s.length, last: s[s.length - 1] && { tip: s[s.length - 1].tip, nib: s[s.length - 1].nib, ink: s[s.length - 1].ink, eraser: s[s.length - 1].eraser || false } };`);
  ok('T1: a trusted pen stroke after the face\'s picks is stored with the marker, the broad size and oxblood', after.n === before + 1 && after.last.tip === 'marker' && after.last.nib === 'broad' && after.last.ink === 'oxblood' && after.last.eraser === false, { before, after });

  // ---- the saved ink: a reload loads the painter alone, and paints ----
  await reboot(app);
  const saved = await run(app, "return { loads: window.__vi.loads(), canvas: (() => { const c = document.querySelector('.ink-committed'); return c ? [c.width, c.height] : null; })(), strokes: window.__vi.strokesOf(" + JSON.stringify(id) + ').length };');
  ok('L3: a page with saved ink loads the painter, and not the tab or the stroke input', saved.loads.painter > 0 && saved.loads.tab === 0 && saved.loads.capture === 0, saved);
  ok('L4: and her saved ink is painted (the committed canvas holds a backing store, not one pixel)', !!saved.canvas && saved.canvas[0] > 100 && saved.canvas[1] > 100, saved);
  await run(app, "await window.__vi.openDrawer(); await window.__vi.instrument('ink'); await window.__vi.sleep(600);");
  ok('F16: after a reload Studio starts closed again (a new sitting)', await run(app, "return !!document.querySelector('.wz-ink-studio') && document.querySelector('.wz-ink-studio').getAttribute('aria-expanded') === 'false' && !document.querySelector('.wz-ink-studio-body');"));
  await run(app, "await window.__vi.instrument('text');");
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('The coat was on the train.');
  await sleep(900);
  const typed = await run(app, `await window.__vi.flush(); const list = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); return (list.find((e) => e.id === ${JSON.stringify(id)}) || {}).text;`);
  ok('T2: after INK, typing lands and every word is stored', String(typed || '').includes('The coat was on the train.'), { typed });

  // ---- never taller than the sheet, three sizes, three themes ----
  for (const theme of ['machina', 'plateau', 'flux']) {
    for (const [w, h] of SIZES) {
      await fresh(app, w, h);
      await run(app, `await window.__vi.freePage(${JSON.stringify(theme)}); await window.__vi.openDrawer(); await window.__vi.instrument('ink'); await window.__vi.sleep(500);`);
      for (const c of await run(app, 'return await window.__vi.height();')) ok(`${c.name} [${theme}]`, c.pass, c.detail);
    }
  }
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
console.log(pass ? `\nVISUAL 1A1 VERIFY: PASS (${checks.length} checks)` : `\nVISUAL 1A1 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

// VISUAL 1a - TOUCH SIZE (VISUAL's kit §9: "Big targets for pen and finger: every tool at least 44 px on a touch screen"; Fable, Nov 26: touch screens only, `pointer: coarse`, the mouse look unchanged).
// Real layout under CDP touch emulation, in Machina, Arbor and Flux, on a Page in BUILD and on a Board; the live defaults, as visual-1a3.mjs asks for them.
//   T0      the emulated touch screen answers (pointer: coarse)
//   S1..    every INK tool - the face, Studio, its rows, the brush list, Brushes, Colour with its own-colour field, and the Undo arrow on the sheet - is at least 44 x 44
//   R1..    and every one of them can be reached: not under the sticky face, not cut off sideways, the drawer never wider than itself and never taller than the sheet
//   F1      the Retry button, when the drawing code did not arrive, is as big
//   M1      with a mouse the tab is what it was
// Run: node scripts/harness/visual-1a-touch.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
process.env.WS_REORG = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_FLUX3 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const PAGE = fs.readFileSync(new URL('./visual-ink/page.js', import.meta.url), 'utf8');
const PAGE3 = fs.readFileSync(new URL('./visual-ink/page-1a3.js', import.meta.url), 'utf8');
const PAGE_TOUCH = fs.readFileSync(new URL('./visual-ink/page-touch.js', import.meta.url), 'utf8');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);
const touch = (app, on) => app.cdp('Emulation.setTouchEmulationEnabled', on ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });

const boot = async (app, width, height) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
  await app.evalJs(PAGE);
  await app.evalJs(PAGE3);
  await app.evalJs(PAGE_TOUCH);
};
const page = (app, theme) => run(app, `const id = await window.__vi3.buildPage(${JSON.stringify(theme)}, 'The coat stayed on the seat.'); await window.__vi.sleep(1500); await window.__vi3.inkOnPaper(); await window.__vi.sleep(900); return id;`);
const board = (app, theme) => run(app, `location.hash = '#/'; await window.__vi.sleep(600); window.wrizoTheme.set(${JSON.stringify(theme)}); await window.__vi.sleep(2200); const b = window.wrizoCreateJournalPage({ pageType: 'board', text: 'Touch', boxes: [] }); window.wrizoFlushNow(); location.hash = '#/page/' + b.id; await window.__vi.sleep(2500); await window.__vi.openDrawer(); await window.__vi3.tab('ink'); await window.__vi.sleep(1500); return b.id;`);

await withHarness(async (app) => {
  let n = 0;
  for (const [theme, surface, width, height] of [
    ['machina', 'page', 1366, 768], ['plateau', 'page', 1366, 768], ['flux', 'page', 1366, 768],
    ['machina', 'board', 1366, 768], ['plateau', 'board', 1366, 768], ['flux', 'board', 1366, 768],
    ['machina', 'page', 1100, 700],
  ]) {
    n += 1;
    const tag = `[${theme} ${surface} ${width}]`;
    await boot(app, width, height);
    await touch(app, true);
    if (n === 1) ok('T0: the emulated touch screen answers (pointer: coarse)', await run(app, "return matchMedia('(pointer: coarse)').matches;"));
    await (surface === 'page' ? page : board)(app, theme);
    await app.penStroke(surface === 'page' ? '.wz-ink-sheet' : '.wz-board-ink-sheet', [{ x: 0.3, y: 0.4 }, { x: 0.4, y: 0.45 }, { x: 0.5, y: 0.4 }]);
    await sleep(900);
    const r = await run(app, `return window.__vit.walk(${JSON.stringify(surface)});`);
    ok(`S${n}: every INK tool is at least 44 x 44 on a touch screen ${tag}`, r.seen >= 20 && r.undo && r.small.length === 0, { seen: r.seen, undo: r.undo, small: r.small.slice(0, 12) });
    ok(`R${n}: and every one can be reached, with the drawer no wider than itself and no taller than the sheet ${tag}`, r.unreached.length === 0 && r.wide.length === 0 && r.tall.length === 0, { unreached: r.unreached.slice(0, 8), wide: r.wide.slice(0, 4), tall: r.tall.slice(0, 4) });
    await touch(app, false);
  }

  // ---- the drawing code does not arrive: Retry is a tool too ----
  await boot(app, 1366, 768);
  await touch(app, true);
  await run(app, "await window.__vi3.buildPage('machina', 'Words.');");
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Network.setBlockedURLs', { urls: ['*InkTab-*'] });
  await run(app, "await window.__vi3.tab('ink'); await window.__vi.sleep(2500);");
  const retry = await run(app, "const b = document.querySelector('.wz-ink-retry'); if (!b) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height };");
  ok('F1: the Retry button is as big', !!retry && retry.w >= 43.5 && retry.h >= 43.5, retry);
  await app.cdp('Network.setBlockedURLs', { urls: [] });
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: false });
  await touch(app, false);

  // ---- with a mouse nothing changed ----
  await boot(app, 1366, 768);
  await page(app, 'machina');
  await app.penStroke('.wz-ink-sheet', [{ x: 0.3, y: 0.4 }, { x: 0.5, y: 0.4 }]);
  await sleep(900);
  const m = await run(app, 'return window.__vit.mouse();');
  ok('M1: with a mouse the tab is what it was', m.coarse === false && m.down.h === 24 && m.down.w < 30 && m.dot.w === 20 && m.dot.h === 20 && m.studio.h < 40 && m.undo.w < 40 && m.undo.h < 40, m);
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
console.log(pass ? `\nVISUAL 1A TOUCH VERIFY: PASS (${checks.length} checks)` : `\nVISUAL 1A TOUCH VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

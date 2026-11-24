// BUG #116, THE PROSE HALF (ARBOR; Fable, Nov 23, 7:28 pm): "leave the template doors out on a screenplay until Convert exists ... If prose pages in Arbor also lack those doors,
// that half is a real bug: fix it, red first." Arbor's Front menu takes the templates off FORMAT because they "live in SECTIONS' head menu" (frontTabs.ts), and the kind menu reads none
// of the five the host lends it (DocKindMenu.tsx), so on a prose page Blank and Outline have no door at all. As shipped, with real presses:
//   P0  the fixture: every page opened with its drawer
//   P1  the control: Machina keeps its rows on TEXT and its kind menu gains no Templates fold
//   P2  Arbor, a prose page: the kind menu's Templates fold offers Blank, Outline, Title Page, Bibliography, in that order, no Screenplay (the kind change 1A retired); the current one is
//       marked and every row can be pressed
//   P3  Arbor, an EMPTY prose page: Outline is taken in place (stored, same page, the page's column and paper do not move)
//   P4  Arbor, a page WITH words: Title Page opens a new page, her words are untouched, and one press of the chip returns her
//   P5  Arbor, a screenplay: no Templates fold (Fable's ruling, until Convert exists)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.WS_PLACE = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_REORG = '1';   // as shipped: without this the driver serves __wrizoReorgOff and the old drawer
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const guard = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: THE DRIVER THREW (not a product finding)`, false, String(e).slice(0, 300)); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const j = (x) => JSON.stringify(x);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const OUT = path.join(process.env.RUNNER_TEMP ? path.join(process.env.RUNNER_TEMP, 'suite') : os.tmpdir(), 'bug116-prose');
fs.mkdirSync(OUT, { recursive: true });

const WORDS = 'The first thing she noticed was the quiet.';
const WANT = ['blank', 'outline', 'title', 'bibliography'];
const SCRIPT = { v: 1, scenes: [{ id: 'b116p-h1', heading: { id: 'b116p-h1', t: 'scene', text: '' }, body: [] }] };
const STORED = (id) => `(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${j(id)}) ?? null)`;

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 15000 });
  await app.evalJs(`(() => {
    const W = window, at = '2026-04-01T00:00:00.000Z';
    for (const [id, text] of [['b116p-words', ${j(WORDS)}], ['b116p-words2', ${j(WORDS)}], ['b116p-empty', '']]) W.wrizoCreateJournalPage({ id, text, createdAt: at, source: 'page', origin: 'loose' });
    W.wrizoCreateJournalPage({ id: 'b116p-script', text: '', pageType: 'script', script: ${j(SCRIPT)}, createdAt: at, source: 'page', origin: 'loose' });
    W.wrizoFlushNow();
    return null;
  })()`);
}

async function open(app, theme, id, ready = '.forward-only-editor') {
  await app.evalJs(`window.wrizoTheme.set(${j(theme)}); null`);
  await app.evalJs(`history.replaceState(null, '', '/#/page/${id}'); null`);
  await app.reload();
  if (!(await waitSoft(app, `!!document.querySelector(${j(ready)})`, { label: `${id} in ${theme}`, timeout: 15000 }))) return false;
  await sleep(900);
  if (ready === '.forward-only-editor') { await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null"); await sleep(1200); }
  if (!(await waitSoft(app, "!!document.querySelector('.wz-sliver-grip')", { label: `${id}'s drawer grip`, timeout: 8000 }))) return false;
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(800); }
  return true;
}

// a real press, only once the target is what the pointer would hit
async function press(app, sel) {
  const at = `(() => { const e = document.querySelector(${j(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, t = document.elementFromPoint(x, y); return t && (t === e || e.contains(t)) ? { x: Math.round(x), y: Math.round(y) } : null; })()`;
  let p = null;
  for (let i = 0; i < 15 && !p; i += 1) { p = await app.evalJs(at); if (!p) await sleep(60); }
  if (!p) return false;
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  await sleep(320);
  return true;
}
const menuItems = async (app) => {
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null");
  await sleep(380);
  if (!(await app.evalJs("!!document.querySelector('[data-doc-menu]')"))) await press(app, '.wz-sliver [data-doc-kind]');
  return (await app.evalJs("[...document.querySelectorAll('[data-doc-menu] [data-doc-menu-item]')].map((b) => b.getAttribute('data-doc-menu-item'))")) || [];
};
const openFold = async (app) => {
  const items = await menuItems(app);
  if (!items.includes('templates')) return null;
  if (!(await app.evalJs("!!document.querySelector('[data-doc-sub=\"templates\"]')"))) await press(app, '[data-doc-menu] [data-doc-menu-item="templates"]');
  return app.evalJs(`[...document.querySelectorAll('[data-doc-sub="templates"] [data-template]')].map((b) => { const r = b.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { key: b.getAttribute('data-template'), word: (b.textContent || '').trim(), pressed: b.getAttribute('aria-pressed'), hit: !!t && (t === b || b.contains(t)) }; })`);
};
const RECTS = `(() => Object.fromEntries([['column', '.mode-pagecol'], ['paper', '.mode-page'], ['editor', '.forward-only-editor']].map(([k, s]) => { const e = document.querySelector(s); if (!e) return [k, null]; const r = e.getBoundingClientRect(); return [k, [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10)]; })))()`;
const textRows = (app) => app.evalJs("(document.getElementById('wz-sliver-tab-text')?.click(), [...document.querySelectorAll('.wz-sliver [data-template]')].map((b) => b.getAttribute('data-template')))");

await withHarness(async (app) => {
  await seed(app);
  const opened = {};

  await guard('P1', async () => {
    opened.machina = await open(app, 'machina', 'b116p-words');
    await app.evalJs("document.getElementById('wz-sliver-tab-text')?.click(); null");
    await sleep(400);
    const rows = await textRows(app);
    const items = await menuItems(app);
    ok("P1 the control: Machina keeps its five rows on TEXT and its kind menu has no Templates fold", [...WANT, 'screenplay'].every((k) => rows.includes(k)) && items.length > 0 && !items.includes('templates'), { rows, items });
  });

  await guard('P2', async () => {
    opened.prose = await open(app, 'plateau', 'b116p-words');
    const rows = await openFold(app);
    fs.writeFileSync(path.join(OUT, 'arbor-prose-fold.png'), Buffer.from(await app.screenshot(), 'base64'));
    const fine = !!rows && rows.map((r) => r.key).join() === WANT.join() && rows.every((r) => r.hit && r.word.length > 0) && rows.filter((r) => r.pressed === 'true').map((r) => r.key).join() === 'blank';
    ok('P2 Arbor, a prose page: the Templates fold offers Blank, Outline, Title Page, Bibliography (no Screenplay), Blank marked as current, every row pressable', fine, { rows });
  });

  await guard('P3', async () => {
    opened.empty = await open(app, 'plateau', 'b116p-empty');
    const before = await app.evalJs(RECTS);
    const rows = await openFold(app);
    const pressed = !!rows && await press(app, '[data-doc-sub="templates"] [data-template="outline"]');
    const stored = pressed && await waitSoft(app, `${STORED('b116p-empty')}?.pageSettings?.template === 'outline'`, { label: 'the template stored', timeout: 4000 });
    await sleep(700);
    const after = await app.evalJs(RECTS), hash = await app.evalJs('location.hash');
    const still = j(before.column) === j(after.column) && j(before.paper) === j(after.paper) && !!before.column && !!before.paper;
    ok('P3 Arbor, an empty prose page: Outline is taken in place (stored, the same page, its column and paper unmoved)', pressed && stored && hash === '#/page/b116p-empty' && still, { pressed, stored, hash, before, after });
  });

  await guard('P4', async () => {
    opened.words2 = await open(app, 'plateau', 'b116p-words2');
    const rows = await openFold(app);
    const pressed = !!rows && await press(app, '[data-doc-sub="templates"] [data-template="title"]');
    const left = pressed && await waitSoft(app, "location.hash.startsWith('#/page/new') && location.hash.includes('template=title')", { label: 'a new page', timeout: 5000 });
    await sleep(900);
    const words = await app.evalJs(`${STORED('b116p-words2')}?.text ?? null`);
    const chip = left && await press(app, '.wz-back-to-board');
    const back = chip && await waitSoft(app, "location.hash === '#/page/b116p-words2' && (document.querySelector('.forward-only-editor')?.innerText || '').includes('The first thing')", { label: 'back on her page', timeout: 6000 });
    ok('P4 Arbor, a page with words: Title Page opens a new page, her words are untouched, and one press of the chip returns her', pressed && left && words === WORDS && chip && back, { pressed, left, words, chip, back, hash: await app.evalJs('location.hash') });
  });

  await guard('P5', async () => {
    opened.script = await open(app, 'plateau', 'b116p-script', '.script-el');
    const items = await menuItems(app);
    ok('P5 Arbor, a screenplay: the kind menu has no Templates fold (Fable, until Convert exists)', items.length > 0 && !items.includes('templates'), { items });
  });

  ok('P0 the fixture: every page opened with its drawer', ['machina', 'prose', 'empty', 'words2', 'script'].every((k) => opened[k] === true), opened);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nBUG116-PROSE-TEMPLATES VERIFY: PASS (${checks.length} checks)`
  : `\nBUG116-PROSE-TEMPLATES VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

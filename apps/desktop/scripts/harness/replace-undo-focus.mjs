// AFTER UNDO IN REPLACE, HER NEXT KEY LANDS (POLISH's writing audit on train K, run 45122742598: the Undo button goes when it has nothing left to undo, the focus falls to the body, and her next key went nowhere, 6 of 6 jobs, Arbor and Machina;
// Fable, Nov 22, 11:30 pm: "if her next key is really lost, fix it red first, on top of SCRIPT's script/1-replace-all"). The same rule R4 set for Replace all (Fable, 3:33 pm): the focus stays in the Replace field, keys never go nowhere.
// A REAL mouse press on Undo, because a scripted .click() never moves the focus to the button and so could never lose it. Seeded through the app's own seams. In Machina, and in Arbor through the preview door (so it also runs on a base where Arbor's cells are off).
//   UF1  the Undo press restores the words
//   UF2  the focus is in the Replace field once the page has settled
//   UF3  her next key lands in the Replace field, and the page's words do not change
//   UF4  PAGE IS PRIMARY: the column, paper and editor rects are the same before and after the Undo
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/replace-undo-focus.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const TEXT = 'The toll was paid. The toll rose.';
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const WORDS = "(document.querySelector('.forward-only-editor')?.innerText || '').trim()";
const setInput = (sel, v) => `(() => { const i = document.querySelector(${q(sel)}); if (!i) return false; i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${q(v)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;

/** a writer's press: the pointer goes there, waits until the target is what stands under it, then presses; false if it never does */
async function press(app, sel) {
  const at = `(() => { const e = document.querySelector(${q(sel)}); if (!e || e.disabled) return null; const r = e.getBoundingClientRect(); if (!r.width || !r.height) return null; const x = r.left + r.width / 2, y = r.top + r.height / 2; const h = document.elementFromPoint(x, y); return { x, y, hit: !!h && (h === e || e.contains(h)) }; })()`;
  let p = await app.evalJs(at);
  if (!p) return false;
  await app.mouseMove(p.x, p.y);
  for (let i = 0; i < 20 && !p?.hit; i += 1) { await sleep(100); p = await app.evalJs(at); if (p) await app.mouseMove(p.x, p.y); }
  if (!p?.hit) return false;
  await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y);
  return true;
}

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const shelf = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, shelf.id);
    for (const id of ['uf-machina', 'uf-plateau']) W.wrizoCreateJournalPage({ id, text: ${q(TEXT)}, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: brief.id, orderIndex: id === 'uf-machina' ? 0 : 1 });
    W.wrizoFlushNow();
    return null;
  })()`);
}

async function scenario(app, theme) {
  const id = `uf-${theme}`;
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 });   // item141: the seam is read only after a settle
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1${theme === 'plateau' ? '&reorglift=plateau.top,plateau.back' : ''}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('[data-top-search]')", { label: 'the page and its search door', timeout: 15000 }).catch(() => {});
  await sleep(900);
  const steps = {};
  steps.door = await press(app, '[data-top-search]'); await sleep(700);
  steps.q = await app.evalJs(setInput('[data-search-q]', 'toll')); await sleep(600);
  steps.toggle = await press(app, '[data-replace-toggle]'); await sleep(350);
  steps.withField = await app.evalJs(setInput('input[data-replace-with]', 'fee')); await sleep(250);
  steps.all = await press(app, '[data-replace-all]'); await sleep(900);
  const replaced = await app.evalJs(WORDS);
  const before = await app.evalJs(PAGE);
  steps.undo = await press(app, '[data-replace-undo]'); await sleep(900);
  const restored = await app.evalJs(WORDS);
  const after = await app.evalJs(PAGE);
  const focus = await app.evalJs("(() => { const a = document.activeElement; return { inField: !!a && a.matches('input[data-replace-with]'), active: a ? a.tagName : null }; })()");
  // SUPERSEDED (runs 45125142860 and 45125145885: Input.insertText is not a key: with the focus on the body it still wrote into the page at the old selection, so it hid the lost key the audit's real key events found). The line, verbatim:
  // await app.type('Q'); await sleep(300);
  // [successor] a real, trusted key press, as a writer's
  const K = { key: 'Q', code: 'KeyQ', windowsVirtualKeyCode: 81, nativeVirtualKeyCode: 81, modifiers: 8 };
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...K, text: 'Q', unmodifiedText: 'q' });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...K }); await sleep(300);
  const field = await app.evalJs("document.querySelector('input[data-replace-with]')?.value ?? null");
  const words = await app.evalJs(WORDS);
  const T = theme === 'plateau' ? 'Arbor' : 'Machina';
  ok(`UF1 ${T}: the Undo press restores the words`, Object.values(steps).every((v) => v === true) && replaced === TEXT.replace(/toll/g, 'fee') && restored === TEXT, { steps, replaced, restored });
  ok(`UF2 ${T}: the focus is in the Replace field once the page has settled`, focus.inField === true, focus);
  ok(`UF3 ${T}: her next key lands in the Replace field and the page's words do not change`, field === 'feeQ' && words === TEXT, { field, words });
  ok(`UF4 ${T}: the page's column, paper and editor keep their rects through the Undo`, before !== '-|-|-' && !before.includes('-|') && before === after, { before, after });
}

await withHarness(async (app) => {
  await seed(app);
  await scenario(app, 'machina');
  await scenario(app, 'plateau');
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1200)}`);
const EXPECTED = 8;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREPLACE-UNDO-FOCUS VERIFY: PASS (${checks.length} checks)`
  : `\nREPLACE-UNDO-FOCUS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

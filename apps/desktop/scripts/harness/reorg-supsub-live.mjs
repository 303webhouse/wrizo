// SUPERSCRIPT AND SUBSCRIPT, IN THE APP (reorg-plan-v2, INK queue item 2; the text's half is reorg-supsub-unit.mjs). Machina, ?reorg=1, a Draft page (BUILD), the Front menu's TEXT tab, the styling row.
// The fixture (seams only; WS_PLACE=1): a page ss-1 holding three lines, "Water is H2O", "Area is x2", "Plain words".
//   SS1  the styling row holds B I U S and then the two new buttons, Superscript and Subscript, in that order
//   SS2  with the "2" of H2O selected, Subscript stores "H~2~O" and nothing else changes; pressed again on the same "2" it takes it off; the "2" of x2 under Superscript stores "x^2^"
//   SS3  the page paints them: the subscript's words sit lower and smaller, the superscript's higher and smaller
//   SS4  the pressed button follows the caret: inside the subscript's words Subscript is pressed, Superscript is not; on plain words neither is
//   SS5  PAGE IS PRIMARY: the column, paper and editor rects are the same before and after the presses; the editor is the same node
//   SS6  no new buttons outside the switch: with ?reorg off in Machina, and with it on in Plateau, the row holds no Superscript or Subscript
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-supsub-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const STORED = "((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'ss-1') || {}).text ?? null)";
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const ROW = "(() => { const b = document.querySelector('.wz-sliver .wz-sliver-format--letters'); if (!b) return null; return [...b.querySelectorAll('button')].map((x) => x.getAttribute('data-style-pick') || (x.textContent || '').trim()); })()";
const LIT = "(() => ['sup', 'sub'].map((k) => { const b = document.querySelector('.wz-sliver [data-style-pick=\"' + k + '\"]'); return b ? b.getAttribute('aria-pressed') : null; }))()";

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'ss-1', text: 'Water is H2O\\nArea is x2\\nPlain words', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' }); window.wrizoFlushNow(); null");
}
async function openAt(app, theme, reorg) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '/?${reorg ? 'reorg=1&' : ''}arbor2=0#/page/ss-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
  if (reorg) {
    await app.evalJs('document.querySelector(\'.reorg-top .desk-mode-tab[data-mode-key="draft"]\')?.click(); null'); await sleep(900);
  } else {
    await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find((b) => /draft|build/i.test(b.getAttribute('data-mode-key') || ''))?.click(); null"); await sleep(900);
  }
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-text')?.click(); null"); await sleep(300);
}
// a range of characters inside one line, by that line's words: needle is found in the editor's text, from/to are offsets inside it (a collapsed caret when from === to)
const selectIn = (needle, from, to) => `(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const nodes = []; let n, full = ''; while ((n = w.nextNode())) { nodes.push([n, full.length]); full += n.textContent; } const i = full.indexOf(${q(needle)}); if (i < 0) return false; const at = (k) => { for (let j = nodes.length - 1; j >= 0; j -= 1) if (nodes[j][1] <= k) return [nodes[j][0], k - nodes[j][1]]; return null; }; const a = at(i + ${from}), b = at(i + ${to}); if (!a || !b) return false; getSelection().setBaseAndExtent(a[0], a[1], b[0], b[1]); return true; })()`;
async function stored(app, until) {
  for (let i = 0; i < 25; i += 1) {
    await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(250);
    const v = await app.evalJs(STORED);
    if (until === undefined || v === until) return v;
  }
  return app.evalJs(STORED);
}
const press = (k) => click(`.wz-sliver [data-style-pick="${k}"]`);
const PAINT = "(() => { const one = (sel) => { const e = document.querySelector('.forward-only-editor ' + sel); if (!e) return null; const cs = getComputedStyle(e), pf = parseFloat(getComputedStyle(e.parentElement).fontSize); return { size: Math.round((parseFloat(cs.fontSize) / pf) * 100) / 100, top: Math.round(parseFloat(cs.top) * 10) / 10, text: (e.textContent || '').replace(/[\\^~]/g, '') }; }; return { sup: one('.md-sup'), sub: one('.md-sub') }; })()";

await withHarness(async (app) => {
  await seed(app);
  await openAt(app, 'machina', true);
  const row = await app.evalJs(ROW);
  ok('SS1 the styling row holds B I U S and then Superscript and Subscript, in that order',
    !!row && JSON.stringify(row.slice(0, 6)) === JSON.stringify(['B', 'I', 'U', 'S', 'sup', 'sub']), { row });

  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__ssMark = 1; " + PAGE);
  await app.evalJs(selectIn('H2O', 1, 2)); await sleep(300);
  await app.evalJs(press('sub'));
  const a = await stored(app, 'Water is H~2~O\nArea is x2\nPlain words');
  await app.evalJs(selectIn('H~2~O', 2, 3)); await sleep(300);
  await app.evalJs(press('sub'));
  const b = await stored(app, 'Water is H2O\nArea is x2\nPlain words');
  await app.evalJs(selectIn('x2', 1, 2)); await sleep(300);
  await app.evalJs(press('sup'));
  const c = await stored(app, 'Water is H2O\nArea is x^2^\nPlain words');
  ok('SS2 with the "2" of H2O selected, Subscript stores "H~2~O" and nothing else changes; pressed again on the same "2" it takes it off; the "2" of x2 under Superscript stores "x^2^"',
    a === 'Water is H~2~O\nArea is x2\nPlain words' && b === 'Water is H2O\nArea is x2\nPlain words' && c === 'Water is H2O\nArea is x^2^\nPlain words', { a, b, c });

  await app.evalJs(selectIn('H2O', 1, 2)); await app.evalJs(press('sub'));
  await stored(app, 'Water is H~2~O\nArea is x^2^\nPlain words'); await sleep(500);
  const paint = await app.evalJs(PAINT);
  ok('SS3 the page paints them: the subscript\'s words sit lower and smaller, the superscript\'s higher and smaller',
    !!paint && !!paint.sub && !!paint.sup && paint.sub.text === '2' && paint.sup.text === '2' && paint.sub.size < 1 && paint.sup.size < 1 && paint.sub.top > 0 && paint.sup.top < 0, { paint });

  await app.evalJs(selectIn('H~2~O', 3, 3)); await sleep(400);
  const litSub = await app.evalJs(LIT);
  await app.evalJs(selectIn('Plain words', 3, 3)); await sleep(400);
  const litNone = await app.evalJs(LIT);
  ok('SS4 the pressed button follows the caret: inside the subscript\'s words Subscript is pressed and Superscript is not; on plain words neither is',
    JSON.stringify(litSub) === JSON.stringify(['false', 'true']) && JSON.stringify(litNone) === JSON.stringify(['false', 'false']), { litSub, litNone });

  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__ssMark");
  ok('SS5 PAGE IS PRIMARY: the column, paper and editor rects are the same before and after the presses; the editor is the same node', mark === after && same, { mark, after, same });

  await openAt(app, 'machina', false);
  const off = await app.evalJs(ROW);
  await openAt(app, 'plateau', true);
  const plateau = await app.evalJs(ROW);
  const has = (r) => !!r && r.some((x) => x === 'sup' || x === 'sub');
  ok('SS6 no new buttons outside the switch: with ?reorg off in Machina, and with it on in Plateau, the row holds no Superscript or Subscript', has(off) === false && has(plateau) === false && !!off, { off, plateau });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-SUPSUB-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-SUPSUB-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

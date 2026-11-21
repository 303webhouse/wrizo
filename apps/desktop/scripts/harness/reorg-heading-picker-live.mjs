// THE P / H1 / H2 / H3 PICKER, IN THE APP (reorg-plan-v2, INK queue item 1; the formatter's half is reorg-heading-picker-unit.mjs). Machina, ?reorg=1, a Draft page (BUILD), the Front menu's TEXT tab, "Paragraph" fold.
// The fixture (seams only; WS_PLACE=1): a page hp-1 holding three lines, "Alpha line", "Second line", "Third line".
//   PK1  the Paragraph fold, opened, holds the picker P, H1, H2, H3 in that order above the old H, + and -; P is the pressed one on a plain line
//   PK2  with the caret in line 2: H2 stores "## Second line" and only that line changes; H1 sets "# Second line" (a set, not a toggle); H1 again leaves it; P takes it off; the pressed button follows the line
//   PK3  a selection across all three lines: H3 sets all three, P takes all three off; the words are the same bytes either way
//   PK4  PAGE IS PRIMARY: the column, paper and editor rects are the same before and after the picks; the editor is the same node
//   PK5  no picker outside the switch: with ?reorg off in Machina, and with it on in Plateau, the fold's picker is not there
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-heading-picker-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const STORED = "((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'hp-1') || {}).text ?? null)";
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const PICKER = "(() => { const g = document.querySelector('.wz-sliver [data-para-picker]'); if (!g) return null; return [...g.querySelectorAll('[data-para-pick]')].map((b) => [b.getAttribute('data-para-pick'), (b.textContent || '').trim(), b.getAttribute('aria-pressed')]); })()";

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'hp-1', text: 'Alpha line\\nSecond line\\nThird line', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' }); window.wrizoFlushNow(); null");
}
async function openAt(app, theme, reorg) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '/?${reorg ? 'reorg=1&' : ''}arbor2=0#/page/hp-1'); null`);
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
const openFold = async (app) => { await app.evalJs(`(() => { const b = document.querySelector('.wz-sliver [data-text-fold="paragraph"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); return null; })()`); await sleep(300); };
// the caret in a line (by its first words), or the whole page selected
const caretIn = (words) => `(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const i = n.textContent.indexOf(${q(words)}); if (i >= 0) { const s = getSelection(); s.setBaseAndExtent(n, i + 3, n, i + 3); return true; } } return false; })()`;
const selectAllText = "(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); return true; })()";
async function stored(app, until) {
  for (let i = 0; i < 25; i += 1) {
    await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(250);
    const v = await app.evalJs(STORED);
    if (until === undefined || v === until) return v;
  }
  return app.evalJs(STORED);
}
const press = (act) => click(`.wz-sliver [data-para-pick="${act}"]`);

await withHarness(async (app) => {
  await seed(app);
  await openAt(app, 'machina', true);
  await openFold(app);
  const p0 = await app.evalJs(PICKER);
  const order = await app.evalJs("(() => { const f = document.querySelector('.wz-sliver [data-text-fold-body=\"paragraph\"]'); if (!f) return null; const pk = f.querySelector('[data-para-picker]'), hd = f.querySelector('.wz-sliver-format:not([data-para-picker])'); return !!pk && !!hd && !!(pk.compareDocumentPosition(hd) & Node.DOCUMENT_POSITION_FOLLOWING) && !!hd.querySelector('.mode-tbtn'); })()");
  ok('PK1 the Paragraph fold, opened, holds the picker P, H1, H2, H3 in that order above the old H, + and -; P is the pressed one on a plain line',
    !!p0 && JSON.stringify(p0.map((b) => b[0] + ':' + b[1])) === JSON.stringify(['para:P', 'h1:H1', 'h2:H2', 'h3:H3']) && p0[0][2] === 'true' && p0.slice(1).every((b) => b[2] === 'false') && order === true, { p0, order });

  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__hpMark = 1; " + PAGE);
  await app.evalJs(caretIn('Second')); await sleep(300);
  await app.evalJs(press('h2'));
  const a = await stored(app, 'Alpha line\n## Second line\nThird line');
  const lit2 = await app.evalJs(PICKER);
  await app.evalJs(caretIn('Second')); await app.evalJs(press('h1'));
  const b = await stored(app, 'Alpha line\n# Second line\nThird line');
  await app.evalJs(caretIn('Second')); await app.evalJs(press('h1'));
  const c = await stored(app);
  await app.evalJs(caretIn('Second')); await app.evalJs(press('para'));
  const d = await stored(app, 'Alpha line\nSecond line\nThird line');
  const litP = await app.evalJs(PICKER);
  ok('PK2 with the caret in line 2: H2 stores "## Second line" and only that line changes; H1 sets "# Second line" (a set, not a toggle); H1 again leaves it; P takes it off; the pressed button follows the line',
    a === 'Alpha line\n## Second line\nThird line' && !!lit2 && lit2.find((x) => x[0] === 'h2')[2] === 'true' && b === 'Alpha line\n# Second line\nThird line' && c === 'Alpha line\n# Second line\nThird line' && d === 'Alpha line\nSecond line\nThird line' && !!litP && litP[0][2] === 'true', { a, b, c, d, lit2, litP });

  await app.evalJs(selectAllText); await app.evalJs(press('h3'));
  const e = await stored(app, '### Alpha line\n### Second line\n### Third line');
  await app.evalJs(selectAllText); await app.evalJs(press('para'));
  const f = await stored(app, 'Alpha line\nSecond line\nThird line');
  ok('PK3 a selection across all three lines: H3 sets all three, P takes all three off; the words are the same bytes either way',
    e === '### Alpha line\n### Second line\n### Third line' && f === 'Alpha line\nSecond line\nThird line', { e, f });

  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__hpMark");
  ok('PK4 PAGE IS PRIMARY: the column, paper and editor rects are the same before and after the picks; the editor is the same node', mark === after && same, { mark, after, same });

  await openAt(app, 'machina', false); await openFold(app);
  const off = await app.evalJs("!!document.querySelector('.wz-sliver [data-para-picker]')");
  await openAt(app, 'plateau', true); await openFold(app);
  const plateau = await app.evalJs("!!document.querySelector('.wz-sliver [data-para-picker]')");
  ok('PK5 no picker outside the switch: with ?reorg off in Machina, and with it on in Plateau, the picker is not there', off === false && plateau === false, { off, plateau });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 5;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-HEADING-PICKER-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-HEADING-PICKER-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

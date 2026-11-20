// THE TEAM B RESTYLE, slice 5: THE TEXT TAB'S FOLDS (Fable, Nov 20, 1:27 pm: "the TEXT tab's Paragraph ▸ and Insert Symbol ▸ folding"; the stage
// menus, draft 3, TEXT's layout: "Style: Bold · Italic · Underline · Strike (always shown). Paragraph ▸ (folded): P · H1 · H2 · H3 · Block Quote ·
// Bullets · Numbers · Indent · Spacing · Alignment. More ▸ (folded): ... Insert Symbol ▸: ™ · © · ® · — · – · § · ¶ · † · ‡ · • · … · ° · ± · × ·
// ÷ · ← · →"). Machina, ?reorg=1, BUILD. Paragraph folds today's own controls (no new act); a symbol goes in at her caret the way a typed one does
// (the button never takes the focus from the page). Switch off, the TEXT drawer is today's, unfolded.
//
// The fixture (seams only; WS_PLACE=1): a set "Novel" with one Part, wt-1 "Chapter one".
//
// FOLDS  X1  BUILD, the TEXT tab: Bold, Italic, Underline and Strike shown; "Paragraph" and "More" folded (aria-expanded false), nothing of
//            theirs drawn
//        X2  Paragraph opened holds today's controls: the heading, bullets, quote, outdent, indent, spacing and the three alignments; its Quote
//            still quotes the caret's line ("> Chapter one" stored)
//        X3  More ▸ Insert Symbol ▸ lists the 17 symbols in order; "—" with the caret after "Chapter" puts "—" there in the stored text, and the
//            focus stays in the page
// PAGE   X4  the page's rects and editor node are the same with the folds opened and closed
// OFF    X5  switch off, Machina: the TEXT drawer's format rows are today's, unfolded (no Paragraph or More fold)
// WORDS  W1  every new word is a lexicon key, Machina's headings in Title Case
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-b-text.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SYMBOLS = ['™', '©', '®', '—', '–', '§', '¶', '†', '‡', '•', '…', '°', '±', '×', '÷', '←', '→'];
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const STORED = "((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'wt-1') || {}).text || '')";
const caretAt = (n) => `(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); let left = ${n};
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) { const len = t.data.length; if (left <= len) { const r = document.createRange(); r.setStart(t, left); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); return true; } left -= len; }
  return false; })()`;
// a press the way a hand makes it: mousedown (which the rail cancels, so the page keeps its caret), then the click
const press = (sel) => `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b || b.disabled) return false;
  const d = new MouseEvent('mousedown', { bubbles: true, cancelable: true }); b.dispatchEvent(d); if (!d.defaultPrevented) document.activeElement?.blur?.(); b.click(); return true; })()`;
async function settle(app) { await sleep(400); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500); }

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  return app.evalJs(`(() => {
    const W = window;
    const drawer = W.wrizoCreateDrawer('Fiction');
    const novel = W.wrizoCreateProject('Novel'); W.wrizoSetProjectDrawer(novel.id, drawer.id);
    W.wrizoCreateJournalPage({ id: 'wt-1', text: 'Chapter one', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: novel.id, orderIndex: 0 });
    W.wrizoFlushNow();
    return { ok: true };
  })()`);
}
async function openText(app, reorg) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/wt-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
  const tab = reorg ? ".reorg-top .desk-mode-tab[data-mode-key=\"draft\"]" : ".desk-mode-tab[data-mode-key=\"draft\"]";
  await app.evalJs(`document.querySelector(${JSON.stringify(tab)})?.click(); null`); await sleep(1000);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  if (reorg) { await app.evalJs("document.getElementById('wz-sliver-tab-text')?.click(); null"); await sleep(400); }
}
const FOLDS = `(() => { const s = document.querySelector('.wz-sliver'); if (!s) return null; const f = (k) => { const b = s.querySelector('[data-text-fold="' + k + '"]'); const body = s.querySelector('[data-text-fold-body="' + k + '"]');
    return b ? { expanded: b.getAttribute('aria-expanded'), word: (b.textContent || '').replace(/[▸▾]/g, '').trim(), drawn: !!body && !body.hidden && body.getBoundingClientRect().height > 0 } : null; };
  const style = [...s.querySelectorAll('.wz-sliver-format--letters .mode-tbtn')].slice(0, 4).map((b) => b.getAttribute('title'));
  return { paragraph: f('paragraph'), more: f('more'), symbols: f('symbols'), style,
    paraControls: [...s.querySelectorAll('[data-text-fold-body="paragraph"] [data-format-glyph], [data-text-fold-body="paragraph"] .mode-tbtn')].map((b) => b.getAttribute('data-format-glyph') || b.getAttribute('title')) }; })()`;

await withHarness(async (app) => {
  await seed(app);
  await openText(app, true);
  const f0 = await app.evalJs(FOLDS);
  ok('X1 BUILD, the TEXT tab: Bold, Italic, Underline, Strike shown; "Paragraph" and "More" folded, nothing of theirs drawn',
    !!f0 && f0.style.length === 4 && !!f0.paragraph && f0.paragraph.word === 'Paragraph' && f0.paragraph.expanded === 'false' && !f0.paragraph.drawn
      && !!f0.more && f0.more.word === 'More' && f0.more.expanded === 'false' && !f0.more.drawn, f0);

  const r0 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__btMark = 1; return null; })()");
  await app.evalJs("document.querySelector('[data-text-fold=\"paragraph\"]')?.click(); null"); await sleep(300);
  const f1 = await app.evalJs(FOLDS);
  const r1 = await app.evalJs(PAGE);
  await app.evalJs(caretAt(3)); await sleep(150);
  await app.evalJs(press('[data-text-fold-body="paragraph"] .mode-tbtn[data-format-act="quote"]'));
  await settle(app);
  const quoted = await app.evalJs(STORED);
  const want = ['outdent', 'indent', 'align-left', 'align-center', 'align-right'];
  ok('X2 Paragraph opened holds today\'s controls (heading, bullets, quote, outdent, indent, spacing, the alignments); its Quote still quotes the caret\'s line',
    !!f1 && f1.paragraph.expanded === 'true' && f1.paragraph.drawn && want.every((w) => f1.paraControls.includes(w)) && f1.paraControls.length >= 9 && quoted === '> Chapter one', { f1, quoted });

  // undo the quote through the same control, so the next check starts from the plain line
  await app.evalJs(caretAt(3)); await sleep(150);
  await app.evalJs(press('[data-text-fold-body="paragraph"] .mode-tbtn[data-format-act="quote"]')); await settle(app);
  const plain = await app.evalJs(STORED);
  await app.evalJs("document.querySelector('[data-text-fold=\"more\"]')?.click(); null"); await sleep(250);
  await app.evalJs("document.querySelector('[data-text-fold=\"symbols\"]')?.click(); null"); await sleep(250);
  const syms = await app.evalJs("[...document.querySelectorAll('[data-text-fold-body=\"symbols\"] [data-symbol]')].map((b) => b.getAttribute('data-symbol'))");
  await app.evalJs(caretAt('Chapter'.length)); await sleep(150);
  await app.evalJs(press('[data-text-fold-body="symbols"] [data-symbol="—"]'));
  await settle(app);
  const after = await app.evalJs(STORED);
  const focusIn = await app.evalJs("!!document.activeElement && !!document.activeElement.closest('.forward-only-editor')");
  const r2 = await app.evalJs(PAGE);
  const same = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__btMark");
  ok('X3 More ▸ Insert Symbol ▸ lists the 17 symbols in order; "—" after "Chapter" goes into the stored text there, and the focus stays in the page',
    plain === 'Chapter one' && JSON.stringify(syms) === JSON.stringify(SYMBOLS) && after === 'Chapter— one' && focusIn, { plain, syms, after, focusIn });
  ok('X4 the page\'s rects and editor node are the same with the folds opened and closed', r0 === r1 && r1 === r2 && same, { r0, r1, r2, same });

  await openText(app, false);
  const off = await app.evalJs("(() => ({ folds: document.querySelectorAll('[data-text-fold]').length, rows: document.querySelectorAll('.wz-sliver .wz-sliver-format').length }))()");
  ok('X5 switch off, Machina: the TEXT drawer\'s format rows are today\'s, unfolded (no Paragraph or More fold)', off.folds === 0 && off.rows >= 3, off);
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const used = ['components/Sliver.tsx', 'reorg/TextFolds.tsx'].map((f) => fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '').join('\n');
  const need = ['reorgTextParagraph', 'reorgTextMore', 'reorgTextSymbols', 'reorgTextSymbolAria'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !used.includes(`'${k}'`));
  const title = ["reorgTextParagraph: 'Paragraph'", "reorgTextMore: 'More'", "reorgTextSymbols: 'Insert Symbol'"].filter((s) => !canon.includes(s));
  ok('W1 every new word is a lexicon key; the folds read Paragraph, More, Insert Symbol', missing.length === 0 && title.length === 0, { missing, title });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-B-TEXT VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-B-TEXT VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

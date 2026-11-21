// FOOTNOTES AND ENDNOTES, IN THE APP (reorg-plan-v2, INK queue item 3; Nick ruled A, Nov 21; the text's half is reorg-footnotes-unit.mjs, the formatter's reorg-footnotes-act-unit.mjs, the export's reorg-footnotes-export-unit.mjs).
// Machina, ?reorg=1, a Draft page (BUILD), the Front menu's TEXT tab, More ▸. The fixture (seams only; WS_PLACE=1): a page fn-1 holding "Water is wet" and "Plain words"; a page fn-2 holding words with a footnote and an endnote written out.
//   FN1  More ▸ holds the Footnote and Endnote buttons, in that order, before Insert Symbol
//   FN2  with the caret after "Water", Footnote stores "Water[^1] is wet" and an empty note line "[^1]: " at the end; the caret is ON that note line, so what she types next is the note
//   FN3  the page sets the note line apart: its words are smaller than the line above (the .md-note wrapper); nothing is hidden (the stored text still holds every character)
//   FN4  Endnote with the caret after "Plain" stores [^e1] and the next free note line "[^e1]: "; a caret inside the notes presses Footnote and nothing changes
//   FN5  what goes out: the Markdown, Plain Text and Web files read the notes at the Part's end (footnote numbered 1) and the endnote at the Doc's end (numbered i), through the one publication seam
//   FN6  PAGE IS PRIMARY: the column, paper and editor rects are the same before and after the presses; the editor is the same node
//   FN7  no new buttons outside the switch: with ?reorg off in Machina, and with it on in Plateau, no Footnote or Endnote button stands
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-footnotes-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const STORED = "((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'fn-1') || {}).text ?? null)";
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const NOTE_BTNS = "[...document.querySelectorAll('.wz-sliver [data-note-pick]')].map((b) => b.getAttribute('data-note-pick'))";
const ORDER = "(() => { const body = document.querySelector('.wz-sliver [data-text-fold-body=\"more\"]'); if (!body) return null; return [...body.querySelectorAll('[data-note-pick], [data-text-fold=\"symbols\"]')].map((x) => x.getAttribute('data-note-pick') || x.getAttribute('data-text-fold')); })()";
const SEED2 = 'Cite this[^1] and that[^e1].\n\n[^1]: Foot note.\n[^e1]: End note.';

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'fn-1', text: 'Water is wet\\nPlain words', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' }); window.wrizoCreateJournalPage({ id: 'fn-2', text: " + q(SEED2) + ", createdAt: '2026-04-02T00:00:00.000Z', source: 'page', origin: 'loose' }); window.wrizoFlushNow(); null");
}
async function openAt(app, theme, reorg) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '/?${reorg ? 'reorg=1&' : ''}arbor2=0#/page/fn-1'); null`);
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
const selectIn = (needle, from, to) => `(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const nodes = []; let n, full = ''; while ((n = w.nextNode())) { nodes.push([n, full.length]); full += n.textContent; } const i = full.indexOf(${q(needle)}); if (i < 0) return false; const at = (k) => { for (let j = nodes.length - 1; j >= 0; j -= 1) if (nodes[j][1] <= k) return [nodes[j][0], k - nodes[j][1]]; return null; }; const a = at(i + ${from}), b = at(i + ${to}); if (!a || !b) return false; getSelection().setBaseAndExtent(a[0], a[1], b[0], b[1]); return true; })()`;
async function stored(app, until) {
  for (let i = 0; i < 25; i += 1) {
    await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(250);
    const v = await app.evalJs(STORED);
    if (until === undefined || v === until) return v;
  }
  return app.evalJs(STORED);
}
const press = (k) => click(`.wz-sliver [data-note-pick="${k}"]`);

await withHarness(async (app) => {
  await seed(app);
  await openAt(app, 'machina', true);
  await app.evalJs(click('.wz-sliver [data-text-fold="more"]')); await sleep(300);
  const btns = await app.evalJs(NOTE_BTNS);
  const order = await app.evalJs(ORDER);
  ok('FN1 More holds the Footnote and Endnote buttons, in that order, before Insert Symbol', JSON.stringify(btns) === JSON.stringify(['footnote', 'endnote']) && JSON.stringify(order) === JSON.stringify(['footnote', 'endnote', 'symbols']), { btns, order });

  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__fnMark = 1; " + PAGE);
  await app.evalJs(selectIn('Water', 5, 5)); await sleep(300);
  await app.evalJs(press('footnote'));
  const a = await stored(app, 'Water[^1] is wet\nPlain words\n\n[^1]: ');
  await app.evalJs("document.querySelector('.forward-only-editor').focus(); document.execCommand('insertText', false, 'my note'); null");
  const b = await stored(app, 'Water[^1] is wet\nPlain words\n\n[^1]: my note');
  ok('FN2 with the caret after "Water", Footnote stores "Water[^1] is wet" and an empty note line at the end, the caret on that line: what she types next is the note',
    a === 'Water[^1] is wet\nPlain words\n\n[^1]: ' && b === 'Water[^1] is wet\nPlain words\n\n[^1]: my note', { a, b });

  await sleep(400);
  const SET = "(() => { const n = document.querySelector('.forward-only-editor .md-note'); if (!n) return null; const cs = parseFloat(getComputedStyle(n).fontSize), ps = parseFloat(getComputedStyle(n.parentElement).fontSize); return { ratio: Math.round((cs / ps) * 100) / 100, text: (n.textContent || '').slice(0, 20) }; })()";
  const apart = await app.evalJs(SET);
  ok('FN3 the page sets the note line apart: its words are smaller than the lines above, and nothing is hidden (every character is stored)', !!apart && apart.ratio < 1 && apart.text.startsWith('[^1]'), { apart });

  await app.evalJs(selectIn('Plain words', 5, 5)); await sleep(300);
  await app.evalJs(press('endnote'));
  const c = await stored(app, 'Water[^1] is wet\nPlain[^e1] words\n\n[^1]: my note\n[^e1]: ');
  await app.evalJs(selectIn('my note', 2, 2)); await sleep(300);
  await app.evalJs(press('footnote')); await sleep(400);
  const d = await stored(app);
  ok('FN4 Endnote after "Plain" stores [^e1] and the next free note line; a caret inside the notes presses Footnote and nothing changes',
    c === 'Water[^1] is wet\nPlain[^e1] words\n\n[^1]: my note\n[^e1]: ' && d === c, { c, d });

  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__fnMark");
  // the editor's own HEIGHT follows its words (a note adds lines, as typing does), so the editor is held to its left, top and width and the column and paper to their whole rects
  const held = (s) => { const p = s.split('|'); return [p[0], p[1], p[2].split(',').slice(0, 3).join(',')].join('|'); };
  ok('FN6 PAGE IS PRIMARY: the column and paper rects are the same before and after the presses, the editor keeps its left, top and width (its height follows its words, as typing does); the editor is the same node', held(mark) === held(after) && same, { mark, after, same });

  const out = await app.evalJs("(() => { const P = window.wrizoPublish; if (!P) return null; const f = (fmt) => { const r = P.file('fn-2', fmt, null); return r ? r.content : null; }; return { md: f('md'), txt: f('txt'), html: f('html') }; })()");
  ok('FN5 what goes out: Markdown, Plain Text and Web read the footnote at the Part\'s end (numbered 1) and the endnote at the Doc\'s end (numbered i)',
    !!out && out.md === 'Cite this[^1] and that[^i].\n\n[^1]: Foot note.\n\n[^i]: End note.\n'
      && out.txt === 'Cite this[1] and that[i].\n\n[1] Foot note.\n\n[i] End note.\n'
      && typeof out.html === 'string' && out.html.includes('<sup id="fnref-1"><a href="#fn-1">1</a></sup>') && out.html.includes('id="en-i"') && out.html.indexOf('id="fn-1"') < out.html.indexOf('id="en-i"'), { out });

  await openAt(app, 'machina', false);
  const off = await app.evalJs(NOTE_BTNS);
  await openAt(app, 'plateau', true);
  const plateau = await app.evalJs(NOTE_BTNS);
  ok('FN7 no new buttons outside the switch: with ?reorg off in Machina, and with it on in Plateau, no Footnote or Endnote button stands', Array.isArray(off) && off.length === 0 && Array.isArray(plateau) && plateau.length === 0, { off, plateau });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 7;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-FOOTNOTES-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-FOOTNOTES-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

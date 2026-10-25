// POLISH #10, FIX item 4 - SIZE FOLLOWS THE SELECTION, in the real app (Nick ruled A, Oct 25). With words highlighted, the drawer's size `-` / `+` /
// number apply ONLY to them - even one character - stored as `[words]{.size-N}` (one span with the face's class where both meet); with nothing
// highlighted, or "Whole document" ("Whole card") chosen by hand, the size is the page's (the card's) and every size span goes. Per theme (Arbor, Flux),
// real presses on the drawer:
//   PAGE  Z1 nothing highlighted: `+` sizes the page (pageSettings.size), the text gains no mark (the whole path, unchanged)
//         Z2 words highlighted: `+` sizes ONLY them - stored `[counted gulls]{.size-N}`, painted at N points (the rest at the page's), the marks hidden,
//            the words still highlighted, the number showing N; the rows' shadow agrees (ledger 79)
//         Z3 ONE character highlighted takes a size alone
//         Z4 one Ctrl+Z undoes a size pick, whole
//         Z5 a face picked on the sized words keeps the size - one span, both classes - and paints both
//         Z6 "Whole document" then `+`: the page's size moves and every size span goes (the faces stay)
//         Z7 the span paints in Revise and in Free Write too (every surface that draws the page's text)
//   CARD  Z8 in a card, a highlighted `+` sizes only those words - stored in the card's text - and the card's face on the board paints it
// Mutant (Arbor): MZ the span's own size overridden (inherit) - Z2's paint fails.
// The text rules (merge, split, both classes, the readers, the stale tab) are polish10-size-core.mjs's.
// Run: WS_BOX_TURN=<token> node scripts/harness/polish10-size.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';
import { trustedDispatch, hittablePointBy } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const press = (app, expr, what) => trustedDispatch(app, expr, what, { report: ok });
const ED = '.forward-only-editor';
const CE = '.board-popup-editor';
const TEXT = 'The ferry was late, so Ada counted gulls instead of minutes.';
const PT = 4 / 3;   // one point in layout px (page units at scale 1)

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1280, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
};
const setTheme = async (app, theme) => { if (theme === 'flux') { await app.evalJs("window.wrizoTheme.set('flux')"); await sleep(250); } };
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${J(id)})||{})`);
const settledBy = async (read) => { await sleep(2600); let last = J(await read()); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = J(await read()); same = n === last ? same + 1 : 0; last = n; } return JSON.parse(last); };
const highlight = (app, sel, words, offset = 0, len = null) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); if (!ed) return false; ed.focus();
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n; const want = ${J(words)};
  while ((n = w.nextNode())) { if (n.parentElement && n.parentElement.closest('.md-mark-hidden')) continue; const i = n.data.indexOf(want);
    if (i >= 0) { const s0 = i + ${offset}; const r = document.createRange(); r.setStart(n, s0); r.setEnd(n, s0 + ${len == null ? 'want.length' : len}); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } }
  return false; })()`);
const caretToEnd = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
const PLUS = (root) => `[...document.querySelectorAll('${root} .wz-type .wz-type-step')].pop()`;
const rowExpr = (root, name) => `[...document.querySelectorAll('${root} .wz-type-row')].find(r => r.textContent === ${J(name)})`;
// the sized span: its words, its painted size (layout px), its family, its marks' sizes, the text beside it, the number field
const spanState = (app, sel, words) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); if (!ed) return null;
  const spans = [...ed.querySelectorAll('.md-font')]; const s = spans.find(x => [...x.childNodes].filter(c => !(c.nodeType === 1 && c.classList.contains('md-mark-hidden'))).map(c => c.textContent).join('') === ${J(words)}) || spans[0];
  if (!s) return { none: true, sel: String(getSelection()) };
  const wordsOf = [...s.childNodes].filter(c => !(c.nodeType === 1 && c.classList.contains('md-mark-hidden'))).map(c => c.textContent).join('');
  return { words: wordsOf, size: parseFloat(getComputedStyle(s).fontSize), family: getComputedStyle(s).fontFamily, marks: [...s.querySelectorAll(':scope > .md-mark-hidden')].map(m => getComputedStyle(m).fontSize),
    around: parseFloat(getComputedStyle(ed).fontSize), sel: String(getSelection()), num: document.querySelector('.wz-type-num') ? document.querySelector('.wz-type-num').value : null }; })()`);
const rowsState = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); if (!ed) return null; return { rows: ed.querySelectorAll(':scope > .wz-row').length, mismatches: (window.__wzRowsMismatches || []).length }; })()`);
const near = (a, b, t = 0.6) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= t;

await withHarness(async (app) => {
  for (const theme of ['plateau', 'flux']) {
    const T = `[${theme}]`;
    const id = `p10s-page-${theme}`;
    await freshDesk(app);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/${id}'`);
    const up = await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'Draft page' }).then(() => true, () => false);
    ok(`${T} (setup) the Draft page opens`, up);
    if (!up) continue;
    await setTheme(app, theme);
    await sleep(500);
    if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') await press(app, "document.querySelector('.wz-sliver-grip')", 'the drawer grip');
    await sleep(500);

    // Z1 nothing highlighted: the page's own size
    await caretToEnd(app); await sleep(200);
    await press(app, PLUS('.wz-sliver'), 'the size + (nothing highlighted)');
    const e1 = await settledBy(() => stored(app, id));
    ok(`${T} Z1: nothing highlighted - + sizes the PAGE (12 -> 13) and the text gains no mark`, e1.text === TEXT && e1.pageSettings && e1.pageSettings.size === 13, J({ text: e1.text, size: e1.pageSettings && e1.pageSettings.size }));

    // Z2 words highlighted
    await highlight(app, ED, 'counted gulls'); await sleep(300);
    await press(app, PLUS('.wz-sliver'), 'the size + (words highlighted)');
    await sleep(600);
    const s2 = await spanState(app, ED, 'counted gulls');
    const e2 = await settledBy(() => stored(app, id));
    ok(`${T} Z2: ONLY the highlighted words take the size - stored [counted gulls]{.size-14}, the page still 13`, e2.text === 'The ferry was late, so Ada [counted gulls]{.size-14} instead of minutes.' && e2.pageSettings.size === 13, J({ text: e2.text, size: e2.pageSettings && e2.pageSettings.size }));
    ok(`${T} Z2: painted at 14 points (the page's text at 13), the marks hidden, the words still highlighted, the number showing 14`,
      !!s2 && !s2.none && s2.words === 'counted gulls' && near(s2.size, 14 * PT) && near(s2.around, 13 * PT) && s2.marks.every((m) => m === '0px') && s2.sel === 'counted gulls' && s2.num === '14', J(s2));
    const r2 = await rowsState(app);
    ok(`${T} Z2 + ROWS: the pick is written through the rows - the row model's shadow agrees with the page`, !!r2 && r2.rows >= 1 && r2.mismatches === 0, J(r2));
    if (theme === 'plateau') {
      await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p10s-mz'; s.textContent = '.md-font{ font-size: inherit !important; }'; document.head.appendChild(s); return true; })()"); await sleep(200);
      const sm = await spanState(app, ED, 'counted gulls');
      await app.evalJs("document.getElementById('p10s-mz')?.remove()");
      ok(`MZ (mutant): with the span's own size overridden (LANDED: painted ${sm && sm.size}px), Z2's paint fails`, !!sm && near(sm.size, sm.around) && !near(sm.size, 14 * PT), J(sm));
    }

    // Z4 one Ctrl+Z undoes it
    await app.keyCombo('z');
    const e4 = await settledBy(() => stored(app, id));
    ok(`${T} Z4: ONE Ctrl+Z undoes the size pick, whole`, e4.text === TEXT, J(e4.text));

    // Z3 one character
    await highlight(app, ED, 'Ada', 0, 1); await sleep(300);
    await press(app, PLUS('.wz-sliver'), 'the size + (one character highlighted)');
    const e3 = await settledBy(() => stored(app, id));
    ok(`${T} Z3: ONE character highlighted takes a size alone - [A]{.size-14}da`, e3.text === 'The ferry was late, so [A]{.size-14}da counted gulls instead of minutes.', J(e3.text));
    await app.keyCombo('z'); await settledBy(() => stored(app, id));

    // Z5 a face on the sized words keeps the size
    await highlight(app, ED, 'counted gulls'); await sleep(300);
    await press(app, PLUS('.wz-sliver'), 'the size + (again)'); await sleep(500);
    await highlight(app, ED, 'counted gulls'); await sleep(300);
    await press(app, rowExpr('.wz-sliver', 'Courier Prime'), 'the Courier Prime row'); await sleep(600);
    const s5 = await spanState(app, ED, 'counted gulls');
    const e5 = await settledBy(() => stored(app, id));
    ok(`${T} Z5: a face picked on the sized words keeps their size - ONE span, both classes - and paints both`,
      e5.text === 'The ferry was late, so Ada [counted gulls]{.font-courier-prime .size-14} instead of minutes.' && !!s5 && /Courier Prime/.test(s5.family) && near(s5.size, 14 * PT), J({ text: e5.text, s5 }));

    // Z7 the span paints in Revise and in Free Write
    for (const [key, name] of [['revise', 'Revise'], ['freewrite', 'Free Write']]) {
      await app.evalJs(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')?.click()`); await sleep(1200);
      const s7 = await spanState(app, ED, 'counted gulls');
      ok(`${T} Z7 (${name}): the span paints at its size there too`, !!s7 && !s7.none && near(s7.size, 14 * PT), J(s7));
    }
    await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()"); await sleep(1200);
    if ((await app.evalJs("document.querySelector('.wz-sliver-panel')?.dataset.open")) !== 'true') await press(app, "document.querySelector('.wz-sliver-grip')", 'the drawer grip');
    await sleep(400);

    // Z6 Whole document then +: the page's size moves, every size span goes, the face stays
    await highlight(app, ED, 'counted gulls'); await sleep(300);
    await press(app, "document.querySelector('.wz-sliver .wz-type-scope[data-scope=\"whole\"]')", 'the "Whole document" scope'); await sleep(250);
    await press(app, PLUS('.wz-sliver'), 'the size + (Whole document)');
    const e6 = await settledBy(() => stored(app, id));
    ok(`${T} Z6: "Whole document" then + - the page's size moves (13 -> 14) and every size span goes; the face stays`,
      e6.pageSettings && e6.pageSettings.size === 14 && e6.text === 'The ferry was late, so Ada [counted gulls]{.font-courier-prime} instead of minutes.', J({ text: e6.text, size: e6.pageSettings && e6.pageSettings.size }));

    // ======================== CARD ========================
    const bid = `p10s-board-${theme}`;
    await freshDesk(app);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: bid, text: 'Size board', pageType: 'board', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page',
      boxes: [{ id: `${bid}-c`, kind: 'text', x: 0.08, y: 0.08, w: 0.42, h: 0.16, z: 1, text: TEXT }] })})`);
    await sleep(400);
    await app.evalJs(`location.hash = '#/page/${bid}'`);
    await app.waitFor(`!!document.querySelector('[data-box-id="${bid}-c"]')`, { label: 'the card' }).catch(() => {});
    await setTheme(app, theme);
    await sleep(500);
    const cp = await hittablePointBy(app, `document.querySelector('[data-box-id="${bid}-c"] .board-text')`);
    if (cp && cp.found) await app.doubleClick(cp.x, cp.y);
    const open = await app.waitFor(`!!document.querySelector('${CE}')`, { label: 'card popup' }).then(() => true, () => false);
    ok(`${T} (setup) a real double-click opens the card`, open);
    if (!open) continue;
    await sleep(300);
    if (!(await app.evalJs("!!document.querySelector('.board-popup-dock .wz-type')"))) await press(app, "document.querySelector('.board-popup-dock-grip')", "the card's styling dock grip");
    await sleep(350);
    await highlight(app, CE, 'counted gulls'); await sleep(300);
    await press(app, PLUS('.board-popup-dock'), "the card's size + (words highlighted)"); await sleep(600);
    const c8 = await spanState(app, CE, 'counted gulls');
    await app.key('Escape'); await sleep(500);
    const card = await settledBy(async () => ((await stored(app, bid)).boxes || [])[0] || null);
    const face = await app.evalJs(`(() => { const s = document.querySelector('[data-box-id="${bid}-c"] .md-font'); return s ? { size: parseFloat(getComputedStyle(s).fontSize), around: parseFloat(getComputedStyle(s.parentElement).fontSize) } : null; })()`);
    ok(`${T} Z8 CARD: a highlighted + sizes ONLY those words - stored in the card's text as a size span, the card's own size unchanged`,
      !!card && /^The ferry was late, so Ada \[counted gulls\]\{\.size-\d+(\.5)?\} instead of minutes\.$/.test(card.text) && !card.fontSize, J({ text: card && card.text, fontSize: card && card.fontSize, c8 }));
    ok(`${T} Z8 CARD: the card's face on the board paints the span larger than the words around it`, !!face && face.size > face.around + 0.5, J(face));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-SIZE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-SIZE VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-SIZE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

// WRITING-SURFACE S0 STEP 3 (Nick, 2026-09-24) + Fable's four follow-ups, in the browser with real keys.
//   NESTED   a mark inside another PAINTS (`__*x*__`, `***x***`), markers collapsed, every character kept.
//   ONE READER  the page and the formatter agree on what a run is: "2 * 3 * 4" shows its stars, and Italic on the 3 wraps only
//            the 3 (it used to pair the formatter's copy of the reader with the two literal stars and delete them).
//   EMPTY PAIR  Italic at a caret inside `**|**` inserts its own pair instead of stripping one star each side.
//   INDENT   an indented paragraph HANGS: wrapped lines return to the indent, not the margin.
//   TAB      (a) measured: the page view remounts per id, so Tab still indents after page-to-page navigation; (b) Tab during IME
//            composition is left to the IME.
// Run: node scripts/harness/writing-r3.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const seed = (app, id, text) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
const openPage = async (app, id, mode = 'Draft') => {
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  await app.click(mode); await sleep(800);
};
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const settled = async (app, id) => { await sleep(2200); let last = await stored(app, id); let same = 0; for (let i = 0; i < 40 && same < 8; i += 1) { await sleep(150); const n = await stored(app, id); same = n === last ? same + 1 : 0; last = n; } return last; };
// a selection over [start,end) of the editor's text, made in page script (the KEY that acts on it below is a real, trusted one)
const select = (app, start, end) => app.evalJs(`(() => {
  const el = document.querySelector('${ED}'); el.focus();
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, seen = 0; let sN = null, sO = 0, eN = null, eO = 0;
  while ((n = w.nextNode())) { const L = n.data.length;
    if (!sN && seen + L >= ${start}) { sN = n; sO = ${start} - seen; }
    if (!eN && seen + L >= ${end}) { eN = n; eO = ${end} - seen; }
    seen += L; }
  const r = document.createRange(); r.setStart(sN, sO); r.setEnd(eN || sN, eN ? eO : sO);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);

await withHarness(async (app) => {
  // ---- NESTED + ONE READER: what the page paints ----
  await freshDesk(app);
  seed(app, 'n1', '__*nested*__ and ***both*** and 2 * 3 * 4 and *real*');
  await sleep(600);
  await app.reload();
  await openPage(app, 'n1');
  const d = await app.evalJs(`(() => {
    const ed = document.querySelector('${ED}');
    const u = ed.querySelector('.md-underline .md-italic'); const b = ed.querySelector('.md-bold .md-italic');
    const italics = [...ed.querySelectorAll('.md-italic')].map(e => e.textContent.replace(/[*_]/g, ''));
    const visibleMarks = [...ed.querySelectorAll('.md-mark')].filter(m => !m.classList.contains('md-mark-hidden')).map(m => m.textContent);
    return { nestedUnderlineItalic: !!u, nestedBoldItalic: !!b, italics, visibleMarks, text: ed.textContent };
  })()`);
  ok('[NESTED] `__*nested*__` paints underline AND italic (an italic inside an underline)', d.nestedUnderlineItalic, JSON.stringify(d));
  ok('[NESTED] `***both***` paints bold AND italic', d.nestedBoldItalic, JSON.stringify(d));
  ok('[ONE READER] "2 * 3 * 4" is text: the only italics on the page are the three real runs, and none of them is " 3 "', d.italics.length === 3 && !d.italics.some(t => t.trim() === '3'), JSON.stringify(d.italics));
  ok('[ONE READER] nothing is left visible as a stray marker except the literal stars of "2 * 3 * 4"', JSON.stringify(d.visibleMarks) === '[]', JSON.stringify(d.visibleMarks));
  ok('[STORAGE] every character survives the painted page', d.text === '__*nested*__ and ***both*** and 2 * 3 * 4 and *real*', JSON.stringify(d.text));

  // ---- ONE READER: the formatter agrees with the page ----
  await freshDesk(app);
  seed(app, 'n2', '2 * 3 * 4');
  await sleep(600);
  await app.reload();
  await openPage(app, 'n2');
  await select(app, 4, 5);                     // the 3
  await app.keyCombo('i'); await sleep(300);
  let st = await settled(app, 'n2');
  ok('[ONE READER] Italic on the 3 wraps ONLY the 3 - the literal stars are neither deleted nor paired with it', st === '2 * *3* * 4', JSON.stringify(st));
  await app.keyCombo('i'); await sleep(300);
  st = await settled(app, 'n2');
  ok('[ONE READER] ...and a second Italic restores the text exactly', st === '2 * 3 * 4', JSON.stringify(st));

  // ---- EMPTY PAIR ----
  await freshDesk(app);
  seed(app, 'n3', 'ab');
  await sleep(600);
  await app.reload();
  await openPage(app, 'n3');
  await select(app, 1, 1);
  await app.keyCombo('b'); await sleep(300);
  await app.keyCombo('i'); await sleep(300);
  st = await settled(app, 'n3');
  ok('[EMPTY PAIR] Bold then Italic at a bare caret builds `a******b` (was: Italic stripped a star from each side, leaving `a**b`)', st === 'a******b', JSON.stringify(st));
  await app.keyCombo('i'); await sleep(300);
  st = await settled(app, 'n3');
  ok('[EMPTY PAIR] Italic again removes only the italic pair', st === 'a****b', JSON.stringify(st));
  await app.keyCombo('b'); await sleep(300);
  st = await settled(app, 'n3');
  ok('[EMPTY PAIR] Bold again removes the bold pair, back to the original', st === 'ab', JSON.stringify(st));

  // ---- THE INDENT HANGS ----
  await freshDesk(app);
  const LONG = 'A paragraph long enough that it certainly wraps onto a second and a third line inside the page column, so that we can see where the continuation lines begin.';
  seed(app, 'n4', `\t\t${LONG}`);
  await sleep(600);
  await app.reload();
  for (const mode of ['Draft', 'Free Write']) {
    await openPage(app, 'n4', mode);
    const g = await app.evalJs(`(() => {
      const ed = document.querySelector('${ED}'); const cs = getComputedStyle(ed);
      const inner = ed.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
      const lineStarts = []; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!n.data.includes('A paragraph')) continue;
        const r = document.createRange(); r.selectNodeContents(n);
        const rects = [...r.getClientRects()].filter(x => x.width > 1);
        const byTop = new Map(); for (const x of rects) { const k = Math.round(x.top); byTop.set(k, Math.min(byTop.get(k) ?? 1e9, x.left)); }
        for (const [t, l] of [...byTop.entries()].sort((a, b) => a[0] - b[0])) lineStarts.push(l);
      }
      const em = parseFloat(cs.fontSize);
      return { inner, lineStarts, em, tabSize: cs.tabSize };
    })()`);
    const lvl = 2 * 2 * g.em;   // two levels of 2em
    ok(`[INDENT] [${mode}] a two-level indented paragraph wraps onto 3+ lines (fixture sanity)`, g.lineStarts.length >= 3, JSON.stringify(g));
    ok(`[INDENT] [${mode}] the FIRST line's text starts one indent (2 levels) in from the margin`, g.lineStarts.length > 0 && Math.abs((g.lineStarts[0] - g.inner) - lvl) < 3, JSON.stringify({ first: g.lineStarts[0] - g.inner, want: lvl }));
    ok(`[INDENT] [${mode}] every WRAPPED line starts at that same edge (it hangs; it does not return to the margin)`, g.lineStarts.length >= 2 && g.lineStarts.slice(1).every(l => Math.abs(l - g.lineStarts[0]) < 3), JSON.stringify(g.lineStarts.map(l => Math.round(l - g.inner))));
  }

  // ---- TAB: page to page ----
  await freshDesk(app);
  seed(app, 'tA', 'First page paragraph.');
  seed(app, 'tB', 'Second page paragraph.');
  await sleep(700);
  await app.reload();
  await openPage(app, 'tA');
  await app.evalJs("location.hash = '#/page/tB'");                    // SPA navigation - no reload
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'B framed' });
  await sleep(800);
  await app.click('Draft'); await sleep(800);
  await select(app, 3, 3);
  await app.key('Tab');
  st = await settled(app, 'tB');
  ok('[TAB] after page-to-page navigation (no reload) Tab still INDENTS on the new page - the page view remounts per id, so the listener follows the new editor', st === '\tSecond page paragraph.', JSON.stringify(st));
  const fic = await app.evalJs(`(() => { const el = document.querySelector('${ED}'); return el.contains(document.activeElement); })()`);
  ok('[TAB] ...and focus stayed in the editor', fic === true);

  // ---- TAB during composition ----
  const comp = await app.evalJs(`(() => {
    const el = document.querySelector('${ED}');
    const mk = (composing) => { const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true, isComposing: composing }); el.dispatchEvent(e); return e.defaultPrevented; };
    return { composing: mk(true), ordinary: mk(false) };
  })()`);
  ok('[TAB] a Tab keydown that is part of an IME composition is NOT taken (left to the IME)', comp.composing === false, JSON.stringify(comp));
  ok('[TAB] control: an ordinary Tab keydown IS taken on the same editor', comp.ordinary === true, JSON.stringify(comp));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nWRITING-R3 VERIFY: PASS (${checks.length} checks)` : `\nWRITING-R3 VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

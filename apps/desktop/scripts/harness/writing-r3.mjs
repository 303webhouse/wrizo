// WRITING-SURFACE S0 STEP 3 + Fable's follow-ups + Nick's Tab ruling (2026-09-25), in the browser with real keys.
//   NESTED      a mark inside another PAINTS (`__*x*__`, `***x***`), markers collapsed, every character kept.
//   ONE READER  the page and the formatter agree on what a run is: "2 * 3 * 4" shows its stars, and Italic on the 3 wraps only the 3.
//   EMPTY PAIR  Italic at a caret inside `**|**` inserts its own pair instead of stripping one star each side.
//   INDENT      a leading tab is a FIRST-LINE indent: one 2em step per tab, wrapped lines back at the margin. Three Tabs = three levels.
//   BLOCK       Tab HELD + 1 indents the WHOLE paragraph one level per press (`>| `, wrapped lines follow); Shift variants go back.
//   ROLLOVER    a quick Tab,1 (a numbered list) types its 1 - measured either side of the 200 ms hold threshold.
//   FREE WRITE  Tab acts on a blank line only; nothing outdents; the 1 is just typed where the chord may not act.
//   TAB         the page view remounts per id (Tab works after page-to-page navigation); Tab during IME composition is left alone.
// Run: node scripts/harness/writing-r3.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const HOLD = 200;

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const seed = (app, id, text, origin = 'loose') => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin })})`);
const openPage = async (app, id, mode = 'Draft') => {
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  await app.click(mode); await sleep(800);
};
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const settled = async (app, id) => { await sleep(2200); let last = await stored(app, id); let same = 0; for (let i = 0; i < 40 && same < 8; i += 1) { await sleep(150); const n = await stored(app, id); same = n === last ? same + 1 : 0; last = n; } return last; };
const select = (app, start, end) => app.evalJs(`(() => {
  const el = document.querySelector('${ED}'); el.focus();
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, seen = 0; let sN = null, sO = 0, eN = null, eO = 0;
  while ((n = w.nextNode())) { const L = n.data.length;
    if (!sN && seen + L >= ${start}) { sN = n; sO = ${start} - seen; }
    if (!eN && seen + L >= ${end}) { eN = n; eO = ${end} - seen; }
    seen += L; }
  const r = document.createRange(); r.setStart(sN, sO); r.setEnd(eN || sN, eN ? eO : sO);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);

// raw key events with real timing (the chord is a matter of HOW LONG a key is held, so the driver must control it)
const kev = (app, type, o) => app.cdp('Input.dispatchKeyEvent', { type, ...o });
const TAB = (shift) => ({ key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: shift ? 8 : 0 });
const ONE = (shift, typed) => ({ key: shift ? '!' : '1', code: 'Digit1', windowsVirtualKeyCode: 49, nativeVirtualKeyCode: 49, modifiers: shift ? 8 : 0, ...(typed ? { text: shift ? '!' : '1' } : {}) });
const tapTab = async (app, shift = false) => { await kev(app, 'rawKeyDown', TAB(shift)); await kev(app, 'keyUp', TAB(shift)); await sleep(150); };
const holdTabThenOnes = async (app, shift, holdMs, ones = 1) => {
  await kev(app, 'rawKeyDown', TAB(shift));
  await sleep(holdMs);
  for (let i = 0; i < ones; i += 1) { await kev(app, 'rawKeyDown', ONE(shift, false)); await kev(app, 'keyUp', ONE(shift, false)); await sleep(80); }
  await kev(app, 'keyUp', TAB(shift));
  await sleep(200);
};
const rollover = async (app, overlapMs) => {   // Tab down, then a TYPING 1 down after overlapMs, both released
  await kev(app, 'rawKeyDown', TAB(false));
  await sleep(overlapMs);
  await kev(app, 'keyDown', ONE(false, true));
  await kev(app, 'keyUp', TAB(false));
  await kev(app, 'keyUp', ONE(false, true));
  await sleep(200);
};

await withHarness(async (app) => {
  let st;
  // ---- NESTED + ONE READER: what the page paints ----
  await freshDesk(app);
  seed(app, 'n1', '__*nested*__ and ***both*** and 2 * 3 * 4 and *real* and >|x and a >| b');
  await sleep(600);
  await app.reload();
  await openPage(app, 'n1');
  const d = await app.evalJs(`(() => {
    const ed = document.querySelector('${ED}');
    const u = ed.querySelector('.md-underline .md-italic'); const b = ed.querySelector('.md-bold .md-italic');
    const italics = [...ed.querySelectorAll('.md-italic')].map(e => e.textContent.replace(/[*_]/g, ''));
    const visibleMarks = [...ed.querySelectorAll('.md-mark')].filter(m => !m.classList.contains('md-mark-hidden')).map(m => m.textContent);
    return { nestedUnderlineItalic: !!u, nestedBoldItalic: !!b, italics, visibleMarks, blocks: ed.querySelectorAll('.md-block').length, text: ed.textContent };
  })()`);
  ok('[NESTED] `__*nested*__` paints underline AND italic (an italic inside an underline)', d.nestedUnderlineItalic, JSON.stringify(d));
  ok('[NESTED] `***both***` paints bold AND italic', d.nestedBoldItalic, JSON.stringify(d));
  ok('[ONE READER] "2 * 3 * 4" is text: the only italics on the page are the three real runs, and none of them is " 3 "', d.italics.length === 3 && !d.italics.some(t => t.trim() === '3'), JSON.stringify(d.italics));
  ok('[ONE READER] nothing is left visible as a stray marker', JSON.stringify(d.visibleMarks) === '[]', JSON.stringify(d.visibleMarks));
  ok('[UNTOUCHED] ordinary prose that merely contains `>|x` or `a >| b` is NOT a block indent (no existing page changes)', d.blocks === 0, String(d.blocks));
  ok('[STORAGE] every character survives the painted page', d.text === '__*nested*__ and ***both*** and 2 * 3 * 4 and *real* and >|x and a >| b', JSON.stringify(d.text));

  // ---- ONE READER: the formatter agrees with the page ----
  await freshDesk(app);
  seed(app, 'n2', '2 * 3 * 4');
  await sleep(600);
  await app.reload();
  await openPage(app, 'n2');
  await select(app, 4, 5);
  await app.keyCombo('i'); await sleep(300);
  st = await settled(app, 'n2');
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

  // ---- THE INDENT LOOK + THREE TABS = THREE LEVELS ----
  await freshDesk(app);
  const LONG = 'A paragraph long enough that it certainly wraps onto a second and a third line inside the page column, so that we can see where the continuation lines begin.';
  seed(app, 'n4', LONG);
  await sleep(600);
  await app.reload();
  await openPage(app, 'n4');
  await select(app, 3, 3);
  await tapTab(app); await tapTab(app); await tapTab(app);
  st = await settled(app, 'n4');
  ok('[INDENT] three Tab taps are THREE levels in the stored text ("keep indenting further, even if already indented")', st === `\t\t\t${LONG}`, JSON.stringify(st && st.slice(0, 20)));
  const geo = () => app.evalJs(`(() => {
    const ed = document.querySelector('${ED}'); const cs = getComputedStyle(ed);
    const inner = ed.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
    const starts = []; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { if (!n.data.includes('A paragraph')) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      const byTop = new Map(); for (const x of [...r.getClientRects()].filter(x => x.width > 1)) { const k = Math.round(x.top); byTop.set(k, Math.min(byTop.get(k) ?? 1e9, x.left)); }
      for (const [, l] of [...byTop.entries()].sort((a, b) => a[0] - b[0])) starts.push(l - inner);
    }
    return { starts, em: parseFloat(cs.fontSize) };
  })()`);
  let g = await geo();
  ok('[INDENT] the paragraph wraps to 3+ lines (fixture sanity)', g.starts.length >= 3, JSON.stringify(g));
  ok('[INDENT] a leading tab is a FIRST-LINE indent: the first line starts 3 steps of 2em in, and every WRAPPED line returns to the margin', g.starts.length >= 3 && Math.abs(g.starts[0] - 3 * 2 * g.em) < 3 && g.starts.slice(1).every(l => Math.abs(l) < 3), JSON.stringify({ starts: g.starts.map(Math.round), want: 3 * 2 * g.em }));
  await tapTab(app, true);
  st = await settled(app, 'n4');
  ok('[INDENT] Shift+Tab takes ONE first-line level back', st === `\t\t${LONG}`, JSON.stringify(st && st.slice(0, 20)));

  // ---- BLOCK: Tab held + 1 ----
  await freshDesk(app);
  seed(app, 'b1', LONG);
  await sleep(600);
  await app.reload();
  await openPage(app, 'b1');
  await select(app, 3, 3);
  await holdTabThenOnes(app, false, HOLD * 2);
  st = await settled(app, 'b1');
  ok(`[BLOCK] Tab held ${HOLD * 2} ms then 1 indents the WHOLE paragraph one level: a \`>| \` token in the stored text, and NO typed "1" and NO stray tab`, st === `>| ${LONG}`, JSON.stringify(st && st.slice(0, 20)));
  await holdTabThenOnes(app, false, HOLD * 2);
  st = await settled(app, 'b1');
  ok('[BLOCK] a second chord is a second level', st === `>| >| ${LONG}`, JSON.stringify(st && st.slice(0, 20)));
  g = await geo();
  ok('[BLOCK] the block is painted: every line (the wrapped ones too) sits two levels of 2em in, marker collapsed', g.starts.length >= 3 && g.starts.every(l => Math.abs(l - 2 * 2 * g.em) < 4), JSON.stringify({ starts: g.starts.map(Math.round), want: 2 * 2 * g.em }));
  await holdTabThenOnes(app, true, HOLD * 2);
  st = await settled(app, 'b1');
  ok('[BLOCK] Shift+Tab held + 1 takes ONE block level back', st === `>| ${LONG}`, JSON.stringify(st && st.slice(0, 20)));
  await select(app, 5, 5);
  await holdTabThenOnes(app, false, HOLD * 2, 2);
  st = await settled(app, 'b1');
  ok('[BLOCK] one level per PRESS of the 1 while Tab stays held (two presses = two levels)', st === `>| >| >| ${LONG}`, JSON.stringify(st && st.slice(0, 24)));

  // ---- ROLLOVER: a quick Tab,1 types its 1 ----
  await freshDesk(app);
  seed(app, 'r1', 'Second page paragraph.');
  await sleep(600);
  await app.reload();
  await openPage(app, 'r1');
  await select(app, 3, 3);
  await rollover(app, 60);
  st = await settled(app, 'r1');
  ok('[ROLLOVER] Tab then 1 overlapping by 60 ms (a numbered list) is a TAB followed by a typed 1 - not a block indent that eats the 1', st === '\tSec1ond page paragraph.', JSON.stringify(st));
  await freshDesk(app);
  seed(app, 'r2', 'Second page paragraph.');
  await sleep(600);
  await app.reload();
  await openPage(app, 'r2');
  await select(app, 3, 3);
  await rollover(app, HOLD - 60);
  st = await settled(app, 'r2');
  ok(`[ROLLOVER] just UNDER the threshold (${HOLD - 60} ms) is still a rollover: the 1 types`, st === '\tSec1ond page paragraph.', JSON.stringify(st));
  await freshDesk(app);
  seed(app, 'r3', 'Second page paragraph.');
  await sleep(600);
  await app.reload();
  await openPage(app, 'r3');
  await select(app, 3, 3);
  await holdTabThenOnes(app, false, HOLD + 120);
  st = await settled(app, 'r3');
  ok(`[ROLLOVER] just OVER the threshold (${HOLD + 120} ms) is a chord: block indent, no 1 typed`, st === '>| Second page paragraph.', JSON.stringify(st));
  // an auto-repeating held Tab is one level
  await freshDesk(app);
  seed(app, 'r4', 'Second page paragraph.');
  await sleep(600);
  await app.reload();
  await openPage(app, 'r4');
  await select(app, 3, 3);
  await kev(app, 'rawKeyDown', TAB(false));
  for (let i = 0; i < 6; i += 1) { await sleep(60); await kev(app, 'rawKeyDown', { ...TAB(false), autoRepeat: true }); }
  await kev(app, 'keyUp', TAB(false));
  st = await settled(app, 'r4');
  ok('[REPEAT] holding Tab (auto-repeat) is ONE level, not a spray of them', st === '\tSecond page paragraph.', JSON.stringify(st));

  // ---- FREE WRITE: blank line only ----
  await freshDesk(app);
  seed(app, 'f1', 'Written line.');
  await sleep(600);
  await app.reload();
  await openPage(app, 'f1', 'Free Write');
  await app.evalJs(`(() => { const el = document.querySelector('${ED}'); el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
  await tapTab(app);
  st = await settled(app, 'f1');
  ok('[FREE WRITE] Tab on a WRITTEN line changes nothing (a leading tab would land behind the caret)', st === 'Written line.', JSON.stringify(st));
  await rollover(app, HOLD * 2);   // Tab held past the threshold, then a TYPING 1
  st = await settled(app, 'f1');
  ok('[FREE WRITE] Tab held + 1 on a written line is NOT a block indent - the chord may not act there, so the 1 is simply TYPED (the stored text gains the 1, and no block token)', st === 'Written line.1', JSON.stringify(st));
  await app.typeKeys('\n');
  await sleep(300);
  await tapTab(app);
  await tapTab(app);
  st = await settled(app, 'f1');
  ok('[FREE WRITE] on a BLANK line each Tab is a level (an insertion at the caret): two taps, two tabs', st === 'Written line.1\n\t\t', JSON.stringify(st));
  await holdTabThenOnes(app, false, HOLD * 2);
  st = await settled(app, 'f1');
  ok('[FREE WRITE] Tab held + 1 on a blank line inserts a block level at the caret (and types no 1)', st === 'Written line.1\n\t\t>| ', JSON.stringify(st));
  await tapTab(app, true);
  await holdTabThenOnes(app, true, HOLD * 2);
  st = await settled(app, 'f1');
  ok('[FREE WRITE] Shift+Tab and Shift+Tab+1 are inert - an outdent is a deletion, and nothing deletes behind the caret here', st === 'Written line.1\n\t\t>| ', JSON.stringify(st));

  // ---- TAB: page to page; IME ----
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
  await tapTab(app);
  st = await settled(app, 'tB');
  ok('[TAB] after page-to-page navigation (no reload) Tab still INDENTS on the new page - the page view remounts per id, so the listener follows the new editor', st === '\tSecond page paragraph.', JSON.stringify(st));
  const fic = await app.evalJs(`(() => { const el = document.querySelector('${ED}'); return el.contains(document.activeElement); })()`);
  ok('[TAB] ...and focus stayed in the editor', fic === true);
  const comp = await app.evalJs(`(() => {
    const el = document.querySelector('${ED}');
    const mk = (composing) => { const e = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true, isComposing: composing }); el.dispatchEvent(e); return e.defaultPrevented; };
    return { composing: mk(true), ordinary: mk(false) };
  })()`);
  ok('[TAB] a Tab keydown that is part of an IME composition is NOT taken (left to the IME)', comp.composing === false, JSON.stringify(comp));
  ok('[TAB] control: an ordinary Tab keydown IS taken on the same editor', comp.ordinary === true, JSON.stringify(comp));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nWRITING-R3 VERIFY: PASS (${checks.length} checks)` : `\nWRITING-R3 VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

// ITEM 211 S0 - MEASURE what the CURRENT editor does when its style markers are ALWAYS hidden (Nick: "A - Never show").
// A survey, not a verdict: it prints one row per question. Run by hand on a granted box turn:
//   node scripts/writing-hidden-marker-probe.mjs        (from apps/desktop, dist-web built)
//
// HOW "ALWAYS HIDDEN" IS SIMULATED without building anything: a probe-only stylesheet forces every `.md-mark` to `font-size:0;opacity:0`
// (what `.md-mark-hidden` already is), so the markers that the reveal-at-caret would un-collapse stay collapsed. Everything else is the
// shipped editor. The questions are Fable's list:
//   P1 caret       does ArrowLeft/Right step over a hidden marker in ONE press, or stop on the invisible characters?
//   P2 edge typing at the end of a styled word, does a typed character land inside or outside the pair - and can a writer choose?
//   P3 backspace   Backspace right after a hidden opening marker: does it eat one `*` (leaving a broken pair)?
//   P4 delete      Delete right before a hidden closing marker, the same.
//   P5 copy        what text does a copy of a styled selection carry (Selection.toString, and what a `copy` event sees)?
//   P6 cut/paste   a real cut then a real paste elsewhere: the stored text on each side.
//   P7 IME         a composition typed at the edge of a styled word (CDP Input.imeSetComposition through app.ime).
import { withHarness } from './runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const rows = [];
const row = (id, what, result) => { rows.push({ id, what, result }); console.log(`${id}  ${what}\n      -> ${JSON.stringify(result)}`); };

const kev = (app, type, o) => app.cdp('Input.dispatchKeyEvent', { type, ...o });
const KEY = { ArrowLeft: 37, ArrowRight: 39, Backspace: 8, Delete: 46 };
const press = async (app, key, mods = 0) => { const p = { key, code: key, windowsVirtualKeyCode: KEY[key], nativeVirtualKeyCode: KEY[key], modifiers: mods }; await kev(app, 'rawKeyDown', p); await kev(app, 'keyUp', p); await sleep(120); };
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const settled = async (app, id) => { await sleep(2200); let last = await stored(app, id); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = await stored(app, id); same = n === last ? same + 1 : 0; last = n; } return last; };
// the caret's RAW offset (hidden characters counted) and the text either side of it, in one read
const caret = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); const s = getSelection(); if (!s.rangeCount || !ed.contains(s.anchorNode)) return null;
  const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset);
  const off = r.toString().length; const t = ed.textContent; return { off, around: t.slice(Math.max(0, off - 3), off) + '|' + t.slice(off, off + 3) };
})()`);
const put = (app, off) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); ed.focus();
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, seen = 0, node = null, o = 0;
  while ((n = w.nextNode())) { if (seen + n.data.length >= ${off}) { node = n; o = ${off} - seen; break; } seen += n.data.length; }
  const r = document.createRange(); r.setStart(node, o); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);

await withHarness(async (app) => {
  const open = async (id, text) => {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
    await sleep(600);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page' });
    await sleep(500);
    await app.click('Draft'); await sleep(800);
    await app.evalJs("(() => { const st = document.createElement('style'); st.id = 'probe-always-hidden'; st.textContent = '.md-mark{font-size:0 !important;opacity:0 !important}'; document.head.appendChild(st); })()");
  };
  const T = 'aa **bold** zz';        // raw offsets: a0 a1 ' '2 *3 *4 b5 o6 l7 d8 *9 *10 ' '11 z12 z13

  // P1 - caret stepping over the hidden opening marker (from just before it, at offset 3, to after it)
  await open('p1', T); await put(app, 3);
  const c0 = await caret(app); await press(app, 'ArrowRight'); const c1 = await caret(app); await press(app, 'ArrowRight'); const c2 = await caret(app);
  row('P1a', 'ArrowRight from just BEFORE a hidden `**`: how far does one press move the caret (raw offsets)?', { start: c0, afterOne: c1, afterTwo: c2 });
  await put(app, 5); await press(app, 'ArrowLeft'); const l1 = await caret(app); await press(app, 'ArrowLeft'); const l2 = await caret(app);
  row('P1b', 'ArrowLeft from the first letter of the styled word: does it stop ON the invisible marker characters (an invisible stop) before leaving them?', { from: 5, afterOne: l1, afterTwo: l2 });

  // P2 - typing at the two positions that look identical at the END of a styled word
  await open('p2a', T); await put(app, 9);                      // inside the pair, before the closing `**`
  await app.typeKeys('X'); const p2a = await settled(app, 'p2a');
  await open('p2b', T); await put(app, 11);                     // outside, after the closing `**`
  await app.typeKeys('Y'); const p2b = await settled(app, 'p2b');
  row('P2', 'typing at the end of a styled word: the two raw positions that LOOK the same store differently - so the editor needs its own rule for which one a caret is', { insideBeforeClosing: p2a, outsideAfterClosing: p2b });

  // P3 / P4 - Backspace and Delete against a hidden marker
  await open('p3', T); await put(app, 5); await press(app, 'Backspace');
  row('P3', 'Backspace with the caret at the start of the styled word (right after the hidden opening `**`)', { stored: await settled(app, 'p3') });
  await open('p4', T); await put(app, 9); await press(app, 'Delete');
  row('P4', 'Delete with the caret at the end of the styled word (right before the hidden closing `**`)', { stored: await settled(app, 'p4') });
  await open('p3b', 'aa **b** zz'); await put(app, 6); await press(app, 'Backspace');
  row('P3b', 'Backspace on the ONLY letter of a one-letter styled word: does the emptied pair go with it?', { stored: await settled(app, 'p3b') });

  // P5 - copy: select the visible words "bold zz" region and read what a copy would carry
  await open('p5', T);
  const p5 = await app.evalJs(`(() => {
    const ed = document.querySelector('${ED}'); ed.focus();
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, seen = 0, sN = null, sO = 0, eN = null, eO = 0;
    while ((n = w.nextNode())) { const L = n.data.length; if (!sN && seen + L >= 2) { sN = n; sO = 2 - seen; } if (!eN && seen + L >= 12) { eN = n; eO = 12 - seen; } seen += L; }
    const r = document.createRange(); r.setStart(sN, sO); r.setEnd(eN, eO); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    window.__copied = null; document.addEventListener('copy', (e) => { window.__copied = getSelection().toString(); }, { once: true });
    return { selectionToString: s.toString() };
  })()`);
  await app.keyCombo('c'); await sleep(300);
  row('P5', 'copy of the visibly-selected words "bold" with its neighbours: what does Selection.toString / a copy event carry (are the hidden markers in it)?', { ...p5, copyEventSaw: await app.evalJs('window.__copied') });

  // P6 - real cut and paste
  await open('p6', T);
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus();
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, seen = 0, sN = null, sO = 0, eN = null, eO = 0;
    while ((n = w.nextNode())) { const L = n.data.length; if (!sN && seen + L >= 5) { sN = n; sO = 5 - seen; } if (!eN && seen + L >= 9) { eN = n; eO = 9 - seen; } seen += L; }
    const r = document.createRange(); r.setStart(sN, sO); r.setEnd(eN, eO); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
  await app.keyCombo('x'); await sleep(400);
  const afterCut = await settled(app, 'p6');
  await put(app, 0); await app.keyCombo('v'); await sleep(400);
  row('P6', 'cut the letters "bold" (inside the pair) then paste at the start: stored text after the cut, and after the paste', { afterCut, afterPaste: await settled(app, 'p6') });

  // P7 - IME composition at the edge of the styled word
  await open('p7', T); await put(app, 9);
  await app.ime('ab'); await sleep(400);
  row('P7', 'an IME composition typed at the end of the styled word (before the hidden closing `**`)', { stored: await settled(app, 'p7'), caret: await caret(app) });
});
console.log(`\n${rows.length} rows`);

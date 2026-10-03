// ITEM 211 - HIDDEN MARKS, MADE SAFE. The scenario Fable's FIX asked for: the marks never show, and the editor's own rules keep a
// writer from ever landing on, deleting one star of, or stranding one. Every check drives Draft with TRUSTED input (CDP key and
// mouse events) against the built web app and reads back the stored text, then presses Ctrl+Z and reads it back again.
//   node scripts/harness/item211.mjs        (from apps/desktop, dist-web built, on a granted turn)
//
// What it covers, in Fable's order:
//   WALK     ArrowRight then ArrowLeft over "Start **BOLD** end": the stops, none of them on or just after a hidden mark
//   EDGES    Backspace and Delete at both edges of a bold word and of an italic word
//   ONE      a one-letter bold word deleted entirely (both keys) leaves no "****"
//   TOKENS   Backspace at the start of "- ", "-+ ", "-= ", "# " and "## " lines removes the whole token
//   STYLE    typing after a bold word stays bold; typing before it stays plain
//   CUT      cutting the bold word (and a selection that splits its marks) leaves no "****" and no lone "**"
//   UNDO     one Ctrl+Z restores every case above
//   PLUS     copy still carries the marks (unchanged), an IME composition stays native, Enter inside a bold word splits it cleanly,
//            and a space typed at the end of a bold word followed by a letter keeps the phrase bold
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`); };

const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const domText = (app) => app.evalJs(`document.querySelector('${ED}').innerText.split('\\u200b').join('')`);
// The stored text once the page's own debounced save has caught up with the editor.
const settled = async (app, id) => {
  const want = await domText(app);
  for (let i = 0; i < 40; i += 1) { const s = await stored(app, id); if (s === want) return s; await sleep(100); }
  return stored(app, id);
};
const caret = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); const s = getSelection(); if (!s.rangeCount || !ed.contains(s.focusNode)) return null;
  const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.focusNode, s.focusOffset); return r.toString().length; })()`);
// Put the caret at a RAW offset the way a browser can leave it (the end of the earlier text node), then let the editor react.
const put = async (app, off) => {
  await app.evalJs(`(() => {
    const ed = document.querySelector('${ED}'); ed.focus();
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, seen = 0, node = null, o = 0;
    while ((n = w.nextNode())) { if (seen + n.data.length >= ${off}) { node = n; o = ${off} - seen; break; } seen += n.data.length; }
    const r = document.createRange(); r.setStart(node, o); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
  await sleep(150);
};
const select = async (app, lo, hi) => {
  await app.evalJs(`(() => {
    const ed = document.querySelector('${ED}'); ed.focus();
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, seen = 0, sN = null, sO = 0, eN = null, eO = 0;
    while ((n = w.nextNode())) { const L = n.data.length; if (!sN && seen + L >= ${lo}) { sN = n; sO = ${lo} - seen; } if (!eN && seen + L >= ${hi}) { eN = n; eO = ${hi} - seen; } seen += L; }
    const r = document.createRange(); r.setStart(sN, sO); r.setEnd(eN, eO); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
  await sleep(150);
};
const anyMarkShown = (app) => app.evalJs(`[...document.querySelectorAll('${ED} .md-mark')].some(m => !m.classList.contains('md-mark-hidden') && /[*_~#]/.test(m.textContent))`);
const undo = async (app) => { await app.keyCombo('z'); await sleep(200); };

await withHarness(async (app) => {
  let seq = 0;
  const open = async (text) => {
    const id = `i211-${seq += 1}`;
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page' });
    await sleep(400);
    await app.click('Draft');
    await app.waitFor(`document.querySelector('${ED}') && document.querySelector('${ED}').innerText.split('\\u200b').join('') === ${JSON.stringify(text)}`, { label: 'Draft holds the fixture' });
    await sleep(300);
    return id;
  };
  // One edit case: open, act, read stored, undo once, read stored again.
  // `undos` is how many steps the existing undo stack makes of the act: one per edit, and one per typed word (FX6's grouping).
  const editCase = async (name, text, act, want, undos = 1) => {
    const id = await open(text);
    await act();
    await sleep(250);
    const after = await settled(app, id);
    const shown = await anyMarkShown(app);
    ok(`${name}`, after === want && !shown, JSON.stringify({ stored: after, want, markShown: shown }));
    for (let i = 0; i < undos; i += 1) await undo(app);
    const back = await settled(app, id);
    ok(`UNDO ${name}: ${undos === 1 ? 'one Ctrl+Z restores' : `${undos} Ctrl+Z (one per typed word) restore`} ${JSON.stringify(text)}`, back === text && !(await anyMarkShown(app)), JSON.stringify({ stored: back }));
    return { after, back };
  };

  const T = 'Start **BOLD** end';   // raw: S0 t1 a2 r3 t4 ' '5 *6 *7 B8 O9 L10 D11 *12 *13 ' '14 e15 n16 d17
  const I = 'Start *ital* end';     // raw: *6 i7 t8 a9 l10 *11

  // ---- WALK ----
  {
    await open(T);
    await put(app, 0);
    const right = [await caret(app)];
    for (let i = 0; i < 20; i += 1) { await app.key('ArrowRight'); await sleep(90); const c = await caret(app); if (c === right[right.length - 1]) break; right.push(c); }
    const left = [right[right.length - 1]];
    for (let i = 0; i < 20; i += 1) { await app.key('ArrowLeft'); await sleep(90); const c = await caret(app); if (c === left[left.length - 1]) break; left.push(c); }
    const want = [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 15, 16, 17, 18];
    const onMark = (c) => [7, 8, 13, 14].includes(c);
    ok('WALK: ArrowRight from the line start stops once per visible character - 15 stops, none on or just after a hidden `**` (7, 8, 13, 14)',
      JSON.stringify(right) === JSON.stringify(want) && !right.some(onMark), right.join(' '));
    ok('WALK: ArrowLeft back from the end takes the same stops in reverse, none on a hidden mark',
      JSON.stringify(left) === JSON.stringify([...want].reverse()) && !left.some(onMark), left.join(' '));
    ok('WALK: no mark showed at any stop', !(await anyMarkShown(app)));
    await put(app, 6);
    await app.key('ArrowRight', { shift: true }); await sleep(90);
    const shiftSel = await app.evalJs(`(() => { const s = getSelection(); return s.toString(); })()`);
    ok('WALK: Shift+ArrowRight at the bold word\'s left edge selects exactly its first letter (with the hidden opening mark it carries)', shiftSel === '**B', JSON.stringify(shiftSel));
    // a caret left on a hidden mark by the browser (raw 8 or 14) is snapped back to the visible character on its left
    await put(app, 8); const s8 = await caret(app);
    await put(app, 14); const s14 = await caret(app);
    ok('WALK: a caret left just after a hidden mark snaps to just after the nearest visible character (8 -> 6, 14 -> 12)', s8 === 6 && s14 === 12, JSON.stringify({ s8, s14 }));
    const pt = await app.evalJs(`(() => { const b = document.querySelector('${ED} .md-bold'); const r = b.getBoundingClientRect(); return { x: Math.round(r.right + 1), y: Math.round(r.top + r.height / 2) }; })()`);
    await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(250);
    const clicked = await caret(app);
    ok('WALK: a real click just past the bold word lands after its last visible letter (12), inside the pair', clicked === 12, String(clicked));
  }

  // ---- EDGES ----
  await editCase('EDGES bold: Backspace at the left edge deletes the space before the word, not a star', T, async () => { await put(app, 8); await app.key('Backspace'); }, 'Start**BOLD** end');
  await editCase('EDGES bold: Backspace at the right edge deletes the D, not a star', T, async () => { await put(app, 14); await app.key('Backspace'); }, 'Start **BOL** end');
  await editCase('EDGES bold: Delete at the left edge deletes the B, not a star', T, async () => { await put(app, 8); await app.key('Delete'); }, 'Start **OLD** end');
  await editCase('EDGES bold: Delete at the right edge deletes the space after the word, not a star', T, async () => { await put(app, 14); await app.key('Delete'); }, 'Start **BOLD**end');
  await editCase('EDGES italic: Backspace at the left edge deletes the space', I, async () => { await put(app, 7); await app.key('Backspace'); }, 'Start*ital* end');
  await editCase('EDGES italic: Backspace at the right edge deletes the l', I, async () => { await put(app, 12); await app.key('Backspace'); }, 'Start *ita* end');
  await editCase('EDGES italic: Delete at the left edge deletes the i', I, async () => { await put(app, 7); await app.key('Delete'); }, 'Start *tal* end');
  await editCase('EDGES italic: Delete at the right edge deletes the space', I, async () => { await put(app, 12); await app.key('Delete'); }, 'Start *ital*end');

  // ---- ONE ----
  await editCase('ONE: Backspace on a one-letter bold word removes the letter AND its pair - no "****"', 'a **b** c', async () => { await put(app, 7); await app.key('Backspace'); }, 'a  c');
  await editCase('ONE: Delete on a one-letter bold word removes the letter AND its pair - no "****"', 'a **b** c', async () => { await put(app, 4); await app.key('Delete'); }, 'a  c');
  await editCase('ONE: Backspace on a one-letter italic word removes the letter AND its pair - no "**"', 'a *b* c', async () => { await put(app, 5); await app.key('Backspace'); }, 'a  c');

  // ---- TOKENS ----
  for (const [line, rest] of [['- item', 'item'], ['-+ item', 'item'], ['-= item', 'item'], ['# Head', 'Head'], ['## Head', 'Head']]) {
    await editCase(`TOKENS: Backspace at the start of ${JSON.stringify(line)} removes the whole token`, line, async () => { await put(app, line.length - rest.length); await app.key('Backspace'); }, rest);
  }
  await editCase('TOKENS: a caret the browser leaves IN FRONT of the token is snapped behind it, so Backspace still takes the whole token', 'x\n- item', async () => { await put(app, 2); await app.key('Backspace'); }, 'x\nitem');

  // ---- STYLE ----
  {
    await editCase('STYLE: typing after a bold word (caret left after its closing mark) stays bold', T, async () => { await put(app, 14); await app.typeKeys('X'); }, 'Start **BOLDX** end');
    const id = await open(T); await put(app, 14); await app.typeKeys('X'); await sleep(200);
    const inBold = await app.evalJs(`(() => { const w = document.createTreeWalker(document.querySelector('${ED}'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.data.includes('X')) return !!n.parentElement.closest('.md-bold'); } return null; })()`);
    ok('STYLE: and the typed X is painted inside the bold span', inBold === true && (await settled(app, id)) === 'Start **BOLDX** end', String(inBold));
  }
  await editCase('STYLE: typing before a bold word (caret left after its opening mark) stays plain', T, async () => { await put(app, 8); await app.typeKeys('Y'); }, 'Start Y**BOLD** end');
  await editCase('STYLE: a space then more letters typed at the end of a bold word keep the phrase bold (the space never strands a mark)', T, async () => { await put(app, 12); await app.typeKeys(' more'); }, 'Start **BOLD more** end', 2);

  // ---- CUT ----
  await editCase('CUT: cutting the visible word "BOLD" leaves no "****"', T, async () => { await select(app, 8, 12); await app.keyCombo('x'); await sleep(300); }, 'Start  end');
  await editCase('CUT: cutting "**BOLD**" marks and all leaves no "****"', T, async () => { await select(app, 6, 14); await app.keyCombo('x'); await sleep(300); }, 'Start  end');
  await editCase('CUT: cutting "Start BO" (the selection splits the pair) keeps "LD" bold - no lone "**"', T, async () => { await select(app, 0, 10); await app.keyCombo('x'); await sleep(300); }, '**LD** end');
  await editCase('CUT: typing over the selected word "BOLD" replaces it and leaves no "****"', T, async () => { await select(app, 8, 12); await app.typeKeys('Q'); }, 'Start **Q** end');
  await editCase('CUT: Backspace over a selection that is the whole bold word leaves no "****"', T, async () => { await select(app, 8, 12); await app.key('Backspace'); }, 'Start  end');

  // ---- PLUS ----
  {
    await open(T);
    await select(app, 2, 12);
    await app.evalJs("window.__copied = null; document.addEventListener('copy', () => { window.__copied = getSelection().toString(); }, { once: true })");
    await app.keyCombo('c'); await sleep(250);
    const copied = await app.evalJs('window.__copied');
    ok('PLUS: copy is unchanged - it still carries the stored marks', copied === 'art **BOLD', JSON.stringify(copied));
  }
  {
    const id = await open(T); await put(app, 12);
    await app.ime('ab'); await sleep(400);
    ok('PLUS: an IME composition at the end of the bold word stays native and lands inside the pair', (await settled(app, id)) === 'Start **BOLDab** end', JSON.stringify(await stored(app, id)));
  }
  await editCase('PLUS: Enter inside a bold word closes and reopens the pair, so neither line shows a mark', T, async () => { await put(app, 10); await app.key('Enter'); }, 'Start **BO**\n**LD** end');

  // ---- TWEAKS (Fable's C) ----
  {
    const GOAL = 'wrizo-writing-goal-lines';
    const text = '# Title\none **two** three\n- four';   // five words written; "#", "**" and "- " are not words
    const id = await open(text);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(250);
    const foot = () => app.evalJs("(() => { const g = document.querySelector('.wz-sliver-goal'); return g ? { target: g.dataset.target, unit: g.dataset.unit, done: Number(g.dataset.done) } : null; })()");
    const before = await foot();
    ok('C1: a goal never set reads as the shipped default, 24 lines', before && before.target === '24' && before.unit === 'lines' && (await app.evalJs(`localStorage.getItem('${GOAL}')`)) === null, JSON.stringify(before));
    await app.evalJs("document.querySelector('.wz-sliver-instruments-btn[aria-label=\"Settings\"]').click()"); await sleep(200);
    const unitRow = await app.evalJs(`(() => {
      const row = [...document.querySelectorAll('.wz-sliver-instruments-panel .mode-crow')].find(r => r.firstElementChild && r.firstElementChild.textContent === 'Unit');
      return row ? [...row.querySelectorAll('button')].map(b => ({ t: b.textContent, on: b.classList.contains('on'), disabled: b.getAttribute('aria-disabled'), title: b.title, opacity: getComputedStyle(b).opacity })) : null; })()`);
    const time = unitRow && unitRow.find((b) => b.t === 'Time');
    ok('C1: Unit offers Lines and Words; Time is a dimmed stand-in (aria-disabled, "Coming soon")',
      !!unitRow && unitRow.map((b) => b.t).join(',') === 'Lines,Words,Time' && !!time && time.disabled === 'true' && time.title === 'Coming soon' && Number(time.opacity) < 1 && unitRow[0].on, JSON.stringify(unitRow));
    const pick = (label) => app.evalJs(`(() => { const row = [...document.querySelectorAll('.wz-sliver-instruments-panel .mode-crow')].find(r => r.firstElementChild && r.firstElementChild.textContent === 'Unit'); [...row.querySelectorAll('button')].find(b => b.textContent === ${JSON.stringify(label)}).click(); })()`);
    await pick('Time'); await sleep(200);
    ok('C1: pressing Time does nothing - the goal and its unit are unchanged', JSON.stringify(await foot()) === JSON.stringify(before) && (await app.evalJs(`localStorage.getItem('${GOAL}')`)) === null);
    await pick('Words'); await sleep(200);
    const words = await foot();
    const storedGoal = await app.evalJs(`localStorage.getItem('${GOAL}')`);
    ok('C1: choosing Words stores the unit WITH the number', storedGoal === JSON.stringify({ n: 24, unit: 'words' }), String(storedGoal));
    ok('C1: Words counts real words written - five here; the heading hash, the bold marks and the bullet token are not words', words && words.unit === 'words' && words.done === 5, JSON.stringify(words));
    const label = await app.evalJs("document.querySelector('.wz-sliver-instruments-panel .wz-tw-unit')?.textContent");
    ok('C1: the label beside the number says words', label === 'words', String(label));
    const fill = await app.evalJs("(() => { const f = document.querySelector('.wz-sliver-goal-hairline-fill'); return f ? f.style.width : null; })()");
    ok('C1: the hairline fills by words: 5 of 24', fill === `${((5 / 24) * 100).toFixed(1)}%`, String(fill));
    await put(app, (await stored(app, id)).length); await app.typeKeys(' five six'); await sleep(300);
    ok('C1: typing two more words moves the words count to seven', (await foot()).done === 7, JSON.stringify(await foot()));

    // An existing goal keeps its old meaning: a bare number in storage is lines.
    await app.goto('/');
    await app.evalJs(`localStorage.setItem('${GOAL}', '2')`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page after legacy goal' });
    await sleep(400);
    const legacy = await foot();
    ok('C1: a goal stored before units existed (a bare "2") still reads as 2 LINES', legacy && legacy.target === '2' && legacy.unit === 'lines', JSON.stringify(legacy));

    await app.click('Draft'); await sleep(300);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(250);
    const tpl = await app.evalJs(`[...document.querySelectorAll('.wz-sliver-templates .wz-template-btn')].map(b => ({ name: b.getAttribute('aria-label'), title: b.title, disabled: b.getAttribute('aria-disabled'), opacity: getComputedStyle(b).opacity }))`);
    ok('C2: Outline, Bibliography and Title page are dimmed stand-ins - aria-disabled, tooltip "Coming soon"',
      tpl.map((b) => b.name).join(',') === 'Outline,Bibliography,Title page' && tpl.every((b) => b.disabled === 'true' && b.title === 'Coming soon' && Number(b.opacity) < 1), JSON.stringify(tpl));
    const textBefore = await stored(app, id);
    await app.evalJs("document.querySelectorAll('.wz-sliver-templates .wz-template-btn').forEach(b => b.click())"); await sleep(300);
    ok('C2: pressing them does nothing to the page', (await stored(app, id)) === textBefore && (await app.evalJs(`!!document.querySelector('${ED}')`)));
    const typeHead = await app.evalJs("(() => { const s = document.querySelector('.wz-sliver-type'); const h = s && s.firstElementChild; return h ? { cls: h.className, text: h.textContent, next: h.nextElementSibling && h.nextElementSibling.className } : null; })()");
    ok('C3: a "Typeface" heading sits directly above the font controls', typeHead && typeHead.cls === 'wz-sliver-h' && typeHead.text === 'Typeface' && /wz-type/.test(typeHead.next || ''), JSON.stringify(typeHead));
    await app.evalJs("document.querySelector('.wz-sliver-instruments-btn[aria-label=\"Settings\"]').click()"); await sleep(200);
    const heads = await app.evalJs(`(() => {
      const panel = document.querySelector('.wz-sliver-instruments-panel');
      const probe = document.createElement('span'); probe.style.color = 'var(--accent-rest)'; panel.appendChild(probe);
      const brass = document.createElement('span'); brass.style.color = 'var(--brass-press)'; panel.appendChild(brass);
      const out = { olive: getComputedStyle(probe).color, brass: getComputedStyle(brass).color, h4: [...panel.querySelectorAll('h4')].map(h => getComputedStyle(h).color) };
      probe.remove(); brass.remove(); return out; })()`);
    ok('C4: every Settings heading is the theme\'s olive (--accent-rest), not brass', heads.h4.length === 3 && heads.h4.every((c) => c === heads.olive) && heads.olive !== heads.brass, JSON.stringify(heads));
  }
});

const failed = checks.filter((c) => !c.pass);
console.log(`\nITEM211 VERIFY: ${failed.length ? `FAIL — ${failed.length}/${checks.length} failed` : `PASS (${checks.length} checks)`}`);
if (failed.length) process.exitCode = 1;

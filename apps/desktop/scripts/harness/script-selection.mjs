// SCRIPT #3: SELECTION, BACKSPACE, DELETE AND ENTER ON A SCREENPLAY (the review's K6, K7, K9; Fable, Nov 22). The page read only the START of a selection, so a whole line selected and Backspaced
// glued itself to the line above instead of going, and Enter kept the words it should have replaced. Delete at the end of a line did nothing. Machina, seeded through the app's own seams, real keys.
//
// SELECTION  S1  a whole line selected, Backspace: its words go, the line above is untouched, nothing joins
//            S2  the start of a line selected, Backspace: only those words go
//            S3  the middle of a line selected, Delete: only those words go
//            S4  a whole line selected, Delete: its words go, the line below is untouched, nothing joins
//            S5  the middle of a line selected, Enter: the selection is replaced by the break
//            S6  a selection to the end of a line, Enter: the words go and an empty next line opens
//            S7  a whole line selected, Enter: no selected word survives
//            S8  (control) a selection typed over is replaced
//            S9  a selection from the start of a line, ArrowUp: the caret stays in this line
// DELETE     D1  Delete at the end of a line joins the next one up, and the next keys land at the seam
//            D2  the joined line keeps the upper line's type
//            D3  Delete on a blank line removes it; the line below keeps its own type and takes the caret
//            D4  Delete at the end of the last line changes nothing
//            D5  (control) Delete inside a line removes one character
//            D6  Delete at the end of a line above a scene heading joins them with no word lost, saved
// BACKSPACE  B1  (control) Backspace at the start of a line with no selection still joins it to the line above
//            B2  Backspace into a blank line above: the blank goes, the written line keeps its type, and the next keys land at its start (Fable, Nov 23)
//            B3  the same with a scene heading: it stays a scene heading
//            B4  (control) Backspace on a blank line under a blank line leaves one blank line
//            B5  (control) Backspace under a WRITTEN line still joins them in the upper line's type
//            B6  a blank first heading above a written line: the line keeps its type and its words, saved
//            B7  a line of only spaces above counts as blank
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-selection.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const HEAD = ['scene', 'INT. A - DAY'];

let n = 0;
const docOf = (id, rows) => {
  const scenes = [];
  rows.forEach(([t, text], i) => {
    const el = { id: `${id}-${i}`, t, text };
    if (t === 'scene') scenes.push({ id: el.id, heading: el, body: [] });
    else scenes[scenes.length - 1].body.push(el);
  });
  return { v: 1, scenes };
};
const LINES = `(() => { const m = new Map(); for (const e of document.querySelectorAll('.script-el[data-doc-index]')) { const i = +e.dataset.docIndex; const c = m.get(i) || { t: e.dataset.type, x: '' }; c.x += e.textContent; m.set(i, c); } return [...m.entries()].sort((a, b) => a[0] - b[0]).map((x) => [x[1].t, x[1].x]); })()`;
const ACTIVE = "(() => { const a = document.querySelector('.script-el-active'); return a ? { i: +a.dataset.docIndex, focused: document.activeElement === a } : null; })()";
const VK = { Backspace: 8, Enter: 13, Delete: 46, ArrowUp: 38 };

await withHarness(async (app) => {
  const lines = () => app.evalJs(LINES);
  const active = () => app.evalJs(ACTIVE);
  const press = async (key) => {
    const p = { key, code: key, windowsVirtualKeyCode: VK[key], nativeVirtualKeyCode: VK[key] };
    if (key === 'Enter') await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...p, text: '\r', unmodifiedText: '\r' });
    else await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(180);
  };
  const type = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } await sleep(120); };
  const select = (a, b) => app.evalJs(`(() => { const n = document.querySelector('.script-el-active'); const t = n.firstChild; const s = getSelection(); const r = document.createRange(); r.setStart(t, ${a}); r.setEnd(t, ${b === 'end' ? 't.length' : b}); s.removeAllRanges(); s.addRange(r); return s.toString(); })()`);
  const caret = (o) => app.evalJs(`(() => { const n = document.querySelector('.script-el-active'); const t = n.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, ${o === 'end' ? 't.length' : `Math.min(${o}, t.length)`}); else r.setStart(n, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()`);
  // a page with these lines, opened, with line `at` active and the caret at its end
  const open = async (rows, at) => {
    const id = `ss-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(380);
    if (at > 0) {
      const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${at}"]'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
      await sleep(220);
    }
    await caret('end');
    return id;
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  // ---- SELECTION
  const A = ['action', 'First line.'], B = ['action', 'Second line.'], C = ['action', 'Third line.'];
  let g;
  await open([HEAD, A, B, C], 2); await select(0, 'end'); await press('Backspace'); g = await lines();
  ok('S1: a whole line selected, Backspace: its words go, the line above is untouched, nothing joins', same(g, [HEAD, A, ['action', ''], C]), g);
  await open([HEAD, A, ['action', 'Cut this. Keep this.']], 2); await select(0, 10); await press('Backspace'); g = await lines();
  ok('S2: the start of a line selected, Backspace: only those words go', same(g, [HEAD, A, ['action', 'Keep this.']]), g);
  await open([HEAD, ['action', 'Keep this. CUT THIS. Keep that.'], B], 1); await select(11, 21); await press('Delete'); g = await lines();
  ok('S3: the middle of a line selected, Delete: only those words go', same(g, [HEAD, ['action', 'Keep this. Keep that.'], B]), g);
  await open([HEAD, A, B, C], 2); await select(0, 'end'); await press('Delete'); g = await lines();
  ok('S4: a whole line selected, Delete: its words go, the line below is untouched, nothing joins', same(g, [HEAD, A, ['action', ''], C]), g);
  await open([HEAD, ['action', 'Keep this. CUT THIS. Keep that.']], 1); await select(11, 21); await press('Enter'); g = await lines();
  ok('S5: the middle of a line selected, Enter: the selection is replaced by the break', same(g, [HEAD, ['action', 'Keep this. '], ['action', 'Keep that.']]), g);
  await open([HEAD, ['action', 'Keep this. CUT THIS.']], 1); await select(11, 'end'); await press('Enter'); g = await lines();
  ok('S6: a selection to the end of a line, Enter: the words go and an empty next line opens', same(g, [HEAD, ['action', 'Keep this. '], ['action', '']]), g);
  await open([HEAD, ['action', 'All of this goes.']], 1); await select(0, 'end'); await press('Enter'); g = await lines();
  ok('S7: a whole line selected, Enter: no selected word survives', g.length === 3 && !g.some((r) => r[1].includes('goes')), g);
  await open([HEAD, ['action', 'Keep this. CUT THIS. Keep that.']], 1); await select(11, 21); await type('NEW '); g = await lines();
  ok('S8 (control): a selection typed over is replaced', same(g, [HEAD, ['action', 'Keep this. NEW Keep that.']]), g);
  await open([HEAD, A, ['action', 'Select from here.']], 2); await select(0, 6); await press('ArrowUp'); const up = await active(); g = await lines();
  ok('S9: a selection from the start of a line, ArrowUp: the caret stays in this line', up?.i === 2 && same(g, [HEAD, A, ['action', 'Select from here.']]), { up, g });

  // ---- DELETE
  await open([HEAD, ['action', 'Alpha.'], ['action', 'Beta.']], 1); await press('Delete'); const d1 = await lines(), d1a = await active(); await type('X'); const d1t = await lines();
  ok('D1: Delete at the end of a line joins the next one up, and the next keys land at the seam', same(d1, [HEAD, ['action', 'Alpha.Beta.']]) && d1a?.i === 1 && d1a?.focused === true && d1t[1]?.[1] === 'Alpha.XBeta.', { d1, d1a, d1t });
  await open([HEAD, ['character', 'MARA'], ['dialogue', 'Hello.']], 1); await press('Delete'); g = await lines();
  ok('D2: the joined line keeps the upper line\'s type', g.length === 2 && g[1][0] === 'character' && g[1][1] === 'MARAHello.', g);
  await open([HEAD, ['action', ''], ['character', 'MARA'], ['dialogue', 'Hello.']], 1); await press('Delete'); const d3 = await lines(), d3a = await active(); await type('X'); const d3t = await lines();
  ok('D3: Delete on a blank line removes it; the line below keeps its own type and takes the caret', same(d3, [HEAD, ['character', 'MARA'], ['dialogue', 'Hello.']]) && d3a?.i === 1 && d3t[1]?.[1] === 'XMARA', { d3, d3a, d3t });
  await open([HEAD, A, ['action', 'Last.']], 2); await press('Delete'); g = await lines();
  ok('D4: Delete at the end of the last line changes nothing', same(g, [HEAD, A, ['action', 'Last.']]), g);
  await open([HEAD, ['action', 'Alpha.'], B], 1); await caret(2); await press('Delete'); g = await lines();
  ok('D5 (control): Delete inside a line removes one character', same(g, [HEAD, ['action', 'Alha.'], B]), g);
  const d6Id = await open([HEAD, ['action', 'Alpha.'], ['scene', 'EXT. B - NIGHT'], ['action', 'Rain.']], 1); await press('Delete'); g = await lines();
  await sleep(2700);   // the page's own autosave
  const d6 = await app.evalJs(`(() => { window.wrizoFlushNow(); const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((r) => r.id === ${q(d6Id)}); return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]) : null; })()`);
  ok('D6: Delete at the end of a line above a scene heading joins them with no word lost, saved', same(g, [HEAD, ['action', 'Alpha.EXT. B - NIGHT'], ['action', 'Rain.']]) && same(d6, g), { g, d6 });

  // ---- BACKSPACE
  await open([HEAD, ['action', 'Alpha.'], ['action', 'Beta.']], 2); await caret(0); await press('Backspace'); const b1 = await lines(), b1a = await active(); await type('X'); const b1t = await lines();
  ok('B1 (control): Backspace at the start of a line with no selection still joins it to the line above', same(b1, [HEAD, ['action', 'Alpha.Beta.']]) && b1a?.i === 1 && b1t[1]?.[1] === 'Alpha.XBeta.', { b1, b1a, b1t });
  await open([HEAD, A, ['action', ''], ['character', 'MARA'], ['dialogue', 'Hello.']], 3); await caret(0); await press('Backspace'); const b2 = await lines(), b2a = await active(); await type('X'); const b2t = await lines();
  ok('B2: Backspace into a blank line above: the blank goes, the written line keeps its type, and the next keys land at its start', same(b2, [HEAD, A, ['character', 'MARA'], ['dialogue', 'Hello.']]) && b2a?.i === 2 && b2a?.focused === true && b2t[2]?.[1] === 'XMARA', { b2, b2a, b2t });
  await open([HEAD, ['action', ''], ['scene', 'EXT. B - NIGHT'], ['action', 'Rain.']], 2); await caret(0); await press('Backspace'); g = await lines();
  ok('B3: the same with a scene heading: it stays a scene heading', same(g, [HEAD, ['scene', 'EXT. B - NIGHT'], ['action', 'Rain.']]), g);
  await open([HEAD, A, ['action', ''], ['character', '']], 3); await caret(0); await press('Backspace'); const b4 = await lines(), b4a = await active();
  ok('B4 (control): Backspace on a blank line under a blank line leaves one blank line', same(b4, [HEAD, A, ['action', '']]) && b4a?.i === 2, { b4, b4a });
  await open([HEAD, ['character', 'MARA'], ['dialogue', 'Hello.']], 2); await caret(0); await press('Backspace'); g = await lines();
  ok('B5 (control): Backspace under a WRITTEN line still joins them in the upper line\'s type', same(g, [HEAD, ['character', 'MARAHello.']]), g);
  const b6Id = await open([['scene', ''], ['action', 'Alpha.']], 1); await caret(0); await press('Backspace'); g = await lines();
  await sleep(2700);   // the page's own autosave
  const b6 = await app.evalJs(`(() => { window.wrizoFlushNow(); const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((r) => r.id === ${q(b6Id)}); return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]).filter((x) => x[1] !== '') : null; })()`);
  ok('B6: a blank first heading above a written line: the line keeps its type and its words, saved', same(g, [['action', 'Alpha.']]) && same(b6, [['action', 'Alpha.']]), { g, b6 });
  await open([HEAD, ['action', '   '], ['character', 'MARA']], 2); await caret(0); await press('Backspace'); g = await lines();
  ok('B7: a line of only spaces above counts as blank', same(g, [HEAD, ['character', 'MARA']]), g);
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 22;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-SELECTION VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-SELECTION VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

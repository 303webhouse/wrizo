// SCRIPT #2: TAB ON A SCREENPLAY (the review's K1, K2, K3; Fable, Nov 22). Tab on a WRITTEN line adds the next element and never rewrites the line; a BLANK line still changes type in place.
// The rule is Final Draft 13's own User Guide: section 1.26.2 "Adding Paragraphs with the Tab Key" (Action to Character, Dialogue to Parenthetical, Parenthetical to Dialogue, Scene Heading to
// Action, Transition to Scene Heading, and "Character to Transition (only when character is blank)"), and 1.25.8 ("pressing the tab key after entering a character automatically creates a
// parenthetical paragraph"). Machina, seeded through the app's own seams, real key events.
//
// WRITTEN  T-<type>  (eight) Tab at the end of a written line: the line keeps its type and words, a new empty line of the next type follows, the caret is in it, and the next keys land there
// BLANK    T9        a blank line still changes type in place, with no new line
// MID      T10       Tab in the middle of a written line: the line is not split or rewritten, the new line goes below it
// COMMIT   T11       leaving a cue by Tab commits it as Enter does: capitals and the automatic (CONT'D)
// LIST     T12       with the name list open, Tab takes the name and adds nothing; the next Tab adds the next line
// BACK     T13       Shift+Tab still walks a line's type backward in place
// SAVED    T14       a short exchange typed with Tab is saved line by line, each in its own type
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-tab.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const NEXT = { scene: 'action', action: 'character', character: 'paren', paren: 'dialogue', dialogue: 'paren', transition: 'scene', shot: 'character', general: 'action' };
const WRITTEN = { scene: 'INT. A - DAY', action: 'She folds a shirt.', character: 'MARA', paren: '(beat)', dialogue: 'Hello there.', transition: 'CUT TO:', shot: 'ANGLE ON', general: 'A note.' };

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
const LINES = `(() => { const m = new Map(); for (const e of document.querySelectorAll('.script-el[data-doc-index]')) { const i = +e.dataset.docIndex; const c = m.get(i) || { t: e.dataset.type, x: '' }; c.x += e.textContent; m.set(i, c); } return [...m.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1]); })()`;
const ACTIVE = "(() => { const a = document.querySelector('.script-el-active'); return a ? { i: +a.dataset.docIndex, t: a.dataset.type, focused: document.activeElement === a } : null; })()";

await withHarness(async (app) => {
  const lines = () => app.evalJs(LINES);
  const active = () => app.evalJs(ACTIVE);
  const tab = async (shift = false) => {
    const p = { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: shift ? 8 : 0 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(160);
  };
  const enter = async () => {
    const p = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...p, text: '\r', unmodifiedText: '\r' });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(160);
  };
  const type = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } await sleep(120); };
  const caretAt = (o) => app.evalJs(`(() => { const a = document.querySelector('.script-el-active'); const t = a.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, ${o === 'end' ? 't.length' : `Math.min(${o}, t.length)`}); else r.setStart(a, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()`);
  // a page with these lines, opened, the caret at the end of its last line
  const open = async (rows) => {
    const id = `st-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(380);
    const last = rows.length - 1;
    if (last > 0) {
      const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${last}"]'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
      await sleep(220);
    }
    await caretAt('end');
    return id;
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  // ---- WRITTEN: every element type
  for (const t of Object.keys(NEXT)) {
    const rows = t === 'scene' ? [['scene', WRITTEN.scene]] : [['scene', WRITTEN.scene], [t, WRITTEN[t]]];
    await open(rows);
    const at = rows.length - 1;
    await tab();
    const after = await lines(), act = await active();
    await type('zz');
    const typed = await lines();
    ok(`T-${t}: Tab at the end of a written ${t} keeps the line, adds an empty ${NEXT[t]} below it, the caret is there and the next keys land there`,
      after.length === rows.length + 1 && after[at].t === t && after[at].x === WRITTEN[t] && after[at + 1]?.t === NEXT[t] && after[at + 1]?.x === '' && act?.i === at + 1 && act?.focused === true && typed[at + 1]?.x === 'zz' && typed[at].x === WRITTEN[t],
      { after, act, typed: typed.slice(at) });
  }

  // ---- BLANK
  await open([['scene', WRITTEN.scene], ['character', '']]);
  await tab();
  const blank = await lines();
  ok('T9: a blank line still changes type in place (a blank Character becomes a Transition), with no new line', blank.length === 2 && blank[1].t === 'transition' && blank[1].x === '', blank);

  // ---- MID
  await open([['scene', WRITTEN.scene], ['action', 'Keep this whole line.']]);
  await caretAt(5);
  await tab();
  const mid = await lines(), midAct = await active();
  ok('T10: Tab in the middle of a written line does not split or rewrite it; the new line goes below it', mid.length === 3 && mid[1].t === 'action' && mid[1].x === 'Keep this whole line.' && mid[2].t === 'character' && mid[2].x === '' && midAct?.i === 2, { mid, midAct });

  // ---- COMMIT
  await open([['scene', WRITTEN.scene], ['character', 'MARA'], ['dialogue', 'One.'], ['action', 'She sits.'], ['character', 'mara']]);
  await tab();
  const commit = await lines();
  ok("T11: leaving a cue by Tab commits it as Enter does: capitals and the automatic (CONT'D)", commit[4]?.t === 'character' && commit[4]?.x === "MARA (CONT'D)" && commit[5]?.t === 'paren', commit.slice(4));

  // ---- LIST
  await open([['scene', WRITTEN.scene], ['character', 'MARCUS'], ['dialogue', 'One.'], ['character', '']]);
  await type('ma');
  await tab();
  const list1 = await lines();
  await tab();
  const list2 = await lines();
  ok('T12: with the name list open, Tab takes the name and adds nothing; the next Tab adds the next line', list1.length === 4 && list1[3].x === 'MARCUS' && list1[3].t === 'character' && list2.length === 5 && list2[3].x === 'MARCUS' && list2[4].t === 'paren', { list1: list1.slice(3), list2: list2.slice(3) });

  // ---- BACK
  await open([['scene', WRITTEN.scene], ['character', 'MARA']]);
  await tab(true);
  const back = await lines();
  ok('T13: Shift+Tab still walks a line\'s type backward in place', back.length === 2 && back[1].t === 'action' && back[1].x === 'MARA', back);

  // ---- SAVED
  const savedId = await open([['scene', WRITTEN.scene], ['action', '']]);
  await type('He sits.'); await tab();
  await type('mara'); await tab();
  await type('(beat)'); await enter();
  await type('Hi.');
  await sleep(2700);   // the page's own autosave
  const stored = await app.evalJs(`(() => { window.wrizoFlushNow(); const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((r) => r.id === ${q(savedId)}); return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]) : null; })()`);
  ok('T14: a short exchange typed with Tab is saved line by line, each in its own type', same(stored, [['scene', WRITTEN.scene], ['action', 'He sits.'], ['character', 'MARA'], ['paren', '(beat)'], ['dialogue', 'Hi.']]), stored);
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 14;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-TAB VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-TAB VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

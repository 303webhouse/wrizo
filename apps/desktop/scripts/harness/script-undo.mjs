// SCRIPT #4: SCRIPT-WIDE UNDO AND REDO (the review's finding 4: K10, K11, K12; Fable, Nov 22 and 23). Each line was its own short-lived editor, so undo stopped at the edge of a line.
// Machina, ?reorg=1, seeded through the app's own seams, real keys and a real mouse.
//
// ACROSS LINES  U1   Enter that split a line is undone, and the next keys land where the split was
//               U2   Backspace that joined two lines is undone
//               U3   words typed before clicking to another line are undone, and the caret goes back to them
//               U4   (control) words typed in one line are undone
// REDO          U5   Ctrl+Y puts the step back
//               U6   Ctrl+Shift+Z puts the step back
// DEEP          U7   a chain of four steps across lines walks all the way back, and all the way forward
// EVERY EDIT    U8   the line Tab added is undone
//               U9   a change of line type is undone
//               U10  Delete that joined two lines is undone
//               U11  (control) a selected word removed is undone
// THE RULES     U12  an undo reaches storage
//               U13  a new edit after an undo ends the redo
//               U14  capitals added on leaving a line are not a step of their own
//               U15  (control) with nothing to undo, the page does not change
//               U16  the Edit menu's Undo (the browser's own history event) takes the same path
//               U17  a pause in typing separates two undo steps
//               U18  (control) Ctrl+Z does not take back a Replace All, and the search panel's own Undo still does
// FROM OUTSIDE  U19  lines another window saved are not taken back by Ctrl+Z (Fable, Nov 23, 3:25 pm: they reset the history, as Replace does)
//               U20  (control) this page's own autosave does not reset the history
//               U21  the same with unsaved typing here when the other window's lines arrive
// THE COST      U22  a store notice about another page builds no key of this script (Fable, Nov 23, 5:10 pm)
//               U23  a typed key builds no key of this script
//               The other window is a real one: a same-origin iframe of the app, its own realm and cache on the one localStorage, writing through the app's own seam.
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-undo.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const HEAD = ['scene', 'INT. A - DAY'];
const act = (x) => ['action', x];

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
const LINES = "(() => { const m = new Map(); for (const e of document.querySelectorAll('.script-el[data-doc-index]')) { const i = +e.dataset.docIndex; const c = m.get(i) || { t: e.dataset.type, x: '' }; c.x += e.textContent; m.set(i, c); } return [...m.entries()].sort((a, b) => a[0] - b[0]).map((x) => [x[1].t, x[1].x]); })()";
const ACTIVE = "(() => { const a = document.querySelector('.script-el-active'); return a ? { i: +a.dataset.docIndex, focused: document.activeElement === a } : null; })()";
const STORED = (id) => `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${q(id)}); return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]) : null; })()`;
const VK = { Backspace: 8, Tab: 9, Enter: 13, Delete: 46, ArrowDown: 40 };
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const setInput = (sel, v) => `(() => { const i = document.querySelector(${q(sel)}); if (!i) return false; i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${q(v)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;

await withHarness(async (app) => {
  const lines = () => app.evalJs(LINES);
  const active = () => app.evalJs(ACTIVE);
  const key = async (k) => {
    const p = { key: k, code: k, windowsVirtualKeyCode: VK[k], nativeVirtualKeyCode: VK[k] };
    if (k === 'Enter') await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...p, text: '\r', unmodifiedText: '\r' });
    else await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(180);
  };
  const ctrl = async (letter, shift = false) => {
    const up = letter.toUpperCase();
    const p = { key: shift ? up : letter, code: `Key${up}`, windowsVirtualKeyCode: up.charCodeAt(0), nativeVirtualKeyCode: up.charCodeAt(0), modifiers: shift ? 10 : 2 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(220);
  };
  const undo = () => ctrl('z');
  const redo = () => ctrl('y');
  const ctrlDigit = async (d) => {
    const p = { key: String(d), code: `Digit${d}`, windowsVirtualKeyCode: 48 + d, nativeVirtualKeyCode: 48 + d, modifiers: 2 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(160);
  };
  const type = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } await sleep(120); };
  const caret = (o) => app.evalJs(`(() => { const a = document.querySelector('.script-el-active'); if (!a) return false; a.focus(); const t = a.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, ${o === 'end' ? 't.length' : `Math.min(${o}, t.length)`}); else r.setStart(a, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const select = (a, b) => app.evalJs(`(() => { const n = document.querySelector('.script-el-active'); const t = n.firstChild; const s = getSelection(); const r = document.createRange(); r.setStart(t, ${a}); r.setEnd(t, ${b}); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const mouse = async (x, y) => {
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(220);
  };
  const clickLine = async (at) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${at}"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (p) await mouse(p.x, p.y);
    await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at}'`, { label: 'the line active', timeout: 4000 }).catch(() => {});
  };
  // a page with these lines, opened from the Desk, with line `at` active and the caret at its end
  const open = async (rows, at = 0, projectId = null) => {
    const id = `su-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))}, pageType: 'script', origin: ${projectId ? "'project'" : "'journal'"}, source: 'page', projectId: ${q(projectId)}, createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(380);
    if (at > 0) await clickLine(at);
    await caret('end');
    await sleep(80);
    return id;
  };
  // A closing window writes its whole, older store, so the old one goes BEFORE the next page is made (writing-audit/lib/tabs-common.mjs)
  const dropOther = async () => { if (await app.evalJs("(() => { const f = document.getElementById('su-other'); if (f) f.remove(); return !!f; })()")) await sleep(600); };
  const otherWindow = async () => {
    await app.evalJs("(() => { const f = document.createElement('iframe'); f.id = 'su-other'; f.src = location.origin + location.pathname + '?reorg=1&arbor2=0#/'; f.style.cssText = 'position:fixed;left:-2000px;top:0;width:900px;height:600px;border:0'; document.body.appendChild(f); return true; })()");
    await app.waitFor("(() => { try { const w = document.getElementById('su-other').contentWindow; return !!w.wrizoPatchEntry && !!w.document.querySelector('.wz-arrival'); } catch { return false; } })()", { label: 'the other window', timeout: 20000 });
    await sleep(300);
  };
  const outside = async (id, rows) => {
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const w = document.getElementById('su-other').contentWindow; return !!w.wrizoPatchEntry(${q(id)}, { script: ${q(doc)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))} }); })()`);
    await sleep(300);
  };
  const storedAs = async (id, want) => {
    await app.waitFor(`JSON.stringify(${STORED(id)}) === ${q(JSON.stringify(want))}`, { label: 'the stored lines', timeout: 5000 }).catch(() => {});
    return app.evalJs(STORED(id));
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  const docId = await app.evalJs("window.wrizoCreateProject('Spin').id");
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'su-elsewhere', text: 'Another page.', origin: 'journal', source: 'page' }); null");

  // ---- ACROSS LINES
  const R1 = [HEAD, act('First second')];
  await open(R1, 1); await caret(5); await key('Enter');
  const u1split = await lines();
  await undo();
  const u1 = await lines(), u1a = await active();
  await type('X');
  const u1t = await lines();
  ok('U1: Enter that split a line is undone, and the next keys land where the split was', u1split.length === 3 && same(u1, R1) && u1a?.i === 1 && u1a?.focused === true && u1t[1]?.[1] === 'FirstX second', { u1split, u1, u1a, u1t: u1t[1] });

  const R2 = [HEAD, act('One'), act('Two')];
  await open(R2, 2); await caret(0); await key('Backspace');
  const u2join = await lines();
  await undo();
  const u2 = await lines(), u2a = await active();
  await type('X');
  const u2t = await lines();
  ok('U2: Backspace that joined two lines is undone', same(u2join, [HEAD, act('OneTwo')]) && same(u2, R2) && u2a?.i === 2 && u2t[2]?.[1] === 'XTwo', { u2join, u2, u2a, u2t: u2t[2] });

  const R3 = [HEAD, act('Alpha'), act('Beta')];
  await open(R3, 1); await type(' more'); await clickLine(2);
  const u3typed = await lines();
  await undo();
  const u3 = await lines(), u3a = await active();
  await type('X');
  const u3t = await lines();
  ok('U3: words typed before clicking to another line are undone, and the caret goes back to them', u3typed[1]?.[1] === 'Alpha more' && same(u3, R3) && u3a?.i === 1 && u3t[1]?.[1] === 'AlphaX', { u3typed: u3typed[1], u3, u3a, u3t: u3t[1] });

  await open([HEAD, act('Alpha')], 1); await type(' more'); await undo();
  const u4 = await lines();
  ok('U4 (control): words typed in one line are undone', same(u4, [HEAD, act('Alpha')]), { u4 });

  // ---- REDO
  await open(R1, 1); await caret(5); await key('Enter');
  const u5want = await lines();
  await undo();
  const u5back = await lines();   // the undo must have happened, or a redo that does nothing would pass
  await redo();
  const u5 = await lines();
  ok('U5: Ctrl+Y puts the step back', u5want.length === 3 && same(u5back, R1) && same(u5, u5want), { u5back, u5, u5want });

  await open(R1, 1); await caret(5); await key('Enter');
  const u6want = await lines();
  await undo();
  const u6back = await lines();
  await ctrl('z', true);
  const u6 = await lines();
  ok('U6: Ctrl+Shift+Z puts the step back', u6want.length === 3 && same(u6back, R1) && same(u6, u6want), { u6back, u6, u6want });

  // ---- DEEP
  await open(R2, 1);
  await type('A'); await key('Enter'); await type('B'); await key('ArrowDown'); await caret(0); await key('Backspace');
  const u7end = await lines();
  const walk = [];
  for (let i = 0; i < 4; i++) { await undo(); walk.push(await lines()); }
  const u7back = await lines();
  for (let i = 0; i < 4; i++) await redo();
  const u7fwd = await lines();
  ok('U7: a chain of four steps across lines walks all the way back, and all the way forward', same(u7end, [HEAD, act('OneA'), act('BTwo')]) && same(walk[0], [HEAD, act('OneA'), act('B'), act('Two')]) && same(walk[1], [HEAD, act('OneA'), act(''), act('Two')]) && same(walk[2], [HEAD, act('OneA'), act('Two')]) && same(u7back, R2) && same(u7fwd, u7end), { u7end, walk, u7fwd });

  // ---- EVERY EDIT
  await open([HEAD, act('Alpha')], 1); await key('Tab');
  const u8added = await lines();
  await undo();
  const u8 = await lines();
  ok('U8: the line Tab added is undone', u8added.length === 3 && same(u8, [HEAD, act('Alpha')]), { u8added, u8 });

  await open([HEAD, act('')], 1); await ctrlDigit(3);
  const u9c = await lines();
  await undo();
  const u9 = await lines();
  ok('U9: a change of line type is undone', u9c[1]?.[0] === 'character' && u9[1]?.[0] === 'action', { u9c: u9c[1], u9: u9[1] });

  await open(R2, 1); await key('Delete');
  const u10join = await lines();
  await undo();
  const u10 = await lines();
  ok('U10: Delete that joined two lines is undone', same(u10join, [HEAD, act('OneTwo')]) && same(u10, R2), { u10join, u10 });

  await open([HEAD, act('Alpha beta gamma')], 1); await select(6, 11); await key('Backspace');
  const u11cut = await lines();
  await undo();
  const u11 = await lines();
  ok('U11 (control): a selected word removed is undone', u11cut[1]?.[1] === 'Alpha gamma' && u11[1]?.[1] === 'Alpha beta gamma', { u11cut: u11cut[1], u11: u11[1] });

  // ---- THE RULES
  const u12id = await open(R1, 1); await caret(5); await key('Enter');
  const u12split = await storedAs(u12id, [HEAD, act('First'), act('second')]);
  await undo();
  const u12 = await storedAs(u12id, R1);
  ok('U12: an undo reaches storage', same(u12split, [HEAD, act('First'), act('second')]) && same(u12, R1), { u12split, u12 });

  await open(R1, 1); await caret(5); await key('Enter'); await undo(); await type('x');
  const u13before = await lines();
  await redo();
  const u13 = await lines();
  ok('U13: a new edit after an undo ends the redo', u13before[1]?.[1] === 'Firstx second' && same(u13, u13before), { u13before, u13 });

  await open([HEAD, ['character', ''], act('Next.')], 1); await type('mara'); await key('ArrowDown');
  const u14left = await lines();
  await undo();
  const u14 = await lines();
  ok('U14: capitals added on leaving a line are not a step of their own', u14left[1]?.[1] === 'MARA' && u14[1]?.[1] === '', { u14left: u14left[1], u14: u14[1] });

  await open([HEAD, act('Alpha')], 1); await undo();
  const u15 = await lines(), u15a = await active();
  ok('U15 (control): with nothing to undo, the page does not change', same(u15, [HEAD, act('Alpha')]) && u15a?.i === 1, { u15, u15a });

  await open(R1, 1); await caret(5); await key('Enter');
  await app.evalJs("(() => { const a = document.querySelector('.script-el-active'); a.dispatchEvent(new InputEvent('beforeinput', { inputType: 'historyUndo', bubbles: true, cancelable: true })); return true; })()");
  await sleep(220);
  const u16 = await lines();
  ok("U16: the Edit menu's Undo (the browser's own history event) takes the same path", same(u16, R1), { u16 });

  await open([HEAD, act('')], 1); await type('one'); await sleep(1300); await type('two');
  await undo();
  const u17a = await lines();
  await undo();
  const u17b = await lines();
  ok('U17: a pause in typing separates two undo steps', u17a[1]?.[1] === 'one' && u17b[1]?.[1] === '', { u17a: u17a[1], u17b: u17b[1] });

  // ---- FIND AND REPLACE KEEPS ITS OWN UNDO
  const r0 = [HEAD, ['character', 'MARA'], ['dialogue', 'Mara knows.']];
  const r1 = [HEAD, ['character', 'DELIA'], ['dialogue', 'Delia knows.']];
  const rId = await open(r0, 2, docId);
  await app.waitFor("!!document.querySelector('[data-top-search]')", { label: 'the search button', timeout: 8000 }).catch(() => {});
  await app.evalJs(click('[data-top-search]'));
  await app.waitFor("!!document.querySelector('[data-search-menu]')", { label: 'the search menu', timeout: 4000 }).catch(() => {});
  await sleep(350);
  await app.evalJs(setInput('[data-search-menu] [data-search-q]', 'Mara')); await sleep(450);
  if (await app.evalJs("document.querySelector('[data-replace-toggle]')?.getAttribute('aria-expanded') === 'false'")) { await app.evalJs(click('[data-search-menu] [data-replace-toggle]')); await sleep(250); }
  await app.evalJs(setInput('[data-search-menu] [data-replace-with]', 'delia')); await sleep(350);
  await app.evalJs(click('[data-search-menu] [data-replace-all]'));
  const r18a = await storedAs(rId, r1);
  await app.evalJs("(() => { const a = document.querySelector('.script-el-active'); if (a) a.focus(); return !!a; })()");
  await sleep(120);
  await undo();
  await sleep(250);
  const r18page = await lines();
  const r18b = await app.evalJs(STORED(rId));
  await app.evalJs(click('[data-search-menu] [data-replace-undo]'));
  const r18c = await storedAs(rId, r0);
  await sleep(250);
  const r18cp = await lines();
  ok("U18 (control): Ctrl+Z does not take back a Replace All, and the search panel's own Undo still does", same(r18a, r1) && same(r18page, r1) && same(r18b, r1) && same(r18c, r0) && same(r18cp, r0), { r18a, r18page, r18b, r18c, r18cp });

  // ---- LINES FROM OUTSIDE
  const M1 = [HEAD, act('Mine more')], T1 = [HEAD, act('Mine more'), act('From the other window.')];
  const u19id = await open([HEAD, act('Mine')], 1); await type(' more');
  const u19saved = await storedAs(u19id, M1);
  await otherWindow();
  await outside(u19id, T1);
  const u19arrived = await app.evalJs(STORED(u19id));
  await caret('end'); await undo();
  await sleep(2600);   // long enough for the page's own autosave to write anything the undo changed
  const u19 = await app.evalJs(STORED(u19id));
  ok('U19: lines another window saved are not taken back by Ctrl+Z', same(u19saved, M1) && same(u19arrived, T1) && same(u19, T1), { u19saved, u19arrived, u19 });
  // MEASURED, not a check: what the open page does with those lines today, for Fable's ruling
  const shownThen = await lines();
  await caret('end'); await type('x');
  await sleep(2600);
  const afterKey = await app.evalJs(STORED(u19id));
  console.log(`MEASURED (not a check): the open page shows ${JSON.stringify(shownThen.map((l) => l[1]))}; after one more key and its autosave the store holds ${JSON.stringify(afterKey?.map((l) => l[1]))}`);
  await dropOther();

  const u20id = await open([HEAD, act('Mine')], 1); await type(' more');
  const u20saved = await storedAs(u20id, M1);
  await undo();
  const u20 = await lines();
  ok('U20 (control): this page\'s own autosave does not reset the history', same(u20saved, M1) && same(u20, [HEAD, act('Mine')]), { u20saved, u20 });

  const u21id = await open([HEAD, act('Mine')], 1);
  await otherWindow();
  await caret('end'); await type('x');
  await outside(u21id, [HEAD, act('Mine'), act('Theirs.')]);
  await caret('end'); await undo();
  const u21 = await lines();
  ok('U21: with unsaved typing here when the other window\'s lines arrive, Ctrl+Z does not step back across them', u21[1]?.[1] === 'Minex', { u21 });
  await dropOther();

  // ---- THE COST: a key of the script is a join on this separator of parts that each start with a line type (the rail and the export sheet join other things on it, so the matcher reads the parts);
  // the last step below proves the counter is alive: a real change to this page's row must build a key
  const costId = await open([HEAD, act('Mine')], 1);
  await app.evalJs("(() => { if (!window.__suKeys) { const real = Array.prototype.join; const line = /^(scene|action|character|paren|dialogue|transition|shot|general)\\u0001/; window.__suKeys = { n: 0 }; Array.prototype.join = function (s) { if (s === '\\u0002' && this.length > 0 && typeof this[0] === 'string' && line.test(this[0])) window.__suKeys.n += 1; return real.call(this, s); }; } window.__suKeys.n = 0; return true; })()");
  await app.evalJs("(() => { for (let i = 0; i < 5; i++) window.wrizoPatchEntry('su-elsewhere', { starred: i % 2 === 0 }); return true; })()");
  const u22 = await app.evalJs('window.__suKeys.n');
  ok('U22: a store notice about another page builds no key of this script', u22 === 0, { keysBuilt: u22, notices: 5 });
  await caret('end');
  await app.evalJs('window.__suKeys.n = 0; true');
  await type('abcde');
  const u23 = await app.evalJs('window.__suKeys.n');
  const u23t = await lines();
  await app.evalJs(`window.__suKeys.n = 0; window.wrizoPatchEntry(${q(costId)}, { starred: true }); true`);
  const alive = await app.evalJs('window.__suKeys.n');
  ok('U23: a typed key builds no key of this script (and the counter is alive: a change to this page\'s row builds one)', u23 === 0 && u23t[1]?.[1] === 'Mineabcde' && alive > 0, { keysBuilt: u23, keys: 5, line: u23t[1], alive });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 23;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-UNDO VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-UNDO VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

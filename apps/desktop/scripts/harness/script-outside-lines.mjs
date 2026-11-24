// SCRIPT #115: AN OPEN SCREENPLAY TAKES IN LINES FROM OUTSIDE (found building #4; Fable, Nov 23, 5:10 pm: "Nothing unsaved: take the lines through Replace's path. Unsaved typing: merge, never dropping either side's words;
// where both changed the same line, keep both versions, as prose's #76 does."). Before this an open script page never saw another window's or device's lines, and the writer's next key saved over them.
// Machina, ?reorg=1, seeded through the app's own seams, real keys. The other window is a real one: a same-origin iframe of the app, its own realm and cache on the one localStorage, writing through the app's seam.
// A device is the app's own pull path (applyRemoteRecords, through its seam), with the page's sync base in place.
//
// NOTHING UNSAVED  W1  another window's new line appears on this page, in its type, and nothing is written back
//                  W2  the writer's next key keeps that line
//                  W3  a line added above the writer's: the next key still lands in the writer's line
//                  W4  Ctrl+Z after taking the lines does not take them back
// UNSAVED TYPING   W5  my typing in one line, their new line: both are on the page and stored, once each
//                  W6  both changed the SAME line: both whole versions are kept, each once, and the page says so
//                  W7  we changed different lines: both edits stand
//                  W8  (control) with another window open, this page's own saves double nothing and keep its undo
// ANOTHER DEVICE   D1  a pull onto a page with unsaved lines: the stored script holds both sides, and its text is that script's own rendering
//                  D2  a pull onto an open page with nothing unsaved in it: the page shows the device's line
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-outside-lines.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const HEAD = ['scene', 'INT. A - DAY'];
const act = (x) => ['action', x];
const textOf = (rows) => rows.map((r) => r[1]).join('\n\n');
const times = (rows, s) => (rows ?? []).filter((r) => r[1] === s).length;

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
const ROW = (id) => `(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${q(id)}) || null)`;
const STORED = (id) => `(() => { const e = ${ROW(id)}; return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]) : null; })()`;
const STORED_TEXT = (id) => `(${ROW(id)}?.text ?? null)`;

await withHarness(async (app) => {
  const lines = () => app.evalJs(LINES);
  const stored = (id) => app.evalJs(STORED(id));
  const enterKeyless = sleep;
  const undo = async () => {
    const p = { key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90, modifiers: 2 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await enterKeyless(220);
  };
  const type = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } await sleep(120); };
  const caret = (o) => app.evalJs(`(() => { const a = document.querySelector('.script-el-active'); if (!a) return false; a.focus(); const t = a.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, ${o === 'end' ? 't.length' : `Math.min(${o}, t.length)`}); else r.setStart(a, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const clickLine = async (at) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${at}"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (p) {
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
      await sleep(220);
    }
    await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at}'`, { label: 'the line active', timeout: 4000 }).catch(() => {});
  };
  // a closing window writes its whole, older store, so the old one goes BEFORE the next page is made (writing-audit/lib/tabs-common.mjs)
  const dropOther = async () => { if (await app.evalJs("(() => { const f = document.getElementById('so-other'); if (f) f.remove(); return !!f; })()")) await sleep(600); };
  const open = async (rows, at = 0) => {
    await dropOther();
    const id = `so-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(textOf(rows))}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(380);
    if (at > 0) await clickLine(at);
    await caret('end');
    await sleep(80);
    return id;
  };
  const otherWindow = async () => {
    await app.evalJs("(() => { const f = document.createElement('iframe'); f.id = 'so-other'; f.src = location.origin + location.pathname + '?reorg=1&arbor2=0#/'; f.style.cssText = 'position:fixed;left:-2000px;top:0;width:900px;height:600px;border:0'; document.body.appendChild(f); return true; })()");
    await app.waitFor("(() => { try { const w = document.getElementById('so-other').contentWindow; return !!w.wrizoPatchEntry && !!w.document.querySelector('.wz-arrival'); } catch { return false; } })()", { label: 'the other window', timeout: 20000 });
    await sleep(300);
  };
  const outside = async (id, rows) => {
    await app.evalJs(`(() => { const w = document.getElementById('so-other').contentWindow; return !!w.wrizoPatchEntry(${q(id)}, { script: ${q(docOf(id, rows))}, text: ${q(textOf(rows))} }); })()`);
  };
  // a pull from another device through the app's own path; the base is the text this device last synced
  const pull = async (id, rows, baseRows) => {
    await app.evalJs(`(() => { localStorage.setItem('wrizo-sync-base:' + ${q(id)}, ${q(textOf(baseRows))}); const row = ${ROW(id)}; window.wrizoApplyRemoteBoard({ ...row, script: ${q(docOf(id, rows))}, text: ${q(textOf(rows))}, updatedAt: new Date(Date.now() + 60000).toISOString() }); return true; })()`);
  };
  const shownAs = async (pred) => { await app.waitFor(`(${pred})(${LINES})`, { label: 'the page', timeout: 6000 }).catch(() => {}); return lines(); };
  const storedAs = async (id, pred) => { await app.waitFor(`(() => { const r = ${STORED(id)}; return !!r && (${pred})(r); })()`, { label: 'the store', timeout: 7000 }).catch(() => {}); return stored(id); };
  const has = (...words) => `(r) => ${q(words)}.every((w) => r.some((l) => l[1] === w))`;

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  // ---- NOTHING UNSAVED
  const T1 = [HEAD, act('Mine.'), ['character', 'THEO'], ['dialogue', 'From the other window.']];
  const w1 = await open([HEAD, act('Mine.')], 1);
  await otherWindow();
  await outside(w1, T1);
  const w1page = await shownAs(`(r) => r.length === 4`);
  await sleep(2600);   // anything the page wrote back would be stored by now
  const w1st = await stored(w1);
  ok('W1: another window\'s new line appears on this page, in its type, and nothing is written back', same(w1page, T1) && same(w1st, T1), { w1page, w1st });

  await caret('end');
  await type('x');
  const w2st = await storedAs(w1, has('From the other window.', 'Mine.x'));
  ok('W2: the writer\'s next key keeps that line', times(w2st, 'From the other window.') === 1 && times(w2st, 'Mine.x') === 1, { w2st });

  const w3 = await open([HEAD, act('Mine.')], 1);
  await otherWindow();
  await outside(w3, [HEAD, act('Above.'), act('Mine.')]);
  await shownAs(`(r) => r.length === 3`);
  await sleep(250);
  await type('Z');
  const w3page = await lines();
  ok('W3: a line added above the writer\'s: the next key still lands in the writer\'s line', same(w3page, [HEAD, act('Above.'), act('Mine.Z')]), { w3page });

  const w4 = await open([HEAD, act('Mine')], 1);
  await type(' more');
  await storedAs(w4, has('Mine more'));
  await otherWindow();
  const T4 = [HEAD, act('Mine more'), act('Theirs.')];
  await outside(w4, T4);
  await shownAs(`(r) => r.length === 3`);
  await caret('end');
  await undo();
  await sleep(2600);
  const w4page = await lines(), w4st = await stored(w4);
  ok('W4: Ctrl+Z after taking the lines does not take them back', same(w4page, T4) && same(w4st, T4), { w4page, w4st });

  // ---- UNSAVED TYPING
  const w5 = await open([HEAD, act('Mine line.'), act('Other line.')], 1);
  await otherWindow();
  await caret('end');
  await type(' typed');
  await outside(w5, [HEAD, act('Mine line.'), act('Other line.'), act('Their new line.')]);
  const W5 = [HEAD, act('Mine line. typed'), act('Other line.'), act('Their new line.')];
  const w5st = await storedAs(w5, has('Mine line. typed', 'Their new line.'));
  const w5page = await shownAs(`(r) => r.length === 4`);
  ok('W5: my typing in one line, their new line: both are on the page and stored, once each', same(w5st, W5) && same(w5page, W5), { w5st, w5page });

  const w6 = await open([HEAD, act('Shared line.')], 1);
  await otherWindow();
  await caret('end');
  await type(' mine');
  await outside(w6, [HEAD, act('Shared line. theirs')]);
  const w6said = await app.waitFor("document.body.innerText.includes('Both versions')", { label: 'the notice', timeout: 7000 }).then(() => true).catch(() => false);
  const w6st = await storedAs(w6, has('Shared line. mine', 'Shared line. theirs'));
  const w6page = await shownAs(`(r) => r.length === 3`);
  const W6 = [HEAD, act('Shared line. mine'), act('Shared line. theirs')];
  ok('W6: both changed the SAME line: both whole versions are kept, each once, and the page says so', same(w6st, W6) && same(w6page, W6) && w6said, { w6st, w6page, w6said });

  const w7 = await open([HEAD, act('One.'), act('Two.')], 1);
  await otherWindow();
  await caret('end');
  await type(' mine');
  await outside(w7, [HEAD, act('One.'), act('Two. theirs')]);
  const W7 = [HEAD, act('One. mine'), act('Two. theirs')];
  const w7st = await storedAs(w7, has('One. mine', 'Two. theirs'));
  const w7page = await shownAs(`(r) => r.some((l) => l[1] === 'Two. theirs')`);
  ok('W7: we changed different lines: both edits stand', same(w7st, W7) && same(w7page, W7), { w7st, w7page });

  const w8 = await open([HEAD, act('Mine')], 1);
  await otherWindow();
  await caret('end');
  await type(' one');
  await storedAs(w8, has('Mine one'));
  await sleep(1200);
  await caret('end');
  await type(' two');
  const w8st = await storedAs(w8, has('Mine one two'));
  await caret('end');
  await undo();
  const w8page = await lines();
  ok('W8 (control): with another window open, this page\'s own saves double nothing and keep its undo', same(w8st, [HEAD, act('Mine one two')]) && same(w8page, [HEAD, act('Mine one')]), { w8st, w8page });

  // ---- ANOTHER DEVICE
  await dropOther();
  const B1 = [HEAD, act('Alpha.')];
  const d1 = await open(B1, 1);
  await type(' mine');
  await storedAs(d1, has('Alpha. mine'));
  await pull(d1, [HEAD, act('Alpha.'), act('From the device.')], B1);
  const D1 = [HEAD, act('Alpha. mine'), act('From the device.')];
  const d1st = await storedAs(d1, has('Alpha. mine', 'From the device.'));
  const d1text = await app.evalJs(STORED_TEXT(d1));
  const d1page = await shownAs(`(r) => r.length === 3`);
  ok('D1: a pull onto a page with unsaved lines: the stored script holds both sides, and its text is that script\'s own rendering', same(d1st, D1) && d1text === textOf(D1) && same(d1page, D1), { d1st, d1text, d1page });

  const d2 = await open(B1, 1);
  await pull(d2, [HEAD, act('Alpha.'), act('From the device.')], B1);
  const d2page = await shownAs(`(r) => r.length === 3`);
  ok('D2: a pull onto an open page with nothing unsaved in it: the page shows the device\'s line', same(d2page, [HEAD, act('Alpha.'), act('From the device.')]), { d2page });
  await dropOther();
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 10;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-OUTSIDE-LINES VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-OUTSIDE-LINES VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

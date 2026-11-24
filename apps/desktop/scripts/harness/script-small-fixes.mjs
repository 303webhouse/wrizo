// SCRIPT #7: THE SMALL FIXES (the review's findings 8 to 11 and 30; Fable, Nov 23). Seeded through the app's own seams, real keys and a real mouse, the real file read from disk.
//
// BLANK HEADING  B1  a script that opens with FADE IN: keeps it first after a reload, with no blank scene heading above it
//                B2  a first line retyped to Action is stored first, with no blank heading
//                B3  (control) a fresh page still has its one empty scene heading
// PARENTHESES    P1  a parenthetical typed without parentheses gets them when the line is left, and is stored with them
//                P2  half-typed parentheses are completed; a finished one is left alone
// "EST."         E1  an action line "Est. 1962, says the sign." stays action
//                E2  a word that only begins like a slugline (Estelle, Extra, Interesting) stays action
//                E3  (control) EST., int. and ext. still make a scene heading
//                E4  a line changed back to Action is not promoted again by the next key
// ENTER          M1  Enter in the middle of a speech keeps both halves as dialogue
//                M2  (control) Enter at the end of a speech still goes to Action
// FILE NAMES     N1  a named screenplay Part is named for its Doc and its Part
//                N2  an unnamed screenplay Part is named for its Doc
//                N3  (control) a loose screenplay keeps its first line as its name
//                N4  (control) a prose page keeps its first line as its name
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-small-fixes.mjs
import { withHarness } from '../runtime-verify.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
const LINES = "(() => { const m = new Map(); for (const e of document.querySelectorAll('.script-el[data-doc-index]')) { const i = +e.dataset.docIndex; const c = m.get(i) || { t: e.dataset.type, x: '' }; c.x += e.textContent; m.set(i, c); } return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => [c.t, c.x]); })()";
const STORED = (id) => `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${q(id)}); return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]) : null; })()`;
const VK = { Enter: 13 };

await withHarness(async (app) => {
  const lines = () => app.evalJs(LINES);
  const enter = async () => {
    const p = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: VK.Enter, nativeVirtualKeyCode: VK.Enter };
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...p, text: '\r', unmodifiedText: '\r' });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(180);
  };
  const ctrlDigit = async (d) => {
    const p = { key: String(d), code: `Digit${d}`, windowsVirtualKeyCode: 48 + d, nativeVirtualKeyCode: 48 + d, modifiers: 2 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(160);
  };
  const type = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } await sleep(120); };
  const caret = (o) => app.evalJs(`(() => { const a = document.querySelector('.script-el-active'); a.focus(); const t = a.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, ${o === 'end' ? 't.length' : `Math.min(${o}, t.length)`}); else r.setStart(a, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const mouse = async (x, y) => {
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(220);
  };
  const pressSel = async (sel) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector(${q(sel)}); if (!e || e.disabled) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const h = document.elementFromPoint(x, y); return { x, y, hit: !!h && (h === e || e.contains(h)) }; })()`);
    if (!p || !p.hit) return false;
    await mouse(p.x, p.y);
    return true;
  };
  // a page with these lines, opened from the Desk, with line `at` active and the caret at its end
  const open = async (rows, at = 0) => {
    const id = `sf-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(380);
    if (at > 0) {
      const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${at}"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 10)) }; })()`);
      if (p) await mouse(p.x, p.y);
      await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at}'`, { label: 'the line active', timeout: 4000 }).catch(() => {});
    }
    await caret('end');
    await sleep(80);
    return id;
  };
  // the stored lines once `want` has reached storage (the autosave is 2 s); on a timeout, what is really stored
  const storedOnce = async (id, want) => {
    await app.waitFor(`(${STORED(id)} || []).some((l) => l[1] === ${q(want)})`, { label: 'the stored line', timeout: 4500 }).catch(() => {});
    return app.evalJs(STORED(id));
  };
  const downloadName = async (id) => {
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el, .forward-only-editor')", { label: 'the page', timeout: 15000 });
    await sleep(500);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'script-small-'));
    await app.enableDownloads(dir);
    const tab = await pressSel('[data-mode-key="publish"]');
    await app.waitFor("!!document.querySelector('.publish-download-page-md')", { label: 'the download button', timeout: 6000 }).catch(() => {});
    const pressed = tab && await pressSel('.publish-download-page-md');
    const deadline = Date.now() + 8000;
    while (pressed && Date.now() < deadline) {
      await sleep(80);
      const names = fs.readdirSync(dir).filter((x) => !x.endsWith('.crdownload'));
      if (names.length === 1) return names[0];
    }
    return null;
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  // ---- THE BLANK HEADING
  const b1 = await open([['scene', '']]);
  await ctrlDigit(6);
  await type('FADE IN:');
  await enter();
  await type('INT. KITCHEN - DAY');
  const b1stored = await storedOnce(b1, 'INT. KITCHEN - DAY');
  await app.reload();
  await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the page again', timeout: 15000 });
  await sleep(450);
  const b1lines = await lines();
  ok('B1: a script that opens with FADE IN: keeps it first after a reload, with no blank heading above it', b1stored?.[0]?.[1] === 'FADE IN:' && b1lines[0]?.[1] === 'FADE IN:' && b1lines.every((l) => l[1].trim().length > 0), { b1stored, b1lines });

  const b2 = await open([['scene', '']]);
  await ctrlDigit(2);
  await type('Rain on glass.');
  const b2stored = await storedOnce(b2, 'Rain on glass.');
  ok('B2: a first line retyped to Action is stored first, with no blank heading', same(b2stored, [['action', 'Rain on glass.']]), { b2stored });

  await open([['scene', '']]);
  const b3 = await lines();
  ok('B3 (control): a fresh page still has its one empty scene heading', b3.length === 1 && b3[0][0] === 'scene' && b3[0][1].trim() === '', { b3 });

  // ---- PARENTHESES
  const p1 = await open([HEAD, ['character', 'MARA'], ['paren', '']], 2);
  await type('beat');
  await enter();
  const p1shown = await lines();
  const p1stored = await storedOnce(p1, '(beat)');
  ok('P1: a parenthetical typed without parentheses gets them when the line is left, and is stored with them', p1shown[2]?.[1] === '(beat)' && p1stored?.[2]?.[1] === '(beat)', { p1shown: p1shown[2], p1stored: p1stored?.[2] });

  const parens = {};
  for (const typed of ['(beat', 'beat)', '(already)']) {
    await open([HEAD, ['character', 'MARA'], ['paren', '']], 2);
    await type(typed);
    await enter();
    parens[typed] = (await lines())[2]?.[1];
  }
  ok('P2: half-typed parentheses are completed; a finished one is left alone', parens['(beat'] === '(beat)' && parens['beat)'] === '(beat)' && parens['(already)'] === '(already)', parens);

  // ---- "EST."
  await open([HEAD, ['action', '']], 1);
  await type('Est. 1962, says the sign.');
  const e1 = await lines();
  ok('E1: an action line "Est. 1962, says the sign." stays action', e1[1]?.[0] === 'action', { line: e1[1] });

  const words = {};
  for (const w of ['Estelle walks in.', 'Extra chairs wait.', 'Interesting light.']) {
    await open([HEAD, ['action', '']], 1);
    await type(w);
    words[w] = (await lines())[1]?.[0];
  }
  ok('E2: a word that only begins like a slugline (Estelle, Extra, Interesting) stays action', Object.values(words).every((t) => t === 'action'), words);

  const slugs = {};
  for (const w of ['EST. CITY - DAY', 'int. kitchen', 'ext. street']) {
    await open([HEAD, ['action', '']], 1);
    await type(w);
    slugs[w] = (await lines())[1]?.[0];
  }
  ok('E3 (control): EST., int. and ext. still make a scene heading', Object.values(slugs).every((t) => t === 'scene'), slugs);

  await open([HEAD, ['action', '']], 1);
  await type('int. roof');
  const e4a = (await lines())[1]?.[0];
  await ctrlDigit(2);
  const e4b = (await lines())[1]?.[0];
  await type('s');
  const e4c = await lines();
  ok('E4: a line changed back to Action is not promoted again by the next key', e4a === 'scene' && e4b === 'action' && e4c[1]?.[0] === 'action' && e4c[1]?.[1] === 'int. roofs', { e4a, e4b, after: e4c[1] });

  // ---- ENTER IN A SPEECH
  await open([HEAD, ['character', 'MARA'], ['dialogue', 'First half second half']], 2);
  await caret(10);
  await enter();
  const m1 = await lines();
  ok('M1: Enter in the middle of a speech keeps both halves as dialogue', same(m1.slice(2), [['dialogue', 'First half'], ['dialogue', 'second half']]), { lines: m1.slice(2) });

  await open([HEAD, ['character', 'MARA'], ['dialogue', 'A whole speech.']], 2);
  await caret('end');
  await enter();
  const m2 = await lines();
  ok('M2 (control): Enter at the end of a speech still goes to Action', m2[2]?.[0] === 'dialogue' && m2[3]?.[0] === 'action' && m2[3]?.[1].trim() === '', { lines: m2.slice(2) });

  // ---- FILE NAMES
  await app.evalJs("location.hash = '#/'"); await sleep(180);
  await app.evalJs(`(() => {
    const W = window;
    const feature = W.wrizoCreateProject('Feature');
    const essay = W.wrizoCreateProject('Essay');
    const scriptPage = (id, head, extra) => { const e = W.wrizoCreateJournalPage({ id, text: head, pageType: 'script', source: 'page', createdAt: '2026-04-01T00:00:10.000Z', ...extra }); W.wrizoPatchEntry(id, { script: { v: 1, scenes: [{ id: id + '-h', heading: { id: id + '-h', t: 'scene', text: head }, body: [] }] } }); return e; };
    const a = scriptPage('nact-1', 'FADE IN', { origin: 'project', projectId: feature.id, orderIndex: 0 });
    W.wrizoPatchEntry('nact-1', { pageSettings: { ...(a.pageSettings || {}), name: 'Act One' } });
    scriptPage('nact-2', 'INT. HALL - DAY', { origin: 'project', projectId: feature.id, orderIndex: 1 });
    scriptPage('nloose', 'INT. BUS - DAY', { origin: 'loose' });
    W.wrizoCreateJournalPage({ id: 'nprose', text: 'Essay line\\n\\nThe rest.', origin: 'project', projectId: essay.id, source: 'page', createdAt: '2026-04-01T00:00:20.000Z' });
    W.wrizoFlushNow();
    return true;
  })()`);
  const n1 = await downloadName('nact-1');
  ok('N1: a named screenplay Part is named for its Doc and its Part', n1 === 'Feature - Act One (nact-1).md', { n1 });
  const n2 = await downloadName('nact-2');
  ok('N2: an unnamed screenplay Part is named for its Doc', n2 === 'Feature (nact-2).md', { n2 });
  const n3 = await downloadName('nloose');
  ok('N3 (control): a loose screenplay keeps its first line as its name', n3 === 'INT. BUS - DAY (nloose).md', { n3 });
  const n4 = await downloadName('nprose');
  ok('N4 (control): a prose page keeps its first line as its name', n4 === 'Essay line (nprose).md', { n4 });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 15;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-SMALL-FIXES VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-SMALL-FIXES VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

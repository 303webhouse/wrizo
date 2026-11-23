// SCRIPT #1: FIND AND REPLACE ON A SCREENPLAY (Fable, Nov 22, 10:10 pm: "Replace on a screenplay writes the script lines (entry.script) and the open
// script page adopts them. Undo covers the same step. Keep keepCapital."). The review's F2 and F3: the panel said "Replaced 4", the page and the saved
// script still said MARA, and the next save put the old name back in the derived text. Machina, ?reorg=1, seeded through the app's own seams.
//
// THE FIXTURE   Doc "Spin": s-1 (a screenplay, open), s-2 (a screenplay), p-3 (a prose Part). Doc "Other": f-1 (never touched). Doc "Long": s-9 (B1).
// OFFER  A0   the search finds all nine in this Doc
// ALL    F2a  Replace all: s-1's saved script holds the new name in every line, each line's id and type unchanged; keepCapital kept; cues stay in capitals
//        F2b  the open script page shows the new words, and no old name
//        F2c  the derived text is exactly the saved script's own rendering
//        F2d  the other screenplay Part and the prose Part are replaced; another Doc is not
//        F2e  the press leaves the keyboard in the search menu and the page where it was
// UNDO   U1   Undo restores every script and text exactly, and the open page shows it
// ONE    O1   Replace on one find changes that one line only
// LIVE   L1   words typed a moment ago (not saved yet) survive the replace and are replaced with the rest; nothing reverts after the page's own save
//        L2   typing after a replace, Undo refuses and writes nothing
// AFTER  F3a  reopened, the page shows the new name
//        F3b  one more edit and save: the new name stands in the script and the derived text
// BREAK  B1   a replace that pushes the active line onto the next sheet keeps the keyboard in the menu and the page's scroll where it was
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-replace.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

const mk = (id, rows) => {
  const scenes = [];
  rows.forEach(([t, text], i) => {
    const el = { id: `${id}-${i}`, t, text };
    if (t === 'scene') scenes.push({ id: el.id, heading: el, body: [] });
    else scenes[scenes.length - 1].body.push(el);
  });
  return { v: 1, scenes };
};
const UP = new Set(['scene', 'character', 'transition', 'shot']);
// the page's derived text, by the rule of store/scriptText.ts serializeScriptDoc
const ser = (doc) => {
  const parts = []; let prev = null;
  for (const s of doc.scenes) for (const el of [s.heading, ...s.body]) {
    const x = UP.has(el.t) ? el.text.toUpperCase() : el.text;
    const tight = prev && ['character', 'paren', 'dialogue'].includes(prev) && (el.t === 'paren' || el.t === 'dialogue');
    parts.push(parts.length === 0 ? x : (tight ? '\n' : '\n\n') + x);
    prev = el.t;
  }
  return parts.join('');
};
const flat = (doc) => doc.scenes.flatMap((s) => [s.heading, ...s.body]).map((e) => ({ id: e.id, t: e.t, text: e.text }));

const S1 = [['scene', 'INT. LAUNDROMAT - NIGHT'], ['character', 'MARA'], ['dialogue', 'Mara knows.'], ['action', 'MARA turns. mara waits.'], ['character', "MARA (CONT'D)"], ['dialogue', 'Hello, Mara.'], ['character', 'THEO'], ['dialogue', 'Nothing here.']];
const S1_NEW = [['scene', 'INT. LAUNDROMAT - NIGHT'], ['character', 'DELIA'], ['dialogue', 'Delia knows.'], ['action', 'Delia turns. delia waits.'], ['character', "DELIA (CONT'D)"], ['dialogue', 'Hello, Delia.'], ['character', 'THEO'], ['dialogue', 'Nothing here.']];
const S2 = [['scene', 'EXT. STREET - DAY'], ['character', 'MARA'], ['dialogue', 'Still Mara.']];
const S2_NEW = [['scene', 'EXT. STREET - DAY'], ['character', 'DELIA'], ['dialogue', 'Still Delia.']];
const P3 = 'Notes on Mara.', P3_NEW = 'Notes on Delia.', F1 = 'Mara lives here too.';
const LONG = 'a much longer name that wraps this action line across several lines of the page so that the last line has to move over to the next sheet';
const S9 = [['scene', 'INT. A - DAY'], ['action', 'Zed stands.'], ...Array.from({ length: 24 }, (_, i) => ['action', `Filler line ${i + 1}.`]), ['action', 'Last line.']];
const doc1 = mk('s-1', S1), doc1New = mk('s-1', S1_NEW), doc2 = mk('s-2', S2), doc2New = mk('s-2', S2_NEW), doc9 = mk('s-9', S9);

const STORED = (id) => `(() => { window.wrizoFlushNow(); const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((r) => r.id === ${q(id)}); if (!e) return null; return { text: e.text, script: e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => ({ id: x.id, t: x.t, text: x.text })) : null }; })()`;
const PAGE = `(() => { const m = new Map(); for (const e of document.querySelectorAll('.script-el[data-doc-index]')) { const i = +e.dataset.docIndex; m.set(i, (m.get(i) || '') + e.textContent); } return [...m.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1]); })()`;
const BOX = `(() => { const m = document.querySelector('[data-search-menu]'); if (!m) return { menu: false }; const all = m.querySelector('[data-replace-all]'); return { menu: true, all: all ? all.textContent.trim() : null, said: (m.querySelector('[data-replace-said]')?.textContent || '').trim() || null, undo: !!m.querySelector('[data-replace-undo]') }; })()`;
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const setInput = (sel, v) => `(() => { const i = document.querySelector(${q(sel)}); if (!i) return false; i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${q(v)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

await withHarness(async (app) => {
  const stored = (id) => app.evalJs(STORED(id));
  const page = () => app.evalJs(PAGE);
  const box = () => app.evalJs(BOX);
  const waitStored = (id, pred, label) => app.waitFor(`(() => { const r = ${STORED(id)}; return !!r && (${pred})(r); })()`, { timeout: 6000, label }).catch(() => {});
  const press = async (sel) => {   // a real mouse press, once the pointer has brought the chrome back and the target is hit-testable
    const p = await app.evalJs(`(() => { const e = document.querySelector(${q(sel)}); if (!e || e.disabled) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!p) return false;
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
    let hit = false;
    for (let i = 0; i < 25 && !hit; i++) {
      hit = await app.evalJs(`(() => { const e = document.querySelector(${q(sel)}); const h = document.elementFromPoint(${p.x}, ${p.y}); return !!e && !!h && (h === e || e.contains(h)); })()`);
      if (!hit) { await sleep(100); await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x + (i % 2), y: p.y, buttons: 0, pointerType: 'mouse' }); }
    }
    if (!hit) return false;
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(500);
    return true;
  };
  const typeKeys = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } };
  const clickLine = async (i) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${i}"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (!p) throw new Error(`no line ${i}`);
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(250);
    await app.evalJs("(() => { const n = document.querySelector('.script-el-active'); const s = getSelection(); const r = document.createRange(); r.selectNodeContents(n); r.collapse(false); s.removeAllRanges(); s.addRange(r); return true; })()");
  };
  const open = async (id) => {
    await app.emulateDpr(1, 1366, 768);
    await app.evalJs("window.wrizoTheme.set('machina'); null");
    await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.script-sheet .script-el') && !!document.querySelector('[data-top-search]')", { label: `the script ${id}`, timeout: 15000 });
    await sleep(900);
  };
  const openSearch = async (word, put) => {
    await app.evalJs(click('[data-top-search]'));
    await app.waitFor("!!document.querySelector('[data-search-menu]')", { label: 'the search menu', timeout: 4000 });
    await sleep(350);
    await app.evalJs(setInput('[data-search-menu] [data-search-q]', word)); await sleep(450);
    if (await app.evalJs("document.querySelector('[data-replace-toggle]')?.getAttribute('aria-expanded') === 'false'")) { await app.evalJs(click('[data-search-menu] [data-replace-toggle]')); await sleep(250); }
    await app.evalJs(setInput('[data-search-menu] [data-replace-with]', put)); await sleep(350);
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  await app.evalJs(`(() => {
    const W = window;
    const at = (i) => '2026-04-01T00:00:0' + i + '.000Z';
    const spin = W.wrizoCreateProject('Spin'), other = W.wrizoCreateProject('Other'), long = W.wrizoCreateProject('Long');
    const script = (id, doc, text, projectId, orderIndex, i) => { W.wrizoCreateJournalPage({ id, text, pageType: 'script', origin: 'project', source: 'page', projectId, orderIndex, createdAt: at(i) }); W.wrizoPatchEntry(id, { script: doc }); };
    script('s-1', ${q(doc1)}, ${q(ser(doc1))}, spin.id, 0, 1);
    script('s-2', ${q(doc2)}, ${q(ser(doc2))}, spin.id, 1, 2);
    W.wrizoCreateJournalPage({ id: 'p-3', text: ${q(P3)}, origin: 'project', source: 'page', projectId: spin.id, orderIndex: 2, createdAt: at(3) });
    W.wrizoCreateJournalPage({ id: 'f-1', text: ${q(F1)}, origin: 'project', source: 'page', projectId: other.id, orderIndex: 0, createdAt: at(4) });
    script('s-9', ${q(doc9)}, ${q(ser(doc9))}, long.id, 0, 5);
    W.wrizoFlushNow();
    return null;
  })()`);

  await open('s-1');
  await openSearch('Mara', 'delia');
  const a0 = await box();
  ok('A0: the search finds all nine in this Doc', a0.all === 'Replace all 9 in this Doc', a0);

  // ---- ALL
  const rectBefore = await app.evalJs("(() => { const r = document.querySelector('.script-sheet').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); })()");
  const pressed = await press('[data-search-menu] [data-replace-all]');
  await waitStored('s-1', `(r) => r.script && !r.script.some((e) => /mara/i.test(e.text))`, 'the script takes the new name');
  await sleep(350);
  const s1 = await stored('s-1'), s2 = await stored('s-2'), p3 = await stored('p-3'), f1 = await stored('f-1'), onPage = await page(), said = await box();
  ok('F2a: Replace all writes the saved script: the new name in every line, ids and types unchanged, keepCapital kept, cues in capitals', pressed && same(s1?.script, flat(doc1New)), { pressed, said: said.said, script: s1?.script?.map((e) => e.text) });
  ok('F2b: the open script page shows the new words and no old name', same(onPage, S1_NEW.map((r) => r[1])), onPage);
  ok('F2c: the derived text is exactly the saved script\'s rendering', s1?.text === ser(doc1New), s1?.text);
  ok('F2d: the other screenplay Part and the prose Part are replaced; another Doc is not', same(s2?.script, flat(doc2New)) && s2?.text === ser(doc2New) && p3?.text === P3_NEW && f1?.text === F1, { s2: s2?.script?.map((e) => e.text), s2t: s2?.text, p3: p3?.text, f1: f1?.text });
  const after = await app.evalJs("(() => { const r = document.querySelector('.script-sheet').getBoundingClientRect(); return { rect: [r.left, r.top, r.width, r.height].map(Math.round), inMenu: !!document.activeElement?.closest?.('[data-search-menu]') }; })()");
  ok('F2e: the press leaves the keyboard in the search menu and the page where it was', after.inMenu && same(after.rect, rectBefore), { after, rectBefore });

  // ---- UNDO
  await app.evalJs(click('[data-search-menu] [data-replace-undo]'));
  await waitStored('s-1', `(r) => r.script && r.script.some((e) => e.text === 'Mara knows.')`, 'the undo lands');
  await sleep(350);
  const u1 = await stored('s-1'), u2 = await stored('s-2'), u3 = await stored('p-3'), uPage = await page();
  ok('U1: Undo restores every script and text exactly, and the open page shows it', same(u1?.script, flat(doc1)) && u1?.text === ser(doc1) && same(u2?.script, flat(doc2)) && u2?.text === ser(doc2) && u3?.text === P3 && same(uPage, S1.map((r) => r[1])), { u1: u1?.script?.map((e) => e.text), u2: u2?.script?.map((e) => e.text), u3: u3?.text, uPage });

  // ---- ONE
  await app.evalJs(setInput('[data-search-menu] [data-search-q]', 'Mara')); await sleep(450);
  const oneAt = ser(doc1).indexOf('Mara knows.');
  const onePressed = await app.evalJs(click(`[data-search-menu] [data-replace-one="s-1|${oneAt}"]`));
  await waitStored('s-1', `(r) => r.script && r.script.some((e) => e.text === 'Delia knows.')`, 'one line changes');
  await sleep(300);
  const o1 = await stored('s-1');
  const oneWant = flat(doc1).map((e) => (e.text === 'Mara knows.' ? { ...e, text: 'Delia knows.' } : e));
  ok('O1: Replace on one find changes that one line only', onePressed && same(o1?.script, oneWant) && o1?.text === ser(doc1).replace('Mara knows.', 'Delia knows.'), { onePressed, script: o1?.script?.map((e) => e.text) });
  await app.evalJs(click('[data-search-menu] [data-replace-undo]'));
  await waitStored('s-1', `(r) => r.script && r.script.some((e) => e.text === 'Mara knows.')`, 'the one-line undo');
  await sleep(300);

  // ---- LIVE: words typed a moment ago, inside the page's 2 s save
  await app.evalJs(setInput('[data-search-menu] [data-search-q]', 'Mara')); await sleep(450);
  await clickLine(3);
  await typeKeys(' Mara again.');
  const unsaved = await stored('s-1');
  const typedWasUnsaved = !(unsaved?.script || []).some((e) => e.text.includes('again'));
  await app.evalJs(click('[data-search-menu] [data-replace-all]'));
  await sleep(450);
  const l1a = await stored('s-1');
  await sleep(2700);   // past the page's own autosave
  const l1b = await stored('s-1'), l1Page = await page();
  const wantLine = 'Delia turns. delia waits. Delia again.';
  ok('L1: words typed a moment ago survive the replace and are replaced too; nothing reverts after the page\'s own save', typedWasUnsaved && l1a?.script?.[3]?.text === wantLine && l1b?.script?.[3]?.text === wantLine && l1Page[3] === wantLine && !(l1b?.script || []).some((e) => /mara/i.test(e.text)), { typedWasUnsaved, a: l1a?.script?.[3]?.text, b: l1b?.script?.[3]?.text, page: l1Page[3] });
  await typeKeys(' X');
  await sleep(2700);
  const l2before = await stored('s-1');
  await app.evalJs(click('[data-search-menu] [data-replace-undo]'));
  await sleep(600);
  const l2after = await stored('s-1'), l2said = await box();
  ok('L2: typing after a replace, Undo refuses and writes nothing (the caret stayed where she typed)', l2before?.script?.[3]?.text === `${wantLine} X` && same(l2after?.script, l2before?.script) && l2after?.text === l2before?.text && l2said.said === 'Not undone: the words have changed since.', { line: l2after?.script?.[3]?.text, said: l2said.said });

  // ---- AFTER: reopen, one more edit
  await open('s-1');
  const f3Page = await page();
  ok('F3a: reopened, the page shows the new name', f3Page.some((t) => /DELIA/.test(t)) && !f3Page.some((t) => /mara/i.test(t)), f3Page);
  await clickLine(5);
  await typeKeys(' Yes.');
  await sleep(2700);
  const f3 = await stored('s-1');
  const f3Doc = { v: 1, scenes: [{ heading: { t: 'scene', text: f3?.script?.[0]?.text ?? '' }, body: (f3?.script ?? []).slice(1).map((e) => ({ t: e.t, text: e.text })) }] };
  ok('F3b: one more edit and save: the new name stands in the script and the derived text', !!f3 && (f3.script || []).some((e) => e.text === 'Hello, Delia. Yes.') && !(f3.script || []).some((e) => /mara/i.test(e.text)) && !/mara/i.test(f3.text) && f3.text === ser(f3Doc), { script: f3?.script?.map((e) => e.text), text: f3?.text });

  // ---- BREAK: the active line changes sheet under a replace
  await open('s-9');
  await clickLine(S9.length - 1);
  await openSearch('Zed', LONG);
  const sheetOf = "(() => { const a = document.querySelector('.script-el-active'); return a ? +a.closest('.script-sheet').dataset.pageIndex : null; })()";
  const scrollOf = "(() => { const b = document.querySelector('.desk-frame-scroll-cap'); return b ? Math.round(b.scrollTop) : null; })()";
  const b0 = { sheet: await app.evalJs(sheetOf), scroll: await app.evalJs(scrollOf) };
  const bPressed = await press('[data-search-menu] [data-replace-all]');
  await sleep(500);
  const b1 = { sheet: await app.evalJs(sheetOf), scroll: await app.evalJs(scrollOf), inMenu: await app.evalJs("!!document.activeElement?.closest?.('[data-search-menu]')"), line1: (await page())[1] };
  ok('B1: a replace that pushes the active line onto the next sheet keeps the keyboard in the menu and the page\'s scroll where it was', bPressed && b0.sheet === 0 && b1.sheet === 1 && b1.inMenu && b1.scroll === b0.scroll && b1.line1 === `${LONG[0].toUpperCase()}${LONG.slice(1)} stands.`, { b0, b1 });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 13;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-REPLACE VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-REPLACE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

// SCRIPT batch 2, item 1: A SPEECH LONGER THAN A PAGE IS NOT HIDDEN BEHIND THE NEXT PAGE (the review's finding 2, P2 and P2b; Fable, Nov 24).
// Dialogue could not split, so a speech longer than a whole page ran past the sheet's bottom margin and the next sheet painted over it:
// the end of the speech could not be seen or clicked. Machina, ?reorg=1, seeded through the app's own seams, a real mouse and real keys.
//
// AT REST      LS1  a speech longer than a page breaks at a line boundary and goes on to the next sheet, and the parts join back to the writer's text exactly
//              LS2  no line of the script sits below its sheet's bottom margin
//              LS3  the speech's final word can be hit: the point over it belongs to the speech, not to the next sheet
//              LS4  a click on the final word puts the caret in the speech, on that word
// WRITING IN IT LS5  while the caret is in the speech, all of it is on the paper: its sheet holds it, and the next sheet starts below it
//              LS6  (control) typing at the end of the speech reaches storage
//              LS7  when the caret leaves, the speech breaks again and every sheet is the same height
// CONTROLS     LS8  (control) a speech SHORTER than a page that does not fit the room left still moves whole to the next page (sc2 P9)
//              LS9  (control) an action block longer than a page still breaks (sc2 P8)
// THE CLICK    LS10 a click on the second part of a broken block puts the caret on the word clicked (the same click path serves action)
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-long-speech.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const HEAD = ['scene', 'INT. A LONG ROOM - NIGHT'];
const act = (x) => ['action', x];

// about 3,000 characters, about 90 lines at the 35-character dialogue measure: well over the 54-line body, as the review's 420-word monologue
// was (it ran 46 lines past the margin). The first cut of this fixture was 1,788 characters, 1 px over the page, and could not show the hiding.
// The last word is unique.
const SPEECH = [...Array.from({ length: 49 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the speech goes on, and nobody in the room stops her.`), 'And that is all I have to say. Farewell.'].join(' ');
// twelve sentences: about 35 lines, shorter than a page
const SHORT_SPEECH = Array.from({ length: 12 }, (_, i) => `And another thing, number ${i}, which I have meant to say to you for a long time now.`).join(' ');
// sixty sentences of action: longer than a page; its own last word is unique too
const LONG_ACTION = [...Array.from({ length: 59 }, (_, i) => `Sentence ${String(i).padStart(2, '0')} runs to about sixty characters wide here.`), 'The lamp goes out. Darkness.'].join(' ');

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
const STORED = (id) => `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${q(id)}); return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]) : null; })()`;
// every rendered part of one line, in page order
const PARTS = (i) => `(() => [...document.querySelectorAll('.script-el[data-doc-index="${i}"]')].map((e) => ({ text: e.textContent, continues: e.dataset.continues === 'true', from: e.dataset.continuedFrom === 'true', active: e.classList.contains('script-el-active'), sheet: [...document.querySelectorAll('.script-sheet')].indexOf(e.closest('.script-sheet')) })))()`;
// every line whose box runs below its own sheet's bottom margin (the sheet's content box)
const BELOW = "(() => { const out = []; for (const s of document.querySelectorAll('.script-sheet')) { const r = s.getBoundingClientRect(); const floor = r.bottom - parseFloat(getComputedStyle(s).paddingBottom) - parseFloat(getComputedStyle(s).borderBottomWidth) + 1; for (const e of s.querySelectorAll('.script-el')) { const b = e.getBoundingClientRect().bottom; if (b > floor) out.push({ i: +e.dataset.docIndex, over: Math.round(b - floor) }); } } return out; })()";
const HEIGHTS = "(() => [...document.querySelectorAll('.script-sheet')].map((s) => Math.round(s.getBoundingClientRect().height)))()";
// the point over one word inside a line's parts, scrolled into view first
const WORD_AT = (i, word) => `(() => { for (const e of document.querySelectorAll('.script-el[data-doc-index="${i}"]')) { const t = e.firstChild; if (!t || t.nodeType !== 3) continue; const k = t.data.lastIndexOf(${q(word)}); if (k < 0) continue; e.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.setStart(t, k); r.setEnd(t, k + ${word.length}); let b = r.getBoundingClientRect(); let sc = e.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; if (sc) { sc.scrollTop += b.top - innerHeight / 2; b = r.getBoundingClientRect(); } const x = Math.round(b.left + b.width / 2), y = Math.round(b.top + b.height / 2); const hit = document.elementFromPoint(x, y); return { x, y, hitLine: hit && hit.closest('.script-el') ? hit.closest('.script-el').dataset.docIndex : null, hitTag: hit ? hit.className : null }; } return null; })()`;
const CARET = "(() => { const a = document.querySelector('.script-el-active'); const s = getSelection(); if (!a || !s.rangeCount || !a.contains(s.anchorNode)) return a ? { i: +a.dataset.docIndex, at: null } : null; const r = document.createRange(); r.setStart(a, 0); r.setEnd(s.anchorNode, s.anchorOffset); return { i: +a.dataset.docIndex, at: r.toString().length, len: a.textContent.length }; })()";
const ACTIVE_FITS = "(() => { const a = document.querySelector('.script-el-active'); if (!a) return null; const s = a.closest('.script-sheet'); const r = s.getBoundingClientRect(); const floor = r.bottom - parseFloat(getComputedStyle(s).paddingBottom) - parseFloat(getComputedStyle(s).borderBottomWidth) + 1; const b = a.getBoundingClientRect().bottom; const next = s.nextElementSibling; const nextTop = next && next.classList.contains('script-sheet') ? next.getBoundingClientRect().top : null; return { i: +a.dataset.docIndex, bottom: Math.round(b), floor: Math.round(floor), nextTop: nextTop === null ? null : Math.round(nextTop) }; })()";

await withHarness(async (app) => {
  const type = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } await sleep(120); };
  const caretEnd = () => app.evalJs("(() => { const a = document.querySelector('.script-el-active'); if (!a) return false; a.focus(); const t = a.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, t.length); else r.setStart(a, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()");
  const mouse = async (x, y) => {
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(260);
  };
  // a press near the top-left of a line's FIRST part. Its top is scrolled to a third of the way down: centring a line taller than the window
  // (the whole speech, on main) puts its top above the window, and the first cut of this harness pressed on nothing there.
  const clickLine = async (at) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${at}"]'); if (!e) return null; e.scrollIntoView({ block: 'start' }); let sc = e.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; if (sc) sc.scrollTop += e.getBoundingClientRect().top - innerHeight / 3; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (p) await mouse(p.x, p.y);
    await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at}'`, { label: 'the line active', timeout: 4000 }).catch(() => {});
    await sleep(200);
  };
  // a page with these lines, opened from the Desk, with line `at` active
  const open = async (rows, at = 0) => {
    const id = `ls-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(420);
    if (at > 0) await clickLine(at);
    return id;
  };
  const storedLine = async (id, i, endsWith) => {
    await app.waitFor(`(${STORED(id)} || [])[${i}]?.[1]?.endsWith(${q(endsWith)})`, { label: 'the stored line', timeout: 6000 }).catch(() => {});
    return (await app.evalJs(STORED(id)))?.[i]?.[1] ?? null;
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  // ---- AT REST: lines 0 heading, 1 action, 2 cue, 3 the speech, 4 action; the caret in line 1
  const ROWS = [HEAD, act('She stands.'), ['character', 'MARA'], ['dialogue', SPEECH], act('Silence.')];
  const id = await open(ROWS, 1);
  const parts = await app.evalJs(PARTS(3));
  ok('LS1: a speech longer than a page breaks at a line boundary and goes on to the next sheet, and its parts join back to the writer\'s text exactly',
    parts.length >= 2 && parts[0].continues && parts[parts.length - 1].from && parts[parts.length - 1].sheet > parts[0].sheet && parts.map((p) => p.text).join('') === SPEECH,
    { parts: parts.map((p) => ({ sheet: p.sheet, chars: p.text.length, continues: p.continues, from: p.from })), joinedEqual: parts.map((p) => p.text).join('') === SPEECH });
  const below = await app.evalJs(BELOW);
  ok('LS2: no line of the script sits below its sheet\'s bottom margin', below.length === 0, { below });
  const fw = await app.evalJs(WORD_AT(3, 'Farewell'));
  ok('LS3: the speech\'s final word can be hit: the point over it belongs to the speech, not to the next sheet', fw && fw.hitLine === '3', fw);
  if (fw) await mouse(fw.x, fw.y);
  await app.waitFor("document.querySelector('.script-el-active')?.dataset.docIndex === '3'", { label: 'the speech active', timeout: 4000 }).catch(() => {});
  await sleep(200);
  const c4 = await app.evalJs(CARET);
  const fwAt = SPEECH.lastIndexOf('Farewell');
  ok('LS4: a click on the final word puts the caret in the speech, on that word', c4 && c4.i === 3 && c4.at !== null && c4.at >= fwAt && c4.at <= fwAt + 'Farewell'.length, { caret: c4, word: [fwAt, fwAt + 8] });

  // ---- WRITING IN IT
  await clickLine(1);
  await clickLine(3);
  const fits = await app.evalJs(ACTIVE_FITS);
  ok('LS5: while the caret is in the speech, all of it is on the paper: its sheet holds it, and the next sheet starts below it',
    fits && fits.i === 3 && fits.bottom <= fits.floor && (fits.nextTop === null || fits.nextTop >= fits.bottom), fits);
  await caretEnd();
  await type(' Amen.');
  const stored6 = await storedLine(id, 3, 'Farewell. Amen.');
  ok('LS6 (control): typing at the end of the speech reaches storage', stored6 === `${SPEECH} Amen.`, { tail: stored6 && stored6.slice(-30) });
  await clickLine(1);
  const parts7 = await app.evalJs(PARTS(3));
  const heights7 = await app.evalJs(HEIGHTS);
  ok('LS7: when the caret leaves, the speech breaks again and every sheet is the same height',
    parts7.length >= 2 && !parts7.some((p) => p.active) && parts7.map((p) => p.text).join('') === `${SPEECH} Amen.` && new Set(heights7).size === 1,
    { parts: parts7.length, heights: heights7 });

  // ---- CONTROLS
  const FILL = Array.from({ length: 20 }, (_, i) => act(`Beat ${i + 1}.`));
  await open([HEAD, ...FILL, ['character', 'HOLLIS'], ['dialogue', SHORT_SPEECH]], 0);
  const parts8 = await app.evalJs(PARTS(22));
  const cue8 = await app.evalJs(PARTS(21));
  ok('LS8 (control): a speech SHORTER than a page that does not fit the room left still moves whole to the next page, with its cue (sc2 P9)',
    parts8.length === 1 && parts8[0].sheet === 1 && cue8.length === 1 && cue8[0].sheet === 1, { speech: parts8.map((p) => p.sheet), cue: cue8.map((p) => p.sheet) });
  await open([HEAD, act(LONG_ACTION), act('After.')], 2);
  const parts9 = await app.evalJs(PARTS(1));
  ok('LS9 (control): an action block longer than a page still breaks (sc2 P8)',
    parts9.length >= 2 && parts9[0].continues && parts9.map((p) => p.text).join('') === LONG_ACTION, { parts: parts9.length });

  // ---- THE CLICK on the second part of a broken action block
  const dk = await app.evalJs(WORD_AT(1, 'Darkness'));
  if (dk) await mouse(dk.x, dk.y);
  await app.waitFor("document.querySelector('.script-el-active')?.dataset.docIndex === '1'", { label: 'the action active', timeout: 4000 }).catch(() => {});
  await sleep(200);
  const c10 = await app.evalJs(CARET);
  const dkAt = LONG_ACTION.lastIndexOf('Darkness');
  ok('LS10: a click on the second part of a broken block puts the caret on the word clicked (the same click path serves action)',
    c10 && c10.i === 1 && c10.at !== null && c10.at >= dkAt && c10.at <= dkAt + 'Darkness'.length, { caret: c10, word: [dkAt, dkAt + 8], hit: dk });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 10;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-LONG-SPEECH VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-LONG-SPEECH VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

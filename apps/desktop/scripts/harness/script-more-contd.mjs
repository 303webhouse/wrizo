// SCRIPT batch 2, item 2: (MORE) AND (CONT'D) AT A PAGE BREAK INSIDE A SPEECH (the review's findings 2 and 12, P1 and W2; FD §1.10.1.4; Fable, Nov 24).
// A speech that did not fit the room left on a page moved whole to the next one, leaving a hole (the panel's short stopped page 2 at 37 of 54
// lines), and a page break inside a speech carried no (MORE) or (CONT'D). The furniture is drawn from the pages, never stored.
// Machina, ?reorg=1, seeded through the app's own seams, a real mouse and real keys.
//
// THE BREAK    MC1  a speech that does not fit breaks at the page foot, and (MORE) sits directly under its last line there, at the cue's indent
//              MC2  the next page opens on the cue with (CONT'D), then the rest of the speech
//              MC3  (control: holds on the base, where nothing breaks) the furniture is not the writer's text: the parts join back to it
//                   exactly, and the stored lines hold no (MORE) or (CONT'D)
//              MC4  (control: holds on the base) nothing on any page, furniture included, sits below its sheet's bottom margin
// THE RULES    MC5  the break falls at a sentence end when one is in reach
//              MC6  two lines stay and two go: a speech line that cannot leave two on each side moves whole with
//                   its cue, and no furniture appears
//              MC7  a break between two lines of one speech (a dialogue line, then a parenthetical) gets (MORE) and (CONT'D) too, and the
//                   parenthetical goes over with the rest
//              MC8  a cue that already ends in (CONT'D) shows it once
//              MC9  a cue's extension stays: MARA (V.O.) goes on as MARA (V.O.) (CONT'D)
//              MC10 a speech longer than two pages breaks on each page, (MORE) and (CONT'D) at every break
// THE PAGE     MC11 the furniture is not a place to type: a press on (MORE) changes neither the line the caret is in nor the stored lines
//              MC12 with the caret in the broken speech it is whole on its first page and no furniture shows at its break; when the caret
//                   leaves, the furniture is back
//              MC13 (control) an action block longer than a page breaks with no furniture
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-more-contd.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const HEAD = ['scene', 'INT. THE HALL - NIGHT'];
const act = (x) => ['action', x];
// n one-line actions: each takes two lines (a blank above it), so the heading and n of them use 1 + 2n lines of the 54
const beats = (n) => Array.from({ length: n }, (_, i) => act(`Beat ${i + 1}.`));
// sentences of 34 characters: each takes exactly one line at the 35-character dialogue measure, so every line ends a sentence
const shortLines = (n, from = 1) => Array.from({ length: n }, (_, i) => `Line ${String(i + from).padStart(2, '0')} is short and it ends here.`).join(' ');
// for MC5: three lines that end a sentence, then one long sentence. Its first word is 34 characters, so it cannot share a line with the end
// of the first sentence: line three ends that sentence, and no other line ends one until the speech does.
const S1 = shortLines(3);
const S2 = 'Supercalifragilisticexpialidocious, she says, and goes on, and on, and on without a stop of any kind, round and round the same old ground, until the light goes and the room goes cold and nobody is left to hear the end of it, and still she goes on';
const LONG_ACTION = Array.from({ length: 60 }, (_, i) => `Sentence ${String(i).padStart(2, '0')} runs to about sixty characters wide here.`).join(' ');

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
const STORED = (id) => `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${q(id)}); return e && e.script ? { lines: e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]), text: e.text } : null; })()`;
// each sheet's children in order: a line part [docIndex, text] or furniture ['more'|'contd', text], with the left edge, and the lowest bottom vs the floor
const SHEETS = `(() => [...document.querySelectorAll('.script-sheet')].map((s) => {
  const r = s.getBoundingClientRect(); const cs = getComputedStyle(s);
  // the top of the 1in bottom margin, with 3px of slack: the sheet is 66em INCLUDING its two 1px borders, so a full 54-line page ends 2px
  // into the margin on every build (script-long-speech.mjs's green run 1 found it); a line that truly overruns is 16px over
  const floor = r.bottom - parseFloat(cs.paddingBottom) + 3;
  const items = [...s.children].filter((c) => c.matches('.script-el[data-doc-index], .script-furniture')).map((c) => {
    const b = c.getBoundingClientRect();
    return c.classList.contains('script-furniture')
      ? { f: c.dataset.furniture, text: c.textContent, left: Math.round(b.left), top: Math.round(b.top), bottom: Math.round(b.bottom), editable: c.isContentEditable, idx: c.dataset.docIndex ?? null }
      : { i: +c.dataset.docIndex, t: c.dataset.type, text: c.textContent, left: Math.round(b.left), top: Math.round(b.top), bottom: Math.round(b.bottom), active: c.classList.contains('script-el-active') };
  });
  return { items, floor: Math.round(floor), over: items.filter((x) => x.bottom > floor).map((x) => x.f || x.i) };
}))()`;
const FURN = (sheets) => sheets.flatMap((s, k) => s.items.filter((x) => x.f).map((x) => [k, x.f, x.text]));
const partsOf = (sheets, i) => sheets.flatMap((s, k) => s.items.filter((x) => x.i === i).map((x) => ({ sheet: k, text: x.text })));
const lastLine = (sheet) => [...sheet.items].reverse().find((x) => x.i !== undefined);

await withHarness(async (app) => {
  const mouse = async (x, y) => {
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(260);
  };
  // a press near the top-left of a node, its top scrolled to a third of the way down the window
  const pressOn = async (selector, label) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector(${q(selector)}); if (!e) return null; e.scrollIntoView({ block: 'start' }); let sc = e.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; if (sc) sc.scrollTop += e.getBoundingClientRect().top - innerHeight / 3; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (p) await mouse(p.x, p.y);
    else ok(`${label}: the node to press is there`, false, selector);
    return p;
  };
  const clickLine = async (at) => {
    await pressOn(`.script-el[data-doc-index="${at}"]`, `line ${at}`);
    await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at}'`, { label: 'the line active', timeout: 4000 }).catch(() => {});
    await sleep(200);
  };
  const open = async (rows, at = 0) => {
    const id = `mc-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(420);
    if (at > 0) await clickLine(at);
    return id;
  };
  const sheets = () => app.evalJs(SHEETS);

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  // ---- THE BREAK. Heading + 22 beats = 45 lines; the cue makes 47; the speech is 21 one-line sentences, so 6 fit with (MORE) under them.
  // Lines: 0 heading, 1..22 beats, 23 cue, 24 the speech, 25 an action after it. The caret rests in beat 1.
  const SPEECH_A = shortLines(21);
  const ROWS_A = [HEAD, ...beats(22), ['character', 'MARA'], ['dialogue', SPEECH_A], act('After.')];
  const idA = await open(ROWS_A, 1);
  let s = await sheets();
  const pA = partsOf(s, 24);
  const cueA = s[0]?.items.find((x) => x.i === 23);
  const lastA = s[0]?.items[s[0].items.length - 1];
  const beforeMore = s[0]?.items[s[0].items.length - 2];
  ok('MC1: a speech that does not fit breaks at the page foot, and (MORE) sits directly under its last line there, at the cue\'s indent',
    pA.length === 2 && pA[0].sheet === 0 && lastA && lastA.f === 'more' && lastA.text === '(MORE)' && beforeMore && beforeMore.i === 24
      && cueA && Math.abs(lastA.left - cueA.left) <= 1 && Math.abs(lastA.top - beforeMore.bottom) <= 2,
    { parts: pA.map((p) => p.sheet), tail: s[0]?.items.slice(-3), cueLeft: cueA && cueA.left });
  const headB = s[1]?.items.slice(0, 2);
  ok('MC2: the next page opens on the cue with (CONT\'D), then the rest of the speech',
    s.length === 2 && headB && headB[0].f === 'contd' && headB[0].text === "MARA (CONT'D)" && headB[1].i === 24 && Math.abs(headB[0].left - (cueA ? cueA.left : -99)) <= 1,
    { sheets: s.length, head: headB });
  const stA = await app.evalJs(STORED(idA));
  ok('MC3 (control): the furniture is not the writer\'s text: the parts join back to it exactly, and the stored lines hold no (MORE) or (CONT\'D)',
    pA.map((p) => p.text).join('') === SPEECH_A && stA && stA.lines.length === ROWS_A.length && stA.lines[24][1] === SPEECH_A && stA.lines[23][1] === 'MARA'
      && !/\(MORE\)|CONT'D/i.test(JSON.stringify(stA)),
    { joined: pA.map((p) => p.text).join('') === SPEECH_A, stored: stA && stA.lines.length });
  ok('MC4 (control): nothing on any page, furniture included, sits below its sheet\'s bottom margin', s.every((x) => x.over.length === 0), s.map((x) => x.over));

  // ---- THE RULES
  // MC5: room for six lines; the speech's first sentence ends at line three and the next runs on, so it breaks after line three
  await open([HEAD, ...beats(22), ['character', 'MARA'], ['dialogue', `${S1} ${S2}`], act('After.')], 1);
  s = await sheets();
  const p5 = partsOf(s, 24);
  ok('MC5: the break falls at a sentence end when one is in reach', p5.length === 2 && p5[0].text.trim() === S1 && FURN(s).length === 2,
    { first: p5[0] && p5[0].text, furniture: FURN(s) });
  // MC6: heading + 24 beats + cue = 51 lines; the speech's first line is three lines long and the speech goes on after it, so two of its lines
  // could stay above (MORE) but only one would go on: it moves whole, with its cue
  await open([HEAD, ...beats(24), ['character', 'MARA'], ['dialogue', shortLines(3)], ['paren', '(beat)'], ['dialogue', shortLines(2, 7)], act('After.')], 1);
  s = await sheets();
  ok('MC6: two lines stay and two go: a speech line that cannot leave two on each side moves whole with its cue, and no furniture appears',
    partsOf(s, 26).length === 1 && partsOf(s, 26)[0].sheet === 1 && partsOf(s, 25)[0]?.sheet === 1 && FURN(s).length === 0,
    { speech: partsOf(s, 26).map((p) => p.sheet), cue: partsOf(s, 25).map((p) => p.sheet), furniture: FURN(s) });
  // MC7: 47 after the cue; a five-line dialogue line fits with a line kept free; the parenthetical and the last line do not
  await open([HEAD, ...beats(22), ['character', 'MARA'], ['dialogue', shortLines(5)], ['paren', '(quietly)'], ['dialogue', shortLines(6, 10)], act('After.')], 1);
  s = await sheets();
  const tail7 = s[0]?.items.slice(-2);
  const head7 = s[1]?.items.slice(0, 3);
  ok('MC7: a break between two lines of one speech gets (MORE) and (CONT\'D) too, and the parenthetical goes over with the rest',
    tail7 && tail7[0].i === 24 && tail7[1].f === 'more' && head7 && head7[0].f === 'contd' && head7[0].text === "MARA (CONT'D)" && head7[1].i === 25 && head7[2].i === 26,
    { tail: tail7, head: head7 });
  // MC8, MC9: the same break as MC1, with cues that already carry something
  await open([HEAD, ...beats(22), ['character', "MARA (CONT'D)"], ['dialogue', shortLines(21)], act('After.')], 1);
  s = await sheets();
  ok('MC8: a cue that already ends in (CONT\'D) shows it once', FURN(s).length === 2 && FURN(s)[1][2] === "MARA (CONT'D)", FURN(s));
  await open([HEAD, ...beats(22), ['character', 'MARA (V.O.)'], ['dialogue', shortLines(21)], act('After.')], 1);
  s = await sheets();
  ok('MC9: a cue\'s extension stays: MARA (V.O.) goes on as MARA (V.O.) (CONT\'D)', FURN(s).length === 2 && FURN(s)[1][2] === "MARA (V.O.) (CONT'D)", FURN(s));
  // MC10: a 120-line speech after a heading and a cue: three pages, a break on each of the first two
  await open([HEAD, ['character', 'MARA'], ['dialogue', shortLines(120)], act('After.')], 3);
  s = await sheets();
  const f10 = FURN(s);
  const p10 = partsOf(s, 2);
  ok('MC10: a speech longer than two pages breaks on each page, (MORE) and (CONT\'D) at every break',
    p10.length === 3 && p10.map((p) => p.text).join('') === shortLines(120) && JSON.stringify(f10.map((x) => x.slice(0, 2))) === JSON.stringify([[0, 'more'], [1, 'contd'], [1, 'more'], [2, 'contd']])
      && s.every((x) => x.over.length === 0),
    { parts: p10.map((p) => p.sheet), furniture: f10, over: s.map((x) => x.over) });

  // ---- THE PAGE
  const idB = await open(ROWS_A, 1);
  s = await sheets();
  const moreNode = s[0]?.items.find((x) => x.f === 'more');
  const storedBefore = JSON.stringify((await app.evalJs(STORED(idB)))?.lines);
  if (moreNode) await pressOn('.script-furniture[data-furniture="more"]', 'MC11');
  await sleep(300);
  const active11 = await app.evalJs("document.querySelector('.script-el-active')?.dataset.docIndex ?? null");
  await sleep(2400);
  const storedAfter = JSON.stringify((await app.evalJs(STORED(idB)))?.lines);
  ok('MC11: the furniture is not a place to type: a press on (MORE) changes neither the line the caret is in nor the stored lines',
    !!moreNode && moreNode.editable === false && moreNode.idx === null && active11 === '1' && storedAfter === storedBefore, { more: moreNode, active: active11 });
  await clickLine(24);
  s = await sheets();
  const live = s.flatMap((x, k) => x.items.filter((y) => y.active).map((y) => ({ sheet: k, len: y.text.length, bottom: y.bottom, floor: x.floor })));
  const f12a = FURN(s);
  await clickLine(1);
  const f12b = FURN(await sheets());
  ok('MC12: with the caret in the broken speech it is whole on its first page and no furniture shows at its break; when the caret leaves, the furniture is back',
    live.length === 1 && live[0].sheet === 0 && live[0].len === SPEECH_A.length && live[0].bottom <= live[0].floor && f12a.length === 0
      && JSON.stringify(f12b) === JSON.stringify([[0, 'more', '(MORE)'], [1, 'contd', "MARA (CONT'D)"]]),
    { live, whileLive: f12a, after: f12b });
  await open([HEAD, act(LONG_ACTION), act('After.')], 2);
  s = await sheets();
  ok('MC13 (control): an action block longer than a page breaks with no furniture', partsOf(s, 1).length === 2 && FURN(s).length === 0, { parts: partsOf(s, 1).length, furniture: FURN(s) });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 13;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-MORE-CONTD VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-MORE-CONTD VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

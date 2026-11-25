// SCRIPT batch 2, item 4: AN ACTION BLOCK BREAKS AT A SENTENCE (the review's finding 15, P5; FD §1.10.1.3.3; Fable, Nov 24).
// An action block that did not fit the room left on a page moved whole to the next one, leaving a hole at the page foot and inflating the
// count. It now breaks at a sentence end when two of its lines can stay and two go, and moves whole when no sentence ends in reach.
// Machina, ?reorg=1, seeded through the app's own seams, a real mouse.
//
// THE BREAK    AB1  an action block that does not fit breaks at the page foot at a sentence end, and its parts join back to the writer's text
//              AB2  the break falls only at a sentence: the block breaks after its first sentence, not at the last line that fits
//              AB3  (control) with no sentence end in reach, the block moves whole
//              AB4  two lines stay and two go: a three-line block moves whole where a four-line block breaks two and two
// THE PAGE     AB5  with the caret in a broken block it is whole on its first page and its sheet holds it; when the caret leaves it breaks again
//              AB6  (control) an action block longer than a page still breaks, and nothing on any page sits below the bottom margin
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-action-break.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const HEAD = ['scene', 'INT. THE YARD - DAY'];
const act = (x) => ['action', x];
// one-line actions: each takes two lines (a blank above it)
const beats = (k) => Array.from({ length: k }, (_, i) => act(`Beat ${i + 1}.`));
// sentences of 53 characters: two cannot share the 60-character action measure, so each takes exactly one line and every line ends a sentence
const oneLiners = (k, from = 1) => Array.from({ length: k }, (_, i) => `Sentence ${String(i + from).padStart(2, '0')} runs to about sixty characters wide here.`).join(' ');
// for AB2: three lines that end a sentence, then a sentence of about ten lines; its first word is 59 characters, so it cannot share a line
const LONG_WORD = 'Ohhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh,';
const RUN_ON = `${LONG_WORD} the wind says, and it keeps on saying it across the yard and over the wall and down the lane past the shut shops and the dark church, round the square and back again, over the roofs and the wet slates and the chimneys, and it does not stop for anyone, and nobody asks it to stop, and on it goes all night`;
// for AB3: one sentence of about twelve lines with no end until the last
const NO_END = Array.from({ length: 12 }, (_, i) => `and the rain keeps on falling over everything number ${i}`).join(', ');
const LONG_ACTION = oneLiners(60);

let n = 0;
const docOf = (id, rows) => {
  const scenes = [];
  rows.forEach(([t, text], i) => {
    const el = { id: `${id}-${i}`, t, text };
    if (t === 'scene' || !scenes.length) scenes.push({ id: el.id, heading: el, body: [] });
    else scenes[scenes.length - 1].body.push(el);
  });
  return { v: 1, scenes };
};
const SHEETS = `(() => [...document.querySelectorAll('.script-sheet')].map((s) => {
  const r = s.getBoundingClientRect(); const cs = getComputedStyle(s);
  // the top of the 1in bottom margin, with 3px of slack: the sheet is 66em including its two 1px borders, so a full 54-line page ends 2px into it
  const floor = r.bottom - parseFloat(cs.paddingBottom) + 3;
  const items = [...s.querySelectorAll('.script-el[data-doc-index]')].map((c) => ({ i: +c.dataset.docIndex, text: c.textContent, bottom: Math.round(c.getBoundingClientRect().bottom), active: c.classList.contains('script-el-active') }));
  return { items, floor: Math.round(floor), over: items.filter((x) => x.bottom > floor).map((x) => x.i), height: Math.round(r.height) };
}))()`;
const partsOf = (sheets, i) => sheets.flatMap((s, k) => s.items.filter((x) => x.i === i).map((x) => ({ sheet: k, text: x.text, active: x.active })));

await withHarness(async (app) => {
  const mouse = async (x, y) => {
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(260);
  };
  // a press near the top-left of a line's FIRST part, its top scrolled to a third of the way down the window
  const clickLine = async (at) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${at}"]'); if (!e) return null; e.scrollIntoView({ block: 'start' }); let sc = e.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; if (sc) sc.scrollTop += e.getBoundingClientRect().top - innerHeight / 3; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (p) await mouse(p.x, p.y);
    await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at}'`, { label: 'the line active', timeout: 4000 }).catch(() => {});
    await sleep(200);
  };
  const open = async (rows, at = 0) => {
    const id = `ab-${Date.now().toString(36)}-${++n}`;
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

  // ---- THE BREAK. Heading + 22 beats = 45 lines; the block (line 23) has a blank above it, so 8 of its lines fit on page one.
  const BLOCK = oneLiners(12);
  await open([HEAD, ...beats(22), act(BLOCK), act('After.')], 1);
  let s = await sheets();
  const p1 = partsOf(s, 23);
  ok('AB1: an action block that does not fit breaks at the page foot at a sentence end, and its parts join back to the writer\'s text',
    s.length === 2 && p1.length === 2 && p1[0].sheet === 0 && p1[0].text.trim() === oneLiners(8) && p1.map((p) => p.text).join('') === BLOCK,
    { sheets: s.length, parts: p1.map((p) => ({ sheet: p.sheet, chars: p.text.length })) });
  await open([HEAD, ...beats(22), act(`${oneLiners(3)} ${RUN_ON}`), act('After.')], 1);
  s = await sheets();
  const p2 = partsOf(s, 23);
  ok('AB2: the break falls only at a sentence: the block breaks after its first three sentences, not at the last line that fits',
    p2.length === 2 && p2[0].text.trim() === oneLiners(3), { first: p2[0] && p2[0].text, parts: p2.length });
  await open([HEAD, ...beats(22), act(NO_END), act('After.')], 1);
  s = await sheets();
  const p3 = partsOf(s, 23);
  ok('AB3 (control): with no sentence end in reach, the block moves whole', p3.length === 1 && p3[0].sheet === 1, { parts: p3.map((p) => p.sheet) });
  // heading + 25 beats = 51 lines: room for two lines of a block below its blank line
  await open([HEAD, ...beats(25), act(oneLiners(3)), act('After.')], 1);
  const s4a = await sheets();
  await open([HEAD, ...beats(25), act(oneLiners(4)), act('After.')], 1);
  const s4b = await sheets();
  const a = partsOf(s4a, 26), b = partsOf(s4b, 26);
  ok('AB4: two lines stay and two go: a three-line block moves whole where a four-line block breaks two and two',
    a.length === 1 && a[0].sheet === 1 && b.length === 2 && b[0].text.trim() === oneLiners(2) && b[1].text.trim() === oneLiners(2, 3),
    { three: a.map((p) => p.sheet), four: b.map((p) => ({ sheet: p.sheet, text: p.text.trim().slice(0, 12) })) });

  // ---- THE PAGE
  await open([HEAD, ...beats(22), act(BLOCK), act('After.')], 1);
  await clickLine(23);
  s = await sheets();
  const live = s.flatMap((x, k) => x.items.filter((y) => y.active).map((y) => ({ sheet: k, len: y.text.length, bottom: y.bottom, floor: x.floor })));
  await clickLine(1);
  const after = await sheets();
  ok('AB5: with the caret in a broken block it is whole on its first page and its sheet holds it; when the caret leaves it breaks again',
    live.length === 1 && live[0].sheet === 0 && live[0].len === BLOCK.length && live[0].bottom <= live[0].floor
      && partsOf(after, 23).length === 2 && new Set(after.map((x) => x.height)).size === 1,
    { live, after: partsOf(after, 23).length, heights: after.map((x) => x.height) });
  await open([HEAD, act(LONG_ACTION), act('After.')], 2);
  s = await sheets();
  ok('AB6 (control): an action block longer than a page still breaks, and nothing on any page sits below the bottom margin',
    partsOf(s, 1).length === 2 && partsOf(s, 1).map((p) => p.text).join('') === LONG_ACTION && s.every((x) => x.over.length === 0), { parts: partsOf(s, 1).length, over: s.map((x) => x.over) });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 6;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-ACTION-BREAK VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-ACTION-BREAK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

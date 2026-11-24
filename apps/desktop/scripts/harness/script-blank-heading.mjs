// SCRIPT batch 2, item 5: NO BLANK SCENE HEADING ABOVE FADE IN: (the review's finding 8, K14; Fable, Nov 24).
// SCRIPT #7 stopped the save from writing a blank scene heading above a script's first line. A script saved BEFORE #7 still carries one
// above its opening FADE IN:, and it showed on the first page of the script until the writer deleted it. It is now left out when the
// script is read, and the next save writes the script without it. Machina, ?reorg=1, seeded through the app's own seams, a real mouse and keys.
//
//   BH1  a script saved with a blank heading above FADE IN: opens with FADE IN: as its first line
//   BH2  after the writer's next edit, the stored script starts with FADE IN: too
//   BH3  (control) a blank heading the writer left above an action line stays theirs
//   BH4  (control) a new screenplay still opens on its one blank heading, the caret's home
//
// (Prose converted in place to a screenplay is not covered: the Structure switch that ran that conversion is no longer called from any
// control, store/structureConvert.ts proseTextToScriptDoc's only live caller is the empty-page birth, which wants the blank heading.)
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-blank-heading.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
let n = 0;
// the shape a script took when saved before SCRIPT #7: a blank heading leads the first group, whatever the first line was
const oldShape = (id, rest) => ({ v: 1, scenes: [
  { id: `${id}-h`, heading: { id: `${id}-h`, t: 'scene', text: '' }, body: [rest[0]] },
  { id: rest[1].id, heading: rest[1], body: rest.slice(2) },
] });
const LINES = "(() => [...document.querySelectorAll('.script-el[data-doc-index]')].map((e) => [e.dataset.type, e.textContent]))()";
const STORED = (id) => `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${q(id)}); return e && e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => [x.t, x.text]) : null; })()`;

await withHarness(async (app) => {
  const mouse = async (x, y) => {
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(260);
  };
  const type = async (s) => { for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } await sleep(120); };
  const caretEnd = () => app.evalJs("(() => { const a = document.querySelector('.script-el-active'); if (!a) return false; a.focus(); const t = a.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, t.length); else r.setStart(a, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()");
  const clickLine = async (at) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector('.script-el[data-doc-index="${at}"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (p) await mouse(p.x, p.y);
    await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at}'`, { label: 'the line active', timeout: 4000 }).catch(() => {});
    await sleep(200);
  };
  const open = async (doc) => {
    const id = `bh-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const d = doc(id);
    const text = d.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => x.text).join('\n\n');
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(text)}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(d)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(420);
    return id;
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  // ---- BH1, BH2: FADE IN:, then a scene, saved in the old shape
  const id1 = await open((id) => oldShape(id, [
    { id: `${id}-0`, t: 'transition', text: 'FADE IN:' },
    { id: `${id}-1`, t: 'scene', text: 'INT. ROOM - DAY' },
    { id: `${id}-2`, t: 'action', text: 'Rain on the glass.' },
  ]));
  const l1 = await app.evalJs(LINES);
  ok('BH1: a script saved with a blank heading above FADE IN: opens with FADE IN: as its first line',
    JSON.stringify(l1) === JSON.stringify([['transition', 'FADE IN:'], ['scene', 'INT. ROOM - DAY'], ['action', 'Rain on the glass.']]), l1);
  await clickLine(2);
  await caretEnd();
  await type(' It stops.');
  await app.waitFor(`(${STORED(id1)} || []).some((l) => l[1] === 'Rain on the glass. It stops.')`, { label: 'the edit stored', timeout: 6000 }).catch(() => {});
  const s2 = await app.evalJs(STORED(id1));
  ok('BH2: after the writer\'s next edit, the stored script starts with FADE IN: too',
    JSON.stringify(s2) === JSON.stringify([['transition', 'FADE IN:'], ['scene', 'INT. ROOM - DAY'], ['action', 'Rain on the glass. It stops.']]), s2);

  // ---- BH3: a blank heading above an action line, which a writer leaves when they press Enter past a new script's heading
  await open((id) => oldShape(id, [
    { id: `${id}-0`, t: 'action', text: 'Something happens before we know where.' },
    { id: `${id}-1`, t: 'scene', text: 'INT. ROOM - DAY' },
  ]));
  const l3 = await app.evalJs(LINES);
  ok('BH3 (control): a blank heading the writer left above an action line stays theirs',
    JSON.stringify(l3) === JSON.stringify([['scene', ''], ['action', 'Something happens before we know where.'], ['scene', 'INT. ROOM - DAY']]), l3);

  // ---- BH4: a new screenplay
  await app.evalJs("location.hash = '#/'"); await sleep(180);
  await app.evalJs("location.hash = '#/page/new?structure=screenplay'");
  await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the new script', timeout: 15000 }).catch(() => {});
  await sleep(300);
  const l4 = await app.evalJs(LINES);
  ok('BH4 (control): a new screenplay still opens on its one blank heading, the caret\'s home', JSON.stringify(l4) === JSON.stringify([['scene', '']]), l4);
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 4;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-BLANK-HEADING VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-BLANK-HEADING VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);

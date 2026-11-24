// SCRIPT #4: THE SCREENPLAY TYPING MEASURE, ON A SCRIPT OF ABOUT 120 PAGES (Fable, Nov 23, 5:10 pm: "Chat 1's box turn adds a screenplay typing measure on a ~120-page script, since the five box files measure prose").
// A MEASURE, not a budget: it prints the numbers for one tree, and the verdict says only that the measure was really taken (the page count is in band, every key landed, every key was timed). Run it on the tip and on
// its control in the same quiet window and compare the two. It uses nothing of the tip's, so the same file runs on any tree.
//
// WORK   the input event's task: from the first listener (window, capture) to the next task, so it holds React's render, commit and the effects flushed with it
// PAINT  from the same instant to the second animation frame after it: the key on screen
//
// Machina, ?reorg=1, seeded through the app's own seams, real keys in a line in the middle of the script.
// Run (repo root; a box turn through Chat 1, or advisory on Actions):  node apps/desktop/scripts/harness/script-typing-120.mjs
import { withHarness } from '../runtime-verify.mjs';

const TARGET_PAGES = 120, BAND = [112, 128], KEYS = 120, FIRST_UNITS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };
const ms = (x) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');

const ACTION = 'She crosses the room and stops at the window, one hand on the frame, watching the street below go quiet as the last of the light leaves it.';
const SPEECH = 'I told you it would be like this, and you said you would come anyway, so here we are, the two of us, with nothing left to say about it.';
const docOf = (id, units) => {
  const scenes = [];
  for (let u = 0; u < units; u++) {
    if (u % 6 === 0) { const h = { id: `${id}-h${u}`, t: 'scene', text: `INT. ROOM ${u / 6 + 1} - NIGHT` }; scenes.push({ id: h.id, heading: h, body: [] }); }
    scenes[scenes.length - 1].body.push(
      { id: `${id}-a${u}`, t: 'action', text: ACTION },
      { id: `${id}-c${u}`, t: 'character', text: u % 2 ? 'MARA' : 'THEO' },
      { id: `${id}-d${u}`, t: 'dialogue', text: SPEECH },
    );
  }
  return { v: 1, scenes };
};

let report = null;
await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  const openScript = async (id, units) => {
    await app.evalJs("location.hash = '#/'");
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk again', timeout: 20000 });
    const doc = docOf(id, units);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: 'INT. ROOM 1 - NIGHT', pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("document.querySelectorAll('.script-sheet .script-el').length > 10", { label: 'the script', timeout: 60000 });
    await sleep(1500);
    return app.evalJs("document.querySelectorAll('.script-sheet').length");
  };

  // the size that makes about 120 pages is read from the app's own paginator, not assumed
  const firstPages = await openScript('st-size', FIRST_UNITS);
  const units = Math.round(FIRST_UNITS * TARGET_PAGES / Math.max(1, firstPages));
  const pages = await openScript('st-big', units);
  const elements = await app.evalJs("new Set([...document.querySelectorAll('.script-el[data-doc-index]')].map((e) => e.dataset.docIndex)).size");

  // a real press in a written action line in the middle of the script
  const mid = 3 * Math.floor(units / 2) + Math.floor(units / 12);
  const at = await app.evalJs(`(() => { let i = ${mid}; let e = null; for (; i < ${mid + 8}; i++) { const x = document.querySelector('.script-el[data-doc-index="' + i + '"]'); if (x && x.dataset.type === 'action') { e = x; break; } } if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { i, x: Math.round(r.left + 12), y: Math.round(r.top + 8) }; })()`);
  if (!at) { report = { pages, elements, error: 'no action line in the middle' }; return []; }
  await sleep(600);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y, buttons: 0, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
  await app.waitFor(`document.querySelector('.script-el-active')?.dataset.docIndex === '${at.i}'`, { label: 'the line active', timeout: 15000 });
  await sleep(800);
  await app.evalJs("(() => { const a = document.querySelector('.script-el-active'); a.focus(); const r = document.createRange(); r.selectNodeContents(a); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  const before = await app.evalJs("document.querySelector('.script-el-active').textContent.length");
  await app.evalJs("(() => { if (window.__st) return true; const st = window.__st = { work: [], paint: [] }; const ch = new MessageChannel(); let t0 = 0; ch.port1.onmessage = () => { st.work.push(performance.now() - t0); }; window.addEventListener('input', () => { const t = performance.now(); t0 = t; ch.port2.postMessage(0); requestAnimationFrame(() => requestAnimationFrame(() => { st.paint.push(performance.now() - t); })); }, true); return true; })()");
  for (let k = 0; k < KEYS; k++) {
    const ch = k % 6 === 5 ? ' ' : 'abcdefghij'[k % 10];
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
    await app.waitFor(`window.__st.paint.length > ${k}`, { label: `key ${k}`, timeout: 15000 }).catch(() => {});
  }
  await sleep(300);
  const st = await app.evalJs('({ work: window.__st.work, paint: window.__st.paint })');
  const after = await app.evalJs("document.querySelector('.script-el-active').textContent.length");
  report = { firstPages, units, pages, elements, landed: after - before, work: st.work, paint: st.paint };
  return [];
});

const r = report ?? {};
const good = !r.error && r.pages >= BAND[0] && r.pages <= BAND[1] && r.landed === KEYS && r.work?.length === KEYS && r.paint?.length === KEYS;
console.log(`SCRIPT-TYPING-120: pages ${r.pages} (units ${r.units}, from ${r.firstPages} pages at ${FIRST_UNITS}), lines ${r.elements}, keys landed ${r.landed}/${KEYS}, timed ${r.work?.length ?? 0}/${r.paint?.length ?? 0}${r.error ? `, ${r.error}` : ''}`);
if (r.work?.length) console.log(`SCRIPT-TYPING-120: WORK ms  median ${ms(pct(r.work, 0.5))}  p95 ${ms(pct(r.work, 0.95))}  max ${ms(Math.max(...r.work))}`);
if (r.paint?.length) console.log(`SCRIPT-TYPING-120: PAINT ms median ${ms(pct(r.paint, 0.5))}  p95 ${ms(pct(r.paint, 0.95))}  max ${ms(Math.max(...r.paint))}`);
console.log(good ? '\nSCRIPT-TYPING-120 VERIFY: PASS (the measure was taken; compare the numbers against the control)' : '\nSCRIPT-TYPING-120 VERIFY: FAIL - the measure was not taken');
process.exit(good ? 0 : 1);

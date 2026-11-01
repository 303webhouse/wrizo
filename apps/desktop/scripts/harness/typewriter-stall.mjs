// TYPEWRITER CATCH-UP STEP CAP (Fable, Nov 1, train-12i; the class flagged Oct 31, seen live once in train-12h: fx5 S1 (a) maxStep 444 px, 1 run in 24).
// The typewriter pays what it owes in steps sized so a backlog is finished within BACKLOG_CAP_MS (useTypewriterFade). Once the owed advance has stood longer than
// that cap - typing outrunning the glides, or a frame stall that held them up - the step sizing has no time left and used to pay the WHOLE backlog in one step: a
// lurch of many lines. The law (fx5 S1 a, "never a multi-line recenter jump") is that no single catch-up step is more than 2 lines. This check FORCES the case:
//   - a fast run of short lines (one every ~60 ms), so the glides cannot keep up and a backlog stands past the 1 s cap, and
//   - two long frame stalls (the page's main thread blocked 700 ms) in the middle of it,
// and asserts, over the whole run and its settle:
//   P  (premise) a frame stall of >= 500 ms really happened, and the view moved a long way (>= 6 lines) - the case was reached
//   M  no scroll step (the delta between consecutive scroll events: one animation frame of the engine's motion) is more than 2 lines (+ 2 px of rounding)
//   T  the engine's own record agrees: no catch-up step it issued was sized past 2 lines (the trace's `lines`, and its `to - from`)
//   S  it ARRIVED: the view stops moving, and ends within the page (nothing was lost or double-paid - the scroll stopped at the bottom of what the page can scroll)
// RED-FIRST on the engine before the cap: M and T fail (a step of many lines). Run: node scripts/harness/typewriter-stall.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 30 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the history that rides up into the page.`).join('\n');
const rec = [];
const ok = (name, pass, detail) => rec.push({ name, pass: !!pass, detail });
const STALL = `(() => { const t = performance.now(); while (performance.now() - t < 700) { /* the main thread, held */ } return true; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs('window.__wzTwTrace = []');   // read once, when the hook mounts
  await app.evalJs("location.hash = '#/page/twf'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(600);
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const lh = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || 28");
  // the recorders, in the page: every scroll event's delta (one frame of the motion), and the longest gap between animation frames (the stall)
  await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); const R = window.__stall = { max: 0, last: sc.scrollTop, start: sc.scrollTop, lastMoveAt: 0, gap: 0, on: true, deltas: [] };
    sc.addEventListener('scroll', () => { const d = Math.abs(sc.scrollTop - R.last); if (d > R.max) R.max = d; if (d > 0.5) { R.lastMoveAt = performance.now(); R.deltas.push([Math.round(performance.now()), Math.round(d)]); } R.last = sc.scrollTop; }, { passive: true });
    let prev = performance.now(); const tick = () => { if (!R.on) return; const n = performance.now(); if (n - prev > R.gap) R.gap = n - prev; prev = n; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    return true; })()`);
  // a fast run of short lines; two stalls are fired (not awaited) so the keys that follow queue behind them
  const stalls = [];
  for (let i = 1; i <= 36; i += 1) {
    if (i === 10 || i === 22) stalls.push(app.evalJs(STALL));
    await app.typeKeys(`\nAnd on we go, ${i}.`);
    await sleep(60);
  }
  await Promise.all(stalls);
  // settle: the view stops moving (3 s of the engine's catch-up and its re-checks), then read
  await sleep(3500);
  const r = await app.evalJs(`(() => { const R = window.__stall; R.on = false; const sc = document.querySelector('.mode-scroll'); const T = window.__wzTwTrace || [];
    const steps = T.filter((e) => e.d === 'step'); return { max: R.max, gap: Math.round(R.gap), moved: Math.round(sc.scrollTop - R.start), end: Math.round(sc.scrollTop), maxTop: Math.round(sc.scrollHeight - sc.clientHeight),
      sinceMove: Math.round(performance.now() - R.lastMoveAt), steps: steps.length, maxLines: steps.length ? Math.max(...steps.map((e) => e.lines)) : 0, maxSpan: steps.length ? Math.max(...steps.map((e) => e.to - e.from)) : 0,
      big: R.deltas.filter((x) => x[1] > ${2 * lh}).slice(0, 6), bigSteps: steps.filter((e) => e.lines > 2).slice(0, 4) }; })()`);
  const detail = JSON.stringify({ lh, ...r });
  ok('P (premise): a frame stall of >= 500 ms really happened mid-run, and the view moved a long way (>= 6 lines)', r.gap >= 500 && r.moved >= 6 * lh, detail);
  ok('M: with the stalls and a backlog past the 1 s cap, no scroll step (one frame of the motion) is more than 2 lines - never a multi-line lurch', r.max <= 2 * lh + 2, detail);
  ok('T: and the engine never SIZED a catch-up step past 2 lines (its own record: lines <= 2, to - from <= 2 lines)', r.steps > 0 && r.maxLines <= 2 && r.maxSpan <= 2 * lh + 2, detail);
  ok('S: it ARRIVED - the view has stopped moving (not moved for 1 s) and sits inside the scrollable range', r.sinceMove >= 1000 && r.end > 0 && r.end <= r.maxTop + 1, detail);
});

for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
const pass = rec.length > 0 && rec.every((c) => c.pass);
console.log(`TYPEWRITER-STALL VERIFY: ${pass ? 'PASS' : 'FAIL'} (${rec.filter((c) => c.pass).length}/${rec.length})`);
process.exit(pass ? 0 : 1);

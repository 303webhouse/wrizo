// TYPEWRITER CATCH-UP STEP CAP (Fable, Nov 1, train-12i; the class flagged Oct 31, seen live once in train-12h: fx5 S1 (a) maxStep 444 px, 1 run in 24).
// The typewriter pays what it owes in steps sized so a backlog is finished within BACKLOG_CAP_MS (useTypewriterFade). Once the owed advance has stood longer than
// that cap - typing outrunning the glides, or a frame stall that held them up - the step sizing has no time left and used to pay the WHOLE backlog in one step: a
// lurch of many lines. The law (fx5 S1 a, "never a multi-line recenter jump") is that no single catch-up step is more than 2 lines. This check FORCES the case:
//   - a fast run of short lines (one every ~60 ms), so the glides cannot keep up and a backlog is OWED, and
//   - a long frame stall (the page's main thread blocked 1.1 s - past the 1 s cap on its own) right after it, with the backlog standing; then a second short run and a second stall,
// and asserts, over the whole run and its settle:
//   P  (premise) a frame stall of >= 1 s really happened, and the view moved a long way (>= 6 lines) - the case was reached
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
const STALL = `(() => { const t = performance.now(); while (performance.now() - t < 1100) { /* the main thread, held */ } return true; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  // read once, when the hook mounts; stamped with the page clock so the engine's steps can be lined up with the scroll events
  await app.evalJs("(() => { const a = []; a.push = function (e) { e.t = Math.round(performance.now()); return Array.prototype.push.call(this, e); }; window.__wzTwTrace = a; return true; })()");
  await app.evalJs("location.hash = '#/page/twf'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(600);
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const lh = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || 28");
  // the recorders, in the page: every scroll event's delta (one frame of the motion), and the longest gap between animation frames (the stall)
  await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); const R = window.__stall = { max: 0, clamp: 0, last: sc.scrollTop, start: sc.scrollTop, lastMoveAt: 0, gap: 0, on: true, deltas: [] };
    // the editor's re-render of a typed line clamps the box to the TOP and the engine puts it back (useTypewriterFade's takenOver excuses that drop; ledger 166): the two events either side of it
    // touch the top and are the editor's, not a catch-up step - they are counted apart (R.clamp), and M is about the steps
    sc.addEventListener('scroll', () => { const d = Math.abs(sc.scrollTop - R.last); if (Math.min(R.last, sc.scrollTop) <= 1) { if (d > R.clamp) R.clamp = d; } else if (d > R.max) R.max = d; if (d > 0.5) { R.lastMoveAt = performance.now(); R.deltas.push([Math.round(performance.now()), Math.round(d)]); } R.last = sc.scrollTop; }, { passive: true });
    // every WRITE to scrollTop of this box that is more than 2 px away from where it was, with who wrote it (the engine's setScrollTop, or something else)
    R.writes = []; const d0 = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop'); Object.defineProperty(sc, 'scrollTop', { configurable: true, get() { return d0.get.call(this); },
      set(v) { const was = d0.get.call(this); if (Math.abs(v - was) > 2 && R.writes.length < 400) R.writes.push([Math.round(performance.now()), Math.round(was), Math.round(v), String(new Error().stack).split('\\n').slice(2, 4).map((l) => l.trim().replace(/https?:[^ ]*\\//, '')).join(' < ')]); d0.set.call(this, v); } });
    let prev = performance.now(); const tick = () => { if (!R.on) return; const n = performance.now(); if (n - prev > R.gap) R.gap = n - prev; prev = n; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    return true; })()`);
  // a run of short lines (a backlog is owed), a stall, a second run, a second stall. A stall is AWAITED and nothing is typed during it: keystrokes landing in a stall make the BROWSER reveal
  // the caret natively, one jump for the lines typed meanwhile - that is the browser's scroll, not a catch-up step of the engine, and this check is about the engine's. The stall is what makes the
  // backlog stand past the cap: the first frame after it finds the owed advance older than BACKLOG_CAP_MS, with no glide time left to size a step by.
  for (const [from, to] of [[1, 8], [9, 14]]) {
    for (let i = from; i <= to; i += 1) { await app.typeKeys(`\nAnd on we go, ${i}.`); await sleep(60); }
    await app.evalJs(STALL);
  }
  // settle: the view stops moving (3 s of the engine's catch-up and its re-checks), then read
  await sleep(3500);
  const r = await app.evalJs(`(() => { const R = window.__stall; R.on = false; const sc = document.querySelector('.mode-scroll'); const T = window.__wzTwTrace || [];
    const steps = T.filter((e) => e.d === 'step'); return { max: R.max, clamp: Math.round(R.clamp), gap: Math.round(R.gap), moved: Math.round(sc.scrollTop - R.start), end: Math.round(sc.scrollTop), maxTop: Math.round(sc.scrollHeight - sc.clientHeight),
      sinceMove: Math.round(performance.now() - R.lastMoveAt), steps: steps.length, maxLines: steps.length ? Math.max(...steps.map((e) => e.lines)) : 0, maxSpan: steps.length ? Math.max(...steps.map((e) => e.to - e.from)) : 0,
      big: R.deltas.filter((x) => x[1] > ${2 * lh}).slice(0, 6),
      around: (() => { const b = R.deltas.find((x) => x[1] > ${2 * lh}); if (!b) return null; return { t: b[0], trace: T.filter((e) => e.t > b[0] - 400 && e.t <= b[0] + 20).map((e) => e.d + '@' + (e.t - b[0]) + (e.d === 'step' ? ':' + e.from + '>' + e.to : e.d === 'land' ? ':' + e.to : '')).slice(-14),
        writes: R.writes.filter((w) => w[0] > b[0] - 400 && w[0] <= b[0] + 20).map((w) => (w[0] - b[0]) + ':' + w[1] + '>' + w[2] + ' ' + w[3]).slice(-8) }; })(), bigSteps: steps.filter((e) => e.lines > 2).slice(0, 4) }; })()`);
  const detail = JSON.stringify({ lh, ...r });
  ok('P (premise): a frame stall of >= 1 s really happened with a backlog owed, and the view moved a long way (>= 6 lines)', r.gap >= 1000 && r.moved >= 6 * lh, detail);
  ok('M: with a backlog standing past the 1 s cap after a stall, no scroll step (one frame of the motion) is more than 2 lines - never a multi-line lurch', r.max <= 2 * lh + 2, detail);
  ok('T: and the engine never SIZED a catch-up step past 2 lines (its own record: lines <= 2, to - from <= 2 lines)', r.steps > 0 && r.maxLines <= 2 && r.maxSpan <= 2 * lh + 2, detail);
  ok('S: it ARRIVED - the view has stopped moving (not moved for 1 s) and sits inside the scrollable range', r.sinceMove >= 1000 && r.end > 0 && r.end <= r.maxTop + 1, detail);
});

for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
const pass = rec.length > 0 && rec.every((c) => c.pass);
console.log(`TYPEWRITER-STALL VERIFY: ${pass ? 'PASS' : 'FAIL'} (${rec.filter((c) => c.pass).length}/${rec.length})`);
process.exit(pass ? 0 : 1);

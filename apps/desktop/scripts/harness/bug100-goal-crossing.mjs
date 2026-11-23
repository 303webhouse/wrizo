// BUG #100 - KEYS TYPED AS THE WORD GOAL IS CROSSED ARE SLOW (Fable, Nov 22 9:35 am: "26 of 984 over 40 ms in turn 8; every theme"; reproduce on today's
// main, red first, find the cause; a box speed check for the fix).
//
// The fixture (seams only): a loose page of 10 words and a word goal of 12, in each theme as it ships (Arbor's redesign, WS_ARBOR2=default; Machina;
// Flux), 1400x900, three rounds a theme. A round: 30 CONTROL keys inside the last word (no word added, the goal far), then " b c" - the "c" makes
// the 12th word and crosses the goal - then 30 more keys. The CROSSING WINDOW is the crossing key and the 15 after it (about 1.5 s, the celebration).
//
// The meter (rhizome-latency's fine meter, ticket 150b): a key's COST is BUSY (keydown -> the end of the task that handled it, the React render it
// flushes included) + FRAME (the first frame after its input: style, layout, paint). Main-thread milliseconds, not the frame clock, so a runner's
// slower clock moves control and window alike. MS is keydown -> the second frame after the input (the latency she sees). Long-animation-frame
// entries in the window are kept with their script / style-and-layout split and their top scripts, to name the cause.
//
// CROSS   G1-<theme>  in the crossing window no key costs more than the control's worst key + 16 ms, and no key's latency is over 40 ms
//         MUT-G1  a window with one key 30 ms dearer than the control's worst turns G1's test red
//         G1-B-<theme>  [G1's successor, Nov 22: G1's absolute 40 ms bar failed Flux on a runner whose control keys reach 51 ms] no window key costs more
//             than the control's worst + 16 ms, and no larger share of window keys is over 40 ms than of control keys (+5%); MUT-G1-B
//         G1S-<theme>  the same, crossing the page stage's fixed 250-word lap (WORD_GOAL: ModeStage's bar and glow, DeskInstrument, Flux's pieces),
//             seeded at 248 words with the writer's own goal far away; G0S-<theme> its premise (249 -> 250 on the "c")
// PREMISE G0-<theme>  the goal was crossed in every round (the page's word count went from 11 to 12 on the "c")
//
// Run (repo root; Actions, or a box turn by Chat 1 for the speed check): node apps/desktop/scripts/harness/bug100-goal-crossing.mjs
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;
const THEMES = ['plateau', 'machina', 'flux'];
const ROUNDS = 3, CONTROL = 30, AFTER = 30, WINDOW = 16, GAP = 90, SLACK = 16, MAX_MS = 40;
const stat = (xs) => { const s = (xs || []).filter((x) => x != null).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const show = (st) => ({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
// G1's predicate: the window's dearest key against the control's dearest, and every window key's latency
const g1 = (ctl, win) => ctl.cost.max != null && win.cost.max != null && win.cost.max <= ctl.cost.max + SLACK && win.ms.max != null && win.ms.max <= MAX_MS;
// G1-B's predicate (Nov 22, Actions 45044849365 on a01ed1c8: G1's absolute 40 ms bar failed Flux on a runner whose CONTROL keys reach 51 ms - the
// runner, not the crossing): the window's dearest key against the control's, and the window's share of keys over 40 ms against the control's (+5%)
const overShare = (xs) => { const v = (xs || []).filter((x) => x != null); return v.length ? v.filter((x) => x > MAX_MS).length / v.length : 0; };
const g1b = (ctl, win) => ctl.cost.max != null && win.cost.max != null && win.cost.max <= ctl.cost.max + SLACK && win.over <= ctl.over + 0.05;
// two crossings: the writer's own goal (useWritingGoal: RunStrip, FluxCorridor, GoalGlow, GlitchMeter, the Sliver, the rhizome) and the page stage's
// fixed lap (WORD_GOAL, 250 words: ModeStage's progress bar and glow, DeskInstrument, Flux's edge, pop and corridor), in every theme
const MODES = [{ key: 'own', tag: '', goal: { n: 12, unit: 'words' }, seed: 10 }, { key: 'stage', tag: 'S', goal: { n: 100000, unit: 'words' }, seed: 248 }];

const ARM = `(() => {
  window.__k = []; window.__loaf = []; let cur = null;
  if (window.__off) window.__off();
  const kd = (e) => { const t0 = performance.now(); const k = { key: e.key, t0, busy: null, frame: null, ms: null }; cur = k; window.__k.push(k);
    const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - t0; mc.port1.close(); }; mc.port2.postMessage(0); };
  const bi = () => { const k = cur; if (!k) return; requestAnimationFrame(() => { const r = performance.now(); const mc = new MessageChannel(); mc.port1.onmessage = () => { k.frame = performance.now() - r; mc.port1.close(); }; mc.port2.postMessage(0);
    requestAnimationFrame(() => { k.ms = performance.now() - k.t0; }); }); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  let po = null;
  try { po = new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__loaf.push({ start: e.startTime, dur: e.duration, block: e.blockingDuration, render: e.renderStart ? e.startTime + e.duration - e.renderStart : null, style: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : null,
    scripts: (e.scripts || []).slice().sort((a, b) => b.duration - a.duration).slice(0, 3).map((s) => ({ dur: Math.round(s.duration), inv: s.invoker, fn: s.sourceFunctionName, at: s.sourceCharPosition, src: String(s.sourceURL || '').split('/').pop() })) }); });
    po.observe({ type: 'long-animation-frame', buffered: false }); } catch (e) { window.__loafErr = String(e); }
  window.__off = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); if (po) po.disconnect(); };
  return true; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoSetWritingGoal === 'function'", { label: 'seams', timeout: 20000 }).catch(() => {});
  const words = (n) => Array.from({ length: n }, (_, i) => 'word' + i).join(' ');
  const report = {};

  for (const mode of MODES) for (const theme of THEMES) {
    const rounds = [];
    for (let r = 0; r < ROUNDS; r += 1) {
      const id = `b100-${mode.key}-${theme}-${r}`;
      await app.goto('/');
      await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 20000 }).catch(() => {});
      await app.evalJs(`(() => { const W = window; W.wrizoSetWritingGoal(${J(mode.goal)});
        W.wrizoCreateJournalPage({ id: ${J(id)}, text: ${J(words(mode.seed))}, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' });
        if (W.wrizoFlushNow) W.wrizoFlushNow(); localStorage.setItem('wrizo-theme', ${J(theme)}); return true; })()`);
      await app.reload();
      await app.evalJs(`location.hash = '#/page/' + ${J(id)}`);
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the page (${theme})`, timeout: 20000 }).catch(() => {});
      await sleep(1200);
      await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const s = getSelection(); const rg = document.createRange(); rg.selectNodeContents(e); rg.collapse(false); s.removeAllRanges(); s.addRange(rg); return true; })()");
      await sleep(300);
      await app.evalJs(ARM);
      const before = await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText || '').trim().split(/\\s+/).filter(Boolean).length");
      for (let i = 0; i < CONTROL; i += 1) { await app.typeKeys('a'); await sleep(GAP); }
      for (const ch of [' ', 'b', ' ']) { await app.typeKeys(ch); await sleep(GAP); }
      const crossAt = await app.evalJs('window.__k.length');   // the next key is the crossing key
      await app.typeKeys('c'); await sleep(GAP);
      const after = await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText || '').trim().split(/\\s+/).filter(Boolean).length");
      for (let i = 0; i < AFTER; i += 1) { await app.typeKeys(i % 3 === 2 ? ' ' : 'd'); await sleep(GAP); }
      await sleep(600);
      const k = await app.evalJs('window.__k.map((x) => ({ key: x.key, t0: x.t0, cost: x.busy != null && x.frame != null ? x.busy + x.frame : null, busy: x.busy, frame: x.frame, ms: x.ms }))');
      const loaf = await app.evalJs('window.__loaf');
      await app.evalJs('window.__off && window.__off(); null');
      const ctl = k.slice(0, CONTROL), win = k.slice(crossAt, crossAt + WINDOW);
      const t0 = win.length ? win[0].t0 : 0, t1 = win.length ? win[win.length - 1].t0 + 200 : 0;
      const wl = (loaf || []).filter((e) => e.start >= t0 - 50 && e.start <= t1);
      rounds.push({ before, after, crossAt, ctl, win, wl, over: k.filter((x) => x.ms != null && x.ms > MAX_MS).map((x, i) => i) });
    }
    const ctl = { cost: stat(rounds.flatMap((x) => x.ctl.map((y) => y.cost))), ms: stat(rounds.flatMap((x) => x.ctl.map((y) => y.ms))), over: overShare(rounds.flatMap((x) => x.ctl.map((y) => y.ms))) };
    const win = { cost: stat(rounds.flatMap((x) => x.win.map((y) => y.cost))), ms: stat(rounds.flatMap((x) => x.win.map((y) => y.ms))), over: overShare(rounds.flatMap((x) => x.win.map((y) => y.ms))) };
    const crossKey = rounds.map((x) => x.win[0] && { cost: r1(x.win[0].cost), busy: r1(x.win[0].busy), frame: r1(x.win[0].frame), ms: r1(x.win[0].ms) });
    const dearest = rounds.map((x) => x.win.map((y, i) => [i, r1(y.cost), r1(y.ms)]).sort((a, b) => (b[1] || 0) - (a[1] || 0)).slice(0, 3));
    const loafs = rounds.map((x) => x.wl.map((e) => ({ dur: r1(e.dur), block: r1(e.block), style: r1(e.style), render: r1(e.render), scripts: e.scripts })));
    report[`${mode.key}.${theme}`] = { ctl, win };
    const detail = { control: { cost: show(ctl.cost), ms: show(ctl.ms), over: r1(ctl.over * 100) }, window: { cost: show(win.cost), ms: show(win.ms), over: r1(win.over * 100) }, crossKey, dearest, loafs };
    if (mode.key === 'own') {
      ok(`G0-${theme} the goal was crossed in every round (11 -> 12 words on the "c")`, rounds.every((x) => x.before === 10 && x.after === 12), rounds.map((x) => [x.before, x.after]));
      // SUPERSEDED (Nov 22, Actions 45044849365 on a01ed1c8: the absolute 40 ms bar failed Flux on a runner whose control keys reach 51 ms - the runner,
      // not the crossing; the box speed check keeps the absolute bar). The original, verbatim:
      // ok(`G1-${theme} in the crossing window no key costs more than the control's worst + ${SLACK} ms, and no key's latency is over ${MAX_MS} ms`, g1(ctl, win),
      //   { control: { cost: show(ctl.cost), ms: show(ctl.ms) }, window: { cost: show(win.cost), ms: show(win.ms) }, crossKey, dearest, loafs });
      ok(`G1-B-${theme} in the crossing window no key costs more than the control's worst + ${SLACK} ms, and no larger share of keys is over ${MAX_MS} ms than in the control (+5%)`, g1b(ctl, win), detail);
    } else {
      ok(`G0S-${theme} the page stage's 250-word lap was crossed in every round (249 -> 250 words on the "c")`, rounds.every((x) => x.before === 248 && x.after === 250), rounds.map((x) => [x.before, x.after]));
      ok(`G1S-${theme} crossing the stage's lap: no window key costs more than the control's worst + ${SLACK} ms, and no larger share over ${MAX_MS} ms than the control (+5%)`, g1b(ctl, win), detail);
    }
  }
  const any = report['own.machina'] || report['own.plateau'] || report['own.flux'];
  const dear = any ? { ctl: any.ctl, win: { ...any.win, cost: { ...any.win.cost, max: (any.ctl.cost.max || 0) + SLACK + 30 } } } : null;
  ok('MUT-G1 a window with one key 30 ms dearer than the control\'s worst turns G1\'s test red', !!dear && !g1(dear.ctl, dear.win), dear && { ctlMax: r1(dear.ctl.cost.max), winMax: r1(dear.win.cost.max) });
  // MUT-G1-B: the same reading with a dearer key, and with a quarter more of the window's keys over 40 ms, each turns G1-B red
  const slow = any ? { ctl: any.ctl, win: { ...any.win, over: any.ctl.over + 0.25 } } : null;
  ok('MUT-G1-B a window with one key 30 ms dearer, or a quarter more of its keys over 40 ms, turns G1-B\'s test red', !!dear && !!slow && !g1b(dear.ctl, dear.win) && !g1b(slow.ctl, slow.win), slow && { ctlOver: r1(slow.ctl.over * 100), winOver: r1(slow.win.over * 100) });
});

// G1's numbers are the diagnosis, so they print whether it passes or not
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass && !/^G1/.test(c.name) ? '' : '\n     ' + String(c.detail).slice(0, 3000)}`);
const EXPECTED = 14;   // G0 x3, G1-B x3 (G1 parked), G0S x3, G1S x3, MUT-G1, MUT-G1-B. Was: const EXPECTED = 7;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nBUG100-GOAL-CROSSING VERIFY: PASS (${checks.length} checks)` : `\nBUG100-GOAL-CROSSING VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

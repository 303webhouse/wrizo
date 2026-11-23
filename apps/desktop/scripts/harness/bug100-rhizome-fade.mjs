// BUG #100, THE FADE - keys typed during the rhizome's post-goal fade are slow (Chat 1's rhizome-latency x3 on live train I, Nov 22 17:19Z: fade keys'
// main-thread cost max 75.5-77.8 ms against 37-40 at rest, scattered through the fade; the hold clean). Fable, Nov 22 2:30 pm: red first, find the cause.
//
// The fixture (seams for the page and the goal; the writing settings' own key for the rhizome style, as rhizome-latency.mjs sets it): Arbor as it
// ships (WS_ARBOR2=default), 1400x900, by day and by night, three rounds a room: a loose page of 7 words, a word goal of 8, the rhizome drawn. A round:
// 20 CONTROL keys inside the last word (the field at rest), then " x" - the 8th word crosses the goal (the brass flash: hold, then the 2.2 s fade) - and
// 50 more letters at the same pace (about 4.5 s: the hold and the whole fade), then 10 after it.
//
// The meter (rhizome-latency's fine meter): a key's COST = BUSY (keydown -> the end of its task) + FRAME (the first frame after its input); MS =
// keydown -> the second frame after it. Each key carries the field's data-flash at its keydown (false / true / fading). Every long animation frame is
// kept with its script / style-and-layout / render split and its top scripts, and a slow key is matched to the frame that holds it - the cause.
//
// PREMISE F0-<room>  the goal flashed and faded in every round, and at least 20 keys were typed during the fade
// FADE    F1-<room>  keys typed during the fade cost no more than the control's worst + 16 ms, and no larger share is over 40 ms than in the control (+5%)
//         MUT-F1  a fade with one key 30 ms dearer turns F1's test red
// FAST    F0F / F1F / FAF-<room> (Nov 23: Chat 1's box run at 90 ms showed no fade tail; rhizome-latency's comes from fade keys typed 25 ms apart) the same, at
//             rhizome-latency's own pace: 22 control keys 25 ms apart at rest, the crossing, 14 keys 85 ms apart through the hold, then 22 keys 25 ms apart
//             into the fade, then 10 at 90 ms
// A/B     F0M / F1M / FAM-<room> (Nov 23: the fade adds no JS and no per-key main-thread cost, only latency - frame production) the fast pace again with the
//             brass copy's clip-path and mask-image taken away by an injected rule (.arbor2-vines-flash), the same run, so the box can compare the fade's
//             latency with and without them (an experiment: the shipped look is untouched)
// A/B     F0C / F1C / FAC-<room> the fast pace with ONLY the copy's clip-path taken away - its bitmap mask kept, which already cuts the same holes (the
//             canvas clears every hole and draws the edge fade) - so a fix can keep the look
// FIX     B1  (Nov 23: on two Actions runs the shipped copy's clip-path cost fast fade keys ~7 ms of median latency and 10% over 40 ms by day; without it,
//             the bitmap mask kept, ~1 ms and 1%) during the flash and the fade, once the brass copy's mask is the bitmap (data-mask="bitmap": it already
//             cuts every hole and draws the edge fade), the copy carries NO clip-path - the clip is kept only while the mask is still the SVG fallback
//         MUT-B1  the same reading with today's clip-path on the copy turns B1's test red
// (information) PROF-<room>  (Nov 23: long-animation-frame entries never arrive on this Chrome) in the fast pace's first round, the CPU profile of the control
//             burst at rest and of the fade burst: the dearest functions by self time in each, each with a snippet of the bundle at its position (the
//             bundle is minified, so the snippet's strings name the code)
// (information) FA-<room>  the five dearest fade keys with the long animation frame that holds each (script, style and layout, render, top scripts)
//
// Run (repo root; Actions, or a box turn by Chat 1): node apps/desktop/scripts/harness/bug100-rhizome-fade.mjs
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;
const ROUNDS = 3, CONTROL = 20, THROUGH = 50, AFTER = 10, GAP = 90, SLACK = 16, MAX_MS = 40;
const stat = (xs) => { const s = (xs || []).filter((x) => x != null).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const show = (st) => ({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
const overShare = (xs) => { const v = (xs || []).filter((x) => x != null); return v.length ? v.filter((x) => x > MAX_MS).length / v.length : 0; };
const f1 = (ctl, fade) => ctl.cost.max != null && fade.cost.max != null && fade.cost.max <= ctl.cost.max + SLACK && fade.over <= ctl.over + 0.05;

// PROF: Chrome's sampling profiler over one burst; self time per function, the dearest first
async function profStart(app) { await app.cdp('Profiler.enable'); await app.cdp('Profiler.setSamplingInterval', { interval: 200 }); await app.cdp('Profiler.start'); }
async function profStop(app) {
  const { profile } = await app.cdp('Profiler.stop');
  if (!profile || !profile.nodes) return null;
  const dt = profile.timeDeltas || []; const hits = new Map();
  for (let i = 0; i < (profile.samples || []).length; i += 1) hits.set(profile.samples[i], (hits.get(profile.samples[i]) || 0) + (dt[i] || 0));
  const byFn = new Map(); let total = 0;
  for (const n of profile.nodes) { const us = hits.get(n.id) || 0; total += us; const c = n.callFrame; if (c.functionName === '(idle)' || c.functionName === '(program)') continue;
    const key = `${c.functionName || '(anon)'}|${String(c.url).split('/').pop()}|${c.lineNumber}|${c.columnNumber}`; byFn.set(key, (byFn.get(key) || 0) + us); }
  const top = [...byFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, us]) => { const [fn, file, line, col] = k.split('|'); return { fn, file, line: +line, col: +col, ms: Math.round(us / 100) / 10 }; });
  return { totalMs: Math.round(total / 100) / 10, top };
}
async function withSnippets(app, prof) {
  if (!prof) return prof;
  const want = prof.top.filter((x) => /\.js$/.test(x.file)).map((x) => [x.file, x.line, x.col]);
  const snips = await app.evalJs(`(async () => { const want = ${JSON.stringify(want)}; const cache = {}; const out = [];
    for (const [file, line, col] of want) { const s = [...document.scripts].map((x) => x.src).find((u) => u.endsWith('/' + file)); if (!s) { out.push(null); continue; }
      if (!cache[s]) cache[s] = (await (await fetch(s)).text()).split('\\n'); const L = cache[s][line] || ''; out.push(L.slice(Math.max(0, col - 20), col + 140)); }
    return out; })()`).catch(() => null);
  let j = 0; for (const x of prof.top) if (/\.js$/.test(x.file)) x.snippet = snips ? snips[j++] : null;
  return prof;
}
const ARM = `(() => {
  window.__k = []; window.__loaf = []; window.__fl = []; let cur = null;
  if (window.__off) window.__off();
  const phase = () => { const f = document.querySelector('.wz-rhizome-field'); return f ? f.getAttribute('data-flash') : null; };
  let last = phase(); window.__fl.push([performance.now(), last]);
  const mo = new MutationObserver(() => { const v = phase(); if (v !== last) { last = v; window.__fl.push([performance.now(), v]); } });
  mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-flash'], childList: true });
  const kd = (e) => { const t0 = performance.now(); const k = { key: e.key, t0, flash: phase(), busy: null, frame: null, ms: null }; cur = k; window.__k.push(k);
    const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - t0; mc.port1.close(); }; mc.port2.postMessage(0); };
  const bi = () => { const k = cur; if (!k) return; requestAnimationFrame(() => { const r = performance.now(); const mc = new MessageChannel(); mc.port1.onmessage = () => { k.frame = performance.now() - r; mc.port1.close(); }; mc.port2.postMessage(0);
    requestAnimationFrame(() => { k.ms = performance.now() - k.t0; }); }); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  let po = null;
  try { po = new PerformanceObserver((list) => { for (const e of list.getEntries()) { const end = e.startTime + e.duration;
      const script = (e.scripts || []).reduce((s, x) => s + x.duration, 0);
      window.__loaf.push({ start: e.startTime, end, dur: e.duration, block: e.blockingDuration, script, styleLayout: e.styleAndLayoutStart ? end - e.styleAndLayoutStart : null, render: e.renderStart ? end - e.renderStart : null,
        scripts: (e.scripts || []).slice().sort((a, b) => b.duration - a.duration).slice(0, 3).map((s) => ({ dur: Math.round(s.duration), inv: s.invoker, fn: s.sourceFunctionName, at: s.sourceCharPosition, src: String(s.sourceURL || '').split('/').pop() })) }); } });
    po.observe({ type: 'long-animation-frame', buffered: false }); } catch (e) { window.__loafErr = String(e); }
  window.__off = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); mo.disconnect(); if (po) po.disconnect(); };
  return true; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoSetWritingGoal === 'function'", { label: 'seams', timeout: 20000 }).catch(() => {});
  const words = (n) => Array.from({ length: n }, (_, i) => 'word' + i).join(' ');
  const fades = {};
  const copies = [];

  for (const pace of ['steady', 'fast', 'fastnomask', 'fastnoclip']) for (const room of ['day', 'night']) {
  const tag = pace === 'fast' ? 'F' : pace === 'fastnomask' ? 'M' : pace === 'fastnoclip' ? 'C' : '';
    const rounds = [];
    let profCtl = null, profFade = null;
    for (let r = 0; r < ROUNDS; r += 1) {
      const id = `b100f-${pace}-${room}-${r}`;
      await app.goto('/');
      await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 20000 }).catch(() => {});
      await app.evalJs(`(() => { const W = window; W.wrizoSetWritingGoal({ n: 8, unit: 'words' });
        W.wrizoCreateJournalPage({ id: ${J(id)}, text: ${J(words(7))}, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' });
        if (W.wrizoFlushNow) W.wrizoFlushNow();
        localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }));
        localStorage.setItem('wrizo-theme', 'plateau'); return true; })()`);
      await app.evalJs(`history.replaceState(null, '', '/?arbor2room=${room}#/'); null`);
      await app.reload();
      await app.evalJs(`location.hash = '#/page/' + ${J(id)}`);
      await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-rhizome-field')", { label: `the page and its rhizome (${room})`, timeout: 20000 }).catch(() => {});
      await app.mouseMove(700, 860); await sleep(1800);
      await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const s = getSelection(); const rg = document.createRange(); rg.selectNodeContents(e); rg.collapse(false); s.removeAllRanges(); s.addRange(rg); return true; })()");
      await sleep(300);
      await app.evalJs(ARM);
      const CTL = pace === 'steady' ? CONTROL : 22;
      if (pace === 'fastnomask') await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-vines-flash{ clip-path:none !important; mask-image:none !important; -webkit-mask-image:none !important; }'; document.head.appendChild(s); return true; })()");
      if (pace === 'fastnoclip') await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-vines-flash{ clip-path:none !important; }'; document.head.appendChild(s); return true; })()");
      if (pace !== 'steady') {
        if (r === 0 && pace === 'fast') await profStart(app);
        for (let i = 0; i < CTL; i += 1) { await app.typeKeys('a'); await sleep(25); }
        if (r === 0 && pace === 'fast') profCtl = await profStop(app);
        await sleep(400); await app.typeKeys(' '); await sleep(GAP); await app.typeKeys('x'); await sleep(85);
        for (let i = 0; i < 14; i += 1) { await app.typeKeys('y'); await sleep(85); }
        await app.waitFor("document.querySelector('.wz-rhizome-field')?.getAttribute('data-flash') === 'fading'", { label: 'the fade', timeout: 4000 }).catch(() => {});
        if (r === 0 && pace === 'fast') await profStart(app);
        for (let i = 0; i < 22; i += 1) { await app.typeKeys('y'); await sleep(25); }
        if (pace === 'fast') copies.push(await app.evalJs("(() => { const c = document.querySelector('.arbor2-vines-flash'); if (!c) return null; const s = getComputedStyle(c); return { room: document.documentElement.getAttribute('data-arbor2-room'), flash: c.getAttribute('data-flash'), mask: c.getAttribute('data-mask'), clip: s.clipPath }; })()"));
        if (r === 0 && pace === 'fast') profFade = await withSnippets(app, await profStop(app));
        for (let i = 0; i < 10; i += 1) { await app.typeKeys('y'); await sleep(GAP); }
      } else {
      for (let i = 0; i < CONTROL; i += 1) { await app.typeKeys('a'); await sleep(GAP); }
      await app.typeKeys(' '); await sleep(GAP); await app.typeKeys('x'); await sleep(GAP);
      for (let i = 0; i < THROUGH + AFTER; i += 1) { await app.typeKeys('y'); await sleep(GAP); }
      }
      await sleep(800);
      const k = await app.evalJs('window.__k.map((x) => ({ key: x.key, t0: x.t0, flash: x.flash, cost: x.busy != null && x.frame != null ? x.busy + x.frame : null, busy: x.busy, frame: x.frame, ms: x.ms }))');
      const loaf = await app.evalJs('window.__loaf');
      const fl = await app.evalJs('window.__fl');
      await app.evalJs('window.__off && window.__off(); null');
      rounds.push({ k, loaf, fl });
    }
    const ctlKeys = rounds.flatMap((x) => x.k.slice(0, pace === 'steady' ? CONTROL : 22));
    const holdKeys = rounds.flatMap((x) => x.k.filter((y) => y.flash === 'true'));
    const fadeKeys = rounds.flatMap((x) => x.k.filter((y) => y.flash === 'fading').map((y) => ({ ...y, loaf: x.loaf })));
    const pack = (ks) => ({ cost: stat(ks.map((y) => y.cost)), ms: stat(ks.map((y) => y.ms)), over: overShare(ks.map((y) => y.ms)) });
    const ctl = pack(ctlKeys), hold = pack(holdKeys), fade = pack(fadeKeys);
    fades[`${pace}.${room}`] = { ctl, fade };
    const phases = rounds.map((x) => x.fl.map((p) => p[1]).join('>'));
    ok(`F0${tag}-${room} the goal flashed and faded in every round, and at least 20 keys were typed during the fade`, rounds.every((x) => x.fl.some((p) => p[1] === 'true') && x.fl.some((p) => p[1] === 'fading')) && fadeKeys.length >= 20, { phases, fadeKeys: fadeKeys.length, holdKeys: holdKeys.length });
    ok(`F1${tag}-${room} keys typed during the fade cost no more than the control's worst + ${SLACK} ms, and no larger share is over ${MAX_MS} ms than in the control (+5%)`, f1(ctl, fade),
      { control: { cost: show(ctl.cost), ms: show(ctl.ms), over: r1(ctl.over * 100) }, hold: { cost: show(hold.cost), ms: show(hold.ms), over: r1(hold.over * 100) }, fade: { cost: show(fade.cost), ms: show(fade.ms), over: r1(fade.over * 100) } });
    // the cause: the five dearest fade keys, each with the long animation frame that holds its keydown (or begins within 20 ms after it)
    const dear = fadeKeys.filter((y) => y.cost != null).sort((a, b) => b.cost - a.cost).slice(0, 5).map((y) => {
      const f = (y.loaf || []).find((e) => e.start <= y.t0 + 20 && e.end >= y.t0);
      return { cost: r1(y.cost), busy: r1(y.busy), frame: r1(y.frame), ms: r1(y.ms), loaf: f ? { dur: r1(f.dur), block: r1(f.block), script: r1(f.script), styleLayout: r1(f.styleLayout), render: r1(f.render), scripts: f.scripts } : null };
    });
    if (pace === 'fast') ok(`PROF-${room} (information) the CPU profile of the control burst at rest and of the fade burst (self time, the dearest first)`, true, { control: profCtl, fade: profFade });
    ok(`FA${tag}-${room} (information) the five dearest fade keys and the long animation frame that holds each`, true, dear);
  }
  const b1 = (list) => Array.isArray(list) && list.filter((x) => x && x.mask === 'bitmap').length >= 2 && list.filter((x) => x && x.mask === 'bitmap').every((x) => x.clip === 'none');
  ok('B1 during the fade, once the brass copy\'s mask is the bitmap, the copy carries no clip-path (the mask cuts the holes)', b1(copies), copies);
  const clipped = copies.map((x) => x && { ...x, clip: x.mask === 'bitmap' ? 'path(evenodd, "M0 0H10V10H0Z")' : x.clip });
  ok('MUT-B1 the same reading with today\'s clip-path on the copy turns B1\'s test red', copies.some((x) => x && x.mask === 'bitmap') && !b1(clipped), clipped);
  const any = fades['steady.day'] || fades['steady.night'];
  const dearer = any ? { ctl: any.ctl, fade: { ...any.fade, cost: { ...any.fade.cost, max: (any.ctl.cost.max || 0) + SLACK + 30 } } } : null;
  ok('MUT-F1 a fade with one key 30 ms dearer than the control\'s worst turns F1\'s test red', !!dearer && !f1(dearer.ctl, dearer.fade), dearer && { ctlMax: r1(dearer.ctl.cost.max), fadeMax: r1(dearer.fade.cost.max) });
});

// the F1 and FA lines carry the numbers and the cause, so they print whether they pass or not
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass && !/^(F[1A][FMC]?|PROF)-/.test(c.name) ? '' : '\n     ' + String(c.detail).slice(0, 4000)}`);
const EXPECTED = 29;   // + B1, MUT-B1 (#100's fix, Nov 23). Was: const EXPECTED = 27;   // + F0C, F1C, FAC by day and by night (the clip alone off, the bitmap mask kept: it already cuts the same holes; Nov 23). Was: const EXPECTED = 21;   // + F0M, F1M, FAM by day and by night (the A/B, Nov 23). Was: const EXPECTED = 15;   // + PROF-day, PROF-night (information). Was: const EXPECTED = 13;   // F0, F1, FA by day and by night at both paces (steady, fast), + MUT-F1. Was: const EXPECTED = 7;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nBUG100-RHIZOME-FADE VERIFY: PASS (${checks.length} checks)` : `\nBUG100-RHIZOME-FADE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

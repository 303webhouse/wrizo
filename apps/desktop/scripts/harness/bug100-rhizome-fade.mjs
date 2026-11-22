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

  for (const room of ['day', 'night']) {
    const rounds = [];
    for (let r = 0; r < ROUNDS; r += 1) {
      const id = `b100f-${room}-${r}`;
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
      for (let i = 0; i < CONTROL; i += 1) { await app.typeKeys('a'); await sleep(GAP); }
      await app.typeKeys(' '); await sleep(GAP); await app.typeKeys('x'); await sleep(GAP);
      for (let i = 0; i < THROUGH + AFTER; i += 1) { await app.typeKeys('y'); await sleep(GAP); }
      await sleep(800);
      const k = await app.evalJs('window.__k.map((x) => ({ key: x.key, t0: x.t0, flash: x.flash, cost: x.busy != null && x.frame != null ? x.busy + x.frame : null, busy: x.busy, frame: x.frame, ms: x.ms }))');
      const loaf = await app.evalJs('window.__loaf');
      const fl = await app.evalJs('window.__fl');
      await app.evalJs('window.__off && window.__off(); null');
      rounds.push({ k, loaf, fl });
    }
    const ctlKeys = rounds.flatMap((x) => x.k.slice(0, CONTROL));
    const holdKeys = rounds.flatMap((x) => x.k.filter((y) => y.flash === 'true'));
    const fadeKeys = rounds.flatMap((x) => x.k.filter((y) => y.flash === 'fading').map((y) => ({ ...y, loaf: x.loaf })));
    const pack = (ks) => ({ cost: stat(ks.map((y) => y.cost)), ms: stat(ks.map((y) => y.ms)), over: overShare(ks.map((y) => y.ms)) });
    const ctl = pack(ctlKeys), hold = pack(holdKeys), fade = pack(fadeKeys);
    fades[room] = { ctl, fade };
    const phases = rounds.map((x) => x.fl.map((p) => p[1]).join('>'));
    ok(`F0-${room} the goal flashed and faded in every round, and at least 20 keys were typed during the fade`, rounds.every((x) => x.fl.some((p) => p[1] === 'true') && x.fl.some((p) => p[1] === 'fading')) && fadeKeys.length >= 20, { phases, fadeKeys: fadeKeys.length, holdKeys: holdKeys.length });
    ok(`F1-${room} keys typed during the fade cost no more than the control's worst + ${SLACK} ms, and no larger share is over ${MAX_MS} ms than in the control (+5%)`, f1(ctl, fade),
      { control: { cost: show(ctl.cost), ms: show(ctl.ms), over: r1(ctl.over * 100) }, hold: { cost: show(hold.cost), ms: show(hold.ms), over: r1(hold.over * 100) }, fade: { cost: show(fade.cost), ms: show(fade.ms), over: r1(fade.over * 100) } });
    // the cause: the five dearest fade keys, each with the long animation frame that holds its keydown (or begins within 20 ms after it)
    const dear = fadeKeys.filter((y) => y.cost != null).sort((a, b) => b.cost - a.cost).slice(0, 5).map((y) => {
      const f = (y.loaf || []).find((e) => e.start <= y.t0 + 20 && e.end >= y.t0);
      return { cost: r1(y.cost), busy: r1(y.busy), frame: r1(y.frame), ms: r1(y.ms), loaf: f ? { dur: r1(f.dur), block: r1(f.block), script: r1(f.script), styleLayout: r1(f.styleLayout), render: r1(f.render), scripts: f.scripts } : null };
    });
    ok(`FA-${room} (information) the five dearest fade keys and the long animation frame that holds each`, true, dear);
  }
  const any = fades.day || fades.night;
  const dearer = any ? { ctl: any.ctl, fade: { ...any.fade, cost: { ...any.fade.cost, max: (any.ctl.cost.max || 0) + SLACK + 30 } } } : null;
  ok('MUT-F1 a fade with one key 30 ms dearer than the control\'s worst turns F1\'s test red', !!dearer && !f1(dearer.ctl, dearer.fade), dearer && { ctlMax: r1(dearer.ctl.cost.max), fadeMax: r1(dearer.fade.cost.max) });
});

// the F1 and FA lines carry the numbers and the cause, so they print whether they pass or not
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass && !/^F[1A]-/.test(c.name) ? '' : '\n     ' + String(c.detail).slice(0, 4000)}`);
const EXPECTED = 7;   // F0, F1, FA by day and by night, + MUT-F1
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nBUG100-RHIZOME-FADE VERIFY: PASS (${checks.length} checks)` : `\nBUG100-RHIZOME-FADE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

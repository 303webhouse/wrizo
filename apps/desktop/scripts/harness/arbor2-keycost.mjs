// ARBOR v2 MOCKUP - r21 latency: WHERE A KEY'S MAIN-THREAD TIME GOES in the day room. A MEASUREMENT with a premise verdict: it prints the
// numbers, and passes only when the premise holds (the pin took, every pass typed its keys, each trace captured them) - it never judges the
// numbers. Built after the night turn (Nov 6): the bitmap copies (1880fcfe) brought the day room's rest from 62 ms a key to 46, r20 sits at 25,
// and the guard's main-thread time per key was 35 ms against r20's 14 - so ~20 ms of MAIN-THREAD work per key remains with the copies shown.
// One page, the guard's own set-up (rhizome progress, a far word goal, 7 words), the room pinned to day (WS_URL_SEARCH='?arbor2=1&arbor2room=day').
// THREE PASSES, each from a fresh reload at rest (the chrome shown, the shade on), each typing the same keys at the same pace under a trace:
//   all     - as built: the room, the page's live copy, the bitmap copies
//   nobmp   - the bitmap copies hidden (a test-only style in this page: display:none on .arbor2-pagesh[data-bitmap]); the room + page copy stay
//   noshade - Mood's own "Day shadows" off (data-arbor2-off=shadows, what the switch writes; nothing stored): no pergola drawn at all
// Per pass: per key (keydown to the next keydown) the renderer main thread's time in each top-level event, summed by name (median over the
// keys), the keys' total, and the count of every dispatched event by type (a transitionend storm shows here) and of inline-style writes
// on the copies.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const q = process.env.WS_URL_SEARCH || '';
const pinned = /[?&]arbor2=1\b/.test(q) && /[?&]arbor2room=day\b/.test(q);
const N = 60, GAP = 110, TEXT = 'the quick brown fox jumps over the lazy dog and runs on ';
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

async function tracePass(app, label) {
  const events = [];
  const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) for (const e of p.value) events.push(e); });
  await app.cdp('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
  for (let i = 0; i < N; i += 1) { await app.typeKeys(TEXT[i % TEXT.length]); await sleep(GAP); }
  const done = app.waitEvent('Tracing.tracingComplete', 60000);
  await app.cdp('Tracing.end');
  await done;
  off();
  // the renderer main thread: the thread the keydowns were dispatched on
  const kd = events.filter((e) => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'keydown');
  const tid = kd.length ? kd[0].tid : null, pid = kd.length ? kd[0].pid : null;
  const t0s = kd.filter((e) => e.tid === tid).map((e) => e.ts).sort((a, b) => a - b);
  const main = events.filter((e) => e.tid === tid && e.pid === pid && e.ph === 'X' && typeof e.dur === 'number');
  // top-level only: an event nested inside another on the same thread is not counted again
  main.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const top = []; let end = -1;
  for (const e of main) { if (e.ts >= end) { top.push(e); end = e.ts + e.dur; } }
  // the phases inside them, by name (nested too - a phase is named wherever it ran), over the same keys
  const PH = ['UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'UpdateLayer', 'Commit', 'FunctionCall', 'EventDispatch', 'RunMicrotasks', 'FireAnimationFrame', 'TimerFire', 'HitTest', 'ParseHTML', 'IntersectionObserverController::computeIntersections'];
  const keys = t0s.slice(0, -1).map((t0, k) => ({ t0, t1: t0s[k + 1], total: 0, ph: Object.fromEntries(PH.map((p) => [p, 0])) }));
  const keyOf = (ts) => { let lo = 0, hi = keys.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (ts < keys[m].t0) hi = m - 1; else if (ts >= keys[m].t1) lo = m + 1; else return keys[m]; } return null; };
  for (const e of top) { const k = keyOf(e.ts); if (k) k.total += e.dur / 1000; }
  for (const e of main) { if (!PH.includes(e.name)) continue; const k = keyOf(e.ts); if (k) k.ph[e.name] += e.dur / 1000; }
  const types = {};
  for (const e of events) if (e.name === 'EventDispatch' && e.tid === tid && e.args && e.args.data) types[e.args.data.type] = (types[e.args.data.type] || 0) + 1;
  // the top-level events' own names, by total time over the pass (what the main thread was doing, named)
  const byName = {};
  for (const e of top) { if (!keyOf(e.ts)) continue; byName[e.name] = (byName[e.name] || 0) + e.dur / 1000; }
  const topNames = Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([n, v]) => [n, r1(v / Math.max(1, keys.length))]);
  return {
    label, keys: keys.length, events: events.length,
    perKey: { median: r1(median(keys.map((k) => k.total))), p95: r1([...keys.map((k) => k.total)].sort((a, b) => a - b)[Math.floor(keys.length * 0.95)] ?? null) },
    phases: Object.fromEntries(PH.map((p) => [p, r1(median(keys.map((k) => k.ph[p])))])),
    topNamesPerKey: topNames,
    dispatched: Object.fromEntries(Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 12)),
  };
}

const out = {};
await withHarness(async (app) => {
  const fresh = async () => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.emulateDpr(1, 1400, 900);
  };
  await fresh();
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  await app.evalJs(`(() => { window.wrizoSetWritingGoal(${JSON.stringify({ n: 1000, unit: 'words' })}); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);

  const PASSES = [
    ['all', ''],
    ['nobmp', "(() => { const s = document.createElement('style'); s.id = 'kc-nobmp'; s.textContent = \".arbor2-pagesh[data-bitmap='true']{ display:none !important; }\"; document.head.appendChild(s); return true; })()"],
    ['noshade', "(() => { document.documentElement.setAttribute('data-arbor2-off', 'shadows'); return true; })()"],
  ];
  for (const [label, setup] of PASSES) {
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: `rhizome field (${label})` }).catch(() => {});
    await app.waitFor("[...document.querySelectorAll(\".arbor2-pagesh[data-bitmap='true'] .arbor2-pergola-drift\")].some((d) => /^url\\(\"blob:/.test(getComputedStyle(d).backgroundImage))", { label: `bitmap drawn (${label})`, timeout: 5000 }).catch(() => {});
    if (setup) await app.evalJs(setup);
    await sleep(1500);
    const pre = await app.evalJs("({ room: document.documentElement.getAttribute('data-arbor2-room'), off: document.documentElement.getAttribute('data-arbor2-off'), bmpShown: [...document.querySelectorAll(\".arbor2-pagesh[data-bitmap='true']\")].filter((e) => getComputedStyle(e).display !== 'none').length, bmp: document.querySelectorAll(\".arbor2-pagesh[data-bitmap='true']\").length, pageCopy: !!document.querySelector('.mode-page .arbor2-pagesh svg'), roomShown: (() => { const r = document.querySelector('.arbor2-pergola'); return !!r && getComputedStyle(r).display !== 'none'; })() })");
    // the copies' inline-style writes while typing (a write the placement makes when nothing moved shows here)
    await app.evalJs("(() => { window.__kcStyle = 0; window.__kcMo && window.__kcMo.disconnect(); window.__kcMo = new MutationObserver((rs) => { window.__kcStyle += rs.length; }); document.querySelectorAll('.arbor2-pagesh .arbor2-pergola-drift').forEach((d) => window.__kcMo.observe(d, { attributes: true, attributeFilter: ['style'] })); return true; })()");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    const r = await tracePass(app, label);
    r.pre = pre; r.copyStyleWrites = await app.evalJs('window.__kcStyle');
    out[label] = r;
  }
  return checks;
}, { label: 'arbor2-keycost' });

ok('K1 the run is pinned to the day room (WS_URL_SEARCH carries arbor2=1 and arbor2room=day)', pinned, q);
for (const [label] of [['all'], ['nobmp'], ['noshade']]) {
  const r = out[label];
  ok(`K2 ${label}: the room in force was day, and the pass set up as named`, !!r && r.pre.room === 'day'
    && (label === 'all' ? r.pre.bmpShown > 0 && r.pre.pageCopy && r.pre.roomShown : label === 'nobmp' ? r.pre.bmp > 0 && r.pre.bmpShown === 0 && r.pre.pageCopy && r.pre.roomShown : r.pre.off === 'shadows' && !r.pre.roomShown), JSON.stringify(r && r.pre));
  ok(`K3 ${label}: the trace caught the keys (>= ${N - 5} keys measured)`, !!r && r.keys >= N - 5, JSON.stringify(r && { keys: r.keys, events: r.events }));
}
// eslint-disable-next-line no-console
console.log(JSON.stringify({ measurement: out }, null, 2));
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.length === 7 && checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-KEYCOST VERIFY: PASS (${checks.length} checks; the numbers above are a measurement, not a verdict)` : `\nARBOR2-KEYCOST VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

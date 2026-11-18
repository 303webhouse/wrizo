// ARBOR KEY-COST ATTRIBUTION (bug #80; Fable, Nov 11, 12:30 pm, item 3: "ONE ATTRIBUTION TURN IS GO (it is not a bisect). On T2 beside main:
// (a) for every key over 40 ms, record what the page was doing (long-frame or long-task attribution; which Arbor layer was animating; a swap in
// progress or not); (b) T2 with the shade off, T2 with the rhizome off, T2 with both off, each interleaved with main, using the switches the product
// already has. The aim: name the layer that costs the time.")
//
// THE SLOW KEYS: box turns 3-5 voided rhizome-latency attempts on a CONTROL key over 50 ms on every Arbor tree (T1 1/13, 50f051e2 1/14, 609e955e 2/8,
// T2 9/28) and never on main (0/24), with the CPU log at normal load. This file types the same keys on the same pages as rhizome-latency's
// measure() - per round a fast control burst (22 keys, 25 ms apart) and a hold-pace burst (16 jittered keys, then ' tail' and 36 more keys: the goal
// crossing where there is a rhizome) on a page re-seeded to 7 words and reopened, then two 400-key steady bursts (A+L's) - and JUDGES NOTHING about
// latency: every key is measured with rhizome-latency's own meter (keydown -> the second frame after its input), and every key over 40 ms is written
// out with what the page was doing:
//   - the Long Animation Frames that overlap it (PerformanceObserver 'long-animation-frame': its render/style-layout split, its blocking time and
//     its longest scripts - invoker, source position, forced style/layout) and any long task ('longtask');
//   - the Arbor layers animating at its frame (document.getAnimations(), read only AFTER a slow key's frame, so the read never costs a key);
//   - the page's own events near it (a MutationObserver, from 400 ms before the key to its frame): a leaf flutter starting or ending
//     (data-flutter), the root's inline style written (the afternoon's custom properties, every 60 s), the shade's swap (data-live-off),
//     the writing state (data-wz-writing), the flash (data-flash);
//   - its wall-clock time (UTC), so the launcher's CPU log can be read at that moment.
// THE SWITCHES (the product's own): ATTR_SHADE=off writes what the Mood menu's "Day shadows" switch writes (data-arbor2-off~='shadows' on the
// root: the pergola, the page's shade and the sun are display:none), after every reopen, and the premise reads the pergola hidden at every burst;
// ATTR_RHIZOME=off sets the writing setting's progress style to 'bar' (the rhizome field is not rendered), and the premise reads no field at every
// burst. ATTR_DIST=<dir> serves another tree's built bundle (main's) through this driver; the bundle served is printed.
// The checks are the instrument's premises only (the switches held, the keys were measured, the frame attribution was there): the findings are
// information, read by the turn's report.
//
// Run: (a box turn) WS_URL_SEARCH='?arbor2=1&arbor2room=day' [ATTR_SHADE=off] [ATTR_RHIZOME=off] [ATTR_DIST=F:/.../dist-web] node scripts/harness/arbor-keycost-attr.mjs
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const SHADE_OFF = process.env.ATTR_SHADE === 'off';
const RHIZOME_OFF = process.env.ATTR_RHIZOME === 'off';
// PARKED 2026-11-12 (SUPERSEDED - box turn 6, every main leg NOVERDICT in 9 s: runtime-verify's server serves a file only when path.join(dist, rel)
// startsWith(dist), and a forward-slash ATTR_DIST never prefixes the backslash path Windows joins, so every request got index.html and the app never
// ran). Original, verbatim:
// const DIST = process.env.ATTR_DIST || undefined;
// SUCCESSOR: the directory resolved to the platform's own form.
const DIST = process.env.ATTR_DIST ? path.resolve(process.env.ATTR_DIST) : undefined;
const ROUNDS = Number(process.env.ATTR_ROUNDS || 4);
const LONG_BURSTS = Number(process.env.ATTR_LONG || 2);   // the slow keys are sparse (box turns 3-5: about one control key in a thousand over 50 ms): the steady burst gives the most keys a minute
const SLOW_MS = 40, BAR_MS = 50, LONG_KEYS = 400;
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

// the in-page recorder: rhizome-latency's meter (keydown -> the second frame after beforeinput; busy + frame), plus the long frames, long tasks and
// page events, all kept in the page until read. Re-armed after every reopen (a reload clears the window).
const ARM = `(() => {
  if (window.__kaOff) window.__kaOff();
  window.__ka = { keys: [], loaf: [], lt: [], ev: [], loafOk: false, ltOk: false };
  const K = window.__ka; let t0 = 0, cur = null;
  try { const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) K.loaf.push({ s: e.startTime, d: e.duration, rs: e.renderStart, sl: e.styleAndLayoutStart, b: e.blockingDuration,
      sc: (e.scripts || []).slice().sort((a, b) => b.duration - a.duration).slice(0, 4).map((x) => ({ inv: String(x.invoker || '').slice(0, 80), type: x.invokerType, src: String(x.sourceURL || '').split('/').pop(), fn: x.sourceFunctionName || '', pos: x.sourceCharPosition, d: r(x.duration), fsl: r(x.forcedStyleAndLayoutDuration) })) }); });
    po.observe({ type: 'long-animation-frame', buffered: false }); K.loafOk = true; window.__kaPo = po; } catch (e) { K.loafErr = String(e); }
  try { const pl = new PerformanceObserver((l) => { for (const e of l.getEntries()) K.lt.push({ s: e.startTime, d: e.duration, a: (e.attribution || []).map((x) => x.containerType + ':' + (x.containerSrc || x.containerName || '')).join(',') }); });
    pl.observe({ type: 'longtask', buffered: false }); K.ltOk = true; window.__kaPl = pl; } catch (e) { K.ltErr = String(e); }
  function r(x) { return x == null ? null : Math.round(x * 10) / 10; }
  const mo = new MutationObserver((recs) => { const now = performance.now(); for (const m of recs) { const t = m.target, a = m.attributeName;
    if (a === 'data-flutter') K.ev.push([now, t.hasAttribute('data-flutter') ? 'flutter-on' : 'flutter-off']);
    else if (a === 'style' && t === document.documentElement) K.ev.push([now, 'root-style']);
    else if (a === 'data-live-off') K.ev.push([now, 'live-off=' + t.getAttribute('data-live-off')]);
    else if (a === 'data-wz-writing') K.ev.push([now, 'writing=' + t.getAttribute('data-wz-writing')]);
    else if (a === 'data-flash' && t.classList && t.classList.contains('wz-rhizome-field')) K.ev.push([now, 'flash=' + t.getAttribute('data-flash')]); } });
  mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['data-flutter', 'style', 'data-live-off', 'data-wz-writing', 'data-flash'] });
  const kd = () => { t0 = performance.now(); const k = { busy: null, frame: null }; cur = k; const s0 = t0; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - s0; mc.port1.close(); }; mc.port2.postMessage(0); };
  const LAYER = (t) => !t || !t.closest ? 'other' : t.closest('.arbor2-pergola') ? (t.closest('.wz-leaf') ? 'shade-room:leaf' : 'shade-room') : t.closest('.arbor2-pagesh') ? 'shade-page' : t.closest('.arbor2-sun') ? 'sun' : t.closest('.arbor2-vines-flash') ? 'flash' : t.closest('.wz-rhizome-field') ? 'rhizome' : ('chrome:' + (String(t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className).split(' ')[0] || t.tagName));
  const bi = () => { const t = t0, k = cur; requestAnimationFrame(() => {
    const rr = performance.now(); const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - rr; mc.port1.close(); }; mc.port2.postMessage(0);
    requestAnimationFrame(() => { const now = performance.now(); const ms = now - t; const f = document.querySelector('.wz-rhizome-field');
      const x = { t, at: now, ms, k, flash: f ? f.dataset.flash : null, phase: window.__kaPhase || '?', i: window.__kaN = (window.__kaN || 0) + 1 };
      if (ms > ${SLOW_MS}) { const by = {}; for (const a of document.getAnimations()) { if (a.playState !== 'running') continue; const L = LAYER(a.effect && a.effect.target); by[L] = (by[L] || 0) + 1; } x.anims = by;
        const pg = document.querySelector('.arbor2-pergola'); x.state = { writing: document.documentElement.getAttribute('data-wz-writing'), liveOff: pg ? pg.getAttribute('data-live-off') : null, asleep: pg ? pg.getAttribute('data-asleep') : null, flutterNow: document.querySelectorAll('[data-flutter]').length }; }
      K.keys.push(x); }); }); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kaOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); mo.disconnect(); try { window.__kaPo && window.__kaPo.disconnect(); window.__kaPl && window.__kaPl.disconnect(); } catch {} };
  window.__kaN = 0; return true; })()`;
// read a burst: every key (ms, busy, frame), and for each key over SLOW_MS its long frames, long tasks and events, with its UTC time
const READ = `(() => { const K = window.__ka; const o = performance.timeOrigin; const r = (x) => (x == null ? null : Math.round(x * 10) / 10);
  const keys = K.keys.map((x) => ({ ms: r(x.ms), busy: r(x.k && x.k.busy), frame: r(x.k && x.k.frame), phase: x.phase, flash: x.flash }));
  const slow = K.keys.filter((x) => x.ms > ${SLOW_MS}).map((x) => { const a = x.t, b = x.at;
    return { ms: r(x.ms), busy: r(x.k && x.k.busy), frame: r(x.k && x.k.frame), phase: x.phase, n: x.i, flash: x.flash, utc: new Date(o + x.t).toISOString(),
      loaf: K.loaf.filter((e) => e.s < b && e.s + e.d > a).map((e) => ({ at: r(e.s - a), d: r(e.d), render: e.rs ? r(e.s + e.d - e.rs) : null, styleLayout: e.sl ? r(e.s + e.d - e.sl) : null, blocking: r(e.b), scripts: e.sc })),
      longtask: K.lt.filter((e) => e.s < b && e.s + e.d > a - 50).map((e) => ({ at: r(e.s - a), d: r(e.d), a: e.a })),
      events: K.ev.filter((e) => e[0] >= a - 400 && e[0] <= b).map((e) => [r(e[0] - a), e[1]]), anims: x.anims, state: x.state }; });
  return { keys, slow, loafOk: K.loafOk, ltOk: K.ltOk, loafErr: K.loafErr || null, loafN: K.loaf.length, evN: K.ev.length,
    flutters: K.ev.filter((e) => e[1] === 'flutter-on').length, rootStyles: K.ev.filter((e) => e[1] === 'root-style').length }; })()`;
const SWITCHES = `(() => { const root = document.documentElement, pg = document.querySelector('.arbor2-pergola');
  return { arbor: root.hasAttribute('data-arbor2'), room: root.getAttribute('data-arbor2-room'), off: root.getAttribute('data-arbor2-off'), pergola: pg ? getComputedStyle(pg).display : null,
    field: !!document.querySelector('.wz-rhizome-field'), bundle: [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /assets\\/index-/.test(s)).join(',') }; })()`;

await withHarness(async (app) => {
  const fresh = async () => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.emulateDpr(1, 1400, 900);
  };
  // the shade switch, after every reopen (the mockup bar's own effect writes the attribute from its in-session state when it mounts)
  const applyShade = async () => { if (SHADE_OFF) await app.evalJs("(() => { const r = document.documentElement; const s = new Set((r.getAttribute('data-arbor2-off') || '').split(' ').filter(Boolean)); s.add('shadows'); r.setAttribute('data-arbor2-off', [...s].join(' ')); return true; })()"); };
  const style = RHIZOME_OFF ? 'bar' : 'rhizome';
  await fresh();
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const pageHash = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');   // as rhizome-latency reopens it (with any query the hash carries)
  const pageId = pageHash.split('?')[0];   // the entry's own id, for the seam
  await app.evalJs(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: ${JSON.stringify(style)} }))`);
  await app.reload();
  const seedAndReopen = async (words, goal) => {
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await app.evalJs(`(() => { window.wrizoSetWritingGoal(${JSON.stringify(goal)}); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: ${words} }, (_, i) => 'word' + i).join(' ') }); })()`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageHash)}`);
    await app.waitFor(RHIZOME_OFF ? "!!document.querySelector('.forward-only-editor')" : "!!document.querySelector('.wz-rhizome-field')", { label: 'page reopened' });
    await applyShade();
    await sleep(800);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  };
  const jit = rng(0x7A11);
  const typeSteady = async (n, gap, jitter) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(jitter ? Math.round(gap * (0.7 + 0.6 * jit())) : gap); } };
  const phase = (p) => app.evalJs(`(() => { window.__kaPhase = ${JSON.stringify(p)}; return true; })()`);
  const bursts = [], sw = [];
  const take = async (label) => { await sleep(250); const b = await app.evalJs(READ); const s = await app.evalJs(SWITCHES); sw.push({ label, ...s }); bursts.push({ label, ...b }); };
  for (let round = 1; round <= ROUNDS; round += 1) {
    await seedAndReopen(7, { n: 8, unit: 'words' });
    await app.evalJs(ARM); await phase('fast');
    await typeSteady(22, 25, false);
    await take(`r${round}-fast`);
    await seedAndReopen(7, { n: 8, unit: 'words' });
    await app.evalJs(ARM); await phase('pre');
    await typeSteady(16, 90, true);
    await phase('cross'); await app.typeKeys(' tail');
    await sleep(300);
    await phase('hold'); await typeSteady(14, 85, true);
    await sleep(900);
    await phase('fade'); await typeSteady(22, 25, false);
    await sleep(2500);
    await take(`r${round}-pre`);
  }
  for (let l = 1; l <= LONG_BURSTS; l += 1) {
    await seedAndReopen(7, { n: 1000, unit: 'words' });
    await app.evalJs(ARM); await phase('long');
    await typeSteady(LONG_KEYS, 110, false);
    await sleep(400);
    await take(`long-${l}`);
  }

  const all = bursts.flatMap((b) => b.keys);
  const slow = bursts.flatMap((b) => b.slow.map((x) => ({ burst: b.label, ...x })));
  const control = (k) => k.phase === 'fast' || k.phase === 'pre' || k.phase === 'long';
  const count = (f) => ({ n: all.filter(f).length, over40: all.filter((k) => f(k) && k.ms > SLOW_MS).length, over50: all.filter((k) => f(k) && k.ms > BAR_MS).length });
  const summary = { shade: SHADE_OFF ? 'off' : 'on', rhizome: RHIZOME_OFF ? 'off' : 'on', dist: DIST || 'this tree', bundle: sw[0] && sw[0].bundle, arbor: sw[0] && sw[0].arbor,
    control: count(control), crossing: count((k) => !control(k)), all: count(() => true),
    flutters: bursts.reduce((s, b) => s + b.flutters, 0), rootStyles: bursts.reduce((s, b) => s + b.rootStyles, 0), loaf: bursts.every((b) => b.loafOk), loafFrames: bursts.reduce((s, b) => s + b.loafN, 0) };
  console.log('ATTR-SUMMARY: ' + JSON.stringify(summary));
  console.log('ATTR-SLOW: ' + JSON.stringify(slow));
  console.log('ATTR-RAW: ' + JSON.stringify({ switches: sw, bursts: bursts.map((b) => ({ label: b.label, keys: b.keys })) }));
  if (process.env.ARBOR_ATTR_OUT) { fs.mkdirSync(path.dirname(process.env.ARBOR_ATTR_OUT), { recursive: true }); fs.writeFileSync(process.env.ARBOR_ATTR_OUT, JSON.stringify({ summary, slow, switches: sw, bursts }, null, 1)); }

  const arborRuns = sw.filter((s) => s.arbor);
  ok(`X1 the switches held at every burst: shade ${summary.shade}, rhizome ${summary.rhizome} (on an Arbor page: the pergola ${SHADE_OFF ? 'display:none' : 'shown'}; the field ${RHIZOME_OFF ? 'absent' : 'present'})`,
    sw.length === ROUNDS * 2 + LONG_BURSTS && sw.every((s) => (RHIZOME_OFF ? !s.field : s.field) && (!s.arbor || (SHADE_OFF ? s.pergola === 'none' && /\bshadows\b/.test(s.off || '') : s.pergola !== 'none' && !/\bshadows\b/.test(s.off || '')))) && (arborRuns.length === 0 || arborRuns.length === sw.length),
    JSON.stringify(sw.map((s) => [s.label, s.arbor, s.room, s.off, s.pergola, s.field])));
  ok(`X2 the keys were measured: at least ${ROUNDS * 70 + LONG_BURSTS * (LONG_KEYS - 10)} painted (every one with its time; ${all.length} read)`, all.length >= ROUNDS * 70 + LONG_BURSTS * (LONG_KEYS - 10) && all.every((k) => Number.isFinite(k.ms)), JSON.stringify(summary));
  ok('X3 the frame attribution was there: the Long Animation Frames observer ran on every burst (the slow keys\' frames are attributable)', summary.loaf, JSON.stringify(bursts.map((b) => [b.label, b.loafOk, b.loafErr])));
  return checks;
}, { label: 'arbor-keycost-attr', dist: DIST });

// eslint-disable-next-line no-console
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const WANT_CHECKS = 3;
const pass = checks.length === WANT_CHECKS && checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR-KEYCOST-ATTR VERIFY: PASS (${checks.length} checks)` : `\nARBOR-KEYCOST-ATTR VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT_CHECKS ? ` (and ${checks.length} checks ran where ${WANT_CHECKS} were expected)` : ''}`);
process.exit(pass ? 0 : 1);

// ARBOR KEY PROFILE (bug #80, after box turn 9; Fable, Nov 14, 4:22 pm: "find what the fix does per key that main doesn't, by measurement (a
// browser sampling profile, Enter-style: steady keys and start keys, fix against main). No guessing at the cause." Nick, 4:21 pm: the bar stays; a
// look item that is the cost may be proposed for cutting, with numbers - cost with it, cost without it.)
//
// A MEASUREMENT, not a check: it prints numbers. Its checks are the instrument's premises only (the arm held, the keys were typed and painted, the
// profile and the trace were collected and are not empty).
//
// The keys are arbor-keycost-attr's control keys on the same page (a book page re-seeded to 7 words through the seams and reopened):
//   START: per reopen, the first 3 keys of a fast burst (25 ms apart) - the key that starts writing and the two after it (the start window);
//   STEADY: one burst on a reopened page, 20 warm keys and then KP_STEADY keys (default 200) at 110 ms - arbor-keycost-attr's long burst.
// Each is measured twice, never both at once: once under the browser's sampling profiler (CDP Profiler, 250 us) and once under a DevTools trace.
//   PROFILE: per key, the span, idle, GC, "(program)" (the browser's own work - style, layout, paint, compositing) and JS; the JS functions with the
//     most SELF time per key, each with a snippet of the built bundle at its position (the bundle has no source map, so the snippet names it).
//   TRACE: per key, the renderer main thread's SELF time by event (style recalc with the elements it restyled, layout, pre-paint, paint, layerize,
//     commit, timers, animation frames, events), and every thread's busy time (the compositor, the raster workers, the GPU and viz threads).
//   KEYS: every measured key's time with rhizome-latency's meter (keydown -> the second frame after its input), so a profile reads beside its keys.
//
// THE ARMS (KP_ARM; the wrappers arbor-keyprofile-<arm>.mjs set it, and the flag, before this file loads):
//   plain      no flag (main's page; on an Arbor tree, the same tree unflagged)
//   arbor      ?arbor2=1&arbor2room=day (the fix's page, as box turn 9 typed it)
//   shadeoff   arbor + the Mood menu's "Day shadows" switch off (data-arbor2-off~='shadows': the pergola, the page's shade and the sun not shown)
//   rhizomeoff arbor + the progress style 'bar' (the rhizome field is not rendered)
//   bothoff    arbor + both
// ROUND 2 (after round 1 found the start cost in the shade and an unswitched steady cost; Fable, Nov 14, 4:24 pm: cost with it, cost without it):
//   caretoff   arbor + &arbor2caret=off (the product's own test-only caret pin, arbor2/flag.ts)
//   night      ?arbor2=1&arbor2room=night (the night room)
//   nopergola / nopagesh / nosun / novines / novignette   arbor with ONE layer hidden by a harness-only stylesheet (display:none !important on
//              .arbor2-pergola / .arbor2-pagesh / .arbor2-sun / .arbor2-vines / .arbor2-vignette-mask), re-injected after every reopen; the premise
//              requires the layer to EXIST on the page and to be hidden, so an arm can never measure a layer that is not there
//   alloff     arbor + shade off + rhizome off + caret off
// The switches are the product's own, written as arbor-keycost-attr writes them. Run on Actions: the fix's tree (arms plain, arbor, shadeoff,
// rhizomeoff, bothoff) and main's tree (plain), one file per arm, so "with it / without it" is read inside one tree and fix-vs-main across two.
//
// Output lines: KP-HEAD, KP-KEYS (per phase), KP-PROFILE (per phase), KP-TRACE (per phase), KP-SNIPPETS; then the premises and the verdict line.
import { withHarness } from '../runtime-verify.mjs';

const ARM = process.env.KP_ARM || 'plain';
const ARMS = { plain: {}, arbor: { flag: true }, shadeoff: { flag: true, shade: 'off' }, rhizomeoff: { flag: true, rhizome: 'off' }, bothoff: { flag: true, shade: 'off', rhizome: 'off' },
  caretoff: { flag: true, caret: 'off' }, night: { flag: true, room: 'night' }, nopergola: { flag: true, hide: '.arbor2-pergola' }, nopagesh: { flag: true, hide: '.arbor2-pagesh' },
  nosun: { flag: true, hide: '.arbor2-sun' }, novines: { flag: true, hide: '.arbor2-vines' }, novignette: { flag: true, hide: '.arbor2-vignette-mask' }, alloff: { flag: true, shade: 'off', rhizome: 'off', caret: 'off' } };
const HIDE_SEL = (ARMS[process.env.KP_ARM || 'plain'] || {}).hide || null;
const A = ARMS[ARM];
const START_ROUNDS = Number(process.env.KP_START || 10);
const STEADY_KEYS = Number(process.env.KP_STEADY || 200);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10) / 10);
const r2 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);
const LABEL = `ARBOR-KEYPROFILE-${ARM.toUpperCase()}`;
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'toplevel', 'blink', 'cc', 'gpu', 'viz'];

// the meter (rhizome-latency's: keydown -> the second frame after the key's input)
const METER = `(() => { if (window.__kpOff) window.__kpOff(); window.__kp = []; let t0 = 0;
  const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { window.__kp.push({ t, ms: performance.now() - t }); })); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kpOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
const STATE = `(() => { const root = document.documentElement, pg = document.querySelector('.arbor2-pergola');
  return { arbor: root.hasAttribute('data-arbor2'), room: root.getAttribute('data-arbor2-room'), off: root.getAttribute('data-arbor2-off'), pergola: pg ? getComputedStyle(pg).display : null,
    hid: ${JSON.stringify(HIDE_SEL)} ? (() => { const els = [...document.querySelectorAll(${JSON.stringify(HIDE_SEL || 'x-none')})]; return { n: els.length, shown: els.filter((e) => getComputedStyle(e).display !== 'none').length }; })() : null,
    caretOff: /[?&]arbor2caret=off\\b/.test(location.search + location.hash),
    field: !!document.querySelector('.wz-rhizome-field'), anims: document.getAnimations().filter((a) => a.playState === 'running').length,
    bundle: [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /assets\\/index-/.test(s)).join(',') }; })()`;

// a sampling profile -> buckets and self time per function (keyed by url:line:col, so two minified functions with one name stay apart)
const addProfile = (acc, profile) => {
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const t = profile.timeDeltas;
  acc.samples += profile.samples.length;
  for (let i = 0; i < profile.samples.length; i += 1) {
    const dt = (t[i + 1] ?? t[i] ?? 0) / 1000; acc.span += dt;
    const cf = nodes.get(profile.samples[i]).callFrame; const nm = cf.functionName || '(anonymous)';
    if (nm === '(idle)') acc.idle += dt; else if (nm === '(garbage collector)') acc.gc += dt; else if (nm === '(program)') acc.program += dt; else if (nm === '(root)') acc.root += dt;
    else { acc.js += dt; const k = `${cf.url}|${cf.lineNumber}|${cf.columnNumber}`; const f = acc.fns.get(k) || { name: nm, url: cf.url, line: cf.lineNumber, col: cf.columnNumber, ms: 0 }; f.ms += dt; acc.fns.set(k, f); }
  }
};
const newProf = () => ({ samples: 0, span: 0, idle: 0, gc: 0, program: 0, root: 0, js: 0, fns: new Map() });
const profOut = (acc, keys) => ({ keys, samples: acc.samples, perKey: { spanMs: r2(acc.span / keys), idleMs: r2(acc.idle / keys), programMs: r2(acc.program / keys), gcMs: r2(acc.gc / keys), jsMs: r2(acc.js / keys) },
  top: [...acc.fns.values()].sort((a, b) => b.ms - a.ms).slice(0, 15).map((f) => ({ fn: f.name, at: `${String(f.url).split('/').pop()}:${f.line + 1}:${f.col + 1}`, msPerKey: r2(f.ms / keys) })) });

// a trace -> the renderer main thread's self time by event name (nesting by time on the thread), the elements restyled, and every thread's busy time
const addTrace = (acc, events) => {
  const names = new Map(); for (const e of events) if (e.ph === 'M' && e.name === 'thread_name' && e.args) names.set(`${e.pid}:${e.tid}`, e.args.name);
  const disp = {}; for (const e of events) if (e.name === 'EventDispatch') { const k = `${e.pid}:${e.tid}`; disp[k] = (disp[k] || 0) + 1; }
  const main = [...names.entries()].filter(([, n]) => n === 'CrRendererMain').map(([k]) => k).sort((a, b) => (disp[b] || 0) - (disp[a] || 0))[0];
  const byThread = new Map();
  for (const e of events) { if (e.ph !== 'X' || typeof e.dur !== 'number') continue; const k = `${e.pid}:${e.tid}`; (byThread.get(k) || byThread.set(k, []).get(k)).push(e); }
  for (const [k, xs] of byThread) {
    xs.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    // top-level busy (union of outermost events) per thread
    let busy = 0, end = -1; for (const e of xs) { const s = e.ts, f = e.ts + e.dur; if (s >= end) { busy += e.dur; end = f; } else if (f > end) { busy += f - end; end = f; } }
    const tn = names.get(k) || 'thread'; const key = k === main ? 'RendererMain' : tn.replace(/\d+$/, '');
    acc.threads[key] = (acc.threads[key] || 0) + busy / 1000;
    if (k !== main) continue;
    // self time by name: subtract each event's direct children
    const stack = [];
    for (const e of xs) {
      while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop();
      e.__child = 0; if (stack.length) stack[stack.length - 1].__child += e.dur;
      stack.push(e);
    }
    for (const e of xs) { const ms = Math.max(0, e.dur - e.__child) / 1000; const nm = e.name === 'TimerFire' || e.name === 'FunctionCall' || e.name === 'EventDispatch' ? `${e.name}${e.args && e.args.data && e.args.data.type ? ':' + e.args.data.type : ''}` : e.name;
      acc.self[nm] = (acc.self[nm] || 0) + ms; acc.count[nm] = (acc.count[nm] || 0) + 1;
      if (e.name === 'UpdateLayoutTree' && e.args && e.args.elementCount) acc.restyled += e.args.elementCount;
      if (e.name === 'Layout' && e.args && e.args.beginData && e.args.beginData.dirtyObjects) acc.relaid += e.args.beginData.dirtyObjects; }
  }
  acc.mainFound = acc.mainFound || !!main;
};
const newTrace = () => ({ self: {}, count: {}, threads: {}, restyled: 0, relaid: 0, mainFound: false });
const traceOut = (acc, keys) => ({ keys, mainFound: acc.mainFound, restyledPerKey: r1(acc.restyled / keys), relaidPerKey: r1(acc.relaid / keys),
  mainSelfPerKey: Object.fromEntries(Object.entries(acc.self).sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, ms]) => [k, { ms: r2(ms / keys), n: r1(acc.count[k] / keys) }])),
  threadsBusyPerKey: Object.fromEntries(Object.entries(acc.threads).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, ms]) => [k, r2(ms / keys)])) });
const keysOut = (ks) => { const ms = ks.map((k) => k.ms).sort((a, b) => a - b); const q = (p) => ms.length ? r1(ms[Math.min(ms.length - 1, Math.floor(ms.length * p))]) : null;
  return { n: ms.length, mean: r1(ms.reduce((a, b) => a + b, 0) / (ms.length || 1)), p50: q(0.5), p90: q(0.9), max: r1(ms[ms.length - 1]), over40: ms.filter((x) => x > 40).length, over50: ms.filter((x) => x > 50).length }; };

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  const cdp = (m, p = {}) => app.cdp(m, p);
  console.log(`KP-HEAD ${JSON.stringify({ arm: ARM, search: process.env.WS_URL_SEARCH || null, startRounds: START_ROUNDS, steadyKeys: STEADY_KEYS, at: new Date().toISOString() })}`);
  if (!A) { ok(`P0 the arm is known (${ARM})`, false, 'KP_ARM must be one of ' + Object.keys(ARMS).join(', ')); return checks; }
  // the page, as arbor-keycost-attr makes it
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await js("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const pageHash = (await js('location.hash')).replace(/^#\/page\//, '');
  const pageId = pageHash.split('?')[0];
  const style = A.rhizome === 'off' ? 'bar' : 'rhizome';
  await js(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: ${JSON.stringify(style)} }))`);
  await app.reload();
  const applyShade = async () => { if (A.shade === 'off') await js("(() => { const r = document.documentElement; const s = new Set((r.getAttribute('data-arbor2-off') || '').split(' ').filter(Boolean)); s.add('shadows'); r.setAttribute('data-arbor2-off', [...s].join(' ')); return true; })()"); };
  const states = [];
  const reopen = async (goal) => {
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await js(`(() => { window.wrizoSetWritingGoal(${JSON.stringify(goal)}); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);
    await app.reload();
    await js(`location.hash = '#/page/' + ${JSON.stringify(pageHash)}`);
    await app.waitFor(style === 'bar' ? "!!document.querySelector('.forward-only-editor')" : "!!document.querySelector('.wz-rhizome-field')", { label: 'page reopened' });
    await applyShade();
    if (A.hide) await js(`(() => { const st = document.createElement('style'); st.id = 'kp-hide'; st.textContent = ${JSON.stringify(A.hide)} + '{ display: none !important; }'; document.head.appendChild(st); return true; })()`);
    await sleep(800);
    await js("document.querySelector('.forward-only-editor').focus()");
    states.push(await js(STATE));
  };
  const typeAt = async (n, gap) => { const t0 = Date.now(); for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); const w = t0 + (i + 1) * gap - Date.now(); if (w > 0) await sleep(w); } };
  const profiled = async (fn) => { await cdp('Profiler.enable'); await cdp('Profiler.setSamplingInterval', { interval: 250 }); await cdp('Profiler.start'); await fn(); const { profile } = await cdp('Profiler.stop'); await cdp('Profiler.disable'); return profile; };
  const traced = async (fn) => { const events = []; const off = app.tap((method, p) => { if (method === 'Tracing.dataCollected' && p && p.value) events.push(...p.value); });
    await cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
    await fn(); const done = app.waitEvent('Tracing.tracingComplete', 60000); await cdp('Tracing.end'); await done; await sleep(200); off(); return events; };
  const out = {};
  // START: the first 3 keys after a reopen, 25 ms apart (the start window), under each instrument in turn
  for (const inst of ['profile', 'trace']) {
    const acc = inst === 'profile' ? newProf() : newTrace(); const ks = []; let measured = 0;
    for (let r = 0; r < START_ROUNDS; r += 1) {
      await reopen({ n: 8, unit: 'words' }); await js(METER);
      const run = async () => { await typeAt(3, 25); await sleep(250); };
      if (inst === 'profile') addProfile(acc, await profiled(run)); else addTrace(acc, await traced(run));
      const got = await js('window.__kp.map((x) => ({ ms: x.ms }))'); ks.push(...got); measured += got.length;
    }
    out[`start-${inst}`] = { keys: keysOut(ks), data: inst === 'profile' ? profOut(acc, measured || 1) : traceOut(acc, measured || 1), acc };
  }
  // STEADY: 20 warm keys, then STEADY_KEYS at 110 ms, on a page with a far goal (no crossing), under each instrument in turn
  for (const inst of ['profile', 'trace']) {
    await reopen({ n: 1000, unit: 'words' }); await typeAt(20, 110); await sleep(300); await js(METER);
    const acc = inst === 'profile' ? newProf() : newTrace();
    const run = async () => { await typeAt(STEADY_KEYS, 110); await sleep(300); };
    if (inst === 'profile') addProfile(acc, await profiled(run)); else addTrace(acc, await traced(run));
    const ks = await js('window.__kp.map((x) => ({ ms: x.ms }))');
    out[`steady-${inst}`] = { keys: keysOut(ks), data: inst === 'profile' ? profOut(acc, ks.length || 1) : traceOut(acc, ks.length || 1), acc };
  }
  // snippets of the bundle at the top functions' positions (no source map: the code names the function)
  const want = new Map();
  for (const ph of ['start-profile', 'steady-profile']) for (const f of out[ph].data.top.slice(0, 10)) { const fn = [...out[ph].acc.fns.values()].find((x) => `${String(x.url).split('/').pop()}:${x.line + 1}:${x.col + 1}` === f.at); if (fn && fn.url) want.set(f.at, fn); }
  const snippets = {};
  for (const [at, f] of want) {
    snippets[at] = await js(`(async () => { try { const t = await (await fetch(${JSON.stringify(f.url)})).text(); const L = t.split('\\n'); const l = L[${f.line}] || ''; return l.slice(${f.col}, ${f.col} + 220); } catch (e) { return 'ERR ' + String(e).slice(0, 80); } })()`);
  }
  for (const ph of ['start', 'steady']) {
    console.log(`KP-KEYS ${JSON.stringify({ arm: ARM, phase: ph, profileRun: out[`${ph}-profile`].keys, traceRun: out[`${ph}-trace`].keys })}`);
    console.log(`KP-PROFILE ${JSON.stringify({ arm: ARM, phase: ph, ...out[`${ph}-profile`].data })}`);
    console.log(`KP-TRACE ${JSON.stringify({ arm: ARM, phase: ph, ...out[`${ph}-trace`].data })}`);
  }
  console.log(`KP-SNIPPETS ${JSON.stringify({ arm: ARM, snippets })}`);
  console.log(`KP-STATES ${JSON.stringify({ arm: ARM, first: states[0], n: states.length })}`);

  // premises
  const wantN = 2 * START_ROUNDS + 2;
  ok(`P1 the arm held at every reopen (${wantN}): ${A.flag ? 'an Arbor page' : 'no Arbor flag'}${A.shade === 'off' ? ', the pergola display:none' : ''}${A.rhizome === 'off' ? ', no rhizome field' : ', the rhizome field present'}`,
    states.length === wantN && states.every((s) => (A.flag ? s.arbor : !s.arbor) && (A.rhizome === 'off' ? !s.field : s.field) && (!A.flag || (A.shade === 'off' || A.hide === '.arbor2-pergola' ? s.pergola === 'none' : s.pergola !== 'none'))
      && (A.hide ? !!s.hid && s.hid.n > 0 && s.hid.shown === 0 : true) && (A.room ? s.room === A.room : (!A.flag || s.room === 'day')) && (A.caret === 'off' ? s.caretOff : !s.caretOff)),
    JSON.stringify(states.map((s) => [s.arbor, s.room, s.off, s.pergola, s.field, s.hid, s.caretOff])));
  const kn = (p) => out[p].keys.n;
  ok(`P2 the keys were typed and painted: start ${START_ROUNDS * 3} per instrument, steady at least ${STEADY_KEYS - 5} per instrument (${kn('start-profile')}, ${kn('start-trace')}, ${kn('steady-profile')}, ${kn('steady-trace')})`,
    kn('start-profile') === START_ROUNDS * 3 && kn('start-trace') === START_ROUNDS * 3 && kn('steady-profile') >= STEADY_KEYS - 5 && kn('steady-trace') >= STEADY_KEYS - 5, '');
  ok(`P3 the profiles were collected and are not empty (samples: start ${out['start-profile'].data.samples}, steady ${out['steady-profile'].data.samples})`,
    out['start-profile'].data.samples > 100 && out['steady-profile'].data.samples > 1000, '');
  ok(`P4 the traces found the renderer's main thread and its style work (start ${out['start-trace'].data.mainFound}, steady ${out['steady-trace'].data.mainFound})`,
    out['start-trace'].data.mainFound && out['steady-trace'].data.mainFound && Object.keys(out['steady-trace'].data.mainSelfPerKey).length > 3, '');
  return checks;
}, { label: 'arbor-keyprofile' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const WANT = 4;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\n${LABEL} VERIFY: PASS (${checks.length} checks)` : `\n${LABEL} VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);

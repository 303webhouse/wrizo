// PROBE 7 (see make-probe7.mjs in the lane's notes): probe 6 with the STILLWARM and NOFADE arms in place of the hidden-drawing arms; each arm
// prints its premise (the still's and the pergola's opacity at rest and after key 1). HIDE below now injects an arm's sheet.
// BUG #104 PREP, probe 6 (a measurement branch, never merged). The record so far (Actions, 9 bursts per arm, traced medians):
//   probe 3 r2 (44346401130): the leaves' pause rule deleted -> key 1 unchanged (73.3 vs 67.7 ms): FALSIFIED as the cause.
//   probe 4 (44347113701): the data-live-off rules deleted -> key 1 restyle unchanged (14.1 ms/907 el vs 13.0/902): FALSIFIED.
//   probe 5 (44347825044): both drawings display:none -> key 1 31.7 ms (redesign 86.2, today 28.8), key 2 28.7 (48.7, 26.4) - the cost IS the
//     drawings; but the key-1 restyle barely moves (13.0 ms vs 17.5), and at rest the redesign restyles 3.9 ms per 400 ms - so the ~55 ms is NOT
//     main-thread style work: it is paint, raster or compositing at the first key's switch.
// Probe 6: per arm, the key-1 window (keydown 1 -> keydown 2) per THREAD: busy ms and the top events by self time on each thread; the main thread's
// paint, commit and layerize. Arms: REDESIGN; NOPERGOLA (the room's drawing hidden); NOPAGESH (the page's shade copy hidden); TODAY. No invalidation
// tracking (less overhead than probes 2-5). Prints KB7 lines.
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.K104_ROUNDS || 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'toplevel', 'cc', 'gpu', 'viz', 'blink', 'v8', 'benchmark'];
const HIDE = (css) => `(() => { const st = document.createElement('style'); st.id = 'probe-arm'; st.textContent = ${J(css)}; document.head.appendChild(st); return document.querySelectorAll('.arbor2-pergola .arbor2-still').length; })()`;
const STILLWARM = ".arbor2-pergola:not([data-live-off='true']) .arbor2-pergola-drift > .arbor2-still { opacity:.004 !important; }";
const NOFADE = ".arbor2-pergola { opacity:1 !important; transition:none !important; }";
const ARMS = [['redesign', '/', null], ['stillwarm', '/', STILLWARM], ['nofade', '/', NOFADE], ['today', '/?arbor2=0', null]];
const METER = `(() => { if (window.__kbOff) window.__kbOff(); window.__kb = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kb.push(performance.now() - t))); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kbOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
const LAYERS = "(() => { const r = (sel) => [...document.querySelectorAll(sel)].map((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { w: Math.round(b.width), h: Math.round(b.height), filter: cs.filter !== 'none' ? cs.filter.slice(0, 40) : null, blend: cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : null, wc: cs.willChange !== 'auto' ? cs.willChange : null, op: cs.opacity }; }); return { pergola: r('.arbor2-pergola'), pagesh: r('.arbor2-pagesh'), still: r('.arbor2-still'), live: r('.arbor2-live') }; })()";

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await js("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
  const id = `arbor-104h-${Math.random().toString(36).slice(2, 7)}`;
  await js(`window.wrizoCreateJournalPage(${J({ id, text: 'word0 word1 word2 word3 word4 word5 word6', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await js("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  const reopen = async (path) => {
    await js("location.hash = '#/'"); await sleep(300);
    await js(`(() => { window.wrizoSetWritingGoal(${J({ n: 8, unit: 'words' })}); window.wrizoPatchEntry(${J(id)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);
    await js(`history.replaceState(null, '', ${J(path + '#/')})`); await app.reload();
    await js(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'page reopened', timeout: 15000 });
    await js("document.documentElement.setAttribute('data-room', 'light'); true");
    await sleep(800);
    await js("document.querySelector('.forward-only-editor').focus()");
  };
  const typeAt = async (n, gap) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(gap); } };
  let layersOnce = null;
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const [arm, path, hide] of [...ARMS.slice((round - 1) % 4), ...ARMS.slice(0, (round - 1) % 4)]) {
      await reopen(path);
      const hidden = hide ? await js(HIDE(hide)) : null; if (hide) await sleep(600);
      const before = await js("(() => { const p = document.querySelector('.arbor2-pergola'); const st = document.querySelector('.arbor2-pergola .arbor2-still'); return p ? { pergolaOp: getComputedStyle(p).opacity, stillOp: st ? getComputedStyle(st).opacity : null } : null; })()");
      if (arm === 'redesign' && !layersOnce) layersOnce = await js(LAYERS);
      await js(METER);
      const events = []; const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) events.push(...p.value); });
      await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
      await typeAt(3, 25); await sleep(300);
      const done = app.waitEvent('Tracing.tracingComplete', 60000); await app.cdp('Tracing.end'); await done; await sleep(200); off();
      const keys = await js('window.__kb.map((x) => Math.round(x * 10) / 10)');
      const after = await js("(() => { const p = document.querySelector('.arbor2-pergola'); const st = document.querySelector('.arbor2-pergola .arbor2-still'); return p ? { pergolaOp: getComputedStyle(p).opacity, stillOp: st ? getComputedStyle(st).opacity : null, liveOff: p.getAttribute('data-live-off') } : null; })()");
      await typeAt(19, 25); await sleep(250);
      const names = new Map(); for (const e of events) if (e.ph === 'M' && e.name === 'thread_name' && e.args) names.set(`${e.pid}:${e.tid}`, e.args.name);
      const kds = events.filter((e) => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'keydown').map((e) => e.ts).sort((a, b) => a - b);
      if (kds.length < 2) { console.log('KB7 ' + J({ round, arm, hidden, keys, error: 'keydowns in trace: ' + kds.length })); continue; }
      const [a, b] = [kds[0], kds[1]];
      const byThread = new Map(); for (const e of events) { if (e.ph !== 'X' || typeof e.dur !== 'number') continue; if (e.ts + e.dur < a || e.ts >= b) continue; const k = `${e.pid}:${e.tid}`; (byThread.get(k) || byThread.set(k, []).get(k)).push(e); }
      const threads = {};
      for (const [k, xs] of byThread) {
        xs.sort((p, q) => p.ts - q.ts || q.dur - p.dur);
        let busy = 0, end = -1; for (const e of xs) { const s0 = Math.max(e.ts, a), f = Math.min(e.ts + e.dur, b); if (f <= s0) continue; if (s0 >= end) { busy += f - s0; end = f; } else if (f > end) { busy += f - end; end = f; } }
        const stack = []; const self = {}; for (const e of xs) { while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop(); e.__c = 0; if (stack.length) stack[stack.length - 1].__c += e.dur; stack.push(e); }
        for (const e of xs) { const v = Math.max(0, e.dur - e.__c) / 1000; self[e.name] = (self[e.name] || 0) + v; }
        const tn = (names.get(k) || 'thread').replace(/\d+$/, '');
        const T = (threads[tn] ||= { busy: 0, top: {} }); T.busy += busy / 1000; for (const [n, v] of Object.entries(self)) T.top[n] = (T.top[n] || 0) + v;
      }
      const out = {}; for (const [tn, T] of Object.entries(threads)) { if (T.busy < 0.5) continue; out[tn] = { busy: r1(T.busy), top: Object.entries(T.top).sort((p, q) => q[1] - p[1]).slice(0, 5).map(([n, v]) => [n, r1(v)]) }; }
      console.log('KB7 ' + J({ round, arm, hidden, before, after, keys, windowMs: r1((b - a) / 1000), threads: out }));
    }
  }
  console.log('KB7-LAYERS ' + J(layersOnce));
  return [{ name: 'probe ran', pass: true }];
}, { label: 'arbor-104-probe7' });
console.log('\nARBOR-104-PROBE7 VERIFY: PASS (1 checks)');
process.exit(0);

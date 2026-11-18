// BUG #104 PREP (a probe on a measurement branch, never merged; Fable, Nov 18: "#104 prep, with no box turns"). The redesign's start-window slow keys,
// concentrated on some turns in r2-fast (the second reopen; 17 s into a run) and spread over r1-r4 on others. arbor-keycost-attr's round shape on the
// redesign as it ships (no query; day room pinned through the room attribute): per round a fast burst (22 keys, 25 ms) on a reopened page, then a
// pre burst (16 keys ~90 ms, the goal crossing ' tail', 14 hold keys, 22 fade keys, 2.5 s) on a reopened page. Around each fast burst's first 3 keys
// (+300 ms) a DevTools trace; per fast burst it prints (KB lines): keys 1-3, the shade at key 1 (the still picture's image set? live-off flipped
// when?), and the trace window's main-thread work by kind - GC, image decode, raster, paint, style/layout, script - and every thread's busy time.
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.K104_ROUNDS || 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'toplevel', 'v8', 'blink', 'cc', 'gpu'];
const KIND = (n) => /GC|Scavenge|MarkCompact|MinorGC|MajorGC/i.test(n) ? 'gc' : /Decode|ImageDecode/i.test(n) ? 'decode' : /Raster/i.test(n) ? 'raster'
  : /^Paint$|PaintArtifact|Layerize|PrePaint/i.test(n) ? 'paint' : /UpdateLayoutTree|recalcStyle|Layout|StyleInvalid/i.test(n) ? 'style/layout'
  : /FunctionCall|EvaluateScript|v8\.|TimerFire|EventDispatch|FireAnimationFrame|RunMicrotasks/i.test(n) ? 'script' : 'other';
const METER = `(() => { if (window.__kbOff) window.__kbOff(); window.__kb = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kb.push(performance.now() - t))); };
  const mo = new MutationObserver((rs) => { for (const m of rs) if (m.attributeName === 'data-live-off' && m.target.classList.contains('arbor2-pergola')) window.__kbLive = window.__kbLive ?? (performance.now() - t0); });
  mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['data-live-off'] }); window.__kbLive = undefined;
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kbOff = () => { mo.disconnect(); document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
const SHADE = "(() => { const st = document.querySelector('.arbor2-pergola .arbor2-still'); const pg = document.querySelector('.arbor2-pergola'); return { stillImage: !!st && /url\\(/.test(st.style.backgroundImage || ''), liveOff: pg ? pg.getAttribute('data-live-off') : null, asleep: pg ? pg.getAttribute('data-asleep') : null, arbor: document.documentElement.getAttribute('data-arbor2') }; })()";

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await js("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
  const id = `arbor-104-${Math.random().toString(36).slice(2, 7)}`;
  await js(`window.wrizoCreateJournalPage(${J({ id, text: 'word0 word1 word2 word3 word4 word5 word6', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await js("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  const t0run = Date.now();
  const reopen = async (goal) => {
    await js("location.hash = '#/'"); await sleep(300);
    await js(`(() => { window.wrizoSetWritingGoal(${J(goal)}); window.wrizoPatchEntry(${J(id)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);
    await app.reload();
    await js(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'page reopened', timeout: 15000 });
    await js("document.documentElement.setAttribute('data-room', 'light'); true");
    await sleep(800);
    await js("document.querySelector('.forward-only-editor').focus()");
  };
  const typeAt = async (n, gap, jitter) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(jitter ? Math.round(gap * (0.7 + 0.6 * Math.random())) : gap); } };
  for (let round = 1; round <= ROUNDS; round += 1) {
    // the fast burst, its first 3 keys traced
    await reopen({ n: 8, unit: 'words' });
    const shade = await js(SHADE);
    await js(METER);
    const events = []; const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) events.push(...p.value); });
    await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
    await typeAt(3, 25, false); await sleep(300);
    const done = app.waitEvent('Tracing.tracingComplete', 60000); await app.cdp('Tracing.end'); await done; await sleep(200); off();
    const keys = await js('window.__kb.map((x) => Math.round(x * 10) / 10)'); const liveAt = await js('window.__kbLive ?? null');
    await typeAt(19, 25, false); await sleep(250);
    // what the trace window held, by kind: the renderer main thread's self time, and every thread's busy time
    const names = new Map(); for (const e of events) if (e.ph === 'M' && e.name === 'thread_name' && e.args) names.set(`${e.pid}:${e.tid}`, e.args.name);
    const disp = {}; for (const e of events) if (e.name === 'EventDispatch') { const k = `${e.pid}:${e.tid}`; disp[k] = (disp[k] || 0) + 1; }
    const main = [...names.entries()].filter(([, n]) => n === 'CrRendererMain').map(([k]) => k).sort((a, b) => (disp[b] || 0) - (disp[a] || 0))[0];
    const byKind = {}, top = {}, threads = {};
    const byThread = new Map(); for (const e of events) { if (e.ph !== 'X' || typeof e.dur !== 'number') continue; const k = `${e.pid}:${e.tid}`; (byThread.get(k) || byThread.set(k, []).get(k)).push(e); }
    for (const [k, xs] of byThread) {
      xs.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
      let busy = 0, end = -1; for (const e of xs) { const s0 = e.ts, f = e.ts + e.dur; if (s0 >= end) { busy += e.dur; end = f; } else if (f > end) { busy += f - end; end = f; } }
      const tn = k === main ? 'RendererMain' : (names.get(k) || 'thread').replace(/\d+$/, ''); threads[tn] = r1((threads[tn] || 0) + busy / 1000);
      // GC and image decode anywhere (they may run off the main thread)
      for (const e of xs) { const kd = KIND(e.name); if (k !== main && (kd === 'gc' || kd === 'decode')) byKind[kd + ' (off-main)'] = r1((byKind[kd + ' (off-main)'] || 0) + e.dur / 1000); }
      if (k !== main) continue;
      const stack = []; for (const e of xs) { while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop(); e.__c = 0; if (stack.length) stack[stack.length - 1].__c += e.dur; stack.push(e); }
      for (const e of xs) { const self = Math.max(0, e.dur - e.__c) / 1000; const kd = KIND(e.name); byKind[kd] = r1((byKind[kd] || 0) + self); top[e.name] = r1((top[e.name] || 0) + self); }
    }
    const topN = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
    console.log('KB ' + J({ round, atS: Math.round((Date.now() - t0run) / 1000), keys, shadeAtKey1: shade, liveOffAfterKey1Ms: liveAt == null ? null : r1(liveAt), mainSelfByKind: byKind, topMain: topN, threads }));
    // the pre burst with the goal crossing, as arbor-keycost-attr types it
    await reopen({ n: 8, unit: 'words' });
    await typeAt(16, 90, true); await app.typeKeys(' tail'); await sleep(300); await typeAt(14, 85, true); await sleep(900); await typeAt(22, 25, false); await sleep(2500);
  }
  return [{ name: 'probe ran', pass: true }];
}, { label: 'arbor-104-probe' });
console.log('\nARBOR-104-PROBE VERIFY: PASS (1 checks)');
process.exit(0);

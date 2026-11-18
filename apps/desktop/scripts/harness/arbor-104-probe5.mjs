// PROBE 5 (see make-probe5.mjs in the lane's notes): probe 4 with the NOLAYERS arm in place of NOLIVEOFF, and a 400 ms trace at rest per arm.
// Probe 4 falsified the live-off cut (Actions 44347113701). DELPAUSE below is the arm's step (the name kept from probe 3).
// PROBE 4 (see make-probe4.mjs in the lane's notes): probe 3 with the NOLIVEOFF arm in place of NOPAUSE, and the DOM counts. Probe 3 r2 falsified
// the pause rule as the cause (Actions 44346401130). DELPAUSE below is the arm's deleter (the name kept from probe 3).
// PROBE 3 = probe 2 plus a third arm, NOPAUSE (below). Probe 2 (Actions 44343708664): key 1 restyles ~900 elements on the redesign vs 352 on today's
// Arbor, ~115 g.wz-leaf invalidated per burst by the writing flag's pause rule. ROUNDS default 3 rotates the arm order.
// BUG #104 PREP, probe 2 (a measurement branch, never merged). Probe 1 (Actions 44341855254, 12 bursts) named the start window's work:
// Document::recalcStyle 18-28 ms and FunctionCall 11-30 ms around keys 1-3, no GC, no decode. It had no baseline. Probe 2 interleaves two arms on
// one runner, the same bundle: REDESIGN (no query; the ship default) and TODAY (?arbor2=0, today's Arbor). Per fast burst's first 3 keys, a trace
// with invalidation tracking; per key slice (keydown i -> keydown i+1, the last to the window's end) on the renderer main thread: recalcStyle self
// ms, UpdateLayoutTree elements restyled, script ms, and the top style-invalidation causes (event + attribute/class/reason). Keys' ms are traced
// (invalidation tracking slows them): read them only against the other arm. Prints KB2 lines.
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.K104_ROUNDS || 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking', 'blink', 'v8', 'toplevel'];
const ARMS = [['redesign', '/', false], ['nolayers', '/', true], ['today', '/?arbor2=0', false]];
// NOPAUSE: the redesign with ONE rule deleted from the CSSOM in the page (arbor-v2.css:956, the leaves' animation-play-state:paused under
// [data-wz-writing='true']) - a measurement arm only, no product change. It must delete exactly one rule, or the arm reports it.
// (r2: probe 3 r1, Actions 44345310200, deleted 0 in all 9 - the walker recursed into every style rule, since CSSStyleRule has cssRules under CSS
// nesting, and never read its selector; the arm was VOID. Now the selector is read first.)
const DELPAUSE = "(() => { const st = document.createElement('style'); st.id = 'probe-nolayers'; st.textContent = '.arbor2-pergola, .arbor2-pagesh { display:none !important; }'; document.head.appendChild(st); return document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh').length; })()";
const COUNTS = "(() => { const c = (sel) => { const e = document.querySelectorAll(sel); let n = 0; e.forEach((x) => { n += 1 + x.querySelectorAll('*').length; }); return n; }; return { doc: document.querySelectorAll('*').length, pergola: c('.arbor2-pergola'), pagesh: c('.arbor2-pagesh'), live: c('.arbor2-live'), still: c('.arbor2-still'), leaves: document.querySelectorAll('.wz-leaf').length, rhizome: c('.wz-rhizome-field'), layers: document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh').length }; })()";
const METER = `(() => { if (window.__kbOff) window.__kbOff(); window.__kb = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kb.push(performance.now() - t))); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kbOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
const cause = (e) => { const d = (e.args && (e.args.data || e.args)) || {}; const what = d.changedAttribute || (d.changedClass && 'class:' + d.changedClass) || d.changedPseudo || d.changedId || d.reason || d.invalidationSet && 'set' || '';
  const node = d.nodeName || (d.selectors && d.selectors.map((s) => s.selector).join(',').slice(0, 60)) || ''; return `${e.name.replace('InvalidationTracking', '')} ${what} ${node}`.trim().slice(0, 140); };

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await js("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
  const id = `arbor-104f-${Math.random().toString(36).slice(2, 7)}`;
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
  const restTrace = async (ms) => {
    const ev = []; const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) ev.push(...p.value); });
    await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
    await sleep(ms); const done = app.waitEvent('Tracing.tracingComplete', 60000); await app.cdp('Tracing.end'); await done; await sleep(150); off();
    const names = new Map(); for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name' && e.args) names.set(`${e.pid}:${e.tid}`, e.args.name);
    const ult = ev.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X');
    const byT = {}; for (const e of ult) { const k = `${e.pid}:${e.tid}`; byT[k] = (byT[k] || 0) + 1; }
    const main = Object.entries(byT).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0];
    const mine = ult.filter((e) => `${e.pid}:${e.tid}` === main);
    const els = mine.map((e) => (e.args && (e.args.elementCount || (e.args.endData && e.args.endData.elementCount))) || 0);
    const recalc = ev.filter((e) => `${e.pid}:${e.tid}` === main && e.ph === 'X' && (e.name === 'Document::recalcStyle')).reduce((a, e) => a + e.dur / 1000, 0);
    const frames = ev.filter((e) => `${e.pid}:${e.tid}` === main && e.name === 'BeginMainThreadFrame').length;
    return { ms, frames, restyles: mine.length, recalcMs: r1(recalc), recalcPerRestyle: mine.length ? r1(recalc / mine.length) : null, elementsPerRestyle: els.length ? Math.round(els.reduce((a, b) => a + b, 0) / els.length) : null };
  };
  const typeAt = async (n, gap, jitter) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(jitter ? Math.round(gap * (0.7 + 0.6 * Math.random())) : gap); } };
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const [arm, path, del] of [...ARMS.slice((round - 1) % 3), ...ARMS.slice(0, (round - 1) % 3)]) {
      await reopen(path);
      const deleted = del ? await js(DELPAUSE) : null; if (del) await sleep(300); const counts = await js(COUNTS); const rest = await restTrace(400);
      const arbor = await js("document.documentElement.getAttribute('data-arbor2')");
      await js(METER);
      const events = []; const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) events.push(...p.value); });
      await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
      await typeAt(3, 25, false); await sleep(300);
      const done = app.waitEvent('Tracing.tracingComplete', 60000); await app.cdp('Tracing.end'); await done; await sleep(200); off();
      const keys = await js('window.__kb.map((x) => Math.round(x * 10) / 10)');
      await typeAt(19, 25, false); await sleep(250);
      const names = new Map(); for (const e of events) if (e.ph === 'M' && e.name === 'thread_name' && e.args) names.set(`${e.pid}:${e.tid}`, e.args.name);
      const kds = events.filter((e) => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'keydown');
      const main = kds.length ? `${kds[0].pid}:${kds[0].tid}` : null;
      const kts = kds.map((e) => e.ts).sort((a, b) => a - b);
      const xs = events.filter((e) => main && `${e.pid}:${e.tid}` === main && e.ph === 'X' && typeof e.dur === 'number').sort((a, b) => a.ts - b.ts || b.dur - a.dur);
      const stack = []; for (const e of xs) { while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop(); e.__c = 0; if (stack.length) stack[stack.length - 1].__c += e.dur; stack.push(e); }
      const slot = (ts) => { let i = -1; for (let k = 0; k < kts.length; k += 1) if (ts >= kts[k]) i = k; return i; };
      const per = kts.map(() => ({ recalc: 0, script: 0, layout: 0, paint: 0, elements: 0, causes: {} }));
      for (const e of xs) {
        const i = slot(e.ts); if (i < 0) continue; const P = per[i]; const self = Math.max(0, e.dur - e.__c) / 1000;
        if (e.name === 'Document::recalcStyle' || e.name === 'UpdateLayoutTree' || e.name === 'StyleRecalc') P.recalc += self;
        if (/FunctionCall|EvaluateScript|v8\.callFunction|RunMicrotasks/.test(e.name)) P.script += self;
        if (/performLayout|^Layout$/.test(e.name)) P.layout += self;
        if (/RunPaintLifecyclePhase|^Paint$|PaintArtifactCompositor/.test(e.name)) P.paint += self;
        if (e.name === 'UpdateLayoutTree' && e.args) P.elements += (e.args.elementCount || (e.args.endData && e.args.endData.elementCount) || 0);
      }
      for (const e of events) { if (!/InvalidationTracking$/.test(e.name) || !main || `${e.pid}:${e.tid}` !== main) continue; const i = slot(e.ts); if (i < 0) continue; const c = cause(e); per[i].causes[c] = (per[i].causes[c] || 0) + 1; }
      const out = per.map((P, i) => ({ key: i + 1, recalcMs: r1(P.recalc), scriptMs: r1(P.script), layoutMs: r1(P.layout), paintMs: r1(P.paint), elements: P.elements,
        causes: Object.entries(P.causes).sort((a, b) => b[1] - a[1]).slice(0, 10) }));
      console.log('KB5 ' + J({ round, arm, arbor, deleted, counts, rest, keys, mainFound: !!main, slices: out }));
    }
  }
  return [{ name: 'probe ran', pass: true }];
}, { label: 'arbor-104-probe5' });
console.log('\nARBOR-104-PROBE5 VERIFY: PASS (1 checks)');
process.exit(0);

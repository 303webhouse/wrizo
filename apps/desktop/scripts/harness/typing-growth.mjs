// TYPING GROWTH (bug #85, #110, #101; Fable, Nov 22, 3:05 am: "each key costs more as the page grows: 20 ms at 20k words, 52 at 50k"; "Space and Enter on long Free Write pages"). A MEASUREMENT with bars, read by what a clock cannot fake: the cost of a key RELATIVE to the same key on a short page, on the same machine in the same run.
// Real CDP keys, one at a time, on a page of 500, 5,000, 20,000 and 50,000 words, in Draft and in Free Write, caret in the middle of the page (the worst case for offset walks), 30 keys of each kind:
//   BUSY   keydown -> the end of the task that handled it (a message posted from the keydown runs when that task and React's flush are done): the main-thread cost of the key, which the frame clock hides when it is under a frame
//   PAINT  keydown -> the second frame after it (what the writer sees)
// The three kinds: a LETTER, a SPACE (commits the word and rebuilds the committed runs) and ENTER (a new line).
//   KG-LETTER  letters cost no more on a 50,000-word page than on a 500-word one + 8 ms (median BUSY), in Draft and in Free Write
//   KG-SPACE   the same for Space
//   KG-ENTER   the same for Enter
//   KG-LAYOUTS a letter and a Space force no more than LAYOUT_MAX layouts at 50,000 words (a Chrome trace of 12 keys of each), in Draft and in Free Write: the COUNT, which a few ms of timing noise cannot hide (Free Write forced 28 a key before the fade's wait stopped measuring)
// The slack is absolute (8 ms) because the short page's own cost is a few ms and a ratio of a few ms is noise; a page-length cost shows as tens of ms (Fable's numbers: 20 at 20k, 52 at 50k). It prints every number so a read is never a guess.
// Run: node scripts/harness/typing-growth.mjs   (Actions harness, advisory; a box turn for the speed numbers)
const { withHarness } = await import('../runtime-verify.mjs');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const SIZES = [500, 5000, 20000, 50000];
const MODES = [['draft', 'Draft'], ['freewrite', 'Free Write']];
const KEYS = 30, SLACK_MS = 8, LAYOUT_MAX = 6;
const layoutRows = [];
const PARA = 'The writer keeps a steady pace through the long draft, and nothing slows the page down at all. ';
const page = (words) => { const per = PARA.trim().split(/\s+/).length; const n = Math.ceil(words / per); return Array.from({ length: n }, () => PARA.trim()).join('\n'); };
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.floor(s.length / 2)] * 10) / 10 : null; };
const p95 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(0.95 * s.length))] * 10) / 10 : null; };

const HOOK = `(() => {
  if (window.__kgOn) { window.__kg = { busy: [], paint: [] }; return true; }
  window.__kgOn = true; window.__kg = { busy: [], paint: [] };
  const mc = new MessageChannel();
  let t0 = null;
  mc.port1.onmessage = () => { if (t0 === null) return; window.__kg.busy.push(performance.now() - t0); };
  window.addEventListener('keydown', (e) => { if (e.key.length > 1 && e.key !== 'Enter') return; t0 = performance.now(); const start = t0; mc.port2.postMessage(0); requestAnimationFrame(() => requestAnimationFrame(() => { window.__kg.paint.push(performance.now() - start); })); }, true);
  return true; })()`;
// the CPU profile of a run of keys: self time by function (information; names the work, never a verdict)
const PROFILE_TOP = 14;
// for each of the heaviest self-time frames (app code or the native ones that force work: removeAllRanges, getClientRects, offsetWidth), the CALL CHAINS that reach it, up to 5 frames up, with the time each chain owns
const callersOf = (p, top = 8) => {
  const byId = new Map(p.nodes.map((n) => [n.id, n])); const parent = new Map();
  for (const n of p.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const self = new Map(); for (let i = 0; i < p.samples.length; i += 1) self.set(p.samples[i], (self.get(p.samples[i]) || 0) + (p.timeDeltas[i] || 0));
  const lab = (cf) => (cf.functionName || '(anon)') + (cf.url ? ':' + (cf.lineNumber + 1) + ':' + cf.columnNumber : '');
  const byFn = new Map(); const chains = new Map();
  for (const [id, us] of self) {
    const cf = byId.get(id).callFrame; if (/^\((idle|program|root|garbage collector)\)$/.test(cf.functionName)) continue;
    const fn = lab(cf); byFn.set(fn, (byFn.get(fn) || 0) + us);
    const up = []; let cur = parent.get(id); while (cur != null && up.length < 5) { const c = byId.get(cur).callFrame; if (!/^\((root|program)\)$/.test(c.functionName)) up.push(lab(c)); cur = parent.get(cur); }
    const k = fn + ' <- ' + up.join(' <- '); chains.set(k, (chains.get(k) || 0) + us);
  }
  const heavy = [...byFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([fn]) => fn);
  return heavy.map((fn) => ({ fn, ms: Math.round(byFn.get(fn) / 100) / 10, chains: [...chains.entries()].filter(([k]) => k.startsWith(fn + ' <- ')).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, us]) => Math.round(us / 100) / 10 + ' ms: ' + k.slice(fn.length + 4)) }));
};
const selfTop = (p) => { const byId = new Map(p.nodes.map((n) => [n.id, n])); const self = new Map(); for (let i = 0; i < p.samples.length; i += 1) self.set(p.samples[i], (self.get(p.samples[i]) || 0) + (p.timeDeltas[i] || 0)); const agg = new Map(); for (const [id, us] of self) { const cf = byId.get(id).callFrame; const key = (cf.functionName || '(anonymous)') + ' @ ' + String(cf.url || '').split('/').pop() + ':' + cf.lineNumber; agg.set(key, (agg.get(key) || 0) + us); } const total = [...agg.values()].reduce((a, b) => a + b, 0) || 1; return [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, PROFILE_TOP).map(([k, us]) => `${Math.round(us / 100) / 10} ms (${Math.round((100 * us) / total)}%) ${k}`); };

await withHarness(async (app) => {
  const rows = [];
  for (const words of SIZES) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival') && typeof window.wrizoCreateJournalPage === 'function'", { label: 'Desk and seams', timeout: 30000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'kg-1', text: page(words), createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' })}); window.wrizoFlushNow(); null`);
    await sleep(800);
    for (const [mode, label] of MODES) {
      await app.reload();
      await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the seams again', timeout: 30000 });
      await app.evalJs("location.hash = '#/page/kg-1'");
      await app.waitFor(`!!document.querySelector('${ED}')`, { label: `page (${words})`, timeout: 40000 });
      await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 30000 });
      await sleep(1500);
      await app.click(label); await sleep(2500);
      await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0; const target = Math.floor(ed.textContent.length / 2);
        while ((n = w.nextNode())) { if (acc + n.data.length >= target) { const r = document.createRange(); r.setStart(n, Math.max(0, target - acc)); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); break; } acc += n.data.length; } return true; })()`);
      await sleep(600);
      for (const [kind, send] of [['letter', async () => app.typeKeys('a')], ['space', async () => app.typeKeys(' ')], ['enter', async () => app.key('Enter')]]) {
        await app.evalJs(HOOK);
        for (let i = 0; i < KEYS; i += 1) { await send(); await sleep(110); }
        await sleep(500);
        const m = await app.evalJs('window.__kg');
        const row = { words, mode, kind, n: m.busy.length, busy_med: med(m.busy), busy_p95: p95(m.busy), paint_med: med(m.paint), paint_p95: p95(m.paint) };
        rows.push(row);
        console.log('TG ' + JSON.stringify(row));
        if (words === 50000 && kind !== 'enter') {
          await app.cdp('Debugger.enable'); await app.cdp('Profiler.enable'); await app.cdp('Profiler.setSamplingInterval', { interval: 200 }); await app.cdp('Profiler.start');
          for (let i = 0; i < 40; i += 1) { await send(); await sleep(110); }
          const prof = await app.cdp('Profiler.stop');
          console.log(`TG-PROFILE ${mode} ${kind} 50000 words: ` + JSON.stringify(selfTop(prof.profile)));
          console.log(`TG-CALLERS ${mode} ${kind} 50000 words: ` + JSON.stringify(callersOf(prof.profile)));
          // THE LAYOUTS: a Chrome trace of 12 keys of this kind: every Layout span with its duration and the JS stack that forced it (the bundle is minified: the frame is named by its position, and the code at it printed)
          if (mode === 'freewrite' || kind === 'letter') {
            try {
              await app.cdp('Tracing.start', { traceConfig: { includedCategories: ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack'], recordMode: 'recordContinuously' }, transferMode: 'ReturnAsStream' });
              await sleep(300);
              for (let i = 0; i < 12; i += 1) { await send(); await sleep(150); }
              await sleep(500);
              const done = app.waitEvent('Tracing.tracingComplete', 30000);
              await app.cdp('Tracing.end');
              const ev = await done;
              let s = '';
              for (;;) { const r = await app.cdp('IO.read', { handle: ev.stream, size: 4 << 20 }); s += r.base64Encoded ? Buffer.from(r.data, 'base64').toString('utf8') : r.data; if (r.eof) break; }
              await app.cdp('IO.close', { handle: ev.stream });
              const j = JSON.parse(s); const evs = (Array.isArray(j) ? j : (j.traceEvents || [])).sort((a, b) => a.ts - b.ts);
              const spans = []; const open = {};
              for (const e of evs) { if (e.ph === 'X') spans.push({ name: e.name, ts: e.ts, dur: e.dur || 0, args: e.args || {} }); else if (e.ph === 'B') (open[e.name] ||= []).push(e); else if (e.ph === 'E') { const b = (open[e.name] || []).pop(); if (b) spans.push({ name: e.name, ts: b.ts, dur: e.ts - b.ts, args: { ...(b.args || {}), ...(e.args || {}) } }); } }
              const lay = spans.filter((x) => x.name === 'Layout');
              const keys = spans.filter((x) => x.name === 'EventDispatch' && x.args.data && x.args.data.type === 'keydown').length || 1;
              const byFrame = new Map();
              for (const l of lay) { const st = (l.args.beginData && l.args.beginData.stackTrace) || []; const top = st[0]; const k = top ? (top.functionName || '?') + ' ' + String(top.url || '').split('/').pop() + ':' + top.lineNumber + ':' + top.columnNumber : '(no stack: the frame\'s own layout)'; const cur = byFrame.get(k) || { n: 0, ms: 0, top }; cur.n += 1; cur.ms += l.dur / 1000; byFrame.set(k, cur); }
              const rows = [...byFrame.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 6).map(([k, v]) => ({ k, perKey: Math.round((v.n / keys) * 10) / 10, msPerKey: Math.round((v.ms / keys) * 10) / 10 }));
              layoutRows.push({ mode, kind, keys, perKey: Math.round((lay.length / keys) * 10) / 10 });
              console.log(`TG-LAYOUTS ${mode} ${kind} 50000 words (${keys} keys): ` + JSON.stringify({ layoutsPerKey: Math.round((lay.length / keys) * 10) / 10, msPerKey: Math.round((lay.reduce((a, l) => a + l.dur, 0) / 1000 / keys) * 10) / 10, rows }));
              const code = [];
              for (const r of rows.slice(0, 4)) { if (!byFrame.get(r.k).top) continue; const top = byFrame.get(r.k).top; try { const src = await app.cdp('Debugger.getScriptSource', { scriptId: top.scriptId }); const lines = String(src.scriptSource || '').split(String.fromCharCode(10)); code.push({ at: top.lineNumber + ':' + top.columnNumber, src: (lines[top.lineNumber] || '').slice(Math.max(0, top.columnNumber - 160), top.columnNumber + 200) }); } catch { /* the position alone */ } }
              console.log(`TG-LAYOUT-CODE ${mode} ${kind}: ` + JSON.stringify(code));
            } catch (e) { console.log('TG-LAYOUTS failed: ' + String(e && e.message).slice(0, 200)); }
          }
          // the SOURCE at the top self-time JS frames (the bundle is minified: name the code by its text), once per mode
          if (kind === 'letter') {
            try {
              await app.cdp('Debugger.enable');
              const byId = new Map(prof.profile.nodes.map((n) => [n.id, n])); const self = new Map();
              for (let i = 0; i < prof.profile.samples.length; i += 1) self.set(prof.profile.samples[i], (self.get(prof.profile.samples[i]) || 0) + (prof.profile.timeDeltas[i] || 0));
              const frames = new Map(); for (const [id, us] of self) { const cf = byId.get(id).callFrame; if (!cf.url || !/index-/.test(cf.url)) continue; const k = cf.scriptId + ':' + cf.lineNumber + ':' + cf.columnNumber; frames.set(k, { cf, us: (frames.get(k) ? frames.get(k).us : 0) + us }); }
              const top = [...frames.values()].sort((a, b) => b.us - a.us).slice(0, 4);
              const out = [];
              for (const { cf, us } of top) { const src = await app.cdp('Debugger.getScriptSource', { scriptId: cf.scriptId }); const lines = String(src.scriptSource || '').split(String.fromCharCode(10)); const line = lines[cf.lineNumber] || ''; out.push({ fn: cf.functionName, ms: Math.round(us / 100) / 10, at: cf.lineNumber + ':' + cf.columnNumber, src: line.slice(Math.max(0, cf.columnNumber - 20), cf.columnNumber + 700) }); }
              console.log(`TG-SOURCE ${mode} ${kind}: ` + JSON.stringify(out));
            } catch (e) { console.log('TG-SOURCE failed: ' + String(e && e.message).slice(0, 160)); }
          }
        }
      }
    }
  }
  console.log('\nTYPING GROWTH (ms; BUSY = main-thread cost of the key, PAINT = keydown to the second frame):');
  for (const r of rows) console.log(`  ${String(r.words).padStart(6)} words  ${r.mode.padEnd(9)} ${r.kind.padEnd(6)}  busy ${r.busy_med} / p95 ${r.busy_p95};  paint ${r.paint_med} / p95 ${r.paint_p95}  (n ${r.n})`);
  for (const kind of ['letter', 'space', 'enter']) {
    const bad = [];
    for (const [mode] of MODES) {
      const small = rows.find((r) => r.words === 500 && r.mode === mode && r.kind === kind);
      const big = rows.find((r) => r.words === 50000 && r.mode === mode && r.kind === kind);
      if (!small || !big || small.busy_med == null || big.busy_med == null) { bad.push({ mode, why: 'no data' }); continue; }
      if (big.busy_med > small.busy_med + SLACK_MS) bad.push({ mode, small: small.busy_med, big: big.busy_med });
    }
    ok(`KG-${kind.toUpperCase()} a ${kind} costs no more (median BUSY) on a 50,000-word page than on a 500-word one + ${SLACK_MS} ms, in Draft and in Free Write`, bad.length === 0, JSON.stringify(bad));
  }
  {
    // the traced kinds: Free Write letter and space, Draft letter (the trace runs for these); a kind that was not traced is a failure, not a pass
    const want = [['freewrite', 'letter'], ['freewrite', 'space'], ['draft', 'letter']];
    const bad = [];
    for (const [mode, kind] of want) { const r = layoutRows.find((x) => x.mode === mode && x.kind === kind); if (!r) bad.push({ mode, kind, why: 'not traced' }); else if (r.perKey > LAYOUT_MAX) bad.push({ mode, kind, perKey: r.perKey }); }
    ok(`KG-LAYOUTS a key forces no more than ${LAYOUT_MAX} layouts on a 50,000-word page (Free Write letter and space, Draft letter)`, bad.length === 0, JSON.stringify({ bad, measured: layoutRows }));
  }
}, { label: 'typing-growth' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 800)}`);
const EXPECTED = 4;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nTYPING-GROWTH VERIFY: PASS (${checks.length} checks)`
  : `\nTYPING-GROWTH VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

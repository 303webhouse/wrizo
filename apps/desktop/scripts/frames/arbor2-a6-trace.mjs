// ARBOR v2 MOCKUP - THE A6 TRACE (Fable's ruling A6 on the Nick walk, Nov 8: "a ship blocker: trace a 400-key day burst and find the ~5.5 s
// periodic task"). The walk found, by day only, ~1 key in 40 dropping one frame (51-81 ms) about every 5.5 s over a 400-key burst; by night none.
//
// What this does (a box turn; withHarness refuses without the grant): on the locally served build, under the flag, a page in the DAY room (and
// then the same in the NIGHT room, the control), 400 steady keys at ~9 a second with a DevTools performance trace running. The in-page meter
// (keydown -> the 2nd frame after the key's input, as rhizome-latency reads it) marks the slow keys; the trace says what ran on the main thread
// in each slow key's window. Out: a6-summary.json (per room: the slow keys, the long tasks over 30 ms with their top contributors - timers by
// id and the function that fired, script by URL:function, style/layout/paint/composite - and the periods between them) and the raw traces.
// Nothing here is a verdict: it is the attribution Fable asked for. The guard's A+L (rhizome-latency.mjs) is the check.
//
// Run: WS_BOX_TURN=<token> A6_OUT=<dir> WS_URL_SEARCH='?arbor2=1' node scripts/frames/arbor2-a6-trace.mjs     (from apps/desktop; the build in dist-web)
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const OUT = path.resolve(process.env.A6_OUT || 'a6-trace');
const KEYS = Number(process.env.A6_KEYS || 400);
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'disabled-by-default-devtools.timeline.stack', 'blink.user_timing', 'toplevel'];   // .stack: where each timer was installed
const PAGEW = 'The morning light came in low across the table, and she began to write.';
const summary = { keys: KEYS, rooms: {} };

await withHarness(async (app) => {
  const cdp = (m, p = {}) => app.cdp(m, p);
  const js = (e) => app.evalJs(e);
  await app.emulateDpr(1, 2000, 970);
  // a page through the seam (never raw storage), in Draft, the room pinned by the Room row's own attribute
  await app.goto('/');
  await js("localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  for (const room of ['day', 'night']) {
    const id = `arbor-a6-${room}`;
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
    await js(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    await js(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 20000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
    await sleep(800);
    await js("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
    await js(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')}); true`); await sleep(2500);
    const state = await js("({ flag: document.documentElement.getAttribute('data-arbor2'), room: document.documentElement.getAttribute('data-arbor2-room'), leaves: document.querySelectorAll('.arbor2-pergola .wz-leaf').length })");
    // the meter, as rhizome-latency's (keydown -> the 2nd frame after the key's input)
    await js(`(() => { window.__a6 = []; let t0 = 0, n = 0; const kd = () => { t0 = performance.now(); };
      const bi = () => { const t = t0, i = ++n; requestAnimationFrame(() => requestAnimationFrame(() => { window.__a6.push({ i, ms: Math.round((performance.now() - t) * 10) / 10, at: t }); })); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true); window.__a6off = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`);
    await js("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    // the trace: events gathered from Tracing.dataCollected until Tracing.tracingComplete
    const events = [];
    const off = app.tap((method, p) => { if (method === 'Tracing.dataCollected' && p && p.value) events.push(...p.value); });
    await cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
    const tStart = await js('performance.now()');
    const t0 = Date.now();
    for (let i = 0; i < KEYS; i++) {
      await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', text: 'a', unmodifiedText: 'a' }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a' });
      const due = t0 + (i + 1) * 110; const w = due - Date.now(); if (w > 0) await sleep(w);
    }
    await sleep(600);
    const done = app.waitEvent('Tracing.tracingComplete', 60000);
    await cdp('Tracing.end'); await done; await sleep(300); off();
    const lat = await js('window.__a6'); await js('window.__a6off && window.__a6off(); true');
    writeFileSync(path.join(OUT, `a6-trace-${room}.json`), JSON.stringify({ traceEvents: events }));
    // the renderer's main thread: the thread named CrRendererMain in the process that ran the most EventDispatch
    const names = events.filter((e) => e.ph === 'M' && e.name === 'thread_name');
    const mains = names.filter((e) => e.args && e.args.name === 'CrRendererMain').map((e) => `${e.pid}:${e.tid}`);
    const busy = {}; for (const e of events) if (e.name === 'EventDispatch') { const k = `${e.pid}:${e.tid}`; busy[k] = (busy[k] || 0) + 1; }
    const main = mains.sort((a, b) => (busy[b] || 0) - (busy[a] || 0))[0];
    const onMain = events.filter((e) => `${e.pid}:${e.tid}` === main && e.ph === 'X' && typeof e.dur === 'number');
    const tasks = onMain.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask').filter((e) => e.dur >= 30000).sort((a, b) => a.ts - b.ts);
    const kidsOf = (t) => onMain.filter((e) => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.dur >= 1000);
    const label = (e) => {
      const d = (e.args && e.args.data) || {};
      if (e.name === 'TimerFire') return `TimerFire#${d.timerId}`;
      if (e.name === 'FunctionCall') return `FunctionCall ${(d.url || '').split('/').pop()}:${d.functionName || '?'}:${d.lineNumber ?? '?'}`;
      if (e.name === 'EventDispatch') return `EventDispatch ${d.type || ''}`;
      if (e.name === 'FireAnimationFrame') return `FireAnimationFrame#${d.id}`;
      return e.name;
    };
    const longs = tasks.map((t) => {
      const kids = kidsOf(t); const by = {};
      for (const k of kids) { const l = label(k); by[l] = (by[l] || 0) + k.dur; }
      const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, us]) => `${l} ${Math.round(us / 100) / 10} ms`);
      return { at: Math.round(t.ts / 1000), ms: Math.round(t.dur / 100) / 10, top };
    });
    // the timers that fired in the long tasks, and how often each timer id fired over the whole burst (a periodic task shows as one id, regularly)
    const fires = onMain.filter((e) => e.name === 'TimerFire');
    const perTimer = {}; for (const f of fires) { const id = f.args && f.args.data && f.args.data.timerId; (perTimer[id] = perTimer[id] || []).push(Math.round(f.ts / 1000)); }
    const longTimerIds = [...new Set(tasks.flatMap((t) => kidsOf(t).filter((k) => k.name === 'TimerFire').map((k) => k.args.data.timerId)))];
    const timers = longTimerIds.map((id) => { const ts = perTimer[id] || []; const gaps = ts.slice(1).map((x, i) => x - ts[i]); return { id, fires: ts.length, medianGapMs: gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : null }; });
    const installs = events.filter((e) => e.name === 'TimerInstall' && longTimerIds.includes(e.args && e.args.data && e.args.data.timerId)).map((e) => ({ id: e.args.data.timerId, timeout: e.args.data.timeout, singleShot: e.args.data.singleShot, stack: (e.args.data.stackTrace || []).slice(0, 3).map((f) => `${(f.url || '').split('/').pop()}:${f.functionName}:${f.lineNumber}`) }));
    const slow = (lat || []).filter((x) => x.i > 1 && x.ms > 45);
    const slowGaps = slow.slice(1).map((x, i) => Math.round(x.at - slow[i].at));
    summary.rooms[room] = { state, keys: (lat || []).length, slow: slow.map((x) => ({ key: x.i, ms: x.ms, atMs: Math.round(x.at - tStart) })), slowGapsMs: slowGaps, longTasks: longs.length, longs, timers, installs, traceEvents: events.length, mainThread: main };
    console.log(`A6 ${room}: ${(lat || []).length} keys, ${slow.length} slow (>45 ms), ${longs.length} long tasks (>=30 ms); timers in long tasks: ${JSON.stringify(timers)}`);
    for (const l of longs.slice(0, 12)) console.log(`  long ${l.ms} ms: ${l.top.join(' | ')}`);
  }
}, { verifyRows: false });

writeFileSync(path.join(OUT, 'a6-summary.json'), JSON.stringify(summary, null, 1));
const d = summary.rooms.day, n = summary.rooms.night;
console.log(`\nA6-TRACE: day ${d ? d.slow.length : '?'} slow keys / ${d ? d.longTasks : '?'} long tasks; night ${n ? n.slow.length : '?'} / ${n ? n.longTasks : '?'}  (summary: ${path.join(OUT, 'a6-summary.json')})`);

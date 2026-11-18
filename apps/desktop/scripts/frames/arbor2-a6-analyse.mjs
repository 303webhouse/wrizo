// ARBOR v2 MOCKUP - THE A6 TRACE ON THE PLAY SERVER (Nov 8). A6 (Fable: a ship blocker): by day ~10 of 407 keys drop one frame, about every
// 5.5 s, often in pairs ~1 s apart - on the play server only. The trace on the locally served build (arbor2-a6-trace.mjs, turn 3) saw none: its
// one long task was the first key (the swap). So this rides INSIDE the walk's own burst (arbor2-walk.mjs, step 4, the un-recorded keylog bursts,
// WALK_A6_TRACE=1): the same signed-in sample account, the same page, the same room, the same pace - the conditions A6 showed in.
//
// Two witnesses, side by side, attribution only (never a verdict):
//  1. a DevTools performance trace (with invalidation tracking: which class / attribute / id change invalidated style, on which node, and how
//     many elements each style recalc touched);
//  2. an in-page MutationObserver on the whole document (attributes with their old and new values, and the child lists OUTSIDE the editor),
//     stamped in the page's clock - so each slow key has the state changes around it, and a periodic toggler shows as one group, regularly.
// The two clocks are joined by a performance.mark made just after the trace starts.
import { writeFileSync } from 'node:fs';
import path from 'node:path';

export const A6_CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-devtools.timeline.invalidationTracking', 'blink.user_timing', 'toplevel'];

const OBSERVE = `(() => { window.__a6m = []; if (window.__a6moff) window.__a6moff();
  const cut = (v) => v === null || v === undefined ? null : String(v).slice(0, 160);
  const d = (n) => { if (!n || n.nodeType !== 1) return String(n && n.nodeName); const c = typeof n.className === 'string' ? n.className : (n.getAttribute('class') || ''); return n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (c.trim() ? '.' + c.trim().split(/\\s+/).slice(0, 3).join('.') : ''); };
  const size = (n) => (n && n.getElementsByTagName ? n.getElementsByTagName('*').length : 0);
  const mo = new MutationObserver((ms) => { const t = Math.round(performance.now() * 10) / 10;
    for (const m of ms) { if (window.__a6m.length >= 30000) break;
      if (m.type === 'attributes') window.__a6m.push([t, 'attr', d(m.target), m.attributeName, cut(m.oldValue), cut(m.target.getAttribute(m.attributeName)), size(m.target)]);
      else if (m.type === 'childList' && !(m.target.closest && m.target.closest('.forward-only-editor'))) window.__a6m.push([t, 'child', d(m.target), m.addedNodes.length, m.removedNodes.length, null, size(m.target)]); } });
  mo.observe(document.documentElement, { attributes: true, attributeOldValue: true, childList: true, subtree: true });
  window.__a6moff = () => mo.disconnect(); return true; })()`;

export async function a6Start(app) {
  const events = [];
  const off = app.tap((method, p) => { if (method === 'Tracing.dataCollected' && p && p.value) events.push(...p.value); });
  await app.cdp('Tracing.start', { traceConfig: { includedCategories: A6_CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
  await app.evalJs(OBSERVE);
  const syncPerf = await app.evalJs("(() => { const m = performance.mark('a6-sync'); return m && typeof m.startTime === 'number' ? m.startTime : performance.now(); })()");
  return { events, off, syncPerf };
}

const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

// the analysis, pure (the browserless proof feeds it synthetic events)
export function a6Analyse({ events, syncPerf, lat, muts }) {
  const names = events.filter((e) => e.ph === 'M' && e.name === 'thread_name');
  const mains = names.filter((e) => e.args && e.args.name === 'CrRendererMain').map((e) => `${e.pid}:${e.tid}`);
  const busy = {}; for (const e of events) if (e.name === 'EventDispatch') { const k = `${e.pid}:${e.tid}`; busy[k] = (busy[k] || 0) + 1; }
  const main = mains.sort((a, b) => (busy[b] || 0) - (busy[a] || 0))[0] || null;
  const onMainAll = events.filter((e) => `${e.pid}:${e.tid}` === main);
  const onMain = onMainAll.filter((e) => e.ph === 'X' && typeof e.dur === 'number');
  // the clocks: the trace's (us) and the page's performance.now() (ms), joined by the a6-sync mark
  const mark = events.find((e) => e.name === 'a6-sync');
  const offsetMs = mark && typeof syncPerf === 'number' ? mark.ts / 1000 - syncPerf : null;
  const toPerf = (us) => (offsetMs === null ? null : Math.round((us / 1000 - offsetMs) * 10) / 10);
  const label = (e) => {
    const d = (e.args && e.args.data) || {};
    if (e.name === 'TimerFire') return `TimerFire#${d.timerId}`;
    if (e.name === 'FunctionCall') return `FunctionCall ${(d.url || '').split('/').pop()}:${d.functionName || '?'}:${d.lineNumber ?? '?'}`;
    if (e.name === 'EventDispatch') return `EventDispatch ${d.type || ''}`;
    if (e.name === 'FireAnimationFrame') return `FireAnimationFrame#${d.id}`;
    return e.name;
  };
  const elementCount = (e) => { const a = e.args || {}; const v = a.elementCount ?? (a.data && a.data.elementCount) ?? (a.endData && a.endData.elementCount); return typeof v === 'number' ? v : null; };
  const invs = onMainAll.filter((e) => /InvalidationTracking/.test(e.name));
  const invLabel = (e) => { const d = (e.args && e.args.data) || {}; const what = d.changedAttribute ? `attr ${d.changedAttribute}` : d.changedClass ? `class ${d.changedClass}` : d.changedId ? `id ${d.changedId}` : d.changedPseudo ? `pseudo ${d.changedPseudo}` : d.reason || d.invalidationSet || ''; return `${e.name.replace('InvalidationTracking', '')} ${what} on ${d.nodeName || '?'}${d.selectors ? ' [' + JSON.stringify(d.selectors).slice(0, 120) + ']' : ''}`; };
  const tasks = onMain.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask').filter((e) => e.dur >= 30000).sort((a, b) => a.ts - b.ts);
  const longs = tasks.map((t) => {
    const kids = onMain.filter((e) => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.dur >= 1000);
    const by = {}; for (const k of kids) { const l = label(k); by[l] = (by[l] || 0) + k.dur; }
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, us]) => `${l} ${Math.round(us / 100) / 10} ms`);
    const recalcs = onMain.filter((e) => e.name === 'UpdateLayoutTree' && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur).map((e) => ({ ms: Math.round(e.dur / 100) / 10, elements: elementCount(e) }));
    const inv = {}; for (const e of invs) if (e.ts >= t.ts - 200000 && e.ts <= t.ts + t.dur) { const l = invLabel(e); inv[l] = (inv[l] || 0) + 1; }
    return { perfAt: toPerf(t.ts), ms: Math.round(t.dur / 100) / 10, top, recalcs, invalidations: Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([l, n]) => `${n}x ${l}`) };
  });
  // the mutations: grouped (kind | node | attribute), each group's count and median gap over the burst
  const M = (muts || []).map(([t, kind, node, a, oldV, newV, size]) => ({ t, kind, node, a, oldV, newV, size }));
  const gkey = (m) => `${m.kind} ${m.node} ${m.kind === 'attr' ? m.a : ''}`.trim();
  const groups = {}; for (const m of M) { const k = gkey(m); (groups[k] = groups[k] || { n: 0, ts: [], size: m.size, sample: [] }).n++; groups[k].ts.push(m.t); if (groups[k].sample.length < 4) groups[k].sample.push(m.kind === 'attr' ? `${m.oldV} -> ${m.newV}` : `+${m.a} -${m.oldV}`); }
  const slow = (lat || []).filter((x) => x.i > 1 && x.ms > 45);
  const near = (t) => slow.some((s) => t >= s.at - 150 && t <= s.at + s.ms + 50);
  const groupRows = Object.entries(groups).map(([k, g]) => { const gaps = g.ts.slice(1).map((x, i) => x - g.ts[i]); const hits = g.ts.filter(near).length; return { group: k, n: g.n, medianGapMs: median(gaps), subtree: g.size, nearSlowKeys: hits, sample: g.sample }; });
  const bySlow = slow.map((s) => {
    const around = M.filter((m) => m.t >= s.at - 150 && m.t <= s.at + s.ms + 50);
    const agg = {}; for (const m of around) { const k = gkey(m); agg[k] = (agg[k] || 0) + 1; }
    const tasksIn = longs.filter((l) => l.perfAt !== null && l.perfAt >= s.at - 120 && l.perfAt <= s.at + s.ms).map((l) => `${l.ms} ms: ${l.top.slice(0, 3).join(' | ')}`);
    return { key: s.i, ms: s.ms, at: s.at, mutations: Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => `${n}x ${k}`), longTasks: tasksIn };
  });
  return {
    keys: (lat || []).length, slow: slow.map((x) => ({ key: x.i, ms: x.ms, at: x.at })), slowGapsMs: slow.slice(1).map((x, i) => Math.round(x.at - slow[i].at)),
    mainThread: main, clocksJoined: offsetMs !== null, traceEvents: events.length, mutations: M.length,
    longTasks: longs.length, longs, bySlow,
    groupsNearSlow: groupRows.filter((g) => g.nearSlowKeys > 0).sort((a, b) => b.nearSlowKeys - a.nearSlowKeys || b.n - a.n).slice(0, 25),
    groupsAll: groupRows.sort((a, b) => b.n - a.n).slice(0, 40),
  };
}

export async function a6Stop(app, h, { lat, out, label }) {
  const muts = await app.evalJs('(() => { if (window.__a6moff) window.__a6moff(); return window.__a6m || []; })()');
  const done = app.waitEvent('Tracing.tracingComplete', 90000);
  await app.cdp('Tracing.end'); await done; await new Promise((r) => setTimeout(r, 300)); h.off();
  writeFileSync(path.join(out, `a6-play-trace-${label}.json`), JSON.stringify({ traceEvents: h.events }));
  const s = a6Analyse({ events: h.events, syncPerf: h.syncPerf, lat, muts });
  writeFileSync(path.join(out, `a6-play-summary-${label}.json`), JSON.stringify(s, null, 1));
  console.log(`A6-PLAY ${label}: ${s.keys} keys, ${s.slow.length} slow (>45 ms), ${s.longTasks} long tasks (>=30 ms), ${s.mutations} mutations, clocks ${s.clocksJoined ? 'joined' : 'NOT joined'}`);
  for (const b of s.bySlow.slice(0, 12)) console.log(`  slow key ${b.key} ${b.ms} ms: ${b.mutations.slice(0, 4).join(' | ') || '(no mutation)'} || ${b.longTasks.join(' ; ') || '(no long task)'}`);
  for (const g of s.groupsNearSlow.slice(0, 8)) console.log(`  near-slow ${g.nearSlowKeys}/${g.n} gap ${g.medianGapMs} ms subtree ${g.subtree}: ${g.group}  e.g. ${g.sample[0]}`);
  return s;
}

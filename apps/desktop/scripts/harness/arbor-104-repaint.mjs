// BUG #104, KEY 1 ITSELF (a measurement branch, never merged; Fable, Nov 18, 11:00 am: "find what key 1 itself repaints when the room switches"). On
// the gusts build, key 1 typed BETWEEN gusts (breeze phase 4-12 s: no leaf moving), against TODAY (?arbor2=0). Key 1 alone in its window: key 1,
// then 180 ms of nothing (the window is keydown 1 -> +180 ms), then the rest of the burst. Per key-1 window:
//   INVAL   paint invalidations (PaintInvalidationTracking): the element and the reason, counted
//   PAINT   Paint events: count and clip area (px^2) per layer
//   RASTER  raster work (RasterTask / DisplayItemList::Raster): ms per layer
//   LAYERS  the cc layers above, named: their DOM element (LayerTree backendNodeId -> DOM.describeNode: tag and class) and size
// Prints RP lines.
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.RP_ROUNDS || 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking', 'disabled-by-default-devtools.timeline.frame', 'cc', 'blink', 'toplevel'];
const PHASE = "(() => { const g = document.querySelector('.arbor2-pergola .arbor2-live .wz-leaf'); const a = g && g.getAnimations().find((x) => x.animationName === 'arbor2-breeze'); if (!a) return null; const d = Number(a.effect.getTiming().delay); return (((Number(a.currentTime) - d) % 16000) + 16000) % 16000; })()";
const METER = `(() => { if (window.__kbOff) window.__kbOff(); window.__kb = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kb.push(performance.now() - t))); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kbOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
const area = (q) => { if (!Array.isArray(q) || q.length < 8) return 0; const xs = [q[0], q[2], q[4], q[6]], ys = [q[1], q[3], q[5], q[7]]; return Math.round((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))); };

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await js("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
  const id = `arbor-rp-${Math.random().toString(36).slice(2, 7)}`;
  await js(`window.wrizoCreateJournalPage(${J({ id, text: 'word0 word1 word2 word3 word4 word5 word6', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  let layers = new Map();   // layerId -> { backendNodeId, w, h, drawsContent }
  app.tap((m, p) => { if (m === 'LayerTree.layerTreeDidChange' && p && Array.isArray(p.layers)) { layers = new Map(p.layers.map((l) => [String(l.layerId), { node: l.backendNodeId, w: Math.round(l.width), h: Math.round(l.height), draws: l.drawsContent }])); } });
  const reopen = async (arm) => {
    await js("location.hash = '#/'"); await sleep(300);
    await js(`window.wrizoPatchEntry(${J(id)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') })`);
    await js(`history.replaceState(null, '', ${J((arm === 'today' ? '/?arbor2=0' : '/') + '#/')})`); await app.reload();
    await js("document.documentElement.setAttribute('data-room', 'light'); true");
    await js(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page reopened', timeout: 15000 });
    await sleep(1500);
    await js("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  };
  const toPhase = async (lo, hi) => { const p = await js(PHASE); if (p == null) return null; const wait = p >= lo && p <= hi ? 0 : (lo + 40 - p + 16000) % 16000; await sleep(wait); return js(PHASE); };
  const nameOf = async (backendNodeId) => {
    if (!backendNodeId) return null;
    try { const d = await app.cdp('DOM.describeNode', { backendNodeId }); const n = d && d.node; if (!n) return null; const at = n.attributes || []; const ci = at.indexOf('class'); return `${(n.localName || n.nodeName || '').toLowerCase()}${ci >= 0 ? '.' + String(at[ci + 1]).trim().split(/\s+/).join('.') : ''}`; } catch { return null; }
  };
  try { await app.cdp('DOM.enable'); } catch {}
  try { await app.cdp('LayerTree.enable'); } catch {}
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const arm of (round % 2 ? ['redesign', 'today'] : ['today', 'redesign'])) {
      await reopen(arm);
      const phase = arm === 'redesign' ? await toPhase(4000, 12000) : null;
      await js(METER);
      const ev = []; const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) ev.push(...p.value); });
      await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
      await app.typeKeys('a'); await sleep(180); await app.typeKeys('a'); await sleep(250);
      const done = app.waitEvent('Tracing.tracingComplete', 60000); await app.cdp('Tracing.end'); await done; await sleep(200); off();
      const keys = await js('window.__kb.map((x) => Math.round(x * 10) / 10)');
      for (let i = 0; i < 18; i += 1) { await app.typeKeys('a'); await sleep(25); }
      const kd = ev.filter((e) => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'keydown').map((e) => e.ts).sort((a, b) => a - b);
      if (!kd.length) { console.log('RP ' + J({ round, arm, error: 'no keydown in trace' })); continue; }
      const a = kd[0], b = a + 180000;
      const inW = (e) => e.ts >= a && e.ts < b;
      const inval = {}; for (const e of ev) { if (!inW(e) || e.name !== 'PaintInvalidationTracking') continue; const d = (e.args && e.args.data) || {}; const k = `${d.nodeName || '?'} :: ${d.reason || '?'}`.slice(0, 160); inval[k] = (inval[k] || 0) + 1; }
      const paint = {}; for (const e of ev) { if (!inW(e) || e.name !== 'Paint') continue; const d = (e.args && e.args.data) || {}; const L = String(d.layerId ?? '?'); const P = (paint[L] ||= { n: 0, area: 0, ms: 0 }); P.n += 1; P.area += area(d.clip); P.ms += (e.dur || 0) / 1000; }
      const raster = {}; for (const e of ev) { if (!inW(e) || !(e.name === 'RasterTask' || e.name === 'DisplayItemList::Raster')) continue; const d = (e.args && (e.args.tileData || e.args.data)) || {}; const L = String(d.layerId ?? (d.tileId && d.tileId.layerId) ?? '?'); const R = (raster[L] ||= { n: 0, ms: 0 }); R.n += 1; R.ms += (e.dur || 0) / 1000; }
      const ids = [...new Set([...Object.keys(paint), ...Object.keys(raster)])].filter((x) => x !== '?');
      const named = {}; for (const L of ids) { const l = layers.get(L); named[L] = { el: l ? await nameOf(l.node) : null, size: l ? `${l.w}x${l.h}` : null }; }
      const fmt = (o, f) => Object.entries(o).sort((p, q) => f(q[1]) - f(p[1])).slice(0, 10);
      console.log('RP ' + J({ round, arm, phase: r1(phase), keys, inval: fmt(inval, (v) => v), paint: fmt(paint, (v) => v.area).map(([L, v]) => [L, named[L], v.n, v.area, r1(v.ms)]), raster: fmt(raster, (v) => v.ms).map(([L, v]) => [L, named[L], v.n, r1(v.ms)]), layersKnown: layers.size }));
      await sleep(2000);
    }
  }
  return [{ name: 'probe ran', pass: true }];
}, { label: 'arbor-104-repaint' });
console.log('\nARBOR-104-REPAINT VERIFY: PASS (1 checks)');
process.exit(0);

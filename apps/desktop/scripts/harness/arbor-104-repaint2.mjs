// BUG #104, KEY 1 ITSELF, probe 2 (a measurement branch, never merged). Probe 1 (Actions 44364660062) was blind to names - no paint
// invalidation events in this Chrome, the Paint clip unusable, the layer map stale after each reload - but it saw, 9/9 bursts per arm, one
// extra layer RASTERIZED at key 1 on the redesign: 24 tiles (a window-sized layer), 5-7 ms, against today's 11-tile layer at ~2 ms; paints 9
// vs 5. Probe 2 names it with the layer tree's own paint counter: LayerTree (re-enabled after every reload) snapshots every layer's paintCount
// at rest, again 180 ms later with NO key (the baseline: what repaints anyway), and again 180 ms after key 1. A layer whose count rose over
// key 1 more than over the baseline is what key 1 repaints; each is named (DOM.describeNode on its backendNodeId: tag, class) with its size.
// Arms: REDESIGN (the gusts build, key 1 between gusts) and TODAY (?arbor2=0). Prints RP2 lines.
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.RP_ROUNDS || 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PHASE = "(() => { const g = document.querySelector('.arbor2-pergola .arbor2-live .wz-leaf'); const a = g && g.getAnimations().find((x) => x.animationName === 'arbor2-breeze'); if (!a) return null; const d = Number(a.effect.getTiming().delay); return (((Number(a.currentTime) - d) % 16000) + 16000) % 16000; })()";
const METER = `(() => { if (window.__kbOff) window.__kbOff(); window.__kb = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kb.push(performance.now() - t))); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kbOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await js("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
  const id = `arbor-rp2-${Math.random().toString(36).slice(2, 7)}`;
  await js(`window.wrizoCreateJournalPage(${J({ id, text: 'word0 word1 word2 word3 word4 word5 word6', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  let tree = new Map(); let treeAt = 0;   // layerId -> { node, w, h, paints }
  app.tap((m, p) => { if (m === 'LayerTree.layerTreeDidChange' && p && Array.isArray(p.layers)) { tree = new Map(p.layers.map((l) => [String(l.layerId), { node: l.backendNodeId, w: Math.round(l.width), h: Math.round(l.height), paints: l.paintCount || 0, draws: !!l.drawsContent }])); treeAt = Date.now(); } });
  const snap = async () => { const t = Date.now(); for (let i = 0; i < 40 && treeAt < t; i += 1) await sleep(25); return new Map([...tree].map(([k, v]) => [k, { ...v }])); };
  const reopen = async (arm) => {
    await js("location.hash = '#/'"); await sleep(300);
    await js(`window.wrizoPatchEntry(${J(id)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') })`);
    await js(`history.replaceState(null, '', ${J((arm === 'today' ? '/?arbor2=0' : '/') + '#/')})`); await app.reload();
    try { await app.cdp('DOM.enable'); await app.cdp('DOM.getDocument', { depth: 0 }); } catch {}
    try { await app.cdp('LayerTree.enable'); } catch {}
    await js("document.documentElement.setAttribute('data-room', 'light'); true");
    await js(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page reopened', timeout: 15000 });
    await sleep(1500);
    await js("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  };
  const toPhase = async (lo, hi) => { const p = await js(PHASE); if (p == null) return null; const wait = p >= lo && p <= hi ? 0 : (lo + 40 - p + 16000) % 16000; await sleep(wait); return js(PHASE); };
  const nameOf = async (backendNodeId) => {
    if (!backendNodeId) return '(no node)';
    try { const d = await app.cdp('DOM.describeNode', { backendNodeId }); const n = d && d.node; if (!n) return '(unknown)'; const at = n.attributes || []; const ci = at.indexOf('class'); return `${(n.localName || n.nodeName || '').toLowerCase()}${ci >= 0 ? '.' + String(at[ci + 1]).trim().split(/\s+/).join('.') : ''}`; } catch { return '(describe failed)'; }
  };
  const delta = (a, b) => { const out = []; for (const [k, v] of b) { const was = a.get(k); const d = v.paints - (was ? was.paints : 0); if (d > 0) out.push({ id: k, d, node: v.node, size: `${v.w}x${v.h}`, area: v.w * v.h, fresh: !was }); } return out; };
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const arm of (round % 2 ? ['redesign', 'today'] : ['today', 'redesign'])) {
      await reopen(arm);
      const phase = arm === 'redesign' ? await toPhase(4000, 11000) : null;
      await js(METER);
      const s0 = await snap(); await sleep(180); const s1 = await snap();          // the baseline: 180 ms, no key
      await app.typeKeys('a'); await sleep(180); const s2 = await snap();        // key 1 and its 180 ms
      await app.typeKeys('a'); await sleep(250);
      const keys = await js('window.__kb.map((x) => Math.round(x * 10) / 10)');
      for (let i = 0; i < 18; i += 1) { await app.typeKeys('a'); await sleep(25); }
      const base = delta(s0, s1), key = delta(s1, s2);
      const named = async (list) => { const out = []; for (const x of list.sort((p, q) => q.area * q.d - p.area * p.d).slice(0, 12)) out.push([await nameOf(x.node), x.size, x.d, x.fresh ? 'NEW' : '']); return out; };
      console.log('RP2 ' + J({ round, arm, phase: r1(phase), keys, layers: s2.size, baseline: await named(base), key1: await named(key), key1Area: key.reduce((a, x) => a + x.area * x.d, 0), baseArea: base.reduce((a, x) => a + x.area * x.d, 0) }));
      await sleep(2000);
    }
  }
  return [{ name: 'probe ran', pass: true }];
}, { label: 'arbor-104-repaint2' });
console.log('\nARBOR-104-REPAINT2 VERIFY: PASS (1 checks)');
process.exit(0);

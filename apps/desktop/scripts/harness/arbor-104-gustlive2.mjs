// GUSTLIVE2 (see make-gustlive2.mjs in the lane's notes): the real timer arm (?arbor2gust=live) in place of the in-page emulation.
// GUSTLIVE (see make-gustlive.mjs in the lane's notes): the gusts measurement with the proposal's arms.
// BUG #104 / GUSTS MEASUREMENT (a measurement branch, never merged; Fable, Nov 18, 10:12 am: "Measure on Actions: key 1 / key 2 and the work at
// rest, gusts against the stagger, plus key 1 timed inside a gust"). On the gusts build (arbor/gusts), the redesign, day room. Arms, interleaved:
//   GUSTS-BETWEEN  as built; key 1 timed between gusts (the breeze's phase 4-13 s)
//   GUSTS-IN       as built; key 1 timed INSIDE a gust (phase 300-900 ms: every leaf moving)
//   STAGGER        the old breeze: the file's own staggered delays restored on every live leaf (asserted LANDED), key 1 at whatever moment comes
//   TODAY          ?arbor2=0
// Per burst: 22 keys at 25 ms on a reopened page (the attribution driver's fast burst); keys 1-3 untraced (keydown -> the second frame after
// beforeinput). Per arm once per round: a 400 ms trace at rest (gusts: between gusts and inside one) - main-thread busy, paints, raster tasks.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.KG_ROUNDS || 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE_DELAYS = [...fs.readFileSync(path.join(HERE, '../../src/arbor2/pergola-shadow.svg'), 'utf8').matchAll(/class="wz-leaf" style="[^"]*animation-delay:([\d.]+)s/g)].map((m) => Number(m[1]));
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'toplevel', 'cc', 'blink', 'v8'];
const METER = `(() => { if (window.__kbOff) window.__kbOff(); window.__kb = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kb.push(performance.now() - t))); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kbOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
// the breeze's phase now (ms in its 16 s), off the room's first leaf, with the page clock it was read at
const PHASE = "(() => { const g = document.querySelector('.arbor2-pergola .arbor2-live .wz-leaf'); const a = g && g.getAnimations().find((x) => x.animationName === 'arbor2-breeze'); if (!a) return null; const d = Number(a.effect.getTiming().delay); return { ph: (((Number(a.currentTime) - d) % 16000) + 16000) % 16000, at: performance.now() }; })()";
const STAGGER = `(() => { const D = ${J(FILE_DELAYS)}; let n = 0; for (const sel of ['.arbor2-pergola', '.arbor2-pagesh:not([data-bitmap])']) [...document.querySelectorAll(sel + ' .arbor2-live .wz-leaf')].forEach((g, i) => { if (D[i] != null) { g.style.animationDelay = D[i] + 's'; n += 1; } }); const ds = new Set([...document.querySelectorAll('.arbor2-pergola .arbor2-live .wz-leaf')].map((g) => getComputedStyle(g).animationDelay)); return { set: n, distinct: ds.size }; })()`;
const ARMS = ['gusts-between', 'gustlive', 'gustlive-in', 'today'];
// the proposal, in the page: between gusts the room's pergola holds its cut state; during each gust the live drawing shows (not while writing)
const GUSTLIVE = `(() => { if (window.__glOff) window.__glOff(); const root = document.documentElement; let on = true;
  const tick = () => { if (!on) return; const p = document.querySelector('.arbor2-pergola'); const g = p && p.querySelector('.arbor2-live .wz-leaf'); const a = g && g.getAnimations().find((x) => x.animationName === 'arbor2-breeze');
    if (p && a && root.getAttribute('data-wz-writing') !== 'true') { const d = Number(a.effect.getTiming().delay); const ph = (((Number(a.currentTime) - d) % 16000) + 16000) % 16000; const gust = ph > 16000 - 150 || ph < 1450;
      if (gust && p.hasAttribute('data-live-off')) p.removeAttribute('data-live-off'); else if (!gust && !p.hasAttribute('data-live-off')) p.setAttribute('data-live-off', 'true'); }
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick); window.__glOff = () => { on = false; }; return true; })()`;
const LIVEOFF = "(() => { const p = document.querySelector('.arbor2-pergola'); return p ? p.getAttribute('data-live-off') : 'no pergola'; })()";

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await js("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
  const id = `arbor-gl2-${Math.random().toString(36).slice(2, 7)}`;
  await js(`window.wrizoCreateJournalPage(${J({ id, text: 'word0 word1 word2 word3 word4 word5 word6', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  const reopen = async (arm) => {
    await js("location.hash = '#/'"); await sleep(300);
    await js(`window.wrizoPatchEntry(${J(id)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') })`);
    await js(`history.replaceState(null, '', ${J((arm === 'today' ? '/?arbor2=0' : arm.startsWith('gustlive') ? '/?arbor2gust=live' : '/') + '#/')})`); await app.reload();
    await js("document.documentElement.setAttribute('data-room', 'light'); true");
    await js(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page reopened', timeout: 15000 });
    if (arm !== 'today') await waitSoft(app, "document.querySelectorAll('.arbor2-pagesh:not([data-bitmap]) .arbor2-live .wz-leaf').length > 0", { label: 'the page copy', timeout: 10000 });
    await sleep(1500);
    await js("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  };
  // wait (off the page clock) until the breeze stands in [lo, hi] ms of its cycle; returns the phase at the moment we stop waiting
  const toPhase = async (lo, hi) => {
    const p = await js(PHASE); if (!p) return null;
    const now = p.ph; let wait = now >= lo && now <= hi ? 0 : (lo + 40 - now + 16000) % 16000;
    await sleep(wait); const q = await js(PHASE); return q ? q.ph : null;
  };
  const restWin = async (ms) => {
    const ev = []; const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) ev.push(...p.value); });
    await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
    await sleep(ms); const done = app.waitEvent('Tracing.tracingComplete', 60000); await app.cdp('Tracing.end'); await done; await sleep(150); off();
    const ult = ev.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X'); const byT = {}; for (const e of ult) { const k = `${e.pid}:${e.tid}`; byT[k] = (byT[k] || 0) + 1; }
    const disp = {}; for (const e of ev) if (e.name === 'ParseHTML' || e.name === 'FunctionCall' || e.name === 'Paint') { const k = `${e.pid}:${e.tid}`; disp[k] = (disp[k] || 0) + 1; }
    const main = Object.entries({ ...disp, ...byT }).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0];
    const xs = ev.filter((e) => `${e.pid}:${e.tid}` === main && e.ph === 'X' && typeof e.dur === 'number').sort((a, b) => a.ts - b.ts);
    let busy = 0, end = -1; for (const e of xs) { const f = e.ts + e.dur; if (e.ts >= end) { busy += e.dur; end = f; } else if (f > end) { busy += f - end; end = f; } }
    return { mainBusy: r1(busy / 1000), paints: ev.filter((e) => e.name === 'Paint' || e.name === 'LocalFrameView::RunPaintLifecyclePhase').length, raster: ev.filter((e) => e.name === 'DisplayItemList::Raster').length,
      recalcMs: r1(xs.filter((e) => e.name === 'Document::recalcStyle').reduce((a, e) => a + e.dur / 1000, 0)) };
  };
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const arm of [...ARMS.slice((round - 1) % 4), ...ARMS.slice(0, (round - 1) % 4)]) {
      await reopen(arm);
      let premise = null, rest = null, rest2 = null, phaseAtKey = null;
      if (arm === 'today') rest = await restWin(400);
      if (arm !== 'today') { await toPhase(4000, 12000); rest = await restWin(400); await toPhase(200, 600); rest2 = await restWin(400); }
      if (arm === 'gusts-between') phaseAtKey = await toPhase(4000, 13000);
      if (arm === 'gustlive') phaseAtKey = await toPhase(4000, 13000);
      if (arm === 'gustlive-in') phaseAtKey = await toPhase(300, 900);
      premise = arm === 'today' ? null : await js(LIVEOFF);
      await js(METER);
      for (let i = 0; i < 22; i += 1) { await app.typeKeys('a'); await sleep(25); }
      await sleep(400);
      const keys = await js('window.__kb.map((x) => Math.round(x * 10) / 10)');
      console.log('GL2 ' + J({ round, arm, premise, phaseAtKey: r1(phaseAtKey), keys: (keys || []).slice(0, 22), restBetween: arm !== 'today' ? rest : undefined, restInGust: rest2 || undefined, rest: arm !== 'today' ? undefined : rest }));
      await sleep(2500);
    }
  }
  return [{ name: 'measurement ran', pass: true }];
}, { label: 'arbor-104-gustlive2' });
console.log('\nARBOR-104-GUSTLIVE2 VERIFY: PASS (1 checks)');
process.exit(0);

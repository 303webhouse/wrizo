// #104 PROBE ARM'S OWN CHECK (probe branch arbor/probe-104-gustlive-timer, never merged): pergola.ts's ?arbor2gust=live arm does what it claims.
// Day room, a page at rest; the room's pergola's data-live-off watched by a MutationObserver (every flip, with the breeze phase at that moment):
//   A1 with the query, between gusts the room stands CUT (data-live-off 'true')
//   A2 with the query, inside a gust the live drawing is shown (no data-live-off)
//   A3 nothing per frame: over 33 s at rest (two 16 s cycles and a bit) the flips are 2 per cycle at most (4-6 in all), each at a gust's edge
//      (cut on at phase ~1500 ms, off at ~15850 ms, within 120 ms)
//   A4 without the query (the shipped arm) nothing flips at rest: no data-live-off in 17 s
//   A5 she writes and returns: a key cuts (data-live-off 'true'), Escape brings the room back, and the plan runs again (a flip within 17 s)
//   M1 (mutant) the A3 read over a per-frame flipper (a requestAnimationFrame toggle injected for 1 s, asserted LANDED) goes red
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PHASE = "(() => { const g = document.querySelector('.arbor2-pergola .arbor2-live .wz-leaf'); const a = g && g.getAnimations().find((x) => x.animationName === 'arbor2-breeze'); if (!a) return null; const d = Number(a.effect.getTiming().delay); return (((Number(a.currentTime) - d) % 16000) + 16000) % 16000; })()";
const WATCH = `(() => { if (window.__glw) window.__glw.disconnect(); window.__flips = []; const p = document.querySelector('.arbor2-pergola'); if (!p) return false;
  const ph = () => { const g = p.querySelector('.arbor2-live .wz-leaf'); const a = g && g.getAnimations().find((x) => x.animationName === 'arbor2-breeze'); if (!a) return null; const d = Number(a.effect.getTiming().delay); return Math.round((((Number(a.currentTime) - d) % 16000) + 16000) % 16000); };
  window.__glw = new MutationObserver((rs) => { for (const r of rs) if (r.attributeName === 'data-live-off') window.__flips.push({ to: p.getAttribute('data-live-off'), ph: ph(), t: Math.round(performance.now()) }); });
  window.__glw.observe(p, { attributes: true, attributeFilter: ['data-live-off'] }); return true; })()`;
const LIVEOFF = "(() => { const p = document.querySelector('.arbor2-pergola'); return p ? p.getAttribute('data-live-off') : 'no pergola'; })()";

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const open = async (query) => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs(`history.replaceState(null, '', '/' + ${J(query)} + '#/')`); await app.reload();
    await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 20000 });
    await app.evalJs("document.documentElement.setAttribute('data-room', 'light'); true");
    const id = `arbor-gla-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: 'A page under the gusts.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.arbor2-pergola .arbor2-live .wz-leaf')", { label: 'the page and the pergola', timeout: 15000 });
    await sleep(1500);
  };
  const toPhase = async (lo, hi) => { for (let i = 0; i < 300; i += 1) { const p = await app.evalJs(PHASE); if (p != null && p >= lo && p <= hi) return p; await sleep(p != null && (p < lo - 300 || p > hi) ? 150 : 15); } return null; };

  await open('?arbor2gust=live');
  const pBetween = await toPhase(4000, 12000); const between = await app.evalJs(LIVEOFF);
  ok(`A1 with the query, between gusts (phase ${Math.round(pBetween)}) the room stands cut: data-live-off ${J(between)}`, pBetween != null && between === 'true', J({ pBetween, between }));
  const pIn = await toPhase(300, 1000); const inGust = await app.evalJs(LIVEOFF);
  ok(`A2 with the query, inside a gust (phase ${Math.round(pIn)}) the live drawing shows: data-live-off ${J(inGust)}`, pIn != null && inGust === null, J({ pIn, inGust }));
  await app.evalJs(WATCH); await sleep(33000); const flips = await app.evalJs('window.__flips');
  const edgeOk = (f) => (f.to === 'true' && Math.abs(f.ph - 1500) <= 120) || (f.to === null && Math.abs(f.ph - 15850) <= 120);
  const a3 = (fs) => Array.isArray(fs) && fs.length >= 4 && fs.length <= 6 && fs.every(edgeOk);
  ok(`A3 nothing per frame: ${flips && flips.length} flips in 33 s, each at a gust's edge (${J((flips || []).map((f) => `${f.to === 'true' ? 'cut' : 'live'}@${f.ph}`))})`, a3(flips), J(flips));
  // A5: a key cuts, Escape returns, the plan runs again
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  await toPhase(300, 900);   // a key inside a gust, the harder case: the live drawing is up
  await app.typeKeys(' a');
  const cutOnKey = await waitSoft(app, "document.querySelector('.arbor2-pergola').getAttribute('data-live-off') === 'true'", { label: 'the cut', timeout: 3000 });
  await sleep(1200); await app.key('Escape');
  const back = await waitSoft(app, "document.documentElement.getAttribute('data-wz-writing') !== 'true'", { label: 'the return', timeout: 15000 });
  await app.evalJs(WATCH); await sleep(17000); const after = await app.evalJs('window.__flips');
  ok(`A5 she writes and returns: the key cut the room (${cutOnKey}), Escape returned it (${back}), and the plan runs again (${after && after.length} flips in 17 s)`, cutOnKey && back && Array.isArray(after) && after.length >= 1 && after.every(edgeOk), J(after));
  // M1: a per-frame flipper for 1 s - A3's read must go red
  await app.evalJs(WATCH);
  await app.evalJs("(() => { const p = document.querySelector('.arbor2-pergola'); const end = performance.now() + 1000; const f = () => { if (performance.now() > end) return; if (p.hasAttribute('data-live-off')) p.removeAttribute('data-live-off'); else p.setAttribute('data-live-off', 'true'); requestAnimationFrame(f); }; requestAnimationFrame(f); return true; })()");
  await sleep(1300); const m1 = await app.evalJs('window.__flips');
  ok(`M1 (mutant): a per-frame flipper for 1 s (LANDED: ${m1 && m1.length} flips) - A3's read goes RED`, Array.isArray(m1) && m1.length > 20 && !a3(m1), J({ n: m1 && m1.length }));
  // A4: the shipped arm, no query: nothing flips at rest
  await open('');
  await app.evalJs(WATCH); await sleep(17000); const shipped = await app.evalJs('window.__flips'); const shippedNow = await app.evalJs(LIVEOFF);
  ok(`A4 without the query (the shipped arm) nothing flips at rest: ${shipped && shipped.length} flips in 17 s, data-live-off ${J(shippedNow)}`, Array.isArray(shipped) && shipped.length === 0 && shippedNow === null, J({ shipped, shippedNow }));
  return checks;
}, { label: 'arbor-104-gustlive-arm' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const WANT = 6;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-104-GUSTLIVE-ARM VERIFY: PASS (${checks.length} checks)` : `\nARBOR-104-GUSTLIVE-ARM VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);

// THE LEAVES FLUTTER IN GUSTS (NICK RULED, Nov 18, 10:06 am, via Fable 10:12 am): "all together, ~1.4 s every 16 s, only while she isn't writing
// (they still stop at her first key and return with the room after the pause)". Asks for the redesign (no query); the day room through the
// product's own Room control's attribute (<html data-room="light">). Reads every leaf cluster's breeze animation in the live layers (the room's
// pergola and the page's copy) in ONE synchronous read, so every phase is taken at the same instant:
//   G1 ONE GUST CLOCK: every leaf (115 in the room, 115 on the page) runs the breeze (16 s) and all share one phase - the spread across all of them
//      is within 20 ms (one frame and change); the staggered breeze spread them over ~2.6 s
//   G2 TOGETHER: at the gust's first peak (phase 230-330 ms, +8 deg) every leaf is turned, all to one angle (within 1 deg, more than 3 deg);
//      between gusts (phase 3-14 s) every leaf is at rest
//   G3 STILL ON THE FIRST KEY: a key on the page cuts the room to the still picture (data-live-off) and the breeze is paused
//   G4 BACK AFTER THE PAUSE: when the room returns (no data-wz-writing) the breeze runs again and G1's one clock holds
//   M1 (mutant) the old stagger - each leaf's delay set back to the file's own (asserted LANDED: many distinct delays): G1's read goes RED
// RED FIRST: on the page-tone tip (1aa97209, the staggered breeze) G1 and G2 fail.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const HERE = path.dirname(fileURLToPath(import.meta.url));
// the file's own staggered delays (the source of the old breeze; the mutant restores them)
const FILE_DELAYS = [...fs.readFileSync(path.join(HERE, '../../src/arbor2/pergola-shadow.svg'), 'utf8').matchAll(/class="wz-leaf" style="[^"]*animation-delay:([\d.]+)s/g)].map((m) => Number(m[1]));
// every live leaf's breeze, read at one instant: its layer, phase in the 16 s cycle (ms), play state, and its drawn angle
const LEAVES = `(() => { const out = []; for (const [sel, layer] of [['.arbor2-pergola', 'room'], ['.arbor2-pagesh:not([data-bitmap])', 'page']]) {
  for (const g of document.querySelectorAll(sel + ' .arbor2-live .wz-leaf')) { const a = g.getAnimations().find((x) => x.animationName === 'arbor2-breeze');
    const tm = a ? a.effect.getTiming() : null; const dur = tm ? Number(tm.duration) : null; const t = a ? Number(a.currentTime) : null; const d = tm ? Number(tm.delay) : null;
    const ph = a && dur ? (((t - d) % dur) + dur) % dur : null;
    const m = /matrix\\(([^,]+),\\s*([^,]+)/.exec(getComputedStyle(g).transform || ''); const ang = m ? Math.atan2(Number(m[2]), Number(m[1])) * 180 / Math.PI : 0;
    out.push({ layer, ph, dur, delay: d, state: a ? a.playState : null, ang }); } }
  return out; })()`;
const spread = (phs) => { // the smallest arc (ms) holding every phase on the 16 s circle
  const xs = phs.slice().sort((a, b) => a - b); if (!xs.length) return null; let gap = 16000 - xs[xs.length - 1] + xs[0]; let at = 0;
  for (let i = 1; i < xs.length; i += 1) if (xs[i] - xs[i - 1] > gap) { gap = xs[i] - xs[i - 1]; at = i; } return Math.round((16000 - gap) * 10) / 10; };
const summary = (L) => { const room = L.filter((x) => x.layer === 'room'), page = L.filter((x) => x.layer === 'page');
  return { room: room.length, page: page.length, running: L.filter((x) => x.state === 'running').length, durs: [...new Set(L.map((x) => x.dur))], spread: spread(L.filter((x) => x.ph != null).map((x) => x.ph)),
    delays: new Set(L.map((x) => x.delay)).size, angMin: Math.min(...L.map((x) => x.ang)), angMax: Math.max(...L.map((x) => x.ang)), ph0: L[0] && L[0].ph }; };
const g1ok = (s) => s.room === 115 && s.page === 115 && s.running === 230 && s.durs.length === 1 && s.durs[0] === 16000 && s.spread != null && s.spread <= 20;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 25000 });
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
  await app.evalJs("document.documentElement.setAttribute('data-room', 'light'); true");
  const id = `arbor-gu-${Math.random().toString(36).slice(2, 7)}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: 'A page under the pergola.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await waitSoft(app, "document.querySelectorAll('.arbor2-pagesh:not([data-bitmap]) .arbor2-live .wz-leaf').length > 0 && document.documentElement.getAttribute('data-arbor2-room') === 'day'", { label: 'the day room and the page copy', timeout: 15000 });
  await sleep(1500);   // the page copy's start times synced to the room's (pergola.ts sync, two frames after it mounts)

  const read = () => app.evalJs(LEAVES);
  const s1 = summary(await read());
  ok(`G1 ONE GUST CLOCK: ${s1.room} room + ${s1.page} page leaves, ${s1.running} running, the breeze ${J(s1.durs)} ms; phase spread ${s1.spread} ms (<= 20)`, g1ok(s1), J(s1));

  // G2: wait for the gust's first peak, then for the still between gusts (phases read off the room's first leaf)
  const waitPhase = async (lo, hi) => { for (let i = 0; i < 400; i += 1) { const L = await read(); const p = L[0] && L[0].ph; if (p != null && p >= lo && p <= hi) return L; await sleep(p != null && (p < lo - 300 || p > hi) ? 200 : 15); } return null; };
  const peak = await waitPhase(230, 330);
  const sp = peak ? summary(peak) : null;
  const rest = await waitPhase(3000, 14000);
  const sr = rest ? summary(rest) : null;
  ok(`G2 TOGETHER: at the gust's peak every leaf turned to one angle (${sp && Math.round(sp.angMin * 10) / 10}..${sp && Math.round(sp.angMax * 10) / 10} deg); between gusts all at rest (${sr && Math.round(sr.angMin * 10) / 10}..${sr && Math.round(sr.angMax * 10) / 10})`,
    !!sp && !!sr && sp.room + sp.page === 230 && sp.angMin > 3 && sp.angMax - sp.angMin <= 1 && Math.abs(sr.angMin) < 0.05 && Math.abs(sr.angMax) < 0.05, J({ sp, sr }));

  // G3: a key on the page stops the breeze (the cut to the still picture)
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  await app.typeKeys(' a');
  const cut = await waitSoft(app, "document.querySelector('.arbor2-pergola') && document.querySelector('.arbor2-pergola').getAttribute('data-live-off') === 'true'", { label: 'the cut', timeout: 3000 });
  await sleep(300);
  const s3 = summary(await read());
  ok(`G3 STILL ON THE FIRST KEY: the room cut to the still picture (${cut}), writing ${await app.evalJs("document.documentElement.getAttribute('data-wz-writing')")}, the breeze paused (${230 - s3.running} of 230 not running)`,
    cut && s3.running === 0, J(s3));

  // G4: after the pause the room returns, and the breeze runs on one clock again
  const back = await waitSoft(app, "document.documentElement.getAttribute('data-wz-writing') !== 'true' && document.querySelector('.arbor2-pergola') && !document.querySelector('.arbor2-pergola').hasAttribute('data-live-off')", { label: 'the room back', timeout: 30000 });
  await sleep(1200);
  const s4 = summary(await read());
  ok(`G4 BACK AFTER THE PAUSE: the room returned (${back}); ${s4.running} of 230 leaves running, phase spread ${s4.spread} ms`, back && g1ok(s4), J(s4));

  // M1: the old stagger - every leaf's delay back to the file's own; G1's read must go red
  const landed = await app.evalJs(`(() => { const D = ${J(FILE_DELAYS)}; let n = 0; for (const sel of ['.arbor2-pergola', '.arbor2-pagesh:not([data-bitmap])']) [...document.querySelectorAll(sel + ' .arbor2-live .wz-leaf')].forEach((g, i) => { if (D[i] != null) { g.style.animationDelay = D[i] + 's'; n += 1; } }); return n; })()`);
  await sleep(400);
  const m1 = summary(await read());
  ok(`M1 (mutant): the file's staggered delays restored on ${landed} leaves (LANDED: ${m1.delays} distinct delays) - G1's read goes RED (spread ${m1.spread} ms)`, FILE_DELAYS.length === 115 && landed === 230 && m1.delays > 50 && !g1ok(m1), J(m1));
  return checks;
}, { label: 'arbor-gusts' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-GUSTS PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 5;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-GUSTS VERIFY: PASS (${checks.length} checks)` : `\nARBOR-GUSTS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);

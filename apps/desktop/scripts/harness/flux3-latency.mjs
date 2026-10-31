// FLUX3 S0 - THE LATENCY PROBE (Fable's ruling q11, Oct 31: flux-rulings-oct31.md; spec draft 2 md5 d247caf3, §9). "Typing with every Flux motion on
// adds no measurable keystroke latency over the same page in Arbor (rhizome-latency's method, judged against a control). The drawing layer stays
// within its frame budget, and it damps while typing, dragging or zooming and pauses when the window is hidden."
//
// Until S1 exists, "every Flux motion" is a STAND-IN (handoff-INK-flux-oct31.md): one canvas drawing layer under the page (mounted first in
// .mode-stage, behind the page, where the rhizome field already draws), animating at the display's rate: the ground (fill + radial glow + a 40px
// grid), 300 dashed traces with moving dashes and their end squares, and 120 electrons with a 10px glow - the techniques of POLISH's Schema mockup
// (docs/theme-foundations/flux/flux-circuit-mockup-A-schema.html: canvas 2D, setLineDash + lineDashOffset, shadowBlur), at the mockup's scale or above.
//
// THE DAMPING RULE the stand-in keeps (and S1's real layer must keep): while she types, drags or zooms (a key, a held pointer, a ctrl+wheel within the
// last 600 ms), the layer HOLDS ITS STILL FRAME and draws nothing; when the window is hidden it stops its frame loop. (The mockup's own busy() only
// DIMS while busy and keeps drawing every frame - that is the mutant's behaviour below.)
//
// THREE ARMS, interleaved in rounds (the order rotates each round; one discarded warm-up), each on the SAME page re-seeded to the same text through
// the app's seam, at 1920x1080, Page: Dark, in Draft with the Typewriter off:
//   C  the control: Arbor today (theme plateau), no flag, no stand-in.
//   T  Flux (theme flux) with ?flux3=1 and the stand-in drawing layer, damped.
//   M  the MUTANT: the same, with the damping skipped (the layer keeps drawing every frame while she types). It must FAIL the probe.
//   F  information only: Flux with ?flux3=1 and no layer (SPLIT prints C / F / T, so a red L can be split into the theme's share and the layer's).
// Keys: one character every ~90 ms, the latency of each read IN the page exactly as rhizome-latency reads it (keydown -> the second animation frame
// after its `beforeinput`; this editor never fires `input` on a key).
//
// THE OUTSIDE INSTRUMENT (installed before any page script, in every arm alike, so it costs every arm the same): requestAnimationFrame is wrapped to
// time each callback, and the 2D canvas draw calls are counted, both bucketed per frame. Nothing reads the stand-in's own word for what it did, so
// the same instrument measures S1's real layer, canvas or SVG-free, unchanged.
//
// VERDICTS (judged against the control's OWN spread: the range of its per-round medians and per-round p95s across the rounds):
//   L  T's pooled median <= C's pooled median + C's median spread, T's pooled p95 <= C's pooled p95 + C's p95 spread, and no T key over 100 ms.
//   D  T damps while typing: the frames that drew anything while the keys landed are no more than the control's own plus one per round (the
//      frame already in flight at the first key).
//   MUT the mutant fails L or D (it says which caught it); its premise is asserted (it really drew through the typing).
//   COST the drawing layer's per-frame cost, undamped, full motion (information): rAF time per frame and the frame interval, against the control.
//   Premises: each arm stood where it claims (theme, flag, stand-in present or absent, the same mode and Typewriter state in every arm), the stand-in
//   actually animated at rest, it moved no page rect, at least 40 keys painted per arm per round, and every typed key reached the stored page.
//   B  the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src (printed as a BUILD line).
//
// FLUX3_MUTANT=1 makes T itself skip its damping (the red-first run: L and/or D go red, the verdict is FAIL). FLUX3_ROUNDS=<n> (default 4).
// FLUX3_SHOTS=<dir> writes one frame of each arm at rest.
// Run: node scripts/harness/flux3-latency.mjs   (from apps/desktop; a box turn - this is a timing file)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const MUTANT_RUN = process.env.FLUX3_MUTANT === '1';
const ROUNDS = Math.max(3, Number(process.env.FLUX3_ROUNDS || 4));
const KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100, IDLE_MS = 1500, BUSY_MS = 600;
const VIEW = [1920, 1080];
const LOAD = { traces: 300, electrons: 120, busyMs: BUSY_MS };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// ---- the build this run uses ------------------------------------------------------------------------------------------------------------------------
function buildIdentity() {
  const out = { bundle: null, builtAt: null, head: null, srcCommitAt: null, dirtySrc: null, stale: null };
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = html.match(/assets\/(index-[\w-]+\.js)/);
    out.bundle = m ? m[1] : null;
    out.builtAt = fs.statSync(path.join(DIST, 'index.html')).mtime.toISOString();
  } catch { /* no bundle: withHarness refuses on its own */ }
  try {
    const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    out.head = git('rev-parse', '--short=8', 'HEAD');
    out.srcCommitAt = new Date(Number(git('log', '-1', '--format=%ct', '--', 'apps/desktop/src')) * 1000).toISOString();
    out.dirtySrc = git('status', '--porcelain', '--', 'apps/desktop/src').split('\n').filter(Boolean).length;
    out.stale = out.builtAt ? Date.parse(out.builtAt) < Date.parse(out.srcCommitAt) : null;
  } catch { /* git unavailable: reported as null, and B fails on it */ }
  return out;
}
const BUILD = buildIdentity();
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale}${MUTANT_RUN ? ' FLUX3_MUTANT=1 (T runs undamped)' : ''}`);

// ---- the outside instrument (a new-document script: it is in place before the app's first line, on every reload) --------------------------------------
const INSTRUMENT = `(() => {
  if (window.__f3i) return;
  const I = window.__f3i = { frames: [], calls: 0, cbMs: 0 };
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) { I.calls += 1; return o.apply(this, a); };
  }
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => { const t0 = performance.now(); try { cb(ts); } finally { I.cbMs += performance.now() - t0; } });
  let last = performance.now();
  const tick = () => { const now = performance.now(); I.frames.push([now, now - last, I.calls, I.cbMs]); I.calls = 0; I.cbMs = 0; last = now; if (I.frames.length > 40000) I.frames.splice(0, 20000); raf(tick); };
  raf(tick);
})();`;

// ---- the stand-in drawing layer (stringified into the page; self-contained) --------------------------------------------------------------------------
function standIn(mutant, opts) {
  const stage = document.querySelector('.mode-stage') || document.body;
  const c = document.createElement('canvas');
  c.className = 'flux3-standin';
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;';
  stage.prepend(c);
  const ctx = c.getContext('2d');
  let W = 0, H = 0;
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = Math.round(W * d); c.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); };
  size();
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const traces = Array.from({ length: opts.traces }, () => {
    const x0 = rnd() * W, y0 = rnd() * H, x1 = rnd() * W, y1 = rnd() * H, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const pts = rnd() < 0.5 ? [[x0, y0], [mx, y0], [mx, y1], [x1, y1]] : [[x0, y0], [x0, my], [x1, my], [x1, y1]];
    const seg = [0, 1, 2].map((i) => Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]));
    return { pts, seg, L: seg[0] + seg[1] + seg[2], a: (0.25 + rnd() * 0.35).toFixed(3) };
  });
  const electrons = Array.from({ length: opts.electrons }, (_, i) => ({ tr: traces[(i * 7) % traces.length], ph: rnd(), v: 0.12 + rnd() * 0.2 }));
  const along = (tr, f) => {
    let d = f * tr.L;
    for (let i = 0; i < 3; i++) { if (d <= tr.seg[i]) { const u = tr.seg[i] ? d / tr.seg[i] : 0, a = tr.pts[i], b = tr.pts[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; } d -= tr.seg[i]; }
    return tr.pts[3];
  };
  const draw = (t) => {
    ctx.fillStyle = '#020c10'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(8,40,72,.55)'); g.addColorStop(1, 'rgba(1,8,17,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(29,74,82,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0.5; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0.5; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.setLineDash([6, 5]); ctx.lineDashOffset = -(t / 60) % 11; ctx.lineWidth = 1.4;
    for (const tr of traces) { ctx.strokeStyle = `rgba(0,194,255,${tr.a})`; ctx.beginPath(); ctx.moveTo(tr.pts[0][0], tr.pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(tr.pts[i][0], tr.pts[i][1]); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(87,208,245,.35)';
    for (const tr of traces) { const a = tr.pts[0], b = tr.pts[3]; ctx.fillRect(a[0] - 2, a[1] - 2, 4, 4); ctx.fillRect(b[0] - 2, b[1] - 2, 4, 4); }
    ctx.fillStyle = '#00C2FF'; ctx.shadowColor = '#00C2FF'; ctx.shadowBlur = 10;
    for (const e of electrons) { const q = along(e.tr, ((t / 1000) * e.v + e.ph) % 1); ctx.fillRect(q[0] - 3, q[1] - 3, 6, 6); }
    ctx.shadowBlur = 0;
  };
  const S = { mutant, drawn: 0, held: 0 };
  window.__f3s = S;
  let lastAct = -1e9, dragging = false, raf = 0;
  const act = () => { lastAct = performance.now(); };
  const onDown = () => { dragging = true; act(); };
  const onUp = () => { dragging = false; act(); };
  const onWheel = (e) => { if (e.ctrlKey) act(); };
  const busy = () => dragging || performance.now() - lastAct < opts.busyMs;
  const frame = (t) => { raf = requestAnimationFrame(frame); if (!mutant && busy()) { S.held += 1; return; } draw(t); S.drawn += 1; };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const pause = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const onVis = () => (document.hidden ? pause() : start());
  document.addEventListener('keydown', act, true);
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('pointerup', onUp, true);
  document.addEventListener('pointercancel', onUp, true);
  document.addEventListener('wheel', onWheel, { capture: true, passive: true });
  document.addEventListener('visibilitychange', onVis);
  draw(performance.now()); // the still frame, there before the motion starts
  if (!document.hidden) start();
  return true;
}

// ---- statistics ---------------------------------------------------------------------------------------------------------------------------------------
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const show = (st) => JSON.stringify({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
// the verdict, one pure function, used for T and for the mutant alike
function judge(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(r.lat).median), cP95s = cRounds.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap((r) => r.lat)), X = stat(xRounds.flatMap((r) => r.lat));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const lat = enough && X.median <= C.median + spreadMed && X.p95 <= C.p95 + spreadP95 && X.max <= MAX_MS;
  const cDraws = cRounds.reduce((a, r) => a + r.typing.drawFrames, 0), xDraws = xRounds.reduce((a, r) => a + r.typing.drawFrames, 0);
  const damp = xDraws <= cDraws + xRounds.length;
  return { lat, damp, C, X, spreadMed, spreadP95, cDraws, xDraws, enough };
}

const SEED = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const ARMS = {
  C: { theme: 'plateau', flag: false, load: null },
  T: { theme: 'flux', flag: true, load: { mutant: MUTANT_RUN } },
  M: { theme: 'flux', flag: true, load: { mutant: true } },
  // F (information only, never a verdict): Flux with the flag and NO drawing layer, so a red L can be split into the theme's share and the layer's
  F: { theme: 'flux', flag: true, load: null },
};

try { await withHarness(async (app) => {
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await app.evalJs(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };

  // one page, made while Flux is the theme (so its remembered Typewriter value is off for every arm), through the app's own door
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await splashGone();
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');

  let cursor = 0;
  const runArm = async (name, round) => {
    const arm = ARMS[name];
    // off the page (the Desk has no flush handler), re-seed through the seam (it flushes before it returns), then the theme, the tone and the flag
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: ${JSON.stringify(SEED)} })`);
    await app.evalJs(`localStorage.setItem('wrizo-theme', ${JSON.stringify(arm.theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));`);
    await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(arm.flag ? '/?flux3=1' : '/')} + '#/page/' + ${JSON.stringify(pageId)})`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'page after reload' }).catch(() => {});
    await splashGone();
    // DRAFT, the ordinary page: Draft reads this page's own Typewriter value (off: the page was made in Flux), where Free Write reads the shared
    // setting, which is on by default (measured on Actions, run 41247909453: every arm ran Free Write with the Typewriter on). The Typewriter is
    // its own slice (S4, Jacked In); the Flux motion this probe stands in for runs around the ordinary page.
    await app.evalJs("document.querySelector('[data-mode-key=\"draft\"]')?.click()");
    await app.waitFor("document.querySelector('[data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'Draft' }).catch(() => {});
    await sleep(1300); // the mode switch's own re-persist lands ~1.1 s after it
    const rectOf = "(() => { const r = document.querySelector('.mode-page')?.getBoundingClientRect(); return r ? [r.x, r.y, r.width, r.height].map((v) => v.toFixed(2)).join(',') : null; })()";
    const rectBefore = await app.evalJs(rectOf);
    if (arm.load) await app.evalJs(`(${standIn.toString()})(${JSON.stringify(arm.load.mutant)}, ${JSON.stringify(LOAD)})`);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    const idle0 = await app.evalJs('performance.now()');
    await sleep(IDLE_MS);
    const idle1 = await app.evalJs('performance.now()');
    if (SHOTS && round === 1) fs.writeFileSync(path.join(SHOTS, `s0-latency-${name}${arm.load && arm.load.mutant ? '-undamped' : ''}-rest.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    const where = await app.evalJs(`(() => { const root = document.documentElement, tab = document.querySelector('[data-mode-key][aria-selected="true"]'), tw = document.querySelector('.mode-scroll[data-typewriter]');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
      return { theme: root.getAttribute('data-theme'), page: root.getAttribute('data-page'), flag: new URLSearchParams(location.search).get('flux3'), standin: !!document.querySelector('canvas.flux3-standin'),
        mode: tab ? tab.getAttribute('data-mode-key') : null, typewriter: tw ? tw.getAttribute('data-typewriter') : null, served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null,
        instrument: !!window.__f3i, rect: ${rectOf} }; })()`);
    // the meter (rhizome-latency's, verbatim in method)
    await app.evalJs(`(() => {
      window.__lat = []; let t0 = 0;
      if (window.__latOff) window.__latOff();
      const kd = () => { t0 = performance.now(); };
      const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { const now = performance.now(); window.__lat.push({ ms: now - t, key: t, at: now }); })); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); };
      return true; })()`);
    let typed = '';
    for (let i = 0; i < KEYS; i += 1) { const ch = CYCLE[cursor % CYCLE.length]; cursor += 1; typed += ch; await app.typeKeys(ch); await sleep(GAP); }
    await sleep(250);
    const got = await app.evalJs(`(() => {
      const lat = window.__lat.slice(), fr = window.__f3i ? window.__f3i.frames.slice() : [];
      const k0 = lat.length ? Math.min(...lat.map((x) => x.key)) : 0, k1 = lat.length ? Math.max(...lat.map((x) => x.at)) : 0;
      const pick = (a, b) => fr.filter((f) => f[0] >= a && f[0] <= b);
      const sum = (fs) => ({ n: fs.length, drawFrames: fs.filter((f) => f[2] > 0).length, cbMs: fs.map((f) => f[3]), dt: fs.map((f) => f[1]),
        drawAt: fs.filter((f) => f[2] > 0).slice(0, 6).map((f) => Math.round(f[0] - (fs.length ? fs[0][0] : 0))) });
      return { lat: lat.map((x) => x.ms), idle: sum(pick(${idle0}, ${idle1})), typing: sum(pick(k0, k1)), standin: window.__f3s ? { drawn: window.__f3s.drawn, held: window.__f3s.held } : null };
    })()`);
    // every typed key reached the stored page (read after the debounced save lands: wait on the STORED value)
    const nonWs = (s) => String(s || '').replace(/\s+/g, '').length;
    const want = nonWs(SEED) + nonWs(typed);
    const storedExpr = `((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(pageId)}) || {}).text || '')`;
    let saved = false;
    try { await app.waitFor(`${storedExpr}.replace(/\\s+/g, '').length === ${want}`, { timeout: 8000, label: 'typed text saved' }); saved = true; } catch { saved = false; }
    const storedLen = await app.evalJs(`${storedExpr}.replace(/\\s+/g, '').length`);
    return { name, round, where, rectBefore, ...got, saved, storedLen, want };
  };

  // warm-up (discarded), then the rounds, the arm order rotating each round
  await runArm('C', 0);
  const order = MUTANT_RUN ? ['C', 'F', 'T'] : ['C', 'F', 'T', 'M'];
  const res = { C: [], T: [], M: [], F: [] };
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = order.slice((round - 1) % order.length).concat(order.slice(0, (round - 1) % order.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }
  const all = [...res.C, ...res.F, ...res.T, ...res.M];

  // ---- premises
  const placed = all.filter((r) => {
    const a = ARMS[r.name], w = r.where;
    return w.theme === a.theme && w.page === 'dark' && (a.flag ? w.flag === '1' : w.flag === null) && w.standin === !!a.load && w.instrument;
  });
  ok(`P1 every arm stood where it claims (C: Arbor/plateau, no flag, no stand-in; T and M: Flux, ?flux3=1, the stand-in mounted; Page: Dark; the instrument in place): ${placed.length}/${all.length}`,
    placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 2).map((r) => ({ arm: r.name, round: r.round, where: r.where }))));
  const modes = new Set(all.map((r) => `${r.where.mode}/${r.where.typewriter}`));
  ok(`P2 the same surface in every arm (mode/typewriter: ${[...modes].join(' ')}), the Typewriter off`, modes.size === 1 && [...modes][0].endsWith('/false'), JSON.stringify([...modes]));
  ok('P2b that surface is Draft (the ordinary page)', modes.size === 1 && [...modes][0].startsWith('draft/'), JSON.stringify([...modes]));
  const loaded = [...res.T, ...res.M];
  // PARKED 2026-10-31 (SUPERSEDED, first run, Actions 41247909453: the frame floor assumed the display's 60 fps, but an undamped layer at 1920 is
  // what SLOWS the frames - 35-52 frames in 1.5 s on the runner, every one of them drawing - so the floor measured the layer's cost, not whether it
  // animated). Original, verbatim:
  // const animated = loaded.filter((r) => r.idle.n >= 45 && r.idle.drawFrames >= 0.8 * r.idle.n);
  // ok(`P3 the stand-in really animated at rest (>= 45 frames in ${IDLE_MS} ms, >= 80% of them drawing) in every loaded arm-round: ${animated.length}/${loaded.length}`,
  //   loaded.length > 0 && animated.length === loaded.length, JSON.stringify(loaded.map((r) => ({ arm: r.name, round: r.round, frames: r.idle.n, drew: r.idle.drawFrames }))));
  // SUCCESSOR P3b: it animated (>= 80% of the rest frames drew) at any frame rate above 13 fps (>= 20 frames in 1.5 s); its cost is COST's to report.
  const animatedB = loaded.filter((r) => r.idle.n >= 20 && r.idle.drawFrames >= 0.8 * r.idle.n);
  ok(`P3b the stand-in really animated at rest (>= 20 frames in ${IDLE_MS} ms, >= 80% of them drawing) in every loaded arm-round: ${animatedB.length}/${loaded.length}`,
    loaded.length > 0 && animatedB.length === loaded.length, JSON.stringify(loaded.map((r) => ({ arm: r.name, round: r.round, frames: r.idle.n, drew: r.idle.drawFrames }))));
  const unmoved = loaded.filter((r) => r.rectBefore && r.rectBefore === r.where.rect);
  ok(`P4 the stand-in moved no page rect (the .mode-page rect before mounting it = with it drawing): ${unmoved.length}/${loaded.length}`, unmoved.length === loaded.length,
    JSON.stringify(loaded.filter((r) => !unmoved.includes(r)).map((r) => ({ arm: r.name, before: r.rectBefore, after: r.where.rect }))));
  const thin = all.filter((r) => r.lat.length < MIN_KEYS);
  ok(`P5 at least ${MIN_KEYS} keys painted in every arm-round (${KEYS} typed each)`, thin.length === 0, JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round, n: r.lat.length }))));
  const lost = all.filter((r) => !r.saved);
  ok('P6 no key was dropped: in every arm-round the stored page holds the seed plus every typed character', lost.length === 0, JSON.stringify(lost.map((r) => ({ arm: r.name, round: r.round, stored: r.storedLen, want: r.want }))));

  // ---- the verdicts
  const cRounds = res.C.map((r) => `${r1(stat(r.lat).median)}/${r1(stat(r.lat).p95)}`).join(' ');
  const t = judge(res.C, res.T);
  ok(`L${MUTANT_RUN ? ' (FLUX3_MUTANT=1: T is undamped)' : ''} typing on Flux with every motion on adds no latency beyond the control's own spread: T median ${r1(t.X.median)} <= C ${r1(t.C.median)} + ${r1(t.spreadMed)}, T p95 ${r1(t.X.p95)} <= C ${r1(t.C.p95)} + ${r1(t.spreadP95)}, no T key over ${MAX_MS} ms`,
    t.lat, `C ${show(t.C)} | T ${show(t.X)} | C per round median/p95 ${cRounds}`);
  ok(`D${MUTANT_RUN ? ' (FLUX3_MUTANT=1)' : ''} the drawing layer damps while she types: ${t.xDraws} frame(s) drew while T's keys landed (control ${t.cDraws}; allowed control + ${res.T.length}, one in flight per round)`,
    t.damp, JSON.stringify(res.T.map((r) => ({ round: r.round, typingFrames: r.typing.n, drew: r.typing.drawFrames, drewAtMsFromFirstKey: r.typing.drawAt, standin: r.standin }))));
  // the theme's share against the layer's (information): F is Flux + the flag with no layer
  const fS = stat(res.F.flatMap((r) => r.lat)), cS = stat(res.C.flatMap((r) => r.lat)), tS = stat(res.T.flatMap((r) => r.lat));
  ok(`SPLIT (information) median/p95 ms: C Arbor ${r1(cS.median)}/${r1(cS.p95)} | F Flux, no layer ${r1(fS.median)}/${r1(fS.p95)} | T Flux + layer ${r1(tS.median)}/${r1(tS.p95)}`, true, '');
  if (!MUTANT_RUN) {
    const m = judge(res.C, res.M);
    const mLanded = res.M.length > 0 && res.M.every((r) => r.typing.n > 0 && r.typing.drawFrames >= 0.8 * r.typing.n);
    ok(`MUT premise: the mutant landed - with its damping skipped the layer drew through the typing (>= 80% of the frames while the keys landed, every round)`, mLanded,
      JSON.stringify(res.M.map((r) => ({ round: r.round, typingFrames: r.typing.n, drew: r.typing.drawFrames }))));
    ok(`MUT the no-damping mutant FAILS the probe (caught by L: ${m.lat ? 'no' : 'YES'}; caught by D: ${m.damp ? 'no' : 'YES'}) - M median ${r1(m.X.median)} p95 ${r1(m.X.p95)} max ${r1(m.X.max)}, ${m.xDraws} drawing frame(s) while typing`,
      mLanded && !(m.lat && m.damp), `C ${show(m.C)} | M ${show(m.X)}`);
  }

  // ---- the per-frame cost (information): the loaded arm undamped at rest, against the control at rest
  const undamped = MUTANT_RUN ? res.T : res.M.concat(res.T);
  const cb = stat(undamped.flatMap((r) => r.idle.cbMs)), dt = stat(undamped.flatMap((r) => r.idle.dt));
  const cCb = stat(res.C.flatMap((r) => r.idle.cbMs)), cDt = stat(res.C.flatMap((r) => r.idle.dt));
  const over = undamped.flatMap((r) => r.idle.dt).filter((x) => x > 1000 / 60 + 2).length;
  ok(`COST (information) the drawing layer per frame at ${VIEW.join('x')}, full motion, undamped at rest: rAF time median ${r1(cb.median)} ms, p95 ${r1(cb.p95)}, max ${r1(cb.max)} (control ${r1(cCb.median)} / ${r1(cCb.p95)}); frame interval median ${r1(dt.median)} ms, p95 ${r1(dt.p95)} (control ${r1(cDt.median)} / ${r1(cDt.p95)}); ${over}/${dt.n} frames over 18.7 ms`,
    true, '');

  // ---- the build
  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served.size === 1 && served.has(BUILD.bundle) && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-LATENCY VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-LATENCY VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

// FLUX WIRE IN - THE LATENCY PROBE WITHOUT THE FLAG (Fable, Nov 12: "a box turn: typing speed in Wire In without the flag"). A TIMING file: a box turn (on a hosted runner its L lines are information, as in flux3-latency.mjs).
// The claim: typing in the Corridor, on today's Flux, with NO ?flux3=1, adds no measurable keystroke latency over the same page in Arbor (flux3-latency's method, judged against a control).
//
// FOUR ARMS, interleaved in rounds (the order rotates each round; one discarded warm-up), each on the SAME loose page re-seeded to the same text through the app's seam, at 1920x1080, Page: Dark, the Typewriter off:
//   C  the control: Arbor today (theme plateau), the page in Draft (the ordinary page), no flag.
//   X  information only: Flux, the page in TEXT (Draft), no flag (SPLIT prints C / X / W: the theme's share and the Corridor's).
//   W  the claim: Flux, the page opened as a loose page opens (Wire In: the Corridor, data-flux3-jacked), no flag.
//   M  the MUTANT: W with an UNDAMPED drawing layer under it (flux3-latency's stand-in, damping skipped: it draws every frame while she types). It must FAIL L.
// Keys: one character every ~90 ms, the latency of each read IN the page as rhizome-latency and flux3-latency read it (keydown -> the second animation frame after its `beforeinput`).
// VERDICTS: L  W's pooled median <= C's + C's median spread, W's pooled p95 <= C's + C's p95 spread, and no W key over 100 ms.
//   MUT-b  the mutant FAILS L (its premise asserted first: its layer really drew through the typing).
//   Premises: P1 each arm stood where it claims (theme, no flag in the URL or on the root, Wire In mounted in W and M and in no other arm, the stand-in only in M), P2 the Typewriter off in every arm,
//   P5 at least 40 keys painted per arm per round, P6 every typed key reached the stored page, B the build is the one served (built after the last src commit).
// FLUX_WIREIN_ROUNDS=<n> (default 4). Run: node scripts/harness/flux-wirein-latency.mjs   (from apps/desktop; a box turn)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { isOnBox, timingGate } from '../lib/timing-gate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ROUNDS = Math.max(3, Number(process.env.FLUX_WIREIN_ROUNDS || 4));
const KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100, IDLE_MS = 1500, BUSY_MS = 600;
const VIEW = [1920, 1080];
const LOAD = { traces: 300, electrons: 120, busyMs: BUSY_MS };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const ON_BOX = isOnBox();
const timing = (name, pass, detail = '') => {
  const g = timingGate(ON_BOX, pass);
  checks.push({ name: g.info ? `${name} [INFORMATION on Actions: the measure ${g.actual ? 'PASSED' : 'did NOT pass'}; this line gates nothing here]` : name, pass: g.pass, detail });
  if (g.info && !g.actual) console.log(`INFO (would have failed on the box) ${name} -- ${detail}`);
};

// ---- the build this run uses (flux3-latency's B check, the same method)
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
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale}`);

// ---- the outside instrument (a new-document script, in every arm alike): requestAnimationFrame timed per callback, canvas draw calls counted per frame
const INSTRUMENT = `(() => {
  if (window.__wli) return;
  const I = window.__wli = { frames: [], calls: 0, cbMs: 0 };
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) { I.calls += 1; return o.apply(this, a); };
  }
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => { const t0 = performance.now(); try { cb(ts); } finally { I.cbMs += performance.now() - t0; } });
  let last = performance.now();
  const tick = () => {
    const now = performance.now();
    I.frames.push([now, now - last, I.calls, I.cbMs]);
    I.calls = 0; I.cbMs = 0; last = now;
    if (I.frames.length > 40000) I.frames.splice(0, 20000);
    raf(tick);
  };
  raf(tick);
})();`;

// ---- the stand-in drawing layer, UNDAMPED (the mutant's load; flux3-latency's, stringified into the page, self-contained)
function standIn(opts) {
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
  let raf = 0;
  const frame = (t) => { raf = requestAnimationFrame(frame); draw(t); };   // UNDAMPED: it draws every frame, typing or not
  draw(performance.now());
  raf = requestAnimationFrame(frame);
  return true;
}

// ---- statistics
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const show = (st) => JSON.stringify({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
// the verdict, one pure function, used for W and for the mutant alike
function judge(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(r.lat).median), cP95s = cRounds.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap((r) => r.lat)), X = stat(xRounds.flatMap((r) => r.lat));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const lat = enough && X.median <= C.median + spreadMed && X.p95 <= C.p95 + spreadP95 && X.max <= MAX_MS;
  return { lat, C, X, spreadMed, spreadP95, enough };
}

const SEED = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
// mode: 'draft' = the page stored in Draft; null = no stored mode, so a loose page opens as it does (Wire In in Flux)
const ARMS = {
  C: { theme: 'plateau', mode: 'draft', load: false },
  X: { theme: 'flux', mode: 'draft', load: false },
  W: { theme: 'flux', mode: null, load: false },
  M: { theme: 'flux', mode: null, load: true },
};

try { await withHarness(async (app) => {
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await app.evalJs(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };

  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  // ONE loose page, through the app's seam, made on the Desk (a surface with no flush handler)
  const pageId = `wil-${Date.now()}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: pageId, text: SEED, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(400);

  let cursor = 0;
  const runArm = async (name, round) => {
    const arm = ARMS[name];
    // off the page (the Desk has no flush handler), re-seed through the seam, then the theme, the tone, the mode, the Typewriter off, and NO flag
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: ${JSON.stringify(SEED)} })`);
    await app.evalJs(`localStorage.setItem('wrizo-theme', ${JSON.stringify(arm.theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));
      (() => { const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { typewriter: false }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })();
      localStorage.setItem('wrizo-typewriter-page-${pageId}', 'off');
      ${arm.mode ? `localStorage.setItem('wrizo-mode-page-${pageId}', 'drafting');` : `localStorage.removeItem('wrizo-mode-page-${pageId}');`}`);
    await app.evalJs(`history.replaceState(null, '', '/#/page/' + ${JSON.stringify(pageId)})`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'page after reload' }).catch(() => {});
    await splashGone();
    // Wire In: the entry line (3 s + 0.6 s fade) has gone before the clock starts; the others wait out the mode's own re-persist (~1.1 s)
    await sleep(arm.mode ? 1500 : 4300);
    const rectOf = "(() => { const r = document.querySelector('.mode-page')?.getBoundingClientRect(); return r ? [r.x, r.y, r.width, r.height].map((v) => v.toFixed(2)).join(',') : null; })()";
    if (arm.load) await app.evalJs(`(${standIn.toString()})(${JSON.stringify(LOAD)})`);
    await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    const idle0 = await app.evalJs('performance.now()');
    await sleep(IDLE_MS);
    const idle1 = await app.evalJs('performance.now()');
    const where = await app.evalJs(`(() => { const root = document.documentElement, tab = document.querySelector('[data-mode-key][aria-selected="true"]'), tw = document.querySelector('.mode-scroll[data-typewriter]');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
      return { theme: root.getAttribute('data-theme'), page: root.getAttribute('data-page'), queryFlag: new URLSearchParams(location.search).get('flux3'), rootFlag: root.hasAttribute('data-flux3'),
        jacked: root.hasAttribute('data-flux3-jacked'), corridor: !!document.querySelector('[data-flux3-corridor]'), standin: !!document.querySelector('canvas.flux3-standin'),
        mode: tab ? tab.getAttribute('data-mode-key') : null, typewriter: tw ? tw.getAttribute('data-typewriter') : null, served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null,
        instrument: !!window.__wli, rect: ${rectOf} }; })()`);
    // the meter (rhizome-latency's and flux3-latency's, verbatim in method)
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
      const lat = window.__lat.slice(), fr = window.__wli ? window.__wli.frames.slice() : [];
      const k0 = lat.length ? Math.min(...lat.map((x) => x.key)) : 0, k1 = lat.length ? Math.max(...lat.map((x) => x.at)) : 0;
      const pick = (a, b) => fr.filter((f) => f[0] >= a && f[0] <= b);
      const sum = (fs) => ({ n: fs.length, drawFrames: fs.filter((f) => f[2] > 0).length, cbMs: fs.map((f) => f[3]), dt: fs.map((f) => f[1]) });
      return { lat: lat.map((x) => x.ms), idle: sum(pick(${idle0}, ${idle1})), typing: sum(pick(k0, k1)) };
    })()`);
    // every typed key reached the stored page (read after the debounced save lands: wait on the STORED value)
    const nonWs = (s) => String(s || '').replace(/\s+/g, '').length;
    const want = nonWs(SEED) + nonWs(typed);
    const storedExpr = `((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(pageId)}) || {}).text || '')`;
    let saved = false;
    try { await app.waitFor(`${storedExpr}.replace(/\\s+/g, '').length === ${want}`, { timeout: 8000, label: 'typed text saved' }); saved = true; } catch { saved = false; }
    const storedLen = await app.evalJs(`${storedExpr}.replace(/\\s+/g, '').length`);
    return { name, round, where, ...got, saved, storedLen, want };
  };

  // warm-up (discarded), then the rounds, the arm order rotating each round
  await runArm('C', 0);
  const order = ['C', 'X', 'W', 'M'];
  const res = { C: [], X: [], W: [], M: [] };
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = order.slice((round - 1) % order.length).concat(order.slice(0, (round - 1) % order.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }
  const all = [...res.C, ...res.X, ...res.W, ...res.M];

  // ---- premises
  const placed = all.filter((r) => {
    const a = ARMS[r.name], w = r.where, wired = r.name === 'W' || r.name === 'M';
    return w.theme === a.theme && w.page === 'dark' && w.queryFlag === null && !w.rootFlag && w.jacked === wired && w.corridor === wired && w.standin === a.load && w.instrument;
  });
  ok(`P1 every arm stood where it claims (C: Arbor; X: Flux in TEXT; W and M: Flux with Wire In mounted, the Corridor present; no ?flux3 in the URL and none on the root in any arm; the stand-in in M only; Page: Dark; the instrument in place): ${placed.length}/${all.length}`,
    placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 2).map((r) => ({ arm: r.name, round: r.round, where: r.where }))));
  const tw = all.filter((r) => r.where.typewriter === 'true');
  ok(`P2 the paper Typewriter is off in every arm: ${all.length - tw.length}/${all.length}`, tw.length === 0, JSON.stringify(tw.map((r) => ({ arm: r.name, round: r.round }))));
  const loadedM = res.M;
  const thin = all.filter((r) => r.lat.length < MIN_KEYS);
  ok(`P5 at least ${MIN_KEYS} keys painted in every arm-round (${KEYS} typed each)`, thin.length === 0, JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round, n: r.lat.length }))));
  const lost = all.filter((r) => !r.saved);
  ok('P6 no key was dropped: in every arm-round the stored page holds the seed plus every typed character', lost.length === 0, JSON.stringify(lost.map((r) => ({ arm: r.name, round: r.round, stored: r.storedLen, want: r.want }))));

  // ---- the verdicts
  const cRounds = res.C.map((r) => `${r1(stat(r.lat).median)}/${r1(stat(r.lat).p95)}`).join(' ');
  const w = judge(res.C, res.W);
  timing(`L typing in Wire In on today's Flux (no flag) adds no latency beyond the control's own spread: W median ${r1(w.X.median)} <= C ${r1(w.C.median)} + ${r1(w.spreadMed)}, W p95 ${r1(w.X.p95)} <= C ${r1(w.C.p95)} + ${r1(w.spreadP95)}, no W key over ${MAX_MS} ms`,
    w.lat, `C ${show(w.C)} | W ${show(w.X)} | C per round median/p95 ${cRounds}`);
  const xS = stat(res.X.flatMap((r) => r.lat)), cS = stat(res.C.flatMap((r) => r.lat)), wS = stat(res.W.flatMap((r) => r.lat));
  ok(`SPLIT (information) median/p95 ms: C Arbor ${r1(cS.median)}/${r1(cS.p95)} | X Flux TEXT ${r1(xS.median)}/${r1(xS.p95)} | W Wire In ${r1(wS.median)}/${r1(wS.p95)}`, true, '');
  const m = judge(res.C, res.M);
  const mLanded = loadedM.length > 0 && loadedM.every((r) => r.typing.n > 0 && r.typing.drawFrames >= 0.8 * r.typing.n);
  ok('MUT premise: the mutant landed - with its layer undamped it drew through the typing (>= 80% of the frames while the keys landed, every round)', mLanded,
    JSON.stringify(loadedM.map((r) => ({ round: r.round, typingFrames: r.typing.n, drew: r.typing.drawFrames }))));
  timing(`MUT-b the undamped-layer mutant FAILS L (M median ${r1(m.X.median)} p95 ${r1(m.X.p95)} max ${r1(m.X.max)} against C ${r1(m.C.median)} / ${r1(m.C.p95)}; caught: ${m.lat ? 'NO' : 'YES'})`,
    mLanded && !m.lat, `C ${show(m.C)} | M ${show(m.X)}`);

  // ---- the build
  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served.size === 1 && served.has(BUILD.bundle) && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX-WIREIN-LATENCY VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-WIREIN-LATENCY VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

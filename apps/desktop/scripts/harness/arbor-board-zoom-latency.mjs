// ARBOR-BOARD-ZOOM-LATENCY (ARBOR, Nov 24; Fable's orders-nov24.md, ARBOR item 1: "Typing on a Board must stay under the bar with a zoomed Board open"). The Arbor and Machina board zoom
// (arbor-board-zoom.mjs; Flux's camera, flux-zoom-1) adds a camera to their full Board, so this probe types INTO A CARD at three scales in each theme and judges each zoomed arm against the SAME theme
// at true size: flux3-latency-zoom.mjs's method, meter, bar, cost reading, cap and mutants, VERBATIM in method (that file's gate, RULED Nov 14, 12:24 pm, Fable: the zoom against true size, the clock and
// the cost reading, the control's own spread, the cost capped at 8 / 12 ms, a control over the cap VOID). A timing file: it gates on the box; on Actions its timing lines are information.
//   A100 / A020 / A400   Arbor (theme plateau), the camera at 1.00 / 0.20 / 4.00 (the board is tall enough that the outer limit lies below 0.20, so the seam lands on 0.20 exactly)
//   M100 / M020 / M400   Machina, the same
//   MUT                  A400 plus a synthetic 24 ms burn on every beforeinput: the zoom bar's own mutant, judged against A100 as the gate judges
//   MUT5 / MUT10 / MUT24 A100 plus a 5 / 10 / 24 ms burn: MUTS-ORDER (their lifts must rise with the burn, else the run is not valid) and PROBE-SEES (the smallest burn this probe sees)
// Each arm: the same seven-card board re-seeded through the app's seam at the Desk (a route with no flush handler), opened, scaled through the camera's own seam (window.wrizoFluxZoomTo), the card
// centred, double-clicked open, the editor focused, then 44 keys one every 90 ms, each read keydown -> the second animation frame after its beforeinput (the clock) and keydown -> the input event (WORK,
// the cost reading). The arm order rotates each round; one discarded warm-up. 1920x1080, Page: Dark.
// VERDICTS: L-zoom-gate@S and L-zoom-cost-gate@S per theme at 0.20 and 4.00 (timing); VOID-check per theme's 1.00; MUT-z-cost (the burn at 4.00 is caught); MUTS-ORDER; P1 / P5 / P6 premises; B the build.
// FLUX3_ROUNDS=<n> (default 4). Run: node scripts/harness/arbor-board-zoom-latency.mjs   (from apps/desktop; a box turn)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.env.WS_PLACE = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_REORG = '1';
const { withHarness } = await import('../runtime-verify.mjs');
const { isOnBox, timingGate } = await import('../lib/timing-gate.mjs');

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ROUNDS = Math.max(3, Number(process.env.FLUX3_ROUNDS || 4));
const KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100, IDLE_MS = 1500, BURN_MS = 24;
const VIEW = [1920, 1080];
const BOARD = 'abzl-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const ON_BOX = isOnBox();
const timing = (name, pass, detail = '') => {
  const g = timingGate(ON_BOX, pass);
  checks.push({ name: g.info ? `${name} [INFORMATION on Actions: the measure ${g.actual ? 'PASSED' : 'did NOT pass'}; this line gates nothing here]` : name, pass: g.pass, detail });
  if (g.info && !g.actual) console.log(`INFO (would have failed on the box) ${name} -- ${detail}`);
};

// ---- the build this run uses (flux3-latency's own reading)
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

// ---- statistics (flux3-latency-zoom's, verbatim)
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const show = (st) => JSON.stringify({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
function judge(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(r.lat).median), cP95s = cRounds.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap((r) => r.lat)), X = stat(xRounds.flatMap((r) => r.lat));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const lat = enough && X.median <= C.median + spreadMed && X.p95 <= C.p95 + spreadP95 && X.max <= MAX_MS;
  return { lat, C, X, spreadMed, spreadP95, enough };
}
// the COST reading (flux3-latency-zoom's WORK: keydown capture -> the input event's bubble at the document), capped as Fable ruled Nov 14
const CAP_MED = 8, CAP_P95 = 12;
const FLOOR_MED = 1, FLOOR_P95 = 2;
const costOf = (r) => (r.ks || []).map((k) => k[7]).filter((x) => x != null);
function judgeCost(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(costOf(r)).median), cP95s = cRounds.map((r) => stat(costOf(r)).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap(costOf)), X = stat(xRounds.flatMap(costOf));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const quiet = spreadMed <= CAP_MED && spreadP95 <= CAP_P95;
  const allowMed = Math.min(Math.max(spreadMed, FLOOR_MED), CAP_MED), allowP95 = Math.min(Math.max(spreadP95, FLOOR_P95), CAP_P95);
  const within = X.median <= C.median + allowMed && X.p95 <= C.p95 + allowP95;
  return { enough, quiet, within, pass: enough && quiet && within, caught: enough && quiet && !within, C, X, spreadMed, spreadP95, allowMed, allowP95 };
}

const CYCLE = 'the board holds still while she writes on ';
const ARMS = {
  A100: { theme: 'plateau', scale: 1, burn: false }, A020: { theme: 'plateau', scale: 0.2, burn: false }, A400: { theme: 'plateau', scale: 4, burn: false },
  M100: { theme: 'machina', scale: 1, burn: false }, M020: { theme: 'machina', scale: 0.2, burn: false }, M400: { theme: 'machina', scale: 4, burn: false },
  MUT: { theme: 'plateau', scale: 4, burn: BURN_MS },
  MUT5: { theme: 'plateau', scale: 1, burn: 5 }, MUT10: { theme: 'plateau', scale: 1, burn: 10 }, MUT24: { theme: 'plateau', scale: 1, burn: BURN_MS },
};
const makeBoxes = () => {
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [
    T('z-a', 0.05, 0.05, 1, 'Card A'), T('z-b', 0.5, 0.05, 2, 'Card B'), T('z-c', 0.05, 0.4, 3, 'Card C'), T('z-d', 0.5, 0.4, 4, 'Card D'),
    T('z-e', 0.05, 0.75, 5, 'Card E'), T('z-f', 0.5, 0.75, 6, 'Card F'), T('z-g', 0.75, 0.4, 7, 'Card G'),
    L('z-ac', 'z-a', 'z-c', 10), L('z-bd', 'z-b', 'z-d', 11), L('z-ef', 'z-e', 'z-f', 12),
    { id: 'z-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 3400 },
  ];
};

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };

  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' })); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 15000 });
  await ev(`(() => { window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Zoom latency', pageType: 'board', boxes: makeBoxes(), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })}); window.wrizoFlushNow(); return null; })()`);
  await sleep(500);

  const runArm = async (name, round) => {
    const arm = ARMS[name];
    // off the board (the Desk has no flush handler), the cards back to their seed through the seam (it flushes before it returns), then the theme through its seam
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BOARD)}, { boxes: ${JSON.stringify(makeBoxes())} })`);
    await ev(`(() => { window.wrizoTheme.set(${JSON.stringify(arm.theme)}); return null; })()`);
    await ev(`history.replaceState(null, '', '/#/page/${BOARD}'); null`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"z-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await sleep(1400);
    let landed = null;
    if (arm.scale !== 1) { landed = await ev(`typeof window.wrizoFluxZoomTo === 'function' ? window.wrizoFluxZoomTo(${arm.scale}) : null`); await sleep(1000); }
    await ev(`(() => { const wrap = document.querySelector('.board-canvas-wrap'), e = document.querySelector('.board-box[data-box-id="z-d"]'); if (!wrap || !e) return null; const r = e.getBoundingClientRect(), w = wrap.getBoundingClientRect(); wrap.scrollLeft += (r.left + r.width / 2) - (w.left + wrap.clientWidth / 2); wrap.scrollTop += (r.top + r.height / 2) - (w.top + wrap.clientHeight / 2); return null; })()`);
    await sleep(900);
    const b = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"z-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
    if (b) await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return null; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); return null; })()");
    await sleep(IDLE_MS);
    const where = await ev(`(() => { const root = document.documentElement, cv = document.querySelector('.board-canvas'), cr = cv && cv.getBoundingClientRect(), ed = document.querySelector('.board-popup-editor');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
      return { theme: root.getAttribute('data-theme'), bar: document.querySelectorAll('[data-board-zoom]').length, layer: document.querySelectorAll('[data-flux3-layer]').length,
        scale: cr && cv.offsetWidth ? cr.width / cv.offsetWidth : null, focused: !!ed && document.activeElement === ed, before: ed ? ed.textContent.length : -1,
        served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null }; })()`);
    // the meter (flux3-latency-zoom's, verbatim in method)
    await ev(`(() => {
      window.__lat = []; window.__ks = []; let t0 = 0, cur = null;
      if (window.__latOff) window.__latOff();
      const kd = () => { t0 = performance.now(); cur = { kd: t0, bi: null, f1: null, f2: null, busy: null, frame: null, work: null, b0: null, b1: null }; window.__ks.push(cur); };
      const bi = () => { const t = t0, k = cur; if (k) k.bi = performance.now() - t; requestAnimationFrame(() => { const r = performance.now(); if (k) k.f1 = r - t; const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - r; mc.port1.close(); }; mc.port2.postMessage(0); requestAnimationFrame(() => { const now = performance.now(); if (k) k.f2 = now - t; window.__lat.push({ ms: now - t, key: t, at: now }); }); }); };
      const inp = () => { const k = cur; if (k) k.work = performance.now() - k.kd; if (!k || k.busy !== null || k.posted) return; k.posted = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - k.kd; mc.port1.close(); }; mc.port2.postMessage(0); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true); document.addEventListener('beforeinput', inp, false); document.addEventListener('input', inp, false);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); document.removeEventListener('beforeinput', inp, false); document.removeEventListener('input', inp, false); };
      return true; })()`);
    // the burn (the mutants), installed AFTER the meter, as flux3-latency-zoom installs it
    if (arm.burn) await ev(`(() => { window.__burnN = 0; document.addEventListener('beforeinput', () => { const t = performance.now(); while (performance.now() - t < ${arm.burn}) { /* burn */ } window.__burnN += 1; const k = window.__ks[window.__ks.length - 1]; if (k) { k.b0 = t - k.kd; k.b1 = performance.now() - k.kd; } }, true); return true; })()`);
    let typed = '';
    for (let i = 0; i < KEYS; i += 1) { const ch = CYCLE[(round * 7 + i) % CYCLE.length]; typed += ch; await app.typeKeys(ch); await sleep(GAP); }
    await sleep(250);
    const got = await ev(`(() => {
      const ed = document.querySelector('.board-popup-editor');
      return { lat: window.__lat.map((x) => x.ms), after: ed ? ed.textContent.length : -1, burned: window.__burnN || 0,
        ks: window.__ks.map((k) => [k.bi, k.f1, k.f2, k.busy, k.b0, k.b1, k.frame, k.work].map((x) => (x == null ? null : Math.round(x * 10) / 10))) };
    })()`);
    return { name, round, where, landed, typed: typed.length, ...got };
  };

  // warm-up (discarded), then the rounds, the arm order rotating each round
  await runArm('A100', 0);
  const order = Object.keys(ARMS);
  const res = Object.fromEntries(order.map((k) => [k, []]));
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = order.slice((round - 1) % order.length).concat(order.slice(0, (round - 1) % order.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }
  const all = Object.values(res).flat();

  // ---- premises
  const placed = all.filter((r) => {
    const a = ARMS[r.name], w = r.where;
    const scaleOk = w.scale != null && Math.abs(w.scale - a.scale) <= (a.scale === 1 ? 0.003 : 0.002 * a.scale + 0.001);
    return w.theme === a.theme && w.bar === 1 && w.layer === 0 && scaleOk && w.focused;
  });
  ok(`P1 every arm stood where it claims (its theme, the zoom bar there, no Flux layer, the camera at 1.00 / 0.20 / 4.00 as MEASURED on the canvas, the card editor focused): ${placed.length}/${all.length}`,
    placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 3).map((r) => ({ arm: r.name, round: r.round, where: r.where, landed: r.landed }))));
  const thin = all.filter((r) => r.lat.length < MIN_KEYS);
  ok(`P5 at least ${MIN_KEYS} keys painted in every arm-round (${KEYS} typed each)`, thin.length === 0, JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round, n: r.lat.length }))));
  const lost = all.filter((r) => r.after - r.where.before !== r.typed);
  ok('P6 no key was dropped: in every arm-round the card editor grew by exactly the characters typed', lost.length === 0, JSON.stringify(lost.slice(0, 4).map((r) => ({ arm: r.name, round: r.round, grew: r.after - r.where.before, typed: r.typed }))));

  // ---- the verdicts: each theme's zoom against the same theme at true size (the ruled gate)
  const S = Object.fromEntries(Object.keys(res).map((k) => [k, stat(res[k].flatMap((r) => r.lat))]));
  const costS = Object.fromEntries(Object.keys(res).map((k) => [k, stat(res[k].flatMap(costOf))]));
  const perRound = (k, f = (r) => r.lat) => res[k].map((r) => `${r1(stat(f(r)).median)}/${r1(stat(f(r)).p95)}`).join(' ');
  for (const [T, name] of [['A', 'Arbor'], ['M', 'Machina']]) {
    const base = `${T}100`;
    const q = judgeCost(res[base], res[base]);
    timing(`VOID-check ${name} at 1.00, the zoom's control, is quiet enough to judge anything: its cost spread (median ${r1(q.spreadMed)}, p95 ${r1(q.spreadP95)}) is within the cap (${CAP_MED} / ${CAP_P95}); over the cap the run is VOID`, q.quiet, `${base} cost ${show(q.C)} | per round ${perRound(base, costOf)}`);
    for (const [arm, label] of [[`${T}020`, '0.20'], [`${T}400`, '4.00']]) {
      const jc = judge(res[base], res[arm]);
      timing(`L-zoom-gate@${label} ${name}: the zoom adds no latency beyond ${name}'s own at true size (the clock): ${arm} median ${r1(jc.X.median)} <= ${base} ${r1(jc.C.median)} + ${r1(jc.spreadMed)}, p95 ${r1(jc.X.p95)} <= ${base} ${r1(jc.C.p95)} + ${r1(jc.spreadP95)}, no key over ${MAX_MS} ms (max ${r1(jc.X.max)})`, jc.lat, `${base} ${show(jc.C)} | ${arm} ${show(jc.X)} | ${base} per round ${perRound(base)}`);
      const k = judgeCost(res[base], res[arm]);
      timing(`L-zoom-cost-gate@${label} ${name}: the zoom adds no main-thread cost beyond ${name}'s own at true size (capped): ${arm} cost median ${r1(k.X.median)} <= ${base} ${r1(k.C.median)} + ${r1(k.allowMed)}, p95 ${r1(k.X.p95)} <= ${base} ${r1(k.C.p95)} + ${r1(k.allowP95)}`, k.pass, `${base} ${show(k.C)} | ${arm} ${show(k.X)} | spread ${r1(k.spreadMed)}/${r1(k.spreadP95)} quiet ${k.quiet}`);
    }
  }
  ok(`SPLIT (information) clock median/p95 ms: A100 ${r1(S.A100.median)}/${r1(S.A100.p95)} | A020 ${r1(S.A020.median)}/${r1(S.A020.p95)} | A400 ${r1(S.A400.median)}/${r1(S.A400.p95)} | M100 ${r1(S.M100.median)}/${r1(S.M100.p95)} | M020 ${r1(S.M020.median)}/${r1(S.M020.p95)} | M400 ${r1(S.M400.median)}/${r1(S.M400.p95)}`, true, '');
  ok(`SPLIT-COST (information) cost median/p95 ms: A100 ${r1(costS.A100.median)}/${r1(costS.A100.p95)} | A020 ${r1(costS.A020.median)}/${r1(costS.A020.p95)} | A400 ${r1(costS.A400.median)}/${r1(costS.A400.p95)} | M100 ${r1(costS.M100.median)}/${r1(costS.M100.p95)} | M020 ${r1(costS.M020.median)}/${r1(costS.M020.p95)} | M400 ${r1(costS.M400.median)}/${r1(costS.M400.p95)} | A100+5 ${r1(costS.MUT5.median)}/${r1(costS.MUT5.p95)} | A100+10 ${r1(costS.MUT10.median)}/${r1(costS.MUT10.p95)} | A400+${BURN_MS} ${r1(costS.MUT.median)}/${r1(costS.MUT.p95)}`, true, '');

  // ---- the mutants
  const mutLanded = (k) => res[k].length > 0 && res[k].every((r) => r.burned >= MIN_KEYS);
  for (const [k, ms] of [['MUT', BURN_MS], ['MUT5', 5], ['MUT10', 10], ['MUT24', BURN_MS]]) ok(`${k} premise: the ${ms} ms burn landed on every key (${res[k].map((r) => r.burned).join('/')} keys burned)`, mutLanded(k), JSON.stringify(res[k].map((r) => ({ round: r.round, burned: r.burned }))));
  const cz = judgeCost(res.A100, res.MUT);
  timing(`MUT-z-cost the ${BURN_MS} ms burn at 4.00 FAILS the zoom bar, judged against A100 (caught: ${cz.caught ? 'YES' : 'no'}) - MUT cost median ${r1(cz.X.median)} p95 ${r1(cz.X.p95)}`, mutLanded('MUT') && cz.caught, `A100 ${show(cz.C)} | MUT ${show(cz.X)}`);
  const lift = (k) => costS[k].median - costS.A100.median;
  const l5 = lift('MUT5'), l10 = lift('MUT10'), l24 = lift('MUT24');
  timing(`MUTS-ORDER the three mutants lift A100's cost median in order, +5 ms -> +${r1(l5)}, +10 ms -> +${r1(l10)}, +${BURN_MS} ms -> +${r1(l24)} (the run is NOT VALID unless the lifts rise with the burn)`, l5 < l10 && l10 < l24,
    JSON.stringify({ c: show(costS.A100), m5: show(costS.MUT5), m10: show(costS.MUT10), m24: show(costS.MUT24) }));
  const cj = Object.fromEntries(['MUT5', 'MUT10', 'MUT24'].map((k) => [k, judgeCost(res.A100, res[k])]));
  const seen = [['MUT5', 5], ['MUT10', 10], ['MUT24', BURN_MS]].filter(([k]) => cj[k].caught && lift(k) >= 2 * cj[k].allowMed).map(([, ms]) => ms);
  const seesLine = `PROBE-SEES this probe sees a burn of ${seen.length ? Math.min(...seen) + ' ms or more' : 'NOTHING'} on the card editor (the allowance ${r1(cj.MUT5.allowMed)} / ${r1(cj.MUT5.allowP95)}; lifts +5 -> ${r1(l5)}, +10 -> ${r1(l10)}, +${BURN_MS} -> ${r1(l24)})`;
  console.log(seesLine);
  ok(`${seesLine} (information)`, true, '');

  // ---- the build
  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served.size === 1 && served.has(BUILD.bundle) && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nARBOR-BOARD-ZOOM-LATENCY VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nARBOR-BOARD-ZOOM-LATENCY VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

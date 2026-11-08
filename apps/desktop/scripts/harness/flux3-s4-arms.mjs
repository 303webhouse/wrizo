// FLUX3 S4 - THE LATENCY EXPERIMENT (Fable, Nov 8). The quiet re-run's L red is real (J 33.3/54.7 vs C 25.6/33.1 ms, median/p95) and the budget
// is NOT loosened. ONE experiment turn on a quiet PC: each option a LANDED arm against the same control, median/p95 per arm, and frames per arm
// (light and dark: the frames job's arm-* screens). Nick picks from that. NOTHING IS BUILT FOR REAL: every arm is an in-flight patch of the
// served files (scripts/flux3-s4-arms.mjs), each patch matching its file exactly once, and its effect read on the page.
//
//   C        the control: Flux, flag off, today's Typewriter on (L's control).
//   J        Jacked In as built. K: the tunnel never mounted (L's information arm).
//   hold     (1) the tunnel holds while keys land.          light    (2) a lighter tunnel: 6 frames of 110%, no rays.
//   margins  (3) the tunnel clipped to the margins.         veil     (4) the veil a rectangle clip, not a mask; veilK the same without the tunnel.
//
// The method is L's (flux3-s4.mjs): key -> two frames after its beforeinput (rhizome-latency's), KEYS keys GAP ms apart on each arm's own fresh
// page (seeded through the seam), a warm-up round thrown away, then ARMS_ROUNDS rounds; the order rotates every round, so no arm always
// follows the same one. VERDICTS are only that each arm STOOD (landed, and its effect on the page) every round, that the readers tell every arm
// from J (liveness), and that every arm got its keys. The timings are INFORMATION for Nick, each arm against C with L's budget (C's own round
// spread) printed beside it: on Actions they are the hosted runner's, never the box's.
//
// Run: node scripts/harness/flux3-s4-arms.mjs (from apps/desktop; a box turn for the numbers). ARMS_ROUNDS (default 2; the experiment turn: 6).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { ARMS, installArms, STAND, READ, STOOD } from '../flux3-s4-arms.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const ROUNDS = Math.max(1, Number(process.env.ARMS_ROUNDS) || 2);
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const KEYS = 44, MIN_KEYS = 40, GAP = 90;
const ORDER = ['C', 'J', 'K', 'hold', 'light', 'margins', 'veil', 'veilK'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

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
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale} machine=${ON_BOX ? 'box' : 'actions'} rounds=${ROUNDS}`);

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const arms = await installArms(app);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const toEnd = "(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()";

  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const mk = (row) => ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);

  // preferences (not collections), set before the reload as the app reads them at boot (flux3-s4.mjs's open, dark, Ambiance 50, 1920x1080)
  const open = async ({ flag, id, prefs }) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }, ${JSON.stringify(prefs)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await ev(toEnd);
    await app.mouseMove(8, 8);
    await sleep(1600);
  };

  const lat = Object.fromEntries(ORDER.map((a) => [a, []]));
  const stood = Object.fromEntries(ORDER.map((a) => [a, []]));
  let cursor = 0;
  for (let round = 0; round <= ROUNDS; round += 1) {
    const order = ORDER.map((_, i) => ORDER[(i + round) % ORDER.length]);
    for (const arm of order) {
      const pid = `f3s4-arms-${arm}-${round}`;
      await mk({ id: pid, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
      await sleep(300);
      if (arm !== 'C') arms.set(arm);
      try { await open({ flag: arm !== 'C', id: pid, prefs: arm === 'C' ? { typewriter: true } : {} }); } finally { arms.set(null); }
      const counts = arm === 'C' ? [] : arms.counts();
      const landed = arm === 'C' || ARMS[arm].patches.every((_, i) => counts[i] === 1);
      await ev(STAND);
      const rest = await ev(READ);
      await ev(`(() => { window.__lat = []; let t0 = 0; if (window.__latOff) window.__latOff();
        const kd = () => { t0 = performance.now(); };
        const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { const now = performance.now(); window.__lat.push({ ms: now - t }); })); };
        document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
        window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`);
      let mid = null;
      for (let i = 0; i < KEYS; i += 1) {
        await app.typeKeys(CYCLE[cursor % CYCLE.length]); cursor += 1;
        // the same mid-burst read on every arm (the control too), so the read's own cost falls on all alike
        if (i === Math.floor(KEYS / 2)) mid = await ev(READ);
        await sleep(GAP);
      }
      await sleep(250);
      const ms = await ev('window.__lat.map((x) => x.ms)');
      const ctlStood = arm === 'C' ? !rest.jacked && rest.zoom === 'true' && !rest.tunnel : null;
      const ran = { round, landed, counts, rest, mid, stood: arm === 'C' ? ctlStood : landed && STOOD[arm](rest, mid) };
      if (round === 0) continue;   // the warm-up round
      lat[arm].push(ms);
      stood[arm].push(ran);
    }
  }

  // ---- verdicts: each arm stood every round; the readers are live; every arm got its keys --------------------------------------------------------
  for (const arm of ORDER) {
    const runs = stood[arm];
    const bad = runs.filter((r) => !r.stood);
    ok(`ARM-${arm} ${arm === 'C' ? 'the control (flag off, the Typewriter on, zoomed, no tunnel)' : `${ARMS[arm].what}: every patch landed once, and its effect read on the page`} in all ${runs.length} rounds`,
      runs.length === ROUNDS && bad.length === 0, JSON.stringify(bad.slice(0, 2).map((r) => ({ round: r.round, landed: r.landed, counts: r.counts, rest: r.rest, mid: r.mid }))));
  }
  const j = stood.J[0];
  const blind = j ? ORDER.filter((a) => a !== 'C' && a !== 'J' && STOOD[a](j.rest, j.mid)) : ['(no J read)'];
  ok(`ARMS-LIVE the readers tell every arm from J: J's own read (unpatched) fails each other arm's predicate${blind.length ? ` (passes: ${blind.join(', ')})` : ''}`, !!j && blind.length === 0, JSON.stringify(j && { rest: j.rest, mid: j.mid }));
  const short = ORDER.flatMap((a) => lat[a].map((l, i) => [a, i, l.length]).filter((x) => x[2] < MIN_KEYS));
  ok(`ARMS-KEYS every arm's every round timed at least ${MIN_KEYS} of ${KEYS} keys`, short.length === 0, JSON.stringify(short));

  // ---- the numbers (information for Nick) ----------------------------------------------------------------------------------------------------------
  const C = stat(lat.C.flat());
  const cMeds = lat.C.map((l) => stat(l).median), cP95s = lat.C.map((l) => stat(l).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  console.log(`INFO ARMS ${ON_BOX ? 'the box' : 'Actions (the hosted runner: never the box\'s numbers)'}, ${ROUNDS} rounds of ${KEYS} keys each, ms key -> paint (median / p95 / max); L's budget: C + C's own round spread (median ${r1(spreadMed)}, p95 ${r1(spreadP95)})`);
  for (const arm of ORDER) {
    const s = stat(lat[arm].flat());
    const within = arm === 'C' ? '' : (s.median <= C.median + spreadMed && s.p95 <= C.p95 + spreadP95 ? ' WITHIN L\'s budget' : ' outside L\'s budget');
    const perRound = lat[arm].map((l) => `${r1(stat(l).median)}/${r1(stat(l).p95)}`).join(' ');
    console.log(`INFO ARM ${arm.padEnd(7)} ${String(r1(s.median)).padStart(5)} / ${String(r1(s.p95)).padStart(5)} / ${String(r1(s.max)).padStart(5)}  vs C ${arm === 'C' ? '    -' : `${s.median - C.median >= 0 ? '+' : ''}${r1(s.median - C.median)} / ${s.p95 - C.p95 >= 0 ? '+' : ''}${r1(s.p95 - C.p95)}`}${within}  (n ${s.n}; rounds ${perRound})  ${arm === 'C' ? 'the control' : ARMS[arm].what}`);
  }

  // ---- B: the build ---------------------------------------------------------------------------------------------------------------------------------
  const served = await ev("([...document.scripts].map((s) => s.getAttribute('src') || '').find((s) => /index-/.test(s)) || '').replace(/^.*\\//, '')");
  ok(`B the build: served ${served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-S4-ARMS VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-S4-ARMS VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

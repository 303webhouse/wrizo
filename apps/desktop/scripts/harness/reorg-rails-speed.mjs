// THE REORG'S RAIL, SPEED (POLISH's plan section 8, cleared by Fable Nov 14: "SPEED on the box, when Chat 1 gives a turn: the rail and its pop-outs do not
// re-render on a keystroke"). Typing in Machina with the rail on adds no keystroke latency over the same page with the switch off, and the rail does
// not render while she types.
//
// TWO ARMS, interleaved in rounds (the order alternates; one discarded warm-up), on the SAME page re-seeded to the same text through the app's seam, at
// 1920x1080, in Draft with the Typewriter off:
//   C  the control: Machina, the switch off (today's strip).
//   R  Machina with ?reorg=1: the rail drawn, three pins on it (pinned through PROJECTS each round: pins live in memory, so a reload forgets them),
//      every pop-out closed, as she writes.
// Keys: one character every ~90 ms; each key's latency read IN the page (keydown -> the second animation frame after its `beforeinput`: the
// rhizome-latency / flux3-latency method, verbatim).
//
//   P1  every arm stood where it claims (Machina; R: the rail with three pins; C: today's strip and no rail)
//   P2  at least MIN_KEYS keys painted in every arm-round, and the stored page holds every typed character (read after the save lands)
//   R1  the rail rendered ZERO times while she typed, in every R round (window.wrizoRailRenders, a counter that exists only under the switch).
//       Not a clock reading: it gates on both machines.
//   L   R's pooled median <= C's pooled median + C's own median spread across rounds, R's pooled p95 <= C's p95 + C's p95 spread, no R key over
//       100 ms. A TIMING line (scripts/lib/timing-gate.mjs): it gates on the box and is information on a hosted runner.
//   B   the build: the bundle served is dist-web's, built after the last src commit, from a clean src (a driver states and checks its build)
//
// Run (repo root; a box turn for L to gate): node apps/desktop/scripts/harness/reorg-rails-speed.mjs   (REORG_SPEED_ROUNDS=n, default 5)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { isOnBox, timingGate } from '../lib/timing-gate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ROUNDS = Math.max(3, Number(process.env.REORG_SPEED_ROUNDS || 5));
const KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100;
const VIEW = [1920, 1080];
const SEED = 'The toll ledgers survive for nineteen of the twenty-two years in question.';
const CYCLE = 'the ledgers were kept at the gate and checked against the returns ';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const ON_BOX = isOnBox();
const timing = (name, pass, detail = '') => {
  const g = timingGate(ON_BOX, pass);
  checks.push({ name: g.info ? `${name} [INFORMATION on Actions: the measure ${g.actual ? 'PASSED' : 'did NOT pass'}; this line gates nothing here]` : name, pass: g.pass, detail });
  if (g.info && !g.actual) console.log(`INFO (would have failed on the box) ${name} -- ${detail}`);
};

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
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale} onBox=${ON_BOX}`);

const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

await withHarness(async (app) => {
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* P1 records what follows */ }
  await app.evalJs("window.wrizoTheme.set('machina')");
  const made = await app.evalJs(`(() => { const W = window; const d = ['Grants', 'Essays', 'Notes'].map((n) => W.wrizoCreateDrawer(n).id);
    const set = W.wrizoCreateProject('Ledgers'); W.wrizoSetProjectDrawer(set.id, d[0]);
    W.wrizoCreateJournalPage({ id: 'rs-page', text: ${JSON.stringify(SEED)}, createdAt: '2026-04-01T00:00:00.000Z', origin: 'project', source: 'page', projectId: set.id });
    W.wrizoFlushNow(); return { drawers: d }; })()`);
  const pageId = 'rs-page';
  let cursor = 0;

  const runArm = async (name, round) => {
    const reorg = name === 'R';
    // re-seed the page to the same text through the app's own seam (off any surface with a flush handler: the Desk), then open it in the arm
    await app.evalJs("location.hash = '#/'"); await sleep(400);
    await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: ${JSON.stringify(SEED)} }); window.wrizoFlushNow && window.wrizoFlushNow();`);
    await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1' : '/'}#/page/${pageId}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
    // DRAFT, the ordinary page (flux3-latency's reason: Free Write reads the shared Typewriter setting, on by default; Draft reads the page's own)
    await app.evalJs("document.querySelector('[data-mode-key=\"draft\"]')?.click()");
    await app.waitFor("document.querySelector('[data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'Draft' }).catch(() => {});
    await sleep(1300);   // the mode switch's own re-persist lands ~1.1 s after it
    if (reorg) {
      await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click()"); await sleep(500);
      for (const id of made.drawers) { await app.evalJs(`document.querySelector('[data-reorg-pin-toggle="${id}"]')?.click()`); await sleep(120); }
      await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(600);
    }
    const where = await app.evalJs(`(() => { const root = document.documentElement, tab = document.querySelector('[data-mode-key][aria-selected="true"]'), tw = document.querySelector('.mode-scroll[data-typewriter]');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
      return { theme: root.getAttribute('data-theme'), flag: new URLSearchParams(location.search).get('reorg'), rail: !!document.querySelector('[data-reorg-rail]'),
        pins: document.querySelectorAll('[data-reorg-rail] [data-reorg-pin]').length, placeBlock: !!document.querySelector('.desk-frame-strip .wz-place-block'),
        open: !!document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel'), mode: tab ? tab.getAttribute('data-mode-key') : null, typewriter: tw ? tw.getAttribute('data-typewriter') : null,
        served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null }; })()`);
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await sleep(300);
    const before = await app.evalJs('window.wrizoRailRenders ? window.wrizoRailRenders() : null');
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
    const lat = await app.evalJs('window.__lat.map((x) => x.ms)');
    const after = await app.evalJs('window.wrizoRailRenders ? window.wrizoRailRenders() : null');
    const nonWs = (s) => String(s || '').replace(/\s+/g, '').length;
    const want = nonWs(SEED) + nonWs(typed);
    const storedExpr = `((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(pageId)}) || {}).text || '')`;
    let saved = false;
    try { await app.waitFor(`${storedExpr}.replace(/\\s+/g, '').length === ${want}`, { timeout: 8000, label: 'typed text saved' }); saved = true; } catch { saved = false; }
    return { name, round, where, lat, renders: before === null || after === null ? null : after - before, saved };
  };

  await runArm('C', 0);   // warm-up, discarded
  const res = { C: [], R: [] };
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const name of round % 2 ? ['C', 'R'] : ['R', 'C']) res[name].push(await runArm(name, round));
  }
  const all = [...res.C, ...res.R];

  const placed = all.filter((r) => r.where.theme === 'machina' && r.where.mode === 'draft' && r.where.typewriter === 'false' && !r.where.open
    && (r.name === 'R' ? r.where.flag === '1' && r.where.rail && r.where.pins === 3 && !r.where.placeBlock : r.where.flag === null && !r.where.rail && r.where.placeBlock));
  ok(`P1 every arm stood where it claims (Machina, Draft, Typewriter off, no pop-out open; R: ?reorg=1, the rail, 3 pins; C: no switch, today's strip): ${placed.length}/${all.length}`,
    placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 2).map((r) => ({ arm: r.name, round: r.round, where: r.where }))));
  const thin = all.filter((r) => r.lat.length < MIN_KEYS || !r.saved);
  ok(`P2 at least ${MIN_KEYS} keys painted in every arm-round (${KEYS} typed each), and the stored page holds every typed character`, thin.length === 0,
    JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round, n: r.lat.length, saved: r.saved }))));
  const rendered = res.R.map((r) => r.renders);
  ok(`R1 the rail rendered ZERO times while she typed, in every R round (renders per round: ${rendered.join(' ')})`, rendered.length === ROUNDS && rendered.every((n) => n === 0), JSON.stringify(rendered));
  const cMeds = res.C.map((r) => stat(r.lat).median), cP95s = res.C.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(res.C.flatMap((r) => r.lat)), R = stat(res.R.flatMap((r) => r.lat));
  const enough = R.n >= MIN_KEYS * ROUNDS && C.n >= MIN_KEYS * ROUNDS;
  timing(`L typing with the rail on adds no latency beyond the control's own spread: R median ${r1(R.median)} <= C ${r1(C.median)} + ${r1(spreadMed)}, R p95 ${r1(R.p95)} <= C ${r1(C.p95)} + ${r1(spreadP95)}, no R key over ${MAX_MS} ms (R max ${r1(R.max)})`,
    enough && R.median <= C.median + spreadMed && R.p95 <= C.p95 + spreadP95 && R.max <= MAX_MS,
    JSON.stringify({ C: { median: r1(C.median), p95: r1(C.p95), max: r1(C.max), n: C.n }, R: { median: r1(R.median), p95: r1(R.p95), max: r1(R.max), n: R.n }, cRounds: res.C.map((r) => `${r1(stat(r.lat).median)}/${r1(stat(r.lat).p95)}`).join(' '), rRounds: res.R.map((r) => `${r1(stat(r.lat).median)}/${r1(stat(r.lat).p95)}`).join(' ') }));
  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    served.size === 1 && [...served][0] === BUILD.bundle && BUILD.stale === false && BUILD.dirtySrc === 0, JSON.stringify(BUILD));
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-RAILS-SPEED VERIFY: PASS (${checks.length} checks)` : `\nREORG-RAILS-SPEED VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

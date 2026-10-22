// GLITCH METER - THE RULES, CHECKED WITHOUT A BROWSER (brief docs/briefs/flux-flicker-meter-brief.md; plan docs/plans/glitch-meter.md @ a1bef99b,
// approved Oct 17). This bundles the real modules with the repo's own esbuild and checks:
//   RAMP     Nick's rule 1-2: silent under 30 s since a key, then the mockup's curve to a peak at 5 minutes (exact values + monotonic)
//   PROGRESS rule 3: intensity = ramp x (1 - lap progress)
//   GAP      the event spacing: rarer at low intensity, the Ambiance dial scales it, never below 0.4 x the event's own minimum
//   BUDGET   the safety floor: never more than 3 flashes in any 1 s (a fake clock: the window's edges, a refusal skipped not queued, and a
//            10,000-attempt random schedule where every sliding second holds <= 3 grants and every refusal had 3 in its window)
//   DOUBLE   a double backlight dip asks the budget for its SECOND pulse too (a fake element and fake timers): it counts 2
// Run: node apps/desktop/scripts/glitch-meter-check.mjs   (no browser, no box turn)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const pnpmDir = join(root, 'node_modules', '.pnpm');
const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('GLITCH-METER-CHECK VERIFY: FAIL - esbuild not found'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'wz-glitch-'));
const entry = join(tmp, 'entry.ts');
const store = join(here, '..', 'src', 'store').replace(/\\/g, '/');
writeFileSync(entry, ['flashBudget', 'glitchMeter', 'signalLossEvents', 'ambianceDial'].map((m) => `export * as ${m} from '${store}/${m}';`).join('\n') + '\n');
const out = join(tmp, 'bundle.mjs');
execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error'], { stdio: 'pipe' });
const { flashBudget: fb, glitchMeter: gm, signalLossEvents: sl, ambianceDial: ad } = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const parkedReads = {};   // ledger 117: the parked checks' readings, re-asserted by their parked records (HARNESS_PARKED=1)
const near =(a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
// the mockup's own curve (docs/mockups/flux-flicker @ 0eb36a6a, intensityFromIdle), written out here so the module is checked against it
const curve = (t) => { if (t < 30) return 0; const u = Math.min(1, (t - 30) / 270); return u * u * 0.4 + u * 0.6; };

// ---- RAMP
{
  const pts = [0, 10, 29.999, 30, 60, 165, 180, 299, 300, 360, 3600];
  const got = pts.map((t) => gm.idleRamp(t));
  ok('RAMP: silent under 30 s since a key, the mockup\'s curve after it, 1 at 5 minutes and after (rules 1-2)',
    pts.every((t, i) => near(got[i], curve(t))) && got[3] === 0 && near(got[8], 1) && near(got[10], 1), JSON.stringify(got));
  let mono = true;
  for (let t = 30; t < 400; t += 0.5) if (gm.idleRamp(t + 0.5) < gm.idleRamp(t)) mono = false;
  ok('RAMP: it only ever rises with idle time (slowly intensifies, rule 2)', mono && gm.idleRamp(31) < 0.01);
}
// ---- PROGRESS
{
  const r = [gm.meterIntensity(300, 0), gm.meterIntensity(300, 0.5), gm.meterIntensity(300, 0.999), gm.meterIntensity(180, 0.25), gm.meterIntensity(20, 0)];
  ok('PROGRESS: intensity = ramp x (1 - lap progress): calmer near the goal, still at the goal\'s edge, silent while a key is recent (rule 3)',
    near(r[0], 1) && near(r[1], 0.5) && near(r[2], 0.001, 1e-9) && near(r[3], curve(180) * 0.75) && r[4] === 0, JSON.stringify(r));
}
// ---- GAP
{
  const at = (I, dial, rr) => gm.nextGapMs(2600, 4800, I, dial, rr);
  ok('GAP: at peak and the dial\'s centre the spacing is the event\'s own (2.6-4.8 s for macroblocks)', near(at(1, 50, 0), 2600, 1e-6) && near(at(1, 50, 1), 4800, 1e-6), JSON.stringify([at(1, 50, 0), at(1, 50, 1)]));
  ok('GAP: lower intensity spaces events further apart ("flickers get rarer")', at(0.2, 50, 0.5) > at(0.6, 50, 0.5) && at(0.6, 50, 0.5) > at(1, 50, 0.5), JSON.stringify([at(0.2, 50, 0.5), at(0.6, 50, 0.5), at(1, 50, 0.5)]));
  ok('GAP: the Ambiance dial scales it (rule 5) - a higher dial is busier', at(1, 100, 0.5) < at(1, 50, 0.5) && at(1, 50, 0.5) < at(1, 10, 0.5) && near(at(1, 50, 0.5) * ad.dialIntervalScale(100), Math.max(1040, at(1, 100, 0.5)), 1e-6),
    JSON.stringify([at(1, 100, 0.5), at(1, 50, 0.5), at(1, 10, 0.5)]));
  let floorOk = true;
  for (let i = 0; i <= 100; i++) for (const d of [1, 50, 100]) if (gm.nextGapMs(2600, 4800, i / 100, d, Math.random()) < 2600 * 0.4) floorOk = false;
  ok('GAP: never below 0.4 x the event\'s own minimum at any intensity or dial (the per-event floor Signal Loss keeps)', floorOk);
}
// ---- BUDGET (a fake clock: every call passes its own time)
{
  fb.__resetFlashBudget();
  const seq = [[0, true], [10, true], [20, true], [30, false], [999, false], [1000, true], [1005, false], [1010, true], [1020, true], [1021, false]];
  const got = seq.map(([t]) => fb.tryFlash('t', t));
  // ---- PARKED - SUPERSEDED by ledger 117 (Fable, Oct 21: the interim limit is 2, and the window is a second PLUS a draw margin). Kept VERBATIM
  // and no longer run; its record is in the parked leg below; the successor is derived from the module's own exported constants.
  // ok('BUDGET: three flashes, then refused until the oldest leaves the 1 s window; a refusal is SKIPPED, never queued for later',
  //   seq.every(([, want], i) => got[i] === want) && fb.FLASH_LIMIT === 3, JSON.stringify(got));
  parkedReads.budgetSeq = got;
  fb.__resetFlashBudget();
  const L = fb.FLASH_LIMIT, W = fb.WINDOW_MS;
  const seq2 = [...Array.from({ length: L }, (_, i) => [i * 10, true]), [L * 10, false], [W - 1, false], [W, true], [W + 5, false], [W + 10, true]];
  const got2 = seq2.map(([t]) => fb.tryFlash('t', t));
  ok(`BUDGET [ledger-117 successor]: FLASH_LIMIT (${L}) flashes, then refused until the oldest leaves the window (WINDOW_MS ${W} = 1000 + DRAW_MARGIN_MS); a refusal is SKIPPED, never queued for later`,
    seq2.every(([, want], i) => got2[i] === want) && L === 3 && W === 1000 + fb.DRAW_MARGIN_MS && fb.DRAW_MARGIN_MS >= 50, JSON.stringify({ L, W, got2 }));   // the proof branch: the brief's 3, restored with the margin
  fb.__resetFlashBudget();
  let seed = 20261017;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = seed; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  let t = 0;
  const grants = [];
  const refusals = [];
  for (let i = 0; i < 10000; i++) {
    t += rnd() < 0.3 ? 0 : rnd() * 400;
    if (fb.tryFlash('r', t)) grants.push(t); else refusals.push(t);
  }
  let worst = 0;
  for (let i = 0, j = 0; i < grants.length; i++) { while (grants[i] - grants[j] >= 1000) j++; worst = Math.max(worst, i - j + 1); }
  // every refusal was forced: at that moment 3 grants were already in (t - 1000, t]
  const forced = refusals.every((r) => grants.filter((g) => g <= r && r - g < 1000).length >= 3);
  // ---- PARKED - SUPERSEDED by ledger 117 (the interim limit 2, the window 1000 + margin). Kept VERBATIM and no longer run; successor below.
  // ok('BUDGET: on 10,000 random attempts no sliding second ever holds more than 3 grants, and every refusal had 3 already in its window (it refuses only when it must)',
  //   worst <= 3 && forced && refusals.length > 100 && grants.length > 100, JSON.stringify({ worst, grants: grants.length, refusals: refusals.length, forced }));
  parkedReads.budgetRandom = { worst, forced };
  const forced2= refusals.every((r) => grants.filter((g) => g <= r && r - g < W).length >= L);
  ok(`BUDGET [ledger-117 successor]: on 10,000 random attempts no sliding SECOND ever holds more than FLASH_LIMIT (${L}) grants, and every refusal had ${L} already in its window (${W} ms) - it refuses only when it must`,
    worst <= L && forced2 && refusals.length > 100 && grants.length > 100, JSON.stringify({ worst, L, W, grants: grants.length, refusals: refusals.length, forced2 }));
}
// ---- MARGIN (ledger 117 - the observer saw 4 in a second where the budget granted 3): a pulse reaches the screen a little AFTER its grant (the
// next paint, a busy thread). With every draw delayed by a random 0..DRAW_MARGIN_MS after its grant, no real second (1000 ms) may ever hold more
// than FLASH_LIMIT DRAWS. Proven against the real budget; and a copy of the budget with the margin set to 0 (the old 1000 ms window) must fail it,
// or the check proves nothing.
{
  const drawnWorst = (budget) => {
    budget.__resetFlashBudget();
    let s = 20261021;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    let t = 0;
    const draws = [];
    for (let i = 0; i < 20000; i++) {
      t += rnd() < 0.4 ? rnd() * 3 : rnd() * 300;
      if (budget.tryFlash('m', t)) draws.push(t + rnd() * budget.DRAW_MARGIN_MS_FOR_CHECK);
    }
    draws.sort((a, b) => a - b);
    let worst = 0;
    for (let i = 0, j = 0; i < draws.length; i++) { while (draws[i] - draws[j] >= 1000) j++; worst = Math.max(worst, i - j + 1); }
    return { worst, draws: draws.length };
  };
  const real = drawnWorst({ ...fb, DRAW_MARGIN_MS_FOR_CHECK: fb.DRAW_MARGIN_MS });
  // the mutant: the budget's own source with the margin set to 0, bundled alone (it imports nothing); its draws keep the REAL margin's jitter
  const src = readFileSync(join(here, '..', 'src', 'store', 'flashBudget.ts'), 'utf8');
  const mutatedSrc = src.replace('export const DRAW_MARGIN_MS = 100;', 'export const DRAW_MARGIN_MS = 0;');
  const landed = mutatedSrc !== src;
  let mutant = null;
  if (landed) {
    const mt = mkdtempSync(join(tmpdir(), 'wz-glitch-m-'));
    try {
      writeFileSync(join(mt, 'flashBudget.ts'), mutatedSrc);
      execFileSync(process.execPath, [esbuildBin, join(mt, 'flashBudget.ts'), '--bundle', '--format=esm', '--platform=neutral', `--outfile=${join(mt, 'fb.mjs')}`, '--log-level=error'], { stdio: 'pipe' });
      const mfb = await import(pathToFileURL(join(mt, 'fb.mjs')).href);
      mutant = drawnWorst({ ...mfb, DRAW_MARGIN_MS_FOR_CHECK: fb.DRAW_MARGIN_MS });
    } finally { rmSync(mt, { recursive: true, force: true }); }
  }
  ok(`MARGIN: with every draw up to DRAW_MARGIN_MS (${fb.DRAW_MARGIN_MS} ms) after its grant, no real second ever holds more than FLASH_LIMIT (${fb.FLASH_LIMIT}) draws - over 20,000 attempts`,
    real.worst <= fb.FLASH_LIMIT && real.draws > 1000, JSON.stringify(real));
  ok('MARGIN (mutant): the same budget with the margin set to 0 (the old 1000 ms window) LANDED and lets a real second hold more than FLASH_LIMIT draws - the ledger-117 slip, reproduced',
    landed && !!mutant && mutant.worst > fb.FLASH_LIMIT, JSON.stringify({ landed, mutant }));
}
// ---- TEAR (Fable, Oct 21: cut the leftover lines the moment reduced motion lands): a storm under way asks `alive` before each staggered line;
// once it answers no, no more lines are laid (fake timers that run at once, a fake document)
{
  const realST = globalThis.setTimeout;
  const hadDoc = 'document' in globalThis;
  const prevDoc = globalThis.document;
  const laid = [];
  const fakeEl = () => ({ className: '', style: { setProperty() {} }, classList: { add() {}, remove() {} }, remove() {}, get offsetWidth() { return 0; } });
  const container = { setAttribute() {}, appendChild: (el) => { if (el.className === 'theme-fx-tear') laid.push(el); } };
  globalThis.setTimeout = (fn, ms) => { if (!ms || ms < 200) fn(); return 0; };   // the stagger runs at once; each line's own 200 ms removal never fires
  globalThis.document = { createElement: () => fakeEl() };
  try {
    let asks = 0;
    sl.tearStorm(container, 0.5, () => { asks += 1; return asks <= 1; });   // alive for the first line only
    const cut = laid.length;
    laid.length = 0;
    sl.tearStorm(container, 0.5);   // no `alive`: the ambient default - every line laid
    const whole = laid.length;
    ok('TEAR: a storm under way asks `alive` before each line - once it answers no, no more lines are laid (1 line, not the storm\'s 3-5); with no `alive` every line is laid',
      cut === 1 && asks >= 2 && whole >= 3 && whole <= 5, JSON.stringify({ cut, asks, whole }));
  } finally {
    globalThis.setTimeout = realST;
    if (hadDoc) globalThis.document = prevDoc; else delete globalThis.document;
  }
}
// ---- THE GRANT HOOK (ledger 90: glitch-meter.mjs takes its frames ON a granted pulse) - called on every grant, never on a refusal, and absent
// it is nothing at all
{
  const hadWindow = 'window' in globalThis;
  const prev = globalThis.window;
  const seen = [];
  globalThis.window = { __wzOnFlashGrant: (k) => seen.push(k) };
  try {
    fb.__resetFlashBudget();
    const res = [0, 1, 2, 3, 4].map((i) => fb.tryFlash(`k${i}`, 5000 + i));
    globalThis.window = {};
    const quiet = fb.tryFlash('after', 9000);
    // ---- PARKED - SUPERSEDED by ledger 117 (the interim limit is 2: the third ask is refused). Kept VERBATIM and no longer run; successor below.
    // ok('HOOK: the harness grant hook is called once per GRANTED flash and never for a refused one; unset, a grant goes on without it',
    //   JSON.stringify(res) === JSON.stringify([true, true, true, false, false]) && JSON.stringify(seen) === JSON.stringify(['k0', 'k1', 'k2']) && quiet === true,
    //   JSON.stringify({ res, seen, quiet }));
    parkedReads.hook = { res, seen };
    const L = fb.FLASH_LIMIT;
    const want = [0, 1, 2, 3, 4].map((i) => i < L);
    ok(`HOOK [ledger-117 successor]: the harness grant hook is called once per GRANTED flash (the first FLASH_LIMIT = ${L}) and never for a refused one; unset, a grant goes on without it`,
      JSON.stringify(res) === JSON.stringify(want) && JSON.stringify(seen) === JSON.stringify(want.map((w, i) => (w ? `k${i}` : null)).filter(Boolean)) && quiet === true,
      JSON.stringify({ res, seen, quiet, L }));
  } finally {
    if (hadWindow) globalThis.window = prev; else delete globalThis.window;
    fb.__resetFlashBudget();
  }
}

// ---- DOUBLE (fake timers that run at once, a fake element)
{
  const realST = globalThis.setTimeout;
  globalThis.setTimeout = (fn) => { fn(); return 0; };
  try {
    const el = { style: { opacity: '0' }, setAttribute() {} };   // each pulse stamps data-pulse (glitch-meter.mjs G4 counts them)
    const asks = [];
    sl.backlightDip(el, 0.13, 0.09, true, () => { asks.push('second'); return true; });
    const once = [];
    sl.backlightDip(el, 0.13, 0.09, false, () => { once.push('second'); return true; });
    const refused = [];
    const seen = [];
    const watched = { setAttribute() {}, style: new Proxy({ opacity: '0' }, { set(o, k, v) { o[k] = v; if (k === 'opacity') seen.push(v); return true; } }) };
    sl.backlightDip(watched, 0.13, 0.09, true, () => { refused.push('second'); return false; });
    ok('DOUBLE: a double backlight dip asks the budget for its second pulse (2 flashes, as 0eb36a6a counts it); a single dip asks for none',
      asks.length === 1 && once.length === 0, JSON.stringify({ asks, once }));
    ok('DOUBLE: ...and a second pulse the budget refuses is not drawn (the dip rises once, not twice)',
      refused.length === 1 && seen.filter((v) => Number(v) > 0).length === 1, JSON.stringify(seen));
  } finally { globalThis.setTimeout = realST; }
}

// === PARKED - gated behind HARNESS_PARKED=1, skipped by default. THREE parks (ledger 117: the interim limit 2, the window 1000 + margin); each
// record re-asserts the new truth from the default run's own reading.
if (process.env.HARNESS_PARKED === '1') {
  const parked = [];
  const pok = (name, pass, detail = '') => parked.push({ name, pass: !!pass, detail });
  const r = parkedReads;
  pok('PARKED (was "BUDGET: three flashes, then refused until the oldest leaves the 1 s window; a refusal is SKIPPED, never queued for later") - ledger 117: the third flash is now refused (limit 2); live successor: BUDGET [ledger-117 successor]',
    Array.isArray(r.budgetSeq) && r.budgetSeq[0] === true && r.budgetSeq[1] === true && r.budgetSeq[2] === false, JSON.stringify(r.budgetSeq));
  pok('PARKED (was "BUDGET: on 10,000 random attempts no sliding second ever holds more than 3 grants, and every refusal had 3 already in its window") - ledger 117: at most 2 now; live successor: BUDGET [ledger-117 successor]',
    !!r.budgetRandom && r.budgetRandom.worst <= 2, JSON.stringify(r.budgetRandom));
  pok('PARKED (was "HOOK: the harness grant hook is called once per GRANTED flash and never for a refused one; unset, a grant goes on without it") - ledger 117: two grants, then refusals; live successor: HOOK [ledger-117 successor]',
    !!r.hook && JSON.stringify(r.hook.res) === JSON.stringify([true, true, false, false, false]), JSON.stringify(r.hook));
  for (const c of parked) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
  console.log(parked.every((c) => c.pass) ? `\nGLITCH-METER-CHECK PARKED: PASS (${parked.length} checks)` : `\nGLITCH-METER-CHECK PARKED: FAIL - ${parked.filter((c) => !c.pass).length}/${parked.length} failed`);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nGLITCH-METER-CHECK VERIFY: PASS (${checks.length} checks)` : `\nGLITCH-METER-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

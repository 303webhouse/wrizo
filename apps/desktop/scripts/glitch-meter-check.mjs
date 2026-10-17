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
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
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
  ok('BUDGET: three flashes, then refused until the oldest leaves the 1 s window; a refusal is SKIPPED, never queued for later',
    seq.every(([, want], i) => got[i] === want) && fb.FLASH_LIMIT === 3, JSON.stringify(got));
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
  ok('BUDGET: on 10,000 random attempts no sliding second ever holds more than 3 grants, and every refusal had 3 already in its window (it refuses only when it must)',
    worst <= 3 && forced && refusals.length > 100 && grants.length > 100, JSON.stringify({ worst, grants: grants.length, refusals: refusals.length, forced }));
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

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nGLITCH-METER-CHECK VERIFY: PASS (${checks.length} checks)` : `\nGLITCH-METER-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

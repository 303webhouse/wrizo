// ITEM 139 — THE GUARD LIVES IN THE RUNNER, falsified.
//
// Browserless by construction: every check here proves a refusal that happens
// BEFORE any browser is launched, so the file that tests the box guard never
// takes the box.
//
// WHY THE GUARD MOVED. The rule that the box is taken BY ANNOUNCEMENT lived in
// the drivers, and a driver is a file someone can forget to write it into. On
// 2026-09-13 one carried the rule as a COMMENT and nothing else: a command
// written to demonstrate the refusal launched 81 files instead. A rule that
// lives in a comment is enforced by memory; a rule that fails a run is enforced
// by the run. So the refusal now sits in withHarness, which every browser in
// this repo crosses — including a BARE `node scripts/harness/x.mjs` that no
// driver sees at all.
//
// EACH CHECK SPAWNS A REAL CHILD PROCESS and reads its exit code and stderr,
// rather than importing the guard and asserting on a boolean. The thing being
// claimed is "this refuses when you run it", and only running it shows that.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.join(HERE, '..');
const DESKTOP = path.join(SCRIPTS, '..');

// Call withHarness in a child with a controlled environment. `dist` points at a
// path with no bundle, so a run that gets PAST the box guards still stops
// without opening a browser — which is what makes the control below safe.
function runChild(env) {
  const code = "import('file:///" + SCRIPTS.replace(/\\/g, '/') + "/runtime-verify.mjs')"
    + ".then(m => m.withHarness(async () => {}, { dist: 'C:/nonexistent-dist-for-item139' }))"
    + ".then(() => { console.log('REACHED-SCENARIO'); }, (e) => { console.log('ERR:' + e.message.split('\\n')[0]); });";
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
    timeout: 60000,
    env: { ...process.env, WS_BOX_TURN: '', WS_REAPER_PREFLIGHT_DONE: '', ...env },
  });
  return `${r.stdout || ''}${r.stderr || ''}`;
}

// --- S1: no granted turn -----------------------------------------------------
{
  const out = runChild({});
  ok('S1: withHarness REFUSES with no granted turn — the refusal every driver was supposed to carry, now in the one place every browser crosses',
    /BOX TURN NOT GRANTED/.test(out), out.slice(0, 200));
  ok('S1: and it is a HARD STOP, not a print — the scenario never runs. A warning on stderr is indistinguishable from the noise of a run that went ahead anyway',
    !/REACHED-SCENARIO/.test(out), out.slice(0, 120));
}

// --- S2 (the control): a granted turn gets through ---------------------------
{
  const out = runChild({ WS_BOX_TURN: 'granted', WS_REAPER_PREFLIGHT_DONE: '1' });
  ok('S2 (the control): WITH a granted turn the box guards pass and the run proceeds to its NEXT check (the missing bundle) — so S1 and S3 are not passing on a guard that refuses everything unconditionally',
    /No built bundle/.test(out) && !/BOX TURN NOT GRANTED/.test(out) && !/LIVE FOREIGN RUN/.test(out), out.slice(0, 200));
}

// --- S3: a live foreign run --------------------------------------------------
{
  const dir = path.join(os.tmpdir(), `i139-fake-${process.pid}`, 'scripts', 'harness');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'fake-live-run.mjs');
  writeFileSync(file, 'setTimeout(() => {}, 20000);\n');
  const child = spawn(process.execPath, [file], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));

  // WS_REAPER_PREFLIGHT_DONE is deliberately UNSET here: that is the standalone
  // path, the one a lane uses when it runs a single harness by hand.
  const out = runChild({ WS_BOX_TURN: 'granted' });
  try { child.kill(); } catch { /* already gone */ }
  rmSync(path.join(os.tmpdir(), `i139-fake-${process.pid}`), { recursive: true, force: true });

  ok('S3: with a LIVE FOREIGN RUN on the box, withHarness refuses even WITH a granted turn — a grant is permission to take the box, never permission to contend for it',
    /LIVE FOREIGN RUN PRESENT/.test(out), out.slice(0, 200));
  ok('S3: and the scenario never runs — the refusal is a throw before the first process, not a note after it',
    !/REACHED-SCENARIO/.test(out), out.slice(0, 120));
}

// --- S4: the runner requires the grant it hands down -------------------------
{
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, 'run-suite.mjs'), '--only', 'seed-guard.mjs'], {
    cwd: DESKTOP, encoding: 'utf8', timeout: 60000,
    env: { ...process.env, WS_BOX_TURN: '' },
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  ok('S4: run-suite REFUSES without a grant, exit 3 — without this the runner would be the one path that launders an ungranted turn into eighty-one granted ones, since it sets the token for every child',
    r.status === 3 && /SUITE REFUSED: BOX TURN NOT GRANTED/.test(out), JSON.stringify({ status: r.status, head: out.slice(0, 90) }));
  ok('S4: and it refuses BEFORE the rebuild — an ungranted run costs nothing and touches nothing',
    !/SUITE START|vite/.test(out), out.slice(0, 120));
}

// --- S5: the grant is inherited, not re-claimed ------------------------------
{
  const { readFileSync } = await import('node:fs');
  const runner = readFileSync(path.join(SCRIPTS, 'run-suite.mjs'), 'utf8');
  ok('S5: the runner passes its grant to every child — one announcement covers the sweep, rather than each of eighty-one files claiming a turn of its own',
    /env\.WS_BOX_TURN = process\.env\.WS_BOX_TURN;/.test(runner), '');
  const rv = readFileSync(path.join(SCRIPTS, 'runtime-verify.mjs'), 'utf8');
  ok('S5: and withHarness skips the foreign-run enumeration under the suite (WS_REAPER_PREFLIGHT_DONE), which checks once for the whole sweep — eighty-one process enumerations is a great deal of cost for no information, the same argument the reaper skip already makes',
    /WS_REAPER_PREFLIGHT_DONE !== '1'/.test(rv), '');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nITEM139 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 139 parks nothing. It adds a refusal the runner did not have; no existing assertion changes meaning.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM139 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM139 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

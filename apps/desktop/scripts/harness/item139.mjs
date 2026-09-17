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

// ITEM 140 CHANGED WHAT "A GRANTED TURN" MEANS, and S2 and S3's first check
// encoded the old meaning. Under 139 a turn was granted if WS_BOX_TURN was SET,
// so the literal string 'granted' was a grant. Under 140 the token must MATCH the
// grant file chat 1 writes, so 'granted' is now a mismatch and is refused before
// either assertion's subject is reached. Both are parked verbatim below
// (SUPERSEDED); the successors grant the turn the 140 way — with the token this
// run INHERITED, which is the one that matches the live grant file whenever this
// file runs inside a granted suite. Outside one there is no grant, and under 140
// there is no allow path to prove, so the successor rightly fails.
const GRANTED = process.env.WS_BOX_TURN;

// --- S2 (the control): a granted turn gets through ---------------------------
{
  const out = runChild({ WS_BOX_TURN: GRANTED, WS_REAPER_PREFLIGHT_DONE: '1' });
  ok('S2 (the control) [ITEM 140 successor]: WITH a turn whose token MATCHES the grant file, the box guards pass and the run proceeds to its NEXT check (the missing bundle) — so S1 and S3 are not passing on a guard that refuses everything unconditionally',
    /No built bundle/.test(out) && !/BOX TURN NOT GRANTED/.test(out) && !/BOX TURN HELD/.test(out) && !/LIVE FOREIGN RUN/.test(out), out.slice(0, 200));
}

// --- S2b: the token 139 treated as a grant is now REFUSED --------------------
// Invert the default and prove the exception. The successor above shows a
// matching token is allowed; this shows the old sentinel is not — which is the
// whole of what 140 changed about this file's subject.
{
  const out = runChild({ WS_BOX_TURN: 'granted', WS_REAPER_PREFLIGHT_DONE: '1' });
  ok('S2b [ITEM 140]: the literal token "granted" — a grant under 139, because 139 asked only whether the variable was SET — is now REFUSED as a mismatch against the grant file, before any later check is reached',
    /BOX TURN (HELD BY ANOTHER LANE|NOT GRANTED)/.test(out) && !/No built bundle/.test(out) && !/REACHED-SCENARIO/.test(out), out.slice(0, 200));
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
  // [ITEM 140] the MATCHING token, not the old 'granted' sentinel — otherwise the
  // grant check refuses first and the foreign-run check this block exists to
  // prove is never reached.
  const out = runChild({ WS_BOX_TURN: GRANTED });
  try { child.kill(); } catch { /* already gone */ }
  rmSync(path.join(os.tmpdir(), `i139-fake-${process.pid}`), { recursive: true, force: true });

  ok('S3 [ITEM 140 successor]: with a LIVE FOREIGN RUN on the box, withHarness refuses even WITH a turn whose token MATCHES the grant file — a grant is permission to take the box, never permission to contend for it',
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
// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ============
// Item 139 parked nothing of its own. ITEM 140 (2026-09-16) changed what a
// granted turn MEANS — from "WS_BOX_TURN is set" to "WS_BOX_TURN matches the
// grant file" — and that falsified two of this file's checks, both of which
// granted the turn with the literal sentinel 'granted'. Quoted verbatim below
// (SUPERSEDED); live successors are S2 and S3 above, which grant the turn with
// the token that matches the file, plus S2b, which proves the old sentinel is
// now refused.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });

  // === ITEM 140 — SUPERSEDED (S2: the 'granted' sentinel as a grant) =========
  // ORIGINAL, verbatim:
  //
  //   const out = runChild({ WS_BOX_TURN: 'granted', WS_REAPER_PREFLIGHT_DONE: '1' });
  //   ok('S2 (the control): WITH a granted turn the box guards pass and the run proceeds to its NEXT check (the missing bundle) — so S1 and S3 are not passing on a guard that refuses everything unconditionally',
  //     /No built bundle/.test(out) && !/BOX TURN NOT GRANTED/.test(out) && !/LIVE FOREIGN RUN/.test(out), out.slice(0, 200));
  //
  // WHY IT CANNOT STAND. It passed only because 139 asked whether the variable
  // was SET. Under 140 the token must MATCH the grant file, and 'granted' matches
  // no grant chat 1 writes — so the run is refused as "BOX TURN HELD BY ANOTHER
  // LANE" before the bundle check it asserts is ever reached. The same
  // experiment now yields the opposite verdict, and that verdict is 140's point.
  //
  // (Caught by 140's own gate pair, 2026-09-16, which came back NOT CLEAN on it:
  // a change to a guard's semantics falsifies every test that encodes the old
  // semantics, and item140.mjs was swept while this file was not.)
  const parkedS2 = runChild({ WS_BOX_TURN: 'granted', WS_REAPER_PREFLIGHT_DONE: '1' });
  pok('PARKED (was "S2 (the control): WITH a granted turn the box guards pass ...") — the SAME sentinel, with the verdict 140 gives it: refused before the bundle check, because a token must match the grant file rather than merely be present. Live successor: S2 above, with the matching token',
    /BOX TURN (HELD BY ANOTHER LANE|NOT GRANTED)/.test(parkedS2) && !/No built bundle/.test(parkedS2),
    parkedS2.slice(0, 200));

  // === ITEM 140 — SUPERSEDED (S3: the foreign-run refusal behind 'granted') ===
  // ORIGINAL, verbatim:
  //
  //   const out = runChild({ WS_BOX_TURN: 'granted' });
  //   ...
  //   ok('S3: with a LIVE FOREIGN RUN on the box, withHarness refuses even WITH a granted turn — a grant is permission to take the box, never permission to contend for it',
  //     /LIVE FOREIGN RUN PRESENT/.test(out), out.slice(0, 200));
  //
  // WHY IT CANNOT STAND. Its claim is still true — a grant never licenses
  // contention — but with the 'granted' sentinel the GRANT check now refuses
  // first, so the foreign-run refusal it names is never reached. It would be
  // asserting a message the run no longer gets far enough to print. Its sibling
  // ("the scenario never runs") was not falsified and stays live, unchanged.
  //
  // Re-asserted as the ordering 140 creates: with the old sentinel, the grant
  // refusal fires and the foreign-run refusal does not.
  const parkedS3 = runChild({ WS_BOX_TURN: 'granted' });
  pok('PARKED (was "S3: with a LIVE FOREIGN RUN on the box, withHarness refuses even WITH a granted turn") — with the old sentinel the GRANT refusal now fires first, so the foreign-run refusal is never reached; the claim itself survives in the live successor, which grants the turn with the matching token',
    /BOX TURN (HELD BY ANOTHER LANE|NOT GRANTED)/.test(parkedS3) && !/LIVE FOREIGN RUN PRESENT/.test(parkedS3),
    parkedS3.slice(0, 200));

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nITEM139 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nITEM139 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM139 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM139 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

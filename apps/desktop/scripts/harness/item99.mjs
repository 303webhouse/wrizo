// ITEM 99 — THE ORPHAN REAPER. Verification.
//
// THIS FILE LAUNCHES NO BROWSER, ON PURPOSE. A reaper whose safety can only be
// demonstrated by killing real browsers on a shared box is a reaper whose safety
// is never actually demonstrated — nobody will run that test, and the one time
// they do it will be on a machine holding another lane's suite. So the kill
// DECISION is a pure function (`selectReapTargets`) and this file drives it with
// fabricated tables, exhaustively, in milliseconds, contending with nothing.
//
// WHAT IS BEING GUARDED, in the words of the law it comes from:
//   "A runner's live refusal outranks metadata; signature-kills are never
//    lawful — sweep only on a verified-dead owner."   (THE S4 LAW, 2026-08-17)
//
// The 2026-08-04 incident that ratified it is the reason S2 and S5 exist. The
// harm there was not the dead-owner sweeps; it was ESCALATING to a signature
// kill when the count did not fall, which took out another lane's live `e1` leg
// mid-run. S2 proves a live owner is spared even when sparing it means this run
// gets nothing. S5 asserts, against the module's own source, that no wider
// instrument is present to reach for.
import { readFileSync, mkdirSync, rmSync, existsSync, writeFileSync, utimesSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectReapTargets, ownerAlive, resolveOwner, reapOrphans, enumerateForeignRuns } from '../orphan-reaper.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REAPER_SRC = path.join(HERE, '..', 'orphan-reaper.mjs');

// A PID that is VERIFIED DEAD rather than merely guessed at: spawn something
// trivial, wait for it to exit, then use its PID. Guessing a "probably unused"
// number would make every assertion below conditional on that guess.
function deadPid() {
  const r = spawnSync(process.execPath, ['-e', '0'], { stdio: 'ignore' });
  return r.pid;
}

const DEAD = deadPid();
const SELF = process.pid;

// ===========================================================================
// S1 — THE KILL DECISION, exhaustively, on a fabricated table.
// ===========================================================================
{
  const DEAD_A = 900001;      // a dead owner, three browsers (the orphan shape)
  const LIVE_B = 900002;      // a live owner — another lane, mid-run
  const UNKNOWN = 900003;     // an owner we cannot resolve
  // AGES ADDED 2026-09-07. Every fixture browser here is an hour old —
  // unambiguously past the age floor — so each check still tests exactly what it
  // was written to test (the OWNER decision) rather than quietly becoming a test
  // of the clock. The floor gets its own falsification in S1b, where age is the
  // ONLY thing that varies between two otherwise identical tables.
  const table = [
    { pid: 11, owner: DEAD_A, ageSec: 3600 }, { pid: 12, owner: DEAD_A, ageSec: 3600 }, { pid: 13, owner: DEAD_A, ageSec: 3600 },
    { pid: 21, owner: LIVE_B, ageSec: 3600 }, { pid: 22, owner: LIVE_B, ageSec: 3600 },
    { pid: 31, owner: UNKNOWN, ageSec: 3600 },
    { pid: 41, owner: SELF, ageSec: 3600 },
  ];
  // The resolver is TRI-STATE, as ratified: 'dead' is the only licence, and
  // 'unknown' is a distinct answer that must survive into the report rather
  // than being flattened into 'alive'.
  const resolve = (o) => (o === DEAD_A ? 'dead' : o === UNKNOWN ? 'unknown' : 'alive');
  const r = selectReapTargets(table, { foreignRuns: [], self: SELF, resolve });

  ok('S1: only the VERIFIED-DEAD owner is targeted — all three of its browsers, and nothing else',
    JSON.stringify(r.targets.map((t) => t.pid).sort((a, b) => a - b)) === JSON.stringify([11, 12, 13]),
    JSON.stringify({ targets: r.targets.map((t) => t.pid), deadOwners: r.deadOwners }));

  ok('S1: the LIVE owner keeps both of its browsers — another lane mid-run is untouched, which is the whole point of the law',
    r.spared.filter((b) => b.owner === LIVE_B).length === 2
      && r.targets.every((t) => t.owner !== LIVE_B),
    JSON.stringify(r.spared.map((b) => `${b.pid}/${b.owner}`)));

  ok('S1: an UNRESOLVABLE owner is spared — "I could not tell" is never spent as "it was dead"',
    r.targets.every((t) => t.owner !== UNKNOWN), JSON.stringify(r.targets));

  // RATIFIED 2026-09-05 — spared AND REPORTED. The sparing was already true;
  // the REPORTING is the half this ruling added, and it is the half a reader
  // depends on: an owner listed as "alive" claims a resolution that never
  // happened, and would let a corpse pass as another lane's live run forever.
  ok('S1: an UNRESOLVABLE owner is REPORTED AS SUCH, not flattened into "alive" — unknown is not dead, and it is not alive either',
    JSON.stringify(r.unknownOwners) === JSON.stringify([UNKNOWN])
      && r.states.get(UNKNOWN) === 'unknown'
      && !r.liveOwners.includes(UNKNOWN),
    JSON.stringify({ unknownOwners: r.unknownOwners, liveOwners: r.liveOwners, state: r.states.get(UNKNOWN) }));

  ok('S1: our OWN browsers are spared even if the liveness probe were to lie about us',
    selectReapTargets(table, { foreignRuns: [], self: SELF, resolve: () => 'dead' }).targets.every((t) => t.owner !== SELF),
    JSON.stringify(selectReapTargets(table, { foreignRuns: [], self: SELF, resolve: () => 'dead' }).targets.map((t) => t.pid)));
}

// ===========================================================================
// S1b — THE AGE FLOOR (ruled 2026-09-07, from INK's live observation).
//
// THE DEAD-OWNER LICENCE IS NECESSARY, NOT SUFFICIENT. On Edge, harness browsers
// THIRTY SECONDS OLD reported their owner as GONE **while a foreign suite was
// actively running them** — detached parentage reads as death. So the single
// test this reaper was built on can be confidently, catastrophically wrong about
// a live run, which is the 2026-08-04 harm arriving from a new direction.
//
// This is the falsification Fable named, and its shape is the point: the SAME
// dead-reading owner, spared at 30s and reaped past the floor. NOTHING BUT THE
// CLOCK DIFFERS between the two tables, which is what makes the pair a test of
// the floor rather than of anything else.
// ===========================================================================
{
  const DEAD = 930001;
  const dead = () => 'dead';
  const at = (ageSec) => selectReapTargets(
    [{ pid: 91, owner: DEAD, ageSec }, { pid: 92, owner: DEAD, ageSec }],
    { foreignRuns: [], self: SELF, resolve: dead },
  );

  const young = at(30);
  ok('S1b (falsification, the dangerous half): a DEAD-READING owner at 30s is SPARED — INK\'s exact observation, and reaping it would kill a live foreign suite whose parentage had merely detached',
    young.targets.length === 0 && young.youngSpared.length === 2,
    JSON.stringify({ targets: young.targets.length, youngSpared: young.youngSpared.length, floor: young.ageFloorSec }));

  const old = at(young.ageFloorSec + 60);
  ok('S1b (falsification, the other half): the SAME dead-reading owner one minute PAST the floor IS reaped — the floor delays a corpse, it does not grant it immunity, and without this half the check above would pass on a reaper that never reaps anything at all',
    old.targets.length === 2 && old.youngSpared.length === 0,
    JSON.stringify({ targets: old.targets.length, ageSec: young.ageFloorSec + 60, floor: young.ageFloorSec }));

  const exact = at(young.ageFloorSec);
  ok('S1b: the boundary is inclusive and stated rather than left to be discovered — exactly AT the floor is reapable, so the rule reads "younger than the floor is spared" and nobody has to guess the off-by-one',
    exact.targets.length === 2,
    JSON.stringify({ atFloorSec: young.ageFloorSec, targets: exact.targets.length }));

  const noAge = selectReapTargets([{ pid: 93, owner: DEAD }], { foreignRuns: [], self: SELF, resolve: dead });
  ok('S1b: an UNREADABLE age is spared, not assumed old — an age we failed to read is the same kind of not-knowing as an owner we failed to resolve, and every uncertainty in this reaper fails toward not killing',
    noAge.targets.length === 0 && noAge.ageUnknownSpared.length === 1,
    JSON.stringify({ targets: noAge.targets.length, ageUnknownSpared: noAge.ageUnknownSpared.length }));

  ok(`S1b: the floor is ${young.ageFloorSec}s — MEASURED, not picked. The longest legitimate harness-browser lifetime observed here is 81s (fx5.mjs, across 278 file-runs in four stamped suites; median 20s, p95 53s); the probe holds ONE browser 39s for its entire matrix; INK's observation was 30s. Five minutes is 3.7x the longest life ever measured and 10x the observation, and deliberately no larger — every extra minute is one a genuine orphan keeps every lane's guard refusing`,
    young.ageFloorSec === 300, `floor=${young.ageFloorSec}s`);
}
// ===========================================================================
// S1c — THE PRECONDITION (ruled 2026-09-07): a live foreign run means the box is
// theirs and NOTHING is reaped, whatever any owner or age reads.
//
// It is the gate in FRONT of both licences, not a third licence beside them, and
// that distinction is the whole value: it closes the age floor's residual gap.
// A pathological file that outruns the floor KEEPS ITS SUITE ALIVE, so the
// question never reaches the licences at all.
//
// The falsification Fable named: a fake live suite process present must yield
// ZERO reaps even at 360s with a dead owner — i.e. with BOTH licences satisfied.
// ===========================================================================
{
  const DEAD = 940001;
  const dead = () => 'dead';
  const bothLicences = [
    { pid: 95, owner: DEAD, ageSec: 360 },   // dead owner AND past the 300s floor
    { pid: 96, owner: DEAD, ageSec: 360 },
  ];

  const quiet = selectReapTargets(bothLicences, { foreignRuns: [], self: SELF, resolve: dead });
  ok('S1c (the control): on a QUIET box both licences are satisfied at 360s and the pair IS reaped — without this, the check below would pass on a reaper that never reaps anything',
    quiet.targets.length === 2 && quiet.boxIsTheirs === false,
    JSON.stringify({ targets: quiet.targets.length, boxIsTheirs: quiet.boxIsTheirs }));

  const busy = selectReapTargets(bothLicences, {
    foreignRuns: [{ pid: 999001, cmd: 'node scripts/harness/fake-live-run.mjs' }],
    self: SELF,
    resolve: dead,
  });
  ok('S1c (falsification): with a LIVE foreign run present, the SAME pair — dead owner, 360s, both licences satisfied — is reaped ZERO times. The gate outranks the licences, which is what makes a pathological long file safe',
    busy.targets.length === 0 && busy.boxIsTheirs === true && busy.spared.length === 2,
    JSON.stringify({ targets: busy.targets.length, boxIsTheirs: busy.boxIsTheirs, spared: busy.spared.length }));

  const blindGate = selectReapTargets(bothLicences, { foreignRuns: null, self: SELF, resolve: dead });
  ok('S1c: an UNREADABLE process table counts as a live run — undeterminable is "present", the same sparing direction an unresolvable owner and an unreadable age already take',
    blindGate.targets.length === 0 && blindGate.boxIsTheirs === true,
    JSON.stringify({ targets: blindGate.targets.length, boxIsTheirs: blindGate.boxIsTheirs }));

  const forgot = selectReapTargets(bothLicences, { self: SELF, resolve: dead });
  ok('S1c: a caller who FORGETS the precondition reaps nothing — the default is `null`, so an omission fails safe rather than silently authorising a sweep nobody asked for',
    forgot.targets.length === 0 && forgot.boxIsTheirs === true,
    JSON.stringify({ targets: forgot.targets.length, boxIsTheirs: forgot.boxIsTheirs }));
}

// ===========================================================================
// S1d — THE PRECONDITION AGAINST A REAL PROCESS. The fixtures above prove the
// DECISION; this proves the DETECTION, which is the half that can silently rot.
// A real node process whose script path carries the harness signature is spawned
// in a TEMP directory — never inside scripts/harness, which the suite runner
// enumerates — and must be seen; and this process must never see ITSELF.
// ===========================================================================
{
  const fakeDir = path.join(os.tmpdir(), `i99-fake-${process.pid}`, 'scripts', 'harness');
  mkdirSync(fakeDir, { recursive: true });
  const fakeFile = path.join(fakeDir, 'fake-live-run.mjs');
  writeFileSync(fakeFile, 'setTimeout(() => {}, 8000);\n');

  const child = spawn(process.execPath, [fakeFile], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const seen = enumerateForeignRuns();
  const sawFake = Array.isArray(seen) && seen.some((p) => p.pid === child.pid);
  const sawSelf = Array.isArray(seen) && seen.some((p) => p.pid === process.pid);
  try { child.kill(); } catch { /* already gone */ }
  rmSync(path.join(os.tmpdir(), `i99-fake-${process.pid}`), { recursive: true, force: true });

  ok('S1d: a REAL live node process running a harness-signature script is DETECTED — the decision above is worth nothing if the detection cannot see a run',
    sawFake, JSON.stringify({ fakePid: child.pid, detected: sawFake, total: Array.isArray(seen) ? seen.length : seen }));
  ok('S1d: and this process never detects ITSELF — "foreign" is computed from self plus every ancestor, which is what lets run-suite call this from its own preflight without refusing to ever sweep',
    sawSelf === false, JSON.stringify({ self: process.pid, sawSelf }));
}
// ===========================================================================
// S2 — THE GUARD ON THE GUARD. A machine holding nothing but ONE live owner's
// browsers yields ZERO targets. This is the check that fails if a later hand
// "improves" the reaper into something that clears the board so a blocked run
// can proceed — which is precisely the temptation that caused the incident.
// ===========================================================================
{
  const LIVE = 910001;
  const onlyLive = [{ pid: 51, owner: LIVE, ageSec: 3600 }, { pid: 52, owner: LIVE, ageSec: 3600 }, { pid: 53, owner: LIVE, ageSec: 3600 }];
  const r = selectReapTargets(onlyLive, { foreignRuns: [], self: SELF, resolve: () => 'alive' });
  ok('S2 (the guard on the guard): a box holding ONLY live-owner browsers yields ZERO targets — the reaper leaves the run blocked rather than clearing the board to unblock itself',
    r.targets.length === 0 && r.spared.length === 3 && r.liveOwners.length === 1,
    JSON.stringify({ targets: r.targets.length, spared: r.spared.length, liveOwners: r.liveOwners }));
}

// ===========================================================================
// S3 — LIVENESS FAILS SAFE. Every uncertain answer must read ALIVE.
// ===========================================================================
{
  ok('S3: our own PID reads ALIVE', ownerAlive(SELF) === true, `self=${SELF}`);
  ok('S3: a VERIFIED-DEAD pid (a child spawned and reaped by this file) reads DEAD — the one answer that licenses a reap',
    ownerAlive(DEAD) === false, `deadPid=${DEAD}`);
  const junk = [0, -1, NaN, 1.5, undefined, null];
  ok('S3: every unparseable owner is SPARED — the fail-safe direction, so a malformed profile name can never license a kill',
    junk.every((j) => ownerAlive(j) === true), JSON.stringify(junk.map((j) => `${String(j)}:${ownerAlive(j)}`)));
  ok('S3: ...and each is reported as UNKNOWN rather than as alive — the resolver has three answers because the machine has three cases, and collapsing them is how a corpse passes as a live lane',
    junk.every((j) => resolveOwner(j) === 'unknown')
      && resolveOwner(SELF) === 'alive' && resolveOwner(DEAD) === 'dead',
    JSON.stringify({ junk: junk.map((j) => `${String(j)}:${resolveOwner(j)}`), self: resolveOwner(SELF), dead: resolveOwner(DEAD) }));
}

// ===========================================================================
// S4 — THE PROFILE-DIR SWEEP IS OWNER-GATED, not signature-gated. Real dirs in
// the real temp dir, because that is the thing being claimed.
// ===========================================================================
{
  const tmp = os.tmpdir();
  const deadDir = path.join(tmp, `ws-runtime-verify-${DEAD}`);
  const liveDir = path.join(tmp, `ws-runtime-verify-${SELF}`);
  const decoyDir = path.join(tmp, 'ws-runtime-verify-notanumber');
  const bareDir = path.join(tmp, 'ws-runtime-verify');
  const youngDeadDir = path.join(tmp, `ws-runtime-verify-${deadPid()}`);
  for (const d of [deadDir, liveDir, decoyDir, bareDir, youngDeadDir]) {
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, 'DevToolsActivePort'), '1234\n/devtools/browser/x');
  }
  // BACKDATED PAST THE FLOOR (2026-09-07). A dir this test just created is
  // SECONDS old, and the age floor keeps young dirs on purpose — so without this
  // the check would fail for the FLOOR's sake rather than for the SWEEP's, which
  // is a different claim. `youngDeadDir` is left at its real age and is the
  // control for exactly that behaviour.
  const oldStamp = new Date(Date.now() - 3600 * 1000);
  utimesSync(deadDir, oldStamp, oldStamp);

  const lines = [];
  const report = await reapOrphans({ foreignRuns: [], log: (l) => lines.push(l) });

  ok('S4: the dir of a VERIFIED-DEAD owner is removed — the 54-stale-dir backlog item 99 opened on',
    !existsSync(deadDir), `deadDir=${path.basename(deadDir)} stillThere=${existsSync(deadDir)}`);
  ok('S4: the dir of a LIVE owner SURVIVES — "a dir belonging to a live run in another lane is not this process to delete" is untouched by item 99',
    existsSync(liveDir), `liveDir=${path.basename(liveDir)}`);
  ok('S4: a dir whose name carries no resolvable owner is NOT touched — the sweep is owner-gated, never name-gated',
    existsSync(decoyDir) && existsSync(bareDir),
    JSON.stringify({ decoy: existsSync(decoyDir), bare: existsSync(bareDir) }));
  ok('S4: the sweep LOGGED itself even though it had no browsers to reap — an empty, dated, reviewable record is the honest one (the 2026-08-03 authorized sweep set this precedent by executing against an empty target set)',
    lines.some((l) => l.startsWith('REAPER:')) && report !== null,
    JSON.stringify(lines.slice(0, 4)));

  ok('S4 (the age floor, on dirs): a dead-owner dir that is YOUNG is KEPT — withHarness clears its dir and THEN launches, so a live run mid-launch owns a dir with no browser yet to hold it, and a dead-reading owner would otherwise delete the profile out from under a browser that is starting up',
    existsSync(youngDeadDir),
    `youngDeadDir=${path.basename(youngDeadDir)} stillThere=${existsSync(youngDeadDir)}`);

  for (const d of [deadDir, liveDir, decoyDir, bareDir, youngDeadDir]) rmSync(d, { recursive: true, force: true });
}

// ===========================================================================
// S5 — NO WIDER INSTRUMENT EXISTS TO REACH FOR. Asserted against the module's
// own source, because the failure this guards against is a future hand adding
// one back under deadline pressure — exactly the 2026-08-04 sequence.
// ===========================================================================
{
  const src = readFileSync(REAPER_SRC, 'utf8');
  const killSection = src.slice(src.indexOf('function killPid'), src.indexOf('function killPid') + 900);
  ok('S5: the reaper kills with taskkill /f and NEVER /t — a tree reaches processes the sweep never enumerated, which is the exact width the S4 law forbids',
    killSection.includes("'/f'") && !killSection.includes("'/t'"), JSON.stringify(killSection.match(/\['\/[a-z]+'[^\]]*\]/g)));
  ok('S5: the reaper contains NO signature-based kill anywhere — no Stop-Process sweep, no CommandLine -like kill; the signature FINDS candidates and never decides them',
    !src.includes('Stop-Process') && !/Where-Object[^\n]*Stop-Process/.test(src),
    `Stop-Process present=${src.includes('Stop-Process')}`);
  ok('S5: the runner refuses on a post-sweep count MISMATCH rather than escalating — "a sweep that does not reduce the count is evidence the model is wrong, not that the tool is weak"',
    src.includes('STOP AND REPORT') && readFileSync(path.join(HERE, '..', 'run-suite.mjs'), 'utf8').includes('reapReport.mismatch'),
    'checked in orphan-reaper.mjs and run-suite.mjs');
}

// ===========================================================================
// S6 — THE PREFLIGHT IS WIRED WHERE IT WAS ASKED FOR, and the guard it sits in
// front of is unweakened.
// ===========================================================================
{
  const runner = readFileSync(path.join(HERE, '..', 'run-suite.mjs'), 'utf8');
  const rv = readFileSync(path.join(HERE, '..', 'runtime-verify.mjs'), 'utf8');
  const reapAt = runner.indexOf('reapOrphans({ log: say })');
  const guardAt = runner.indexOf('SUITE REFUSED: ${preexisting.length}');
  ok('S6: run-suite reaps BEFORE guard 3 reads the machine, so the guard judges the box as it actually is',
    reapAt > 0 && guardAt > reapAt, JSON.stringify({ reapAt, guardAt }));
  ok('S6: guard 3 is UNWEAKENED — it still refuses on any surviving foreign browser, so a live owner still blocks this run',
    runner.includes('SUITE REFUSED: ${preexisting.length} harness browser process(es)')
      && runner.includes('if (!IGNORE_FOREIGN) process.exit(2);'),
    'guard 3 refusal intact');
  ok('S6: withHarness inherits the reaper for every standalone entry (the probe, selftest-quiescence, a harness run directly) and skips it under the suite, which already swept once',
    rv.includes("process.env.WS_REAPER_PREFLIGHT_DONE !== '1'") && runner.includes("env.WS_REAPER_PREFLIGHT_DONE = '1'"),
    'withHarness gate + runner flag both present');
  ok('S6: a reaper FAILURE can never take down a harness run — the sweep is wrapped, reported and stepped over, because a hygiene tool that outages the box is the very thing item 99 exists to end',
    /try \{[\s\S]{0,400}reapOrphans\([\s\S]{0,200}\} catch/.test(rv)
      && rv.includes('the sweep itself failed'),
    'withHarness wraps the reap');
  ok('S6: the enumerator is SINGLE-SOURCED — the runner delegates to the reaper module rather than keeping a second copy of the profile-signature query',
    runner.includes('const harnessBrowsers = enumerateHarnessBrowsers;')
      && !runner.includes("Get-CimInstance Win32_Process -Filter"),
    'run-suite delegates enumeration');
}

// ===========================================================================
// S7 — STOP AND REPORT, exercised rather than merely asserted. This is the
// clause the 2026-08-04 incident was ratified over: the sweep ran, the count
// did NOT fall, and the lane escalated to a signature kill that destroyed
// another lane's live run. Injected seams let that exact situation be staged
// deterministically, with no real process touched.
// ===========================================================================
{
  const DEAD_OWNER = 920001;
  const table = [{ pid: 61, owner: DEAD_OWNER, ageSec: 3600 }, { pid: 62, owner: DEAD_OWNER, ageSec: 3600 }];
  const isDeadOwner = () => table;             // the machine never changes: nothing dies
  const killAttempts = [];
  const lines = [];
  const stubborn = await reapOrphans({
    foreignRuns: [],   // a quiet box, declared: these fixtures test the LICENCES, not the gate
    log: (l) => lines.push(l),
    enumerate: isDeadOwner,
    kill: (pid) => { killAttempts.push(pid); return true; },  // claims success, changes nothing
    pollMs: 5,
    polls: 3,
  });

  ok('S7: when a reaped PID is STILL PRESENT afterwards, the reaper reports a MISMATCH instead of concluding success',
    stubborn.mismatch === true, JSON.stringify({ mismatch: stubborn.mismatch, survivors: stubborn.survivors.map((b) => b.pid) }));

  ok('S7: and it does NOT escalate — each target was attempted exactly ONCE, never re-swept, never widened; the incident escalated at precisely this moment and that is the behaviour being forbidden',
    killAttempts.length === 2 && new Set(killAttempts).size === 2,
    JSON.stringify({ killAttempts }));

  ok('S7: the mismatch says so in words a reader can act on, and names the lesson rather than just the numbers',
    lines.some((l) => l.includes('STOP AND REPORT'))
      && lines.some((l) => l.includes('the MODEL is wrong'))
      && lines.some((l) => l.includes('does not escalate')),
    JSON.stringify(lines.filter((l) => l.includes('STOP') || l.includes('MODEL')).slice(0, 3)));

  // The same staging with a kill that actually works: the count falls, and the
  // reaper concludes success. Without this the check above would pass on a
  // reaper that simply always cried mismatch.
  let alive = [{ pid: 71, owner: 920002, ageSec: 3600 }, { pid: 72, owner: 920002, ageSec: 3600 }];
  const cleared = await reapOrphans({
    foreignRuns: [],   // a quiet box, declared: these fixtures test the LICENCES, not the gate
    log: () => {},
    enumerate: () => alive,
    kill: (pid) => { alive = alive.filter((b) => b.pid !== pid); return true; },
    pollMs: 5,
    polls: 3,
  });
  ok('S7 (the control): when the count DOES fall, the reaper reports success and no mismatch — so the mismatch check above is not a reaper that always cries wolf',
    cleared.mismatch === false && cleared.reaped.length === 2 && cleared.survivors.length === 0,
    JSON.stringify({ mismatch: cleared.mismatch, reaped: cleared.reaped, survivors: cleared.survivors.length }));
}

// ===========================================================================
// S8 — THE TWO REMAINING SAFETY PATHS, both previously unexercised.
// ===========================================================================
{
  // (a) ENUMERATION FAILURE. A reaper that cannot see the machine must do
  // NOTHING — not guess, not fall back to a name match, not treat an empty
  // answer as "clean". This is the path where a wider instrument would be most
  // tempting and least defensible.
  const lines = [];
  const blind = await reapOrphans({ foreignRuns: [], log: (l) => lines.push(l), enumerate: () => null, kill: () => { throw new Error('the blind reaper tried to kill something'); } });
  ok('S8: when enumeration FAILS, the reaper kills nothing and says so — it does not guess, does not fall back to a signature, and does not read an unreadable machine as a quiet one',
    blind.enumerated === null && blind.reaped.length === 0 && blind.mismatch === false
      && lines.some((l) => l.includes('SKIPPED') && l.includes('no owner can be verified dead')),
    JSON.stringify({ report: { enumerated: blind.enumerated, reaped: blind.reaped }, lines }));

  // (a2) UNKNOWN, END TO END. The ruling is about what a READER sees, so it is
  // proven at the log rather than only at the pure function: an owner that
  // genuinely fails to resolve (0 is unparseable, so resolveOwner says
  // 'unknown') must be spared, named on its own line, and never counted as a
  // live owner. A kill that THROWS if called is the guard that this path
  // reaps nothing.
  const ulines = [];
  const unk = await reapOrphans({
    foreignRuns: [],   // a quiet box, declared: these fixtures test the LICENCES, not the gate
    log: (l) => ulines.push(l),
    enumerate: () => [{ pid: 81, owner: 0, ageSec: 3600 }, { pid: 82, owner: 0, ageSec: 3600 }],
    kill: () => { throw new Error('the reaper killed on an UNKNOWN owner'); },
    pollMs: 5, polls: 2,
  });
  ok('S8: an owner that genuinely fails to resolve is SPARED and REPORTED BY NAME on its own line — spared was already true; being reported is what the 2026-09-05 ruling added, and it is what stops a corpse passing as another lane forever',
    unk.reaped.length === 0
      && JSON.stringify(unk.unknownOwners) === JSON.stringify([0])
      && unk.liveOwners.length === 0
      && ulines.some((l) => l.includes('UNRESOLVABLE and therefore SPARED'))
      && ulines.some((l) => l.includes('unknown is not dead')),
    JSON.stringify({ reaped: unk.reaped, unknownOwners: unk.unknownOwners, liveOwners: unk.liveOwners, line: ulines.find((l) => l.includes('UNRESOLVABLE')) }));

  // (b) THE BACKLOG. Item 99 opened on 54 stale dirs sitting in TEMP. One dir
  // proves the rule; a batch proves the sweep does not stop at the first, and
  // that draining a real backlog is cheap enough to do on every run.
  const tmp = os.tmpdir();
  const made = [];
  for (let i = 0; i < 20; i++) {
    const d = path.join(tmp, `ws-runtime-verify-${deadPid()}`);
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, 'DevToolsActivePort'), '0');
    const oldT = new Date(Date.now() - 3600 * 1000);   // past the floor — see S4's note
    utimesSync(d, oldT, oldT);
    made.push(d);
  }
  const t0 = Date.now();
  const drained = await reapOrphans({ foreignRuns: [], log: () => {} });
  const ms = Date.now() - t0;
  const left = made.filter((d) => existsSync(d));
  ok('S8: a BACKLOG of dead-owner profile dirs drains in one pass — item 99 opened on 54 of them, and a sweep that stopped at the first would leave the guard blocked exactly as before',
    left.length === 0 && drained.dirs && drained.dirs.removed.length >= 20,
    JSON.stringify({ made: made.length, stillThere: left.length, removed: drained.dirs ? drained.dirs.removed.length : null, ms }));
  for (const d of made) rmSync(d, { recursive: true, force: true });
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This file is NEW, and item 99 SUPERSEDES no assertion: the
  // runner's dirty-machine guard is unchanged in what it claims (S6 asserts
  // that directly), and no prior check anywhere covered dead-owner reaping,
  // because there was no reaper to cover. The empty list is the evidence that
  // this ticket was additive.
  // eslint-disable-next-line no-console
  console.log('\nITEM99 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 99 parks nothing. It supersedes no assertion: guard 3 still claims exactly what it claimed, and nothing previously covered dead-owner reaping.');
}

const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM99 VERIFY: PASS (${all.length} checks)`
  : `\nITEM99 VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);

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
import { readFileSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectReapTargets, ownerAlive, reapOrphans } from '../orphan-reaper.mjs';

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
  const table = [
    { pid: 11, owner: DEAD_A }, { pid: 12, owner: DEAD_A }, { pid: 13, owner: DEAD_A },
    { pid: 21, owner: LIVE_B }, { pid: 22, owner: LIVE_B },
    { pid: 31, owner: UNKNOWN },
    { pid: 41, owner: SELF },
  ];
  // `isAlive` models exactly what ownerAlive returns: an explicit false ONLY
  // for the verified-dead one; an unresolvable owner reads alive (fail-safe).
  const isAlive = (o) => (o === DEAD_A ? false : true);
  const r = selectReapTargets(table, { self: SELF, isAlive });

  ok('S1: only the VERIFIED-DEAD owner is targeted — all three of its browsers, and nothing else',
    JSON.stringify(r.targets.map((t) => t.pid).sort((a, b) => a - b)) === JSON.stringify([11, 12, 13]),
    JSON.stringify({ targets: r.targets.map((t) => t.pid), deadOwners: r.deadOwners }));

  ok('S1: the LIVE owner keeps both of its browsers — another lane mid-run is untouched, which is the whole point of the law',
    r.spared.filter((b) => b.owner === LIVE_B).length === 2
      && r.targets.every((t) => t.owner !== LIVE_B),
    JSON.stringify(r.spared.map((b) => `${b.pid}/${b.owner}`)));

  ok('S1: an UNRESOLVABLE owner is spared — "I could not tell" is never spent as "it was dead"',
    r.targets.every((t) => t.owner !== UNKNOWN), JSON.stringify(r.targets));

  ok('S1: our OWN browsers are spared even if the liveness probe were to lie about us',
    selectReapTargets(table, { self: SELF, isAlive: () => false }).targets.every((t) => t.owner !== SELF),
    JSON.stringify(selectReapTargets(table, { self: SELF, isAlive: () => false }).targets.map((t) => t.pid)));
}

// ===========================================================================
// S2 — THE GUARD ON THE GUARD. A machine holding nothing but ONE live owner's
// browsers yields ZERO targets. This is the check that fails if a later hand
// "improves" the reaper into something that clears the board so a blocked run
// can proceed — which is precisely the temptation that caused the incident.
// ===========================================================================
{
  const LIVE = 910001;
  const onlyLive = [{ pid: 51, owner: LIVE }, { pid: 52, owner: LIVE }, { pid: 53, owner: LIVE }];
  const r = selectReapTargets(onlyLive, { self: SELF, isAlive: () => true });
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
  ok('S3: every unparseable owner reads ALIVE — the fail-safe direction, so a malformed profile name can never license a kill',
    junk.every((j) => ownerAlive(j) === true), JSON.stringify(junk.map((j) => `${String(j)}:${ownerAlive(j)}`)));
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
  for (const d of [deadDir, liveDir, decoyDir, bareDir]) {
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, 'DevToolsActivePort'), '1234\n/devtools/browser/x');
  }

  const lines = [];
  const report = await reapOrphans({ log: (l) => lines.push(l) });

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

  for (const d of [deadDir, liveDir, decoyDir, bareDir]) rmSync(d, { recursive: true, force: true });
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
  const table = [{ pid: 61, owner: DEAD_OWNER }, { pid: 62, owner: DEAD_OWNER }];
  const isDeadOwner = () => table;             // the machine never changes: nothing dies
  const killAttempts = [];
  const lines = [];
  const stubborn = await reapOrphans({
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
  let alive = [{ pid: 71, owner: 920002 }, { pid: 72, owner: 920002 }];
  const cleared = await reapOrphans({
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

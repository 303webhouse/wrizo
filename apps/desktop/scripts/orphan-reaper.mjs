// ITEM 99 — THE ORPHAN REAPER. The canonical dead-owner sweep, in one place.
//
// WHAT IT IS FOR. A harness run that dies ungracefully — killed, crashed, or
// cut off with its parent — never reaches `withHarness`'s `finally`, so its
// headless browser survives with nobody left to claim it. Those orphans
// accumulate, and `run-suite.mjs`'s dirty-machine guard then (rightly) cannot
// see past them and REFUSES every lane's next run. That is not hypothetical
// bookkeeping: it VOIDed the P0 deploy's suite of record twice against 32-57
// sustained foreign browsers (owner node 50580, verified dead), and PID 32156's
// nine orphans wedged item 112-A's pair and chat 1's deploy loop overnight —
// the third such cost in one week.
//
// ---------------------------------------------------------------------------
// THE LAW THIS OBEYS, AND WHY IT IS SHAPED EXACTLY LIKE THIS
//
// THE S4 LAW (ratified by Nick, 2026-08-17), verbatim:
//   "A runner's live refusal outranks metadata; signature-kills are never
//    lawful — sweep only on a verified-dead owner."
//
// It was ratified because a lane broke it and cost another lane a run
// (docs/menus/incident-2026-08-04-s4.md). That incident is the design input
// here, not a footnote, and it constrains this file in four ways:
//
//   1. ENUMERATE, THEN KILL BY PID. Every process this reaper kills was first
//      enumerated and had its own owner resolved. There is no name match, no
//      command-line signature sweep, and no tree-kill of anything the sweep did
//      not enumerate. The signature is how candidates are FOUND; it is never
//      how the kill decision is made. (`taskkill /t` is deliberately NOT used
//      here for the same reason — a tree reaches processes we never listed.)
//
//   2. A DEAD OWNER IS THE ONLY LICENCE. Owner alive, owner unknown, owner
//      unparseable — all three mean LEAVE IT. Every uncertain path fails
//      toward not killing, because the cost of a wrong reap (another lane's
//      run destroyed mid-flight, presenting as a flake it did not earn) is far
//      worse than the cost of a missed one (this run refuses, as it does today).
//
//   3. A COUNT THAT DOES NOT FALL MEANS THE MODEL IS WRONG — STOP AND REPORT.
//      The 2026-08-04 harm did not come from the dead-owner sweeps; those were
//      defensible. It came from ESCALATING when the count failed to drop.
//      "A sweep that does not reduce the count is evidence that the model is
//      wrong, not that the tool is weak." So when a reaped PID is still present
//      afterwards, this reaper reports the mismatch and stops. It never reaches
//      for a bigger hammer, because reaching for a bigger hammer is the defect.
//
//   4. THE REFUSAL SURVIVES THE REAP. This never converts a refusal into a
//      pass. It removes only the corpses; if one live-owner browser remains,
//      the caller's guard still refuses, and it should — another lane is
//      genuinely mid-suite and this machine is genuinely contended.
//
// ---------------------------------------------------------------------------
// RATIFIED BY FABLE, 2026-09-05 (chat 1 reading). This file is not a copy of an
// existing sweep — chat 1's hardened loop was SESSION-LOCAL and never committed,
// which by the house's own law (chat-only = lost) makes THIS PREFLIGHT THE
// CANONICAL SHAPE, and chat 1 retires its loop in favour of it. The three
// decisions offered as conservative defaults are ruled, not merely chosen:
//
//   · AN UNRESOLVABLE OWNER IS SPARED **AND REPORTED** — unknown is not dead.
//     `resolveOwner` is deliberately TRI-STATE for this reason, and the sweep
//     names unresolvable owners on their own line. A sweep that logged them as
//     "alive" would claim a resolution it never made.
//   · LIVE-OWNER PROFILE DIRS ARE KEPT — and so are unresolvable ones, for the
//     same reason and reported the same way.
//   · TREE-KILL APPLIES ONLY TO A VERIFIED-DEAD OWNER'S OWN BROWSER TREE. That
//     is the ceiling. This file stays strictly INSIDE it and uses no tree-kill
//     at all: every process in such a tree carries the same profile dir, so the
//     enumeration already lists them individually and each is reaped as itself.
//     Same outcome, narrower authority — recorded so a later reader does not
//     mistake the absence of `/t` for ignorance of the ruling.
//
// ALSO RATIFIED: the harder refusal (a post-sweep count mismatch is NOT
// overridable by --ignore-foreign — "a runner that cannot trust its own count
// of the machine must not stamp anything"), and default-on sweeping,
// verified-dead-only, logged to stderr every run.
// ---------------------------------------------------------------------------
//
// A NOTE ON PID RECYCLING, because it is the subtle half. Windows recycles
// PIDs, so "the owner PID does not name a live process" and "this browser is an
// orphan" are DIFFERENT CLAIMS, and the incident record is explicit that
// treating the weaker as the stronger is what went wrong. This reaper is safe
// under recycling in the direction that matters: if a dead owner's PID has been
// reused by some unrelated live process, the owner reads ALIVE and nothing is
// reaped — a missed corpse, which costs a refusal, not a run. The reverse error
// (a live harness node whose PID reads dead) is not reachable: a process cannot
// be running and absent from the process table at once.
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The one profile-name convention, single-sourced. `withHarness` builds its
// user-data-dir as `${tmpdir}/ws-runtime-verify-${process.pid}`; both patterns
// below read that same shape, so a change to the naming has exactly one place
// to break rather than four places to drift.
const PROFILE_PREFIX = 'ws-runtime-verify-';
const OWNER_IN_CMDLINE = /ws-runtime-verify-(\d+)/;
const OWNER_IN_DIRNAME = /^ws-runtime-verify-(\d+)$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Every browser process holding a runtime-verify profile, as [{pid, owner}].
 * `owner` is the node PID that launched it, parsed out of the profile dir name.
 *
 * Matches ONLY that profile signature, so an ordinary browser window belonging
 * to the human at this desk is structurally invisible here — it cannot be
 * enumerated, so it cannot be reaped, whatever else goes wrong below.
 *
 * Returns `null` when enumeration ITSELF fails. Null is not "clean": a reaper
 * that cannot see the machine does nothing at all, and the caller's guard is
 * left to say so.
 */
export function enumerateHarnessBrowsers() {
  try {
    if (process.platform === 'win32') {
      // AGE COMES FROM THE SAME QUERY as identity, deliberately: two calls would
      // read the machine at two moments, and a browser that launched between
      // them would arrive with an identity and no age — the exact shape that
      // must never be guessed at.
      const ps = "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='chrome.exe'\" | "
        + `Where-Object { $_.CommandLine -like '*${PROFILE_PREFIX}*' } | `
        + `ForEach-Object { if ($_.CommandLine -match '${PROFILE_PREFIX}(\\d+)') { `
        + '$age = [int]((Get-Date) - $_.CreationDate).TotalSeconds; '
        + '"$($_.ProcessId) $($Matches[1]) $age" } }';
      const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 30000 });
      return out.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [pid, owner, age] = l.split(/\s+/);
        const ageSec = Number(age);
        return { pid: Number(pid), owner: Number(owner), ageSec: Number.isFinite(ageSec) ? ageSec : null };
      });
    }
    // `etimes` is elapsed seconds since start — the same fact, already in the
    // unit the floor is expressed in. Where a ps lacks it the field parses as
    // NaN and becomes a NULL age, which is spared, not assumed young or old.
    const out = execFileSync('ps', ['-eo', 'pid=,etimes=,args='], { encoding: 'utf8', timeout: 30000 });
    return out.split('\n').map((l) => {
      const m = l.match(new RegExp(`^\\s*(\\d+)\\s+(\\d+|-)\\s+.*${OWNER_IN_CMDLINE.source}`));
      if (!m) return null;
      const ageSec = Number(m[2]);
      return { pid: Number(m[1]), owner: Number(m[3]), ageSec: Number.isFinite(ageSec) ? ageSec : null };
    }).filter(Boolean);
  } catch {
    return null; // enumeration failed — reported by the caller, never silently "clean"
  }
}

/**
 * Is this PID a live process? `signal 0` performs the permission/existence
 * check without delivering anything, on Windows as well as POSIX.
 *
 * EVERY uncertain answer is ALIVE, deliberately:
 *   · ESRCH            — no such process. The only answer that licenses a reap.
 *   · EPERM            — it exists, we simply may not signal it. Alive.
 *   · anything else    — we do not know. Alive, because "I could not tell" must
 *                        never be spent as "it was dead".
 *   · unparseable pid  — alive, same reason.
 */
export function resolveOwner(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return 'unknown';   // unparseable — nothing was resolved
  try {
    process.kill(pid, 0);
    return 'alive';
  } catch (e) {
    if (e && e.code === 'ESRCH') return 'dead';               // the ONLY answer that licenses a reap
    if (e && e.code === 'EPERM') return 'alive';              // it exists; we simply may not signal it
    return 'unknown';                                          // we could not tell, and must say so
  }
}

/**
 * The predicate the sweep actually gates on: anything that is not a VERIFIED
 * DEAD is spared. Kept beside `resolveOwner` rather than folded into it because
 * the two answer different questions — "may I reap this?" (one bit, and it must
 * fail safe) and "what do I know about this owner?" (three states, and the
 * report must not flatten them).
 */
export function ownerAlive(pid) {
  return resolveOwner(pid) !== 'dead';
}

// ---------------------------------------------------------------------------
// THE AGE FLOOR — ruled 2026-09-07 (Fable, from INK's live observation).
//
// THE DEAD-OWNER LICENCE IS NECESSARY, NOT SUFFICIENT. On Edge, harness browsers
// THIRTY SECONDS OLD reported their owner as GONE **while a foreign suite was
// actively running them**: detached parentage reads as death. So the one test
// this reaper was built on can be confidently, catastrophically wrong about a
// live run — which is the 2026-08-04 harm arriving from a new direction, and it
// outranks everything queued behind it.
//
// TWO LICENCES NOW, BOTH REQUIRED: a VERIFIED-DEAD owner **and** a STALE AGE. A
// browser younger than the floor is never reaped whatever its owner reads.
//
// WHY FIVE MINUTES — measured, not picked. The floor has to clear the longest
// window in which a LEGITIMATE, live browser could read dead-owner, which is
// bounded by how long a legitimate browser lives at all:
//
//   · the longest per-file browser lifetime across 278 file-runs in four
//     stamped suites: 81s (fx5.mjs). Median 20s, p95 53s.
//   · the probe holds ONE browser for its entire 9-cell matrix: 39s measured.
//   · INK's observation, the failure this closes: 30s.
//
// Five minutes is 3.7x the longest lifetime ever measured here and 10x the
// observation. It is deliberately NOT larger: every extra minute is a minute a
// genuine orphan keeps every lane's guard refusing, which is the cost this
// reaper exists to remove.
//
// ► THE RESIDUAL GAP, NAMED RATHER THAN PAPERED OVER. run-suite's own
// PER_FILE_TIMEOUT_MS is FIFTEEN minutes, so a pathological file that runs
// longer than the floor could still present as an old, dead-owner browser while
// genuinely live. No finite floor closes that; what bounds it is that reaping
// still needs BOTH licences, and that a wrong reap now shows up as the
// stop-and-report count mismatch rather than as a silent kill. A stronger
// complementary signal is recommended in the offer and deliberately NOT built
// here, because it would be a third licence and two were ruled.
const AGE_FLOOR_SECONDS = 5 * 60;

/**
 * THE KILL DECISION, as a pure function — given a table of browsers, a way to
 * ask whether an owner is alive, and the age floor, which ones may lawfully be
 * reaped?
 *
 * It is separated from the process work on purpose. This is the whole of the
 * S4 law's safety surface, and a reaper whose safety can only be tested by
 * killing real browsers on a shared box is a reaper whose safety is never
 * tested. scripts/harness/item99.mjs drives this with fabricated tables — live
 * owner, dead owner, own owner, unknown owner, and now young vs stale — and
 * needs no browser and no box to do it.
 *
 * SPARED, always, and each for its own reason it can be reported by: an owner
 * that is alive, an owner we cannot resolve, our own PID, a browser YOUNGER
 * than the floor, and a browser whose age we could not read at all. Only
 * `dead owner AND age >= floor` is a licence.
 */
export function selectReapTargets(browsers, {
  self = process.pid,
  resolve = resolveOwner,
  ageFloorSec = AGE_FLOOR_SECONDS,
} = {}) {
  const owners = [...new Set(browsers.map((b) => b.owner))];
  // Our own PID is recorded as what it is and then excluded on its own line
  // below — flattening it into "alive" would hide the self-protection rather
  // than state it.
  const states = new Map(owners.map((o) => [o, resolve(o)]));

  const deadOwned = browsers.filter((b) => b.owner !== self && states.get(b.owner) === 'dead');
  // AGE UNKNOWN IS NOT OLD. An age we failed to read fails toward sparing, the
  // same direction every other uncertainty in this file takes.
  const ageUnknownSpared = deadOwned.filter((b) => typeof b.ageSec !== 'number');
  const youngSpared = deadOwned.filter((b) => typeof b.ageSec === 'number' && b.ageSec < ageFloorSec);
  const targets = deadOwned.filter((b) => typeof b.ageSec === 'number' && b.ageSec >= ageFloorSec);
  const spared = browsers.filter((b) => !targets.includes(b));

  return {
    owners,
    states,
    targets,
    spared,
    youngSpared,
    ageUnknownSpared,
    ageFloorSec,
    liveOwners: owners.filter((o) => states.get(o) === 'alive'),
    deadOwners: owners.filter((o) => o !== self && states.get(o) === 'dead'),
    // RATIFIED 2026-09-05: unknown is SPARED **and REPORTED** — unknown is not
    // dead, and a sweep that logs it as "alive" has quietly told the reader it
    // resolved something it never resolved.
    unknownOwners: owners.filter((o) => states.get(o) === 'unknown'),
  };
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      // /f, and pointedly NOT /t. Every process in a browser's tree carries the
      // same --user-data-dir, so the enumeration above already lists the
      // renderer/gpu/crashpad children individually with the same owner; they
      // are reaped as enumerated PIDs in their own right. A /t here would reach
      // processes this sweep never listed, which is the exact width the S4 law
      // forbids.
      execFileSync('taskkill', ['/pid', String(pid), '/f'], { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGKILL');
    }
    return true;
  } catch {
    return false; // already gone, or not ours to kill — both are "not reaped by me"
  }
}

/**
 * Stale profile DIRS of dead owners. `withHarness` already clears its OWN dir
 * on the way in (DF1.1 S3's fix for the PID-recycling "CDP page target never
 * appeared" class), which drains the backlog only as PIDs come round again —
 * 54 were still on disk when item 99 opened.
 *
 * This widens that to every dir whose owner is verified dead AND which no
 * enumerated browser is still holding. It does NOT widen it to a mass sweep of
 * TEMP: `withHarness`'s own comment declines that, correctly, because "a dir
 * belonging to a LIVE run in another lane is not this process's to delete."
 * That reasoning is untouched here — the liveness test is precisely what tells
 * the two apart, which is the whole of what item 99 adds.
 */
function reapStaleProfileDirs(heldOwners) {
  const removed = [];
  const kept = [];
  let dirs;
  try {
    dirs = readdirSync(os.tmpdir(), { withFileTypes: true });
  } catch {
    return { removed, kept, enumerated: null };
  }
  let enumerated = 0;
  for (const d of dirs) {
    const m = d.name.match(OWNER_IN_DIRNAME);
    if (!m) continue;
    enumerated++;
    const owner = Number(m[1]);
    const full = path.join(os.tmpdir(), d.name);
    // Same tri-state honesty as the process sweep: a dir is kept when its owner
    // is alive AND when it is merely unresolvable, and the reason says which.
    // "Live-owner profile dirs are KEPT" is the ratified rule; an unknown owner
    // is not a live one, and reporting it as ALIVE would claim a resolution
    // that never happened.
    const state = resolveOwner(owner);
    if (state !== 'dead') { kept.push({ dir: d.name, why: `owner ${owner} ${state.toUpperCase()}` }); continue; }
    if (heldOwners.has(owner)) { kept.push({ dir: d.name, why: `a browser still holds owner ${owner}` }); continue; }
    // THE AGE FLOOR REACHES THE DIRS TOO — an extension beyond the letter of the
    // 2026-09-07 ruling, made for its identical reason and flagged in the offer
    // rather than slipped in. The held-owner test above already protects a
    // detached-but-live run whose browsers are enumerable, but `withHarness`
    // clears its dir and THEN launches, so there is a window in which a live
    // run's dir exists with no browser yet to hold it. In that window a
    // dead-reading owner would let this delete the user-data-dir out from under
    // a browser that is starting up — the same harm as the process sweep's, in
    // the same shape, closed the same way. An unreadable mtime counts as YOUNG,
    // which is the sparing direction.
    let dirAgeSec = null;
    try { dirAgeSec = (Date.now() - statSync(full).mtimeMs) / 1000; } catch { dirAgeSec = null; }
    if (dirAgeSec === null || dirAgeSec < AGE_FLOOR_SECONDS) {
      kept.push({ dir: d.name, why: `owner ${owner} DEAD but the dir is YOUNG (${dirAgeSec === null ? 'unreadable' : Math.round(dirAgeSec) + 's'} < ${AGE_FLOOR_SECONDS}s) — suspect a live run mid-launch` });
      continue;
    }
    try {
      if (!statSync(full).isDirectory()) { kept.push({ dir: d.name, why: 'not a directory' }); continue; }
      rmSync(full, { recursive: true, force: true });
      removed.push(d.name);
    } catch {
      kept.push({ dir: d.name, why: 'removal failed (in use or locked)' });
    }
  }
  return { removed, kept, enumerated };
}

/**
 * THE REAP. Enumerate, resolve every owner, kill only the verified-dead ones by
 * PID, confirm the count actually fell, and report — every run, including the
 * runs where there is nothing to do.
 *
 * `log` is called with plain lines; the caller decides where they land. The
 * report is returned as data so a caller can act on `survivors` (the guard) and
 * on `mismatch` (stop and report) rather than re-deriving either.
 */
export async function reapOrphans({
  log = () => {},
  dryRun = false,
  // SEAMS FOR THE HARNESS, defaulting to the real thing. The stop-and-report
  // clause is the single most important behaviour in this file and the one that
  // cost another lane a suite when it was absent — so it must be provable
  // WITHOUT arranging a real stuck browser on a shared box, which is not
  // something anyone can arrange safely or repeatably. scripts/harness/item99.mjs
  // injects a table and a kill that deliberately fails, and watches this
  // function refuse to escalate. Nothing else passes these.
  enumerate = enumerateHarnessBrowsers,
  kill = killPid,
  pollMs = 200,
  polls = 8,
} = {}) {
  const started = Date.now();
  const before = enumerate();

  if (before === null) {
    log('REAPER: SKIPPED — could not enumerate processes, so no owner can be verified dead. Nothing killed.');
    return { enumerated: null, reaped: [], survivors: null, liveOwners: [], unknownOwners: [], mismatch: false, dirs: null };
  }

  // Resolve each DISTINCT owner once — the answer is a property of the owner,
  // not of each of its nine child processes — and decide through the one pure
  // function the harness proves.
  const { owners, states, targets, spared, liveOwners, unknownOwners, youngSpared, ageUnknownSpared, ageFloorSec } = selectReapTargets(before);

  // THE LOG IS NOT CONDITIONAL. The 2026-08-03 authorized sweep executed
  // against an empty target set and recorded exactly that; an empty, dated,
  // reviewable record is the honest one, and it is also the only way a later
  // reader can tell "the reaper found nothing" from "the reaper never ran."
  log(`REAPER: ${before.length} harness browser(s), ${owners.length} owner(s) — `
    + owners.map((o) => {
      const st = states.get(o) === 'dead' ? 'DEAD' : states.get(o) === 'unknown' ? 'UNKNOWN' : 'alive';
      const ages = before.filter((b) => b.owner === o).map((b) => b.ageSec).filter((x) => typeof x === 'number');
      return `${o}:${st}${ages.length ? `/${Math.min(...ages)}-${Math.max(...ages)}s` : ''}`;
    }).join(' ')
    + ` | floor=${ageFloorSec}s | targets=${targets.length}${dryRun ? ' (DRY RUN)' : ''}`);
  // RATIFIED 2026-09-05 — UNKNOWN IS SPARED AND REPORTED. Saying it on its own
  // line, rather than letting it hide inside the roster above, is the whole
  // point: an owner we could not resolve is the one case where a reader might
  // otherwise assume the sweep had checked and found it live. It did not check;
  // it failed to, and said so. Nothing is reaped on an unknown, ever.
  // RULED 2026-09-07 — YOUNG IS SPARED AND REPORTED IN ITS OWN WORDS. A browser
  // under the floor whose owner reads dead is the single most dangerous thing
  // this reaper can see: it looks exactly like a corpse and may be a live run
  // whose parentage detached. Saying so plainly is what stops a later reader
  // "helpfully" lowering the floor to collect it.
  if (youngSpared.length > 0) {
    const byOwner = [...new Set(youngSpared.map((b) => b.owner))];
    log(`REAPER: ${youngSpared.length} browser(s) of ${byOwner.length} dead-reading owner(s) are YOUNGER than the ${ageFloorSec}s floor and are SPARED — ${byOwner.join(',')}`);
    log('  young, owner-unresolved: SUSPECT A LIVE RUN WITH DETACHED PARENTAGE. On Edge a browser 30s');
    log('  old has been observed reporting its owner GONE while a foreign suite was actively running it,');
    log('  so a dead-owner reading alone is NECESSARY AND NOT SUFFICIENT. If these are genuinely corpses');
    log(`  they become reapable at ${ageFloorSec}s; until then this run refuses rather than guesses.`);
    for (const b of youngSpared) log(`  spare browserPid=${b.pid} ownerNodePid=${b.owner} age=${b.ageSec}s (floor ${ageFloorSec}s)`);
  }
  if (ageUnknownSpared.length > 0) {
    log(`REAPER: ${ageUnknownSpared.length} dead-owner browser(s) have NO READABLE AGE and are SPARED — an age we failed to read is not an old one`);
    for (const b of ageUnknownSpared) log(`  spare browserPid=${b.pid} ownerNodePid=${b.owner} age=unreadable`);
  }
  if (unknownOwners.length > 0) {
    log(`REAPER: ${unknownOwners.length} owner(s) UNRESOLVABLE and therefore SPARED — ${unknownOwners.join(',')}`);
    log('  unknown is not dead. Their browsers are left standing, and if they are in fact corpses');
    log('  the dirty-machine guard will refuse this run — which is the correct, conservative cost.');
  }

  if (targets.length === 0) {
    const dirs = dryRun ? null : reapStaleProfileDirs(new Set(before.map((b) => b.owner)));
    if (dirs) logDirs(log, dirs);
    log(`REAPER: nothing to reap${spared.length ? ` — ${spared.length} browser(s) belong to LIVE owner(s) ${liveOwners.join(',')} and are untouched` : ''}.`);
    return { enumerated: before.length, reaped: [], reapFailed: [], survivors: spared, liveOwners, unknownOwners, youngSpared, ageUnknownSpared, ageFloorSec, mismatch: false, dirs, ms: Date.now() - started };
  }

  log(`REAPER: reaping ${targets.length} browser(s) of verified-dead owner(s) `
    + `${[...new Set(targets.map((t) => t.owner))].join(',')} — by enumerated PID, never by signature:`);
  for (const t of targets) log(`  reap browserPid=${t.pid} ownerNodePid=${t.owner} (owner VERIFIED DEAD)`);

  const reaped = [];
  const reapFailed = [];
  if (!dryRun) {
    for (const t of targets) (kill(t.pid) ? reaped : reapFailed).push(t.pid);
  }

  // Confirm the count actually fell. Browsers do not exit instantly, so this
  // polls briefly before drawing any conclusion — a mismatch declared on a
  // process that was merely still shutting down would cry wolf, and a guard
  // that cries wolf teaches lanes to discount it.
  const targetPids = new Set(targets.map((t) => t.pid));
  let after = before;
  if (!dryRun) {
    for (let i = 0; i < polls; i++) {
      await sleep(pollMs);
      const now = enumerate();
      if (now === null) break;
      after = now;
      if (!now.some((b) => targetPids.has(b.pid))) break;
    }
  }

  const stubborn = after.filter((b) => targetPids.has(b.pid));
  const mismatch = stubborn.length > 0;
  if (mismatch) {
    // S4, clause 3. This is the exact moment the 2026-08-04 incident escalated,
    // and the exact moment this reaper refuses to.
    log(`REAPER: STOP AND REPORT — ${stubborn.length} reaped PID(s) are STILL PRESENT after the sweep: `
      + stubborn.map((b) => `${b.pid}(owner ${b.owner})`).join(', '));
    log('  A sweep that does not reduce the count is evidence that the MODEL is wrong, not that the');
    log('  tool is weak. This reaper does not escalate: no signature sweep, no tree-kill, no wider');
    log('  net. Investigate by hand, and let the caller\'s dirty-machine guard refuse this run.');
  }

  // `after` IS the survivor set: it was re-enumerated from the live machine
  // after the sweep, so it already excludes whatever actually died and still
  // contains anything stubborn. Reporting the machine as it is beats
  // reporting what the sweep intended.
  const survivors = after;
  const dirs = dryRun ? null : reapStaleProfileDirs(new Set(after.map((b) => b.owner)));
  if (dirs) logDirs(log, dirs);

  log(`REAPER: reaped=${reaped.length}${reapFailed.length ? ` failed=${reapFailed.length}` : ''}`
    + ` survivors=${survivors.length}${liveOwners.length ? ` (live owners ${liveOwners.join(',')}, untouched)` : ''}`
    + ` in ${Date.now() - started}ms`);

  return { enumerated: before.length, reaped, reapFailed, survivors, liveOwners, unknownOwners, youngSpared, ageUnknownSpared, ageFloorSec, mismatch, dirs, ms: Date.now() - started };
}

function logDirs(log, dirs) {
  if (dirs.enumerated === null) { log('REAPER: could not read the temp directory; no profile dirs swept.'); return; }
  if (dirs.removed.length === 0 && dirs.kept.length === 0) return;
  log(`REAPER: profile dirs — ${dirs.enumerated} found, ${dirs.removed.length} removed (owner verified dead, unheld), ${dirs.kept.length} kept.`);
  for (const k of dirs.kept.slice(0, 6)) log(`  kept ${k.dir} — ${k.why}`);
  if (dirs.kept.length > 6) log(`  …and ${dirs.kept.length - 6} more kept`);
}

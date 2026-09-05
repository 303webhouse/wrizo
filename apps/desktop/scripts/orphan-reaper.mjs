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
      const ps = "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='chrome.exe'\" | "
        + `Where-Object { $_.CommandLine -like '*${PROFILE_PREFIX}*' } | `
        + `ForEach-Object { if ($_.CommandLine -match '${PROFILE_PREFIX}(\\d+)') { "$($_.ProcessId) $($Matches[1])" } }`;
      const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 30000 });
      return out.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [pid, owner] = l.split(/\s+/);
        return { pid: Number(pid), owner: Number(owner) };
      });
    }
    const out = execFileSync('ps', ['-eo', 'pid=,args='], { encoding: 'utf8', timeout: 30000 });
    return out.split('\n').map((l) => {
      const m = l.match(new RegExp(`^\\s*(\\d+)\\s+.*${OWNER_IN_CMDLINE.source}`));
      return m ? { pid: Number(m[1]), owner: Number(m[2]) } : null;
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
export function ownerAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e && e.code === 'ESRCH' ? false : true;
  }
}

/**
 * THE KILL DECISION, as a pure function — given a table of browsers and a way
 * to ask whether an owner is alive, which ones may lawfully be reaped?
 *
 * It is separated from the process work on purpose. This is the whole of the
 * S4 law's safety surface, and a reaper whose safety can only be tested by
 * killing real browsers on a shared box is a reaper whose safety is never
 * tested. scripts/harness/item99.mjs drives this with fabricated tables —
 * live owner, dead owner, own owner, unknown owner — and needs no browser and
 * no box to do it.
 *
 * SPARED, always: an owner that is alive, an owner we cannot resolve, and our
 * own PID. Only `isAlive(owner) === false` — an explicit, verified NO — is a
 * licence, and it is the only one.
 */
export function selectReapTargets(browsers, { self = process.pid, isAlive = ownerAlive } = {}) {
  const owners = [...new Set(browsers.map((b) => b.owner))];
  const alive = new Map(owners.map((o) => [o, isAlive(o)]));
  const targets = browsers.filter((b) => b.owner !== self && alive.get(b.owner) === false);
  const spared = browsers.filter((b) => !targets.includes(b));
  return {
    owners,
    alive,
    targets,
    spared,
    liveOwners: owners.filter((o) => alive.get(o) !== false),
    deadOwners: owners.filter((o) => o !== self && alive.get(o) === false),
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
    if (ownerAlive(owner)) { kept.push({ dir: d.name, why: `owner ${owner} ALIVE` }); continue; }
    if (heldOwners.has(owner)) { kept.push({ dir: d.name, why: `a browser still holds owner ${owner}` }); continue; }
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
    return { enumerated: null, reaped: [], survivors: null, liveOwners: [], mismatch: false, dirs: null };
  }

  // Resolve each DISTINCT owner once — the answer is a property of the owner,
  // not of each of its nine child processes — and decide through the one pure
  // function the harness proves.
  const { owners, alive, targets, spared, liveOwners } = selectReapTargets(before);

  // THE LOG IS NOT CONDITIONAL. The 2026-08-03 authorized sweep executed
  // against an empty target set and recorded exactly that; an empty, dated,
  // reviewable record is the honest one, and it is also the only way a later
  // reader can tell "the reaper found nothing" from "the reaper never ran."
  log(`REAPER: ${before.length} harness browser(s), ${owners.length} owner(s) — `
    + owners.map((o) => `${o}:${alive.get(o) === false ? 'DEAD' : 'alive'}`).join(' ')
    + ` | dead-owner targets=${targets.length}${dryRun ? ' (DRY RUN)' : ''}`);

  if (targets.length === 0) {
    const dirs = dryRun ? null : reapStaleProfileDirs(new Set(before.map((b) => b.owner)));
    if (dirs) logDirs(log, dirs);
    log(`REAPER: nothing to reap${spared.length ? ` — ${spared.length} browser(s) belong to LIVE owner(s) ${liveOwners.join(',')} and are untouched` : ''}.`);
    return { enumerated: before.length, reaped: [], reapFailed: [], survivors: spared, liveOwners, mismatch: false, dirs, ms: Date.now() - started };
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

  return { enumerated: before.length, reaped, reapFailed, survivors, liveOwners, mismatch, dirs, ms: Date.now() - started };
}

function logDirs(log, dirs) {
  if (dirs.enumerated === null) { log('REAPER: could not read the temp directory; no profile dirs swept.'); return; }
  if (dirs.removed.length === 0 && dirs.kept.length === 0) return;
  log(`REAPER: profile dirs — ${dirs.enumerated} found, ${dirs.removed.length} removed (owner verified dead, unheld), ${dirs.kept.length} kept.`);
  for (const k of dirs.kept.slice(0, 6)) log(`  kept ${k.dir} — ${k.why}`);
  if (dirs.kept.length > 6) log(`  …and ${dirs.kept.length - 6} more kept`);
}

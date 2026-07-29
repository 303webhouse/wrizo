// DF1.1 S3 (item 66) — THE COMMITTED SUITE RUNNER.
//
// Until this file existed, every lane wrote its own throwaway runner in a
// scratch directory and re-learned the same two lessons the hard way. Both had
// already cost a lane an afternoon this week, and neither lived anywhere a
// future lane would find it — they lived in one agent's memory. That is the
// actual defect this slice fixes: the knowledge was not in the repo.
//
// Run (from apps/desktop, with dist-web freshly built):
//   node scripts/run-suite.mjs                 # HARNESS_PARKED unset
//   node scripts/run-suite.mjs --parked        # HARNESS_PARKED=1
//   node scripts/run-suite.mjs --only tu2.mjs,j5.mjs
// Exit 0 only if EVERY file returned a verdict AND every verdict passed.
//
// ---------------------------------------------------------------------------
// THE THREE HYGIENE LAWS THIS RUNNER ENCODES
//
// 1. NEVER `$(node harness.mjs)` — the stall. Command substitution keeps the
//    pipe open until every writer closes it, and the harness's headless browser
//    is a grandchild holding that same pipe. A run whose node process had
//    already exited could still block the shell forever, which read as "the
//    suite runs forever" and was diagnosed twice as a hang in the suite itself.
//    Here every child writes to its OWN FILE via a redirected stdio handle and
//    the runner waits on process exit, never on a pipe.
//
// 2. CLEANUP IS SCOPED TO PIDs THIS PROCESS SPAWNED — never by name, never by
//    pattern. `runtime-verify.mjs` names each browser profile
//    `ws-runtime-verify-<the node pid that launched it>` (see its own udd
//    line), so a child's browser is identifiable by exact provenance. A
//    by-name sweep of `--headless` processes killed another lane's in-flight
//    fx10 mid-run on this machine; five lanes share one box. This runner
//    therefore kills only `ownPids`, and only their matching profiles.
//
// 3. FAIL FAST ON A DIRTY MACHINE. Before the first file, count harness
//    browsers that this process did not spawn. If any exist, REFUSE TO START.
//    A clean refusal at second zero beats a corrupted result discovered at
//    minute forty, and it makes the environmental failure class visible
//    instead of mysterious: browser starvation shows up as
//    "CDP page target never appeared" or a silent 900s hang, both of which
//    look exactly like a flaky test and are not one.
// ---------------------------------------------------------------------------
import { spawn, execFileSync } from 'node:child_process';
import { openSync, closeSync, readFileSync, mkdirSync, writeFileSync, appendFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = path.join(HERE, 'harness');
const DESKTOP = path.join(HERE, '..');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };

const PARKED = has('--parked');
const IGNORE_FOREIGN = has('--ignore-foreign');
const PER_FILE_TIMEOUT_MS = Number(valOf('--timeout') || 15 * 60 * 1000);
const ONLY = (valOf('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const OUT_DIR = valOf('--out') || path.join(os.tmpdir(), `wrizo-suite-${process.pid}`);

mkdirSync(OUT_DIR, { recursive: true });
const LOG = path.join(OUT_DIR, PARKED ? 'suite-parked.log' : 'suite-default.log');

const say = (line) => { process.stdout.write(line + '\n'); appendFileSync(LOG, line + '\n'); };

// --- the machine this runner is sharing ------------------------------------
// Enumerate browsers holding a runtime-verify profile. Returns [{pid, owner}].
// `owner` is the node pid that launched it, parsed out of the profile dir name.
// Deliberately matches ONLY that profile signature, so an ordinary browser
// window belonging to the human at this desk is structurally invisible here.
function harnessBrowsers() {
  try {
    if (process.platform === 'win32') {
      const ps = "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='chrome.exe'\" | "
        + "Where-Object { $_.CommandLine -like '*ws-runtime-verify-*' } | "
        + "ForEach-Object { if ($_.CommandLine -match 'ws-runtime-verify-(\\d+)') { \"$($_.ProcessId) $($Matches[1])\" } }";
      const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 30000 });
      return out.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [pid, owner] = l.split(/\s+/);
        return { pid: Number(pid), owner: Number(owner) };
      });
    }
    const out = execFileSync('ps', ['-eo', 'pid=,args='], { encoding: 'utf8', timeout: 30000 });
    return out.split('\n').map((l) => {
      const m = l.match(/^\s*(\d+)\s+.*ws-runtime-verify-(\d+)/);
      return m ? { pid: Number(m[1]), owner: Number(m[2]) } : null;
    }).filter(Boolean);
  } catch {
    return null; // enumeration itself failed — reported, never silently "clean"
  }
}

// Kill ONLY this runner's own child and that child's own browser profile.
function killOwn(childPid) {
  const killed = [];
  for (const b of harnessBrowsers() || []) {
    if (b.owner !== childPid) continue; // provenance, not pattern
    try {
      if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(b.pid), '/t', '/f'], { stdio: 'ignore' });
      else process.kill(b.pid, 'SIGKILL');
      killed.push(b.pid);
    } catch { /* already gone */ }
  }
  return killed;
}

// --- guard 3: refuse to start on a dirty machine ---------------------------
const preexisting = harnessBrowsers();
writeFileSync(LOG, '');
if (preexisting === null) {
  say('SUITE REFUSED: could not enumerate processes, so "is this machine quiet?" cannot be answered.');
  say('  A suite result that cannot state its own conditions is not evidence. Fix enumeration or pass --ignore-foreign knowingly.');
  if (!IGNORE_FOREIGN) process.exit(2);
}
if (preexisting && preexisting.length > 0) {
  say(`SUITE REFUSED: ${preexisting.length} harness browser process(es) on this machine were not spawned by this runner.`);
  for (const b of preexisting) say(`  browserPid=${b.pid} ownerNodePid=${b.owner}`);
  say('  Another lane is mid-suite, or a killed run left orphans. Either way this run would be');
  say('  measuring a contended machine: browser starvation presents as "CDP page target never');
  say('  appeared" or a silent hang, which is indistinguishable from a flaky test and is not one.');
  say('  Wait for the quiet window, or pass --ignore-foreign to run anyway (the result is then');
  say('  stamped CONTAMINATED and must not be cited as a clean sweep).');
  if (!IGNORE_FOREIGN) process.exit(2);
}
const contaminated = !!(preexisting && preexisting.length > 0) || preexisting === null;

// --- run ------------------------------------------------------------------
const files = readdirSync(HARNESS_DIR).filter((f) => f.endsWith('.mjs'))
  .filter((f) => ONLY.length === 0 || ONLY.includes(f)).sort();

say(`SUITE START HARNESS_PARKED=${PARKED ? '1' : 'unset'} files=${files.length} out=${OUT_DIR}${contaminated ? ' CONTAMINATED=yes' : ''}`);

const ownPids = new Set();

function runOne(file) {
  return new Promise((resolve) => {
    const outFile = path.join(OUT_DIR, `${file}.${PARKED ? 'parked' : 'default'}.txt`);
    // LAW 1 — a real file descriptor, never a pipe this process must drain.
    const fd = openSync(outFile, 'w');
    const env = { ...process.env };
    if (PARKED) env.HARNESS_PARKED = '1'; else delete env.HARNESS_PARKED;
    const child = spawn(process.execPath, [path.join('scripts/harness', file)], {
      cwd: DESKTOP, env, stdio: ['ignore', fd, fd],
    });
    ownPids.add(child.pid);
    let timedOut = false;
    let sweptBrowsers = [];
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch { /* gone */ }
      sweptBrowsers = killOwn(child.pid); // LAW 2 — this child's browser only
    }, PER_FILE_TIMEOUT_MS);
    child.on('close', (code) => {
      clearTimeout(timer);
      try { closeSync(fd); } catch { /* already closed */ }
      ownPids.delete(child.pid);
      let text = '';
      try { text = readFileSync(outFile, 'utf8'); } catch { /* unreadable */ }
      const verdicts = text.split('\n').filter((l) => /VERIFY:|PARKED:/.test(l)).map((l) => l.trim());
      const failed = verdicts.filter((v) => /FAIL/.test(v));
      resolve({ file, code, timedOut, sweptBrowsers, verdicts, failed, outFile, childPid: child.pid });
    });
  });
}

// DF1.1 S3 — the guard again, BETWEEN files. Checking only at startup leaves the
// obvious hole: another lane starts at minute three and every file after it is
// measured on a contended machine, discovered (if at all) at minute forty. A
// sweep whose whole purpose is "three consecutive clean runs" has to know the
// moment its conditions stop holding, so it stops THEN and says why.
function foreignNow() {
  const bs = harnessBrowsers();
  if (bs === null) return [];               // enumeration failure is reported at startup, not re-litigated per file
  return bs.filter((b) => !ownPids.has(b.owner));
}

const results = [];
let abortedAt = null;
for (let i = 0; i < files.length; i++) {
  const intruders = foreignNow();
  if (intruders.length > 0 && !IGNORE_FOREIGN) {
    abortedAt = files[i];
    say('');
    say(`SUITE ABORTED before ${files[i]}: ${intruders.length} foreign harness browser(s) appeared MID-RUN`);
    for (const b of intruders.slice(0, 8)) say(`  browserPid=${b.pid} ownerNodePid=${b.owner}`);
    say('  Another lane started while this sweep was running. Everything measured from here would be');
    say('  measured under contention, so this run is VOID rather than partly trustworthy. Re-run it');
    say('  whole in a quiet window — a sweep cannot be half-clean.');
    break;
  }
  const t0 = Date.now();
  const r = await runOne(files[i]);
  const secs = Math.round((Date.now() - t0) / 1000);
  // HOUSE LAW: a stalled report is a report that does not exist. A file that
  // produced no VERIFY line did not test anything, whatever its exit code —
  // it is a MISSING verdict, never a passing one.
  const noVerdict = !r.verdicts.some((v) => /VERIFY:/.test(v));
  const status = r.timedOut ? 'TIMEOUT' : noVerdict ? 'NOVERDICT' : (r.code === 0 && r.failed.length === 0) ? 'OK' : 'FAIL';
  r.status = status;
  results.push(r);
  say(`[${String(i + 1).padStart(2, '0')}/${files.length}] ${status.padEnd(9)} exit=${r.code} ${String(secs).padStart(4)}s ${files[i]}`
    + `${r.sweptBrowsers.length ? ` swept=${r.sweptBrowsers.join(',')}` : ''} :: ${r.verdicts.join(' ;; ') || `(no verdict — see ${r.outFile})`}`);
}

const bad = results.filter((r) => r.status !== 'OK');
say('');
say(`SUITE DONE HARNESS_PARKED=${PARKED ? '1' : 'unset'} — ${results.length - bad.length}/${results.length} of ${files.length} returned a passing verdict`
  + `${contaminated ? ' [CONTAMINATED: foreign browsers present at start]' : ''}`);
for (const r of bad) say(`  ${r.status}: ${r.file} — full output at ${r.outFile}`);
const clean = bad.length === 0 && !contaminated && !abortedAt && results.length === files.length;
say(`SUITE RESULT: ${clean ? 'CLEAN' : abortedAt ? `VOID (aborted mid-run at ${abortedAt})` : bad.length === 0 ? 'PASS-BUT-CONTAMINATED' : 'NOT CLEAN'}`);
process.exit(clean ? 0 : 1);

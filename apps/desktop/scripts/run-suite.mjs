// DF1.1 S3 (item 66) — THE COMMITTED SUITE RUNNER.
//
// Until this file existed, every lane wrote its own throwaway runner in a
// scratch directory and re-learned the same two lessons the hard way. Both had
// already cost a lane an afternoon this week, and neither lived anywhere a
// future lane would find it — they lived in one agent's memory. That is the
// actual defect this slice fixes: the knowledge was not in the repo.
//
// Run (from apps/desktop — it REBUILDS dist-web itself before running):
//   node scripts/run-suite.mjs                 # HARNESS_PARKED unset
//   node scripts/run-suite.mjs --parked        # HARNESS_PARKED=1
//   node scripts/run-suite.mjs --only tu2.mjs,j5.mjs
//   node scripts/run-suite.mjs --no-rebuild    # quick iteration; STAMPED as such
// Exit 0 only if EVERY file returned a verdict AND every verdict passed.
//
// Every verdict record carries a PROVENANCE STAMP — `tree=<sha> bundle=<asset
// hash>/<bytes>` — on SUITE START, on SUITE RESULT, and in `manifest.json`
// beside the logs. Quote the stamp whenever you quote a result: a suite claim
// without it names its source but not its software (item 77(c), below).
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
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { openSync, closeSync, readFileSync, statSync, mkdirSync, writeFileSync, appendFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
// ITEM 99 — the canonical dead-owner sweep. Imported, never re-implemented: the
// runner used to carry its own copy of the enumerator, which is exactly the
// "two formulas for one number" shape this repo keeps having to unpick. One
// definition now, inherited by every lane through this runner AND through
// runtime-verify's own withHarness.
import { enumerateHarnessBrowsers, reapOrphans } from './orphan-reaper.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = path.join(HERE, 'harness');
const DESKTOP = path.join(HERE, '..');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };

const PARKED = has('--parked');
const IGNORE_FOREIGN = has('--ignore-foreign');
// ITEM 99 — the reaper is ON by default; --no-reap is the escape hatch for a
// lane that wants the machine left exactly as found (a forensic run).
const NO_REAP = has('--no-reap');
const NO_REBUILD = has('--no-rebuild');
const PER_FILE_TIMEOUT_MS = Number(valOf('--timeout') || 15 * 60 * 1000);
const ONLY = (valOf('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const OUT_DIR = valOf('--out') || path.join(os.tmpdir(), `wrizo-suite-${process.pid}`);

mkdirSync(OUT_DIR, { recursive: true });
const LOG = path.join(OUT_DIR, PARKED ? 'suite-parked.log' : 'suite-default.log');

const say = (line) => { process.stdout.write(line + '\n'); appendFileSync(LOG, line + '\n'); };

// ---------------------------------------------------------------------------
// ITEM 77(c) — PROVENANCE. A suite result must be able to say WHAT IT TESTED.
//
// The gap this closes, ratified structural after item 82's diagnosis: this
// harness serves `apps/desktop/dist-web`, a BUILD ARTIFACT. `dist-web/` is
// gitignored with zero tracked files, so A TREE SHA DOES NOT PIN WHAT RAN. Two
// worktrees at byte-identical `apps/` can serve entirely different applications
// depending on when each last built — and that is not hypothetical: during
// item 82's diagnosis a worktree was found on this machine carrying +995 lines
// of a ticket's source while serving a byte-identical clean-main bundle. A red
// measured there could be neither validated nor invalidated afterwards, because
// the one identifier anybody had recorded (the SHA) described the source and
// not the software.
//
// So every verdict record now carries BOTH identifiers — tree SHA and the
// served bundle's asset hash — and a suite REBUILDS before it runs, so the two
// cannot silently drift apart in the first place. The cost is ~2s; the thing it
// buys is that any future red is falsifiable on arrival instead of forensically
// irrecoverable a day later.
function gitInfo() {
  const run = (args) => { try { return execFileSync('git', args, { cwd: DESKTOP, encoding: 'utf8' }).trim(); } catch { return null; } };
  const sha = run(['rev-parse', '--short', 'HEAD']);
  const dirty = run(['status', '--porcelain']);
  return { sha: sha || 'unknown', dirty: dirty ? dirty.split('\n').filter(Boolean).length : 0 };
}

// The served bundle's identity, read from what will actually be served.
function bundleInfo() {
  const dist = path.join(DESKTOP, 'dist-web');
  try {
    const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
    const js = (html.match(/index-[A-Za-z0-9_-]+\.js/) || [])[0] || null;
    const css = (html.match(/index-[A-Za-z0-9_-]+\.css/) || [])[0] || null;
    let bytes = null;
    if (js) { try { bytes = statSync(path.join(dist, 'assets', js)).size; } catch { /* unreadable */ } }
    return { js, css, bytes };
  } catch {
    return { js: null, css: null, bytes: null };
  }
}

// A suite of record rebuilds before running (Fable, 2026-07-31). Skippable with
// --no-rebuild for quick iteration, but the skip is STAMPED into the record so a
// result produced without it can never be mistaken for a suite of record.
function rebuild() {
  if (NO_REBUILD) return { rebuilt: false, ok: null };
  const r = spawnSync('pnpm', ['run', 'build:web'], { cwd: DESKTOP, encoding: 'utf8', shell: process.platform === 'win32' });
  return { rebuilt: true, ok: r.status === 0, err: r.status === 0 ? null : (r.stderr || r.stdout || '').split('\n').slice(-4).join(' | ') };
}

const build = rebuild();
if (build.rebuilt && !build.ok) {
  say(`SUITE REFUSED: the pre-run rebuild FAILED, so what would be served is unknown and stale. ${build.err || ''}`);
  process.exit(2);
}
const GIT = gitInfo();
const BUNDLE = bundleInfo();
// The one string every verdict record carries. Named so a reader can tell at a
// glance whether two results are even comparable.
const STAMP = `tree=${GIT.sha}${GIT.dirty ? `+${GIT.dirty}dirty` : ''} bundle=${BUNDLE.js || 'MISSING'}${BUNDLE.bytes ? `/${BUNDLE.bytes}b` : ''}${build.rebuilt ? '' : ' NO-REBUILD'}`;
// And the same facts machine-readably, beside the logs. Comparing two results
// is precisely what item 82 could not do after the fact; this makes it a diff.
writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({
  startedAt: new Date().toISOString(),
  setting: PARKED ? 'HARNESS_PARKED=1' : 'unset',
  tree: GIT.sha,
  dirtyFiles: GIT.dirty,
  bundle: BUNDLE,
  rebuiltBeforeRun: build.rebuilt,
  runner: 'run-suite.mjs (item 77(c) stamp)',
}, null, 2));

// --- the machine this runner is sharing ------------------------------------
// Enumerate browsers holding a runtime-verify profile. Returns [{pid, owner}].
// `owner` is the node pid that launched it, parsed out of the profile dir name.
// Deliberately matches ONLY that profile signature, so an ordinary browser
// window belonging to the human at this desk is structurally invisible here.
// ITEM 99 — SINGLE-SOURCED. This was a verbatim copy of the enumerator that now
// lives in orphan-reaper.mjs. The reaper has to enumerate in order to decide,
// and this runner has to enumerate in order to refuse; two copies of one query
// is how a convention drifts in one file and not the other.
const harnessBrowsers = enumerateHarnessBrowsers;

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

// --- ITEM 99 PREFLIGHT: reap dead-owner orphans, THEN judge the machine -----
//
// ORDER IS THE WHOLE DESIGN. The reap runs BEFORE guard 3 reads the machine, so
// the guard judges the machine as it actually is rather than as a dead lane
// left it. It runs AFTER the log is opened, so every run carries the sweep's
// own record — count, PIDs, owners — including the runs that reap nothing.
//
// AND THE GUARD IS NOT WEAKENED BY IT. The reaper removes corpses only; a
// browser whose owner is ALIVE is untouched, so it is still sitting there when
// guard 3 looks, and the refusal below still fires. That is the S4 law's first
// clause working as intended: a runner's live refusal outranks metadata, and it
// outranks this reaper too.
writeFileSync(LOG, '');
let reapReport = null;
if (NO_REAP) {
  say('REAPER: SKIPPED by --no-reap — the machine is left exactly as found.');
} else {
  reapReport = await reapOrphans({ log: say });
  // S4 clause 3, enforced rather than merely documented. A reaped PID that is
  // still present means the model of this machine is wrong, and the one thing
  // this runner must never do at that moment is reach for a wider net. It stops
  // — and --ignore-foreign deliberately does NOT cover this, because "run
  // anyway" is exactly the reflex that cost another lane a suite on 2026-08-04.
  if (reapReport.mismatch) {
    say('SUITE REFUSED: the reaper reported a post-sweep count mismatch (above). This is the');
    say('  stop-and-report case from the S4 incident, and it is not overridable by');
    say('  --ignore-foreign. Investigate by hand before running anything on this box.');
    process.exit(2);
  }
  // The sweep belongs in the machine-readable record too, beside the stamp.
  try {
    const mf = path.join(OUT_DIR, 'manifest.json');
    const prior = JSON.parse(readFileSync(mf, 'utf8'));
    writeFileSync(mf, JSON.stringify({ ...prior, reaper: {
      enumerated: reapReport.enumerated,
      reaped: reapReport.reaped,
      reapFailed: reapReport.reapFailed || [],
      liveOwnersUntouched: reapReport.liveOwners,
      profileDirsRemoved: reapReport.dirs ? reapReport.dirs.removed : null,
    } }, null, 2));
  } catch { /* the log already carries it; the manifest is a convenience */ }
}

// --- guard 3: refuse to start on a dirty machine ---------------------------
const preexisting = harnessBrowsers();
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

say(`SUITE START HARNESS_PARKED=${PARKED ? '1' : 'unset'} files=${files.length} ${STAMP} out=${OUT_DIR}${contaminated ? ' CONTAMINATED=yes' : ''}`);

const ownPids = new Set();

function runOne(file) {
  return new Promise((resolve) => {
    const outFile = path.join(OUT_DIR, `${file}.${PARKED ? 'parked' : 'default'}.txt`);
    // LAW 1 — a real file descriptor, never a pipe this process must drain.
    const fd = openSync(outFile, 'w');
    const env = { ...process.env };
    if (PARKED) env.HARNESS_PARKED = '1'; else delete env.HARNESS_PARKED;
    // ITEM 99 — this runner already reaped, once, in its own preflight. Tell the
    // children so withHarness does not re-sweep 67 times while this suite's own
    // siblings are alive on the box.
    env.WS_REAPER_PREFLIGHT_DONE = '1';
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
      // DF1.1 S3 — match the verdict line by SHAPE, not by the literal
      // "VERIFY:". fx7.mjs prints "FX7 VERIFY (partial): PASS (45 checks)" —
      // a deliberate, permanent wording — so a literal `VERIFY:` test reported
      // a fully passing file as NOVERDICT. Caught by the DoD's own first sweep.
      // That is precisely the "a tool that reds on known-benign" disease this
      // ticket is fixing in the audit (S4), reproduced in this runner; a suite
      // driver that cries wolf teaches lanes to discount it.
      const verdicts = text.split('\n').filter((l) => /\bVERIFY\b[^\n]*:|\bPARKED\b[^\n]*:/.test(l)).map((l) => l.trim());
      const failed = verdicts.filter((v) => /\bFAIL\b/.test(v));
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
  const noVerdict = !r.verdicts.some((v) => /\bVERIFY\b[^\n]*:/.test(v));
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
say(`SUITE RESULT: ${clean ? 'CLEAN' : abortedAt ? `VOID (aborted mid-run at ${abortedAt})` : bad.length === 0 ? 'PASS-BUT-CONTAMINATED' : 'NOT CLEAN'} — ${STAMP}`);
process.exit(clean ? 0 : 1);

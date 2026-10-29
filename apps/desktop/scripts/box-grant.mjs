// ITEM 140 — THE GRANT IS A FILE ON THE BOX.
//
// THE PROBLEM ITEM 139 LEFT. Item 139 moved the turn refusal into `withHarness`,
// so every browser crosses it — but all it could ask was whether `WS_BOX_TURN`
// was SET. A token that is merely present is a token any shell can invent, and
// worse, a token exported during a turn that has since ENDED keeps working
// forever: the environment remembers what the box has forgotten. A lane that
// finished at noon could open a browser at midnight and the guard would agree.
//
// THE RULE THIS FILE ADDS. The grant is a FILE, written by chat 1 at the
// announcement and cleared by chat 1 at the stamp. The lane exports the token it
// was given. `withHarness` refuses unless the exported token MATCHES THE FILE —
// never merely present. So the moment chat 1 clears the file, a stale token
// fails, which is the whole difference between this and item 139 with extra
// steps.
//
// NO EXPIRY, DELIBERATELY. A grant does not time out. A pair can run for an hour
// and a suite can be slow, and a guard that refused mid-run because a clock
// passed would be a worse failure than the one it prevents — it would void a
// legitimate run at its most expensive moment. The FORGOTTEN CLEAR is the
// hazard instead, and it is handled where it belongs: chat 1's half writes the
// clear into the stamp sequence, so the same act that ends the turn ends the
// grant.
//
// THE PATH IS ONE CONSTANT THAT BOTH HALVES COMPILE IN, NEVER A CONVENTION.
// Chat 1's writer and this lane's guard both import `GRANT_PATH` from here. Two
// halves that each spell a path agree until the day one of them is edited; two
// halves that import the same constant cannot disagree at all.
//
// IT LIVES OUTSIDE EVERY WORKTREE, under the user's home rather than in the
// repo. A worktree isolates FILES, and the grant is the one fact that must NOT
// be isolated: the box is one machine with one browser pool, and every lane's
// checkout has to read the same file. A grant inside a worktree would grant the
// turn to a directory instead of to the box.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

export const GRANT_DIR = path.join(os.homedir(), '.wrizo');
export const GRANT_PATH = path.join(GRANT_DIR, 'box-turn.json');

// --- THE TOKEN IS NOT IN THE FILE (Oct 23, after (145)) ----------------------------------------
//
// The hole the process-tree binding was built for: the grant file is readable by every lane on
// the box, so a lane could read the token out of it and present it. Binding the grant to a
// process tree closed that, but msys nests forks (script -> function -> `bash chunk.sh` -> node)
// and the Windows parent link breaks across the second nested fork, so the guard refused its own
// owner's harness. The fix does not depend on the process tree at all: the file stores only a
// HASH of the token. Whoever knows the token - the lane that took the box, or whoever it handed
// the token to - presents it from its environment and matches; whoever merely reads the file has
// a hash, which is not accepted as a token, and cannot run the hash backwards for a token that
// was drawn at random (`box-take.mjs take <lane>` with no token draws 128 random bits and prints
// them once, to the caller). HONEST LIMITS: a token chosen by hand ("chat1-b6p-20261023") is
// guessable offline from its hash; the token is visible on the command line of `box-take` for
// the instant it runs and in the environment of the harness processes; the process-tree holder
// below stays as an OPTIONAL extra (`box-take.mjs take --bind`), off by default. A grant written
// the old way (a plain `token` field) still matches exactly as before.
export const hashToken = (token) => createHash('sha256').update(`wrizo-box-turn:${token}`).digest('hex');
export const newToken = () => randomBytes(16).toString('hex');
export const grantHasToken = (g) => !!g && ((typeof g.tokenHash === 'string' && g.tokenHash.length === 64) || (typeof g.token === 'string' && g.token.length > 0));
export function tokenMatches(g, token) {
  if (!grantHasToken(g) || typeof token !== 'string' || token.length === 0) return false;
  if (typeof g.tokenHash === 'string' && g.tokenHash.length === 64) {
    const a = Buffer.from(hashToken(token), 'hex'); const b = Buffer.from(g.tokenHash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return g.token === token;
}
// what to print about a grant's token: never the token (there is none to print), only a short fingerprint
export const grantFingerprint = (g) => ((g && (g.tokenHash || g.token)) ? String(g.tokenHash || g.token).slice(0, 8) + '...' : null);

// --- THE HOLDER (Oct 23: a token is checked, and so is WHO PRESENTS IT) ------
//
// THE HOLE THIS CLOSES. Item 140 made the grant a file and refused unless the exported token
// MATCHES it. A token is a string, and the file is readable by every lane on the box: a lane
// that reads the file and exports what it finds passes the match while another lane's turn is
// running (two sweeps on Oct 23 were voided by a "foreign harness browser" that appeared while
// this desk held the only grant). The fix binds the grant to a PROCESS TREE: whoever takes the
// turn through box-take.mjs / box-turn.mjs records the process it was called from (the shell
// or runner script that will go on to launch the harness), and `withHarness` refuses unless
// ITS OWN ANCESTRY contains that process. A copied token from a different tree no longer
// opens a browser. A grant written WITHOUT a holder (chat 1's older hand-written files) still
// behaves exactly as item 140 did - nothing existing breaks.
//
// Processes are identified by PID AND START TIME, because Windows reuses PIDs. If the process
// table cannot be read the check REFUSES (the same discipline as item 139: a guard that
// proceeds when it cannot see is not a guard). A holder that is no longer alive refuses with
// its own reason - a stale grant, which chat 1 clears.
export function readProcessTable() {
  const ps = spawnSync('powershell', ['-NoProfile', '-Command',
    "Get-CimInstance Win32_Process | ForEach-Object { '{0}|{1}|{2}|{3}' -f $_.ProcessId, $_.ParentProcessId, $_.CreationDate.ToUniversalTime().ToString('o'), $_.Name }"],
  { encoding: 'utf8', timeout: 20000 });
  if (ps.status !== 0 || !ps.stdout) return null;
  const table = new Map();
  for (const line of ps.stdout.split(/\r?\n/)) {
    const [pid, ppid, start, name] = line.trim().split('|');
    if (pid && /^\d+$/.test(pid)) table.set(Number(pid), { ppid: Number(ppid), start: start || '', name: name || '' });
  }
  return table.size ? table : null;
}

// The process `pid` and every ancestor that is still in the table (stops at the first parent
// that has gone, or at pid 0). Each as { pid, start }.
export function ancestryOf(pid, table) {
  const chain = [];
  const seen = new Set();
  let cur = pid;
  while (cur && table.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    const row = table.get(cur);
    chain.push({ pid: cur, start: row.start });
    cur = row.ppid;
  }
  return chain;
}

// The holder to record: the SESSION that called the taking script. Not simply its parent: under
// Git Bash (msys) every external command runs as `bash(fork) -> program`, and the fork dies the
// moment the program ends - recording it made the grant "holder-gone" the instant after it was
// taken (found by the first live end-to-end run, Oct 23). So: start at the parent and climb past
// any SHELL that was created within SKIP_MS of the taking process (a fork made for this very
// command, or a script that took the box as its first act); the first ancestor that is not such
// a shell is the holder - for a PowerShell caller that is PowerShell itself, for a script run
// from a long-lived terminal shell it is that terminal shell. A different lane's terminal is a
// different session, so it is outside the tree. `pure`: takes the table and the pid, so the rule
// is tested with synthetic tables.
export const SKIP_MS = 3000;
const SHELL = /^(bash|sh|zsh|dash)(\.exe)?$/i;
export function chooseHolder(table, selfPid) {
  const self = table && table.get(selfPid);
  if (!self) return null;
  const selfStart = Date.parse(self.start);
  let pid = self.ppid;
  for (let hops = 0; hops < 10; hops += 1) {
    const row = table.get(pid);
    if (!row) return null;
    const young = Number.isFinite(selfStart) && selfStart - Date.parse(row.start) < SKIP_MS;
    if (SHELL.test(row.name || '') && young && table.get(row.ppid)) { pid = row.ppid; continue; }
    return { pid, start: row.start };
  }
  return null;
}

export function holderOfCaller(table = readProcessTable()) {
  return table ? chooseHolder(table, process.pid) : null;
}

// --- chat 1's half ---------------------------------------------------------

// Written at the announcement. `lane` and `token` are what the relay called;
// `time` is informational only — nothing reads it to decide anything, because
// there is no expiry. `holder` ({ pid, start }) is optional: when present the grant is bound to
// that process tree (see above).
export function writeGrantAt(grantPath, lane, token, holder) {
  if (typeof lane !== 'string' || lane.length === 0) throw new Error('writeGrant: lane required');
  if (typeof token !== 'string' || token.length === 0) throw new Error('writeGrant: token required');
  mkdirSync(path.dirname(grantPath), { recursive: true });
  const rec = { lane, tokenHash: hashToken(token), time: new Date().toISOString() };
  if (holder && Number.isInteger(holder.pid)) { rec.holderPid = holder.pid; rec.holderStart = holder.start || ''; }
  const body = JSON.stringify(rec, null, 2);
  // Written whole and replaced, so a reader never sees half a grant. A partial
  // read is treated as unreadable below and refuses, but the cheaper fix is not
  // to produce one.
  const tmp = `${grantPath}.tmp`;
  writeFileSync(tmp, body, 'utf8');
  rmSync(grantPath, { force: true });
  writeFileSync(grantPath, body, 'utf8');
  rmSync(tmp, { force: true });
  return grantPath;
}

export function writeGrant(lane, token, holder) {
  return writeGrantAt(GRANT_PATH, lane, token, holder);
}

// Cleared at the stamp. Idempotent: clearing a grant that is already gone is
// success, because the state it is asserting is "no turn is granted", and that
// is true either way.
export function clearGrant() {
  rmSync(GRANT_PATH, { force: true });
  return !existsSync(GRANT_PATH);
}

// --- the lane's half -------------------------------------------------------

// The matching rule, in ONE place, so `withHarness` decides nothing itself.
// Returns { ok: true, lane } or { ok: false, reason, message }.
//
// UNREADABLE COUNTS AS NO GRANT. If the file exists but cannot be parsed, this
// refuses rather than guessing — the same discipline as item 139's pre-flight,
// where an unreadable process table counts as a live foreign run. A guard that
// proceeds when it cannot see is not a guard.
export function checkGrantAt(grantPath, token, opts = {}) {
  if (typeof token !== 'string' || token.length === 0) {
    return {
      ok: false,
      reason: 'no-token-exported',
      message: 'BOX TURN NOT GRANTED — no token exported (WS_BOX_TURN is unset or empty).',
    };
  }
  if (!existsSync(grantPath)) {
    return {
      ok: false,
      reason: 'no-grant-file',
      message: 'BOX TURN NOT GRANTED — no grant file exists, so no turn is granted to ANYONE.\n'
        + `  Expected at: ${grantPath}\n`
        + '  Either the turn has not been announced yet, or chat 1 has already cleared it at\n'
        + '  the stamp. A token left over in this shell from a turn that has ENDED is exactly\n'
        + '  what this refusal is for: the environment remembers what the box has forgotten.',
    };
  }
  let grant;
  try {
    grant = JSON.parse(readFileSync(grantPath, 'utf8'));
  } catch (e) {
    return {
      ok: false,
      reason: 'grant-unreadable',
      message: `BOX TURN NOT GRANTED — the grant file could not be read: ${e && e.message}\n`
        + '  An unreadable grant refuses, rather than being treated as absent or as a match.',
    };
  }
  if (!grantHasToken(grant)) {
    return {
      ok: false,
      reason: 'grant-malformed',
      message: 'BOX TURN NOT GRANTED — the grant file carries no token.',
    };
  }
  if (!tokenMatches(grant, token)) {
    // The timestamp is read under EITHER name. writeGrant writes `time`; chat 1's
    // first live grant (2026-09-16) was written by hand as `granted` — the path
    // matched and the format drifted, which is precisely what importing
    // writeGrant prevents. Only `token` decides anything, so the match was never
    // at risk; but a refusal that prints "granted undefined" tells the reader the
    // guard is broken when it is the writer that drifted.
    const when = grant.time ?? grant.granted ?? 'at an unrecorded time';
    return {
      ok: false,
      reason: 'token-mismatch',
      message: 'BOX TURN HELD BY ANOTHER LANE — refusing to open a browser.\n'
        + `  The grant on this box names lane "${grant.lane}" (granted ${when}).\n`
        + '  Your exported token does not match it. The turn is allocated by ANNOUNCEMENT,\n'
        + '  and the file is what the announcement wrote — a token is checked against the\n'
        + '  FILE, never merely for being present.',
    };
  }
  // THE HOLDER (Oct 23): the token matches; now ask whether THIS process belongs to the process
  // tree the grant is bound to. A grant with no holder behaves as item 140 did.
  if (Number.isInteger(grant.holderPid)) {
    const table = opts.processTable === undefined ? readProcessTable() : opts.processTable;
    if (!table) {
      return {
        ok: false,
        reason: 'ancestry-unreadable',
        message: 'BOX TURN NOT GRANTED — the grant is bound to a process tree and the process table could not be read.\n'
          + '  A guard that proceeds when it cannot see is not a guard; nothing was started.',
      };
    }
    const chain = ancestryOf(opts.selfPid ?? process.pid, table);
    const holder = table.get(grant.holderPid);
    const holderAlive = !!holder && (!grant.holderStart || holder.start === grant.holderStart);
    if (!holderAlive) {
      return {
        ok: false,
        reason: 'holder-gone',
        message: `BOX TURN NOT GRANTED — the grant names lane "${grant.lane}" and is bound to a process that is no longer running.\n`
          + '  The turn is stale (its holder ended without clearing it). Chat 1 clears it; until then nothing starts.',
      };
    }
    const inTree = chain.some((c) => c.pid === grant.holderPid && (!grant.holderStart || c.start === grant.holderStart));
    if (!inTree) {
      return {
        ok: false,
        reason: 'not-the-holder',
        message: 'BOX TURN HELD BY ANOTHER PROCESS TREE — refusing to open a browser.\n'
          + `  The grant names lane "${grant.lane}" and is bound to a different process tree than this one.\n`
          + '  Your token matches the file, but a token can be copied; the turn belongs to the tree that took it.\n'
          + '  Take the box yourself (box-take.mjs, in the SAME shell/script that runs the harness), or wait.',
      };
    }
  }
  return { ok: true, lane: grant.lane };
}

// What `withHarness` calls. Takes no path, so nothing at runtime can redirect
// the real check at the real grant — `checkGrantAt` is exported for the tests
// that must drive it against temporary files, and for nothing else.
export function checkGrant(token) {
  if (isGithubHostedRunner()) return { ok: true, lane: 'github-actions' };
  return checkGrantAt(GRANT_PATH, token);
}

// CI (docs/deploy.md "Harness on GitHub Actions"): the box grant allocates ONE shared machine between lanes. A GitHub-hosted job IS its own
// throwaway machine - nothing to share and no grant file - so it needs no turn. This is deliberately impossible on the box: it is Windows, and a
// hosted runner is Linux with RUNNER_ENVIRONMENT=github-hosted set by GitHub itself. All three plus the workflow's own WS_CI_RUNNER=1 must hold.
export function isGithubHostedRunner(env = process.env, platform = process.platform) {
  return platform === 'linux' && env.GITHUB_ACTIONS === 'true' && env.RUNNER_ENVIRONMENT === 'github-hosted' && env.WS_CI_RUNNER === '1';
}

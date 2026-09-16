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
import os from 'node:os';
import path from 'node:path';

export const GRANT_DIR = path.join(os.homedir(), '.wrizo');
export const GRANT_PATH = path.join(GRANT_DIR, 'box-turn.json');

// --- chat 1's half ---------------------------------------------------------

// Written at the announcement. `lane` and `token` are what the relay called;
// `time` is informational only — nothing reads it to decide anything, because
// there is no expiry.
export function writeGrant(lane, token) {
  if (typeof lane !== 'string' || lane.length === 0) throw new Error('writeGrant: lane required');
  if (typeof token !== 'string' || token.length === 0) throw new Error('writeGrant: token required');
  mkdirSync(GRANT_DIR, { recursive: true });
  const body = JSON.stringify({ lane, token, time: new Date().toISOString() }, null, 2);
  // Written whole and replaced, so a reader never sees half a grant. A partial
  // read is treated as unreadable below and refuses, but the cheaper fix is not
  // to produce one.
  const tmp = `${GRANT_PATH}.tmp`;
  writeFileSync(tmp, body, 'utf8');
  rmSync(GRANT_PATH, { force: true });
  writeFileSync(GRANT_PATH, body, 'utf8');
  rmSync(tmp, { force: true });
  return GRANT_PATH;
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
export function checkGrantAt(grantPath, token) {
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
  if (!grant || typeof grant.token !== 'string' || grant.token.length === 0) {
    return {
      ok: false,
      reason: 'grant-malformed',
      message: 'BOX TURN NOT GRANTED — the grant file carries no token.',
    };
  }
  if (grant.token !== token) {
    return {
      ok: false,
      reason: 'token-mismatch',
      message: 'BOX TURN HELD BY ANOTHER LANE — refusing to open a browser.\n'
        + `  The grant on this box names lane "${grant.lane}" (granted ${grant.time}).\n`
        + '  Your exported token does not match it. The turn is allocated by ANNOUNCEMENT,\n'
        + '  and the file is what the announcement wrote — a token is checked against the\n'
        + '  FILE, never merely for being present.',
    };
  }
  return { ok: true, lane: grant.lane };
}

// What `withHarness` calls. Takes no path, so nothing at runtime can redirect
// the real check at the real grant — `checkGrantAt` is exported for the tests
// that must drive it against temporary files, and for nothing else.
export function checkGrant(token) {
  return checkGrantAt(GRANT_PATH, token);
}

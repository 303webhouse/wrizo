// ITEM 140 — THE GRANT IS A FILE ON THE BOX. A committed verification scenario.
//
// BROWSERLESS BY CONSTRUCTION. This file opens no browser and takes no box turn,
// which is what lets it be built and run in parallel with the box queue: only
// its PAIR needs a slot. Every check drives `checkGrantAt` against temporary
// files, so it never reads, writes or clears the real grant — a test for the
// turn guard that took the turn to run would be its own worst example.
//
// WHAT MUST BE PROVED, and the one that matters is the last:
//   1. no token exported          -> refuse
//   2. token exported, no file    -> refuse  (nobody holds the box)
//   3. file exists, token differs -> refuse  (another lane holds it, named)
//   4. file exists, token matches -> ALLOW
//   5. file unreadable/malformed  -> refuse  (never "absent", never "match")
//   6. A STALE TOKEN AFTER THE CLEAR -> refuse. This is the whole difference
//      between item 140 and item 139: the same token that was valid a moment ago
//      must fail the instant chat 1 clears the file. Without check 6, 140 is 139
//      with extra steps, and the check is the thing that says so.
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { checkGrantAt, GRANT_PATH, writeGrant, clearGrant } from './box-grant.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const tmp = mkdtempSync(path.join(os.tmpdir(), 'ws-grant-'));
const at = (name) => path.join(tmp, name);
const put = (name, body) => { const p = at(name); writeFileSync(p, body, 'utf8'); return p; };

const GRANTED = put('granted.json', JSON.stringify({
  lane: 'errata', token: 'errata-wave2-20260915', time: '2026-09-15T20:00:00.000Z',
}));

// 1 — nothing exported.
const noToken = checkGrantAt(GRANTED, undefined);
ok('140: no token exported is REFUSED — an unset WS_BOX_TURN cannot be a match, whatever the file says',
  noToken.ok === false && noToken.reason === 'no-token-exported', JSON.stringify(noToken.reason));

const emptyToken = checkGrantAt(GRANTED, '');
ok('140: an EMPTY token is refused too — the empty string is a value a shell produces by accident, and treating it as a token would let `export WS_BOX_TURN=` open a browser',
  emptyToken.ok === false && emptyToken.reason === 'no-token-exported', JSON.stringify(emptyToken.reason));

// 2 — a token, but no grant exists at all.
const absent = checkGrantAt(at('does-not-exist.json'), 'errata-wave2-20260915');
ok('140: a token with NO GRANT FILE is refused — no file means no turn is granted to anyone, so a token alone proves nothing. This is the refusal item 139 could not make, because it only asked whether the variable was set',
  absent.ok === false && absent.reason === 'no-grant-file', JSON.stringify(absent.reason));

// 3 — someone else holds it, and the refusal says who.
const mismatch = checkGrantAt(GRANTED, 'ink-20260915');
ok('140: a token that does not match the file is REFUSED, and the refusal NAMES the lane that holds the box — a guard that refuses without saying who holds it sends the reader to the process table, which is the thing the grant replaced',
  mismatch.ok === false && mismatch.reason === 'token-mismatch' && mismatch.message.includes('errata'),
  JSON.stringify(mismatch.reason));

// 4 — the control. Without this the five refusals could be a guard that simply
// refuses everything, which would pass every check above and no run at all.
const match = checkGrantAt(GRANTED, 'errata-wave2-20260915');
ok('140 (the control): a token that MATCHES the file is allowed, and reports the lane — so the refusals above are a matcher rather than a wall',
  match.ok === true && match.lane === 'errata', JSON.stringify(match));

// 5 — unreadable and malformed are refusals, not passes and not absences.
const corrupt = checkGrantAt(put('corrupt.json', '{ this is not json'), 'errata-wave2-20260915');
ok('140: an UNREADABLE grant is refused — never treated as absent and never as a match. A guard that proceeds when it cannot see is not a guard, which is the same rule item 139 applies to an unreadable process table',
  corrupt.ok === false && corrupt.reason === 'grant-unreadable', JSON.stringify(corrupt.reason));

const tokenless = checkGrantAt(put('tokenless.json', JSON.stringify({ lane: 'errata' })), 'errata-wave2-20260915');
ok('140: a grant carrying NO TOKEN is refused rather than matching anything — a file that exists is not a grant, the token in it is',
  tokenless.ok === false && tokenless.reason === 'grant-malformed', JSON.stringify(tokenless.reason));

const nullGrant = checkGrantAt(put('null.json', 'null'), 'errata-wave2-20260915');
ok('140: a grant file containing literal null parses CLEANLY and must still be refused — valid JSON is not a valid grant, and this is the shape that would slip past a bare try/catch',
  nullGrant.ok === false && nullGrant.reason === 'grant-malformed', JSON.stringify(nullGrant.reason));

// 6 — THE ONE THAT MAKES 140 DIFFER FROM 139.
const lifecycle = at('lifecycle.json');
writeFileSync(lifecycle, JSON.stringify({ lane: 'errata', token: 'T', time: '2026-09-15T20:00:00.000Z' }), 'utf8');
const duringTurn = checkGrantAt(lifecycle, 'T');
rmSync(lifecycle, { force: true });          // chat 1 clears at the stamp
const afterClear = checkGrantAt(lifecycle, 'T');
ok('140: THE SAME TOKEN that was valid during the turn is REFUSED the instant the grant is cleared — the stale-token case, and the entire difference between this and item 139. A token merely PRESENT in a shell outlives the turn that issued it; a token checked against the FILE cannot',
  duringTurn.ok === true && afterClear.ok === false && afterClear.reason === 'no-grant-file',
  JSON.stringify({ duringTurn: duringTurn.ok, afterClear: afterClear.reason }));

// The writer/clearer round-trip, driven at the REAL path only if no real grant
// is live — this must never disturb a turn in flight. If one is live, the check
// records that it was skipped rather than silently passing.
const realGrantLive = existsSync(GRANT_PATH);
if (!realGrantLive) {
  const written = writeGrant('item140-selftest', 'selftest-token');
  const roundTrip = checkGrantAt(written, 'selftest-token');
  const cleared = clearGrant();
  const afterRealClear = checkGrantAt(GRANT_PATH, 'selftest-token');
  ok('140: chat 1\'s half round-trips at the REAL path — writeGrant produces a grant this lane\'s matcher accepts, and clearGrant leaves a state that refuses. The two halves are tested against each other rather than each against its own idea of the format',
    roundTrip.ok === true && cleared === true && afterRealClear.ok === false,
    JSON.stringify({ written, roundTrip: roundTrip.ok, cleared, afterClear: afterRealClear.reason }));
} else {
  ok('140: the real-path round-trip was SKIPPED because a grant is live — a self-test that cleared a turn in flight would refuse another lane\'s running pair. Skipped loudly rather than passed quietly',
    true, JSON.stringify({ skipped: true, reason: 'a live grant exists at GRANT_PATH' }));
}

// The path itself is a property worth asserting: outside every worktree, so all
// lanes read one file.
ok('140: the grant lives OUTSIDE any repo checkout — a worktree isolates FILES, and the grant is the one fact that must not be isolated, or the turn would be granted to a directory rather than to the box',
  !GRANT_PATH.includes('writer-studio') && path.isAbsolute(GRANT_PATH), GRANT_PATH);

// THE RUNNER REFUSES TOO, AND REFUSES FAST. Proved by running it, not by
// reading it — and safely, because the token below cannot match any grant: with
// no grant file it refuses as absent, with one it refuses as a mismatch. Either
// way it never starts a suite. Spawning a process is not opening a browser, so
// this stays browserless; the point is that an ungranted sweep costs ONE refusal
// rather than a rebuild plus 85 children each refusing separately.
const IMPOSSIBLE = `item140-selftest-${process.pid}-${Date.now()}`;
const runner = spawnSync(process.execPath, ['scripts/run-suite.mjs', '--only', 'item140.mjs'], {
  cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),
  env: { ...process.env, WS_BOX_TURN: IMPOSSIBLE },
  encoding: 'utf8',
  timeout: 60000,
});
const runnerOut = `${runner.stdout || ''}${runner.stderr || ''}`;
ok('140: RUN-SUITE refuses an unmatched token before the rebuild — exit 3 and a named reason, so an ungranted sweep costs one clear stop instead of a build nobody wanted and 85 children refusing one at a time',
  runner.status === 3 && runnerOut.includes('SUITE REFUSED') && !runnerOut.includes('SUITE DONE'),
  JSON.stringify({ status: runner.status, refused: runnerOut.includes('SUITE REFUSED'), ranAnything: runnerOut.includes('SUITE DONE') }));

rmSync(tmp, { recursive: true, force: true });

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM140 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM140 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

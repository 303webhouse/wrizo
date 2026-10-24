// THE ONE-COMMAND GUARD for a lane that wants a FREE box (Fable, Oct 22: "you own the grant file; a lane may
// take a FREE box only through the one-command guard, and names the turn (start/end) in its report").
//
//   node scripts/box-take.mjs take <lane> [<token>]   writes the grant ONLY if no grant file exists; exits 1 and says who holds it otherwise
//                                                     with no <token>, draws 128 random bits and PRINTS them once (export WS_BOX_TURN=<it>)
//   node scripts/box-take.mjs release <token>         removes the grant ONLY if its token is <token>; otherwise leaves it alone and exits 1
//   options on take:  --bind            also bind the turn to the calling process tree (optional extra; flat scripts only - see box-grant.mjs)
//                     --holder-pid N    bind to an explicit running process instead
//
// It spells no format and no path: both come from box-grant.mjs (the same module the lane's guard and chat 1's
// box-turn.mjs use). It never overwrites a grant and never clears one that is not the caller's - that is the whole
// point; box-turn.mjs `grant` is chat 1's overwrite, this is the lane's refusal-by-default. The grant file holds
// only a HASH of the token (Oct 23, after (145)): reading the file gives nothing to present. The token is printed
// only when this script drew it, and then only to the caller.
import { existsSync, readFileSync } from 'node:fs';
import { writeGrant, clearGrant, holderOfCaller, readProcessTable, tokenMatches, newToken, grantFingerprint, GRANT_PATH } from './box-grant.mjs';

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return null; argv.splice(i, 1); return true; };
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const bind = flag('--bind');
const explicitPid = Number(opt('--holder-pid')) || null;
const [cmd, a, b] = argv;
const read = () => { try { return JSON.parse(readFileSync(GRANT_PATH, 'utf8')); } catch { return { unreadable: true }; } };

if (cmd === 'take' && a) {
  if (existsSync(GRANT_PATH)) {
    const g = read();
    console.log(`GRANT HELD BY ANOTHER: lane=${g.lane ?? '?'} token=${grantFingerprint(g)} time=${g.time ?? '?'} - not taking the box`);
    process.exit(1);
  }
  const drawn = !b;
  const token = b || newToken();
  // OPTIONAL binding to the process that called this script. Off by default: under msys the Windows parent link breaks across nested forks, so a bound grant can refuse its own owner.
  let holder = null;
  if (explicitPid) {
    const row = (readProcessTable() || new Map()).get(explicitPid);
    if (!row) { console.log(`NOT TAKING: --holder-pid ${explicitPid} is not a running process`); process.exit(1); }
    holder = { pid: explicitPid, start: row.start };
  } else if (bind) holder = holderOfCaller();
  writeGrant(a, token, holder);
  console.log(`granted to lane "${a}"${holder ? ` and bound to the process tree of pid ${holder.pid}` : ''} - name this turn's start and end in your report`);
  if (drawn) console.log(`WS_BOX_TURN=${token}   (drawn now, printed once, not stored - only its hash is in the grant file; export it in the shell or script that runs the harness)`);
  process.exit(0);
}
if (cmd === 'release' && a) {
  if (!existsSync(GRANT_PATH)) { console.log('no grant file (nothing to release)'); process.exit(0); }
  const g = read();
  if (!tokenMatches(g, a)) { console.log(`NOT RELEASING: the grant is not yours (lane=${g.lane ?? '?'} token=${grantFingerprint(g)})`); process.exit(1); }
  clearGrant();
  console.log('released');
  process.exit(0);
}
console.log('usage: box-take.mjs take <lane> [<token>] [--bind | --holder-pid N] | release <token>');
process.exit(2);

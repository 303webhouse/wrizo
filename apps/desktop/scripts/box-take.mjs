// THE ONE-COMMAND GUARD for a lane that wants a FREE box (Fable, Oct 22: "you own the grant file; a lane may
// take a FREE box only through the one-command guard, and names the turn (start/end) in its report").
//
//   node scripts/box-take.mjs take <lane> <token>   writes the grant ONLY if no grant file exists; exits 1 and says who holds it otherwise
//   node scripts/box-take.mjs release <token>       removes the grant ONLY if its token is <token>; otherwise leaves it alone and exits 1
//
// It spells no format and no path: both come from box-grant.mjs (the same module the lane's guard and chat 1's
// box-turn.mjs use). It never overwrites a grant and never clears one that is not the caller's - that is the whole
// point; box-turn.mjs `grant` is chat 1's overwrite, this is the lane's refusal-by-default. The token is never
// printed in full.
import { existsSync, readFileSync } from 'node:fs';
import { writeGrant, clearGrant, holderOfCaller, readProcessTable, GRANT_PATH } from './box-grant.mjs';

// optional: --holder-pid N binds the turn to an explicit process (it must be running) instead of the climbed caller
const argv = process.argv.slice(2);
const hi = argv.indexOf('--holder-pid');
const explicitPid = hi >= 0 ? Number(argv[hi + 1]) : null;
if (hi >= 0) argv.splice(hi, 2);
const [cmd, a, b] = argv;
const read = () => { try { return JSON.parse(readFileSync(GRANT_PATH, 'utf8')); } catch { return { unreadable: true }; } };
const short = (t) => (t ? String(t).slice(0, 8) + '...' : null);

if (cmd === 'take' && a && b) {
  if (existsSync(GRANT_PATH)) {
    const g = read();
    console.log(`GRANT HELD BY ANOTHER: lane=${g.lane ?? '?'} token=${short(g.token)} time=${g.time ?? '?'} - not taking the box`);
    process.exit(1);
  }
  // The turn is BOUND to the process that called this script (the shell or runner that goes on to launch the harness): withHarness refuses a browser from any
  // other process tree even with a copied token (box-grant.mjs, "THE HOLDER"). Take the box and run the harness from the SAME shell/script.
  let holder;
  if (explicitPid) {
    const row = (readProcessTable() || new Map()).get(explicitPid);
    if (!row) { console.log(`NOT TAKING: --holder-pid ${explicitPid} is not a running process`); process.exit(1); }
    holder = { pid: explicitPid, start: row.start };
  } else holder = holderOfCaller();
  writeGrant(a, b, holder);
  console.log(`granted to lane "${a}"${holder ? ` and bound to the calling process tree (pid ${holder.pid})` : ' - UNBOUND: the process table could not be read'} - name this turn's start and end in your report`);
  process.exit(0);
}
if (cmd === 'release' && a) {
  if (!existsSync(GRANT_PATH)) { console.log('no grant file (nothing to release)'); process.exit(0); }
  const g = read();
  if (g.token !== a) { console.log(`NOT RELEASING: the grant is not yours (lane=${g.lane ?? '?'} token=${short(g.token)})`); process.exit(1); }
  clearGrant();
  console.log('released');
  process.exit(0);
}
console.log('usage: box-take.mjs take <lane> <token> | release <token>');
process.exit(2);

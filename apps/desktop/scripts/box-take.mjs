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
import { writeGrant, clearGrant, GRANT_PATH } from './box-grant.mjs';

const [, , cmd, a, b] = process.argv;
const read = () => { try { return JSON.parse(readFileSync(GRANT_PATH, 'utf8')); } catch { return { unreadable: true }; } };
const short = (t) => (t ? String(t).slice(0, 8) + '...' : null);

if (cmd === 'take' && a && b) {
  if (existsSync(GRANT_PATH)) {
    const g = read();
    console.log(`GRANT HELD BY ANOTHER: lane=${g.lane ?? '?'} token=${short(g.token)} time=${g.time ?? '?'} - not taking the box`);
    process.exit(1);
  }
  writeGrant(a, b);
  console.log(`granted to lane "${a}" - name this turn's start and end in your report`);
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

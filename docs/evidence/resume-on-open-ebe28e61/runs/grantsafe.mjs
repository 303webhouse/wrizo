// Safe box-grant helper (this desk). Two modes, both refuse to touch a grant that is not mine:
//   node grantsafe.mjs take <token>     -> writes the grant ONLY if no grant file exists; exit 1 (and prints who holds it) otherwise
//   node grantsafe.mjs release <token>  -> removes the grant ONLY if the file's token equals <token>; otherwise leaves it and exits 1
// The file is ~/.wrizo/box-turn.json ({ lane, token, time }); the token is never printed in full.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const P = join(homedir(), '.wrizo', 'box-turn.json');
const [mode, token] = process.argv.slice(2);
const read = () => { try { return JSON.parse(readFileSync(P, 'utf8')); } catch { return { unreadable: true }; } };
const short = (t) => (t ? String(t).slice(0, 8) + '…' : null);
if (!token || !['take', 'release'].includes(mode)) { console.log('usage: take|release <token>'); process.exit(2); }
if (mode === 'take') {
  if (existsSync(P)) { const g = read(); console.log(`GRANT HELD BY ANOTHER: lane=${g.lane ?? '?'} token=${short(g.token)} time=${g.time ?? '?'} - not taking the box`); process.exit(1); }
  writeFileSync(P, JSON.stringify({ lane: 'chat1', token, time: new Date().toISOString() }, null, 2));
  console.log('granted (mine)'); process.exit(0);
}
if (!existsSync(P)) { console.log('no grant file (nothing to release)'); process.exit(0); }
const g = read();
if (g.token !== token) { console.log(`NOT RELEASING: the grant is not mine (lane=${g.lane ?? '?'} token=${short(g.token)})`); process.exit(1); }
rmSync(P, { force: true }); console.log('released (mine)'); process.exit(0);

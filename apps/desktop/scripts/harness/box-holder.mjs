// BOX-HOLDER (Oct 23) - THE GRANT IS BOUND TO THE PROCESS TREE THAT TOOK IT. A committed verification scenario. BROWSERLESS: it opens no browser, takes no box turn, and never reads,
// writes or clears the real grant - every check drives `checkGrantAt` / `writeGrantAt` against temporary files, with REAL processes standing in for the lanes.
//
// WHY. Item 140 made the grant a file and refused unless the exported token matched it. A token is a string and the file is readable by every lane on the box, so a lane that copies the
// token passes while another lane's turn is running (two sweeps on Oct 23 were voided by a foreign browser that appeared while the only grant was held). The grant now records the process
// that took it (box-take.mjs: the caller), and withHarness refuses a browser from any process tree that does not contain it.
//
// WHAT MUST BE PROVED, the last two matter most:
//   H1  a grant WITHOUT a holder behaves exactly as item 140 did (an unrelated process with the token is allowed) - nothing existing breaks
//   H2  a grant WITH a holder allows a process INSIDE the holder's tree (a child of the holder, with the token)
//   H3  ... and REFUSES a process OUTSIDE it that presents the SAME, CORRECT token   <- the copied-token hole
//   H4  a holder that is no longer running refuses with its own reason (a stale grant)
//   H5  a PID reused by another process (same pid, different start time) is not the holder
//   H6  an unreadable process table refuses (a guard that cannot see is not a guard)
//   H7  box-take.mjs records its CALLER as the holder, and a child of that caller passes while a stranger fails
//   H8  withHarness's launch path writes a line to the launch log for every attempt (source pin)
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { checkGrantAt, writeGrantAt, readProcessTable, ancestryOf, chooseHolder } from '../box-grant.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const GRANT_MOD = pathToFileURL(path.join(here, '..', 'box-grant.mjs')).href;
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tmp = mkdtempSync(path.join(os.tmpdir(), 'ws-holder-'));
const G = path.join(tmp, 'grant.json');
const TOKEN = 'holder-test-token-20261023';

const table = readProcessTable();
ok('H0 premise: the process table is readable and this process is in it', !!table && table.has(process.pid), table ? String(table.size) : 'null');
const selfRow = table && table.get(process.pid);

// a long-lived "holder" process (a stand-in for a lane's runner script), and a way to ask a CHILD of it to run the check
const HOLDER_JS = `
const { spawnSync } = require('node:child_process');
process.stdin.setEncoding('utf8');
let buf = '';
process.stdin.on('data', (d) => { buf += d; if (buf.includes('\\n')) {
  const code = "import('" + process.argv[1] + "').then((m) => { const r = m.checkGrantAt(process.argv[1], process.argv[2]); console.log(JSON.stringify({ ok: r.ok, reason: r.reason || 'ok' })); });";
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code, ${JSON.stringify(G)}, ${JSON.stringify(TOKEN)}], { encoding: 'utf8' });
  process.stdout.write(r.stdout.trim().split('\\n').pop() + '\\n'); } });
setTimeout(() => process.exit(0), 60000);`;
const holderProc = spawn(process.execPath, ['-e', HOLDER_JS, GRANT_MOD], { stdio: ['pipe', 'pipe', 'ignore'] });
await sleep(1500);
const table2 = readProcessTable();
const holderRow = table2 && table2.get(holderProc.pid);
ok('H0 premise: the holder process is alive and in the table', !!holderRow, String(holderProc.pid));
const askChildOfHolder = () => new Promise((resolve) => { let out = ''; holderProc.stdout.on('data', (d) => { out += d; if (out.includes('\n')) resolve(JSON.parse(out.trim().split('\n').pop())); }); holderProc.stdin.write('go\n'); });
// the same check, done by a child of THIS process (an outsider relative to the holder)
const checkFromChildOfSelf = () => {
  const code = "import('" + GRANT_MOD + "').then((m) => { const r = m.checkGrantAt(process.argv[1], process.argv[2]); console.log(JSON.stringify({ ok: r.ok, reason: r.reason || 'ok' })); });";
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code, G, TOKEN], { encoding: 'utf8' });
  return JSON.parse(r.stdout.trim().split('\n').pop());
};

// H1 - no holder: item 140's behaviour
writeGrantAt(G, 'lane-x', TOKEN);
const h1 = checkFromChildOfSelf();
ok('H1 a grant with NO holder behaves as item 140 did: an unrelated process presenting the token is allowed', h1.ok === true && !JSON.parse(readFileSync(G, 'utf8')).holderPid, JSON.stringify(h1));

// H2 / H3 - holder = the long-lived process
writeGrantAt(G, 'lane-x', TOKEN, { pid: holderProc.pid, start: holderRow ? holderRow.start : '' });
const h2 = await askChildOfHolder();
ok('H2 a grant WITH a holder allows a process inside the holder\'s tree (a child of the holder) with the token', h2.ok === true, JSON.stringify(h2));
const h3 = checkFromChildOfSelf();
ok('H3 ... and REFUSES a process outside it presenting the SAME, CORRECT token (the copied-token hole)', h3.ok === false && h3.reason === 'not-the-holder', JSON.stringify(h3));
const h3b = checkGrantAt(G, TOKEN);
ok('H3 the same refusal for the checking process itself (it is not a descendant of the holder)', h3b.ok === false && h3b.reason === 'not-the-holder' && /ANOTHER PROCESS TREE/.test(h3b.message), h3b.reason);

// H4 - a dead holder
writeGrantAt(G, 'lane-x', TOKEN, { pid: 99999999, start: '2000-01-01T00:00:00.0000000Z' });
const h4 = checkGrantAt(G, TOKEN);
ok('H4 a holder that is no longer running refuses with its own reason (a stale grant)', h4.ok === false && h4.reason === 'holder-gone', h4.reason);

// H5 - PID reuse: this process's pid with a WRONG start time
writeGrantAt(G, 'lane-x', TOKEN, { pid: process.pid, start: '2000-01-01T00:00:00.0000000Z' });
const h5 = checkGrantAt(G, TOKEN);
ok('H5 the right pid with the wrong start time is not the holder (Windows reuses pids)', h5.ok === false && h5.reason === 'holder-gone', h5.reason);
writeGrantAt(G, 'lane-x', TOKEN, { pid: process.pid, start: selfRow ? selfRow.start : '' });
const h5b = checkGrantAt(G, TOKEN);
ok('H5 control: the right pid with its real start time IS this process\'s own tree and passes', h5b.ok === true, h5b.reason || 'ok');

// H6 - unreadable table
const h6 = checkGrantAt(G, TOKEN, { processTable: null });
ok('H6 an unreadable process table refuses', h6.ok === false && h6.reason === 'ancestry-unreadable', h6.reason);

// H7 - box-take.mjs binds its caller (a temp HOME so the real grant is never touched)
const home = path.join(tmp, 'home');
const callerJs = `
const { spawnSync } = require('node:child_process');
const r = spawnSync(process.execPath, [${JSON.stringify(path.join(here, '..', 'box-take.mjs'))}, 'take', 'lane-y', 'take-test-token-20261023-xyz', '--bind'], { encoding: 'utf8', env: { ...process.env, USERPROFILE: ${JSON.stringify(home)}, HOME: ${JSON.stringify(home)} } });
console.log(r.stdout.trim());
setTimeout(() => process.exit(0), 30000);`;
const caller = spawn(process.execPath, ['-e', callerJs], { stdio: ['ignore', 'pipe', 'ignore'] });
let takeOut = ''; caller.stdout.on('data', (d) => { takeOut += d; });
await sleep(4000);
const takeFile = path.join(home, '.wrizo', 'box-turn.json');
const tg = existsSync(takeFile) ? JSON.parse(readFileSync(takeFile, 'utf8')) : null;
ok('H7 box-take.mjs records its CALLER (the process that ran it) as the holder', !!tg && tg.holderPid === caller.pid, `${tg && tg.holderPid} vs ${caller.pid} :: ${takeOut.slice(0, 90)}`);
const stranger = tg ? checkGrantAt(takeFile, 'take-test-token-20261023-xyz') : null;
ok('H7 a stranger holding the right token is refused for that grant', !!stranger && stranger.ok === false && stranger.reason === 'not-the-holder', stranger && stranger.reason);

// H9 - chooseHolder on synthetic tables: msys forks (young bash intermediates) are climbed past, the first older/non-shell ancestor is the holder
{
  const T0 = Date.parse('2026-10-23T12:00:00.000Z');
  const iso = (ms) => new Date(T0 + ms).toISOString();
  const row = (ppid, ms, name) => ({ ppid, start: iso(ms), name });
  // node(100, self, t=10000) <- bash fork(90, t=9900) <- bash script(80, t=2000) <- terminal bash(70, t=0) <- Code(60)
  const t1 = new Map([[100, row(90, 10000, 'node.exe')], [90, row(80, 9900, 'bash.exe')], [80, row(70, 2000, 'bash.exe')], [70, row(60, 0, 'bash.exe')], [60, row(1, 0, 'Code.exe')], [1, row(0, 0, 'System')]]);
  const c1 = chooseHolder(t1, 100);
  ok('H9a a young bash fork is climbed past: the holder is the older bash that ran the command', !!c1 && c1.pid === 80, JSON.stringify(c1));
  // two young shells in a row (fork of fork)
  const t2 = new Map([[100, row(90, 10000, 'node.exe')], [90, row(85, 9950, 'bash.exe')], [85, row(80, 9900, 'sh.exe')], [80, row(70, 100, 'bash.exe')], [70, row(1, 0, 'Code.exe')], [1, row(0, 0, 'System')]]);
  const c2 = chooseHolder(t2, 100);
  ok('H9b a chain of young shells is climbed past', !!c2 && c2.pid === 80, JSON.stringify(c2));
  // a non-shell parent (PowerShell calling node directly) is the holder itself
  const t3 = new Map([[100, row(50, 10000, 'node.exe')], [50, row(40, 9990, 'powershell.exe')], [40, row(1, 0, 'Code.exe')], [1, row(0, 0, 'System')]]);
  const c3 = chooseHolder(t3, 100);
  ok('H9c a non-shell parent is returned directly, however young', !!c3 && c3.pid === 50, JSON.stringify(c3));
  // an OLD shell parent is the holder (a terminal shell that ran node by hand)
  const t4 = new Map([[100, row(70, 600000, 'node.exe')], [70, row(60, 0, 'bash.exe')], [60, row(1, 0, 'Code.exe')], [1, row(0, 0, 'System')]]);
  const c4 = chooseHolder(t4, 100);
  ok('H9d an old shell parent (a terminal) is the holder: the climb does not pass it', !!c4 && c4.pid === 70, JSON.stringify(c4));
  // two lanes' terminals are distinct holders: same shape, different terminal -> different holder
  const t5 = new Map([[100, row(71, 600000, 'node.exe')], [71, row(60, 1000, 'bash.exe')], [60, row(1, 0, 'Code.exe')], [1, row(0, 0, 'System')]]);
  const c5 = chooseHolder(t5, 100);
  ok('H9e a second terminal shell is a different holder from the first', !!c5 && c5.pid === 71 && c5.pid !== c4.pid, JSON.stringify(c5));
  ok('H9f a pid missing from the table yields no holder (refuse, not guess)', chooseHolder(t1, 999) === null);
}

// H8 - source pin: the launch path logs every attempt
const rv = readFileSync(path.join(here, '..', 'runtime-verify.mjs'), 'utf8');
ok('H8 withHarness appends every launch attempt (allowed or refused) to ~/.wrizo/box-launches.log, before the verdict is acted on',
  /box-launches\.log/.test(rv) && rv.indexOf('box-launches.log') < rv.indexOf('if (!verdict.ok) {') && /tokenFp/.test(rv));

try { holderProc.kill(); } catch { /* gone */ }
try { caller.kill(); } catch { /* gone */ }
rmSync(tmp, { recursive: true, force: true });
const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBOX-HOLDER VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBOX-HOLDER VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

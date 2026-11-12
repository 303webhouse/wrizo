// THE LATENCY TURN LAUNCHER (INK, Nov 12; bug #86 and the zoomed-board lines): ONE command for one box turn, so no turn is typed by hand and nothing builds inside it.
//   node scripts/box-latency-turn.mjs --out <dir> [--main <tree>] [--l-runs 3] [--zoom <tree>] [--also <tree>]...
//     --main <tree>   a built worktree (apps/desktop/dist-web present): runs flux3-latency.mjs --l-runs times (default 3), whole each time, one log per run: <out>/L-main-<n>.log
//     --zoom <tree>   a built worktree: runs flux3-latency-zoom.mjs once (the zoomed-board lines 0.20 / 1.00 / 4.00 beside their Arbor control): <out>/zoom-lat.log
//     --also <tree>   (repeatable) runs flux3-latency.mjs once more in that tree, <out>/L-<folder-name>.log (a reference tree for bug #86's "what added it": e.g. the 94039711 green turn)
// A NODE launcher (a bash waiter is refused as not-the-holder). It refuses to start with Wow, Steam or OBS running; takes the grant ONLY through box-take.mjs (a free box; it never overwrites one) with a
// token it draws itself; runs the jobs in order, each with WS_BOX_TURN set; releases BY TOKEN in a finally; prints the turn's start and end (UTC) and each log's verdict line. Nothing is deleted.
import { spawnSync, execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TAKE = path.join(HERE, 'box-take.mjs');
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const all = (name) => argv.reduce((a, v, i) => (v === name ? [...a, argv[i + 1]] : a), []);
const out = opt('--out'), main = opt('--main'), zoom = opt('--zoom'), also = all('--also');
const lRuns = Math.max(1, Number(opt('--l-runs') || 3));
if (!out || (!main && !zoom && !also.length)) { console.log('usage: box-latency-turn.mjs --out <dir> [--main <tree>] [--l-runs 3] [--zoom <tree>] [--also <tree>]...'); process.exit(2); }
const stamp = () => new Date().toISOString();
const log = (m) => console.log(`[${stamp()}] ${m}`);
const desk = (tree) => path.join(tree, 'apps', 'desktop');

// the jobs, and a look at each tree BEFORE the box is taken: a bundle must be there (no build inside the turn)
const jobs = [];
if (main) for (let i = 1; i <= lRuns; i += 1) jobs.push({ name: `L main ${i}/${lRuns}`, tree: main, file: 'flux3-latency.mjs', log: path.join(out, `L-main-${i}.log`) });
if (zoom) jobs.push({ name: 'zoomed-board lines', tree: zoom, file: 'flux3-latency-zoom.mjs', log: path.join(out, 'zoom-lat.log') });
for (const t of also) jobs.push({ name: `L ${path.basename(t)}`, tree: t, file: 'flux3-latency.mjs', log: path.join(out, `L-${path.basename(t)}.log`) });
for (const j of jobs) {
  const need = [path.join(desk(j.tree), 'dist-web', 'index.html'), path.join(desk(j.tree), 'scripts', 'harness', j.file)];
  const missing = need.filter((f) => !fs.existsSync(f));
  if (missing.length) { log(`NOT STARTING: ${missing.join(', ')} missing (build the tree first; nothing builds inside a turn)`); process.exit(3); }
}
fs.mkdirSync(out, { recursive: true });

// a last look at the machine
const procs = execFileSync('tasklist', ['/fo', 'csv', '/nh'], { encoding: 'utf8' }).toLowerCase();
const bad = ['wow.exe', 'steam.exe', 'steamwebhelper.exe', 'obs64.exe'].filter((p) => procs.includes(`"${p}"`));
if (bad.length) { log(`NOT TAKING THE BOX: ${bad.join(', ')} is running`); process.exit(3); }

const token = crypto.randomBytes(16).toString('hex');
const t = spawnSync(process.execPath, [TAKE, 'take', 'INK', token], { encoding: 'utf8' });
log(`take: ${(t.stdout || '').replace(/WS_BOX_TURN=\S+/, 'WS_BOX_TURN=<hidden>').trim()}`);
if (t.status !== 0) { log('NOT GRANTED (the box is held), stopping; nothing ran'); process.exit(1); }
const START = stamp();
const verdicts = [];
try {
  for (const j of jobs) {
    log(`START ${j.name}  (${j.tree})`);
    const fd = fs.openSync(j.log, 'w');
    const res = spawnSync(process.execPath, [path.join('scripts', 'harness', j.file)], { cwd: desk(j.tree), env: { ...process.env, WS_BOX_TURN: token }, stdio: ['ignore', fd, fd] });
    fs.closeSync(fd);
    const txt = fs.readFileSync(j.log, 'utf8').split('\n');
    const line = txt.find((l) => /^(PASS|FAIL)\s+L(-zoom@\S+)?\s/.test(l)) || '';
    const verdict = [...txt].reverse().find((l) => /VERIFY:/.test(l)) || '(no verdict line)';
    const Ls = txt.filter((l) => /^(PASS|FAIL)\s+L(-zoom@\S+)?\s/.test(l)).map((l) => l.slice(0, 5) + l.slice(5, 90));
    verdicts.push(`${j.name}: exit=${res.status} ${verdict.trim()} | ${Ls.join(' || ') || line}`);
    log(`END ${j.name} exit=${res.status} ${verdict.trim()}`);
  }
} finally {
  const rel = spawnSync(process.execPath, [TAKE, 'release', token], { encoding: 'utf8' });
  log(`release: ${(rel.stdout || '').trim()}`);
  log(`TURN start=${START} end=${stamp()}`);
  for (const v of verdicts) console.log(v);
}

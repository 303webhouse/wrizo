// RHIZOME FLASH FADE - the whole verification set in one command, from ANY worktree on this branch (paths resolve from this file
// and git; nothing assumes a particular checkout). Written for Chat 1 to run (Fable, 2026-10-12).
//   node apps/desktop/scripts/rhizome-flash-verify.mjs           the run (needs a granted box turn: WS_BOX_TURN)
//   node apps/desktop/scripts/rhizome-flash-verify.mjs --dry     no browser, no build: resolves paths, checks the files and the tree,
//                                                                and runs the browserless checks (rhizome-growth, rhizome-goal-core)
// 1. Browserless: rhizome-growth default + PARKED + --mutants (49/49, 50/50 with its R5 park, 7/7 RED), rhizome-goal-core.
// 2. dist-web rebuilt; rhizome-goal BOTH legs (its four flash-fade checks: brighter hold, a partial-opacity brass mid-fade, hold ~1.2s
//    + fade ~1.5s, reduced motion true -> false with no fade); m2 and m3 default (they read data-flash); the three frames.
// Logs, frames and summary.log.txt land in docs/evidence/rhizome-flash/. Exit 0 only if every check passed and the tree (outside the
// evidence folder) is clean at the end.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = execSync('git rev-parse --show-toplevel', { cwd: here, encoding: 'utf8' }).trim();
const DRY = process.argv.includes('--dry');
const OUT = join(repo, 'docs', 'evidence', 'rhizome-flash');
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
const dirty = () => execSync('git status --porcelain', { cwd: repo, encoding: 'utf8' }).split('\n').filter((l) => l.trim() && !l.includes('docs/evidence/rhizome-flash/')).join('\n');
const run = (file, args = [], env = {}) => {
  const r = spawnSync(process.execPath, [join(here, file), ...args], { cwd: desktop, encoding: 'utf8', env: { ...process.env, ...env } });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const verdict = (out) => (out.split('\n').filter((l) => /\bVERIFY\b[^\n]*:|\bPARKED\b[^\n]*:|\bMUTANTS\b[^\n]*:/.test(l)).map((l) => l.trim()).join(' | ') || '(no verdict)');
const green = (r) => { const v = verdict(r.out); return r.code === 0 && /\bVERIFY\b/.test(v) && !/\bFAIL\b/.test(v); };

say(`RHIZOME-FLASH VERIFY RUN @ ${execSync('git rev-parse --short HEAD', { cwd: repo, encoding: 'utf8' }).trim()} in ${repo}${DRY ? ' (DRY)' : ''}`);
const need = ['harness/rhizome-growth.mjs', 'harness/rhizome-goal-core.mjs', 'harness/rhizome-goal.mjs', 'harness/m2.mjs', 'harness/m3.mjs', 'rhizome-flash-frames.mjs', 'runtime-verify.mjs'];
const missing = need.filter((f) => !existsSync(join(here, f)));
if (missing.length) { say(`REFUSED: missing ${missing.join(', ')}`); process.exit(2); }
if (dirty()) { say(`REFUSED: the tree is not clean:\n${dirty()}`); process.exit(2); }
if (!existsSync(join(desktop, 'node_modules'))) { say('REFUSED: no node_modules in this worktree - run pnpm install first (the browserless checks build with esbuild; the run builds dist-web)'); process.exit(2); }
if (!DRY && !process.env.WS_BOX_TURN) { say('REFUSED: WS_BOX_TURN is not set (a granted box turn is required; --dry runs without one)'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

let ok = true;
const leg = (label, r, logName) => {
  if (!DRY) writeFileSync(join(OUT, `${logName}.log.txt`), r.out);   // a dry run leaves nothing in the tree
  const pass = green(r);
  if (!pass) ok = false;
  say(`${label}: exit ${r.code} :: ${verdict(r.out)}`);
};
// 1 - browserless (also in --dry)
leg('1 rhizome-growth default', run('harness/rhizome-growth.mjs'), 'rhizome-growth.default');
leg('1 rhizome-growth PARKED ', run('harness/rhizome-growth.mjs', [], { HARNESS_PARKED: '1' }), 'rhizome-growth.parked');
leg('1 rhizome-growth --mutants', run('harness/rhizome-growth.mjs', ['--mutants']), 'rhizome-growth.mutants');
leg('1 rhizome-goal-core', run('harness/rhizome-goal-core.mjs'), 'rhizome-goal-core');
// 2 - the box
if (!DRY) {
  execSync('pnpm build:web', { cwd: desktop, stdio: 'pipe', encoding: 'utf8' });
  leg('2 rhizome-goal default', run('harness/rhizome-goal.mjs'), 'rhizome-goal.default');
  leg('2 rhizome-goal PARKED ', run('harness/rhizome-goal.mjs', [], { HARNESS_PARKED: '1' }), 'rhizome-goal.parked');
  leg('2 m2 default', run('harness/m2.mjs'), 'm2.default');
  leg('2 m3 default', run('harness/m3.mjs'), 'm3.default');
  const f = run('rhizome-flash-frames.mjs');
  writeFileSync(join(OUT, 'frames.log.txt'), f.out);
  say(`2 frames: exit ${f.code} - ${(f.out.match(/RHIZOME-FLASH FRAME: \S+/g) || []).length} of 3 shot`);
  if (f.code !== 0) ok = false;
} else say('2 THE BOX: (dry - not built, not run)');

const clean = !dirty();
ok = ok && clean;
say(DRY
  ? `\nRHIZOME-FLASH RUN (DRY): ${ok ? 'READY' : 'NOT READY'} - paths, files and the tree checked, the browserless checks run (above); NOTHING was built or run on the box (clean=${clean})`
  : `\nRHIZOME-FLASH RUN: ${ok ? 'PASS' : 'FAIL'} - every check ${ok ? 'green' : 'NOT green (see above)'}, tree clean=${clean}`);
if (!DRY) writeFileSync(join(OUT, 'summary.log.txt'), lines.join('\n') + '\n');
process.exit(ok ? 0 : 1);

// TYPEWRITER-FADE-ORDER - the whole verification set in one command, from ANY worktree on this branch (paths resolve from this
// file and git; nothing assumes a particular checkout). Written for Chat 1 to run (Fable, 2026-10-12).
//   node apps/desktop/scripts/typewriter-fade-verify.mjs           the run (needs a granted box turn: WS_BOX_TURN)
//   node apps/desktop/scripts/typewriter-fade-verify.mjs --dry     no browser, no build: resolves paths, checks the files, the tree,
//                                                                  and that the red-first swap lands and restores
// 1. RED FIRST - the fix is reversed in index.css alone (the mask's FX5 lead-in restored, asserted to have LANDED), dist-web
//    rebuilt, scripts/harness/typewriter-fade.mjs run: "THE ORDER" must FAIL there. An "unfixed" frame is shot. index.css is
//    restored in a `finally` and the tree must be clean again.
// 2. THE FIX - dist-web rebuilt; typewriter-fade, fx5 and fx1 on BOTH legs (HARNESS_PARKED unset / =1); a "fixed" frame.
// Logs, frames and summary.log.txt land in docs/evidence/typewriter-fade/. Exit 0 only if red-first went red, every leg passed,
// and the tree (outside the evidence folder) is clean at the end.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = execSync('git rev-parse --show-toplevel', { cwd: here, encoding: 'utf8' }).trim();
const DRY = process.argv.includes('--dry');
const OUT = join(repo, 'docs', 'evidence', 'typewriter-fade');
const CSS = join(desktop, 'src', 'index.css');
const FIXED = "mask-image:linear-gradient(to bottom, rgba(0,0,0,.15) 0, rgba(0,0,0,.15) var(--tw-fade-start,28px), #000 calc(var(--tw-fade-start,28px) + var(--tw-fade-band,84px)));";
const UNFIXED = "mask-image:linear-gradient(to bottom, #000 0, #000 var(--tw-fade-start,28px), rgba(0,0,0,.15) var(--tw-fade-start,28px), #000 calc(var(--tw-fade-start,28px) + var(--tw-fade-band,84px)));";
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
const dirty = () => execSync('git status --porcelain', { cwd: repo, encoding: 'utf8' }).split('\n').filter((l) => l.trim() && !l.includes('docs/evidence/typewriter-fade/')).join('\n');
const build = () => execSync('pnpm build:web', { cwd: desktop, stdio: 'pipe', encoding: 'utf8' });
const run = (file, args = [], env = {}) => {
  const r = spawnSync(process.execPath, [join(here, file), ...args], { cwd: desktop, encoding: 'utf8', env: { ...process.env, ...env } });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const verdict = (out) => (out.split('\n').filter((l) => /\bVERIFY\b[^\n]*:|\bPARKED\b[^\n]*:/.test(l)).map((l) => l.trim()).join(' | ') || '(no verdict)');

say(`TYPEWRITER-FADE VERIFY RUN @ ${execSync('git rev-parse --short HEAD', { cwd: repo, encoding: 'utf8' }).trim()} in ${repo}${DRY ? ' (DRY)' : ''}`);
const need = ['harness/typewriter-fade.mjs', 'harness/fx5.mjs', 'harness/fx1.mjs', 'typewriter-fade-frames.mjs', 'runtime-verify.mjs'];
const missing = need.filter((f) => !existsSync(join(here, f)));
if (missing.length) { say(`REFUSED: missing ${missing.join(', ')}`); process.exit(2); }
if (dirty()) { say(`REFUSED: the tree is not clean:\n${dirty()}`); process.exit(2); }
if (!DRY && !existsSync(join(desktop, 'node_modules'))) { say('REFUSED: no node_modules in this worktree - run pnpm install first (the run builds dist-web)'); process.exit(2); }
if (!DRY && !process.env.WS_BOX_TURN) { say('REFUSED: WS_BOX_TURN is not set (a granted box turn is required; --dry runs without one)'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

let redOk = false;
const orig = readFileSync(CSS, 'utf8');
try {
  const n = orig.split(FIXED).length - 1;
  if (n !== 2) throw new Error(`red-first: the fixed mask is expected twice (-webkit- and plain), found ${n}`);
  writeFileSync(CSS, orig.split(FIXED).join(UNFIXED));
  const now = readFileSync(CSS, 'utf8');
  const landed = !now.includes(FIXED) && now.split(UNFIXED).length - 1 === 2;
  say(`1 RED FIRST: the fix reversed in index.css - landed=${landed}`);
  if (!landed) throw new Error('red-first: the reversal did not land');
  if (!DRY) {
    build();
    const r = run('harness/typewriter-fade.mjs');
    writeFileSync(join(OUT, 'red-first.typewriter-fade.log.txt'), r.out);
    const orderFailed = /FAIL\s+THE ORDER/.test(r.out);
    redOk = r.code !== 0 && orderFailed;
    say(`1 RED FIRST: typewriter-fade on the UNFIXED product - exit ${r.code}, "THE ORDER" failed=${orderFailed} :: ${verdict(r.out)}`);
    const f = run('typewriter-fade-frames.mjs', ['unfixed']);
    say(`1 frame (unfixed): exit ${f.code} ${(f.out.match(/TYPEWRITER-FADE FRAME: \S+/) || ['(none)'])[0]}`);
  } else redOk = true;
} finally {
  writeFileSync(CSS, orig);
  say(`1 restored index.css - tree clean=${!dirty()}`);
}

let legsOk = true;
if (!DRY) {
  build();
  for (const f of ['typewriter-fade', 'fx5', 'fx1']) {
    for (const parked of [false, true]) {
      const r = run(`harness/${f}.mjs`, [], parked ? { HARNESS_PARKED: '1' } : {});
      writeFileSync(join(OUT, `${f}.${parked ? 'parked' : 'default'}.log.txt`), r.out);
      const v = verdict(r.out);
      const pass = r.code === 0 && !/\bFAIL\b/.test(v) && /\bVERIFY\b/.test(v);
      if (!pass) legsOk = false;
      say(`2 ${f} ${parked ? 'PARKED ' : 'default'}: exit ${r.code} :: ${v}`);
    }
  }
  const f = run('typewriter-fade-frames.mjs', ['fixed']);
  say(`2 frame (fixed): exit ${f.code} ${(f.out.match(/TYPEWRITER-FADE FRAME: \S+/) || ['(none)'])[0]}`);
} else say('2 THE FIX: (dry - not built, not run)');

const clean = !dirty();
const ok = redOk && legsOk && clean;
say(DRY
  ? `\nTYPEWRITER-FADE RUN (DRY): ${ok ? 'READY' : 'NOT READY'} - paths, files and the tree checked, the red-first swap landed and restored (clean=${clean}); NOTHING was built or run`
  : `\nTYPEWRITER-FADE RUN: ${ok ? 'PASS' : 'FAIL'} - red-first ${redOk ? 'RED as required' : 'NOT RED'}, legs ${legsOk ? 'all green' : 'NOT all green'}, tree clean=${clean}`);
if (!DRY) writeFileSync(join(OUT, 'summary.log.txt'), lines.join('\n') + '\n');
process.exit(ok ? 0 : 1);

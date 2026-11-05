#!/usr/bin/env node
// #13 step 10: the two seams a split's own branch fills with data (asked for by INK for 10g, Nov 5), proven before anyone uses them.
// Browserless.
//
//   node apps/desktop/scripts/c13/c13-10-seams-check.mjs
//
// (A) MODULE_PARTS (global-css.mjs): an entry makes srcText of the module the join of its parts in the given order, each read by its
//     plain path; srcText of a part alone is that part's own text; an entry that leaves out the module, names a file twice or names a
//     missing file throws; with the entry gone the read is plain again. The BARRELS still read as their parts joined.
// (B) --allow (c13-10-split-check.mjs) is a MULTISET of added lines, on a scratch worktree at HEAD where Tutor.tsx gains the same
//     line twice: listed twice PASSES; listed once FAILS (one added line unlisted); listed three times FAILS (one entry stale); an
//     empty list FAILS; and without --allow the check FAILS (nothing may be added).
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { srcText, MODULE_PARTS, BARRELS, barrelParts } from '../global-css.mjs';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = path.join(ROOT, 'apps/desktop/src');
const plain = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const throws = (f) => { try { f(); return false; } catch { return true; } };

// (A)
const M = 'components/Tutor.tsx', P = ['components/tutor/assemble.ts', M, 'components/tutor/presets.ts'];
ok('A0 MODULE_PARTS ships empty: the split branch adds its own entry', Object.keys(MODULE_PARTS).length === 0, JSON.stringify(Object.keys(MODULE_PARTS)));
ok('A1 without an entry the module reads plainly', srcText(SRC, M) === plain(M));
MODULE_PARTS[M] = P;
ok('A2 with an entry the module reads as its parts joined in the order given (the module itself in its place)', srcText(SRC, M) === P.map(plain).join(''));
ok('A3 a part read alone is its own text', srcText(SRC, 'components/tutor/assemble.ts') === plain('components/tutor/assemble.ts'));
ok('A4 the same entry spelled as path parts reads the same', srcText(SRC, 'components', 'Tutor.tsx') === P.map(plain).join(''));
MODULE_PARTS[M] = [P[0], P[2]];
ok('A5 an entry that leaves out the module itself throws', throws(() => srcText(SRC, M)));
MODULE_PARTS[M] = [P[0], M, P[0]];
ok('A6 an entry that names a part twice throws', throws(() => srcText(SRC, M)));
MODULE_PARTS[M] = [M, 'components/tutor/never-was.ts'];
ok('A7 an entry that names a missing file throws', throws(() => srcText(SRC, M)));
delete MODULE_PARTS[M];
ok('A8 with the entry gone the read is plain again', srcText(SRC, M) === plain(M));
for (const b of BARRELS) ok(`A9 the barrel ${b} still reads as its ${barrelParts(SRC, b).length} parts joined`, srcText(SRC, b) === barrelParts(SRC, b).map((p) => fs.readFileSync(p, 'utf8')).join(''));

// (B)
// the scenario is step 10a itself: a scratch worktree at main d1ede8e9 (before the split) with 10a's three files written in (taken
// from c13-10a-tutor bfbfba2a), so the split is the only src change; Tutor.tsx then gains the same line twice. THIS tree's tool runs on it.
const BEFORE = 'd1ede8e9', SPLIT = 'bfbfba2a';
const tool = path.join(ROOT, 'apps/desktop/scripts/c13/c13-10-split-check.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c13-10-seams-'));
const wt = path.join(tmp, 'wt');
try {
  execFileSync('git', ['worktree', 'add', '--detach', wt, BEFORE], { cwd: ROOT, stdio: 'ignore' });
  for (const p of P) { const f = path.join(wt, 'apps/desktop/src', p); fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, execFileSync('git', ['show', `${SPLIT}:apps/desktop/src/${p}`], { cwd: ROOT })); }
  const tf = path.join(wt, 'apps/desktop/src', M);
  const raw = fs.readFileSync(tf, 'utf8'), EOL = raw.includes('\r\n') ? '\r\n' : '\n';
  const LINE = '  void __seamsPlanted;';   // the line added twice, as LINES reads it (indentation kept)
  fs.writeFileSync(tf, raw.replace(/\r?\n$/, '') + EOL + LINE + EOL + LINE + EOL);
  const run = (allowLines) => {
    const args = [tool, '--base', BEFORE, M, ...P.filter((p) => p !== M)];
    if (allowLines) { const af = path.join(tmp, `allow-${allowLines.length}.txt`); fs.writeFileSync(af, allowLines.join('\n') + '\n'); args.push('--allow', af); }
    const r = spawnSync(process.execPath, args, { cwd: wt, encoding: 'utf8' });
    return { code: r.status, lines: (r.stdout.match(/^(PASS|FAIL)  LINES: .*$/m) || [''])[0].slice(0, 220), verdict: (r.stdout.trim().split('\n').pop() || '').trim() };
  };
  const two = run([LINE, LINE]), one = run([LINE]), three = run([LINE, LINE, LINE]), none = run([]), bare = run(null);
  ok('B1 the line added twice, listed twice: PASS (each entry allows one copy, all used)', two.code === 0, `${two.lines} | ${two.verdict}`);
  ok('B2 listed once: FAIL (one added copy is not on the list)', one.code === 1 && /not on it/.test(one.lines) && /1 added lines not on it/.test(one.lines), one.lines);
  ok('B3 listed three times: FAIL (one entry is stale)', three.code === 1 && /1 unused/.test(three.lines), three.lines);
  ok('B4 an empty list: FAIL', none.code === 1, none.lines);
  ok('B5 no --allow: FAIL (a split adds nothing unless the list says so)', bare.code === 1 && /^FAIL  LINES/.test(bare.lines), bare.lines);
} finally {
  try { execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: ROOT, stdio: 'ignore' }); } catch {}
  fs.rmSync(tmp, { recursive: true, force: true });
}

// (B)'s detail is the split check's own LINES line, printed on a pass too: the evidence of WHY each run passed or failed
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && (!c.pass || c.name.startsWith('B')) ? `\n        [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nC13-10 SEAMS CHECK: PASS (${checks.length} checks)` : `\nC13-10 SEAMS CHECK: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

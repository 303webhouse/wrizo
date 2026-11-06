#!/usr/bin/env node
// #13: THE STANDING LIST - the browserless checks that hold on every main, in one command (Chat 1 runs it on every main and every train).
//
//   node apps/desktop/scripts/c13/c13-standing.mjs        runs LIST (each must be green) and shows PENDING (owned reds, not counted)
//
// Rules (Fable, Nov 5 night): a #13 check joins LIST when it is green on main; a one-time proof (a step's own split check, the ledger/fold/
// evidence proofs, the comment-move checks, which need a base or a file list) does not belong here. A check in PENDING is red on main with a
// named owner; it moves to LIST in the commit that turns it green. c13-6-css-split runs in its `standing` mode (889d2a43), not `check`.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.join(HERE, '..');
const NODE = process.execPath;

// Bases are fixed historic commits (the check compares against them), so a green result does not drift when main moves.
const LIST = [
  { name: 'c13-2-links', args: ['c13/c13-2-links.mjs'] },
  { name: 'c13-4d-links', args: ['c13/c13-4d-links.mjs', 'check'] },
  { name: 'c13-6-css-split (standing)', args: ['c13/c13-6-css-split.mjs', 'standing'] },
  { name: 'c13-10-seams-check (default)', args: ['c13/c13-10-seams-check.mjs'] },
  { name: 'c13-10-seams-check (parked)', args: ['c13/c13-10-seams-check.mjs'], env: { HARNESS_PARKED: '1' } },
  { name: 'c13-10b-readers', args: ['c13/c13-10b-readers.mjs', '--base', 'd1ede8e9'] },
  { name: 'c13-10f-wordcount', args: ['c13/c13-10f-wordcount.mjs'] },
  { name: 'c13-10h-persistence', args: ['c13/c13-10h-persistence.mjs', '--base', '1913849e'] },
  { name: 'typing-latency-readers-guard', args: ['typing-latency-readers-guard.mjs'] },
  // moved from PENDING (POLISH, c13-10g-readers-fix-r): its --base mode is 10g's one-time proof (Flux S1's mount moved the board after the
  // split), so the standing list runs its --standing mode: the join names every part, every namer is listed, every built pattern is named
  { name: 'c13-10g-readers (standing)', args: ['c13/c13-10g-readers.mjs', '--standing'] },
];
// Red on main, owned: not counted until green (then moved to LIST in the same commit).
const PENDING = [
  { name: 'c13-10c-lexicon', args: ['c13/c13-10c-lexicon.mjs', '--base', '01ae2fbc'], owner: 'TOOLS (the declarations only)' },
];

function run(c) {
  const r = spawnSync(NODE, c.args, { cwd: SCRIPTS, encoding: 'utf8', env: { ...process.env, ...(c.env || {}) }, maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim().split(/\r?\n/);
  return { ok: r.status === 0, last: (out[out.length - 1] || '').slice(0, 100) };
}

let bad = 0;
for (const c of LIST) {
  const r = run(c);
  if (!r.ok) bad++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${c.name}  ::  ${r.last}`);
}
for (const c of PENDING) {
  const r = run(c);
  console.log(`${r.ok ? 'GREEN-MOVE-ME' : 'PENDING'}  ${c.name} (owner: ${c.owner})  ::  ${r.last}`);
  if (r.ok) bad++; // a pending check that has turned green must be moved to LIST, so the list cannot go stale
}
console.log(bad ? `C13 STANDING: FAIL (${bad})` : `C13 STANDING: PASS (${LIST.length} checks green; ${PENDING.length} pending, owned)`);
process.exit(bad ? 1 : 0);

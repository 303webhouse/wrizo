// PROBE ONLY (arbor/board-zoom-probe, never merged): the two browserless guards the suite cannot name, c13-standing and tsc, run on Actions while the box is in use.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const desktop = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const root = path.resolve(desktop, '..', '..');
const run = (name, cmd, args, cwd) => {
  const log = path.join(os.tmpdir(), `join-guards-${name}.log`);
  const fd = fs.openSync(log, 'w');   // output to a file, never a pipe
  const r = spawnSync(cmd, args, { cwd, stdio: ['ignore', fd, fd], timeout: 8 * 60 * 1000 });
  fs.closeSync(fd);
  const tail = fs.readFileSync(log, 'utf8').trim().split(/\r?\n/).slice(-6).join(' | ').slice(0, 700);
  console.log(`${r.status === 0 ? 'PASS' : 'FAIL'} ${name} exit=${r.status} ${tail}`);
  return r.status === 0;
};
const a = run('c13-standing', process.execPath, ['apps/desktop/scripts/c13/c13-standing.mjs'], root);
const b = run('tsc', path.join(desktop, 'node_modules', '.bin', 'tsc'), ['--noEmit', '-p', 'tsconfig.json'], desktop);
console.log(a && b ? '\nJOIN-GUARDS-PROBE VERIFY: PASS (2 checks)' : `\nJOIN-GUARDS-PROBE VERIFY: FAIL - ${[a, b].filter((x) => !x).length}/2 failed`);
process.exit(a && b ? 0 : 1);

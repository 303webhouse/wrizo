// PROBE, never merged: w2.mjs run N times in a row, each in its own process with its output in a file, to measure how often the return chip's caret restore fails on this tree.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const N = 48;
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'w2-repeat-'));
const tally = {};
let red = 0, none = 0;
for (let i = 0; i < N; i += 1) {
  const file = path.join(dir, `run-${i}.txt`);
  const fd = fs.openSync(file, 'w');
  const r = spawnSync(process.execPath, [path.join(here, 'w2.mjs')], { cwd: process.cwd(), env: process.env, stdio: ['ignore', fd, fd], windowsHide: true });
  fs.closeSync(fd);
  const t = fs.readFileSync(file, 'utf8');
  const verdict = (t.split(/\r?\n/).filter((l) => /W2 VERIFY/.test(l)).pop() || '').trim();
  if (!verdict) none += 1;
  if (r.status !== 0) red += 1;
  const lines = t.split(/\r?\n/);
  const fails = [];
  lines.forEach((l, k) => { if (/"pass": false/.test(l)) { const n = (lines[k - 1] || '').match(/"name": "(.*)",?$/), d = (lines[k + 1] || '').match(/"detail": "(.*)"/); fails.push(`${n ? n[1] : '?'} [${d ? d[1].slice(0, 12) : ''}]`); } });
  for (const f of fails) tally[f] = (tally[f] || 0) + 1;
  if (r.status !== 0) { const d = t.split(/\r?\n/).find((l) => l.includes('NOW {')); if (d) console.log('DIAG ' + d.trim().slice(0, 760)); }
  console.log(`run ${i + 1}: exit ${r.status} ${verdict.slice(0, 40)}${fails.length ? ' | ' + fails.join('; ').slice(0, 150) : ''}`);
}
console.log(`W2-REPEAT tally ${JSON.stringify(tally)}`);
console.log(`W2-REPEAT VERIFY: ${red ? 'FAIL' : 'PASS'} (${N - red} of ${N} green, ${none} with no verdict)`);
process.exit(red ? 1 : 0);

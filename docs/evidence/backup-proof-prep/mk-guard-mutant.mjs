// Builds a MUTANT copy of the helpers with the wrong-database guard's condition replaced by `false` (the guard can never fire), in a temp dir, and prints the dir. The edit is COUNTED: a silent no-op cannot pass.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const src = 'C:/Users/nickh/.claude/backup-proof';
const dir = mkdtempSync(join(tmpdir(), 'bp-mutant-'));
const cond = "!have.has('users') || !have.has('journal_entries')";
let landed = 0;
for (const f of ['bp-counts.mjs', 'bp-restore.mjs']) {
  const s = readFileSync(join(src, f), 'utf8');
  const parts = s.split(cond); landed += parts.length - 1;
  writeFileSync(join(dir, f), parts.join('false'));
}
if (landed !== 2) { console.error('MUTATION DID NOT LAND: ' + landed); process.exit(2); }
console.log(dir);

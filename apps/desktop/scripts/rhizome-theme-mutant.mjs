// THE RHIZOME IS PLATEAU'S ONLY - the mutant for rhizome-goal.mjs's Flux check (Fable, 2026-10-09: "a mutant (drop the gate) that
// goes RED"). It drops `&& theme === 'plateau'` from RhizomeField.tsx's `active`, rebuilds dist-web, runs
// scripts/harness/rhizome-goal.mjs, and the check "Theme: under Flux the rhizome field renders NOTHING ..." must turn RED.
// Laws: mutate COMMITTED work only (the tree must be clean before it starts); assert the mutation LANDED before believing a red;
// restore in a `finally`; rebuild the clean bundle at the end and confirm the tree is clean again.
// NOT in harness/: it edits source and rebuilds. Run by hand on a granted box turn:  node scripts/rhizome-theme-mutant.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = join(desktop, '..', '..');
const FILE = join(desktop, 'src', 'components', 'RhizomeField.tsx');
const FROM = "goal != null && goal.n > 0 && theme === 'plateau';";
const TO = 'goal != null && goal.n > 0;';
const CLAIM = 'Theme: under Flux the rhizome field renders NOTHING';
const dirty = () => execSync('git status --porcelain', { cwd: repo, encoding: 'utf8' }).trim();
const build = () => execSync('pnpm build:web', { cwd: desktop, stdio: 'pipe', encoding: 'utf8' });
// the harness prints its checks as JSON: find the claim's own "pass" value after its name
const verdictOf = (out) => {
  const i = out.indexOf(CLAIM);
  if (i < 0) return null;
  const m = /"pass":\s*(true|false)/.exec(out.slice(i, i + 4000));
  return m ? m[1] === 'true' : null;
};

if (dirty()) { console.error(`REFUSED: the tree is not clean - commit before mutating.\n${dirty()}`); process.exit(2); }
let verdict = 'NOT RUN';
const orig = readFileSync(FILE, 'utf8');
try {
  const norm = orig.replace(/\r\n/g, '\n');
  const n = norm.split(FROM).length - 1;
  if (n !== 1) verdict = `ANCHOR x${n} - DID NOT LAND`;
  else {
    const eol = orig.includes('\r\n') ? '\r\n' : '\n';
    writeFileSync(FILE, norm.replace(FROM, TO).replace(/\n/g, eol));
    const now = readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
    if (!now.includes(TO) || now.includes(FROM)) verdict = 'DID NOT LAND';
    else {
      build();
      const r = spawnSync(process.execPath, [join(desktop, 'scripts', 'harness', 'rhizome-goal.mjs')], { cwd: desktop, encoding: 'utf8', env: process.env });
      const pass = verdictOf((r.stdout || '') + (r.stderr || ''));
      verdict = pass === false ? 'RED (killed)' : pass === true ? 'GREEN (SURVIVED)' : 'NO CLAIM (crash or abort before the check)';
    }
  }
} finally {
  writeFileSync(FILE, orig);
  build();
}
const clean = !dirty();
console.log(`M-gate (drop theme === 'plateau'): ${verdict}`);
console.log(`\nRHIZOME THEME MUTANT: ${verdict.startsWith('RED') ? 'PASS' : 'FAIL'} - ${verdict}; tree clean after restore: ${clean}`);
process.exit(verdict.startsWith('RED') && clean ? 0 : 1);

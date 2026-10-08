// PAGE-TEMPLATES-MOVE - THE MUTANTS for "T2 [chosen]" (Fable, 2026-10-08: "Add a claim plus a mutant"). The claim: on a screenplay
// page the Screenplay template is drawn CHOSEN - aria-pressed, brass at rest. Each mutant breaks one half of it in the SOURCE,
// rebuilds dist-web, runs scripts/harness/page-templates.mjs, and must turn exactly that claim red:
//   M1 (the state): ScriptEditor stops marking the template selected   -> aria-pressed false   -> T2 [chosen] FAIL
//   M2 (the paint): the CSS loses the brass-at-rest selector           -> aria-pressed true, not brass -> T2 [chosen] FAIL
//   M3 (the glyph): the CSS loses the strip's size for the template svg -> it draws at zero -> T1's live-template check FAIL
//       (the 43839ae turn's frames showed exactly that: an empty Screenplay slot, while a presence test passed)
// Laws: mutate COMMITTED work only (the tree must be clean before it starts); assert the mutation LANDED before believing a red;
// restore in a `finally`; rebuild the clean bundle at the end and confirm the tree is clean again.
// NOT in harness/: it edits source and rebuilds. Run by hand on a granted box turn:  node scripts/page-templates-mutants.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = join(desktop, '..', '..');
const CLAIM = 'T2 [chosen]';
const GLYPH_CLAIM = 'T1 [Draft]: Screenplay is the ONE live template';
const MUTANTS = [
  { id: 'M1', file: join(desktop, 'src', 'components', 'ScriptEditor.tsx'),
    from: "templates: [{ key: 'screenplay', label: dt('beginScreenplay'), selected: true, onApply: () => {} }],",
    to: "templates: [{ key: 'screenplay', label: dt('beginScreenplay'), selected: false, onApply: () => {} }]," },
  { id: 'M2', file: join(desktop, 'src', 'index.css'),
    from: ".wz-template-live:active, .wz-template-live[aria-pressed='true']{ color:var(--brass); border-color:var(--brass); }",
    to: ".wz-template-live:active{ color:var(--brass); border-color:var(--brass); }" },
  { id: 'M3', file: join(desktop, 'src', 'index.css'), claim: GLYPH_CLAIM,
    from: ".wz-template-live svg{ width:16px; height:16px; display:block; }",
    to: "/* M3: the template svg's size removed */" },
];
const sh = (cmd) => execSync(cmd, { cwd: desktop, stdio: 'pipe', encoding: 'utf8' });
const dirty = () => execSync('git status --porcelain', { cwd: repo, encoding: 'utf8' }).trim();
const build = () => sh('pnpm build:web');
const runHarness = () => {
  const r = spawnSync(process.execPath, [join(desktop, 'scripts', 'harness', 'page-templates.mjs')], { cwd: desktop, encoding: 'utf8', env: process.env });
  return (r.stdout || '') + (r.stderr || '');
};
const claimLine = (out, claim = CLAIM) => out.split('\n').find((l) => l.includes(claim)) || null;

if (dirty()) { console.error(`REFUSED: the tree is not clean - commit before mutating.\n${dirty()}`); process.exit(2); }
const results = [];
try {
  for (const m of MUTANTS) {
    const orig = readFileSync(m.file, 'utf8');
    const norm = orig.replace(/\r\n/g, '\n');
    const n = norm.split(m.from).length - 1;
    if (n !== 1) { results.push({ id: m.id, verdict: `ANCHOR x${n} - DID NOT LAND` }); continue; }
    const eol = orig.includes('\r\n') ? '\r\n' : '\n';
    try {
      writeFileSync(m.file, norm.replace(m.from, m.to).replace(/\n/g, eol));
      const landed = readFileSync(m.file, 'utf8').replace(/\r\n/g, '\n').includes(m.to) && !readFileSync(m.file, 'utf8').replace(/\r\n/g, '\n').includes(m.from);
      if (!landed) { results.push({ id: m.id, verdict: 'DID NOT LAND' }); continue; }
      build();
      const out = runHarness();
      const line = claimLine(out, m.claim || CLAIM);
      results.push({ id: m.id, verdict: line && line.startsWith('FAIL') ? 'KILLED' : line ? 'SURVIVED' : 'NO CLAIM LINE (crash?)', line });
    } finally {
      writeFileSync(m.file, orig);
    }
  }
} finally {
  build();
}
const clean = !dirty();
for (const r of results) console.log(`${r.id}: ${r.verdict}${r.line ? `\n    ${r.line.slice(0, 220)}` : ''}`);
const all = results.length === MUTANTS.length && results.every((r) => r.verdict === 'KILLED');
console.log(`\nPAGE-TEMPLATES MUTANTS: ${all ? 'PASS' : 'FAIL'} (${results.filter((r) => r.verdict === 'KILLED').length}/${MUTANTS.length} killed); tree clean after restore: ${clean}`);
process.exit(all && clean ? 0 : 1);

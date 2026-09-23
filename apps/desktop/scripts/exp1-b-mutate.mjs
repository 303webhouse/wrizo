// Mutation-test the EXP1 (b) proof. A green I cannot make go red is not
// evidence. Each mutation must (1) actually LAND — asserted, because twice this
// arc a mutation silently did not apply — and (2) turn the proof RED, on the
// claim it targets. Restored in a finally, always.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Default to this file's own repo, so it is run with no arguments.
const repo = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const FILES = {
  draft: join(repo, 'apps/desktop/src/store/draftFormat.ts'),
};
const MUTATIONS = [
  {
    name: 'drop the __underline__ rule from the one stripper',
    file: 'draft',
    from: '  /__([\\s\\S]+?)__/g,',
    to: '  // MUTATION: rule removed',
    expect: 'CLAIM 1',
  },
  {
    name: 'make the index map tail wrong (breaks strictly-increasing / tail)',
    file: 'draft',
    from: '  map.push(raw.length);',
    to: '  map.push(0);',
    expect: 'CLAIM 2',
  },
  {
    name: "indent's paragraph expansion stops at the paragraph's FIRST line",
    file: 'draft',
    from: '  if (pLast) last = pLast.endLine;',
    to: '  if (pLast) last = pLast.startLine;',
    expect: 'CLAIM 3',
  },
  {
    name: 'paragraphRanges treats a whitespace-only line as having ink',
    file: 'draft',
    from: "    if (lines[i].trim().length === 0) { i++; continue; }\n    const startLine = i;",
    to: "    if (lines[i].length === 0) { i++; continue; }\n    const startLine = i;",
    expect: 'CLAIM 4',
  },
];

const originals = new Map();
for (const [k, p] of Object.entries(FILES)) originals.set(k, readFileSync(p, 'utf8'));

const restore = () => {
  for (const [k, p] of Object.entries(FILES)) writeFileSync(p, originals.get(k), 'utf8');
};

let survived = 0;
try {
  // Baseline: the proof must be GREEN before any mutation, or a red below
  // proves nothing.
  const base = run();
  console.log(`BASELINE: ${base.ok ? 'GREEN' : 'RED — mutation testing is meaningless, stopping'}`);
  if (!base.ok) { restore(); process.exit(1); }

  for (const m of MUTATIONS) {
    const p = FILES[m.file];
    const src = originals.get(m.file);
    // The repo's files are CRLF. An anchor written with \n matches NOTHING and
    // reports "not unique (0 matches)" — which is how a mutation test quietly
    // stops testing. Splice with the FILE's own EOL.
    const eol = src.includes('\r\n') ? '\r\n' : '\n';
    m.from = m.from.split('\n').join(eol);
    m.to = m.to.split('\n').join(eol);
    const hits = src.split(m.from).length - 1;
    if (hits !== 1) {
      console.log(`\n✗ ${m.name}\n  ANCHOR NOT UNIQUE (${hits} matches) — mutation not attempted`);
      survived++;
      continue;
    }
    writeFileSync(p, src.replace(m.from, m.to), 'utf8');
    // ASSERT THE MUTATION LANDED. A mutation that silently did not apply makes
    // a green look like proof of nothing being wrong.
    const after = readFileSync(p, 'utf8');
    if (!after.includes(m.to) || after.includes(m.from)) {
      console.log(`\n✗ ${m.name}\n  MUTATION DID NOT LAND — no conclusion drawn`);
      survived++;
      restore();
      continue;
    }
    const r = run();
    const targeted = r.out.includes(m.expect) && /FAIL/.test(r.out);
    if (r.ok) {
      console.log(`\n✗ SURVIVED: ${m.name}\n  the proof stayed GREEN — it does not test this`);
      survived++;
    } else {
      const which = [...r.out.matchAll(/^CLAIM (\d)/gm)].map(x => x[1]);
      console.log(`\n✓ KILLED: ${m.name}\n  proof went RED${targeted ? `, and ${m.expect} reported the failure` : ' (but not on the targeted claim — check)'}`);
      if (!targeted) survived++;
    }
    restore();
  }
} finally {
  restore();
  // Prove the restore worked, rather than assuming it.
  let dirty = false;
  for (const [k, p] of Object.entries(FILES)) {
    if (readFileSync(p, 'utf8') !== originals.get(k)) { dirty = true; console.log(`!! ${p} NOT RESTORED`); }
  }
  console.log(dirty ? '\n!! TREE NOT RESTORED' : '\nrestored: all files byte-identical to before');
}

console.log(survived === 0
  ? `\nMUTATION TEST: all ${MUTATIONS.length} mutations killed — the proof can go red`
  : `\nMUTATION TEST: ${survived} of ${MUTATIONS.length} survived`);
process.exit(survived === 0 ? 0 : 1);

function run() {
  try {
    const out = execFileSync(process.execPath, ['apps/desktop/scripts/exp1-b-proof.mjs'],
      { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

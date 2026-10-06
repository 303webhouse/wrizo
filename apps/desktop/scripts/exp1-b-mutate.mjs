// EXPERIMENT 1 (b) — THE FALSIFICATION, re-rostered for the rebuilt map.
//
// ⚠ THE PREVIOUS ROSTER DIED OF ANCHOR ROT, and that is the lesson it leaves. It
// targeted the REPLAY: a `LINE_PREFIX_RULES` table, an `indentParagraphs` rewiring,
// a whitespace rule inside `paragraphRanges`. The replay is gone, so three of its
// four mutations reported "ANCHOR NOT UNIQUE (0 matches) — mutation not attempted"
// and the script printed "3 of 4 survived" about code that no longer exists. A
// survivor whose anchor never landed is not evidence of anything; it is a broken
// instrument reporting on an imaginary one. Every mutation below asserts that it
// LANDED before believing the result.
//
// Each mutation is applied ALONE and restored in a finally.
// Run: node apps/desktop/scripts/exp1-b-mutate.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = join(desktop, '..', '..');
const DF = join(desktop, 'src/store/draftFormat.ts');
const AN = join(desktop, 'src/store/anchors.ts');

const MUTANTS = [
  {
    name: '1. the markers are read from the WHOLE LINE instead of the text after the lead',
    file: DF,
    from: '    const runs = readMarks(rest);',
    to: '    const runs = readMarks(line);',
    expect: 'CLAIM 1 / 2 / 4 — the off-by-lead that lands marks on the wrong words',
  },
  {
    name: '2. the map forgets lead.length (every visible char points one lead too early)',
    file: DF,
    from: '      map.push(lineStart + lead.length + i);',
    to: '      map.push(lineStart + i);',
    expect: 'CLAIM 2 — the identity check',
  },
  {
    name: '3. the lead is not dropped at all',
    file: DF,
    from: '    const rest = line.slice(lead.length);',
    to: '    const rest = line;',
    expect: 'CLAIM 1 / 4',
  },
  {
    name: '4. markers are cut by a REGEX instead of the reader (the replay, reintroduced)',
    file: DF,
    from: '    const runs = readMarks(rest);',
    to: "    const runs = [...rest.matchAll(/\\*\\*|__|~~|\\*/g)].map(m => ({ mark: m[0], open: m.index, close: m.index }));",
    expect: 'CLAIM 1 (unpaired "2 * 3 * 4") and CLAIM 3b (a regex literal appears)',
  },
  {
    name: '5. toRawRange uses map[end] — the trap its own doc comment warns about',
    file: DF,
    from: '  return [v.map[start], v.map[end - 1] + 1];',
    to: '  return [v.map[start], v.map[end]];',
    expect: 'CLAIM 6 — the tint sweeps in a trailing marker',
  },
  {
    name: '6. the map loses its sentinel, so an END offset cannot map',
    file: DF,
    from: '  map.push(raw.length);',
    to: '  // sentinel removed by mutation',
    expect: 'CLAIM 2 — length and tail',
  },
  {
    name: '7. anchors.ts walks the DOM itself again (the second reader, reintroduced)',
    file: AN,
    from: '  const ends = selectionEnds(editor);',
    to: '  const ends = (() => { const w = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT); void w; return null; })();',
    expect: 'CLAIM 7b — no createTreeWalker in this file',
  },
];

const run = () => {
  try {
    return execFileSync('node', [join(desktop, 'scripts/exp1-b-proof.mjs')],
      { encoding: 'utf8', cwd: repo, timeout: 600000 });
  } catch (e) { return (e.stdout ?? '') + (e.stderr ?? ''); }
};

console.log('BASELINE');
const base = run();
if (!/EXP1 \(b\) PROOF: CLEAN/.test(base)) {
  console.log('  FAIL baseline is not clean; refusing to mutate');
  console.log(base.slice(-1500));
  process.exit(1);
}
console.log('  ok   the proof is CLEAN before any mutation\n');
console.log('MUTANTS — each alone, landing asserted, restored in a finally\n');

let bad = 0;
for (const m of MUTANTS) {
  const original = readFileSync(m.file, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const from = m.from.replace(/\n/g, eol);
  const to = m.to.replace(/\n/g, eol);
  try {
    // ⛔ THE LANDING IS ASSERTED, which is what the previous roster failed to do.
    if (!original.includes(from)) { bad++; console.log(`  ⚠ MUTATION DID NOT LAND (anchor absent): ${m.name}`); continue; }
    if (original.split(from).length - 1 !== 1) { bad++; console.log(`  ⚠ MUTATION DID NOT LAND (anchor not unique): ${m.name}`); continue; }
    writeFileSync(m.file, original.split(from).join(to), 'utf8');
    const after = readFileSync(m.file, 'utf8');
    if (after === original) { bad++; console.log(`  ⚠ MUTATION DID NOT LAND (file unchanged): ${m.name}`); continue; }

    const out = run();
    const clean = /EXP1 \(b\) PROOF: CLEAN/.test(out);
    const reds = [...new Set(out.split(/\r?\n/).filter((l) => l.includes('FAIL')).map((l) => l.trim().slice(0, 86)))];
    if (clean) {
      bad++;
      console.log(`  ✗ SURVIVED  ${m.name} — the proof stayed CLEAN, so nothing tests this`);
    } else {
      console.log(`  + KILLED    ${m.name}`);
      console.log(`              expected ${m.expect}`);
      reds.slice(0, 2).forEach((l) => console.log(`                · ${l}`));
    }
  } finally {
    writeFileSync(m.file, original, 'utf8');
  }
}

const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8', cwd: repo }).trim();
console.log('\nrestored byte-identical: ' + (dirty === '' ? 'YES (clean tree)' : 'NO — ' + dirty));
console.log(bad === 0 && dirty === ''
  ? `EXP1 (b) FALSIFICATION: all ${MUTANTS.length} mutants killed`
  : `EXP1 (b) FALSIFICATION: ${bad} problem(s)`);
process.exitCode = bad === 0 && dirty === '' ? 0 : 1;

// Browserless check for verdict-shapes.mjs (no box turn needed).
//   node apps/desktop/scripts/verdict-shapes-check.mjs
// Real verdict lines from the three files the runner used to miss, the lines it
// always saw, and lines that must NOT be taken for a verdict. Then three mutants
// that must each turn the check red.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = join(here, 'verdict-shapes.mjs');
const src = readFileSync(srcPath, 'utf8');

const VERDICT = [
  'GUIDED-W2 PART 2: PASS (14/14)',
  'GUIDED-W2 PART 2: FAIL (12/14)',
  'GUIDED-W3 PART 2: PASS (9 checks; frames in x)',
  'GUIDED-W3 PART 2: FAIL - 2/9',
  '31/31 checks green, 4/4 mutants landed',
  '30/31 checks green, 4/4 mutants landed',
  '31/31 checks green, 3/4 mutants landed',
  'FX7 VERIFY (partial): PASS (45 checks)',
  'SEED-GUARD VERIFY: PASS (80 checks)',
];
const NOT_VERDICT = [
  'PASS  w2-return-chip  chip present',
  'FAIL  w2-return-chip  chip missing',
  '  note: 14/14 checks green, 4/4 mutants landed earlier',
  'MUTANT LANDED  m1  (red: a; wanted a)',
  'checks green so far',
  '',
];
const FAILED = new Set([
  'GUIDED-W2 PART 2: FAIL (12/14)',
  'GUIDED-W3 PART 2: FAIL - 2/9',
  '30/31 checks green, 4/4 mutants landed',
  '31/31 checks green, 3/4 mutants landed',
]);

async function load(text) {
  return import('data:text/javascript;base64,' + Buffer.from(text).toString('base64'));
}

function run(mod) {
  const out = [];
  for (const l of VERDICT) out.push([`verdict: ${l}`, mod.isVerdictLine(l) === true]);
  for (const l of NOT_VERDICT) out.push([`not a verdict: "${l}"`, mod.isVerdictLine(l) === false]);
  for (const l of VERDICT) out.push([`failed? ${l}`, mod.isFailedVerdict(l) === FAILED.has(l)]);
  return out;
}

const real = run(await load(src));

// The format strings the shapes were written against must still be printed.
const SOURCES = [
  ['harness/guided-w2.mjs', 'checks green, ${landed}/${MUTANTS.length} mutants landed'],
  ['harness/guided-w2-part2.mjs', 'GUIDED-W2 PART 2: '],
  ['harness/guided-w3-part2.mjs', 'GUIDED-W3 PART 2: '],
];
const drift = SOURCES.map(([f, s]) => [`${f} still prints "${s}"`, readFileSync(join(here, f), 'utf8').includes(s)]);

const MUTANTS = [
  ['named shape never matches', src.replace('const NAMED = /^', 'const NAMED = /^(?!)')],
  ['green shape ignores a short mutant count', src.replace('g[3] !== g[4]', 'false')],
  ['green shape ignores a short check count', src.replace('g[1] !== g[2] ||', '')],
];
const mutants = [];
for (const [name, text] of MUTANTS) {
  const changed = text !== src;
  const reds = changed ? run(await load(text)).filter(([, ok]) => !ok).length : 0;
  mutants.push([`mutant lands: ${name}`, changed && reds > 0]);
}

const all = [...real, ...drift, ...mutants];
for (const [name, ok] of all) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
const bad = all.filter(([, ok]) => !ok);
console.log(bad.length === 0
  ? `\nVERDICT-SHAPES VERIFY: PASS (${all.length} checks)`
  : `\nVERDICT-SHAPES VERIFY: FAIL - ${bad.length}/${all.length}`);
process.exit(bad.length === 0 ? 0 : 1);

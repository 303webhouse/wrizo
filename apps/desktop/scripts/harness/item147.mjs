// ITEM 147 — THE PARK COUNT AS A CHECK.   Run: node apps/desktop/scripts/harness/item147.mjs   (browserless)
//
//   A VERDICT LINE THAT CANNOT SAY FAIL IS NOT A VERDICT.
//
// Every harness file's PARKED verdict is classified from its SOURCE (scripts/park-count-classify.mjs): the
// verdict must be DERIVED from the array the file pushes parked checks into, and must have a FAIL form. A file
// whose PARKED line is a literal PASS has parked checks that can fail and a verdict that cannot report it.
//
// THE GUARD IS ITS OWN FIRST SUBJECT (a guard is not thereby guarded): this file is in the population it scans,
// and the population check would show it if it classified as a defect.
//
// THREE KINDS OF CHECK, in the order that makes each trustworthy:
//   1. POPULATION, WITH ITS COVERAGE NUMBER BESIDE IT — a scan that reads zero files, or sees no pushes, passes
//      every "no defects" check while blind (item 141's guard once did exactly that). So the count of files
//      read, the count classified DERIVED, and the size of the roster are asserted before any "zero defects".
//   2. FIXTURES — one synthetic source per class, including the shapes a naive detector gets wrong (a loop that
//      parks three with one call, a `PARKED-DRIVER` probe that only fires on a failure branch, a push that
//      exists only in a comment, a line that counts the wrong array).
//   3. FALSIFICATION — the classifier is mutated four ways on a temp copy, each mutation asserted to have
//      LANDED, and each must turn a fixture red. A green mutant is a decision the fixtures never exercise. And
//      the REAL defect is replayed: item 87's source as it stood on origin/main before this item classifies
//      CANNOT-FAIL, so the guard would have caught the file it was written for.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classifyParkFile, constantTrueParks, DEFECTS, LAWFUL } from '../park-count-classify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..', '..');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// ---------------------------------------------------------------------------
// 1 · POPULATION
// ---------------------------------------------------------------------------
const files = readdirSync(here).filter((f) => f.endsWith('.mjs')).sort();
const byClass = {};
let constTrue = 0; let constTrueFiles = 0;
for (const f of files) {
  const src = readFileSync(join(here, f), 'utf8');
  const r = classifyParkFile(src);
  (byClass[r.cls] ??= []).push({ f, literalZero: r.literalZeroLine });
  const c = constantTrueParks(src);
  constTrue += c.constTrue; if (c.constTrue) constTrueFiles += 1;
}
const n = (k) => (byClass[k] ?? []).length;
const names = (k) => (byClass[k] ?? []).map((x) => x.f).join(' ');

ok('POPULATION: every roster file was read and classified into exactly one class (coverage — a scan that read fewer files than the roster is blind)',
  Object.values(byClass).reduce((a, v) => a + v.length, 0) === files.length && files.length >= 60, `${files.length} files`);
ok('POPULATION: the classifier SEES pushes — files classified DERIVED are a large share of the roster (a classifier blind to pushes finds none, and would then pass every "no defects" check below)',
  n('DERIVED') >= 20, `DERIVED ${n('DERIVED')} of ${files.length}`);
ok(`POPULATION: NO file has a defective PARKED verdict (${DEFECTS.join(' / ')})`,
  DEFECTS.every((d) => n(d) === 0), JSON.stringify(Object.fromEntries(DEFECTS.map((d) => [d, names(d)]))));
ok('POPULATION: this guard is in the population it scans and is itself lawful', (byClass.NOT_GATED ?? []).length === 0 && LAWFUL.some((c) => (byClass[c] ?? []).some((x) => x.f === 'item147.mjs')));
// SILENCE, DECIDED: a file that prints nothing and a file with nothing to print must never look alike, so the two
// are named as separate lists here — measured every run, never written as a number in a comment (a number in a
// comment goes stale without anything failing).
ok('SILENCE: the lawful silent shapes are reported as SEPARATE named lists (a silent file and an empty file are identical in a log)',
  true, JSON.stringify({
    DECLARED_EMPTY: n('DECLARED-EMPTY'), of_which_literal_zero_line: (byClass['DECLARED-EMPTY'] ?? []).filter((x) => x.literalZero).length,
    SILENT_gated_prints_nothing: names('SILENT'), NOT_GATED: n('NOT-GATED'),
  }));
ok('REPORT: parked checks that pass a CONSTANT true (a park that cannot itself fail) — whether a park can fail is a different question from whether a failing park can reach the suite; offered, not built',
  true, JSON.stringify({ constantTrueParks: constTrue, inFiles: constTrueFiles }));

// ---------------------------------------------------------------------------
// 2 · FIXTURES — one synthetic source per class
// ---------------------------------------------------------------------------
const FIX = {
  DERIVED: `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const park = (n, p) => parkedChecks.push({ name: n, pass: p });
  park('a', true);
  console.log(parkedChecks.every((c) => c.pass) ? \`\\nX PARKED: PASS (\${parkedChecks.length} checks)\` : \`\\nX PARKED: FAIL — \${parkedChecks.filter((c) => !c.pass).length}/\${parkedChecks.length}\`);
}`,
  'DERIVED (a loop parks three with ONE call site)': `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  for (const w of [1, 2, 3]) parkedChecks.push({ name: 'w' + w, pass: true });
  console.log(parkedChecks.every((c) => c.pass) ? \`\\nX PARKED: PASS (\${parkedChecks.length} checks)\` : \`\\nX PARKED: FAIL\`);
}`,
  'DERIVED (a PARKED-DRIVER probe on a failure branch only)': `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (n, p) => parkedChecks.push({ name: n, pass: p });
  if (!present) pok('PARKED-DRIVER: a node is present', false, 'absent'); else { pok('ok', true); }
  console.log(parkedChecks.every((c) => c.pass) ? \`\\nX PARKED: PASS (\${parkedChecks.length} checks)\` : \`\\nX PARKED: FAIL\`);
}`,
  'CANNOT-FAIL': `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (n, p) => parkedChecks.push({ name: n, pass: p });
  pok('a', true); pok('b', false);
  console.log('\\nX PARKED: PASS (0 checks) — parks nothing');
}`,
  'CANNOT-FAIL (derived count but NO FAIL form)': `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  parkedChecks.push({ name: 'a', pass: false });
  console.log(\`\\nX PARKED: PASS (\${parkedChecks.length} checks)\`);
}`,
  'LITERAL-COUNT': `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  parkedChecks.push({ name: 'a', pass: true });
  console.log(parkedChecks.every((c) => c.pass) ? '\\nX PARKED: PASS (4 checks)' : '\\nX PARKED: FAIL');
}`,
  'OTHER-ARRAY': `const parkedChecks = []; const parkedProbes = [];
if (process.env.HARNESS_PARKED === '1') {
  parkedChecks.push({ name: 'a', pass: true });
  console.log(parkedProbes.every((c) => c.pass) ? \`\\nX PARKED: PASS (\${parkedProbes.length} checks)\` : \`\\nX PARKED: FAIL\`);
}`,
  'PARKS-SILENTLY': `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  parkedChecks.push({ name: 'a', pass: false });
  console.log(JSON.stringify(parkedChecks));
}`,
  'DECLARED-EMPTY': `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  console.log('\\nX PARKED: PASS (0 checks) — parks nothing');
}`,
  SILENT: `const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  console.log(JSON.stringify(parkedChecks));
}`,
  'NOT-GATED': `const checks = []; console.log('VERIFY: PASS');`,
  // A push that exists only in a comment is not a push (the AST ignores comments): this must NOT be DERIVED.
  'DECLARED-EMPTY (a push that exists only in a COMMENT)': `const parkedChecks = [];
// parkedChecks.push({ name: 'old', pass: true });
if (process.env.HARNESS_PARKED === '1') {
  console.log('\\nX PARKED: PASS (0 checks)');
}`,
};
const WANT = (name) => name.split(' ')[0];
const runFixtures = (classify) => Object.entries(FIX).filter(([name, src]) => classify(src).cls !== WANT(name)).map(([name]) => name);
const wrongNow = runFixtures(classifyParkFile);
ok(`FIXTURES: each of the ${Object.keys(FIX).length} synthetic sources lands in its expected class`, wrongNow.length === 0, JSON.stringify(wrongNow));

// ---------------------------------------------------------------------------
// 3 · FALSIFICATION — mutate the classifier on a TEMP copy; each mutation must land and must turn something red
// ---------------------------------------------------------------------------
const CLASSIFIER = join(here, '..', 'park-count-classify.mjs');
const classifierSrc = readFileSync(CLASSIFIER, 'utf8');
const tmp = join(tmpdir(), 'wrizo-item147');
mkdirSync(tmp, { recursive: true });
const MUTANTS = [
  ['M1 blind to every push', "pushed.add(n.expression.expression.text);", ';'],
  ['M2 the FAIL form is ignored', "const hasFailForm = lines.some((l) => /PARKED:\\s*FAIL/.test(l.text));", 'const hasFailForm = true;'],
  ['M3 the count need not be the array\'s length', "} else if (derivedFrom.size === 0 || !usesLength) {", '} else if (false) {'],
  ['M4 an empty file that prints a line reads as silent', "cls = hasLine ? 'DECLARED-EMPTY' : (parkArrays.length || mentionsGate ? 'SILENT' : 'NOT-GATED');", "cls = (parkArrays.length || mentionsGate ? 'SILENT' : 'NOT-GATED');"],
];
for (const [i, [name, from, to]] of MUTANTS.entries()) {
  if (!classifierSrc.includes(from)) { ok(`FALSIFICATION ${name}: the mutation LANDED`, false, 'the anchor text is not in the classifier — nothing below is evidence'); continue; }
  const mutated = classifierSrc.replace(from, to).replace("import ts from 'typescript';",
    `import { createRequire as __cr } from 'node:module'; const ts = __cr(${JSON.stringify(pathToFileURL(CLASSIFIER).href)})('typescript');`);
  if (mutated === classifierSrc) { ok(`FALSIFICATION ${name}: the mutation LANDED`, false, 'source unchanged'); continue; }
  const f = join(tmp, `mut-${i}.mjs`);
  writeFileSync(f, mutated);
  const mod = await import(pathToFileURL(f).href);
  const red = runFixtures(mod.classifyParkFile);
  // M1 must ALSO turn the population's coverage red (a blind classifier finds no DERIVED files).
  let popRed = '';
  if (name.startsWith('M1')) {
    let derived = 0;
    for (const file of files) if (mod.classifyParkFile(readFileSync(join(here, file), 'utf8')).cls === 'DERIVED') derived += 1;
    popRed = derived < 20 ? ` — and the population's coverage goes red too (DERIVED ${derived})` : ' — BUT the population coverage stayed green: it does not guard against a blind classifier';
    if (derived >= 20) { ok(`FALSIFICATION ${name}: the coverage check catches a blind classifier`, false, popRed); }
  }
  ok(`FALSIFICATION ${name} — must go RED`, red.length > 0, red.length ? `red: ${red[0]}${popRed}` : 'GREEN — a decision the fixtures never exercise');
}

// THE REAL DEFECT, REPLAYED: item 87 as it stood on origin/main before this item.
let item87Before = null;
try {
  item87Before = execFileSync('git', ['show', 'origin/main:apps/desktop/scripts/harness/item87.mjs'], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch { /* no origin/main in this checkout — reported below rather than silently skipped */ }
if (item87Before === null) {
  ok('REPLAY: item 87 as it stood on origin/main classifies CANNOT-FAIL', true, 'SKIPPED — origin/main is not resolvable in this checkout (reported, not silently passed)');
} else if (!/PARKED: PASS \(0 checks\)/.test(item87Before)) {
  ok('REPLAY: item 87 as it stood on origin/main classifies CANNOT-FAIL', true, 'origin/main no longer carries the literal line (this item has merged) — the replay has nothing left to replay');
} else {
  ok('REPLAY: item 87 as it stood on origin/main (the literal `PARKED: PASS (0 checks)` over four running park records) classifies CANNOT-FAIL — the guard would have caught the file it was written for',
    classifyParkFile(item87Before).cls === 'CANNOT-FAIL', classifyParkFile(item87Before).cls);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nITEM147 VERIFY: PASS (${checks.length} checks)` : `\nITEM147 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

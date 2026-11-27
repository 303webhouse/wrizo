// BROWSERLESS CHECK for FREE WRITE'S HOST UPDATE RULE (bug-list #110 / #101; Fable, Nov 22, 2:30 pm). src/components/freeWriteHost.ts decides when a new set of committed runs can be put on the page by APPENDING to the host
// instead of writing the whole host (254 KB at 50,000 words) again. This runs the REAL module (esbuild) and proves the rule by what it must do and by an equivalence sweep: whatever it says, applying its plan to a model of the host
// gives exactly the host a full rewrite would give.
//   U0  the module exports planHost and runElementHtml
//   U1  a word added at the end of the last run is a TAIL plan with exactly the added characters; nothing changed is "same"; one run added after unchanged runs is "newrun"
//   U2  everything else is FULL: the first paint (no earlier runs), an empty page, a struck run that grew, a run whose html does not begin with the old, an earlier run changed, a struck flag flipped, two runs added, runs removed
//   U3  EQUIVALENCE: over 4,000 random before/after run sets (typing, Enter, strikes, edits in the middle), applying the plan to a model host gives the same string as writing the whole host
//   MUT1  the prefix test removed (any longer last run is a tail): U2 goes RED
//   MUT2  a struck run allowed to take a tail: U2 goes RED
//   MUT3  the earlier runs not compared: U2 goes RED
// RED on the tree without src/components/freeWriteHost.ts. Run (from apps/desktop): node scripts/harness/free-write-host-unit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(here, '..', '..', 'src', 'components', 'freeWriteHost.ts');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${detail}]` : ''}`); if (!cond) fails += 1; };

if (!fs.existsSync(FILE)) {
  console.log('INFO tree: components/freeWriteHost.ts ABSENT');
  ok(false, 'U0..U3 the host update rule exists (src/components/freeWriteHost.ts)');
  console.log(`\nFREE-WRITE-HOST-UNIT VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(1);
}
async function load(source) {
  const out = await esbuild.build({ stdin: { contents: source, loader: 'ts', resolveDir: path.dirname(FILE), sourcefile: 'freeWriteHost.ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
}
const src = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const mutate = (from, to) => { if (!src.includes(from)) throw new Error(`mutant anchor missing: ${from.slice(0, 60)}`); return src.replace(from, to); };
const R = (inner, struck = false) => ({ struck, inner });

function suite(M) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  keep('U0', typeof M.planHost === 'function' && typeof M.runElementHtml === 'function');
  if (typeof M.planHost !== 'function') return r;
  const p = M.planHost;
  const tail = p([R('abc')], [R('abc def')]);
  const same = p([R('abc')], [R('abc')]);
  const nr = p([R('abc')], [R('abc'), R('x', true)]);
  keep('U1', tail.kind === 'tail' && tail.suffix === ' def' && same.kind === 'same' && nr.kind === 'newrun' && nr.run.inner === 'x' && nr.run.struck === true, JSON.stringify({ tail, same: same.kind, nr: nr.kind }));
  const fulls = [
    ['first paint', p(null, [R('a')])], ['empty before', p([], [R('a')])], ['empty after', p([R('a')], [])],
    ['struck grew', p([R('abc', true)], [R('abc d', true)])], ['not a prefix', p([R('abc')], [R('xabc')])],
    ['shrank', p([R('abcd')], [R('abc')])], ['earlier changed', p([R('a'), R('b')], [R('z'), R('bc')])], ['flag flipped', p([R('abc')], [R('abc d', true)])],
    ['two added', p([R('a')], [R('a'), R('b'), R('c')])], ['removed', p([R('a'), R('b')], [R('a')])],
  ];
  const bad = fulls.filter(([, x]) => x.kind !== 'full').map(([n, x]) => `${n}:${x.kind}`);
  keep('U2', bad.length === 0, bad.join(' | '));
  // equivalence sweep: a model host is the elements joined; the plan applied to it must equal the whole rewrite
  let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const word = () => ['the', 'quiet', 'river', ' ', '\n', 'ran', '<b>', '&amp;'][Math.floor(rnd() * 8)];
  const randRuns = () => Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => R(Array.from({ length: Math.floor(rnd() * 4) }, word).join(''), rnd() < 0.2));
  let badEq = 0;
  for (let i = 0; i < 4000; i += 1) {
    const before = randRuns();
    let after;
    const k = rnd();
    if (k < 0.45) after = before.map((x, j) => (j === before.length - 1 && !x.struck ? R(x.inner + word()) : x));
    else if (k < 0.6) after = [...before, R(word(), rnd() < 0.5)];
    else if (k < 0.8) after = before.map((x, j) => (j === 0 ? R(x.inner + 'Z', x.struck) : x));
    else after = randRuns();
    const full = after.map(M.runElementHtml).join('');
    const plan = M.planHost(before, after);
    let model = before.map(M.runElementHtml).join('');
    if (plan.kind === 'same') { /* nothing */ }
    else if (plan.kind === 'tail') { const last = before.length - 1; model = before.slice(0, last).map(M.runElementHtml).join('') + M.runElementHtml(R(before[last].inner + plan.suffix, before[last].struck)); }
    else if (plan.kind === 'newrun') model += M.runElementHtml(plan.run);
    else model = full;
    if (model !== full) badEq += 1;
  }
  keep('U3', badEq === 0, `${badEq} of 4000 differ`);
  return r;
}
const real = suite(await load(src));
const WORDS = { U0: 'the module exports planHost and runElementHtml', U1: 'a word added at the end of the last run is a tail plan with exactly the added characters; nothing changed is same; one run added after unchanged runs is newrun', U2: 'everything else is a full write (first paint, empty, a struck run that grew, not a prefix, shrank, an earlier run changed, a flag flipped, two added, removed)', U3: 'EQUIVALENCE: over 4,000 random before/after run sets, the plan applied to a model host gives the host a full rewrite would give' };
for (const k of Object.keys(WORDS)) ok(!!real[k] && real[k].pass, `${k} ${WORDS[k]}`, real[k] && real[k].detail);
if (real.U0 && real.U0.pass) {
  for (const [name, code, red] of [
    ['MUT1 the prefix test removed', mutate('&& b.inner.startsWith(a.inner)', ''), 'U2'],
    ['MUT2 a struck run allowed to take a tail', mutate('a.struck === b.struck && !b.struck &&', 'a.struck === b.struck &&'), 'U2'],
    ['MUT3 the earlier runs not compared', mutate('for (let i = 0; i < next.length - 1; i += 1) if (!same(prev[i], next[i])) return { kind: \'full\' };', ''), 'U2'],
  ]) {
    let m;
    try { m = suite(await load(code)); } catch (e) { ok(false, `${name}: the mutant did not build`, String(e && e.message).slice(0, 140)); continue; }
    ok(m[red] && m[red].pass === false, `${name}: ${red} goes RED (the rule can fail)`, m[red] && m[red].detail && m[red].detail.slice(0, 100));
  }
}
console.log(fails ? `\nFREE-WRITE-HOST-UNIT VERIFY: FAIL - ${fails}/${checks} failed` : `\nFREE-WRITE-HOST-UNIT VERIFY: PASS (${checks} checks)`);
process.exit(fails ? 1 : 0);

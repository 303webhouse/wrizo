// CLONE WITHOUT COPYING THE TEXT (bug #85; Fable, Nov 22, 2:30 pm: "getJournalEntry's deep clone (~8 ms)"). typing-growth's call chains (Actions 45049676728, 50,000 words): the page editor's every render calls getJournalEntry twice
// (the entry, and the beat card's read of it), and getJournalEntry returns clone(entry) = JSON.parse(JSON.stringify(entry)): the whole 300 KB text escaped to a new string and parsed back, ~130 ms over the run in Draft, 83 in Free Write.
// A string is immutable, so the clone can SHARE it: cloneJson walks the record and copies the objects and arrays, never the characters, and answers what the JSON round trip answered (undefined fields dropped, NaN/Infinity -> null,
// toJSON honoured, an array's undefined -> null), so no caller can tell.
//   CJ-SAME      the same answer as the JSON round trip on a corpus (a real-shaped entry, undefined fields, NaN, -0, holes, a Date, a toJSON, a "__proto__" key, unicode)
//   CJ-FRESH     the clone shares no object or array with the source (mutating it leaves the source alone): the reason clone() exists (store/persistence/core.ts)
//   CJ-FAST      a 300,000-character text costs the clone at most a fifth of the JSON round trip (same process, median of 15)
//   CJ-WIRED     persistence/core.ts's clone() is cloneJson (not JSON.parse(JSON.stringify))
//   MUT-CJ       each of four mutants goes red on the check that guards it: the round trip back in as cloneJson (CJ-FAST), a clone that returns the source (CJ-FRESH), one that keeps undefined fields (CJ-SAME), clone() put back to the round trip (CJ-WIRED)
// Browserless. Run: node scripts/harness/clone-json-unit.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const esbuild = createRequire(require.resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');

const MOD = path.join(SRC, 'store', 'persistence', 'cloneJson.ts');
const CORE = path.join(SRC, 'store', 'persistence', 'core.ts');
const have = fs.existsSync(MOD);
const modText = have ? noCR(fs.readFileSync(MOD, 'utf8')) : '';
const loadClone = async (text) => {
  const js = esbuild.transformSync(text, { loader: 'ts', format: 'esm' }).code;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
  return mod.cloneJson;
};
const roundTrip = (v) => JSON.parse(JSON.stringify(v));

const BIG = Array.from({ length: 2000 }, (_, i) => 'line ' + i + ' "quoted" \\ back\tslash, and é中 words in it to make the string long enough to cost something').join('\n');
const sparse = [1, , 3];
const withProto = JSON.parse('{"__proto__":{"a":1},"b":2}');
const CORPUS = [
  { id: 'a1', text: 'hello\nworld', projectId: null, source: 'page', origin: 'journal', strokes: [{ x: 0.1, y: 0.2, pts: [[1, 2], [3, 4]] }], pageSettings: { face: { name: 'Lora' }, size: 'letter' }, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
  { a: undefined, b: null, c: 0, d: -0, e: NaN, f: Infinity, g: -Infinity, h: true, i: '', j: [undefined, () => 1, Symbol('s'), NaN, null], k: { l: undefined, m: [] } },
  { when: new Date('2026-04-01T00:00:00.000Z'), nested: { custom: { toJSON() { return { x: 1, y: undefined }; } } } },
  { arr: sparse, deep: [[[1, [2, [3, undefined]]]]] },
  withProto,
  { text: BIG, unicode: '\u{1F600}\u0000 ', tags: ['a', 'b'] },
  [], {}, 'str', 7, true, null,
];

// the checks, run against a given cloneJson
const run = async (cloneJson) => {
  const out = { same: true, fresh: true, ratio: null, why: [] };
  for (let i = 0; i < CORPUS.length; i += 1) {
    try { assert.deepStrictEqual(cloneJson(CORPUS[i]), roundTrip(CORPUS[i])); } catch (e) { out.same = false; out.why.push('corpus ' + i); }
  }
  // fresh: mutate every object/array of a clone; the source must be as it was
  const src = CORPUS[0]; const before = JSON.stringify(src);
  const c = cloneJson(src); c.strokes[0].pts[0][0] = 99; c.pageSettings.face.name = 'X'; c.tags = 1; c.strokes.push(1); c.text = 'changed';
  if (JSON.stringify(src) !== before) { out.fresh = false; out.why.push('shared'); }
  const e = { id: 'big', text: BIG, strokes: [], pageSettings: { size: 'letter' }, createdAt: 'x', updatedAt: 'y' };
  const time = (fn) => { const xs = []; for (let r = 0; r < 15; r += 1) { const t0 = performance.now(); for (let k = 0; k < 20; k += 1) fn(e); xs.push(performance.now() - t0); } xs.sort((a, b) => a - b); return xs[7]; };
  time(cloneJson); time(roundTrip);   // warm both
  out.ratio = Math.round((time(cloneJson) / time(roundTrip)) * 1000) / 1000;
  return out;
};
const FAST_RATIO = 0.2;
const wiredIn = (coreText) => { const m = /export function clone<T>\(value: T\): T \{([\s\S]*?)\n\}/.exec(coreText); return !!m && /\bcloneJson\(/.test(m[1]) && !/JSON\.stringify/.test(m[1]) && /import \{[^}]*\bcloneJson\b[^}]*\} from '\.\/cloneJson'/.test(coreText); };

if (!have) {
  ok('CJ-SAME store/persistence/cloneJson.ts exists and answers what the JSON round trip answers', false, 'no store/persistence/cloneJson.ts');
  ok('CJ-FRESH the clone shares no object or array with the source', false, 'no cloneJson.ts');
  ok('CJ-FAST a 300,000-character text costs the clone at most a fifth of the JSON round trip', false, 'no cloneJson.ts');
  ok('CJ-WIRED persistence/core.ts clone() is cloneJson', wiredIn(noCR(fs.readFileSync(CORE, 'utf8'))), 'core.ts clone() is the JSON round trip');
  ok('MUT-CJ four mutants each go red on their own check', false, 'no cloneJson.ts');
} else {
  const real = await loadClone(modText);
  const r = await run(real);
  ok('CJ-SAME cloneJson answers what the JSON round trip answers on the corpus (undefined fields dropped, NaN -> null, holes -> null, toJSON, a Date, "__proto__" as a key, unicode)', r.same, r.why);
  ok('CJ-FRESH the clone shares no object or array with the source (mutating every level of it leaves the source as it was)', r.fresh, r.why);
  ok(`CJ-FAST a 300,000-character text costs the clone at most ${FAST_RATIO} of the JSON round trip (printed ratio ${r.ratio})`, r.ratio != null && r.ratio <= FAST_RATIO, r.ratio);
  const coreText = noCR(fs.readFileSync(CORE, 'utf8'));
  ok('CJ-WIRED persistence/core.ts clone() is cloneJson (imported from ./cloneJson, no JSON.stringify in it)', wiredIn(coreText), 'clone() body');
  // the mutants (each must LAND: the mutated text differs from the real one, and the mutant is red on the check it targets)
  const mutants = [];
  { const t = 'export const cloneJson = <T>(v: T): T => JSON.parse(JSON.stringify(v));'; mutants.push({ id: 'roundtrip-as-clone', text: t, red: (x) => !(x.ratio != null && x.ratio <= FAST_RATIO) }); }
  { const t = 'export const cloneJson = <T>(v: T): T => v;'; mutants.push({ id: 'returns-the-source', text: t, red: (x) => !x.fresh }); }
  { const t = modText.replace('if (x === undefined) continue;', ''); mutants.push({ id: 'keeps-undefined', text: t, red: (x) => !x.same, landed: t !== modText }); }
  const verdicts = [];
  for (const m of mutants) {
    if (m.landed === false) { verdicts.push({ id: m.id, landed: false }); continue; }
    let x; try { x = await run(await loadClone(m.text)); } catch (e) { verdicts.push({ id: m.id, crashed: String(e).slice(0, 80) }); continue; }
    verdicts.push({ id: m.id, red: m.red(x), same: x.same, fresh: x.fresh, ratio: x.ratio });
  }
  const wiredMut = coreText.replace(/(export function clone<T>\(value: T\): T \{)[\s\S]*?\n\}/, '$1\n  return JSON.parse(JSON.stringify(value)) as T;\n}');
  verdicts.push({ id: 'clone-back-to-roundtrip', landed: wiredMut !== coreText, red: !wiredIn(wiredMut) });
  ok('MUT-CJ each mutant LANDED and goes red on the check that guards it (CJ-FAST, CJ-FRESH, CJ-SAME, CJ-WIRED)', verdicts.length === 4 && verdicts.every((v) => v.landed !== false && v.crashed === undefined && v.red === true), verdicts);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + JSON.stringify(c.detail).slice(0, 900)}`);
const EXPECTED = 5;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nCLONE-JSON VERIFY: PASS (${checks.length} checks)` : `\nCLONE-JSON VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);

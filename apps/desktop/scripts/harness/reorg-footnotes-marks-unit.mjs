// REORG FOOTNOTES x SUPERSCRIPT, BROWSERLESS (reorg-plan-v2, INK queue item 3 beside item 2). A footnote marker is `[^1]`; a superscript is `^x^` (store/markRuns.ts, the lone-caret pair under the flanking rule).
// Two markers on a line, `a[^1] b[^2]`, hold the pair `^1] b[^`: with no rule the reader would paint that as a superscript and hide the carets. The reader must leave a footnote marker alone.
// The real store/markRuns.ts is bundled (esbuild); the mutant (a text rewrite of the source) must LAND and turn the check red.
//   M1  two footnote markers on a line read as NO run (a stand-in for "the carets stay"): neither side, adjacent or spaced, an endnote label too
//   M2  a real superscript still reads beside a marker on the same line; a typed \[^1] (escaped) is not a marker, and its caret-pair behaves as before
// Run: node scripts/harness/reorg-footnotes-marks-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const require = createRequire(import.meta.url);
const { build } = createRequire(createRequire(join(DESKTOP, 'package.json')).resolve('vite'))('esbuild');
const SRC_FILE = join(DESKTOP, 'src', 'store', 'markRuns.ts');
const lf = (s) => s.split('\r\n').join('\n');
const SRC = lf(fs.readFileSync(SRC_FILE, 'utf8'));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const BS = String.fromCharCode(92);

// bundle markRuns with its imports, the entry being the (possibly mutated) text of markRuns.ts itself
async function load(text) {
  const r = await build({ stdin: { contents: text, resolveDir: join(DESKTOP, 'src', 'store'), sourcefile: 'markRuns.ts', loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const kinds = (M, line) => M.readMarks(line).map((r) => r.kind);

function suite(M) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('M1', () => {
    const a = kinds(M, 'a[^1][^2] b');
    const b = kinds(M, 'Hello[^1] there[^2]');
    const c = kinds(M, 'one[^e1] two[^1]');
    const d = kinds(M, 'x[^1] y[^note-2] z');
    return { pass: a.length === 0 && b.length === 0 && c.length === 0 && d.length === 0, detail: J({ a, b, c, d }) };
  });
  t('M2', () => {
    const a = kinds(M, 'x^2^ here[^1]');
    const b = kinds(M, 'Cite[^1] then x^2^ and y^3^');
    const e = kinds(M, 'typed ' + BS + '[^1] and ' + BS + '[^2]');
    return { pass: J(a) === J(['sup']) && J(b) === J(['sup', 'sup']) && J(e) === J(kinds(M, 'typed ' + BS + '[^1] and ' + BS + '[^2]')), detail: J({ a, b, e }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(await load(SRC)); } catch (e) { baseErr = e; }
for (const k of ['M1', 'M2']) ok(`${k} on the real markRuns.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'markRuns.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['the reader no longer skips a footnote marker', 'M1', (t) => t.replace('FOOTNOTE_MARKER_AT.test(line.slice(i))', () => 'false')],
];
for (const [name, key, fn] of MUT) {
  const after = fn(SRC);
  const landed = after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(await load(after)) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FOOTNOTES-MARKS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FOOTNOTES-MARKS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

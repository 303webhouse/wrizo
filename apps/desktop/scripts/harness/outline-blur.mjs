// OUTLINE BLUR DATA BUG (deploy #8, promoted by Fable Oct 25 from polish item 13a). The Outline row is an <input>: it cannot hold a newline, so it SHOWS "First\nOne." as "FirstOne." - and its blur handler wrote that value back
// over the card EVERY time, so merely clicking into a row and leaving it destroyed the card's title/text split. DATA, not display.
// THE FIX'S CONTRACT (written before the build - red on main, where store/outlineRow.ts does not exist):
//   store/outlineRow.ts   splitOutlineText(text) -> { title, body }   (title = the first line; body = everything after the first newline, verbatim)
//                          outlineTitleEdit(text, typedTitle) -> string | null   (null = nothing changed: write NOTHING; else the typed title + the card's text after it, untouched)
//   components/BoardProjection.tsx   the row's input holds the TITLE; the text shows beside it as .board-outline-body; blur writes only through outlineTitleEdit, and only when it returns a string.
// PART 1 (this file, browserless): the pure functions + source pins + mutants (each landing asserted).  PART 2 (outline-blur-part2.mjs, a box turn): the live app.
// Run: node scripts/harness/outline-blur.mjs   (from apps/desktop; takes the box first)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const require = createRequire(path.resolve(here, '..', '..', 'package.json'));
const ts = require('typescript');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const has = (rel) => fs.existsSync(path.join(SRC, rel));
const readRaw = (rel) => (has(rel) ? noCR(fs.readFileSync(path.join(SRC, rel), 'utf8')) : '');

async function loadModule(text) {
  if (!text) return null;
  const js = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
}

function suite(M, files) {
  const r = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); r[id] = { pass: !!pass, detail }; } catch (e) { r[id] = { pass: false, detail: 'threw: ' + String((e && e.message) || e).slice(0, 160) }; } };
  const bp = files['components/BoardProjection.tsx'] || '';
  const css = files['index.css'] || '';
  chk('O1', () => { const s = M.splitOutlineText; return [s('First\nOne.').title === 'First' && s('First\nOne.').body === 'One.' && s('Solo').title === 'Solo' && s('Solo').body === '' && s('A\nB\nC').body === 'B\nC' && s('').title === '' && s(undefined).body === '' && s('Title\n').body === '', 'the title is the first line; the body is everything after the first newline, verbatim']; });
  chk('O2', () => { const e = M.outlineTitleEdit; return [e('First\nOne.', 'First') === null && e('Solo', 'Solo') === null && e(undefined, '') === null && e('Title\n', 'Title') === null && e('A\nB\nC', 'A') === null, 'a blur with the title unchanged writes NOTHING (null) - the old handler wrote "FirstOne." back over "First\\nOne."']; });
  chk('O3', () => { const e = M.outlineTitleEdit; return [e('First\nOne.', 'First EDITED') === 'First EDITED\nOne.' && e('Solo', 'Solo two') === 'Solo two' && e('A\nB\nC', 'X') === 'X\nB\nC' && e('First\nOne.', '') === '\nOne.' && e(undefined, 'New') === 'New', 'an edited title keeps the card\'s text after it; a single-line card is simply the new title']; });
  chk('O4', () => { const e = M.outlineTitleEdit; return [e('A\nB', 'X\nY') === 'X Y\nB' && e('A\nB', 'X\r\nY') === 'X Y\nB', 'a typed title is one line (a stray newline becomes a space) so it can never split or swallow the text after it']; });
  chk('O5', () => [/outlineTitleEdit\(/.test(bp) && /splitOutlineText\(/.test(bp) && !/onEditText\(node\.boxId, e\.target\.value\)/.test(bp) && /board-outline-body/.test(bp) && /if \(next !== null\) onEditText\(node\.boxId, next\)/.test(bp), 'the row\'s input holds the TITLE, the text shows beside it, and blur writes only through outlineTitleEdit and only when it returns a string']);
  chk('O6', () => [/\.board-outline-body\s*\{[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/.test(css) && /\.board-outline-body\s*\{[^}]*min-width:\s*0/.test(css), 'the text beside the title is one quiet line with an ellipsis (never a wrapped block under the outline)']);
  return r;
}

const MUT = [
  { name: 'a blur with nothing changed still writes', file: 'store/outlineRow.ts', find: /if \(clean === title\) return null;/, to: '', red: ['O2'] },
  { name: 'an edit drops the text after the title', file: 'store/outlineRow.ts', find: /return nl < 0 \? clean : clean \+ '\\n' \+ body;/, to: 'return clean;', red: ['O3'] },
  { name: 'the split takes the LAST newline', file: 'store/outlineRow.ts', find: /const nl = t\.indexOf\('\\n'\);/, to: "const nl = t.lastIndexOf('\\n');", red: ['O1'] },
  { name: 'a typed newline survives into the stored title', file: 'store/outlineRow.ts', find: /\.replace\(\/\[\\r\\n\]\+\/g, ' '\)/, to: '', red: ['O4'] },
  { name: 'the row blur writes the raw input value again', file: 'components/BoardProjection.tsx', find: /const next = outlineTitleEdit\(b\.text, e\.target\.value\); if \(next !== null\) onEditText\(node\.boxId, next\);/, to: 'onEditText(node.boxId, e.target.value);', red: ['O5'] },
  { name: 'the row stops showing the text beside the title', file: 'components/BoardProjection.tsx', find: /board-outline-body/, to: 'board-outline-gone', red: ['O5'] },
  { name: 'the text beside the title wraps', file: 'index.css', find: /(\.board-outline-body\s*\{[^}]*?)white-space:\s*nowrap/, to: '$1white-space:normal', red: ['O6'] },
];

const base = await loadModule(readRaw('store/outlineRow.ts'));
ok('store/outlineRow.ts exists and loads', !!base && typeof base.splitOutlineText === 'function' && typeof base.outlineTitleEdit === 'function', has('store/outlineRow.ts') ? '' : 'the file does not exist yet - the build writes it');
const files0 = { 'components/BoardProjection.tsx': readRaw('components/BoardProjection.tsx'), 'index.css': readRaw('index.css') };
const res0 = base ? suite(base, files0) : {};
for (const [k, v] of Object.entries(res0)) ok(k, v.pass, v.detail);
ok('the suite ran every check it names', Object.keys(res0).length === 6, `${Object.keys(res0).length} checks`);

let landed = 0, killed = 0;
for (const m of MUT) {
  const orig = readRaw(m.file);
  const mutated = orig.replace(m.find, m.to);
  const did = !!orig && mutated !== orig;
  if (!did) { ok(`mutant "${m.name}" LANDED`, false, `no match in ${m.file}${has(m.file) ? '' : ' (the file does not exist yet - the build writes it)'}`); continue; }
  landed += 1;
  const mod = m.file === 'store/outlineRow.ts' ? await loadModule(mutated) : base;
  let red = [];
  if (!mod) red = ['(bundle)']; else {
    const res = suite(mod, { ...files0, ...(m.file !== 'store/outlineRow.ts' ? { [m.file]: mutated } : {}) });
    red = Object.entries(res).filter(([, v]) => !v.pass).map(([k]) => k);
  }
  const hit = m.red.every((k) => red.includes(k));
  if (hit) killed += 1;
  ok(`mutant "${m.name}" is KILLED by a check (reddens: ${red.join(', ') || 'none'})`, hit, hit ? '' : `expected ${m.red.join(', ')}; got ${red.join(', ') || 'none'}`);
}
ok(`all ${MUT.length} mutations landed and ${MUT.length} were killed`, landed === MUT.length && killed === MUT.length, `${landed} landed / ${killed} killed`);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nOUTLINE-BLUR: FAIL - ${failed.length}/${checks.length} failed` : `\nOUTLINE-BLUR: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

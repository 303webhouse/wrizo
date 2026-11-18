// BUG #85 - NO PER-KEY WORK OVER THE WHOLE PAGE FOR AN ANSWER THAT NEEDS ONE LINE OR ONE ALREADY-KNOWN COUNT (Fable's list: "per-key cost growing with page length: 2 ms at 500 words, 52 ms at 50,000"). Browserless (esbuild bundles the REAL modules); no box turn.
// The browser's own profile of a Draft letter at 50,000 words (run 44366668865, typing-85p.mjs) put the biggest self time in two functions called from the page's render: the page's TITLE (firstLine > firstPlainLine read and stripped EVERY line of the page to return the first, ~20 ms a key)
// and the WORD COUNT (counted over the whole page three or four times in one render, ~14 ms a key).
//   P1  firstPlainLine(text) gives the same line as plainLines(text)[0] over a corpus (blank first lines, a line that is only markup, headings, bullets, a font span, whitespace only, empty)
//   P2  firstPlainLine on a 50,000-word page costs what it costs on a short one: 400 calls in under 150 ms (the old way takes seconds)
//   P3  wordCount gives the right number, and again after the text changes and when it changes back (the remembered answer never stands for another text)
//   P4  wordCount asked 400 times for the same 50,000-word text costs one count: under 150 ms (the old way counts 400 times)
//   P5  (instrument) the OLD readings, written out here, fail P2 and P4's bars: the checks bite
// Run: node scripts/harness/perkey-whole-page.mjs (apps/desktop). Prints one verdict line.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const { build } = createRequire(createRequire(join(DESKTOP, 'package.json')).resolve('vite'))('esbuild');
const load = async (entry, dir) => {
  const r = await build({ stdin: { contents: entry, resolveDir: dir, loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
};
let failed = 0, total = 0;
const ok = (name, pass, detail) => { total += 1; if (!pass) failed += 1; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail && !pass ? '  ' + detail : ''}`); };

const m = await load("export { firstPlainLine, plainLines } from './store/entryText'; export { wordCount } from './store/wordCount'; export { stripLine } from './store/markRuns';", join(DESKTOP, 'src'));
const NL = String.fromCharCode(10);

// P1
const CORPUS = ['', '   ', NL + NL + NL, 'Just a line', '  indented first line' + NL + 'second', NL + '  ' + NL + 'the third line has the words' + NL + 'fourth', '# A heading' + NL + 'body', '- a bullet' + NL + '- another', '[styled]{.font-lora .size-14} words here' + NL + 'two',
  '**' + NL + 'real words', 'x', NL + 'x', 'café — naïve' + NL + 'second'];
const bad1 = CORPUS.filter((t) => m.firstPlainLine(t) !== m.plainLines(t)[0]);
ok('P1 firstPlainLine(text) is plainLines(text)[0] over the corpus', bad1.length === 0, JSON.stringify(bad1.slice(0, 2)));

// a 50,000-word page, one 15-word line at a time
const SENT = 'The writer keeps a steady pace through the long page, and nothing slows the page down at all.';
const big = Array.from({ length: Math.ceil(50000 / 17) }, () => SENT).join(NL);
const time = (fn) => { const t0 = performance.now(); fn(); return performance.now() - t0; };

// P2
const t2 = time(() => { for (let i = 0; i < 400; i += 1) m.firstPlainLine(big); });
ok(`P2 firstPlainLine on a 50,000-word page: 400 calls in under 150 ms (took ${Math.round(t2)} ms)`, t2 < 150, `${Math.round(t2)} ms`);

// P3
const A = 'one two three', B2 = 'one two three four five six';
const oldCountOf = (t) => { const s = t.trim(); return s ? s.split(/\s+/).length : 0; };
const exact = oldCountOf(big);
ok('P3 wordCount is right, right again after a change, and right when it changes back', m.wordCount(A) === 3 && m.wordCount(B2) === 6 && m.wordCount(A) === 3 && m.wordCount('') === 0 && m.wordCount(A) === 3 && m.wordCount(big) === exact && m.wordCount(A) === 3, `big ${m.wordCount(big)} want ${exact}`);
const w1 = m.wordCount(big);

// P4
const t4 = time(() => { for (let i = 0; i < 400; i += 1) m.wordCount(big); });
ok(`P4 wordCount asked 400 times for the same 50,000-word text: under 150 ms (took ${Math.round(t4)} ms)`, t4 < 150 && m.wordCount(big) === w1, `${Math.round(t4)} ms`);

// P5: the old readings, as they stood, fail those bars
const oldFirst = (t) => m.plainLines(t)[0];
const oldCount = (t) => { const s = t.trim(); return s ? s.split(/\s+/).length : 0; };
const o2 = time(() => { for (let i = 0; i < 60; i += 1) oldFirst(big); }) * (400 / 60);
const o4 = time(() => { for (let i = 0; i < 60; i += 1) oldCount(big); }) * (400 / 60);
ok(`P5 the old readings fail the bars (old title 400 calls ~${Math.round(o2)} ms, old count 400 calls ~${Math.round(o4)} ms)`, o2 > 150 && o4 > 150, `${Math.round(o2)} / ${Math.round(o4)}`);

console.log(failed ? `PERKEY-WHOLE-PAGE: FAIL - ${failed} of ${total}` : `PERKEY-WHOLE-PAGE: PASS (${total} checks)`);
process.exitCode = failed ? 1 : 0;

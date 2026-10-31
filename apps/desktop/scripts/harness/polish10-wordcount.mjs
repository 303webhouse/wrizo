// POLISH #10 item 4 (Fable, Oct 28): a style span's marks are not words. A span that carries both a face and a size writes `]{.font-lora .size-14}` - the space inside
// the mark used to count as a word, on the desktop's counters AND the server's sync (users.words_written, the theme thresholds). Browserless (esbuild bundles the REAL modules).
//   W1  the desktop's wordCount counts the words only - the same on a marked text as on its plain reading, over a corpus (faces, sizes, both, half-points, headings, bullets, bold inside)
//   W2  the server's wordCount (apps/server/src/wordCount.ts) gives the same number as the desktop's on every corpus text - the two cannot drift apart
//   W3  no desktop source keeps its own raw whitespace-split counter (every counter is the one in store/wordCount.ts)
//   W4  the server's sync.ts counts through ./wordCount (not a private copy)
//   W5  (instrument) the OLD counters miscount the face+size span - the checks above bite
// Run: node scripts/harness/polish10-wordcount.mjs (apps/desktop). Needs no box turn.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const SERVER = join(DESKTOP, '..', 'server');
const { build } = createRequire(createRequire(join(DESKTOP, 'package.json')).resolve('vite'))('esbuild');
const load = async (entry, dir) => {
  const r = await build({ stdin: { contents: entry, resolveDir: dir, loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
};
const BS = String.fromCharCode(92);
let failed = 0, total = 0;
const ok = (name, pass, detail) => { total += 1; if (!pass) failed += 1; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail && !pass ? '  ' + detail : ''}`); };

const desk = await load("export { wordCount } from './store/wordCount'; export { stripLine } from './store/markRuns';", join(DESKTOP, 'src'));
const serv = await load("export { wordCount } from './wordCount';", join(SERVER, 'src'));

// each: [marked text, its plain reading]
const CORPUS = [
  ['The ferry was [late]{.size-14} and the harbour was cold', 'The ferry was late and the harbour was cold'],
  ['The ferry was [late and cold]{.font-lora .size-14} and the harbour was grey', 'The ferry was late and cold and the harbour was grey'],
  ['[Ada counted gulls]{.font-courier-prime .size-10.5} instead of minutes.', 'Ada counted gulls instead of minutes.'],
  ['# A heading\n- one [**two**]{.size-14} three\nplain [words]{.font-arial .size-12} here', '# A heading\n- one **two** three\nplain words here'],
  ['a [b]{.font-lora .size-14} [c]{.font-lora .size-14} d', 'a b c d'],
  ['[one]{.font-lora} [two]{.size-18} [three]{.font-lora .size-18}', 'one two three'],
  ['no marks at all here', 'no marks at all here'],
  ['', ''],
  ['   \n  ', ''],
];
const bad = [];
for (const [marked, plain] of CORPUS) {
  const d = desk.wordCount(marked), dp = desk.wordCount(plain), s = serv.wordCount(marked), sp = serv.wordCount(plain);
  if (d !== dp) bad.push({ side: 'desktop', marked, d, dp });
  if (s !== sp) bad.push({ side: 'server', marked, s, sp });
}
ok('W1+W2: both counters count a marked text as its plain words (face+size, size, face, headings, bullets, bold inside)', bad.length === 0, JSON.stringify(bad));
const differ = CORPUS.filter(([m]) => desk.wordCount(m) !== serv.wordCount(m)).map(([m]) => m);
ok('W2: the server and the desktop give the same number on every corpus text', differ.length === 0, JSON.stringify(differ));
ok('W2 (typed literal): an escaped `\]{.size-14}` the writer typed is words, on both sides', serv.wordCount(('see ' + BS + ']{.size-14} here')) === desk.wordCount(('see ' + BS + ']{.size-14} here')), `${serv.wordCount(('see ' + BS + ']{.size-14} here'))} vs ${desk.wordCount(('see ' + BS + ']{.size-14} here'))}`);

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(d, e.name)] : []));
const RAW = /[.]split[(]\/[\x5c]s[+]\/[)][.]length\s*:\s*0/;   // the raw `x.split(/\s+/).length : 0` counter shape
const hits = walk(join(DESKTOP, 'src')).filter((f) => !f.endsWith('wordCount.ts') && RAW.test(readFileSync(f, 'utf8'))).map((f) => f.slice(DESKTOP.length + 1));
ok('W3: no desktop source keeps its own raw whitespace-split word counter', hits.length === 0, JSON.stringify(hits));
ok('W4: the server\'s sync.ts counts through ./wordCount and keeps no private copy', /from '\.\/wordCount'/.test(readFileSync(join(SERVER, 'src', 'sync.ts'), 'utf8')) && !/function wordCount/.test(readFileSync(join(SERVER, 'src', 'sync.ts'), 'utf8')), '');

const oldCount = (t) => { const s = t.trim(); return s ? s.split(/\s+/).length : 0; };
const both = CORPUS[1];
ok('W5 (instrument): the OLD counter miscounts the face+size span (the checks bite)', oldCount(both[0]) !== oldCount(both[1]), `${oldCount(both[0])} vs ${oldCount(both[1])}`);
ok('W3 (instrument): the pattern bites on the old shape it hunts', RAW.test('return t ? t.split(/' + BS + 's+/).length : 0;'), '');

console.log(`\nPOLISH10-WORDCOUNT VERIFY: ${failed ? 'FAIL' : 'PASS'} - ${total - failed}/${total}`);
process.exit(failed ? 1 : 0);

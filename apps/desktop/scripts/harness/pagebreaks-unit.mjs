// pagebreaks-unit.mjs - BROWSERLESS pins for the pure half of page breaks (src/store/pageBreaks.ts; Fable, Nov 19: "C1-C9 plus the Wrizors' new
// pair check", the walk ACCEPTED as C1's reference). No browser, no box turn.
//   U1  PAGE_TEXT_H is the letter page's text height: 11in less .85in top and bottom at 620/8.5 px a page-inch (678.35 px).
//   U2  the walk on hand-built rows: whole lines while their pitches fit; the break is the first character of the first line that does not fit.
//   U3  a row that is a whole page and more breaks inside itself at its line starts, page after page.
//   U4  a line exactly filling the page fits (the line box rule); one hair over does not.
//   U5  pageAt: 1 + the breaks at or before the offset (a caret ON a break is on the new page).
//   U6  the one list never stores: the module writes no storage (no localStorage / sessionStorage / indexedDB / saveJournalEntry in its source).
//   MUT1 the walk counting from the window's height (a page of 900 px) - U2 must go red.
//   MUT2 pageAt off by one (breaks strictly before) - U5 must go red.
// Run: node apps/desktop/scripts/harness/pagebreaks-unit.mjs  ->  "PAGEBREAKS-UNIT VERIFY: PASS (n checks)" or FAIL.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src', 'store', 'pageBreaks.ts');
const SCALE = path.join(DESKTOP, 'src', 'store', 'pageScale.ts');
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); };

const require = createRequire(path.join(DESKTOP, 'package.json'));
const { transform } = createRequire(require.resolve('vite'))('esbuild');
let nonce = 0;
const toUrl = async (src) => { const out = await transform(src.replace(/\r\n?/g, '\n'), { loader: 'ts', format: 'esm' }); nonce += 1; return 'data:text/javascript;base64,' + Buffer.from(`${out.code}\n// load ${nonce}`).toString('base64'); };
const scaleUrl = await toUrl(fs.readFileSync(SCALE, 'utf8'));
const load = async (src) => import(await toUrl(src.replace("from './pageScale'", `from '${scaleUrl}'`)));

const src = fs.readFileSync(SRC, 'utf8').replace(/\r\n?/g, '\n');   // the mutants match LF, whatever the checkout's line ends
const judge = (M) => {
  const out = {};
  out.u1 = Math.abs(M.PAGE_TEXT_H - 678.3513) < 0.01;
  // rows of a 27.2 px pitch: 10 rows of 2 lines (544 px) then a row of 3 lines: 1.5 more lines fit -> the break is that row's 2nd line start
  const pitch = 27.2;
  const units = [];
  let base = 0;
  for (let i = 0; i < 10; i++) { units.push({ h: 2 * pitch, n: 2, starts: [0, 50], base }); base += 101; }
  units.push({ h: 3 * pitch, n: 3, starts: [0, 40, 80], base }); base += 121;
  units.push({ h: pitch, n: 1, starts: [0], base });
  const br = M.walkLines(units, M.PAGE_TEXT_H);
  // 544 + 4 * 27.2 = 652.8 <= 678.35, a 5th line = 680 > H: so 24 lines on page 1; row 10 (3 lines) gives 4 of its... it has 3, so all 3 fit (544+81.6=625.6), row 11 fits (652.8)
  out.u2 = br.length === 0;
  out.u2detail = JSON.stringify(br);
  // 30 rows of 1 line: 24 fit (652.8), the 25th line ends at 680 > 678.35, so page 2 starts at row 24
  const one = Array.from({ length: 30 }, (_, i) => ({ h: pitch, n: 1, starts: [0], base: i * 10 }));
  const b1 = M.walkLines(one, M.PAGE_TEXT_H);
  out.u2b = b1.length === 1 && b1[0] === 240;
  out.u2bdetail = JSON.stringify(b1);
  // a row of 60 lines: breaks at its 24th and 48th line starts
  const big = [{ h: 60 * pitch, n: 60, starts: Array.from({ length: 60 }, (_, k) => k * 7), base: 1000 }];
  const b2 = M.walkLines(big, M.PAGE_TEXT_H);
  out.u3 = b2.length === 2 && b2[0] === 1000 + 24 * 7 && b2[1] === 1000 + 48 * 7;
  out.u3detail = JSON.stringify(b2);
  // a page of exactly H holds; H + a hair does not
  const exact = [{ h: 100, n: 1, starts: [0], base: 0 }, { h: 100, n: 1, starts: [0], base: 5 }];
  out.u4 = M.walkLines(exact, 200).length === 0 && M.walkLines(exact, 199.99).length === 1;
  out.u5 = M.pageAt([10, 20], 0) === 1 && M.pageAt([10, 20], 9) === 1 && M.pageAt([10, 20], 10) === 2 && M.pageAt([10, 20], 25) === 3 && M.pageAt([], 99) === 1;
  return out;
};

const real = judge(await load(src));
ok('U1 PAGE_TEXT_H = 11in less 2 x .85in at 620/8.5 px', real.u1);
ok('U2 rows that fit stay on page 1 (no break)', real.u2, real.u2detail);
ok('U2b 30 one-line rows break at the 25th line (24 x 27.2 = 652.8 fits, 680 does not)', real.u2b, real.u2bdetail);
ok('U3 a row longer than a page breaks at its own line starts', real.u3, real.u3detail);
ok('U4 a line box exactly filling the page fits; a hair over does not', real.u4);
ok('U5 pageAt = 1 + breaks at or before the offset', real.u5);
ok('U6 the module stores nothing', !/localStorage|sessionStorage|indexedDB|saveJournalEntry|scheduleFlush/.test(src));

// the mutants, in memory (the file untouched); each must LAND (the source changed) and be CAUGHT
const mut = (name, from, to, key) => async () => {
  const m = src.replace(from, to);
  const landed = m !== src;
  const r = landed ? judge(await load(m)) : null;
  ok(`${name}: landed`, landed);
  ok(`${name}: caught (${key} red)`, r && !r[key]);
};
await mut('MUT1 the walk takes the window height (900 px)', 'export function walkLines(units: LineUnit[], H: number = PAGE_TEXT_H): number[] {\n  const br: number[] = [];',
  'export function walkLines(units: LineUnit[], H: number = PAGE_TEXT_H): number[] {\n  H = 900;\n  const br: number[] = [];', 'u2b')();
await mut('MUT2 pageAt counts breaks strictly before', 'if (breaks[m] <= offset) lo = m + 1;', 'if (breaks[m] < offset) lo = m + 1;', 'u5')();

const passed = results.filter((r) => r.pass).length;
console.log(passed === results.length ? `\nPAGEBREAKS-UNIT VERIFY: PASS (${results.length} checks)` : `\nPAGEBREAKS-UNIT VERIFY: FAIL - ${results.length - passed}/${results.length} failed`);
process.exit(passed === results.length ? 0 : 1);

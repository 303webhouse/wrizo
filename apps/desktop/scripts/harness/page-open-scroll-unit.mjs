// BROWSERLESS CHECK for WHERE A PAGE RESTS WHEN IT OPENS (Fable, Nov 21, 6:54 pm: the first line cut by the scroller's edge at 1366; src/store/caretInView.ts restingScroll, the one pure rule openCaret applies). The
// browser half is page-open-scroll.mjs; this proves the rule over numbers, and shows it can fail (three mutants).
//   U0  the module exports restingScroll and openCaret
//   U1  nothing to scroll for (the caret's line already shows, or the page cannot scroll) rests at the top
//   U2  THE BUG'S CASE: the page overflows by 13 px and the caret's line needs 25 px: the only place a line begins that the page can reach is its top, so it rests at 0 - the first line whole - never 13
//   U3  a long page rests on the smallest line start at or beyond what the caret needs (never short of it, never mid-line): need 100 over lines starting 0, 29, 58, 87, 116 rests at 116
//   U4  a page that cannot reach a line start beyond what the caret needs rests on the farthest line start it can reach: need 40, most 45, lines at 29 and 58: 29
//   U5  the result is always 0 or a line start, and never beyond the most the page can scroll (a sweep of need, max and line starts)
//   MUT1  scrolling by exactly what is needed (mid-line): U3 goes RED
//   MUT2  no fallback to the farthest reachable line start (the top instead): U4 goes RED
//   MUT3  the reach limit removed (a line start beyond what the page can scroll): U2 goes RED
// RED on the tree without restingScroll. Run (from apps/desktop): node scripts/harness/page-open-scroll-unit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(here, '..', '..', 'src', 'store', 'caretInView.ts');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${detail}]` : ''}`); if (!cond) fails += 1; };

async function load(source) {
  const out = await esbuild.build({ stdin: { contents: source, loader: 'ts', resolveDir: path.dirname(FILE), sourcefile: 'caretInView.ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
}
const src = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const mutate = (from, to) => { if (!src.includes(from)) throw new Error(`mutant anchor missing: ${from.slice(0, 60)}`); return src.replace(from, to); };

function suite(M) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  keep('U0', typeof M.restingScroll === 'function' && typeof M.openCaret === 'function');
  if (typeof M.restingScroll !== 'function') return r;
  const f = M.restingScroll;
  keep('U1', f(0, 500, [0, 29, 58]) === 0 && f(-5, 500, [29]) === 0 && f(30, 0, [29]) === 0, JSON.stringify([f(0, 500, [0, 29, 58]), f(-5, 500, [29]), f(30, 0, [29])]));
  keep('U2', f(25, 13, [29, 58]) === 0, String(f(25, 13, [29, 58])));
  keep('U3', f(100, 600, [0, 29, 58, 87, 116, 145]) === 116, String(f(100, 600, [0, 29, 58, 87, 116, 145])));
  keep('U4', f(40, 45, [29, 58]) === 29, String(f(40, 45, [29, 58])));
  let bad = null;
  for (let need = 0; need <= 120 && !bad; need += 7) for (let max = 0; max <= 130 && !bad; max += 11) for (const offs of [[], [29], [29, 58, 87], [0, 20, 40, 60, 80, 100, 120]]) {
    const v = f(need, max, offs);
    if (!(v === 0 || offs.includes(v)) || v > Math.max(0, max)) bad = { need, max, offs, v };
  }
  keep('U5', bad === null, JSON.stringify(bad));
  return r;
}

const real = suite(await load(src));
const WORDS = {
  U0: 'the module exports restingScroll and openCaret',
  U1: 'nothing to scroll for (or a page that cannot scroll) rests at the top',
  U2: 'the bug\'s case: 13 px of overflow and a caret line that needs 25: the page rests at 0, the first line whole, never at 13',
  U3: 'a long page rests on the smallest line start at or beyond what the caret needs (never mid-line)',
  U4: 'a page that cannot reach such a line start rests on the farthest line start it can reach',
  U5: 'the result is always 0 or a line start and never beyond the most the page can scroll (a sweep)',
};
for (const k of Object.keys(WORDS)) ok(!!real[k] && real[k].pass, `${k} ${WORDS[k]}`, real[k] && real[k].detail);

if (typeof (await load(src)).restingScroll === 'function') {
  for (const [name, code, red] of [
    ['MUT1 scrolling by exactly what is needed (mid-line)', mutate('return enough !== undefined ? enough : reach[reach.length - 1];', 'return need;'), 'U3'],
    ['MUT2 no fallback to the farthest reachable line start (the top instead)', mutate('return enough !== undefined ? enough : reach[reach.length - 1];', 'return enough !== undefined ? enough : 0;'), 'U4'],
    ['MUT3 the reach limit removed', mutate('o >= 0 && o <= max', 'o >= 0'), 'U2'],
  ]) {
    let m;
    try { m = suite(await load(code)); } catch (e) { ok(false, `${name}: the mutant did not build`, String(e && e.message).slice(0, 140)); continue; }
    ok(m[red] && m[red].pass === false, `${name}: ${red} goes RED (the rule can fail)`, m[red] && m[red].detail);
  }
}
console.log(fails ? `\nPAGE-OPEN-SCROLL-UNIT VERIFY: FAIL - ${fails}/${checks} failed` : `\nPAGE-OPEN-SCROLL-UNIT VERIFY: PASS (${checks} checks)`);
process.exit(fails ? 1 : 0);

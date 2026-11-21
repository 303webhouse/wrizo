// BROWSERLESS CHECK for THE FEEDBACK LENS FRAME'S RULES (Fable, Nov 20, 11:15 pm: "your §3b item 1, the FEEDBACK lens rebuild (Structure / Tone / Consistency, <=3 prompts each, plus Ask Your Own; EDIT adds
// Usage / Punctuation / Citations above them). Build the frame now; the Wrizors draft the prompts' words for Nick's yes, and you drop them in when ruled." Nick's F2/F3, machina-stage-menus-decide.md).
// The frame's rules are a pure function over a table (reorg/backMenu/feedbackLenses.ts): which lenses a stage shows, in what order, and how many prompts each may open to. The table holds only RULED
// words (Structure's three and Consistency's two today); a lens with no ruled prompt is not drawn, so the frame never shows an empty promise. This file runs the REAL module (bundled with esbuild) over a
// FULL table of dummy words, so every rule is proved before the words arrive.
//   U1  BUILD shows Structure, Tone, Consistency, in that order
//   U2  EDIT shows Usage, Punctuation, Citations ABOVE Structure, Tone, Consistency (six, in that order)
//   U3  a lens opens to AT MOST THREE prompts: a table row of five yields three (the first three, in order)
//   U4  a lens with no prompt in the table is not drawn (BUILD with Tone empty shows Structure and Consistency only)
//   U5  SPRINT has no lens (it keeps its one writing prompt) and FINALIZE-less stages return nothing
//   U6  the shipped table holds only words that exist in the lexicon, and no row has more than three
//   MUT1 the cap removed: U3 goes RED
//   MUT2 EDIT's three extra lenses placed BELOW: U2 goes RED
//   MUT3 empty lenses drawn: U4 goes RED
// RED on the tree without src/reorg/backMenu/feedbackLenses.ts. Run (from apps/desktop): node scripts/harness/reorg-feedback-lenses-unit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const FILE = path.join(SRC, 'reorg/backMenu/feedbackLenses.ts');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${detail}]` : ''}`); if (!cond) fails += 1; };

if (!fs.existsSync(FILE)) {
  console.log('INFO tree: reorg/backMenu/feedbackLenses.ts ABSENT');
  ok(false, 'U1..U6 the lens frame exists (src/reorg/backMenu/feedbackLenses.ts)');
  console.log(`\nREORG-FEEDBACK-LENSES-UNIT VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(1);
}

async function load(source) {
  const out = await esbuild.build({ stdin: { contents: source, loader: 'ts', resolveDir: path.dirname(FILE), sourcefile: 'feedbackLenses.ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  const text = out.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`);
}
const src = fs.readFileSync(FILE, 'utf8');
const mutate = (from, to) => { if (!src.includes(from)) throw new Error(`mutant anchor missing: ${from.slice(0, 60)}`); return src.replace(from, to); };
const FULL = { structure: ['s1', 's2', 's3'], tone: ['t1', 't2', 't3'], consistency: ['c1', 'c2', 'c3'], usage: ['u1', 'u2', 'u3'], punctuation: ['p1', 'p2', 'p3'], citations: ['i1', 'i2', 'i3'] };
const ids = (r) => (r || []).map((l) => l.id).join(',');

const M = await load(src);
ok(typeof M.lensRoster === 'function' && typeof M.LENS_PROMPTS === 'object' && M.LENS_MAX === 3, 'U0 the module exports lensRoster, LENS_PROMPTS and LENS_MAX = 3');
ok(ids(M.lensRoster('build', FULL)) === 'structure,tone,consistency', 'U1 BUILD shows Structure, Tone, Consistency, in that order', ids(M.lensRoster('build', FULL)));
ok(ids(M.lensRoster('edit', FULL)) === 'usage,punctuation,citations,structure,tone,consistency', 'U2 EDIT shows Usage, Punctuation, Citations above Structure, Tone, Consistency', ids(M.lensRoster('edit', FULL)));
const five = M.lensRoster('build', { ...FULL, structure: ['a', 'b', 'c', 'd', 'e'] }).find((l) => l.id === 'structure');
ok(!!five && five.prompts.join() === 'a,b,c', 'U3 a lens opens to at most three prompts (a row of five yields the first three)', five && five.prompts.join());
ok(ids(M.lensRoster('build', { ...FULL, tone: [] })) === 'structure,consistency', 'U4 a lens with no prompt is not drawn', ids(M.lensRoster('build', { ...FULL, tone: [] })));
ok(M.lensRoster('sprint', FULL).length === 0 && M.lensRoster('final', FULL).length === 0, 'U5 SPRINT and any other stage have no lens');
const lex = fs.readFileSync(path.join(SRC, 'store/lexicon/canonical/chrome.ts'), 'utf8');
const shipped = Object.values(M.LENS_PROMPTS).flat();
ok(shipped.length > 0 && shipped.every((k) => new RegExp(`\\b${k}:`).test(lex)) && Object.values(M.LENS_PROMPTS).every((r) => r.length <= 3), 'U6 the shipped table holds only lexicon words, at most three per lens', shipped.join());

const m1 = await load(mutate('.slice(0, LENS_MAX)', ''));
ok(m1.lensRoster('build', { ...FULL, structure: ['a', 'b', 'c', 'd', 'e'] }).find((l) => l.id === 'structure').prompts.length !== 3, 'MUT1 the cap removed: U3 goes RED');
const m2 = await load(mutate("stage === 'edit' ? [...EDIT_ONLY, ...BOTH] : BOTH", "stage === 'edit' ? [...BOTH, ...EDIT_ONLY] : BOTH"));
ok(ids(m2.lensRoster('edit', FULL)) !== 'usage,punctuation,citations,structure,tone,consistency', 'MUT2 EDIT\'s three extra lenses placed below: U2 goes RED');
const m3 = await load(mutate('.filter((l) => l.prompts.length > 0)', ''));
ok(ids(m3.lensRoster('build', { ...FULL, tone: [] })) !== 'structure,consistency', 'MUT3 empty lenses drawn: U4 goes RED');

console.log(fails === 0 ? `\nREORG-FEEDBACK-LENSES-UNIT VERIFY: PASS (${checks} checks)` : `\nREORG-FEEDBACK-LENSES-UNIT VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);

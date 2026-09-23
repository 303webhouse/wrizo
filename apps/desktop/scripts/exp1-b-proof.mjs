// EXPERIMENT 1 (b) — THE EQUIVALENCE PROOF.
//
// Fable's condition for approving the one-stripper refactor:
//   "ONE position-preserving stripper, with stripMarkdownConventions as its
//    wrapper, proven byte-identical to today's output over a fixed corpus that
//    exercises every rule. Export the paragraph enumerator and have indent use
//    it too, proven unchanged."
//
// So this script proves three things:
//   1. visibleText().text === the ORIGINAL chain, byte for byte.
//   2. indent/outdent's paragraph scope is UNCHANGED after being rewired onto
//      the exported enumerator.
//   3. the index map is sound — it only ever deletes, it is strictly
//      increasing, and every visible character maps back to the identical raw
//      character.
//
// ⛔ HOW THE "ORIGINAL" IS OBTAINED, AND WHY IT IS NOT COPY-PASTED. Hand-copying
// the old implementation into a test is how a proof comes to test the typo
// rather than the code. Instead the pre-change file is read from git
// (`git show <base>:<path>`), transpiled with the real TypeScript compiler, and
// imported. `draftFormat.ts` has NO imports, which is what makes that exact.
//
// Browserless. No box turn, no harness, no browser.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const REL = 'apps/desktop/src/store/draftFormat.ts';
const BASE = process.env.EXP1_PROOF_BASE || 'origin/main';

const require = createRequire(join(repo, 'apps/server/package.json'));
const ts = require('typescript');

const tmp = join(here, '.exp1-b-proof');
mkdirSync(tmp, { recursive: true });

function transpileToModule(tsSource, name) {
  const js = ts.transpileModule(tsSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  }).outputText;
  const p = join(tmp, name);
  writeFileSync(p, js, 'utf8');
  return pathToFileURL(p).href;
}

const originalSrc = execFileSync('git', ['show', `${BASE}:${REL}`], {
  cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
});
const currentSrc = readFileSync(join(repo, REL), 'utf8');

const original = await import(transpileToModule(originalSrc, 'original.mjs'));
const current = await import(transpileToModule(currentSrc, 'current.mjs'));

// --- the corpus: every rule, and every rule's interaction ----------------
// Named so a failure says WHICH rule broke, not merely that something did.
const CASES = {
  'empty': '',
  'plain': 'just some words',
  'h1': '# A heading',
  'h2': '## A subheading',
  'h1 no space': '#nospace',
  'h1 many spaces': '#   spaced out',
  'h1 tab after hash': '#\ttabbed',
  'h3 is not stripped': '### three hashes',
  'align centre': '>< centred line',
  'align right': '>> right line',
  'quote': '> quoted line',
  // THE ORDER TRAP the original comment names: alignment must strip before the
  // bare quote mark, or `< ` / `> ` is left behind as visible litter.
  'align vs quote litter': '>< centred\n>> righted\n> quoted',
  'bullet': '- a bullet',
  'one tab': '\tindented',
  'many tabs': '\t\t\tdeeply indented',
  'quote then tab': '> \tquote then tab',
  'bullet then tab': '- \tbullet then tab',
  'tab then bullet': '\t- tab before bullet',
  'all prefixes stacked': '## > \there',
  'bold': 'a **bold** word',
  'italic': 'an *italic* word',
  'underline': 'an __underlined__ word',
  'bold inside italic': '*outer **inner** outer*',
  'italic inside bold': '**outer *inner* outer**',
  'underline beside bold': '**b** and __u__ and *i*',
  'unclosed bold': 'a **dangling mark',
  'unclosed italic': 'a *dangling mark',
  'empty bold': 'a **** b',
  'triple star': '***both***',
  'bold across lines': 'start **spans\nthe line** end',
  'marks with prefixes': '## **bold heading**\n- *bullet italic*',
  'blank lines': 'para one\n\npara two\n\n\npara three',
  'trailing newline': 'words\n',
  'leading newline': '\nwords',
  'only newlines': '\n\n\n',
  'whitespace-only line': 'a\n   \nb',
  'tab-only line': 'a\n\t\nb',
  'crlf-ish': 'a\r\nb',
  'unicode': 'café **naïve** 日本語 *emoji 🙂*',
  'stars in prose': '2 * 3 * 4 = 24',
  'underscores in prose': 'snake_case_name here',
  'markdown-looking table': '| a | b |\n| - | - |',
  'the real thing': [
    '# Chapter One',
    '',
    '\tThe **rain** fell on the *quiet* street, and __nothing__ moved.',
    '\tA second line of the same paragraph.',
    '',
    '> He said it was over.',
    '>< A centred stage direction',
    '',
    '- one',
    '- two',
  ].join('\n'),
};

// A little fuzzing on top of the fixed corpus. The corpus is what Fable asked
// for; the fuzz is extra, and it is reported separately so the two are not
// confused.
function fuzz(n, seed = 20260924) {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const atoms = ['# ', '## ', '### ', '> ', '>< ', '>> ', '- ', '\t', '**', '*', '__',
                 'word', ' ', '\n', '\n\n', 'a', 'x y', '🙂'];
  const out = [];
  for (let i = 0; i < n; i++) {
    let t = '';
    const len = 1 + Math.floor(rnd() * 14);
    for (let j = 0; j < len; j++) t += atoms[Math.floor(rnd() * atoms.length)];
    out.push(t);
  }
  return out;
}

let failures = 0;
const fail = (what, detail) => { failures++; console.log(`  FAIL ${what}\n       ${detail}`); };

// --- claim 1 · byte-identical stripping ---------------------------------
console.log('CLAIM 1 — visibleText().text === the original chain, byte for byte');
{
  let checked = 0;
  for (const [name, input] of Object.entries(CASES)) {
    const want = original.stripMarkdownConventions(input);
    const got = current.stripMarkdownConventions(input);
    const gotDirect = current.visibleText(input).text;
    if (got !== want) fail(`corpus "${name}"`, `want ${JSON.stringify(want)}\n       got  ${JSON.stringify(got)}`);
    else if (gotDirect !== want) fail(`corpus "${name}" (visibleText vs wrapper)`, 'wrapper and visibleText disagree');
    else checked++;
  }
  console.log(`  corpus: ${checked}/${Object.keys(CASES).length} identical`);

  const inputs = fuzz(4000);
  let bad = 0;
  for (const input of inputs) {
    if (current.stripMarkdownConventions(input) !== original.stripMarkdownConventions(input)) {
      if (bad === 0) fail('fuzz', JSON.stringify(input));
      bad++;
    }
  }
  console.log(`  fuzz:   ${inputs.length - bad}/${inputs.length} identical`);
}

// --- claim 2 · the index map is sound -----------------------------------
console.log('CLAIM 2 — the index map only deletes, is strictly increasing, and round-trips');
{
  let checked = 0;
  for (const [name, input] of Object.entries(CASES).concat(fuzz(800).map((t, i) => [`fuzz${i}`, t]))) {
    const v = current.visibleText(input);
    if (v.map.length !== v.text.length + 1) { fail(`map length "${name}"`, `${v.map.length} != ${v.text.length + 1}`); continue; }
    let ok = true;
    for (let i = 1; i < v.map.length; i++) {
      if (v.map[i] <= v.map[i - 1]) { fail(`map not increasing "${name}"`, `at ${i}`); ok = false; break; }
    }
    if (!ok) continue;
    if (v.map[v.text.length] !== input.length) { fail(`map tail "${name}"`, `${v.map[v.text.length]} != ${input.length}`); continue; }
    // every visible character IS the raw character it points at
    for (let i = 0; i < v.text.length; i++) {
      if (input[v.map[i]] !== v.text[i]) { fail(`map char "${name}"`, `visible ${i}`); ok = false; break; }
    }
    if (!ok) continue;
    // toRawRange never runs past the raw text and never inverts
    for (let a = 0; a <= v.text.length; a++) {
      for (let b = a; b <= v.text.length; b++) {
        const [r0, r1] = current.toRawRange(v, a, b);
        if (r0 > r1 || r1 > input.length) { fail(`toRawRange "${name}"`, `[${a},${b}) -> [${r0},${r1})`); ok = false; break; }
      }
      if (!ok) break;
    }
    if (ok) checked++;
  }
  console.log(`  sound on ${checked} inputs`);
}

// --- claim 3 · indent/outdent's paragraph scope is unchanged ------------
// Proven through the PUBLIC behaviour, because `paragraphScope` is private:
// indentParagraphs/outdentParagraphs ARE the scope, observably.
console.log('CLAIM 3 — indent/outdent unchanged after rewiring onto the exported enumerator');
{
  // `indentParagraphs`/`outdentParagraphs` are PRIVATE — they are reached through
  // `applyFormat(text, selStart, selEnd, action)`, which is the real public seam
  // and therefore the honest thing to compare. (The first version of this proof
  // looked for exports named indent*/outdent*, found none, and said so instead
  // of passing — which is the only reason this is being compared correctly now.)
  const ACTIONS = ['indent', 'outdent'];
  if (typeof original.applyFormat !== 'function') fail('claim 3', 'applyFormat not exported — cannot compare');
  let compared = 0;
  const texts = Object.values(CASES).concat(fuzz(400, 777));
  for (const action of ACTIONS) {
    const fn = action;
    const callOriginal = (t, a, b) => original.applyFormat(t, a, b, action);
    const callCurrent = (t, a, b) => current.applyFormat(t, a, b, action);
    for (const text of texts) {
      for (let a = 0; a <= text.length; a++) {
        for (let b = a; b <= text.length; b++) {
          let want, got;
          try { want = JSON.stringify(callOriginal(text, a, b)); } catch (e) { want = 'throw:' + e.message; }
          try { got = JSON.stringify(callCurrent(text, a, b)); } catch (e) { got = 'throw:' + e.message; }
          if (want !== got) {
            fail(`${fn} on ${JSON.stringify(text.slice(0, 40))} [${a},${b})`,
                 `want ${want}\n       got  ${got}`);
            a = text.length + 1; b = text.length + 1;
          } else compared++;
        }
      }
    }
    console.log(`  ${fn}: ${compared} (text, selStart, selEnd) triples identical`);
    compared = 0;
  }
}

// --- claim 4 · the enumerator agrees with the definition ----------------
console.log('CLAIM 4 — paragraphRanges is exactly "runs of consecutive non-blank lines"');
{
  let checked = 0;
  for (const text of Object.values(CASES).concat(fuzz(500, 31337))) {
    const lines = text.split('\n');
    const expect = [];
    let i = 0;
    while (i < lines.length) {
      if (lines[i].trim().length === 0) { i++; continue; }
      const s = i;
      while (i + 1 < lines.length && lines[i + 1].trim().length > 0) i++;
      expect.push([s, i]);
      i++;
    }
    const got = current.paragraphRanges(text).map(p => [p.startLine, p.endLine]);
    if (JSON.stringify(got) !== JSON.stringify(expect)) {
      fail('paragraphRanges', `${JSON.stringify(text.slice(0, 40))}\n       want ${JSON.stringify(expect)} got ${JSON.stringify(got)}`);
      continue;
    }
    // the char offsets must actually bracket the paragraph's own text
    let ok = true;
    for (const p of current.paragraphRanges(text)) {
      const slice = text.slice(p.start, p.end);
      if (slice !== lines.slice(p.startLine, p.endLine + 1).join('\n')) {
        fail('paragraphRanges offsets', JSON.stringify(slice)); ok = false; break;
      }
    }
    if (ok) checked++;
  }
  console.log(`  agrees on ${checked} inputs`);
}

console.log('\n' + (failures === 0
  ? 'EXP1 (b) PROOF: CLEAN — all four claims hold'
  : `EXP1 (b) PROOF: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);

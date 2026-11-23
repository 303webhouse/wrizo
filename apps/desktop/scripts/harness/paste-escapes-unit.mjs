// BROWSERLESS CHECK for PASTE ESCAPES (Fable, Nov 21, 4:58 pm; reorg-plan-v2 section 5: "Paste escapes `^` and `~` (and the other marker characters) unless the paste comes from Wrizo itself, so pasted `x^2 + y^2`
// stays plain (Nov 20, with Sup/Sub)"). Typed-literal (Nick, Oct 16) already stores a typed or pasted `\ * _ ~ [ ]` escaped, and the reader already reads `\^` as text (markRuns ESCAPABLE); the Sup mark's own
// character `^` was the one marker left out of escapeTyped's list, so a pasted `x^2 + y^2` read as a superscript. This bundles the REAL modules (esbuild) and checks:
//   PE1  a paste of `x^2 + y^2` from another app is stored with its carets escaped and READS as plain text: no superscript run, the same words shown, the same word count
//   PE2  every other marker character is escaped on a paste too (`~` the Sub mark, `*`, `_`, `[`, `]`, `\`) and makes no run
//   PE3  a paste FROM WRIZO keeps its formatting: copy `x^2^ y` (a real superscript) in Wrizo, paste it back: formatted, and the superscript is still a run
//   PE4  a TYPED caret is literal too (typed-literal: what is typed, pasted or composed is literal), and the Sup / Sub buttons still write the real marks (the formatter is not escaped)
//   MUT1 `^` taken out of escapeTyped's list: PE1 goes RED
//   MUT2 the Wrizo fragment ignored by the paste (every paste literal): PE3 goes RED
// RED on the tree before the fix. Run (from apps/desktop): node scripts/harness/paste-escapes-unit.mjs   (no browser, no box turn)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${detail}]` : ''}`); if (!cond) fails += 1; };
const B = String.fromCharCode(92);   // one backslash, built rather than escaped

// one bundle of the store modules, optionally with one source edit (a mutant): the edit is applied to the file by an esbuild plugin that reads it from disk
async function load(edits = {}) {
  const entry = ['markRuns', 'hiddenMarks', 'clipboardFormat', 'draftFormat'].map((m) => `export * as ${m} from './store/${m}.ts';`).join('\n');
  const plugin = {
    name: 'edit',
    setup(b) {
      b.onLoad({ filter: /store[\\/](hiddenMarks|clipboardFormat)\.ts$/ }, (a) => {
        let t = fs.readFileSync(a.path, 'utf8');
        for (const [file, from, to] of edits[path.basename(a.path)] || []) { if (!t.includes(from)) throw new Error(`mutant anchor missing in ${file}: ${from.slice(0, 50)}`); t = t.replace(from, to); }
        return { contents: t, loader: 'ts', resolveDir: path.dirname(a.path) };
      });
    },
  };
  const out = await esbuild.build({ stdin: { contents: entry, loader: 'ts', resolveDir: SRC, sourcefile: 'entry.ts' }, bundle: true, write: false, format: 'esm', platform: 'neutral', logLevel: 'silent', plugins: [plugin], external: ['@fontsource/*', '@fontsource-variable/*'], mainFields: ['module', 'main'] });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
}

function suite(M) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  const { markRuns: mr, hiddenMarks: hm, clipboardFormat: cf, draftFormat: df } = M;
  const plain = 'x^2 + y^2';
  const p1 = cf.pasteEdit('', 0, 0, null, plain);
  const runs1 = mr.readMarks(mr.readLead(p1.text) ? p1.text.slice(mr.readLead(p1.text).length) : p1.text);
  keep('PE1', p1.text === `x${B}^2 + y${B}^2` && runs1.length === 0 && mr.stripLine(p1.text) === plain && mr.unescapeTyped(p1.text) === plain, JSON.stringify({ text: p1.text, runs: runs1.length }));
  const others = ['H~2~O', 'a*b*c', 'a_b_c', '[x]{.font-lora}', 'path' + B + 'to'];
  const bad = others.filter((s) => { const t = cf.pasteEdit('', 0, 0, null, s).text; return mr.readMarks(t).length !== 0 || mr.stripLine(t) !== s; });
  keep('PE2', bad.length === 0, JSON.stringify(bad));
  const own = 'x^2^ y';
  const copied = cf.copyPayload(own, 0, own.length);
  const back = cf.pasteEdit('', 0, 0, copied.fragment, copied.plain);
  keep('PE3', back.formatted === true && mr.readMarks(back.text).some((x) => x.kind === 'sup'), JSON.stringify({ formatted: back.formatted, text: back.text, kinds: mr.readMarks(back.text).map((x) => x.kind) }));
  const typed = hm.escapeTyped('^', '', 0);
  const sup = df.applyFormat('ab', 0, 2, 'sup').text;
  const sub = df.applyFormat('ab', 0, 2, 'sub').text;
  keep('PE4', typed === `${B}^` && sup === '^ab^' && sub === '~ab~', JSON.stringify({ typed, sup, sub }));
  return r;
}

const real = suite(await load());
const WORDS = {
  PE1: 'a paste of x^2 + y^2 from another app is stored with its carets escaped and reads as plain text (no run; same words, same count)',
  PE2: 'every other marker character is escaped on a paste too and makes no run (~ * _ [ ] and a backslash)',
  PE3: 'a paste FROM WRIZO keeps its formatting: a copied superscript pastes back as a superscript run',
  PE4: 'a typed caret is literal too, and the Sup / Sub buttons still write the real marks',
};
for (const k of Object.keys(WORDS)) ok(real[k].pass, `${k} ${WORDS[k]}`, real[k].detail);

// the mutants are real source edits, applied through the bundler: the escape list's caret, and pasteEdit's use of the fragment
for (const [name, edits, red] of [
  ['MUT1 caret out of escapeTyped list', { 'hiddenMarks.ts': [['hiddenMarks.ts', "c === '^' || ", '']] }, 'PE1'],
  ['MUT2 the Wrizo fragment ignored by the paste', { 'clipboardFormat.ts': [['clipboardFormat.ts', 'if (fragment !== null) {', 'if (false) {']] }, 'PE3'],
]) {
  let m;
  try { m = suite(await load(edits)); } catch (e) { ok(false, `${name}: the mutant did not build`, String(e && e.message).slice(0, 160)); continue; }
  ok(m[red].pass === false, `${name}: ${red} goes RED (the rule can fail)`, m[red].detail.slice(0, 120));
}

console.log(fails ? `\nPASTE-ESCAPES-UNIT VERIFY: FAIL - ${fails}/${checks} failed` : `\nPASTE-ESCAPES-UNIT VERIFY: PASS (${checks} checks)`);
process.exit(fails ? 1 : 0);

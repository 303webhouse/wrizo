// REORG SUPERSCRIPT AND SUBSCRIPT, THE TEXT'S HALF, BROWSERLESS (reorg-plan-v2, INK queue item 2; Fable, Nov 20: "markers in the text like the rest (markRuns.ts): ^sup^ and ~sub~, read by the same rule that tells * from ** and ~ from ~~;
// Web export writes <sup>/<sub>; Markdown keeps the markers; Plain strips them; no new field"). No browser, no box: the real markRuns.ts, draftFormat.ts and publishingHtml.ts are transpiled and run; each law is given a mutant (a text
// rewrite of the source) that must LAND and turn its own check red.
//   READ    a lone ^ pair is a superscript, a lone ~ pair a subscript; the flanking rule that keeps "2 * 3 * 4" text keeps "a ^ b ^ c" and "a ~ b ~ c" text; ~~ is still strike, a typed \^ or \~ is only the character
//   FORMAT  the formatter wraps and unwraps with ^ and ~ (a selection, and a bare caret), marksAt lights Sup and Sub, and the other four styles are untouched
//   EXPORT  Web (HTML) writes <sup>/<sub> and no marker is left; Plain (stripLine) strips them; Markdown is the stored text, so the markers stay (nothing reads them out of it)
// Run: node scripts/harness/reorg-supsub-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (rel) => lf(fs.readFileSync(new URL(rel, import.meta.url), 'utf8'));
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
const SRC = { markRuns: rd('../../src/store/markRuns.ts'), draftFormat: rd('../../src/store/draftFormat.ts'), html: rd('../../src/reorg/publishingHtml.ts') };

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
function evalModule(src, req) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)(req, m, m.exports);
  return m.exports;
}
function load(srcs) {
  const MR = evalModule(srcs.markRuns, (p) => { throw new Error('unstubbed import ' + p); });
  const stub = (p) => { if (p === './markRuns' || p === '../store/markRuns') return MR; if (p === '../reorg/footnotes') return { insertNote: () => null }; throw new Error('unstubbed import ' + p); };
  return { MR, DF: evalModule(srcs.draftFormat, stub), HT: evalModule(srcs.html, stub) };
}

function suite(srcs) {
  const R = {};
  const { MR, DF, HT } = load(srcs);
  const runs = (line) => { try { return MR.readMarks(line).map((r) => [r.kind, r.open, r.close]); } catch (e) { return ['THREW ' + e.message]; } };
  const fmt = (text, s, e, a) => { try { return DF.applyFormat(text, s, e, a); } catch (err) { return { text: 'THREW ' + err.message, start: -1, end: -1 }; } };
  // READ
  {
    const a = runs('x^2^'), b = runs('H~2~O');
    const text = [runs('a ^ b ^ c'), runs('a ~ b ~ c'), runs('2 ~ 3'), runs('a~b'), runs('^x'), runs('~5 and ~10')];
    const strike = runs('~~gone~~'), both = runs('~~a~~ and ~b~'), nest = runs('**x^2^**');
    const esc = [runs('x\\^2\\^'), runs('\\~a\\~')];
    const empty = runs('a^^b');
    R.READ = { pass: false, detail: J({ a, b, text, strike, both, nest, esc, empty }) };
    R.READ.pass = J(a) === J([['sup', 1, 3]]) && J(b) === J([['sub', 1, 3]]) && text.every((t) => t.length === 0)
      && J(strike) === J([['strike', 0, 6]]) && both.length === 2 && both.some((r) => r[0] === 'strike') && both.some((r) => r[0] === 'sub')
      && nest.length === 2 && nest.some((r) => r[0] === 'bold') && nest.some((r) => r[0] === 'sup') && esc.every((t) => t.length === 0) && empty.length === 1 && empty[0][0] === 'sup';
  }
  // FORMAT
  {
    const w1 = fmt('x2', 1, 2, 'sup'), w2 = fmt('H2O', 1, 2, 'sub');
    const off1 = fmt('x^2^', 2, 3, 'sup'), off2 = fmt('H~2~O', 2, 3, 'sub');
    const bold = fmt('x^2^', 0, 4, 'bold');
    const cSup = fmt('ab', 1, 1, 'sup'), cSub = fmt('ab', 1, 1, 'sub');
    const at = [DF.marksAt('x^2^', 3), DF.marksAt('H~2~O', 3), DF.marksAt('plain', 2)];
    const stripped = MR.stripLine('x^2^ and H~2~O');
    const capSup = cSup.text === 'a^^b' ? runs(cSup.text).length === 1 : cSup.pending === '^';
    R.FORMAT = { pass: w1.text === 'x^2^' && w1.text.slice(w1.start, w1.end) === '2' && w2.text === 'H~2~O' && w2.text.slice(w2.start, w2.end) === '2'
      && off1.text === 'x2' && off2.text === 'H2O' && bold.text === '**x^2^**' && capSup && cSub.text === 'ab' && cSub.pending === '~'
      && at[0].sup === true && at[0].sub === false && at[1].sub === true && at[1].sup === false && at[2].sup === false && at[2].sub === false && at[0].bold === false
      && stripped === 'x2 and H2O', detail: J({ w1, w2, off1, off2, bold, cSup, cSub, at, stripped }) };
  }
  // EXPORT
  {
    const h = HT.markdownToHtml('x^2^ and H~2~O');
    const lit = HT.markdownToHtml('a ^ b ^ c');
    const keep = HT.markdownToHtml('~~gone~~ and **bold** and *it*');
    R.EXPORT = { pass: /<sup>2<\/sup>/.test(h) && /<sub>2<\/sub>/.test(h) && !/[\^~]/.test(h) && /a \^ b \^ c/.test(lit) && /<s>gone<\/s>/.test(keep) && /<strong>bold<\/strong>/.test(keep) && /<em>it<\/em>/.test(keep), detail: J({ h, lit, keep }) };
  }
  return R;
}

const base = suite(SRC);
for (const k of ['READ', 'FORMAT', 'EXPORT']) ok(`${k} on the real markRuns.ts, draftFormat.ts and publishingHtml.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

// the mutants: [name, the check it must turn red, the file it rewrites, the rewrite]
const MUT = [
  ['the reader stops looking at carets', 'READ', 'markRuns', (t) => t.replace("ch !== '~' && ch !== '^') continue;", () => "ch !== '~') continue;")],
  ['a closing marker needs no flanking (a ^ b ^ c becomes a run)', 'READ', 'markRuns', (t) => t.replace('canClose: pos > 0 && !isSpace(line[pos - 1])', () => 'canClose: pos > 0')],
  ['a lone tilde is no longer a subscript', 'READ', 'markRuns', (t) => t.replace("else if (n === 1 && ch === '~') push(ch, i, 1);", () => 'else if (false) push(ch, i, 1);')],
  ['a typed \\^ is no longer an escape', 'READ', 'markRuns', (t) => t.replace("'~', '^', '#'", () => "'~', '#'")],
  ['the formatter writes ~ for a superscript', 'FORMAT', 'markRuns', (t) => t.replace("sup: '^'", () => "sup: '~'")],
  ['the formatter no longer wraps a subscript', 'FORMAT', 'draftFormat', (t) => t.replace("if (action === 'sub') return toggleInline(text, start, end, FORMAT_MARK.sub);", () => '')],
  ['marksAt stops reporting a superscript', 'FORMAT', 'draftFormat', (t) => t.replace('sup: false, sub: false };\n  for (const r of readMarks', () => 'sub: false };\n  for (const r of readMarks')],
  ['the web export writes <b> for a superscript', 'EXPORT', 'html', (t) => t.replace("sup: '<sup>'", () => "sup: '<b>'")],
  ['the web export leaves a subscript marker in the words', 'EXPORT', 'html', (t) => t.replace("sub: '</sub>'", () => "sub: ''")],
];
for (const [name, key, file, fn] of MUT) {
  const srcs = { ...SRC };
  const after = fn(SRC[file]);
  const landed = after !== SRC[file];
  srcs[file] = after;
  let res = null, err = null;
  try { res = landed ? suite(srcs) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-SUPSUB-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-SUPSUB-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

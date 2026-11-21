// REORG THE P / H1 / H2 / H3 PICKER, THE FORMATTER'S HALF, BROWSERLESS (reorg-plan-v2, INK queue item 1: "The P / H1-H3 picker (heading levels in the editor)"; the stage menus: "a small Paragraph picker: P / H1 / H2 / H3 (Nick; quiet by default; for
// writers exporting to Substack or WordPress)"). No browser, no box: the real draftFormat.ts is transpiled and run; each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   SET     the picker SETS a level, it does not toggle: P takes the heading mark off, H1 to H3 put exactly that level on (a line already at it is left as it is; a line at 4 to 6 is brought to it)
//   LINES   it acts on every line the selection touches (a selection ending right after a line break leaves the next line alone), and leaves a line with no words in it alone
//   SHAPE   the structure in front of a heading mark stays (a quote, a bullet, a tab, an alignment), the mark goes where the one lead reader puts it, and no other byte of the text changes
//   CARET   the caret and the selection stay on the same words, whatever the mark added or took away
//   OLD     the old controls are untouched: H toggles ## on and off, + and - step between the six levels
// Run: node scripts/harness/reorg-heading-picker-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = new URL('../../src/store/draftFormat.ts', import.meta.url);
const lf = (s) => s.split('\r\n').join('\n');
const srcText = lf(fs.readFileSync(SRC, 'utf8'));
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
const MARKRUNS = (() => { const o = ts.transpileModule(lf(fs.readFileSync(new URL('../../src/store/markRuns.ts', import.meta.url), 'utf8')), TS_OPTS).outputText; const m = { exports: {} }; new Function('module', 'exports', o)(m, m.exports); return m.exports; })();

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { if (p === './markRuns') return MARKRUNS; if (p === '../reorg/footnotes') return { insertNote: () => null }; throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}

function suite(src) {
  const R = {};
  const F = load(src);
  const run = (text, s, e, action) => { try { return F.applyFormat(text, s, e, action); } catch (err) { return { text: 'THREW ' + err.message, start: -1, end: -1 }; } };
  // SET
  {
    const cases = [
      ['Hello world', 3, 3, 'h2', '## Hello world'],
      ['Hello world', 3, 3, 'h1', '# Hello world'],
      ['Hello world', 3, 3, 'h3', '### Hello world'],
      ['# One', 2, 2, 'h3', '### One'],
      ['### One', 5, 5, 'para', 'One'],
      ['###### Six', 4, 4, 'h1', '# Six'],
      ['## A', 3, 3, 'h2', '## A'],            // already there: set, not toggled
      ['Plain', 2, 2, 'para', 'Plain'],        // already a paragraph: nothing to take off
    ];
    const bad = cases.map(([t, s, e, a, want]) => [t, a, run(t, s, e, a).text, want]).filter(([, , got, want]) => got !== want);
    R.SET = { pass: bad.length === 0, detail: J(bad.slice(0, 3)) };
  }
  // LINES
  {
    const a = run('a\nb\nc', 0, 5, 'h1').text;                 // all three
    const b = run('a\nb\nc', 0, 3, 'h1').text;                 // the first two
    const c = run('a\nb\nc', 0, 2, 'h1').text;                 // ends right after the first line's break: the first line only
    const d = run('a\n\nb', 0, 4, 'h2').text;                  // the empty line is left alone
    const e = run('x\n## y\nz', 0, 8, 'para').text;            // a heading in the middle comes off, the others stay
    R.LINES = { pass: a === '# a\n# b\n# c' && b === '# a\n# b\nc' && c === '# a\nb\nc' && d === '## a\n\n## b' && e === 'x\ny\nz', detail: J({ a, b, c, d, e }) };
  }
  // SHAPE
  {
    const q = run('> quoted words', 4, 4, 'h2').text;
    const tb = run('\tindented', 3, 3, 'h1').text;
    const bl = run('- item here', 5, 5, 'h3').text;
    const al = run('>< centred', 4, 4, 'h2').text;
    const emoji = 'one \u{1F600} two\nline \u{1F680} end\nthree';
    const em = run(emoji, 0, emoji.length, 'h2').text;
    const keep = em === '## one \u{1F600} two\n## line \u{1F680} end\n## three' && em.replace(/^## /gm, '') === emoji;
    R.SHAPE = { pass: q === '> ## quoted words' && tb === '\t# indented' && bl === '- ### item here' && al === '>< ## centred' && keep, detail: J({ q, tb, bl, al, em }) };
  }
  // CARET
  {
    const a = run('Hello world', 6, 6, 'h2');                  // the caret before "world": 3 characters later
    const b = run('### Hello', 6, 6, 'para');                  // the mark comes off: the caret stays before "ello" -> 2
    const c = run('one\ntwo', 1, 5, 'h1');                     // a selection across two lines: both ends move with their own words
    R.CARET = { pass: a.start === 9 && a.end === 9 && b.start === 2 && b.end === 2 && c.text === '# one\n# two' && c.start === 3 && c.end === 9 && c.text.slice(c.start, c.end) === 'ne\n# t', detail: J({ a, b, c }) };
  }
  // OLD
  {
    const t1 = run('x', 0, 0, 'heading').text, t2 = run('## x', 3, 3, 'heading').text, t3 = run('## x', 3, 3, 'heading-up').text, t4 = run('## x', 3, 3, 'heading-down').text, t5 = run('x', 0, 0, 'heading-up').text;
    R.OLD = { pass: t1 === '## x' && t2 === 'x' && t3 === '# x' && t4 === '### x' && t5 === 'x', detail: J({ t1, t2, t3, t4, t5 }) };
  }
  return R;
}

const base = suite(srcText);
for (const k of ['SET', 'LINES', 'SHAPE', 'CARET', 'OLD']) ok(`${k} on the real draftFormat.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

const MUT = [
  ['a line already at the level is toggled off (the picker toggles)', 'SET', (t) => t.replace("const ins = level === null ? '' : '#'.repeat(level) + ' ';\n  const s = tok ? tok.start : ls + readLead(text.slice(ls, le), { headings: false }).length;\n  return { s, e: tok ? tok.end : s, ins };", () => "const ins = level === null || (tok && tok.level === level) ? '' : '#'.repeat(level) + ' ';\n  const s = tok ? tok.start : ls + readLead(text.slice(ls, le), { headings: false }).length;\n  return { s, e: tok ? tok.end : s, ins };")],
  ['P leaves a heading mark on', 'SET', (t) => t.replace("return setHeadingLines(text, start, end, null);", () => 'return setHeadingLines(text, start, end, 6);')],
  ['only the first line of a selection is set', 'LINES', (t) => t.replace('for (let i = starts.length - 1; i >= 0; i--) {', () => 'for (let i = 0; i >= 0; i--) {')],
  ['a selection ending after a line break takes the next line too', 'LINES', (t) => t.replace("const last = end > start && text[end - 1] === '\\n' ? end - 1 : end;", () => 'const last = end;')],
  ['an empty line gets a mark', 'LINES', (t) => t.replace('if (!line.slice(readLead(line, { headings: false }).length).trim()) continue;', () => '')],
  ['the mark goes at the front of the line, before a quote or a bullet', 'SHAPE', (t) => t.replace("const s = tok ? tok.start : ls + readLead(text.slice(ls, le), { headings: false }).length;\n  return { s, e: tok ? tok.end : s, ins };", () => "const s = tok ? tok.start : ls;\n  return { s, e: tok ? tok.end : s, ins };")],
  ['the caret and the selection are not moved with the mark', 'CARET', (t) => t.replace('a = move(a, ed); b = move(b, ed);', () => '')],
];
for (const [name, key, fn] of MUT) {
  const after = fn(srcText);
  const landed = after !== srcText;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-HEADING-PICKER-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-HEADING-PICKER-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

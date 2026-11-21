// REORG FOOTNOTES AND ENDNOTES IN WHAT GOES OUT, BROWSERLESS (reorg-plan-v2, INK queue item 3; Nick ruled A, Nov 21; Fable: "export places them at the Part's or the Doc's end"). The real reorg/publishingText.ts is
// transpiled and run on hand-made Parts (the words already carry a private marker where a [^label] stood, and each Part lists its notes already written for the three formats); each law is given a mutant that must LAND and turn
// its own check red.
//   N1  Markdown: a footnote is numbered 1, 2, 3 across the Doc in the order it is cited (not per Part), its note stands at its Part's end; an endnote is numbered i, ii, iii and every endnote stands at the Doc's end after the last Part
//   N2  Plain Text: the same, with [1] and [i] in the words and "[1] the note" lines
//   N3  Web: the marker is a superscript link to its note and the note links back; footnotes at the Part's end, endnotes at the Doc's end; the first citation of a label carries the id
//   N4  the numbering follows what is chosen: exporting only the second Part numbers its notes from 1 again; Parts with no notes go out exactly as before (no field, no change)
//   N5  a label cited twice is one number; a note nobody cites still goes out (her words are never dropped), numbered after the cited ones
// Run: node scripts/harness/reorg-footnotes-export-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
const SRC = lf(fs.readFileSync(new URL('../../src/reorg/publishingText.ts', import.meta.url), 'utf8'));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const S = (l) => '\u0001' + l + '\u0002';   // the marker the words carry where a [^label] stood
const note = (label, endnote, text) => ({ label, endnote, md: text, txt: text, html: text });
const part = (id, md, notes, extra = {}) => ({ id, name: '', level: 0, md, txt: md, html: `<p>${md}</p>`, ...(notes ? { notes } : {}), ...extra });

function suite(P) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  const A = part('a', `Intro${S('a')} text${S('b')}.`, [note('a', false, 'First note'), note('b', true, 'End note')]);
  const B = part('b', `More${S('a')}`, [note('a', false, 'Second')]);
  t('N1', () => {
    const r = P.publicationText(null, [A, B], 'md', null).content;
    return { pass: r === 'Intro[^1] text[^i].\n\n[^1]: First note\n\nMore[^2]\n\n[^2]: Second\n\n[^i]: End note\n', detail: J(r) };
  });
  t('N2', () => {
    const r = P.publicationText(null, [A, B], 'txt', null).content;
    return { pass: r === 'Intro[1] text[i].\n\n[1] First note\n\nMore[2]\n\n[2] Second\n\n[i] End note\n', detail: J(r) };
  });
  t('N3', () => {
    const one = part('o', `Cite${S('a')} here${S('a')}`, [note('a', false, 'Noted')]);
    const r = P.publicationText(null, [one], 'html', null).content;
    const e = P.publicationText(null, [part('e', `X${S('z')}`, [note('z', true, 'At the end')])], 'html', null).content;
    return { pass: r === '<p>Cite<sup id="fnref-1"><a href="#fn-1">1</a></sup> here<sup><a href="#fn-1">1</a></sup></p>\n<p class="note" id="fn-1"><sup>1</sup> Noted <a href="#fnref-1">↩</a></p>\n'
      && e === '<p>X<sup id="enref-i"><a href="#en-i">i</a></sup></p>\n<p class="note" id="en-i"><sup>i</sup> At the end <a href="#enref-i">↩</a></p>\n', detail: J({ r, e }) };
  });
  t('N4', () => {
    const only = P.publicationText(null, [A, B], 'md', ['b']).content;
    const plain = [part('p', 'Plain words.', null), part('q', 'More.', null)];
    const none = P.publicationText('T', plain, 'md', null).content;
    return { pass: only === 'More[^1]\n\n[^1]: Second\n' && none === '# T\n\nPlain words.\n\nMore.\n', detail: J({ only, none }) };
  });
  t('N5', () => {
    const twice = part('t', `A${S('x')} and${S('x')} b${S('y')}`, [note('x', false, 'Ex'), note('y', false, 'Why'), note('orphan', false, 'Nobody cites me')]);
    const r = P.publicationText(null, [twice], 'txt', null).content;
    return { pass: r === 'A[1] and[1] b[2]\n\n[1] Ex\n[2] Why\n[3] Nobody cites me\n', detail: J(r) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(load(SRC)); } catch (e) { baseErr = e; }
for (const k of ['N1', 'N2', 'N3', 'N4', 'N5']) ok(`${k} on the real publishingText.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'publishingText.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['an endnote is numbered like a footnote', 'N1', (t) => t.replace('const n = end ? ++counters.en : ++counters.fn;', () => 'const n = ++counters.fn;')],
  ['the endnotes stand after the first Part, not at the Doc\'s end', 'N1', (t) => t.replace("if (ends.length > 0) blocks.push(ends.join('\\n'));", () => "if (ends.length > 0) blocks.splice(1, 0, ends.join('\\n'));")],
  ['a note nobody cites is dropped', 'N5', (t) => t.replace('for (const note of notes) give(note);', () => '')],
  ['a label cited twice is numbered twice', 'N5', (t) => t.replace('if (nums.has(note.label)) return;', () => '')],
];
for (const [name, key, fn] of MUT) {
  const after = SRC ? fn(SRC) : SRC;
  const landed = !!SRC && after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(load(after)) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FOOTNOTES-EXPORT-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FOOTNOTES-EXPORT-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

// REORG FOOTNOTES AND ENDNOTES, THE TEXT'S HALF, BROWSERLESS (reorg-plan-v2, INK queue item 3; Nick ruled A, Nov 21: "[^1] in the text, `[^1]: the note` on its own line at the Part's end; no new field; split/join/undo/move
// carry them"; owed with it: the note lines set apart on the page and the word count leaving them out). No browser, no box: the real reorg/footnotes.ts is transpiled and run; each law is given a mutant (a text rewrite of the
// source) that must LAND and turn its own check red.
//   READ    the notes are the note lines at the END of a Part's text (a blank line may stand between them); a note-like line in the middle of the words is only words; no notes: the body is the whole text
//   MARK    a marker is [^label] in the words; a typed \[^1] (escaped), [ ^1] and a note line are not markers; labels come back in the order they stand, once per marker
//   INSERT  the Footnote and Endnote acts put a marker at the caret and an empty note line at the end (after the notes already there), under a label no marker or note uses ("1", "2"...; an endnote is "e1", "e2"...), and
//           put the caret on the new note line; a caret already inside the notes is refused
//   WORDS   what a goal counts: the words without the notes and without the markers
//   SPLIT   a Part split in two takes each note to the half that holds its marker (a note with no marker stays above); no notes: the split is the stand-in's, byte for byte
//   JOIN    a Part joined onto the one above brings its notes after the Part's own, a label already taken is renamed (marker and note together), a label free keeps its name; no notes: the join is the stand-in's; a split then a join gives the text back
// Run: node scripts/harness/reorg-footnotes-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
let SRC = '';
try { SRC = lf(fs.readFileSync(new URL('../../src/reorg/footnotes.ts', import.meta.url), 'utf8')); } catch { SRC = ''; }

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const cut = (b, o) => ({ head: b.slice(0, o), tail: b.slice(o), at: o });
const glue = (a, b) => a + b;

function suite(src) {
  const R = {};
  const F = load(src);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('READ', () => {
    const a = F.readNotes('Body words.[^1] more\n\n[^1]: The note.');
    const two = F.readNotes('Text[^1][^e1]\n\n[^1]: One.\n\n[^e1]: End one.\n');
    const mid = F.readNotes('First\n[^1]: not a note\nSecond line');
    const none = F.readNotes('Just words.');
    const only = F.readNotes('[^1]: a note alone');
    const empty = F.readNotes('Words[^1]\n\n[^1]: ');
    return { pass: a.body === 'Body words.[^1] more' && J(a.notes) === J([{ label: '1', endnote: false, text: 'The note.' }])
      && two.body === 'Text[^1][^e1]' && J(two.notes) === J([{ label: '1', endnote: false, text: 'One.' }, { label: 'e1', endnote: true, text: 'End one.' }])
      && mid.body === 'First\n[^1]: not a note\nSecond line' && mid.notes.length === 0 && none.body === 'Just words.' && none.notes.length === 0
      && only.body === '' && only.notes.length === 1 && only.notes[0].text === 'a note alone' && empty.notes.length === 1 && empty.notes[0].text === '' && empty.body === 'Words[^1]',
    detail: J({ a, two, mid, none, only, empty }) };
  });
  t('MARK', () => {
    const m = F.markersIn('a[^1] b[^e2] c[^1]');
    const esc = F.markersIn('a \\[^1] b [ ^1] c [^ 1] d [^] e');
    const near = F.markersIn('x[^note-2]y[^a_b]');
    return { pass: J(m) === J(['1', 'e2', '1']) && esc.length === 0 && J(near) === J(['note-2', 'a_b']), detail: J({ m, esc, near }) };
  });
  t('INSERT', () => {
    const a = F.insertNote('Hello world', 5, 'footnote');
    const b = F.insertNote('Hello[^1] world\n\n[^1]: First note.', 11, 'footnote');
    const c = F.insertNote('Hello world', 11, 'endnote');
    const d = F.insertNote('One[^1] two[^3]\n\n[^1]: a\n[^3]: c', 3, 'footnote');
    const e = F.insertNote('Hello world\n\n[^1]: a', 17, 'footnote');
    const f = F.insertNote('Has[^e1] end', 3, 'endnote');
    return { pass: !!a && a.text === 'Hello[^1] world\n\n[^1]: ' && a.caret === a.text.length
      && !!b && b.text === 'Hello[^1] world[^2]\n\n[^1]: First note.\n[^2]: ' && b.caret === b.text.length
      && !!c && c.text === 'Hello world[^e1]\n\n[^e1]: ' && c.caret === c.text.length
      && !!d && d.text === 'One[^2][^1] two[^3]\n\n[^1]: a\n[^3]: c\n[^2]: ' && d.caret === d.text.length
      && e === null && !!f && f.text.includes('[^e2]') && f.text.endsWith('[^e2]: '),
    detail: J({ a, b, c, d, e, f }) };
  });
  t('WORDS', () => {
    const a = F.wordsOnly('Body[^1] words here\n\n[^1]: Not counted at all.');
    const b = F.wordsOnly('Plain words.');
    const c = F.wordsOnly('[^1]: only a note');
    const d = F.wordsOnly('Two [^1] words[^e1]\n\n[^1]: x\n[^e1]: y');
    const count = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
    return { pass: a === 'Body words here' && b === 'Plain words.' && c === '' && count(d) === 2 && count(a) === 3, detail: J({ a, b, c, d }) };
  });
  t('SPLIT', () => {
    const text = 'A[^1] B[^2]\n\n[^1]: n1\n[^2]: n2';
    const s = F.splitWithNotes(text, 6, cut);
    const none = F.splitWithNotes('Plain words', 5, cut);
    const orphan = F.splitWithNotes('A B\n\n[^9]: lost', 2, cut);
    const both = F.splitWithNotes('A[^1] B[^1]\n\n[^1]: n1', 6, cut);
    return { pass: s.head === 'A[^1] \n\n[^1]: n1' && s.tail === 'B[^2]\n\n[^2]: n2' && s.at === 6
      && J(none) === J(cut('Plain words', 5)) && orphan.head === 'A \n\n[^9]: lost' && orphan.tail === 'B' && both.head === 'A[^1] \n\n[^1]: n1' && both.tail === 'B[^1]\n\n[^1]: n1',
    detail: J({ s, none, orphan, both }) };
  });
  t('JOIN', () => {
    const j = F.joinWithNotes('A[^1]\n\n[^1]: a', 'B[^1]\n\n[^1]: b', glue);
    const free = F.joinWithNotes('A[^1]\n\n[^1]: a', 'B[^2]\n\n[^2]: b', glue);
    const end = F.joinWithNotes('A[^e1]\n\n[^e1]: a', 'B[^e1]\n\n[^e1]: b', glue);
    const none = F.joinWithNotes('A', 'B', glue);
    const onlyBelow = F.joinWithNotes('A', 'B[^1]\n\n[^1]: b', glue);
    const text = 'A[^1] B[^2]\n\n[^1]: n1\n[^2]: n2';
    const s = F.splitWithNotes(text, 6, cut);
    const back = F.joinWithNotes(s.head, s.tail, glue);
    return { pass: j === 'AB[^2]\n\n[^1]: a\n[^2]: b' && free === 'AB[^2]\n\n[^1]: a\n[^2]: b' && end === 'AB[^e2]\n\n[^e1]: a\n[^e2]: b'
      && none === 'AB' && onlyBelow === 'AB[^1]\n\n[^1]: b' && back === text,
    detail: J({ j, free, end, none, onlyBelow, back }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
const LAWS = ['READ', 'MARK', 'INSERT', 'WORDS', 'SPLIT', 'JOIN'];
for (const k of LAWS) ok(`${k} on the real footnotes.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'footnotes.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

// the mutants: [name, the check it must turn red, the rewrite]
const MUT = [
  ['a note-like line in the middle of the words is read as a note', 'READ', (t) => t.replace('// MUT:endonly', () => '// MUT:endonly').replace('!/\\S/.test(lines[i + 1] ?? \'\')', () => 'true')],
  ['an escaped marker is read as a marker', 'MARK', (t) => t.replace('(?<!\\\\)', () => '')],
  ['an endnote loses its label prefix', 'INSERT', (t) => t.replace("kind === 'endnote' ? 'e' : ''", () => "''")],
  ['a label already used is handed out again', 'INSERT', (t) => t.replace('while (used.has(', () => 'while (false && used.has(')],
  ['the markers stay in the counted words', 'WORDS', (t) => t.replace("replace(MARKER_G, '')", () => "replace(/$^/g, '')")],
  ['the notes stay in the counted words', 'WORDS', (t) => t.replace('const { body } = readNotes(text);', () => 'const body = text;')],
  ['a split sends every note to the head', 'SPLIT', (t) => t.replace('inTail.has(n.label)', () => 'false')],
  ['a join keeps a colliding label', 'JOIN', (t) => t.replace('const taken = new Set(', () => 'const taken = new Set<string>([]); const _unused = new Set(')],
];
for (const [name, key, fn] of MUT) {
  const after = SRC ? fn(SRC) : SRC;
  const landed = !!SRC && after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FOOTNOTES-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FOOTNOTES-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

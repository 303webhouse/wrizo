// REORG FOOTNOTE AND ENDNOTE ACTS, THE FORMATTER'S HALF, BROWSERLESS (reorg-plan-v2, INK queue item 3; the More ▸ Footnote / Endnote buttons press these). The real store/draftFormat.ts is bundled (esbuild);
// each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   A1  Footnote on a caret puts [^1] at the caret and an empty note line at the end, the caret on that note line; Endnote does the same with [^e1]; a second one takes the next free label
//   A2  on a selection the marker goes AFTER the selected words (the words are what is cited); the selection is not kept
//   A3  a caret already inside the notes changes nothing (the text comes back as it was)
// Run: node scripts/harness/reorg-footnotes-act-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const { build } = createRequire(createRequire(join(DESKTOP, 'package.json')).resolve('vite'))('esbuild');
const lf = (s) => s.split('\r\n').join('\n');
const SRC = lf(fs.readFileSync(join(DESKTOP, 'src', 'store', 'draftFormat.ts'), 'utf8'));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);

async function load(text) {
  const r = await build({ stdin: { contents: text, resolveDir: join(DESKTOP, 'src', 'store'), sourcefile: 'draftFormat.ts', loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
}

function suite(M) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('A1', () => {
    const a = M.applyFormat('Hello world', 5, 5, 'footnote');
    const b = M.applyFormat('Hello world', 11, 11, 'endnote');
    const c = M.applyFormat(a.text, 0, 0, 'footnote');
    return { pass: a.text === 'Hello[^1] world\n\n[^1]: ' && a.start === a.text.length && a.end === a.text.length
      && b.text === 'Hello world[^e1]\n\n[^e1]: ' && b.start === b.text.length
      && c.text === '[^2]Hello[^1] world\n\n[^1]: \n[^2]: ' && c.start === c.text.length, detail: J({ a, b, c }) };
  });
  t('A2', () => {
    const a = M.applyFormat('Cite these words here', 5, 16, 'footnote');
    return { pass: a.text === 'Cite these words[^1] here\n\n[^1]: ' && a.start === a.end && a.start === a.text.length, detail: J(a) };
  });
  t('A3', () => {
    const text = 'Hello[^1] world\n\n[^1]: a note';
    const a = M.applyFormat(text, text.length, text.length, 'footnote');
    const b = M.applyFormat(text, 20, 20, 'endnote');
    return { pass: a.text === text && b.text === text, detail: J({ a, b }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(await load(SRC)); } catch (e) { baseErr = e; }
for (const k of ['A1', 'A2', 'A3']) ok(`${k} on the real draftFormat.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'draftFormat.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['the marker goes at the selection start, not after the words', 'A2', (t) => t.replace('insertNote(text, end, action)', () => 'insertNote(text, start, action)')],
  ['a caret inside the notes still inserts', 'A3', (t) => t.replace('if (!r) return { text, start, end };', () => 'if (!r) return { text: text + "[^9]", start, end };')],
  ['the new note line is not where the caret lands', 'A1', (t) => t.replace('start: r.caret, end: r.caret', () => 'start: start, end: start')],
];
for (const [name, key, fn] of MUT) {
  const after = fn(SRC);
  const landed = after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(await load(after)) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FOOTNOTES-ACT-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FOOTNOTES-ACT-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

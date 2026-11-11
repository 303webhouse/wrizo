// UNIT CHECK of store/textMerge.ts (#76 part 3, KEEP BOTH): the three-way text merge in plain node, no browser. The TypeScript is bundled with the esbuild that ships with vite, so this runs wherever the app builds.
// Examples (the named cases of the brief: different paragraphs, the same paragraph, a delete against an edit, three windows), then a seeded random battery of 3,000 pairs of edits with these properties:
//   SYMMETRY      mergeText(base, a, b).text === mergeText(base, b, a).text         (two windows merging each other's work settle on one page)
//   NEVER DROPS   every word either side ADDED (each is unique in this battery) is in the merged text
//   FAST PATHS    one side unchanged gives the other side's text exactly
//   NO BLENDING   every line of the merged text is a whole line of base, mine or theirs (a paragraph both sides changed is kept as two whole versions, never mixed word by word: a mixed line could be a sentence nobody wrote)
//   CARET         mapCaret stays inside the text, and for a caret after a character that is still there it stands after the same character
// Run: node scripts/harness/writing-audit/merge-unit.mjs (from apps/desktop). Exit 1 on any failure.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
const entry = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../src/store/textMerge.ts');
const built = esbuild.buildSync({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'node' });
const { mergeText, mapCaretThrough } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks += 1; if (!cond) { fails += 1; if (fails <= 25) console.log('FAIL  ' + msg); } };
const m = (b, a, t) => mergeText(b, a, t);

// ---- the named cases --------------------------------------------------------------------------------------------------------
{ // TB2: both typed at the end of the same paragraph: both WHOLE versions, one under the other
  const NL = String.fromCharCode(10);
  const r = m('Base. ', 'Base. a1 a2 ', 'Base. b1 b2 ');
  ok(r.text === 'Base. a1 a2 ' + NL + 'Base. b1 b2 ', `same paragraph, both appended: ${JSON.stringify(r.text)}`);
  ok(r.merged && r.kept, 'same paragraph, both appended: kept both');
  ok(m('Base. ', 'Base. b1 b2 ', 'Base. a1 a2 ').text === r.text, 'same paragraph: the other way round gives the same page');
}
{ // different paragraphs
  const base = 'One\nTwo\nThree\nFour';
  const r = m(base, 'One edited\nTwo\nThree\nFour', 'One\nTwo\nThree\nFour edited');
  ok(r.text === 'One edited\nTwo\nThree\nFour edited', `different paragraphs: ${JSON.stringify(r.text)}`);
  ok(!r.kept, 'different paragraphs: nothing kept twice');
}
{ // neighbouring paragraphs (the changes touch)
  const r = m('A\nB\nC', 'A mine\nB\nC', 'A\nB theirs\nC');
  ok(r.text === 'A mine\nB theirs\nC', `neighbouring paragraphs: ${JSON.stringify(r.text)}`);
}
{ // the same paragraph changed two ways: both whole versions kept
  const NL = String.fromCharCode(10);
  const r = m('The quick fox.', 'The fast fox.', 'The slow fox.');
  ok(r.kept && r.text === 'The fast fox.' + NL + 'The slow fox.', `same words, two ways: ${JSON.stringify(r.text)}`);
  ok(m('The quick fox.', 'The slow fox.', 'The fast fox.').text === r.text, 'same words, two ways: the same page the other way round');
  // DIFFERENT words of one paragraph: still NOT blended (the ruling): "The slow brown fox." is a sentence neither window wrote
  const w = m('The quick fox.', 'The quick brown fox.', 'The slow fox.');
  ok(w.kept && w.text === 'The quick brown fox.' + NL + 'The slow fox.', `different words of one paragraph keep both whole: ${JSON.stringify(w.text)}`);
  ok(!w.text.includes('The slow brown fox.'), 'no blended sentence');
}
{ // delete against edit: the edit stays
  const base = 'One\nTwo\nThree';
  const r = m(base, 'One\nThree', 'One\nTwo changed\nThree');
  ok(r.text === 'One\nTwo changed\nThree', `delete against edit: ${JSON.stringify(r.text)}`);
  ok(m(base, 'One\nTwo changed\nThree', 'One\nThree').text === r.text, 'delete against edit: the same page the other way round');
}
{ // three windows, one after the other, in either order
  const base = 'Start.\nMiddle.\nEnd.';
  const a = 'Start. A\nMiddle.\nEnd.', b = 'Start.\nMiddle. B\nEnd.', c = 'Start.\nMiddle.\nEnd. C';
  const abc = m(base, m(base, a, b).text, c).text, cba = m(base, c, m(base, b, a).text).text, bca = m(base, m(base, b, c).text, a).text;
  ok(abc === 'Start. A\nMiddle. B\nEnd. C' && cba === abc && bca === abc, `three windows: ${JSON.stringify([abc, cba, bca])}`);
}
{ // three windows all appending to the same paragraph
  const base = 'Base.';
  const a = 'Base. aa', b = 'Base. bb', c = 'Base. cc';
  const x = m(base, m(base, a, b).text, c).text, y = m(base, m(base, c, a).text, b).text;
  ok(['aa', 'bb', 'cc'].every((w) => x.includes(w)) && ['aa', 'bb', 'cc'].every((w) => y.includes(w)), `three appends keep every word: ${JSON.stringify([x, y])}`);
}
{ // the empty page, and the empty base
  ok(m('', 'Hello', 'World').text.includes('Hello') && m('', 'Hello', 'World').text.includes('World'), 'an empty base keeps both pages');
  ok(m('x', '', 'x y').text === 'x y' || m('x', '', 'x y').text.includes('y'), 'one side emptied the page, the other added: the added word stays');
}

// ---- the random battery -----------------------------------------------------------------------------------------------------
let seed = 20261111;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = (n) => Math.floor(rnd() * n);
let uid = 0;
const vocab = ['rain', 'light', 'window', 'story', 'night', 'coffee', 'river', 'stone', 'quiet', 'engine', 'paper', 'garden'];
const base0 = () => Array.from({ length: 2 + pick(6) }, () => Array.from({ length: 2 + pick(5) }, () => vocab[pick(vocab.length)] + pick(4)).join(' ')).join('\n');
// an edit adds only UNIQUE words (u1, u2, ...) so "never drops" can be checked by name
const edit = (text, added) => {
  const paras = text.split('\n');
  const pi = pick(paras.length);
  const words = paras[pi].split(' ');
  const kind = pick(7);
  if (kind === 0) { const w = `u${uid += 1}`; added.push(w); words.splice(pick(words.length + 1), 0, w); paras[pi] = words.join(' '); }
  else if (kind === 1 && words.length > 1) { words.splice(pick(words.length), 1); paras[pi] = words.join(' '); }
  else if (kind === 2) { const w = `u${uid += 1}`; added.push(w); words[pick(words.length)] = w; paras[pi] = words.join(' '); }
  else if (kind === 3 && paras.length > 1) paras.splice(pi, 1);
  else if (kind === 4) { const w = `u${uid += 1}`; added.push(w); paras.splice(pi + 1, 0, w); }
  else if (kind === 5) { const w = `u${uid += 1}`; added.push(w); paras[pi] = `${paras[pi]} ${w}`; }
  else { const w = `u${uid += 1}`; added.push(w); paras[pi] = `${w} ${paras[pi]}`; }
  return paras.join('\n');
};
for (let n = 0; n < 3000; n += 1) {
  const base = base0();
  let a = base, b = base;
  const addedA = [], addedB = [];
  for (let k = 0, ka = pick(4); k < ka; k += 1) a = edit(a, addedA);
  for (let k = 0, kb = pick(4); k < kb; k += 1) b = edit(b, addedB);
  const ab = m(base, a, b), ba = m(base, b, a);
  { const NLC = String.fromCharCode(10); const inputs = new Set([...base.split(NLC), ...a.split(NLC), ...b.split(NLC)]); for (const line of ab.text.split(NLC)) ok(inputs.has(line), `NO BLENDING #${n}: the line ${JSON.stringify(line)} is in none of the three texts: ${JSON.stringify({ base, a, b, merged: ab.text })}`); }
  ok(ab.text === ba.text, `SYMMETRY #${n}: ${JSON.stringify({ base, a, b, ab: ab.text, ba: ba.text })}`);
  for (const w of [...addedA, ...addedB]) {
    // a word added and then replaced again by the same side's later edit is not in that side's final text: only words that are in a side's text count
    if (a.split(/\s+/).includes(w) || b.split(/\s+/).includes(w)) ok(ab.text.split(/\s+/).includes(w), `NEVER DROPS #${n}: "${w}" is missing: ${JSON.stringify({ base, a, b, merged: ab.text })}`);
  }
  if (a === base) ok(ab.text === b, `FAST PATH #${n}: theirs only: ${JSON.stringify({ base, b, got: ab.text })}`);
  if (b === base) ok(ab.text === a, `FAST PATH #${n}: mine only: ${JSON.stringify({ base, a, got: ab.text })}`);
  for (let k = 0; k < 3; k += 1) {
    const c = pick(a.length + 1), at = ab.mapCaret(c);
    ok(at >= 0 && at <= ab.text.length, `CARET #${n}: ${c} -> ${at} outside 0..${ab.text.length}`);
    if (c > 0 && /\S/.test(a[c - 1]) && /^u\d+$/.test(a.slice(0, c).split(/\s+/).pop() || '') && ab.text.includes(a.slice(Math.max(0, c - 4), c))) ok(ab.text[at - 1] === a[c - 1], `CARET #${n}: after "${a[c - 1]}" in mine, but after "${ab.text[at - 1]}" in the merge: ${JSON.stringify({ base, a, b, merged: ab.text, c, at })}`);
  }
}

// ---- a caret through words added elsewhere (a clean adoption) -----------------------------------------------------------------
{
  const o = 'Para one.' + String.fromCharCode(10) + 'Para two.' + String.fromCharCode(10) + 'Para three.';
  const n = 'Para one. A0 A1' + String.fromCharCode(10) + 'Para two. B0' + String.fromCharCode(10) + 'Para three.';
  ok(mapCaretThrough(o, n, o.length) === n.length, 'a caret at the end stays at the end when words were added above it');
  const at = o.indexOf('three') + 3;   // inside "three"
  ok(n.slice(0, mapCaretThrough(o, n, at)).endsWith('Para thr'), `a caret inside a word keeps its place in that word: ${JSON.stringify(n.slice(0, mapCaretThrough(o, n, at)))}`);
  ok(mapCaretThrough(o, n, 0) === 0, 'a caret at the start stays at the start');
  ok(mapCaretThrough('abc', 'abc', 2) === 2, 'no change, no move');
}
console.log(`${fails ? 'FAIL' : 'PASS'}  merge-unit: ${checks - fails} of ${checks} checks held${fails ? `, ${fails} failed` : ''}`);
process.exit(fails ? 1 : 0);

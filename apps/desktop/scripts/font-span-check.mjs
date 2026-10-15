// FONT-SPAN - THE TEXT RULES, CHECKED WITHOUT A BROWSER. The font on highlighted words lives in the text as `[words]{.font-<slug>}`
// (docs/font-span-plan.md + Fable's four additions). This bundles the REAL modules (store/markRuns.ts, draftFormat.ts, hiddenMarks.ts)
// with the repo's own esbuild and checks, byte for byte:
//   READ   the reader finds a span, keeps a writer's `[sic]` as text, strips a span to its words;
//   PICK   a pick wraps the highlight and keeps it highlighted; neighbours of one face MERGE; a partial re-pick SPLITS; picking the
//          page's own face removes; a new face over an old one REPLACES - never two spans on one word, never one inside another;
//          a stretch that would cross Bold is split so the two nest (the reader then drops nothing);
//   211    Backspace/Delete never take half a span; deleting every word inside removes it; Enter inside closes and reopens it;
//          Bold over half a span pulls the span in; Bold toggles off over a span;
//   READERS (Fable's addition 1) withoutFontMarks keeps every other convention; the house word count never changes with a span;
//   WHOLE  the whole-document pick removes every span.
// Run: node apps/desktop/scripts/font-span-check.mjs   (no browser, no box turn)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const pnpmDir = join(root, 'node_modules', '.pnpm');
const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('FONT-SPAN-CHECK VERIFY: FAIL - esbuild not found under node_modules/.pnpm'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'wz-fontspan-'));
const entry = join(tmp, 'entry.ts');
const store = join(here, '..', 'src', 'store').replace(/\\/g, '/');
writeFileSync(entry, `export * as mr from '${store}/markRuns';\nexport * as df from '${store}/draftFormat';\nexport * as hm from '${store}/hiddenMarks';\n`);
const out = join(tmp, 'bundle.mjs');
execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error'], { stdio: 'pipe' });
const { mr, df, hm } = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const fonts = (line) => mr.readMarks(line).filter((r) => r.kind === 'font');
const words = (t) => { const s = t.trim(); return s ? s.split(/\s+/).length : 0; };   // the house counter (seven copies, all this shape)
// every font span in a text: none nested in another, none sharing a word (no stacked marks)
const noStacking = (text) => text.split('\n').every((line) => {
  const fs = fonts(line);
  return fs.every((a, i) => fs.every((b, j) => i === j || b.open > a.close || a.open > b.close));
});
const sel = (r) => r.text.slice(r.start, r.end);

// ---- READ
const T1 = 'the [two words]{.font-eb-garamond} here';
ok('READ: the reader finds one font span and its face', fonts(T1).length === 1 && fonts(T1)[0].face === 'eb-garamond', JSON.stringify(fonts(T1)));
ok('READ: stripLine reads it as its words', mr.stripLine(T1) === 'the two words here', JSON.stringify(mr.stripLine(T1)));
ok('READ: a writer\'s own [sic] is text, not a span', fonts('a [sic] b').length === 0 && mr.stripLine('a [sic] b') === 'a [sic] b');
const T2 = '[a [sic] b]{.font-lora}';
ok('READ: [sic] inside a span stays text, and the span still reads', fonts(T2).length === 1 && mr.stripLine(T2) === 'a [sic] b', JSON.stringify({ f: fonts(T2), s: mr.stripLine(T2) }));
ok('READ: an unclosed [ and a stray closing mark are text', fonts('a [b c').length === 0 && fonts('a b]{.font-lora} c').length === 0);

// ---- PICK
const base = 'The ferry was late';
const p1 = df.applyFontPick(base, 4, 13, 'lora');
ok('PICK: the highlight is wrapped in its face and STAYS highlighted on the same words', p1.text === 'The [ferry was]{.font-lora} late' && sel(p1) === 'ferry was', JSON.stringify(p1));
const p2 = df.applyFontPick(p1.text, p1.text.indexOf('was'), p1.text.length, 'lora');
ok('PICK: the same face on the neighbouring words MERGES into one span', p2.text === 'The [ferry was late]{.font-lora}', JSON.stringify(p2));
const wasAt = p2.text.indexOf('was');
const p3 = df.applyFontPick(p2.text, wasAt, wasAt + 3, null);
ok('PICK: the page\'s own face on part of a span SPLITS it - the words outside keep their face', p3.text === 'The [ferry]{.font-lora} was [late]{.font-lora}' && sel(p3) === 'was', JSON.stringify(p3));
const p4 = df.applyFontPick(p1.text, p1.text.indexOf('was'), p1.text.indexOf('late') + 4, 'eb-garamond');
ok('PICK: a new face over part of an old span REPLACES it there - never two spans on one word', p4.text === 'The [ferry]{.font-lora} [was late]{.font-eb-garamond}' && noStacking(p4.text), JSON.stringify(p4));
const p5 = df.applyFontPick(p4.text, 0, p4.text.length, null);
ok('PICK: the page\'s own face over everything removes every span', p5.text === base, JSON.stringify(p5));
const bold = 'The **ferry was** late';
const p6 = df.applyFontPick(bold, bold.indexOf('was'), bold.length, 'lora');
const r6 = mr.readMarks(p6.text);
ok('PICK: a stretch that would CROSS a bold run is split so the two NEST - the reader keeps every run and the words read clean',
  r6.filter((r) => r.kind === 'font').length === 2 && r6.filter((r) => r.kind === 'bold').length === 1 && mr.stripLine(p6.text) === 'The ferry was late' && noStacking(p6.text), JSON.stringify(p6));
const two = 'First line here\nSecond line here';
const p7 = df.applyFontPick(two, 6, 22, 'figtree');
ok('PICK: a highlight across two lines becomes one span per line (as Bold does)', p7.text === 'First [line here]{.font-figtree}\n[Second]{.font-figtree} line here', JSON.stringify(p7));
ok('PICK: the picker reads the highlight\'s face (brass), the page\'s face (null) and a mix', df.fontFaceAt(p1.text, p1.start, p1.end) === 'lora'
  && df.fontFaceAt(base, 0, 3) === null && df.fontFaceAt(p4.text, 0, p4.text.length) === 'mixed', JSON.stringify([df.fontFaceAt(p1.text, p1.start, p1.end), df.fontFaceAt(base, 0, 3), df.fontFaceAt(p4.text, 0, p4.text.length)]));
ok('PICK: a collapsed caret changes nothing (the whole-document pick is the host\'s)', df.applyFontPick(base, 5, 5, 'lora').text === base);

// ---- 211 on a span
const S = 'a [bc]{.font-lora} d';
const b1 = hm.backspaceAt(S, 5);
ok('211: Backspace after the span\'s last letter takes the LETTER, never a mark', b1 && b1.text === 'a [b]{.font-lora} d', JSON.stringify(b1));
// (a mutant that hid only the closing mark's FIRST character survived the checks around this line - nothing pressed a key just after a
//  span's closing mark; these two do, so the whole closing mark must be hidden)
const afterClose = S.indexOf(' d');
const bA = hm.backspaceAt(S, afterClose);
ok('211: Backspace with the caret just AFTER a span takes its last LETTER - the whole closing mark is hidden and stepped over', bA && bA.text === 'a [b]{.font-lora} d', JSON.stringify(bA));
ok('211: the right arrow from the last letter steps over the whole closing mark and the space, to the next word', hm.stepRight(S, 5) === S.indexOf('d'), String(hm.stepRight(S, 5)));
const b2 = b1 && hm.backspaceAt(b1.text, 4);
ok('211: deleting every word inside a span removes the span (no empty marks left)', b2 && b2.text === 'a  d', JSON.stringify(b2));
const d1 = hm.deleteAt(S, 4);   // between b and c
ok('211: Delete inside the span takes the letter, never a mark', d1 && d1.text === 'a [b]{.font-lora} d', JSON.stringify(d1));
const d0 = hm.deleteAt(S, 3);   // just after the hidden [ : the caret rule puts it before the [, so Delete takes the first letter
ok('211: Delete at the start of a span takes its first letter, never the [', d0 && d0.text === 'a [c]{.font-lora} d', JSON.stringify(d0));
const e1 = hm.enterAt(S, 4, 4);
ok('211: Enter inside a span closes it before the newline and opens it again after', e1.text === 'a [b]{.font-lora}\n[c]{.font-lora} d', JSON.stringify(e1));
ok('211: the caret never stops inside a mark - a caret just after the hidden [ snaps to before it (rule 1: after the nearest visible character)', hm.snapCaret(S, 3) === 2, String(hm.snapCaret(S, 3)));
const w1 = hm.wordBackspaceAt('one [two]{.font-lora} three', 8);
ok('211: Ctrl+Backspace after a span\'s only word removes the word WITH its span', w1 && w1.text === 'one  three', JSON.stringify(w1));
const bo = df.applyFormat('one [two words]{.font-lora} end', 9, 31, 'bold');
ok('BOLD: Bold over half a span pulls the span in, so the two nest', mr.readMarks(bo.text).filter((r) => r.kind === 'font').length === 1 && mr.stripLine(bo.text) === 'one two words end' && /\*\*/.test(bo.text), JSON.stringify(bo));
const off = df.applyFormat('**one [two]{.font-lora}**', 0, 25, 'bold');
ok('BOLD: Bold toggles OFF over a bold run that holds a span (its marks are not counted as plain words)', off.text === 'one [two]{.font-lora}', JSON.stringify(off));
ok('STRIP: marksAt reads no face as a style', JSON.stringify(df.marksAt('[**x**]{.font-lora}', 4)) === JSON.stringify({ bold: true, italic: false, underline: false, strike: false }), JSON.stringify(df.marksAt('[**x**]{.font-lora}', 4)));

// ---- READERS (Fable's addition 1)
const mixed = '# A heading\n- one [**two**]{.font-lora} three\nplain [words]{.font-arial} here';
ok('READERS: withoutFontMarks removes ONLY the span marks - headings, bullets, bold all kept', mr.withoutFontMarks(mixed) === '# A heading\n- one **two** three\nplain words here', JSON.stringify(mr.withoutFontMarks(mixed)));
const counted = [p1.text, p2.text, p3.text, p4.text, p6.text, p7.text, mixed];
ok('READERS: the house word count is the same with and without the span marks, on every text above',
  counted.every((t) => words(t) === words(mr.withoutFontMarks(t))), JSON.stringify(counted.map((t) => [words(t), words(mr.withoutFontMarks(t))])));

// ---- WHOLE
ok('WHOLE: the whole-document pick removes every span', df.clearFontSpans(p4.text + '\n' + p7.text) === 'The ferry was late\n' + two, JSON.stringify(df.clearFontSpans(p4.text + '\n' + p7.text)));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nFONT-SPAN-CHECK VERIFY: PASS (${checks.length} checks)` : `\nFONT-SPAN-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);

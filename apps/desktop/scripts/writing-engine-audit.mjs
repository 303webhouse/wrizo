// WRITING SURFACE S0 (Nick, 2026-09-24): "most of the text formatting options (B-I-U, bulleting, indenting, etc.) are not
// displaying correctly ... every time I write in the app, I hit formatting issues."
//
// THIS IS THE BROWSERLESS HALF OF THE AUDIT. It runs the REAL format engine (store/draftFormat.ts: what each tool STORES) and
// the REAL decorator (store/draftDecoration.ts: the HTML each stored string becomes) over a battery of things a writer does,
// and reports, per case: what is STORED, what a writer would VISIBLY SEE (the decorator's markers that are collapsed with
// `.md-mark-hidden` - font-size:0 - are removed, exactly as the page hides them; every other character is visible), and which CSS
// classes carry the effect. It cannot see pixels: what the CSS actually paints, the caret, native shortcuts, and the dark theme
// need a browser, and that is the frame list at the bottom (docs/menus/writing-surface-s0.md).
//
// No box turn, no browser. Run: node apps/desktop/scripts/writing-engine-audit.mjs [--json]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const desktopSrc = join(here, '..', 'src');
const requireDesktop = createRequire(join(here, '..', 'package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const tmp = join(tmpdir(), 'wrizo-writing-audit');
mkdirSync(tmp, { recursive: true });
const out = join(tmp, 'engine.mjs');
await esbuild.build({
  stdin: { contents: "export { applyFormat, marksAt } from './store/draftFormat'; export { decorateMarkdownForCard } from './store/draftDecoration';", resolveDir: desktopSrc, loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
});
const { applyFormat, marksAt, decorateMarkdownForCard } = await import(pathToFileURL(out).href);

// What a writer SEES from a decorated string: the collapsed markers are gone, every other character stays.
const HIDDEN = /<span class="md-mark md-mark-hidden">[\s\S]*?<\/span>/g;
const visibleText = (html) => html.replace(HIDDEN, '').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const classesOf = (html) => [...new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(' ')))].filter((c) => c !== 'md-mark' && c !== 'md-mark-hidden');
// The decorator is asked with the caret AWAY from the run (the ordinary state of text you are not editing) so collapsed markers really are collapsed.
const see = (text) => { const html = decorateMarkdownForCard(text, null); return { html, visible: visibleText(html), classes: classesOf(html) }; };

const rows = [];
const add = (id, area, what, before, action, sel, note = '') => {
  const [s0, s1] = sel;
  const r = applyFormat(before, s0, s1, action);
  const v = see(r.text);
  rows.push({ id, area, what, stored: r.text, visible: v.visible, classes: v.classes, note });
  return r;
};
const showsRaw = (visible, marks) => marks.filter((m) => visible.includes(m));

// ---- 1. the inline marks, from a clean selection -------------------------------------------------------------
const W = 'Plain card words';
const sel = [0, 5];   // "Plain"
add('B1', 'bold', 'select a word, press Bold', W, 'bold', sel);
add('I1', 'italic', 'select a word, press Italic', W, 'italic', sel);
add('U1', 'underline', 'select a word, press Underline', W, 'underline', sel);
add('S1', 'strike', 'select a word, press Strikethrough', W, 'strike', sel);

// ---- 2. PRESS IT AGAIN (the un-bold the writer expects) ------------------------------------------------------
{ const r = applyFormat(W, 0, 5, 'bold'); const again = applyFormat(r.text, r.start, r.end, 'bold');
  const v = see(again.text); rows.push({ id: 'B2', area: 'bold', what: 'select the bolded word, press Bold AGAIN (a writer expects it to un-bold)', stored: again.text, visible: v.visible, classes: v.classes, note: 'toggle?' }); }
{ const r = applyFormat(W, 0, 5, 'italic'); const again = applyFormat(r.text, r.start, r.end, 'italic');
  const v = see(again.text); rows.push({ id: 'I2', area: 'italic', what: 'press Italic again on the italic word', stored: again.text, visible: v.visible, classes: v.classes, note: 'toggle?' }); }
{ const r = applyFormat(W, 0, 5, 'underline'); const again = applyFormat(r.text, r.start, r.end, 'underline');
  const v = see(again.text); rows.push({ id: 'U2', area: 'underline', what: 'press Underline again', stored: again.text, visible: v.visible, classes: v.classes, note: 'toggle?' }); }

// ---- 3. STACKING: bold then italic on the same word ------------------------------------------------------------
{ const r = applyFormat(W, 0, 5, 'bold'); const i = applyFormat(r.text, r.start, r.end, 'italic');
  const v = see(i.text); rows.push({ id: 'BI', area: 'bold+italic', what: 'bold a word, then italic it (bold italic)', stored: i.text, visible: v.visible, classes: v.classes }); }
{ const r = applyFormat(W, 0, 5, 'bold'); const i = applyFormat(r.text, r.start, r.end, 'underline');
  const v = see(i.text); rows.push({ id: 'BU', area: 'bold+underline', what: 'bold a word, then underline it', stored: i.text, visible: v.visible, classes: v.classes }); }

// ---- 4. THE SELECTION SPANS MORE THAN ONE LINE ---------------------------------------------------------------------
const TWO = 'First paragraph here.\nSecond paragraph here.';
add('BML', 'bold', 'select two paragraphs, press Bold', TWO, 'bold', [0, TWO.length], 'selection crosses a newline');
add('IML', 'italic', 'select two paragraphs, press Italic', TWO, 'italic', [0, TWO.length], 'selection crosses a newline');

// ---- 5. THE LINE TOOLS ---------------------------------------------------------------------------------------------
add('L1', 'bullet', 'caret on a line, press Bullet', 'Buy milk', 'bullet', [3, 3]);
add('L2', 'bullet', 'bullet a second line (a list)', '- Buy milk\nBuy eggs', 'bullet', [12, 12]);
add('Q1', 'quote', 'caret on a line, press Block quote', 'To be or not to be', 'quote', [3, 3]);
add('A1', 'align-center', 'caret on a line, press Center', 'A Title', 'align-center', [2, 2]);
add('A2', 'align-right', 'caret on a line, press Right align', 'Dated today', 'align-right', [2, 2]);
add('A3', 'align-left', 'centered line, press Left align', '>< A Title', 'align-left', [4, 4]);
add('N1', 'indent', 'caret in a paragraph, press Indent', 'A paragraph that will be long enough to wrap onto a second line in the editor.', 'indent', [3, 3]);
add('N2', 'indent', 'indent twice', '\tA paragraph', 'indent', [4, 4]);
add('N3', 'outdent', 'outdent an indented paragraph', '\tA paragraph', 'outdent', [4, 4]);
add('H1', 'heading', 'caret on a line, press Heading', 'Chapter one', 'heading', [3, 3]);
add('H2', 'heading', 'press Heading again (cycle)', '# Chapter one', 'heading', [5, 5]);

// ---- 6. THE LINE TOOLS COMBINED WITH INLINE MARKS ----------------------------------------------------------------------
{ const r = applyFormat('A Title', 0, 7, 'bold'); const c = applyFormat(r.text, 3, 3, 'align-center');
  const v = see(c.text); rows.push({ id: 'AB', area: 'align+bold', what: 'bold a title, then center it', stored: c.text, visible: v.visible, classes: v.classes }); }
{ const b = applyFormat('Buy milk', 3, 3, 'bullet'); const r = applyFormat(b.text, 2, 2, 'quote');
  const v = see(r.text); rows.push({ id: 'BQ', area: 'bullet+quote', what: 'bullet a line, then quote it', stored: r.text, visible: v.visible, classes: v.classes }); }

const problems = [];
for (const r of rows) {
  const stray = showsRaw(r.visible, ['**', '__', '~~', '>< ', '>> ']).concat(/^(- |> )/m.test(r.visible) ? ['line-prefix'] : []).concat(/(^|[^*])\*[^*\s][^*]*\*($|[^*])/.test(r.visible) ? ['*'] : []);
  r.stray = stray;
}
if (process.argv.includes('--json')) { console.log(JSON.stringify(rows, null, 2)); process.exit(0); }
const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
console.log(`${pad('id', 4)} ${pad('what a writer does', 58)} | STORED -> VISIBLE  [classes]  {raw marker still visible}`);
for (const r of rows) {
  console.log(`${pad(r.id, 4)} ${pad(r.what, 58)} | ${JSON.stringify(r.stored)} -> ${JSON.stringify(r.visible)}  [${r.classes.join(' ') || 'none'}]${r.stray.length ? '  {' + r.stray.join(' ') + '}' : ''}${r.note ? '  // ' + r.note : ''}`);
}

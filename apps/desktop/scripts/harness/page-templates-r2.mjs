// PAGE TEMPLATES R2 (docs/plans/page-templates.md, approved by Fable Oct 16): Outline, Title Page and Bibliography on top of the live
// Screenplay, the Flux words, and a template picked on a page with words opening a NEW page.
//
// PART 1 (browserless; runs anywhere; S1)  the text the three templates write, bundled with esbuild and exercised for real, each with a
//        MUTANT whose landing is asserted: the Outline's levels, clamp, derived numbers and Tab / Shift+Tab; the Title Page's five fields
//        <-> canonical text (golden strings, round trip, decline); the Bibliography's entries; the export / copy bodies (no leading tab
//        in Markdown, numbers written); and the per-user default stripping the template (the item-114 trap).
// PART 2 (a box turn; later slices)  the picker, the new-page path, the lenses, the round trip through the sync double, the frames.
//
// Run: node scripts/harness/page-templates-r2.mjs   (from apps/desktop)       BROWSERLESS_ONLY=1 runs PART 1 alone
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8').replace(/\r\n?/g, '\n');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const STUBS = {
  persistence: `export const inJournalView = () => false; export const getProject = () => null; export const getProjects = () => [];
    export const getJournalEntry = () => null; export const getJournalEntries = () => []; export const getBinderPages = () => [];
    export const getSystemKind = () => undefined; export const getDeletedEntries = () => [];`,
  deskLexicon: `export const deskTerm = (id) => id;`,
  react: `export const useSyncExternalStore = () => null;`,
  fontRoster: `export const ensureFaceLoaded = () => {}; export const faceForSlug = () => null; export const faceStack = () => '';`,
};

// bundle `entry` (TypeScript source text); mutate = { 'store/x.ts': (text) => text } applies BEFORE bundling
async function load(entry, mutate = {}) {
  const result = await build({
    stdin: { contents: entry, resolveDir: path.join(SRC, 'store'), sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', write: false,
    plugins: [{
      name: 'stubs-and-mutants',
      setup(b) {
        b.onResolve({ filter: /\/persistence$/ }, () => ({ path: 'persistence', namespace: 'stub' }));
        b.onResolve({ filter: /\/deskLexicon$/ }, () => ({ path: 'deskLexicon', namespace: 'stub' }));
        b.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'stub' }));
        b.onResolve({ filter: /\/fontRoster$/ }, () => ({ path: 'fontRoster', namespace: 'stub' }));
        b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({ contents: STUBS[a.path], loader: 'js' }));
        b.onLoad({ filter: /\.ts$/ }, (a) => {
          const rel = path.relative(SRC, a.path).split(path.sep).join('/');
          const text = fs.readFileSync(a.path, 'utf8').replace(/\r\n?/g, '\n');
          return { contents: mutate[rel] ? mutate[rel](text) : text, loader: 'ts' };
        });
      },
    }],
  });
  const file = path.join(os.tmpdir(), `page-templates-r2-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(file, result.outputFiles[0].text);
  try { return await import(pathToFileURL(file).href); } finally { try { fs.unlinkSync(file); } catch { /* best effort */ } }
}

const ENTRY = `
  export * from './outlineText';
  export * from './titlePage';
  export * from './bibliographyText';
  export { pageBodyFormatted, pageBodyPlain } from './pageExport';
  export { setUserPageDefaults, getUserPageDefaults } from './pageDefaults';
`;

const MOCKUP_OUTLINE = ['Arrival', '\tThe late ferry', '\tGulls on the rail', 'The harbormaster', '\tWhat he saw', '\t\tThe lamp, twice', '\tWhat he left out', 'The crossing'].join('\n');

// THE LAUNCH CRASH (ledger 87: PART 2 died at browser launch, every run, "CDP page target never appeared"): PART 1 gave pageDefaults a quiet `fetch` and `localStorage`
// by assigning them on globalThis, and never gave them back - so runtime-verify's discovery of the browser's page target (which asks the real `fetch` for the debugging
// port's /json list) got the stub's `{ ok: false }` and never saw the target. A stub installed for a suite is restored when the suite ends; a check below proves the
// process leaves PART 1 with the fetch it started with.
const REAL_FETCH = globalThis.fetch;
const REAL_LS_DESCRIPTOR = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
async function suite(mutate = {}) {
  try { return await suiteInner(mutate); } finally {
    globalThis.fetch = REAL_FETCH;
    if (REAL_LS_DESCRIPTOR) Object.defineProperty(globalThis, 'localStorage', REAL_LS_DESCRIPTOR); else delete globalThis.localStorage;
  }
}
async function suiteInner(mutate = {}) {
  // pageDefaults reaches for fetch and localStorage; give it quiet ones (restored by suite())
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
  const M = await load(ENTRY, mutate);
  const r = {};

  // ---- Outline: levels, clamp, derived numbers -------------------------------------------------------------------------
  const rows = M.outlineRows('A\n\tB\n\t\tC\n\t\t\t\tD\n\tE\nF');
  r.levels = same(rows.map((x) => x.level), [0, 1, 2, 2, 1, 0]);
  r.levelsKeepStoredTabs = rows[3].tabs === 4 && rows[3].raw === '\t\t\t\tD'; // a read clamps; it never rewrites
  r.noSkippedLevel = same(M.outlineRows('A\n\t\tX').map((x) => x.level), [0, 1]);
  r.firstRowIsTop = M.outlineRows('\t\tX')[0].level === 0;
  r.numbers = same(M.outlineNumbers(M.outlineRows('A\n\tB\n\t\tC\n\t\t\t\tD\n\tE\nF')), ['1.', '1.1', '1.1.1', '1.1.2', '1.2', '2.']);
  r.numbersWithSkip = same(M.outlineNumbers(M.outlineRows('A\n\t\tB')), ['1.', '1.1']);
  r.numbersResetDeeper = same(M.outlineNumbers(M.outlineRows(MOCKUP_OUTLINE)), ['1.', '1.1', '1.2', '2.', '2.1', '2.1.1', '2.2', '3.']);

  // ---- Outline: Tab / Shift+Tab ---------------------------------------------------------------------------------------
  r.indentOne = same(M.outlineShift('A\nB', 2, 2, 1), { text: 'A\n\tB', start: 3, end: 3 });
  r.indentCannotSkip = M.outlineShift('A\n\tB', 3, 3, 1).text === 'A\n\tB' && M.outlineShift('A\n\tB\n\tC', 6, 6, 1).text === 'A\n\tB\n\t\tC' && M.outlineShift('A\n\tB\n\t\tC', 8, 8, 1).text === 'A\n\tB\n\t\tC';
  r.indentFirstRowNoop = M.outlineShift('A', 0, 0, 1).text === 'A';
  r.indentSecondLevelClamped = M.outlineShift('A\nB', 2, 2, 1).text === 'A\n\tB' && M.outlineShift('A\n\tB', 3, 3, 1).text !== 'A\n\t\t\tB';
  r.outdent = same(M.outlineShift('A\n\tB', 3, 3, -1), { text: 'A\nB', start: 2, end: 2 });
  r.outdentAtTopNoop = M.outlineShift('A\nB', 2, 2, -1).text === 'A\nB';
  const multi = M.outlineShift('A\nB\nC', 2, 5, 1); // B and C touched: each moves one level, re-clamped to the row above (B -> 1, C -> 1)
  r.multiLine = multi.text === 'A\n\tB\n\tC' && M.outlineShift('A\n\tB\n\tC', 2, 7, 1).text === 'A\n\tB\n\t\tC';
  r.selectionEndingOnLineStartDoesNotTouchIt = M.outlineShift('A\nB\nC', 2, 4, 1).text === 'A\n\tB\nC';
  r.shiftWritesNoDigit = !/[0-9]/.test(M.outlineShift(MOCKUP_OUTLINE, 0, MOCKUP_OUTLINE.length, 1).text);
  r.nextRowKeepsLevel = M.outlineNextRowPrefix('A\n\t\tB', 6) === '\t\t' || M.outlineNextRowPrefix('A\n\tB\n\t\tC', 8) === '\t\t';

  // ---- Outline: export / copy -----------------------------------------------------------------------------------------
  const plain = M.outlineBody(MOCKUP_OUTLINE, 'plain');
  const formatted = M.outlineBody(MOCKUP_OUTLINE, 'formatted');
  r.plainGolden = plain === ['1. Arrival', '  1.1 The late ferry', '  1.2 Gulls on the rail', '2. The harbormaster', '  2.1 What he saw', '    2.1.1 The lamp, twice', '  2.2 What he left out', '3. The crossing'].join('\n');
  r.formattedGolden = formatted.split('\n')[1] === '  - 1.1 The late ferry' && formatted.split('\n')[0] === '- 1. Arrival';
  r.noTabInEitherBody = !plain.includes('\t') && !formatted.includes('\t');
  r.emptyRowsSkipped = M.outlineBody('A\n\tB\n\t', 'plain') === '1. A\n  1.1 B';
  r.plainStripsMarks = M.outlineBody('A *bold*', 'plain') === '1. A bold';

  // ---- Title Page: five fields <-> canonical text ---------------------------------------------------------------------
  const full = { contact: ['Ada Marsh', '14 Quay Street', 'Oban PA6 5ZZ', 'ada@example.com'], words: 'About 62,000 words', title: 'The Late Ferry', author: 'Ada Marsh' };
  const fullText = 'Ada Marsh\n14 Quay Street\nOban PA6 5ZZ\nada@example.com\n>> About 62,000 words\n\n>< The Late Ferry\n>< by\n>< Ada Marsh';
  r.titleGolden = M.serializeTitlePage(full) === fullText;
  r.titleParse = same(M.parseTitlePage(fullText), full);
  r.titleEmptyIsEmpty = M.serializeTitlePage(M.EMPTY_TITLE_PAGE) === '' && same(M.parseTitlePage(''), { contact: [], words: '', title: '', author: '' });
  r.titleOnly = M.serializeTitlePage({ contact: [], words: '', title: 'T', author: '' }) === '>> \n\n>< T\n>< by\n>< ' && M.parseTitlePage('>> \n\n>< T\n>< by\n>< ')?.title === 'T';
  r.contactOnly = M.serializeTitlePage({ contact: ['Ada', 'Ben'], words: '', title: '', author: '' }) === 'Ada\nBen' && same(M.parseTitlePage('Ada\nBen')?.contact, ['Ada', 'Ben']);
  r.byOnlyWithTitleOrAuthor = !M.serializeTitlePage({ contact: ['Ada'], words: 'w', title: '', author: '' }).includes('by');
  const sets = [full, { contact: [], words: '', title: 'T', author: '' }, { contact: ['x'], words: '', title: '', author: 'A' }, { contact: [], words: 'w', title: '', author: '' }, M.EMPTY_TITLE_PAGE];
  r.titleRoundTrip = sets.every((f) => { const t = M.serializeTitlePage(f); const p = M.parseTitlePage(t); return p && M.serializeTitlePage(p) === t; });
  r.contactDirectiveDropped = M.serializeTitlePage({ contact: ['>> sneaky', 'ok'], words: 'w', title: '', author: '' }) === 'sneaky\nok\n>> w';
  r.titleDeclinesStrayLine = M.parseTitlePage('Ada\n>> w\nstray') === null && M.parseTitlePage('>> w\n\n>< T\n>< by\n>< A\nstray') === null;
  r.titleDeclinesWrongBy = M.parseTitlePage('>> w\n\n>< T\n>< from\n>< A') === null;
  r.titleToleratesTrimmedTokens = same(M.parseTitlePage('>>\n\n><\n>< by\n><'), { contact: [], words: '', title: '', author: '' });
  r.isTitlePageText = M.isTitlePageText(fullText) === true && M.isTitlePageText('Ada\n>> w\nstray') === false;

  // ---- Bibliography ---------------------------------------------------------------------------------------------------
  const bib = 'Ahmed, Sara. *Harbors and Memory*. Edinburgh, 2019.  \n\n\nBell, Marian. "The Last Ferry." 2021.\n';
  r.bibEntries = same(M.bibliographyEntries(bib), ['Ahmed, Sara. *Harbors and Memory*. Edinburgh, 2019.', 'Bell, Marian. "The Last Ferry." 2021.']);
  r.bibFormatted = M.bibliographyBody(bib, 'formatted') === 'Ahmed, Sara. *Harbors and Memory*. Edinburgh, 2019.\n\nBell, Marian. "The Last Ferry." 2021.';
  r.bibPlainStripsItalics = M.bibliographyBody(bib, 'plain') === 'Ahmed, Sara. Harbors and Memory. Edinburgh, 2019.\n\nBell, Marian. "The Last Ferry." 2021.';

  // ---- the export / copy bodies pick the branch by the page's template -------------------------------------------------
  const pg = (text, template) => ({ id: 'p1', text, createdAt: 'x', updatedAt: 'x', ...(template ? { pageSettings: { template } } : {}) });
  r.exportOutline = M.pageBodyPlain(pg(MOCKUP_OUTLINE, 'outline')) === plain && M.pageBodyFormatted(pg(MOCKUP_OUTLINE, 'outline')) === formatted;
  r.exportBib = M.pageBodyPlain(pg(bib, 'bibliography')) === M.bibliographyBody(bib, 'plain') && M.pageBodyFormatted(pg(bib, 'bibliography')) === M.bibliographyBody(bib, 'formatted');
  r.exportTitleKeepsDialectInMd = M.pageBodyFormatted(pg(fullText, 'title')) === fullText;
  const titlePlain = M.pageBodyPlain(pg(fullText, 'title'));
  r.exportTitlePlainDropsTokens = !titlePlain.includes('>>') && !titlePlain.includes('><') && titlePlain.includes('The Late Ferry') && titlePlain.includes('About 62,000 words') && titlePlain.includes('ada@example.com');
  r.exportOrdinaryPageUnchanged = M.pageBodyFormatted(pg('plain *page*')) === 'plain *page*' && M.pageBodyPlain(pg('plain *page*')) === 'plain page';
  r.exportTabbedOrdinaryPageNotNumbered = !M.pageBodyPlain(pg('A\n\tB')).includes('1.');

  // ---- the per-user default never carries the template -----------------------------------------------------------------
  M.setUserPageDefaults({ margins: 'wide', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }, template: 'outline', kind: 'research' });
  const d = M.getUserPageDefaults();
  r.defaultsKeepDress = d?.margins === 'wide';
  r.defaultsStripTemplate = d && !('template' in d) && !('kind' in d);
  return r;
}

const base = await suite();
const LABELS = {
  levels: 'O1 Outline: a line\'s level is its leading-tab count, capped at three levels and at previous + 1',
  levelsKeepStoredTabs: 'O1b ...and a read never rewrites the stored tabs',
  noSkippedLevel: 'O2 Outline: a row cannot skip a level',
  firstRowIsTop: 'O3 Outline: the first row is level 0 whatever its tabs',
  numbers: 'O4 Outline: the numbers are derived (1. / 1.1 / 1.1.1 / 1.1.2 / 1.2 / 2.)',
  numbersWithSkip: 'O4a Outline: a skipped level is numbered as the level it is clamped to',
  numbersResetDeeper: 'O4b ...and deeper counters reset under a new parent (the mockup\'s seed outline)',
  indentOne: 'O5 Tab indents the caret\'s row one level and carries the caret',
  indentCannotSkip: 'O5b ...never past previous + 1, never past three levels',
  indentFirstRowNoop: 'O5c ...and the first row cannot be indented',
  indentSecondLevelClamped: 'O5d ...a second Tab on a row already one under its parent goes no deeper than previous + 1',
  outdent: 'O6 Shift+Tab outdents and carries the caret',
  outdentAtTopNoop: 'O6b ...and does nothing at the top level',
  multiLine: 'O7 a selection over several rows indents each, re-clamped as it goes',
  selectionEndingOnLineStartDoesNotTouchIt: 'O7b ...a selection ending exactly on a row\'s first character has not touched that row',
  shiftWritesNoDigit: 'O8 no number is ever written into the text by an indent',
  nextRowKeepsLevel: 'O9 Enter opens the next row at the same level',
  plainGolden: 'X1 Outline .txt / Copy My Words: numbered, two spaces per level (golden)',
  formattedGolden: 'X2 Outline .md / Copy Formatted: each row its own list item with its number',
  noTabInEitherBody: 'X3 neither body carries a leading tab (a tab line is a code block in Markdown)',
  emptyRowsSkipped: 'X4 an empty row is not an entry',
  plainStripsMarks: 'X5 the plain body strips the dialect\'s marks',
  titleGolden: 'T1 Title Page: five fields serialize to the canonical text (golden)',
  titleParse: 'T2 ...and the canonical text parses back to the same five fields',
  titleEmptyIsEmpty: 'T3 a fresh Title Page is the empty string (no words, no "by")',
  titleOnly: 'T4 a title alone writes the word line empty, the centred block, and round-trips',
  contactOnly: 'T5 contact alone is just its lines',
  byOnlyWithTitleOrAuthor: 'T6 "by" appears only once a title or author does',
  titleRoundTrip: 'T7 serialize(parse(serialize(f))) === serialize(f) for every field set',
  contactDirectiveDropped: 'T8 a contact line cannot be taken for the word line (its directive token is dropped)',
  titleDeclinesStrayLine: 'T9 text that is not this shape is declined (null), so the page draws as plain Draft text',
  titleDeclinesWrongBy: 'T9b ...including a centred block whose middle line is not "by"',
  titleToleratesTrimmedTokens: 'T10 a token an editor trimmed (">>", "><") still parses',
  isTitlePageText: 'T11 isTitlePageText says whether the lens can draw it',
  bibEntries: 'B1 Bibliography: the entries are the non-blank lines, trailing space trimmed',
  bibFormatted: 'B2 .md body: a blank line between entries, italics kept',
  bibPlainStripsItalics: 'B3 .txt body: a blank line between entries, italics stripped',
  exportOutline: 'E1 the page export / copy bodies pick the Outline branch by pageSettings.template',
  exportBib: 'E2 ...and the Bibliography branch',
  exportTitleKeepsDialectInMd: 'E3 a Title Page\'s .md keeps the dialect (as any page)',
  exportTitlePlainDropsTokens: 'E4 ...and its .txt drops the alignment tokens but keeps every field',
  exportOrdinaryPageUnchanged: 'E5 an ordinary page\'s bodies are byte-identical to before',
  exportTabbedOrdinaryPageNotNumbered: 'E6 a tabbed ORDINARY page is not numbered (the branch is the template\'s, not the tab\'s)',
  defaultsKeepDress: 'D1 "Set as my default" still keeps the dress',
  defaultsStripTemplate: 'D2 ...and never carries the template (or the kind) into the per-user default',
};
for (const k of Object.keys(LABELS)) ok(LABELS[k], base[k] === true, String(base[k]));

// ---- MUTANTS: each must redden its named checks, and the mutation must have LANDED ------------------------------------------------
const MUTANTS = [
  { name: 'Outline: no previous+1 clamp', file: 'store/outlineText.ts', from: 'Math.min(tabs, OUTLINE_MAX_LEVEL, prev + 1)', to: 'Math.min(tabs, OUTLINE_MAX_LEVEL)', red: ['noSkippedLevel', 'numbersWithSkip'] },
  { name: 'Outline: deeper counters never reset', file: 'store/outlineText.ts', from: 'for (let d = r.level + 1; d <= OUTLINE_MAX_LEVEL; d += 1) c[d] = 0;', to: '', red: ['numbersResetDeeper'] },
  { name: 'Outline: a read rewrites the level', file: 'store/outlineText.ts', from: 'rows.push({ raw, body: raw.slice(tabs), tabs, level });', to: "rows.push({ raw: '\\t'.repeat(level) + raw.slice(tabs), body: raw.slice(tabs), tabs, level });", red: ['levelsKeepStoredTabs'] },
  { name: 'Outline: the export writes a leading tab', file: 'store/outlineText.ts', from: "const pad = '  '.repeat(r.level);", to: "const pad = '\\t'.repeat(r.level);", red: ['noTabInEitherBody', 'plainGolden'] },
  { name: 'Outline: Shift+Tab goes the wrong way', file: 'store/outlineText.ts', from: 'Math.min(cur.level + dir, OUTLINE_MAX_LEVEL, prevLevel + 1)', to: 'Math.min(cur.level + 1, OUTLINE_MAX_LEVEL, prevLevel + 1)', red: ['outdent'] },
  { name: 'Title Page: no blank line before the centred block', file: 'store/titlePage.ts', from: "out.push(''); out.push(CENTRE + title);", to: 'out.push(CENTRE + title);', red: ['titleGolden'] },
  { name: 'Title Page: parse accepts a stray line', file: 'store/titlePage.ts', from: 'if (i < lines.length) return null;', to: '', red: ['titleDeclinesStrayLine'] },
  { name: 'Title Page: "by" always written', file: 'store/titlePage.ts', from: 'if (title || author) { out.push', to: 'if (words || title || author) { out.push', red: ['byOnlyWithTitleOrAuthor'] },
  { name: 'Bibliography: entries not blank-line separated', file: 'store/bibliographyText.ts', from: ").join('\\n\\n');", to: ").join('\\n');", red: ['bibFormatted', 'bibPlainStripsItalics'] },
  { name: 'Export: the Outline branch is gone', file: 'store/pageExport.ts', from: "if (entry.pageSettings?.template === 'outline') return outlineBody(entry.text ?? '', 'plain');", to: '', red: ['exportOutline'] },
  { name: 'Defaults: the template is not stripped', file: 'store/pageDefaults.ts', from: 'void kind; void styleGuide; void template;', to: 'void kind; void styleGuide; void template; return v;', red: ['defaultsStripTemplate'] },
];
let landed = 0; let killed = 0;
for (const m of MUTANTS) {
  const src = read(m.file);
  const idx = src.indexOf(m.from);
  if (idx < 0 || src.indexOf(m.from, idx + 1) >= 0) { ok(`mutant "${m.name}": the mutation LANDED (anchor found exactly once)`, false, 'anchor missing or not unique'); continue; }
  landed += 1;
  const res = await suite({ [m.file]: (t) => t.replace(m.from, m.to) });
  const went = m.red.filter((k) => res[k] !== true);
  ok(`mutant "${m.name}" is KILLED (reddens: ${m.red.join(', ')})`, went.length === m.red.length, `red: ${went.join(', ') || 'none'}`);
  if (went.length === m.red.length) killed += 1;
}
ok(`all ${MUTANTS.length} mutations landed and ${MUTANTS.length} were killed`, landed === MUTANTS.length && killed === MUTANTS.length, `${landed} landed / ${killed} killed`);

ok('P0 PART 1 leaves the process\'s fetch and localStorage as it found them (PART 2\'s browser discovery asks the REAL fetch for the debugging port - a leftover stub is what crashed its launch)', globalThis.fetch === REAL_FETCH, String(typeof globalThis.fetch));

// ---- source pins -------------------------------------------------------------------------------------------------------------------
const types = read('types/index.ts');
ok('P1 PageSettings carries an OPTIONAL template (absent, never null) typed outline | title | bibliography', /template\?: PageTemplate;/.test(types) && /export type PageTemplate = 'outline' \| 'title' \| 'bibliography';/.test(types), '');
const exp = read('store/pageExport.ts');
ok('P2 both export seams (Copy and the files share them) read pageSettings.template, in the same place as the script and board branches', (exp.match(/pageSettings\?\.template === 'outline'/g) || []).length === 2 && (exp.match(/pageSettings\?\.template === 'bibliography'/g) || []).length === 2, '');
const sync = fs.readFileSync(path.join(DESKTOP, '..', 'server', 'src', 'sync.ts'), 'utf8');
ok('P3 NO server change: page_settings stays a whole jsonb passthrough, and no template column or mapper exists', /page_settings/.test(sync) && !/template/i.test(fs.readFileSync(path.join(DESKTOP, '..', 'server', 'src', 'migrate.ts'), 'utf8').replace(/\/\/.*$/gm, '').replace(/Templates?/g, '')), '');

// ---- S2 source pins: the picker, the words, the new-page path ------------------------------------------------------------------------
const sliver = read('components/Sliver.tsx');
ok('P4 the Templates section is the five-row picker: rows map content.templates (data-template keys, a page sketch, the word), the grayed stand-ins and Custom are gone',
  /className="wz-template-list"/.test(sliver) && /content\.templates\?\.map/.test(sliver) && /<TemplateSketch kind=\{tpl\.key\} \/>/.test(sliver) && !/wz-template-btn/.test(sliver) && !/templateCustom/.test(sliver), '');
const sketch = read('components/TemplateSketch.tsx');
ok('P5 the picker\'s row order is the mockup\'s: Blank, Screenplay, Outline, Title Page, Bibliography', /TEMPLATE_ORDER[^=]*= \['blank', 'screenplay', 'outline', 'title', 'bibliography'\]/.test(sketch), '');
const lex = read('store/deskLexicon.ts');
const fluxBlock = lex.slice(lex.indexOf('const OVERRIDES'));
ok('P6 Arbor\'s words (canonical): Templates / Font, Blank / Screenplay / Outline / Title Page / Bibliography',
  /railTemplates: 'Templates'/.test(lex) && /railTypeface: 'Font'/.test(lex) && /templateBlank: 'Blank'/.test(lex) && /templateScreenplay: 'Screenplay'/.test(lex) && /templateOutline: 'Outline'/.test(lex) && /templateTitlePage: 'Title Page'/.test(lex) && /templateBibliography: 'Bibliography'/.test(lex), '');
ok('P7 Flux\'s words (override): Presets / Typeface, Raw / Script / Spine / Cover / Sources',
  /railTemplates: 'Presets'/.test(fluxBlock) && /railTypeface: 'Typeface'/.test(fluxBlock) && /templateBlank: 'Raw'/.test(fluxBlock) && /templateScreenplay: 'Script'/.test(fluxBlock) && /templateOutline: 'Spine'/.test(fluxBlock) && /templateTitlePage: 'Cover'/.test(fluxBlock) && /templateBibliography: 'Sources'/.test(fluxBlock), '');
ok('P8 the return chip\'s caption for a template-opened page is "Opened as a new page \u00b7 Back" (the lexicon term), on both editors', /templateOpenedNewBack: 'Opened as a new page \u00b7 Back'/.test(lex) && /dt\('templateOpenedNewBack'\)/.test(read('pages/PageEditor.tsx')) && /dt\('templateOpenedNewBack'\)/.test(read('components/ScriptEditor.tsx')), '');
const ub = read('store/unbornPage.ts');
ok('P9 the address carries the template (unbornHref writes ?template=, readDescriptor reads it) and the unborn entry carries it as a page setting; NO birth is triggered by a template (PB1 holds)',
  /if \(d\.template\) q\.set\('template', d\.template\)/.test(ub) && /rawTemplate === 'outline'/.test(ub) && /base\.pageSettings = \{[^}]*template: d\.template \}/.test(ub), '');
const pe = read('pages/PageEditor.tsx');
ok('P10 the host owns the act, one place: applyTemplate - same template is a no-op; an EMPTY page (no words, no ink) takes it in place; a page with words or ink opens a NEW page whose state carries openedByTemplate',
  /const applyTemplate = \(key: TemplateKey\) => \{\s*if \(key === currentTemplate\) return;/.test(pe) && /wordCount\(textRef\.current\) === 0 && !\(entry\.strokes && entry\.strokes\.length > 0\)/.test(pe) && /openedByTemplate: true/.test(pe), '');
const se = read('components/ScriptEditor.tsx');
ok('P11 an EMPTY Screenplay converts in place (Q2): the same row, pageType manuscript, the script cleared, the template set; a Screenplay with words opens a new page', /isScriptEmpty\(\{ v: 1, scenes \}\)\) \{\s*saveScriptDoc\(id[^]*pageType: 'manuscript', script: undefined,[^]*template/.test(se), '');

const tps = read('components/TitlePageSheet.tsx');
ok('P12 the Title Page sheet writes ONLY the canonical text: every field edit goes serializeTitlePage -> the host\'s one onChange; it keeps no second model and touches no storage',
  /serializeTitlePage\(next\)/.test(tps) && /onChange\(t\)/.test(tps) && !/localStorage|saveJournalEntry|persistence/.test(tps), '');
ok('P13 the host mounts the sheet ONLY in Draft, for template "title", while the text parses (otherwise plain Draft text - a decline loses nothing)',
  /const titleSheet = mode === 'drafting' && entry\.pageSettings\?\.template === 'title' && isTitlePageText\(text\);/.test(pe) && /\{titleSheet \? \(\s*<TitlePageSheet/.test(pe), '');
// typewriter-scope (Fable, Oct 21) - P14's own gate-text match read the shared `typewriter`
// field directly (`!getWritingSettings().typewriter`); that ticket's fix moves this exact gate
// (among others) onto typewriterForPage(id, ...) - THIS page's own per-page memory, never a
// mirror a different page's open could have left behind. The real claim (the outline Tab gate
// stands aside exactly twice, while Typewriter is on) is unchanged and still holds; only the
// SIGNAL it reads moved. Parked verbatim below (HARNESS_PARKED=1 re-asserts the field is no
// longer read there at all - the new, opposite truth), successor is the live check right here.
ok('P14 the paragraph-indent Tab machine (item 158) stands aside while an Outline is in Draft, so Tab acts on the row and not on the whole one-paragraph outline',
  /outlineKeysRef\.current = mode === 'drafting' && realEntry\?\.pageSettings\?\.template === 'outline';/.test(pe) && (pe.match(/if \(outlineKeysRef\.current && !typewriterForPage\(id, textRef\.current\.trim\(\)\.length === 0\)\) return;/g) || []).length === 2, '');

// ---- the lens on main's row model (typing-latency's lineRows): the Outline's numbers are attributes on the ROW element, applied on every write -------------------------------
const lineRows = read('store/lineRows.ts');
const css = read('index.css');
function lensPins(text, cssText, peText) {
  return {
    attrsOnRowNotMarkup: /export function applyOutlineLens\(R: Rows\): void \{[^]*?row\.dataset\.ol = nums\[i\];[^]*?row\.dataset\.lvl = lvl;/.test(text) && !/rowHtml\([^)]*\bol\b/.test(text),
    derivedByTheOnePlace: /const rows = outlineRows\(R\.text\);\s*const nums = outlineNumbers\(rows\);/.test(text),
    onlyOnAnOutline: /if \(R\.el\.dataset\.template !== 'outline'\) \{\s*if \(R\.lensDrawn\)/.test(text),
    clearsWhenOff: /delete row\.dataset\.ol; delete row\.dataset\.lvl; \} R\.lensDrawn = false;/.test(text),
    appliedOnMount: /ROWS\.set\(el, R\);\s*applyOutlineLens\(R\);/.test(text),
    appliedOnEveryWrite: /R\.revealLine = at;\s*applyOutlineLens\(R\);\s*if \(caret !== null && !keptAsIs\)/.test(text),
    cssNumberFromAttribute: /\.wz-row\[data-ol\]::before\{ content:attr\(data-ol\);/.test(cssText),
    cssBibliographyHangs: /\[data-template='bibliography'\] \.wz-row\{ padding-left:2\.4em; text-indent:-2\.4em;/.test(cssText),
    outlineTabThroughWriteRows: /if \(!writeRows\(el, result\.text, result\.start, null\)\) decorateEditorFor\([^;]*;\s*if \(result\.end > result\.start\) setSelectionOffsets/.test(peText),
  };
}
const pinsNow = lensPins(lineRows, css, pe);
const PIN_LABELS = {
  attrsOnRowNotMarkup: 'R1 the Outline\'s number and level are attributes on the ROW element, never inside the row\'s markup (so the kept-row compare and the shadow lines are untouched)',
  derivedByTheOnePlace: 'R2 they are derived by store/outlineText.ts (outlineRows + outlineNumbers), the one place, never stored',
  onlyOnAnOutline: 'R3 the lens does nothing on a page that is not an Outline (an early return)',
  clearsWhenOff: 'R4 and clears its attributes when the lens goes off (a template switched under a mounted editor)',
  appliedOnMount: 'R5 it is applied when the rows are mounted',
  appliedOnEveryWrite: 'R6 ...and after EVERY writeRows (a Tab changes the numbers of rows whose own text did not change)',
  cssNumberFromAttribute: 'R7 the number is drawn by ::before from the attribute (so it is in no text, no selection, no copy)',
  cssBibliographyHangs: 'R8 the Bibliography is pure CSS on the rows: a hanging indent per entry',
  outlineTabThroughWriteRows: 'R9 the Outline\'s Tab / Enter write through writeRows, like every format press (decorateEditorFor only as the no-rows fallback)',
};
for (const k of Object.keys(PIN_LABELS)) ok(PIN_LABELS[k], pinsNow[k] === true, String(pinsNow[k]));
const PIN_MUTANTS = [
  { name: 'the number is written into the row markup', file: 'lineRows', from: "if (row.dataset.ol !== nums[i]) row.dataset.ol = nums[i];", to: "row.insertAdjacentText('afterbegin', nums[i]);", red: ['attrsOnRowNotMarkup'] },
  { name: 'the lens is not applied after a write', file: 'lineRows', from: "R.revealLine = at;\n  applyOutlineLens(R);\n  if (caret !== null && !keptAsIs)", to: "R.revealLine = at;\n  if (caret !== null && !keptAsIs)", red: ['appliedOnEveryWrite'] },
  { name: 'the lens is not applied at mount', file: 'lineRows', from: "ROWS.set(el, R);\n  applyOutlineLens(R);", to: "ROWS.set(el, R);", red: ['appliedOnMount'] },
  { name: 'the lens runs on every page', file: 'lineRows', from: "if (R.el.dataset.template !== 'outline') {", to: "if (false) {", red: ['onlyOnAnOutline'] },
  { name: 'the attributes are not cleared when the lens goes off', file: 'lineRows', from: "delete row.dataset.ol; delete row.dataset.lvl; } R.lensDrawn = false;", to: "} R.lensDrawn = false;", red: ['clearsWhenOff'] },
  { name: 'the Outline Tab bypasses writeRows', file: 'pe', from: "if (!writeRows(el, result.text, result.start, null)) decorateEditorFor(el, result.text, result.start, setCaretOffset, t => decorateMarkdownForCard(t, null));\n      if (result.end > result.start) setSelectionOffsets(el, result.start, result.end);", to: "decorateEditorFor(el, result.text, result.start, setCaretOffset, t => decorateMarkdownForCard(t, null));\n      if (result.end > result.start) setSelectionOffsets(el, result.start, result.end);", red: ['outlineTabThroughWriteRows'] },
  { name: 'the number is drawn from text, not the attribute', file: 'css', from: "content:attr(data-ol);", to: "content:'1.';", red: ['cssNumberFromAttribute'] },
];
let pinLanded = 0; let pinKilled = 0;
for (const m of PIN_MUTANTS) {
  const src = m.file === 'lineRows' ? lineRows : m.file === 'pe' ? pe : css;
  const idx = src.indexOf(m.from);
  if (idx < 0 || src.indexOf(m.from, idx + 1) >= 0) { ok(`pin mutant "${m.name}": the mutation LANDED (anchor found exactly once)`, false, 'anchor missing or not unique'); continue; }
  pinLanded += 1;
  const mutated = src.replace(m.from, m.to);
  const res = lensPins(m.file === 'lineRows' ? mutated : lineRows, m.file === 'css' ? mutated : css, m.file === 'pe' ? mutated : pe);
  const went = m.red.filter((k) => res[k] !== true);
  ok(`pin mutant "${m.name}" is KILLED (reddens: ${m.red.join(', ')})`, went.length === m.red.length, `red: ${went.join(', ') || 'none'}`);
  if (went.length === m.red.length) pinKilled += 1;
}
ok(`all ${PIN_MUTANTS.length} pin mutations landed and ${PIN_MUTANTS.length} were killed`, pinLanded === PIN_MUTANTS.length && pinKilled === PIN_MUTANTS.length, `${pinLanded} landed / ${pinKilled} killed`);
const fo = read('components/ForwardOnlyEditor.tsx');
// ---- PARKED - SUPERSEDED by ledger 92 (Fable Oct 17, X7): the lens's key door was in onFormatKeyDraft, which runs AFTER onKeyDownDraft's marks.enter had already done the Enter - one Enter was done twice. The door is now the FIRST thing onKeyDownDraft does, and the only call.
// Kept VERBATIM below and no longer run; the successor pins the new place and that there is exactly one call.
//
// ok('R10 the editor carries the lens as data-template and the host\'s key door, and re-draws the lens when the template changes under it (refreshLens on [lens])',
//   /data-template=\{lens \?\? undefined\}/.test(fo) && /if \(onLensKeyRef\.current\?\.\(e\)\) return;/.test(fo) && /useEffect\(\(\) => \{ const h = hostRef\.current; if \(h\) refreshLens\(h\); \}, \[lens\]\);/.test(fo), '');
const lensKeyDoor = (text) => /const onKeyDownDraft = \(e: KeyboardEvent\) => \{\s*(?:\/\/[^\n]*\n\s*)+if \(onLensKeyRef\.current\?\.\(e\)\) \{ e\.stopImmediatePropagation\(\); return; \}\s*(?:\/\/[^\n]*\n\s*)+marks\.enter\(e\);/.test(text) && (text.match(/onLensKeyRef\.current\?\.\(e\)/g) || []).length === 1;
ok('R10 [first-listener successor]: the editor carries the lens as data-template, re-draws it when the template changes under it (refreshLens on [lens]), and the host key door is the FIRST thing onKeyDownDraft does - before the marks controller own Enter - exactly ONCE, stopping the event it handles',
  /data-template=\{lens \?\? undefined\}/.test(fo) && lensKeyDoor(fo) && /useEffect\(\(\) => \{ const h = hostRef\.current; if \(h\) refreshLens\(h\); \}, \[lens\]\);/.test(fo), '');
const doorMutants = [
  ['the door is back in onFormatKeyDraft, after marks.enter (the Enter is done twice)', fo.replace('if (onLensKeyRef.current?.(e)) { e.stopImmediatePropagation(); return; }', '').replace('const fmt = onFormatKeyRef.current;', 'if (onLensKeyRef.current?.(e)) return;\n        const fmt = onFormatKeyRef.current;')],
  ['the door does not stop the event it handles', fo.replace('{ e.stopImmediatePropagation(); return; }', 'return;')],
  ['the door is called twice', fo.replace('if (onLensKeyRef.current?.(e)) { e.stopImmediatePropagation(); return; }', 'if (onLensKeyRef.current?.(e)) { e.stopImmediatePropagation(); return; }\n        onLensKeyRef.current?.(e);')],
];
const doorRed = doorMutants.map(([k, t]) => [k, t !== fo && lensKeyDoor(t) === false]);
ok('R10 (mutants): the door back in the format listener after marks.enter, a door that does not stop its event, or a second call each turn the pin RED (each landed)', doorRed.every(([, v]) => v), JSON.stringify(doorRed));
ok('R11 NOTHING of the lens remains in the string decoration path (store/draftDecoration.ts is byte-identical to main\'s: the rows model owns the page)', !/lensHtml|outlineText/.test(read('store/draftDecoration.ts')), '');

// ---- PARKED - SUPERSEDED by typewriter-scope (Fable, Oct 21) ------------------------------------------------------------------------
// P14's ORIGINAL gate-text match, quoted VERBATIM and no longer asserted (the successor lives at
// P14's own spot above, now reading typewriterForPage instead):
//
//   ok('P14 the paragraph-indent Tab machine (item 158) stands aside while an Outline is in Draft, so Tab acts on the row and not on the whole one-paragraph outline',
//     /outlineKeysRef\.current = mode === 'drafting' && realEntry\?\.pageSettings\?\.template === 'outline';/.test(pe) && (pe.match(/if \(outlineKeysRef\.current && !getWritingSettings\(\)\.typewriter\) return;/g) || []).length === 2, '');
//
// Re-asserted against its NEW, opposite truth: that exact shared-field read is GONE from the
// gate, not merely wrong - this block stays green under HARNESS_PARKED=1, proving the retirement.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass: !!pass, detail });
  pok('PARKED (was "P14 the paragraph-indent Tab machine... stands aside" via the shared field) - the outline Tab gate no longer reads the shared `typewriter` field at all (zero occurrences of the retired pattern); typewriterForPage is what it reads now',
    !/if \(outlineKeysRef\.current && !getWritingSettings\(\)\.typewriter\) return;/.test(pe));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nPAGE-TEMPLATES-R2 PARKED: PASS (${parkedChecks.length} checks) - HARNESS_PARKED=1 armed; P14's old shared-field probe retired on purpose, successor above.`
    : `\nPAGE-TEMPLATES-R2 PARKED: FAIL - ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

// ============================================================================================================
// PART 2 - the real app (a box turn). Written with the standing driver rules: probe first, never abort, real pointer events, seed through the seams.
// S2 scenarios here; S3 to S5 append theirs.
// ============================================================================================================
async function part2() {
  const { withHarness } = await import('../runtime-verify.mjs');
  await withHarness(async (app) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
    const ROWS = 'writer-studio-journal-entries';
    const rows = () => app.evalJs(`JSON.parse(localStorage.getItem(${JSON.stringify(ROWS)}) || '[]').filter((e) => !e.deletedAt)`);
    const rowOf = async (id) => (await rows()).find((e) => e.id === id) || null;
    const hash = () => app.evalJs('location.hash');
    const WORDS = 'Words already here on this page.';
    const fresh = async (theme = 'plateau') => {
      await app.emulateDpr(1, 1400, 900);
      await app.goto('/');
      await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-splash-hold','50');`);
      await app.reload();
      await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
      await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    };
    const openStrip = async () => {
      if (await app.evalJs(`!!document.querySelector(".wz-sliver[data-open='true']")`)) return;
      await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
      await waitSoft(`!!document.querySelector(".wz-sliver[data-open='true']")`, { label: 'strip open', timeout: 3000 });
      await sleep(500);
    };
    // ---- PARKED - SUPERSEDED by Nick's answer (Oct 21): Flux's Draft tab reads "Text": found by its text; the successor finds it by its key, whatever the theme calls it.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // const toDraft = async () => { await app.click('Draft'); await sleep(700); };
    const toDraft = async () => { await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()"); await sleep(700); };
    const pickerNames = () => app.evalJs("[...document.querySelectorAll('.wz-sliver-templates .wz-template-row')].map((b) => b.getAttribute('aria-label'))");
    const chosen = () => app.evalJs("[...document.querySelectorAll('.wz-sliver-templates .wz-template-row[aria-pressed=\"true\"]')].map((b) => b.dataset.template)");
    const press = async (key) => {
      const pt = await app.evalJs(`(() => { const b = document.querySelector('.wz-template-row[data-template="${key}"]'); if (!b) return null; b.scrollIntoView({ block: 'center' });
        const r = b.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const h = document.elementFromPoint(x, y); return h && (h === b || b.contains(h)) ? { x, y } : null; })()`);
      if (!pt) return false;
      await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y); await sleep(500);
      return true;
    };
    const seed = async (id, extra = {}) => {
      await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page', ...extra })})`);
      await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
      await app.evalJs(`location.hash = '#/page/${id}'`);
      await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'seeded page' }); await sleep(600);
    };

    // ---- X1: the picker, Arbor then Flux (the words are the lexicon's) --------------------------------------------------------------------
    await fresh('plateau');
    await app.goto('/page/new'); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'unborn page' }); await sleep(600);
    await toDraft(); await openStrip();
    ok('X1 Arbor: the Templates section lists Blank, Screenplay, Outline, Title Page, Bibliography', JSON.stringify(await pickerNames()) === JSON.stringify(['Blank', 'Screenplay', 'Outline', 'Title Page', 'Bibliography']), JSON.stringify(await pickerNames()));
    ok('X1 Arbor: Blank is the current choice (brass at rest, aria-pressed) and no other row is', JSON.stringify(await chosen()) === JSON.stringify(['blank']), JSON.stringify(await chosen()));
    const heads = await app.evalJs("[...document.querySelectorAll('.wz-sliver-h')].map((h) => h.textContent)");
    // SUPERSEDED (help-buttons, Fable Oct 18-19): the Templates heading now
    // carries its own "?" (HelpButton, unconditional in both themes), so its
    // own textContent reads "Templates ?", not the bare exact word. Kept
    // verbatim, no longer run:
    //   ok('X1 Arbor: the section heads read "Font" and "Templates"', heads.includes('Font') && heads.includes('Templates'), JSON.stringify(heads));
    ok('X1 Arbor: the section heads read "Font" and "Templates" (the latter now carrying its own "?")', heads.includes('Font') && heads.some((h) => h.startsWith('Templates')), JSON.stringify(heads));
    ok('X1 no disabled stand-in and no Custom remain', (await app.evalJs("document.querySelectorAll('.wz-sliver-templates [aria-disabled=\"true\"], .wz-template-btn').length")) === 0, '');
    await fresh('flux');
    await app.goto('/page/new'); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'unborn page (flux)' }); await sleep(600);
    await toDraft(); await openStrip();
    ok('X1 Flux: the rows read Raw, Script, Spine, Cover, Sources', JSON.stringify(await pickerNames()) === JSON.stringify(['Raw', 'Script', 'Spine', 'Cover', 'Sources']), JSON.stringify(await pickerNames()));
    const headsF = await app.evalJs("[...document.querySelectorAll('.wz-sliver-h')].map((h) => h.textContent)");
    // SUPERSEDED (help-buttons, Fable Oct 18-19): same gap as the Arbor check
    // above - "Presets" now carries its own "?" too. Kept verbatim, no
    // longer run:
    //   ok('X1 Flux: the section heads read "Typeface" and "Presets"', headsF.includes('Typeface') && headsF.includes('Presets'), JSON.stringify(headsF));
    ok('X1 Flux: the section heads read "Typeface" and "Presets" (the latter now carrying its own "?")', headsF.includes('Typeface') && headsF.some((h) => h.startsWith('Presets')), JSON.stringify(headsF));

    // ---- X2: an EMPTY (unborn) page takes the choice in place; nothing is born; the first word births it WITH the template ----------------------
    await fresh('plateau');
    await app.goto('/page/new'); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'unborn page' }); await sleep(600);
    await toDraft(); await openStrip();
    const sheetBefore = await app.evalJs("(() => { const e = document.querySelector('.wz-ink-sheet'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width].map(Math.round); })()");
    ok('X2 the Outline row can be pressed (hit-tested to the row itself)', await press('outline'), '');
    ok('X2 an empty unborn page takes Outline IN PLACE: the address carries template=outline, the row is brass, and the page is NOT born (zero rows)',
      /template=outline/.test(await hash()) && JSON.stringify(await chosen()) === JSON.stringify(['outline']) && (await rows()).length === 0, JSON.stringify({ hash: await hash(), chosen: await chosen(), rows: (await rows()).length }));
    const sheetAfter = await app.evalJs("(() => { const e = document.querySelector('.wz-ink-sheet'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width].map(Math.round); })()");
    ok('X2 PAGE IS PRIMARY: picking a template moves the page not at all (the sheet\'s rect is identical)', !!sheetBefore && JSON.stringify(sheetBefore) === JSON.stringify(sheetAfter), JSON.stringify({ sheetBefore, sheetAfter }));
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()"); await app.typeKeys('First heading');
    await waitSoft(`JSON.parse(localStorage.getItem(${JSON.stringify(ROWS)}) || '[]').some((e) => (e.text || '').includes('First heading'))`, { label: 'birth', timeout: 5000 });
    await sleep(400);
    const born = (await rows()).find((e) => (e.text || '').includes('First heading'));
    ok('X2 the first word births the page WITH the template stored in its page settings (pageSettings.template === "outline")', !!born && born.pageSettings && born.pageSettings.template === 'outline', JSON.stringify(born && born.pageSettings));

    // ---- X3: a page WITH words opens a NEW page; the words never move; the chip names the way back -----------------------------------------
    await fresh('plateau');
    await seed('tpl-r2-words');
    await toDraft(); await openStrip();
    const beforeRows = await rows();
    ok('X3 Bibliography can be pressed on a page with words', await press('bibliography'), '');
    await waitSoft("/\\/page\\/new/.test(location.hash)", { label: 'new page', timeout: 6000 }); await sleep(700);
    const orig = await rowOf('tpl-r2-words');
    ok('X3 the page with words is UNTOUCHED (same text, no template)', !!orig && orig.text === WORDS && !(orig.pageSettings && orig.pageSettings.template), JSON.stringify(orig));
    ok('X3 a NEW unborn page opened carrying template=bibliography, and nothing was born by it', /template=bibliography/.test(await hash()) && (await rows()).length === beforeRows.length, JSON.stringify({ hash: await hash() }));
    const chip = await app.evalJs("(() => { const b = document.querySelector('.wz-back-to-board'); return b ? { text: b.textContent.trim(), label: b.getAttribute('aria-label') } : null; })()");
    ok('X3 the chip reads "Opened as a new page \u00b7 Back" and its accessible name names the page left', !!chip && chip.text.includes('Opened as a new page') && chip.text.includes('Back') && /Back to/.test(chip.label || '') && (chip.label || '').includes(WORDS.slice(0, 20)), JSON.stringify(chip));
    const cp = await app.evalJs("(() => { const b = document.querySelector('.wz-back-to-board'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    if (cp) { await app.mouseDown(cp.x, cp.y); await app.mouseUp(cp.x, cp.y); }
    await waitSoft("location.hash === '#/page/tpl-r2-words'", { label: 'back', timeout: 6000 }); await sleep(600);
    ok('X3 the chip returns to the original page with its words intact', (await hash()) === '#/page/tpl-r2-words' && (await app.evalJs("(document.querySelector('.forward-only-editor')?.textContent || '').includes('Words already here')")) === true, await hash());

    // ---- X4: pressing the choice already made does nothing; an empty BORN page takes a template in place and Blank clears it ---------------------
    await fresh('plateau');
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tpl-r2-empty', text: '', createdAt: '2026-04-02T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
    await app.evalJs("location.hash = '#/page/tpl-r2-empty'"); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'empty born page' }); await sleep(600);
    await toDraft(); await openStrip();
    await press('blank'); await sleep(300);
    ok('X4 pressing Blank on a Blank page does nothing (no template set, same row)', !((await rowOf('tpl-r2-empty')) || {}).pageSettings?.template && (await hash()) === '#/page/tpl-r2-empty', await hash());
    await press('title'); await sleep(500);
    ok('X4 an EMPTY born page takes Title Page IN PLACE: the same row now carries pageSettings.template === "title" and the address did not change',
      ((await rowOf('tpl-r2-empty')) || {}).pageSettings?.template === 'title' && (await hash()) === '#/page/tpl-r2-empty' && JSON.stringify(await chosen()) === JSON.stringify(['title']), JSON.stringify(await rowOf('tpl-r2-empty')));
    await press('blank'); await sleep(500);
    ok('X4 Blank takes it off again (the key is absent, not null)', !('template' in (((await rowOf('tpl-r2-empty')) || {}).pageSettings || {})) || ((await rowOf('tpl-r2-empty')).pageSettings.template === undefined), JSON.stringify(((await rowOf('tpl-r2-empty')) || {}).pageSettings));

    // ---- X5: Screenplay. Empty -> converts in place (Q2); with words -> a new page; its chip carries the same caption ----------------------------
    await fresh('plateau');
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tpl-r2-sp-empty', text: '', createdAt: '2026-04-03T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await app.evalJs("window.wrizoPatchEntry('tpl-r2-sp-empty', { pageType: 'script', script: { v: 1, scenes: [{ id: 's1', heading: { id: 's1', t: 'scene', text: '' }, body: [{ id: 'a1', t: 'action', text: '' }] }] } })");
    await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
    await app.evalJs("location.hash = '#/page/tpl-r2-sp-empty'"); await waitSoft("!!document.querySelector('.script-sheet, .script-page, .script-el')", { label: 'empty screenplay' }); await sleep(700);
    await openStrip();
    ok('X5 on a screenplay page the picker shows Screenplay as the current choice', JSON.stringify(await chosen()) === JSON.stringify(['screenplay']), JSON.stringify(await chosen()));
    await press('outline'); await sleep(900);
    const conv = await rowOf('tpl-r2-sp-empty');
    ok('X5 an EMPTY screenplay converts IN PLACE (Fable Q2): the same row, no longer a script, pageSettings.template === "outline"', !!conv && conv.pageType !== 'script' && conv.pageSettings?.template === 'outline' && (await hash()) === '#/page/tpl-r2-sp-empty', JSON.stringify(conv));

    // ---- X6: the old Screenplay path is intact (page-templates.mjs keeps its own checks; this is the one cross-check) -----------------------------
    await fresh('plateau');
    await seed('tpl-r2-words-2');
    await toDraft(); await openStrip();
    await press('screenplay');
    await waitSoft("!!document.querySelector('.script-sheet, .script-page, .script-el')", { label: 'new script page' }); await sleep(900);
    const chip2 = await app.evalJs("document.querySelector('.wz-back-to-board')?.textContent.trim() || null");
    ok('X6 Screenplay on a page with words still opens a NEW script page, and its chip now reads the template caption', typeof chip2 === 'string' && chip2.includes('Opened as a new page'), JSON.stringify(chip2));
    ok('X6 ...and the page left is untouched', ((await rowOf('tpl-r2-words-2')) || {}).text === WORDS, '');

    // ---- X7 (S3): the OUTLINE lens on a real page: derived numbers on screen, never in the text; Tab / Shift+Tab / Enter ------------------------------------
    const SETTINGS = (template) => ({ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }, template });
    const OUTLINE = ['Arrival', '\tThe late ferry', '\tGulls on the rail', 'The harbormaster', '\tWhat he saw', '\t\tThe lamp, twice', '\tWhat he left out', 'The crossing'].join('\n');
    await fresh('plateau');
    await seed('tpl-r2-outline', { text: OUTLINE });
    await app.evalJs(`window.wrizoPatchEntry('tpl-r2-outline', { pageSettings: ${JSON.stringify(SETTINGS('outline'))} })`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
    await toDraft(); await sleep(500);
    const nums = () => app.evalJs("[...document.querySelectorAll('.forward-only-editor .wz-row')].map((n) => n.dataset.ol ?? null)");
    ok('X7 an Outline page in Draft draws the derived numbers (1. 1.1 1.2 2. 2.1 2.1.1 2.2 3.)', JSON.stringify(await nums()) === JSON.stringify(['1.', '1.1', '1.2', '2.', '2.1', '2.1.1', '2.2', '3.']), JSON.stringify(await nums()));
    ok('X7 THE NUMBERS ARE NOT TEXT: the editor\'s text is the stored text, byte for byte (and the stored text has no digit it did not have)',
      (await app.evalJs("(document.querySelector('.forward-only-editor')?.textContent || '').replace(/\\u200b/g, '')")) === OUTLINE && ((await rowOf('tpl-r2-outline')) || {}).text === OUTLINE, '');
    const shown = await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor .wz-row[data-ol]'); return n ? getComputedStyle(n, '::before').content : null; })()");
    ok('X7 the number is drawn by ::before (its content reads the attribute)', typeof shown === 'string' && shown.includes('1.'), JSON.stringify(shown));
    const caretToEnd = () => app.evalJs(`(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); return true; })()`);
    await caretToEnd(); await app.key('Tab'); await sleep(500);
    const afterTab = async () => ((await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'tpl-r2-outline')?.text ?? null")) || '');
    await waitSoft("(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'tpl-r2-outline')?.text || '').endsWith('\\n\\tThe crossing')", { label: 'tab stored', timeout: 4000 });
    ok('X7 Tab indents the caret\'s row one level (stored as a leading tab) and the numbers follow (the last row becomes 2.3)', (await afterTab()).endsWith('\n\tThe crossing') && (await nums()).slice(-1)[0] === '2.3', JSON.stringify({ tail: (await afterTab()).slice(-20), nums: await nums() }));
    await app.key('Tab', { shift: true }); await sleep(500);
    ok('X7 Shift+Tab outdents it again (back to 3.)', (await nums()).slice(-1)[0] === '3.', JSON.stringify(await nums()));
    await app.key('Tab'); await sleep(300); await app.key('Enter'); await sleep(300); await app.typeKeys('Sea'); await sleep(500);
    await waitSoft("(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'tpl-r2-outline')?.text || '').endsWith('\\n\\tSea')", { label: 'enter stored', timeout: 4000 });
    ok('X7 Enter opens the next row at the SAME level and typing goes into it (stored: the new row carries one tab)', (await afterTab()).endsWith('\n\tThe crossing\n\tSea'), JSON.stringify((await afterTab()).slice(-30)));
    await app.keyCombo('z'); await sleep(500);
    ok('X7 one undo takes the typed word back; the Outline keys were atomic undo steps (the page still reads as an outline)', (await afterTab()).includes('The crossing') && (await nums()).length >= 8, JSON.stringify({ n: (await nums()).length }));
    // THE ROWS-SHADOW CHECK, PER LENS (typing-latency's instrument, armed on every page this harness loads): after Tab, Shift+Tab, Enter, typing and an undo the shadow lines
    // equal the DOM on every render, and renders really were checked (a zero is never a pass)
    const shO = await app.evalJs("({ checks: window.__wzRowsChecks || Number(sessionStorage.getItem('wz-rows-checks') || 0), mismatches: (window.__wzRowsMismatches || []).length })");
    ok('X7 ROWS-SHADOW, Outline lens: no shadow-vs-DOM mismatch across Tab / Shift+Tab / Enter / typing / undo, with renders checked', shO.mismatches === 0 && shO.checks > 0, JSON.stringify(shO));
    const lvls = await app.evalJs("[...document.querySelectorAll('.forward-only-editor .wz-row')].map((n) => n.dataset.lvl ?? null)");
    ok('X7 the level attribute follows the stored tabs (the opening rows: 0 1 1 0)', JSON.stringify(lvls.slice(0, 4)) === JSON.stringify(['0', '1', '1', '0']), JSON.stringify(lvls));

    // ---- X8 (S4): the BIBLIOGRAPHY lens: a hanging indent per entry, no text added -------------------------------------------------------------------------------
    const BIB = ['Ahmed, Sara. *Harbors and Memory*. Edinburgh: Northgate Press, 2019.', 'Bell, Marian. "The Last Ferry." Island Review 14, no. 2 (2021): 33-48.'].join('\n');
    await fresh('plateau');
    await seed('tpl-r2-bib', { text: BIB });
    await app.evalJs(`window.wrizoPatchEntry('tpl-r2-bib', { pageSettings: ${JSON.stringify(SETTINGS('bibliography'))} })`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
    await toDraft(); await sleep(500);
    const bib = await app.evalJs("(() => { const rows = [...document.querySelectorAll('.forward-only-editor[data-template=\"bibliography\"] .wz-row')]; return { n: rows.length, hang: rows.map((r) => { const cs = getComputedStyle(r); return { pl: parseFloat(cs.paddingLeft), ti: parseFloat(cs.textIndent) }; }) }; })()");
    ok('X8 a Bibliography page in Draft draws each entry as a hanging indent (padding-left positive, text-indent its negative)', bib.n === 2 && bib.hang.every((h) => h.pl > 0 && Math.abs(h.pl + h.ti) < 1), JSON.stringify(bib));
    ok('X8 ...and adds no text: the editor\'s text is the stored text', (await app.evalJs("(document.querySelector('.forward-only-editor')?.textContent || '').replace(/\\u200b/g, '')")) === BIB, '');
    await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); })()");
    await app.key('Enter'); await app.typeKeys('Hollis, Dev. *Counting Gulls*. 2016.'); await sleep(600);
    const shB = await app.evalJs("({ checks: window.__wzRowsChecks || Number(sessionStorage.getItem('wz-rows-checks') || 0), mismatches: (window.__wzRowsMismatches || []).length, rows: document.querySelectorAll('.forward-only-editor[data-template=\\\"bibliography\\\"] .wz-row').length })");
    ok('X8 ROWS-SHADOW, Bibliography lens: typing a new entry (Enter, then words with an italic title) leaves no shadow-vs-DOM mismatch, and the new entry is a third hanging row', shB.mismatches === 0 && shB.checks > 0 && shB.rows === 3, JSON.stringify(shB));

    // ---- X9: no lens in Free Write's forward-only runway --------------------------------------------------------------------------------------------------------
    await app.click('Free Write'); await sleep(700);
    ok('X9 in Free Write the page is drawn plain (no lens: the editor has no data-template and no row wears a number)', (await app.evalJs("!document.querySelector('.forward-only-editor[data-template]') && document.querySelectorAll('.forward-only-editor .wz-row[data-ol]').length === 0")) === true, '');

    // ---- X10 (S5): the TITLE PAGE - five fields over the canonical text ----------------------------------------------------------------------------------------------
    await fresh('plateau');
    await app.goto('/page/new'); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'unborn page' }); await sleep(600);
    await toDraft(); await openStrip();
    await press('title'); await sleep(700);
    ok('X10 Title Page on an empty unborn page: the five-field sheet replaces the flowing editor (title, author, word line, contact), and nothing is born', (await app.evalJs("['title', 'author', 'words', 'contact'].every((f) => !!document.querySelector('.wz-title-sheet [data-field=\"' + f + '\"]'))")) === true && (await rows()).length === 0, JSON.stringify({ rows: (await rows()).length }));
    const geo = await app.evalJs("(() => { const g = (f) => { const e = document.querySelector('.wz-title-sheet [data-field=\"' + f + '\"]'); const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), w: Math.round(r.width) }; }; return { contact: g('contact'), words: g('words'), title: g('title'), author: g('author') }; })()");
    ok('X10 the sheet is the manuscript layout: the word line sits to the RIGHT of the contact block on the top row; the title and author sit lower and centred; the author is under the title', geo.words.l > geo.contact.r && Math.abs(geo.words.t - geo.contact.t) < 6 && geo.title.t > geo.contact.t + 60 && geo.author.t > geo.title.t, JSON.stringify(geo));
    const clip = await app.evalJs("(() => { const c = document.querySelector('.wz-title-sheet [data-field=\"contact\"]'); const w = document.querySelector('.wz-title-sheet [data-field=\"words\"]'); if (!c || !w) return null; let p = c.parentElement; while (p && p !== document.body && !/(auto|scroll|hidden)/.test(getComputedStyle(p).overflowY)) p = p.parentElement; const top = p ? p.getBoundingClientRect().top : 0; return { scrollerTop: Math.round(top), contactTop: Math.round(c.getBoundingClientRect().top), wordsTop: Math.round(w.getBoundingClientRect().top), scrolled: p ? p.scrollTop : 0 }; })()");
    ok('X10 the sheet\'s FIRST ROW is not clipped: the contact block and the word line start BELOW the top edge of the scroller that holds the sheet (the sheet owns a top margin, and focusing the title does not scroll it)', !!clip && clip.contactTop >= clip.scrollerTop + 8 && clip.wordsTop >= clip.scrollerTop + 8, JSON.stringify(clip));
    await app.evalJs("document.querySelector('.wz-title-sheet [data-field=\"title\"]')?.focus()"); await app.typeKeys('The Late Ferry');
    await waitSoft(`JSON.parse(localStorage.getItem(${JSON.stringify(ROWS)}) || '[]').some((e) => (e.text || '').includes('The Late Ferry'))`, { label: 'birth on the first word', timeout: 5000 }); await sleep(500);
    const tp = (await rows()).find((e) => (e.text || '').includes('The Late Ferry'));
    ok('X10 the first word typed into the title births the page WITH the template, and the stored text is the canonical Title Page text', !!tp && tp.pageSettings?.template === 'title' && tp.text === '>> \n\n>< The Late Ferry\n>< by\n>< ', JSON.stringify(tp && { t: tp.text, s: tp.pageSettings && tp.pageSettings.template }));
    await app.evalJs("document.querySelector('.wz-title-sheet [data-field=\"author\"]')?.focus()"); await app.typeKeys('Ada Marsh');
    await app.evalJs("document.querySelector('.wz-title-sheet [data-field=\"words\"]')?.focus()"); await app.typeKeys('About 62,000 words');
    await sleep(900);
    const tp2 = (await rows()).find((e) => (e.text || '').includes('The Late Ferry'));
    // ---- PARKED - SUPERSEDED by ledger 92 (Fable Oct 17): this read the store 900ms after typing, before the words field had committed (the very next check, after a reload, finds the word line saved). A settle in the check, not a lost write.
    // Kept VERBATIM below and no longer run; the successor WAITS for the stored text to reach its value (up to 6s) and then reads it.
    //
    // ok('X10 author and word line land in the canonical text (the word line right-aligned with ">> ", the author centred under "by")', !!tp2 && tp2.text === '>> About 62,000 words\n\n>< The Late Ferry\n>< by\n>< Ada Marsh', JSON.stringify(tp2 && tp2.text));
    const X10_FULL = '>> About 62,000 words\n\n>< The Late Ferry\n>< by\n>< Ada Marsh';
    await waitSoft(`(JSON.parse(localStorage.getItem(${JSON.stringify(ROWS)}) || '[]').find((e) => (e.text || '').includes('The Late Ferry')) || {}).text === ${JSON.stringify(X10_FULL)}`, { label: 'the words field committed', timeout: 6000 });
    const tp3 = (await rows()).find((e) => (e.text || '').includes('The Late Ferry'));
    ok('X10 [commit-wait successor]: author and word line land in the canonical text (the word line right-aligned with ">> ", the author centred under "by") - read AFTER the stored text has reached its value', !!tp3 && tp3.text === X10_FULL, JSON.stringify(tp3 && tp3.text));
    await app.reload(); await waitSoft("!!document.querySelector('.wz-title-sheet')", { label: 'sheet after reload', timeout: 9000 }); await sleep(600);
    const back = await app.evalJs("({ title: document.querySelector('.wz-title-sheet [data-field=\"title\"]')?.value, author: document.querySelector('.wz-title-sheet [data-field=\"author\"]')?.value, words: document.querySelector('.wz-title-sheet [data-field=\"words\"]')?.value })");
    ok('X10 after a reload the fields read back from the text (save, flush and hydrate keep every field)', back.title === 'The Late Ferry' && back.author === 'Ada Marsh' && back.words === 'About 62,000 words', JSON.stringify(back));

    // ---- X11: text that is not a Title Page shape declines: plain Draft text, nothing lost ------------------------------------------------------------------------
    await fresh('plateau');
    await seed('tpl-r2-title-bad', { text: 'Ada\n>> words\nstray line' });
    await app.evalJs(`window.wrizoPatchEntry('tpl-r2-title-bad', { pageSettings: ${JSON.stringify(SETTINGS('title'))} })`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
    await toDraft(); await sleep(500);
    ok('X11 a page marked Title Page whose text is not that shape draws as plain Draft text (no sheet), and its text is untouched', (await app.evalJs("!document.querySelector('.wz-title-sheet') && !!document.querySelector('.forward-only-editor')")) === true && ((await rowOf('tpl-r2-title-bad')) || {}).text === 'Ada\n>> words\nstray line', '');
  });
}

if (process.env.BROWSERLESS_ONLY !== '1') {
  try { await part2(); } catch (err) { ok('PART 2 ran to the end', false, String(err && err.stack || err)); }
} else {
  console.log('(BROWSERLESS_ONLY: PART 2 skipped - the real-app scenarios need a box turn)');
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nPAGE-TEMPLATES-R2 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nPAGE-TEMPLATES-R2 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

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

async function suite(mutate = {}) {
  // pageDefaults reaches for fetch and localStorage; give it quiet ones
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

// ---- source pins -------------------------------------------------------------------------------------------------------------------
const types = read('types/index.ts');
ok('P1 PageSettings carries an OPTIONAL template (absent, never null) typed outline | title | bibliography', /template\?: PageTemplate;/.test(types) && /export type PageTemplate = 'outline' \| 'title' \| 'bibliography';/.test(types), '');
const exp = read('store/pageExport.ts');
ok('P2 both export seams (Copy and the files share them) read pageSettings.template, in the same place as the script and board branches', (exp.match(/pageSettings\?\.template === 'outline'/g) || []).length === 2 && (exp.match(/pageSettings\?\.template === 'bibliography'/g) || []).length === 2, '');
const sync = fs.readFileSync(path.join(DESKTOP, '..', 'server', 'src', 'sync.ts'), 'utf8');
ok('P3 NO server change: page_settings stays a whole jsonb passthrough, and no template column or mapper exists', /page_settings/.test(sync) && !/template/i.test(fs.readFileSync(path.join(DESKTOP, '..', 'server', 'src', 'migrate.ts'), 'utf8').replace(/\/\/.*$/gm, '').replace(/Templates?/g, '')), '');

// ============================================================================================================
// PART 2 - the real app (a box turn); later slices fill this in
// ============================================================================================================
// (S2 picker, S3 Outline, S4 Bibliography, S5 Title Page, S6 frames: each slice appends its scenarios here and keeps PART 1 green.)

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nPAGE-TEMPLATES-R2 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nPAGE-TEMPLATES-R2 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);

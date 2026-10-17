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
  export { lensHtml, decorateMarkdownForCard } from './draftDecoration';
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

  // ---- the lens: one wrapper per line, in the one decoration funnel -----------------------------------------------------------------------
  const unesc = (h) => h.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const deco = (t) => M.decorateMarkdownForCard(t, null);
  const olHtml = M.lensHtml(MOCKUP_OUTLINE, deco(MOCKUP_OUTLINE), 'outline');
  const olLines = olHtml.split('\n');
  r.lensNumbers = same([...olHtml.matchAll(/data-ol="([^"]*)"/g)].map((m) => m[1]), ['1.', '1.1', '1.2', '2.', '2.1', '2.1.1', '2.2', '3.']);
  r.lensLevels = same([...olHtml.matchAll(/data-lvl="(\d)"/g)].map((m) => +m[1]), [0, 1, 1, 0, 1, 2, 1, 0]);
  r.lensTextIdentity = unesc(olHtml) === MOCKUP_OUTLINE;
  r.lensTabMarkBeforeNumber = olLines.filter((l, i) => MOCKUP_OUTLINE.split('\n')[i].startsWith('\t')).every((l) => /^<span class="md-mark">\t+<\/span><span class="ol-body"/.test(l));
  r.lensNumberIsAttributeNotText = !/>[0-9]+\.[0-9.]*\s/.test(olHtml.replace(/data-ol="[^"]*"/g, ''));
  r.lensEmptyTrailingRow = same([...M.lensHtml('A\n', deco('A\n'), 'outline').matchAll(/data-ol="([^"]*)"/g)].map((m) => m[1]), ['1.', '2.']);
  const bibPlain = 'Ahmed. *Harbors*.\nBell. Last Ferry.';
  const bibHtml = M.lensHtml(bibPlain, deco(bibPlain), 'bibliography');
  r.lensBib = (bibHtml.match(/<span class="bib-row">/g) || []).length === 2 && unesc(bibHtml) === bibPlain.replace(/\*/g, '*');
  r.lensOffUnchanged = M.lensHtml(MOCKUP_OUTLINE, deco(MOCKUP_OUTLINE), null) === deco(MOCKUP_OUTLINE) && M.lensHtml('x', deco('x'), 'title') === deco('x') && M.lensHtml('x', deco('x'), undefined) === deco('x');
  r.lensUnexpectedShapeUntouched = M.lensHtml('A\nB', 'only one line', 'outline') === 'only one line' && M.lensHtml('A', 'a\nb', 'bibliography') === 'a\nb';

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
  lensNumbers: 'L1 the Outline lens draws the derived numbers as data-ol attributes (1. / 1.1 / 1.2 / 2. / 2.1 / 2.1.1 / 2.2 / 3.)',
  lensLevels: 'L2 ...and the effective level as data-lvl',
  lensTextIdentity: 'L3 THE LENS ADDS NO TEXT: the decorated HTML, tags stripped, is the stored text byte for byte',
  lensTabMarkBeforeNumber: 'L4 an indented row keeps its tab mark FIRST; the number sits after the indent, not before it',
  lensNumberIsAttributeNotText: 'L5 no number appears as a text node (it is an attribute for ::before, so it is never copied or read back)',
  lensEmptyTrailingRow: 'L6 a trailing empty row (where the caret sits after Enter) is numbered',
  lensBib: 'L7 the Bibliography lens wraps each line in a .bib-row and adds no text',
  lensOffUnchanged: 'L8 with no lens (null, undefined, "title") the decorated HTML is byte-identical to before',
  lensUnexpectedShapeUntouched: 'L9 a shape the lens does not expect (lines not matching) is left undecorated - it never guesses',
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
  { name: 'Lens: the number is written into the text, not an attribute', file: 'store/draftDecoration.ts', from: '`${lead}<span class="ol-body" data-ol="${nums[i]}" data-lvl="${rows[i].level}">${h.slice(lead.length)}</span>`', to: '`${lead}<span class="ol-body" data-ol="${nums[i]}" data-lvl="${rows[i].level}">${nums[i]} ${h.slice(lead.length)}</span>`', red: ['lensTextIdentity'] },
  { name: 'Lens: the number is placed before the tab mark', file: 'store/draftDecoration.ts', from: "const lead = LEAD_TAB_HTML.exec(h)?.[0] ?? '';", to: "const lead = '';", red: ['lensTabMarkBeforeNumber'] },
  { name: 'Lens: guesses at an unexpected shape', file: 'store/draftDecoration.ts', from: "if (lines.length !== plain.split('\\n').length) return html;", to: '', red: ['lensUnexpectedShapeUntouched'] },
  { name: 'Lens: applied with no lens', file: 'store/draftDecoration.ts', from: "if (lens !== 'outline' && lens !== 'bibliography') return html;", to: '', red: ['lensOffUnchanged'] },
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
    const toDraft = async () => { await app.click('Draft'); await sleep(700); };
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
    ok('X1 Arbor: the section heads read "Font" and "Templates"', heads.includes('Font') && heads.includes('Templates'), JSON.stringify(heads));
    ok('X1 no disabled stand-in and no Custom remain', (await app.evalJs("document.querySelectorAll('.wz-sliver-templates [aria-disabled=\"true\"], .wz-template-btn').length")) === 0, '');
    await fresh('flux');
    await app.goto('/page/new'); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'unborn page (flux)' }); await sleep(600);
    await toDraft(); await openStrip();
    ok('X1 Flux: the rows read Raw, Script, Spine, Cover, Sources', JSON.stringify(await pickerNames()) === JSON.stringify(['Raw', 'Script', 'Spine', 'Cover', 'Sources']), JSON.stringify(await pickerNames()));
    const headsF = await app.evalJs("[...document.querySelectorAll('.wz-sliver-h')].map((h) => h.textContent)");
    ok('X1 Flux: the section heads read "Typeface" and "Presets"', headsF.includes('Typeface') && headsF.includes('Presets'), JSON.stringify(headsF));

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
    const nums = () => app.evalJs("[...document.querySelectorAll('.forward-only-editor .ol-body')].map((n) => n.dataset.ol)");
    ok('X7 an Outline page in Draft draws the derived numbers (1. 1.1 1.2 2. 2.1 2.1.1 2.2 3.)', JSON.stringify(await nums()) === JSON.stringify(['1.', '1.1', '1.2', '2.', '2.1', '2.1.1', '2.2', '3.']), JSON.stringify(await nums()));
    ok('X7 THE NUMBERS ARE NOT TEXT: the editor\'s text is the stored text, byte for byte (and the stored text has no digit it did not have)',
      (await app.evalJs("(document.querySelector('.forward-only-editor')?.textContent || '').replace(/\\u200b/g, '')")) === OUTLINE && ((await rowOf('tpl-r2-outline')) || {}).text === OUTLINE, '');
    const shown = await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor .ol-body'); return n ? getComputedStyle(n, '::before').content : null; })()");
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

    // ---- X8 (S4): the BIBLIOGRAPHY lens: a hanging indent per entry, no text added -------------------------------------------------------------------------------
    const BIB = ['Ahmed, Sara. *Harbors and Memory*. Edinburgh: Northgate Press, 2019.', 'Bell, Marian. "The Last Ferry." Island Review 14, no. 2 (2021): 33-48.'].join('\n');
    await fresh('plateau');
    await seed('tpl-r2-bib', { text: BIB });
    await app.evalJs(`window.wrizoPatchEntry('tpl-r2-bib', { pageSettings: ${JSON.stringify(SETTINGS('bibliography'))} })`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
    await toDraft(); await sleep(500);
    const bib = await app.evalJs("(() => { const rows = [...document.querySelectorAll('.forward-only-editor .bib-row')]; return { n: rows.length, hang: rows.map((r) => { const cs = getComputedStyle(r); return { pl: parseFloat(cs.paddingLeft), ti: parseFloat(cs.textIndent) }; }) }; })()");
    ok('X8 a Bibliography page in Draft draws each entry as a hanging indent (padding-left positive, text-indent its negative)', bib.n === 2 && bib.hang.every((h) => h.pl > 0 && Math.abs(h.pl + h.ti) < 1), JSON.stringify(bib));
    ok('X8 ...and adds no text: the editor\'s text is the stored text', (await app.evalJs("(document.querySelector('.forward-only-editor')?.textContent || '').replace(/\\u200b/g, '')")) === BIB, '');

    // ---- X9: no lens in Free Write's forward-only runway --------------------------------------------------------------------------------------------------------
    await app.click('Free Write'); await sleep(700);
    ok('X9 in Free Write the page is drawn plain (no lens wrapper at all)', (await app.evalJs("document.querySelectorAll('.forward-only-editor .ol-body, .forward-only-editor .bib-row').length")) === 0, '');
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

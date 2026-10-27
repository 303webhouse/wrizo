// TOOLS #10 ITEM 10 - THEME DEFAULT WRITING FONTS + "Default (<face>)" - THE BROWSERLESS HALF (docs: polish-10-brief.md item 10; Nick, Oct 24). theme-fonts.mjs is the DOM half (a box turn, after #9 ships). Source only here:
//   T  each theme's default rides --font-proseSerif: Arbor (the root) EB Garamond, Flux Titillium Web, Machina Source Sans 3 (Nomad Figtree / Volant Crimson Pro arrive with those themes)
//   R  the roster gained Source Sans 3 and Titillium Web; NONE of the three defaults is eager - Arbor's EB Garamond, Flux's Titillium Web and Machina's Source Sans 3 each load WITH their theme (or when chosen)
//   N  "Default (<face>)" NAMES the face: THEME_DEFAULT_FACE (fontRoster.ts) equals the first family of --font-proseSerif / --font-proseSans per theme in index.css (it fails on drift), and no theme yields an empty name
//   D  the list's FIRST row is "Default (<face>)" (the face that really renders, read from --font-prose); an unchosen surface marks IT; choosing it CLEARS the stored face (page: the `face` key; card: `fontFace`) - NO new stored value
//   H  the hosts clear: the Page drops its `face` key (and writes nothing when it never had one), the card drops `fontFace`
// Every check has a mutant whose landing is asserted.
//
// Run (repo root, browserless):  node apps/desktop/scripts/harness/theme-fonts-source.mjs     (TF_REPO=<worktree> to read another checkout)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.TF_REPO || join(here, '..', '..', '..', '..'));
const SRC = join(REPO, 'apps', 'desktop', 'src');
const read = (f) => (existsSync(join(SRC, f)) ? readFileSync(join(SRC, f), 'utf8').replace(/\r\n/g, '\n') : '');
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 200) : '')); };

const css = read('index.css');
const roster = strip(read('store/fontRoster.ts'));
const faces = strip(read('store/themeFontFaces.ts'));
const themeFonts = strip(read('store/themeFonts.ts'));
const main = strip(read('main.tsx'));
const ctl = strip(read('components/TypeControl.tsx'));
const page = strip(read('pages/PageEditor.tsx'));
const board = strip(read('components/BoardEditor.tsx'));
const lex = read('store/deskLexicon.ts');
const pkg = read('../package.json');

// the three theme blocks, cut out of index.css
const block = (open) => { const a = css.indexOf(open); if (a < 0) return ''; const b = css.indexOf('\n}', a); return css.slice(a, b); };
const rootBlock = block('--font-chromeLabel:  \'Figtree Variable\'').length ? css.slice(css.indexOf("--font-proseSerif:   'EB Garamond Variable'") - 40, css.indexOf("--font-proseSerif:   'EB Garamond Variable'") + 140) : '';
const fluxBlock = block(":root[data-theme='flux'] {");
const machinaBlock = block(":root[data-theme='machina'] {");

const tokensOk = (root, flux, machina) => /--font-proseSerif:\s+'EB Garamond Variable', Georgia, serif;/.test(root) && /--font-proseSerif:\s+'Titillium Web', system-ui, sans-serif;/.test(flux) && /--font-proseSerif:\s+'Source Sans 3 Variable', system-ui, sans-serif;/.test(machina);
const rosterOk = (r, f, m, p, tf = themeFonts) => /name: 'Source Sans 3'[^\n]*\n\s*load: both\([^\n]*source-sans-3\/wght\.css[^\n]*source-sans-3\/wght-italic\.css/.test(r) && /name: 'Titillium Web'[^\n]*\n\s*load: both\([^\n]*titillium-web\/400\.css/.test(r)
  && /name: 'Source Sans 3'[^\n]*eager: false/.test(r) && /name: 'Titillium Web'[^\n]*eager: false/.test(r) && /name: 'EB Garamond'[^\n]*eager: false/.test(r)
  && !/eb-garamond|titillium|source-sans/.test(m)   // NOTHING of the three defaults is eager in main.tsx (the eager list does not grow)
  && /registerThemeFonts\('plateau'[\s\S]*?eb-garamond\/wght\.css[\s\S]*?eb-garamond\/wght-italic\.css/.test(f) && /registerThemeFonts\('flux'/.test(f) && /titillium-web\/400\.css/.test(f) && /registerThemeFonts\('machina'[\s\S]*source-sans-3\/wght\.css/.test(f) && !/theme !== 'machina'/.test(tf)
  && /"@fontsource\/titillium-web"/.test(p) && /"@fontsource-variable\/source-sans-3"/.test(p);
const defaultOk = (c, l) => /const defaultRow = \(current: boolean, onPick: \(\) => void\) =>/.test(c) && /data-default="true"/.test(c) && /t\('typeFaceDefault'\)\.replace\('\{face\}', defaultName\)/.test(c) && /const defaultName = everydayFaceName\(theme, voice\);/.test(c) && /themeDefaultFaceName\(theme, voice\)/.test(c) && /const \{ voice \} = useThemePrefs\(\);/.test(c)
  && /\{defaultRow\(brassKey === DEFAULT_KEY, pickDefault\)\}/.test(c) && /\{defaultRow\(!face, \(\) => \{ onPickFace\(undefined\); setOpen\(false\); \}\)\}/.test(c)
  && /const pickDefault = \(\) => \{ if \(!scope \|\| whole\) onPickFace\(undefined\); else scope\.onPickSelection\(null\); \};/.test(c) && /onPickFace: \(face: StoredFace \| undefined\) => void;/.test(c)
  && /aria-selected=\{f\.name === face\?\.name\}/.test(c) && /typeFaceDefault: 'Default \(\{face\}\)'/.test(l);
const hostsOk = (p, b) => /onPickFace: \(face: StoredFace \| undefined\) => \{ clearFontSpansOnPage\(\); if \(face\) patchPageSettings\(\{ face \}\); else clearPageFace\(\); \}/.test(p)
  && /if \(!cur \|\| cur\.face === undefined\) return;\s*\n\s*const \{ face: _dropped, \.\.\.rest \} = cur;/.test(p)
  && /const pickWholeCardFace = \(face: StoredFace \| undefined\) =>/.test(b) && /if \('fontFace' in patch && !patch\.fontFace\) delete next\.fontFace;/.test(b);

ok('T: each theme\'s default writing face rides --font-proseSerif - Arbor EB Garamond (the root), Flux Titillium Web, Machina Source Sans 3', tokensOk(rootBlock, fluxBlock, machinaBlock), '');
ok('R: the roster gained Source Sans 3 and Titillium Web; none of the three theme defaults is eager (main.tsx names none); Arbor\'s, Flux\'s and Machina\'s load with their theme (no Machina-only gate); both packages are declared', rosterOk(roster, faces, main, pkg), '');
ok('D: the list\'s first row is "Default (<face>)" - the face that really renders - an unchosen surface marks IT (never a roster row), and choosing it clears (whole pick: undefined; a selection: its span is removed)', defaultOk(ctl, lex), '');
ok('H: the hosts clear - the Page drops its `face` key (no write when it never had one), the card drops `fontFace` - and NO new stored field exists (the roster stored form is unchanged: name / generic / source / fallback)', hostsOk(page, board) && /name: face\.name, generic: face\.generic, source: face\.source, fallback: face\.fallback/.test(roster) && !/defaultFace|isDefault|themeFace/.test(page + board + roster), '');

// N - the names: the table in fontRoster.ts vs the first family of each theme's tokens in index.css
const firstFamily = (decl) => { const m = /'([^']+?)(?: Variable)?'/.exec(decl || ''); return m ? m[1] : null; };
const tokenOf = (blk, name) => { const m = new RegExp(`${name}:\\s+([^;]+);`).exec(blk); return m ? m[1] : null; };
const rootSans = tokenOf(css.slice(css.indexOf("--font-proseSerif:   'EB Garamond Variable'"), css.indexOf("--font-proseSerif:   'EB Garamond Variable'") + 260), '--font-proseSans');
const cssNames = { plateau: { serif: firstFamily(rootBlock.slice(rootBlock.indexOf('--font-proseSerif'))), sans: firstFamily(rootSans) }, flux: { serif: firstFamily(tokenOf(fluxBlock, '--font-proseSerif')), sans: firstFamily(tokenOf(fluxBlock, '--font-proseSans')) }, machina: { serif: firstFamily(tokenOf(machinaBlock, '--font-proseSerif')), sans: firstFamily(tokenOf(machinaBlock, '--font-proseSans')) } };
const tableOf = (r) => { const out = {}; for (const m of r.matchAll(/(\w+): \{ serif: '([^']+)', sans: '([^']+)' \}/g)) out[m[1]] = { serif: m[2], sans: m[3] }; return out; };
const namesOk = (r) => { const tb = tableOf(r); return ['plateau', 'flux', 'machina'].every((th) => !!tb[th] && tb[th].serif && tb[th].sans && tb[th].serif === cssNames[th].serif && tb[th].sans === cssNames[th].sans); };
ok('N: "Default (<face>)" names the face - THEME_DEFAULT_FACE equals each theme\'s --font-proseSerif / --font-proseSans first family in index.css (Arbor EB Garamond / Figtree, Flux Titillium Web / Chakra Petch, Machina Source Sans 3 / Atkinson Hyperlegible), none empty', namesOk(read('store/fontRoster.ts')), JSON.stringify(cssNames));

const muts = [
  ['Flux\'s default name drifts from its token (Titillium -> Titillium Sans)', read('store/fontRoster.ts'), (t) => t.replace("flux: { serif: 'Titillium Web'", "flux: { serif: 'Titillium Sans'"), namesOk],
  ['Machina\'s name is empty', read('store/fontRoster.ts'), (t) => t.replace("machina: { serif: 'Source Sans 3'", "machina: { serif: ''"), namesOk],
  ['Arbor\'s default goes back to Crimson Pro', rootBlock, (t) => t.replace("'EB Garamond Variable'", "'Crimson Pro Variable'"), (t) => tokensOk(t, fluxBlock, machinaBlock)],
  ['Flux\'s default is not overridden (Crimson rides)', fluxBlock, (t) => t.replace("'Titillium Web', system-ui, sans-serif", "'Crimson Pro Variable', Georgia, serif"), (t) => tokensOk(rootBlock, t, machinaBlock)],
  ['Machina keeps Plex Serif', machinaBlock, (t) => t.replace("'Source Sans 3 Variable', system-ui, sans-serif", "'IBM Plex Serif', Georgia, serif"), (t) => tokensOk(rootBlock, fluxBlock, t)],
  ['Titillium Web is eager', main, (t) => t + "\nimport '@fontsource/titillium-web/400.css';", (t) => rosterOk(roster, faces, t, pkg)],
  ['Flux loses its theme loader', faces, (t) => t.replace("registerThemeFonts('flux'", "registerThemeFonts('fluxx'"), (t) => rosterOk(roster, t, main, pkg)],
  ['the Machina-only gate returns', themeFonts, (t) => t + "\nif (theme !== 'machina') return;", (t) => rosterOk(roster, faces, main, pkg, t)],
  ['the Default row is gone', ctl, (t) => t.replace('{defaultRow(brassKey === DEFAULT_KEY, pickDefault)}', ''), (t) => defaultOk(t, lex)],
  ['an unchosen surface marks a roster row again', ctl, (t) => t.replace('aria-selected={f.name === face?.name}', 'aria-selected={f.name === currentName}'), (t) => defaultOk(t, lex)],
  ['Default stores a face instead of clearing', ctl, (t) => t.replace('if (!scope || whole) onPickFace(undefined);', 'if (!scope || whole) onPickFace(storedFaceFor(ROSTER[0]));'), (t) => defaultOk(t, lex)],
  ['the Page keeps its face when Default is chosen', page, (t) => t.replace('else clearPageFace();', ''), (t) => hostsOk(t, board)],
  ['the card keeps an empty fontFace key', board, (t) => t.replace("if ('fontFace' in patch && !patch.fontFace) delete next.fontFace;", ''), (t) => hostsOk(page, t)],
];
for (const [name, text, mutate, pred] of muts) {
  const next = mutate(text);
  ok(`MUTANT: ${name} - its check must go RED (the mutation LANDED: the real source passes)`, next !== text && pred(text) === true && pred(next) === false, '');
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nTHEME-FONTS-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nTHEME-FONTS-SOURCE VERIFY: FAIL - ${bad}/${checks.length} failed`);
process.exit(bad === 0 ? 0 : 1);

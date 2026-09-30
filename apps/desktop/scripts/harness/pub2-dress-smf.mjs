// PUB2 — Dress, as pure data: proof. press/dress/smf.ts's geometry, running
// head and the two line-level conventions the professional editor named
// (§1) — "#" scene breaks and first-line indents (Nick's Tab ruling, item 83
// M5). Loaded from the REAL files (transpiled with the repo's own
// TypeScript, never re-typed), including its real dependency on
// store/draftFormat.ts's own LINE_DIRECTIVE.indent — so a re-tokening on
// that side cannot silently strand this file on a stale mark without this
// harness catching it.
//
// Run: node scripts/harness/pub2-dress-smf.mjs   (from apps/desktop).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const ts = require('typescript');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const tmp = path.join(DESKTOP, '.pub2-dress-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
function load(rel) {
  const srcText = fs.readFileSync(path.join(SRC, rel), 'utf8');
  let out = ts.transpileModule(srcText, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  out = out.replace(/from (['"])(\.\.?\/[^'"]+)\1/g, (m, q, spec) => `from ${q}${spec}.mjs${q}`);
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return import(`file://${dest.replace(/\\/g, '/')}`);
}

await load('store/draftFormat.ts'); // smf.ts's own dependency (LINE_DIRECTIVE)
const { LINE_DIRECTIVE } = await load('store/draftFormat.ts');
const smf = await load('press/dress/smf.ts');
const {
  PAGE_WIDTH_PT, PAGE_HEIGHT_PT, MARGIN_PT, FONT_SIZE_PT, LINE_HEIGHT_MULTIPLIER,
  LINE_HEIGHT_PT, FIRST_LINE_INDENT_PT, SMF_FONTS,
  runningHead, isSceneBreak, hasFirstLineIndent, stripFirstLineIndent,
} = smf;

// ---- geometry, against §1's own quoted numbers -----------------------------
ok('GEOMETRY: US Letter in points — 612 x 792 (8.5in x 11in @ 72pt/in, pdf-lib\'s own unit)',
  PAGE_WIDTH_PT === 612 && PAGE_HEIGHT_PT === 792, JSON.stringify({ PAGE_WIDTH_PT, PAGE_HEIGHT_PT }));
ok('GEOMETRY: "1″ margins" — 72pt, all four sides is Render\'s job, but the ONE number is this file\'s',
  MARGIN_PT === 72, String(MARGIN_PT));
ok('GEOMETRY: "Times 12" — FONT_SIZE_PT is exactly 12',
  FONT_SIZE_PT === 12, String(FONT_SIZE_PT));
ok('GEOMETRY: "double-spaced" is a real 2x multiplier, and the derived line height is exactly 24pt for a 12pt face',
  LINE_HEIGHT_MULTIPLIER === 2 && LINE_HEIGHT_PT === 24, JSON.stringify({ LINE_HEIGHT_MULTIPLIER, LINE_HEIGHT_PT }));
ok('GEOMETRY: the first-line indent is the conventional half inch — 36pt',
  FIRST_LINE_INDENT_PT === 36, String(FIRST_LINE_INDENT_PT));

// ---- the running head, verbatim against §1's quoted template --------------
ok('RUNNING HEAD: "Surname / TITLE / page" — title upper-cased, page bare, single spaces around each slash',
  runningHead('Doe', 'My Working Title', 7) === 'Doe / MY WORKING TITLE / 7',
  runningHead('Doe', 'My Working Title', 7));
ok('RUNNING HEAD: an already-uppercase title is not double-processed or mangled',
  runningHead('Okafor', 'ASH AND EMBER', 142) === 'Okafor / ASH AND EMBER / 142', '');
ok('RUNNING HEAD: page 1 (the first manuscript page, a real boundary value)',
  runningHead('Lee', 'Short', 1) === 'Lee / SHORT / 1', '');

// ---- scene breaks — "#" alone, never a heading with words after it --------
ok('SCENE BREAK: a bare "#" line is a scene break',
  isSceneBreak('#') === true, '');
ok('SCENE BREAK: "#" with surrounding whitespace is still a scene break (a writer\'s own trailing space)',
  isSceneBreak('  #  ') === true, '');
ok('SCENE BREAK: "# Chapter One" is NOT a scene break — that is model.ts\'s own chapter-heading read (a different concern), never confused with SMF\'s bare mark',
  isSceneBreak('# Chapter One') === false, '');
ok('SCENE BREAK: "##" (two marks) is not a scene break — the test is exact, not a prefix match',
  isSceneBreak('##') === false, '');
ok('SCENE BREAK: ordinary prose is never mistaken for one',
  isSceneBreak('The door opened.') === false && isSceneBreak('') === false, '');

// ---- first-line indents — read through the REAL, imported LINE_DIRECTIVE --
ok('INDENT SOURCE: smf.ts reads draftFormat.ts\'s OWN LINE_DIRECTIVE.indent (a leading tab) — not a hardcoded guess at the token',
  LINE_DIRECTIVE.indent === '\t', JSON.stringify(LINE_DIRECTIVE.indent));
const indented = `${LINE_DIRECTIVE.indent}She turned the key.`;
const plain = 'She turned the key.';
ok('INDENT: a line built with the REAL indent token reads as indented; the same line without it does not',
  hasFirstLineIndent(indented) === true && hasFirstLineIndent(plain) === false,
  JSON.stringify({ indented: hasFirstLineIndent(indented), plain: hasFirstLineIndent(plain) }));
ok('INDENT: stripFirstLineIndent removes exactly the leading mark, once, and leaves the writer\'s own words byte-identical',
  stripFirstLineIndent(indented) === plain, stripFirstLineIndent(indented));
ok('INDENT: a mid-line tab (the writer\'s own, not the mark) is left alone — only a LEADING one is ever stripped',
  stripFirstLineIndent(`No lead here,${LINE_DIRECTIVE.indent}then a tab.`) === `No lead here,${LINE_DIRECTIVE.indent}then a tab.`, '');
ok('INDENT: stripping a line that was never indented is a no-op (idempotent on plain text)',
  stripFirstLineIndent(plain) === plain, '');

// ---- fonts, named for the PDF path, against §2's own Fonts section --------
ok('FONTS: all three vendored faces are named — Tinos (prose), Courier Prime (screenplay), Arimo (sans) — the exact families §2 lists',
  SMF_FONTS.prose.family === 'Tinos' && SMF_FONTS.screenplay.family === 'Courier Prime' && SMF_FONTS.sans.family === 'Arimo',
  JSON.stringify({ prose: SMF_FONTS.prose.family, screenplay: SMF_FONTS.screenplay.family, sans: SMF_FONTS.sans.family }));
ok('FONTS: every face\'s planned path lives under the vendoring location §2 names (apps/desktop/public/press/fonts/)',
  Object.values(SMF_FONTS).every((f) => f.file.startsWith('apps/desktop/public/press/fonts/')),
  JSON.stringify(Object.values(SMF_FONTS).map((f) => f.file)));

fs.rmSync(tmp, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nPUB2-DRESS-SMF PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: Dress\'s SMF data is new this commit, falsifying no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nPUB2-DRESS-SMF VERIFY: PASS (${checks.length} checks)`
  : `\nPUB2-DRESS-SMF VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);

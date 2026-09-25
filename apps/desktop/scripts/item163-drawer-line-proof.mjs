// ITEM 163 — THE LOCATION LINE SAYS "IN". Browserless proof.
//
// Ruled: the Boards Connected row's second line takes the CAPTION FORM,
// "in TEST BOARD" — because a bare name reads as a SUBTITLE, which is how Nick
// read it. WIDENED to the canvas board-card, "same swap, same lexicon term."
// RATIFIED AS SCOPED: the swap touches DRAWER-NAMING lines only, and the other
// two forms are asserted BY NAME so this cannot pass on their ABSENCE.
//
// That last clause is the whole reason this file is not three greps. A check that
// only looked for "in " would pass just as happily on a page where the other two
// lines had vanished entirely — it would be measuring the presence of one string,
// not the scope of a change. So the two untouched forms are named and required.
//
// It runs the REAL reader against a fixture, with the REAL lexicon (transpiled,
// with only react/theme stubbed) — so the strings it asserts are the strings a
// writer reads, not a copy of them kept in step by hand.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const require = createRequire(join(repo, 'apps/server/package.json'));
const ts = require('typescript');

const tmp = join(tmpdir(), 'wrizo-item163-proof');
mkdirSync(tmp, { recursive: true });
const tr = (src) => ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;

let failures = 0;
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const ok = (m) => console.log('  ok   ' + m);

// --- the REAL lexicon, with only react/theme stubbed -------------------------
let lexJs = tr(readFileSync(join(repo, 'apps/desktop/src/store/deskLexicon.ts'), 'utf8'));
const beforeLex = lexJs;
lexJs = lexJs.replace(/^import \{ useEffect, useState \} from 'react';$/m,
  'const useEffect = () => {}; const useState = () => [0, () => {}];');
lexJs = lexJs.replace(/^import \{ useTheme.*from '\.\/theme';$/m, "const useTheme = () => 'plateau';");
if (lexJs === beforeLex || /^import /m.test(lexJs)) {
  console.log('FAIL — deskLexicon imports changed; this proof could not stub them (it would otherwise test a stale copy).');
  process.exit(1);
}
writeFileSync(join(tmp, 'deskLexicon.mjs'), lexJs, 'utf8');

// --- the REAL reader, with ONLY the store read stubbed -----------------------
// `getProject` is the fixture seam; `deskTerm` is deliberately NOT stubbed.
let homeJs = tr(readFileSync(join(repo, 'apps/desktop/src/store/pageHome.ts'), 'utf8'));
const beforeHome = homeJs;
homeJs = homeJs.replace(/^import \{[^}]*\} from '\.\/persistence';$/m,
  'const inJournalView = () => false;\nconst getProject = (id) => globalThis.__projects[id] ?? null;');
homeJs = homeJs.replace(/^import \{ deskTerm \} from '\.\/deskLexicon';$/m,
  "import { deskTerm } from './deskLexicon.mjs';");
if (homeJs === beforeHome || /^import .*persistence/m.test(homeJs)) {
  console.log('FAIL — pageHome imports changed; this proof could not stub them.');
  process.exit(1);
}
writeFileSync(join(tmp, 'pageHome.mjs'), homeJs, 'utf8');

const lex = await import(pathToFileURL(join(tmp, 'deskLexicon.mjs')).href);
globalThis.__projects = {
  'd1': { id: 'd1', title: 'TEST BOARD' },
  'd2': { id: 'd2', title: '' },
};
const home = await import(pathToFileURL(join(tmp, 'pageHome.mjs')).href);

// ⛔ THE CANONICAL READ, REPOINTED — AND WHY THAT NEEDED A NEW CLAIM.
// `canonicalDeskTerm` does not exist on main: it arrived with Experiment 1's
// lexicon commit (61f537a), and this proof was written on that branch. Item 163
// now rides its own branch off main, where the available reader is `deskTerm`,
// so the three terms are read through it — with the theme named EXPLICITLY
// rather than left to `resolveTheme`'s no-document fallback, because a proof
// should not depend on which globals Node happens to lack.
//
// The swap costs one thing and CLAIM 0 pays it back. `canonicalDeskTerm` read
// the CANONICAL map directly, so it was an INDEPENDENT witness; `deskTerm` is
// the same function the reader under test calls, so if a theme override ever
// shadowed one of these terms the comparison would drift toward comparing the
// reader against itself. So the three terms are asserted THEME-INVARIANT across
// every theme the app defines, with the theme list PARSED from theme.ts rather
// than hand-listed here. If an override lands on one of them, this fails loudly
// instead of quietly going green about the wrong string.
const THEMES = (() => {
  const src = readFileSync(join(repo, 'apps/desktop/src/store/theme.ts'), 'utf8');
  const m = src.match(/export type ThemeId = ([^;]+);/);
  if (!m) {
    console.log('FAIL — could not parse ThemeId out of theme.ts; refusing to hand-list the themes, because a hand-list is the thing that goes stale.');
    process.exit(1);
  }
  const ids = m[1].split('|').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  if (ids.length === 0) {
    console.log('FAIL — parsed zero themes; a population of zero proves nothing.');
    process.exit(1);
  }
  return ids;
})();

const TERMS = ['cascadePlanCaptionIn', 'cascadePlanNoDrawer', 'cascadePlanRelationOwn'];

console.log('CLAIM 0 — the three terms are THEME-INVARIANT, so deskTerm IS a canonical read');
for (const t of TERMS) {
  const seen = [...new Set(THEMES.map((th) => lex.deskTerm(t, th)))];
  if (seen.length !== 1) {
    fail(`${t} differs by theme (${JSON.stringify(seen)}) — an override has landed, so this file may no longer treat deskTerm as a canonical read`);
  } else if (!seen[0]) {
    fail(`${t} reads empty under every theme — the term is missing from the lexicon`);
  } else {
    ok(`${t} is ${JSON.stringify(seen[0])} under all ${THEMES.length} themes (${THEMES.join(', ')})`);
  }
}

const IN = lex.deskTerm('cascadePlanCaptionIn', 'plateau');
const NO_DRAWER = lex.deskTerm('cascadePlanNoDrawer', 'plateau');
const OWN = lex.deskTerm('cascadePlanRelationOwn', 'plateau');

console.log(`lexicon: in="${IN}" | noDrawer="${NO_DRAWER}" | own="${OWN}"\n`);

console.log('CLAIM 1 — a drawer-naming line takes the CAPTION FORM');
{
  const got = home.boardDrawerLine({ id: 'b1', projectId: 'd1' });
  const want = `${IN} TEST BOARD`;
  if (got !== want) fail(`expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  else ok(`${JSON.stringify(got)} — the name is no longer a bare subtitle`);
  // And it must NOT be the bare name, stated as its own assertion so a future
  // change that drops the prefix fails HERE and not somewhere downstream.
  if (got === 'TEST BOARD') fail('the line is still the bare drawer name — item 163 is the defect, not the fix');
}

console.log('CLAIM 2 — an untitled drawer still gets the form, not a bare fallback');
{
  const got = home.boardDrawerLine({ id: 'b2', projectId: 'd2' });
  const want = `${IN} Untitled`;
  if (got !== want) fail(`expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  else ok(JSON.stringify(got));
}

console.log('CLAIM 3 — NO DRAWER keeps its own form, unprefixed (scope, half one)');
{
  const got = home.boardDrawerLine({ id: 'b3', projectId: null });
  if (got !== NO_DRAWER) fail(`expected ${JSON.stringify(NO_DRAWER)}, got ${JSON.stringify(got)}`);
  else ok(`${JSON.stringify(got)} — "in Not in a drawer" would be nonsense, so the swap must not reach here`);
  if (got.startsWith(IN + ' ')) fail('the no-drawer line got the "in" prefix — the swap is no longer scoped');
}

console.log('CLAIM 4 — the OWN-plan-board relation is untouched (scope, half two), ASSERTED BY NAME');
{
  // This is the clause that stops the proof passing on absence: the row for a
  // page's own plan board must still be `cascadePlanRelationOwn`, and the source
  // must still say so. A relation is not a location; prefixing it with "in" would
  // make it a lie.
  const src = readFileSync(join(repo, 'apps/desktop/src/components/CascadePanels.tsx'), 'utf8');
  if (!/relation:\s*deskTerm\('cascadePlanRelationOwn'\)/.test(src)) {
    fail("the own-plan-board row no longer uses cascadePlanRelationOwn by name");
  } else ok(`the own row still reads ${JSON.stringify(OWN)}, by name`);
  if (!OWN || OWN.startsWith(IN + ' ')) fail('the own relation now carries the "in" prefix — a relation read as a location');
}

console.log('CLAIM 5 — ONE READER: no bare-name spelling survives anywhere');
{
  // Swept for what the change DOES, not for what it renames: the defect's SHAPE
  // is "return the project title with no caption term", so that is what is
  // hunted — in every client file, not just the three that had it.
  const BARE = /getProject\([^)]*\)\s*\?\.\s*title\s*\|\|\s*'Untitled'/g;
  const files = [];
  (function walk(dir) {
    for (const name of readFileSync ? require('node:fs').readdirSync(dir) : []) {
      const p = join(dir, name);
      if (require('node:fs').statSync(p).isDirectory()) { if (name !== 'node_modules') walk(p); }
      else if (/\.(ts|tsx)$/.test(name)) files.push(p);
    }
  })(join(repo, 'apps/desktop/src'));

  const hits = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(BARE)) {
      const line = src.slice(0, m.index).split('\n').length;
      // Normalise the separators BEFORE stripping the prefix, or the strip never
      // matches on Windows and every failure prints an absolute path — a message
      // about someone else's machine instead of a file a reader can open.
      const rel = f.replace(/\\/g, '/').replace(repo.replace(/\\/g, '/') + '/', '');
      hits.push({ f: rel, line, text: m[0] });
    }
  }
  // Exactly ONE is lawful: the reader itself, in pageHome.ts.
  const inReader = hits.filter((h) => h.f.endsWith('store/pageHome.ts'));
  const elsewhere = hits.filter((h) => !h.f.endsWith('store/pageHome.ts'));
  if (inReader.length !== 1) fail(`the reader should hold exactly one bare-title read; found ${inReader.length}`);
  for (const h of elsewhere) fail(`a bare drawer-name spelling survives at ${h.f}:${h.line} — three copies of one rule is what item 163 came from`);
  if (failures === 0 || elsewhere.length === 0) ok(`${files.length} files swept; the only bare-title read is the reader's own`);
}

console.log('CLAIM 6 — and all three call sites call it');
{
  const cp = readFileSync(join(repo, 'apps/desktop/src/components/CascadePanels.tsx'), 'utf8');
  const be = readFileSync(join(repo, 'apps/desktop/src/components/BoardEditor.tsx'), 'utf8');
  const sites = [
    ['CascadePanels: the board ROW', /relation:\s*boardDrawerLine\(board\)/.test(cp)],
    ['CascadePanels: the zone CAPTION', /\{boardDrawerLine\(subject\.entry\)\}/.test(cp)],
    ['BoardEditor: the canvas BOARD-CARD', /boardDrawerLine\(entry\)/.test(be)],
  ];
  for (const [name, present] of sites) {
    if (!present) fail(`${name} does not call the shared reader`);
  }
  if (sites.every(([, p]) => p)) ok('row, caption and board-card all read from one definition');
}

console.log('\n' + (failures === 0
  ? 'ITEM 163 PROOF: CLEAN — the swap holds, and it is scoped'
  : `ITEM 163 PROOF: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);

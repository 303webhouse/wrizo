// MACHINA-DOC-WORD (Nick, Nov 11: Machina's word for a Page is DOC, not File; the Wrizors' list claude/wrizors/machina-doc-strings.md; Fable's GO, 6:30 pm). BROWSERLESS: no box turn, no browser.
// The word lives in the lexicon alone (themeLexicon's page noun + overrides/machina.ts). This check reads the REAL modules (esbuild bundle, the c13-10c recipe) and holds:
//   D1  CENSUS: no Machina reading of any desk term names a page "File" or "Files" (any case): every hit is one the allowlist names, and the allowlist is exactly
//       { placesNewDrawer, helpPublish }: "File" is the VERB in the first ("File to a new project..."), and in the second a file is the EXPORT ("Share a page as a link or a file"), not the page
//   D2  the exceptions are alive: placesNewDrawer still reads "File to a new project..." under Machina (the verb is kept; a quiet rename to "Doc to..." would be a wrong word), and each allowlisted
//       key still holds the word (a stale exception is red: take it out)
//   D3  the noun: themeLexicon's page noun under Machina is Doc / Docs; Arbor's is still Pages and Flux's still Doc / Docs; Machina's other nouns (Project, Folder, Plan, Block,
//       Notebook) are untouched (so "Doc" sits apart from "Folder")
//   D4  the five words the rail and the doors show read Docs / Doc under Machina: drawerPage, boardPageDoor, graftGroupPages, cascadePlanSectionPages, railPageKind starts "Docs"
//   D5  the census reads the whole table (800+ keys, 100+ Machina overrides): a census that read nothing would pass anything
// Mutants (each must LAND and turn its check RED, on a copy of what was read): a Machina string planted "Files" (D1); the same planted lowercase "your files" and as "File" (D1);
// the allowlist emptied (D1 goes red on exactly the two allowlisted keys: the detector sees the verb and the export, so the exceptions are the only reason it passes); an allowlisted key that lost the word (D2); the page noun planted File / Files (D3);
// the verb planted "Doc to a new project..." (D2).
// Run: node scripts/harness/machina-doc-word.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(HERE, '..', '..');
const ROOT = path.resolve(DESKTOP, '..', '..');
const SRCP = path.join(DESKTOP, 'src').split(path.sep).join('/');
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `  [${detail}]`}`); };

// ---- the real modules, bundled
const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm');
const esb = fs.readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d));
const bin = path.join(pnpmDir, esb, 'node_modules', 'esbuild', 'bin', 'esbuild');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wz-machina-doc-'));
const entry = path.join(tmp, 'entry.ts'), out = path.join(tmp, 'bundle.mjs');
fs.writeFileSync(entry, ['deskLexicon', 'themeLexicon'].map((n) => `export * as ${n} from '${SRCP}/store/${n}';`).join('\n'));
execFileSync(process.execPath, [bin, entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=error', '--external:@fontsource/*',
  '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true', '--define:import.meta.env.MODE="production"'], { stdio: 'pipe' });
globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.document = { documentElement: { setAttribute() {}, removeAttribute() {}, getAttribute: () => null } };
const mod = await import(pathToFileURL(out).href);
const seam = globalThis.wrizoDeskLexicon;
const keys = seam.CANONICAL_TERMS;
const machina = Object.fromEntries(keys.map((k) => [k, seam.t(k, 'machina')]));
const FORMS = (theme, k) => mod.themeLexicon.formsFor(theme, k);
const formsNow = { machina: { page: FORMS('machina', 'page') }, plateau: { page: FORMS('plateau', 'page') }, flux: { page: FORMS('flux', 'page') } };
const nounsNow = Object.fromEntries(['drawer', 'binder', 'board', 'box', 'journal'].map((k) => [k, FORMS('machina', k)]));

// ---- the census, a pure function over a table of Machina readings and an allowlist
const FILE_WORD = /\bfiles?\b/i;
const census = (table, allow) => Object.entries(table).filter(([k, v]) => typeof v === 'string' && FILE_WORD.test(v) && !allow.includes(k)).map(([k, v]) => `${k}: ${v}`);
const ALLOW = ['placesNewDrawer', 'helpPublish'];        // placesNewDrawer: "File" is the verb; helpPublish: a file is the export, not the page
const nounOk = (f) => f.machina.page.one === 'Doc' && f.machina.page.many === 'Docs' && f.plateau.page.one === 'Pages' && f.flux.page.one === 'Doc' && f.flux.page.many === 'Docs';

const left = census(machina, ALLOW);
ok(`D1 no Machina reading of any of ${keys.length} desk terms names a page File / Files; the allowlist is exactly ${JSON.stringify(ALLOW)}`, left.length === 0, left.slice(0, 5).join(' | '));
ok('D2 the verb is kept: placesNewDrawer still reads "File to a new project…" under Machina', machina.placesNewDrawer === 'File to a new project…', machina.placesNewDrawer);
ok('D2 each allowlisted key still holds the word (a stale exception is red)', ALLOW.every((k) => FILE_WORD.test(machina[k] || '')), JSON.stringify(ALLOW.filter((k) => !FILE_WORD.test(machina[k] || ''))));
ok('D3 the page noun is Doc / Docs under Machina, Pages under Arbor, Doc / Docs under Flux', nounOk(formsNow), JSON.stringify(formsNow));
ok('D3 Machina\'s other nouns are untouched (Project, Folder, Plan, Block, Notebook)',
  nounsNow.drawer.one === 'Project' && nounsNow.binder.one === 'Folder' && nounsNow.board.one === 'Plan' && nounsNow.box.one === 'Block' && nounsNow.journal.one === 'Notebook', JSON.stringify(nounsNow));
ok('D4 the doors read Docs: drawerPage, boardPageDoor, graftGroupPages, cascadePlanSectionPages = "Docs"; railPageKind = "Docs Kind"; linksKindPage = "Doc"',
  ['drawerPage', 'boardPageDoor', 'graftGroupPages', 'cascadePlanSectionPages'].every((k) => machina[k] === 'Docs') && machina.railPageKind === 'Docs Kind' && machina.linksKindPage === 'Doc', JSON.stringify(['drawerPage', 'boardPageDoor', 'railPageKind', 'linksKindPage'].map((k) => machina[k])));
const overrides = keys.filter((k) => machina[k] !== seam.t(k, 'plateau')).length;
ok(`D5 the census read the real table (800+ keys, 100+ Machina overrides): ${keys.length} keys, ${overrides} differ from Arbor`, keys.length >= 800 && overrides >= 100, `${keys.length} / ${overrides}`);

// ---- mutants: each must land and turn its check red
const plant = (k, v) => ({ ...machina, [k]: v });
const lands = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
{
  const m1 = plant('drawerPage', 'Files');
  ok('MUT-D1a a Machina string planted "Files" lands and the census goes RED', lands(m1, machina) && census(m1, ALLOW).length === 1);
  const m2 = plant('deckRoomEvery', 'Your files');
  ok('MUT-D1b a string planted "Your files" (lowercase, plural) lands and the census goes RED', lands(m2, machina) && census(m2, ALLOW).length === 1);
  const m3 = plant('cascadePageNewPage', 'New File');
  ok('MUT-D1c a string planted "New File" lands and the census goes RED', lands(m3, machina) && census(m3, ALLOW).length === 1);
  ok('MUT-D1d the allowlist emptied: the census goes RED on exactly the two allowlisted keys (the detector sees the verb and the export; the exceptions are why it passes)', census(machina, []).length === ALLOW.length && ALLOW.every((k) => census(machina, []).some((s) => s.startsWith(k + ':'))), JSON.stringify(census(machina, [])));
  const m5 = structuredClone(machina); m5.helpPublish = 'Share a page as a link or a doc.';
  ok('MUT-D2b an allowlisted key that lost the word (helpPublish planted "doc") lands and the stale-exception check goes RED', lands(m5, machina) && !ALLOW.every((k) => FILE_WORD.test(m5[k] || '')));
  const f1 = structuredClone(formsNow); f1.machina.page = { one: 'File', many: 'Files' };
  ok('MUT-D3 the page noun planted File / Files lands and D3 goes RED', lands(f1, formsNow) && !nounOk(f1));
  const f2 = structuredClone(formsNow); f2.machina.page = { one: 'Doc', many: 'Files' };
  ok('MUT-D3b the plural alone planted Files lands and D3 goes RED', lands(f2, formsNow) && !nounOk(f2));
  const m4 = plant('placesNewDrawer', 'Doc to a new project…');
  ok('MUT-D2 the verb planted "Doc to a new project…" lands and D2 goes RED', lands(m4, machina) && m4.placesNewDrawer !== 'File to a new project…');
}

fs.rmSync(tmp, { recursive: true, force: true });
const failed = results.filter((r) => !r.pass).length;
console.log(`\nMACHINA-DOC-WORD VERIFY: ${failed ? `FAIL - ${failed}/${results.length} failed` : `PASS (${results.length} checks)`}`);
process.exit(failed ? 1 : 0);

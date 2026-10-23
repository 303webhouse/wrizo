// HIDE-WORKSHOP (Nick's ruling, Oct 23 11:01 am, relayed by Fable): the Workshop tab in the mode strip is HIDDEN in EVERY theme until Workshop is
// built (Arbor Workshop, Flux Relay, Machina Workshop, Nomad Commune, Volant's glyph). ABSENT, not greyed; its "coming soon" flash goes with it.
//
// THE CENSUS (stated, not remembered; grep `[Ww]orkshop` over apps/desktop/src at the branch point, origin/main 1456da5c): 20 occurrences in 10 files.
//   FOUR render sites (the tab itself): ModeStrip.tsx (the framed strip's `key: 'workshop'` item), PageEditor.tsx and QuickSprint.tsx (ModeSwitcher's
//   `actions` list), JournalEntry.tsx (the legacy loose-entry tab row). Those four are what this ruling hides.
//   THREE lexicon entries (deskLexicon.ts: the `modeWorkshop` type member, its canonical 'Workshop', Flux's 'Relay') - KEPT on purpose: they are the
//   per-theme words for the day the tab comes back, and no render site reads them any more. (Nomad/Volant/Machina have no ThemeId yet.)
//   THIRTEEN comments/docs mentions (index.css x2, ModeStage, ScriptEditor, WritingIncentives, ModeSwitcher x3, ModeStrip x4 - ModeStrip's header updated).
// HARNESS CENSUS (apps/desktop/scripts): files that READ the tab: ab1 (3 checks), ab2 (1), cd1 (1), item112a (1, the flash CONTROL), th2 (1 locator by
// INDEX); flux-v2.mjs only holds the lexicon table (unaffected). Every one of those is parked verbatim with a successor (th2 is a labelled
// maintenance re-anchor - its claim, "the Publish action opens its dialog", is unchanged).
//
// WHY ONE FLASH SURVIVES: ModeStrip's `flashSoon` also serves the screenplay's deferred Free Write / Revise, and ModeSwitcher's serves the deferred
// Format mode - so only WORKSHOP's own flash goes; the machinery stays.
//
// What is proven (browserless - a pure source read, the typewriter-scope-source.mjs idiom; the DOM-level proof is the parked successors in
// ab1/ab2/cd1/item112a, which need a box turn):
//   T1 ModeStrip's item list has no 'workshop' item and still has freewrite/draft/revise/publish
//   T2 ModeSwitcher's two `actions` lists (PageEditor, QuickSprint) carry no Workshop and still carry Publish
//   T3 the legacy JournalEntry tab row carries no Workshop and still carries Draft/Format/Publish
//   T4 no render site reads the Workshop word any more (no `modeWorkshop` call anywhere in components/ or pages/) - so NO theme can show it
//   T5 Workshop's own flash is gone (no `flashSoon(t('modeWorkshop'))`) while the flash machinery survives for the other deferred postures
//   MUTANTS (each turns its check RED): re-add Workshop to ModeStrip (T1), to PageEditor's actions (T2), to JournalEntry's row (T3)
//
// Run (repo root, no server/grant needed): node apps/desktop/scripts/harness/hide-workshop-source.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '..', 'src');
const src = (rel) => readFileSync(join(SRC, rel), 'utf8').replace(/\r\n/g, '\n');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };

const strip = src('components/ModeStrip.tsx');
const pe = src('pages/PageEditor.tsx');
const qs = src('pages/QuickSprint.tsx');
const je = src('pages/JournalEntry.tsx');

const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const itemsBlock = (s) => { const m = s.match(/const items:[\s\S]*?\n  \];/); return m ? noComments(m[0]) : ''; };
const actionsBlock = (s) => { const m = s.match(/actions=\{\[[\s\S]*?\]\}/); return m ? noComments(m[0]) : ''; };
const journalRow = (s) => { const m = s.match(/\{\['Draft'[^\]]*\]\.map\(label/); return m ? m[0] : ''; };

// T1
const keys = [...itemsBlock(strip).matchAll(/key: '([a-z]+)'/g)].map((m) => m[1]);
ok('T1: ModeStrip\'s item list is freewrite / draft / revise / publish - no workshop item', JSON.stringify(keys) === JSON.stringify(['freewrite', 'draft', 'revise', 'publish']), JSON.stringify(keys));

// T2
const peActions = actionsBlock(pe);
const qsActions = actionsBlock(qs);
ok('T2: PageEditor\'s ModeSwitcher actions carry Publish and no Workshop', /lex\('publish'\)/.test(peActions) && !/Workshop/i.test(peActions), peActions.replace(/\s+/g, ' '));
ok('T2: QuickSprint\'s ModeSwitcher actions carry Publish and no Workshop', /lex\('publish'\)/.test(qsActions) && !/Workshop/i.test(qsActions), qsActions.replace(/\s+/g, ' '));

// T3
const row = journalRow(je);
ok('T3: the legacy JournalEntry tab row is Draft / Format / Publish - no Workshop', /'Draft', 'Format', lex\('publish'\)/.test(row) && !/Workshop/i.test(row), row);

// T4 - no render site reads the word, so no theme (Workshop / Relay / a future Commune) can show it
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts)$/.test(f) ? [p] : []; });
const readers = ['components', 'pages'].flatMap((d) => walk(join(SRC, d))).filter((p) => /modeWorkshop/.test(noComments(readFileSync(p, 'utf8'))));
ok('T4: no component or page reads the modeWorkshop term - every theme\'s word for the tab is unreachable until it is re-added', readers.length === 0, JSON.stringify(readers.map((p) => p.replace(SRC, ''))));
ok('T4: the lexicon KEEPS the term (canonical + Flux\'s Relay) so un-hiding is a one-line re-add per site', /modeWorkshop: 'Workshop'/.test(src('store/deskLexicon.ts')) && /modeWorkshop: 'Relay'/.test(src('store/deskLexicon.ts')), '');

// T5
const stripCode = noComments(strip);
ok('T5: Workshop\'s own "coming soon" flash is gone', !/flashSoon\(t\('modeWorkshop'\)\)/.test(stripCode), '');
ok('T5: the flash machinery SURVIVES for the other deferred postures (screenplay Free Write / Revise)', /flashSoon\(t\('modeFreeWrite'\)\)/.test(stripCode) && /flashSoon\(t\('modeRevise'\)\)/.test(stripCode), '');

// MUTANTS - each re-adds the tab; the matching check must go RED (and the edit must have landed)
{
  const m1 = strip.replace("    { key: 'publish'", "    { key: 'workshop', label: t('modeWorkshop'), live: false, active: false, onClick: () => flashSoon(t('modeWorkshop')) },\n    { key: 'publish'");
  const k1 = [...itemsBlock(m1).matchAll(/key: '([a-z]+)'/g)].map((m) => m[1]);
  ok('MUTANT: Workshop re-added to ModeStrip - T1 must go RED', m1 !== strip && JSON.stringify(k1) !== JSON.stringify(['freewrite', 'draft', 'revise', 'publish']), JSON.stringify(k1));
  const m2 = pe.replace("            { label: lex('publish')", "            { label: 'Workshop', sub: 'coming soon', deferred: true },\n            { label: lex('publish')");
  ok('MUTANT: Workshop re-added to PageEditor\'s actions - T2 must go RED', m2 !== pe && /Workshop/i.test(actionsBlock(m2)), '');
  const m3 = je.replace("['Draft', 'Format', lex('publish')]", "['Draft', 'Format', 'Workshop', lex('publish')]");
  ok('MUTANT: Workshop re-added to JournalEntry\'s row - T3 must go RED', m3 !== je && /Workshop/i.test(journalRow(m3)), journalRow(m3));
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nHIDE-WORKSHOP-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nHIDE-WORKSHOP-SOURCE VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);

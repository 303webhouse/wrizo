// ARBOR v2 MOCKUP - §14 items 2-3, BROWSERLESS half: the Tools drawer's cloth tabs regroup sections, they never add or lose one.
// Runs on Node >= 22.18 (type stripping): node scripts/harness/arbor2-23-unit.mjs. No browser, no box turn.
//
//   U1  for every surface, the union of the Arbor tabs' sections == the union of drawerSet's text + ink sections (nothing lost, nothing new)
//   U2  the tab rows: Free Write with an instrument = Font, Ink; without = no row (one tab); Draft = Font, Format, Presets; Revise and Board =
//       no row (one tab); Empty = none
//   U3  Free Write's ink tab shows exactly drawerSet's ink sections; its type tab exactly drawerSet's text sections (the instrument switch
//       is unchanged in what it shows)
import { arborToolTabs, arborSectionAllowed, arborSectionsUnion } from '../../src/arbor2/drawerTabs.ts';
import { sectionsFor } from '../../src/store/drawerSet.ts';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const KINDS = ['empty', 'freewrite', 'draft', 'revise', 'board'];

for (const kind of KINDS) {
  const today = [...new Set([...sectionsFor(kind, 'text'), ...sectionsFor(kind, 'ink')])];
  const arbor = arborSectionsUnion(kind);
  ok(`U1 [${kind}] the Arbor tabs show exactly today's sections (nothing lost, nothing new)`, same(today, arbor), JSON.stringify({ today, arbor }));
}
// PARKED 2026-10-31 (SUPERSEDED: spec §9c, Nick Oct 31 1:19 pm - three cloths per drawer, Format the main tab (Typeface, Ink colour, Page kind,
// Progress): the r4 Font tab ('type') folds into Format). Original, verbatim:
// const rows = {
//   'freewrite+instrument': [arborToolTabs('freewrite', true), ['type', 'ink']],
//   'freewrite (no instrument)': [arborToolTabs('freewrite', false), ['type']],
//   draft: [arborToolTabs('draft', false), ['type', 'format', 'presets']],
//   revise: [arborToolTabs('revise', false), ['type']],
//   board: [arborToolTabs('board', false), ['type']],
//   empty: [arborToolTabs('empty', false), []],
// };
// for (const [name, [got, want]] of Object.entries(rows)) ok(`U2 [${name}] tabs ${JSON.stringify(want)}`, JSON.stringify(got) === JSON.stringify(want), JSON.stringify(got));
// SUCCESSOR U2b: Format · Presets · Ink - Free Write with an instrument = Format, Ink; Draft = Format, Presets; the rest one tab or none.
const rows = {
  'freewrite+instrument': [arborToolTabs('freewrite', true), ['format', 'ink']],
  'freewrite (no instrument)': [arborToolTabs('freewrite', false), ['format']],
  draft: [arborToolTabs('draft', false), ['format', 'presets']],
  revise: [arborToolTabs('revise', false), ['format']],
  board: [arborToolTabs('board', false), ['format']],
  empty: [arborToolTabs('empty', false), []],
};
for (const [name, [got, want]] of Object.entries(rows)) ok(`U2b [${name}] tabs ${JSON.stringify(want)}`, JSON.stringify(got) === JSON.stringify(want), JSON.stringify(got));
const all = ['typeface', 'forwardLock', 'capture', 'ink', 'format', 'actions', 'templates', 'pageKind', 'boardTools'];
const on = (tab) => all.filter((s) => arborSectionAllowed('freewrite', tab, s));
ok('U3 Free Write: the Ink tab shows exactly the ink instrument\'s sections', same(on('ink'), [...sectionsFor('freewrite', 'ink')]), JSON.stringify(on('ink')));
// PARKED 2026-10-31 (SUPERSEDED: spec §9c - the Font tab is Format now). Original, verbatim:
// ok('U3 Free Write: the Font tab shows exactly the text instrument\'s sections', same(on('type'), [...sectionsFor('freewrite', 'text')]), JSON.stringify(on('type')));
// SUCCESSOR U3b: Free Write's Format tab shows exactly the text instrument's sections.
ok('U3b Free Write: the Format tab shows exactly the text instrument\'s sections', same(on('format'), [...sectionsFor('freewrite', 'text')]), JSON.stringify(on('format')));

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-23-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-23-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);

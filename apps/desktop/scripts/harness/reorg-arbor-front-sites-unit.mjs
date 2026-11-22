// THE REORG'S FRONT MENU IN ARBOR, ITS SOURCE SITES, BROWSERLESS (Fable, Nov 21, 6:54 pm: "INK takes Arbor's FRONT MENU"; claude/wrizors/arbor-reorg-spec.md section 4: tabs FORMAT (olive) | INK (madder) | SECTIONS (cold blue); "Arbor's PRESETS tab retires: its contents move to the SECTIONS
// head menu ... No section of today's drawer is lost; arbor2/drawerTabs.ts keeps its no-section-lost check"; "Publish: FORMAT and INK greyed, with the note, as in Machina"). No browser, no box. components/Sliver.tsx and reorg/frontTabs.ts are read as source: each site is a census (the line reads what the
// build needs and the line it replaces is gone), each with a mutant that puts the old line back and must turn the census RED; then the retire rule's guard is held and arbor2/drawerTabs.ts's own no-section-lost law is kept. The live half is reorg-arbor-front-live.mjs.
//   LABEL    the first tab reads Arbor's FORMAT (railFormat) in the plateau theme, Machina's TEXT everywhere else: the tab row is the theme's own words
//   RETIRE   in Arbor the FORMAT tab no longer shows Draft's ready-made starts (the templates section): they live in SECTIONS' head menu (reorg/DocKindMenu.tsx), so Presets is not on two tabs; every other theme keeps today's reading
//   GUARD    frontSectionAllowed retires only the templates section, only when asked (Arbor), before the drawerSet lookup; Machina's TEXT keeps it; nothing else changes
//   NOLOSS   arbor2/drawerTabs.ts is untouched: its union still covers every section drawerSet shows (arbor2-23.mjs reads it), because the Front menu regroups, it does not remove
//   FROZEN   in Publish the FORMAT and INK tabs are greyed with the note (reorgPubFrozen), SECTIONS stays: the Machina rule, unchanged
// Run: node scripts/harness/reorg-arbor-front-sites-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const SLIVER = rd('components/Sliver.tsx');
const TABS = rd('reorg/frontTabs.ts');
const ARBTABS = rd('arbor2/drawerTabs.ts');

// each site: [name, file label, the text the build needs, the text it replaces (the old reading, which the mutant puts back)]
const SITES = [
  ['LABEL', 'Sliver', "const FRONT_WORD: Record<FrontTab, DeskTermId> = { text: sliverTheme === 'plateau' ? 'railFormat' : 'inkModeText', ink: 'inkModeInk', parts: 'reorgFrontParts' };", "const FRONT_WORD: Record<FrontTab, DeskTermId> = { text: 'inkModeText', ink: 'inkModeInk', parts: 'reorgFrontParts' };"],
  ['RETIRE', 'Sliver', "frontSectionAllowed(content.kind as DrawerKind, frontTab, section, theme === 'plateau')", "frontSectionAllowed(content.kind as DrawerKind, frontTab, section)"],
  ['RETIRE-fn', 'Tabs', "export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection, retirePresets = false): boolean {\n  if (tab === 'parts') return false;\n  if (retirePresets && section === 'templates') return false;", "export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection): boolean {\n  if (tab === 'parts') return false;"],
  ['FROZEN', 'Sliver', "(front?.publishing && id !== 'parts' ? { id, label: t(FRONT_WORD[id]), disabled: true, title: t('reorgPubFrozen') } : { id, label: t(FRONT_WORD[id]) })", "(front?.publishing && id !== 'parts' ? { id, label: t(FRONT_WORD[id]), disabled: true } : { id, label: t(FRONT_WORD[id]) })"],
];
const FILES = { Sliver: SLIVER, Tabs: TABS };
const siteOk = (text, want, old) => text.includes(want) && !text.includes(old);
for (const [name, file, want, old] of SITES) {
  const text = FILES[file];
  ok(name + ' ' + file + " reads the build's text and the old one is gone", !!text && siteOk(text, want, old), J({ has: text.includes(want), oldLeft: text.includes(old) }));
  const back = text ? text.replace(want, () => old) : '';
  ok('MUT ' + name + ': the old reading put back LANDS and the census goes RED', !!text && back !== text && !siteOk(back, want, old), J({ landed: back !== text }));
}

// GUARD: no TypeScript loader here, so the rule (two literal guards) is held by its order and operands, and drawerSet's own text list is read for the section the rule names
ok("GUARD drawerSet lists 'templates' on Draft's text tab (so there is something to retire), and on no other kind's", /draft: \{ text: \[[^\]]*'templates'/.test(rd('store/drawerSet.ts')) && !/(freewrite|revise|board): \{ text: \[[^\]]*'templates'/.test(rd('store/drawerSet.ts')), J({}));
ok('GUARD the retire guard is on the same line pair as the parts guard, before the drawerSet lookup', /if \(tab === 'parts'\) return false;\n  if \(retirePresets && section === 'templates'\) return false;\n  return sectionsFor/.test(TABS), J({}));
ok('GUARD (mutant) the retire guard dropped is caught', (() => { const m = TABS.replace("  if (retirePresets && section === 'templates') return false;\n", () => ''); return m !== TABS && !/if \(retirePresets && section === 'templates'\) return false;/.test(m); })(), J({}));
ok('NOLOSS arbor2/drawerTabs.ts still lists Draft templates under presets (its own union), untouched by the Front menu', /draft: \{ format: \['typeface', 'format', 'actions', 'pageKind'\], presets: \['templates'\] \}/.test(ARBTABS), J({}));

let bad = 0;
for (const c of checks) { console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.name + (c.pass ? '' : '  -- ' + String(c.detail).slice(0, 400))); if (!c.pass) bad += 1; }
console.log(bad ? '\nREORG-ARBOR-FRONT-SITES-UNIT VERIFY: FAIL - ' + bad + '/' + checks.length + ' failed' : '\nREORG-ARBOR-FRONT-SITES-UNIT VERIFY: PASS (' + checks.length + ' checks)');
process.exit(bad ? 1 : 0);

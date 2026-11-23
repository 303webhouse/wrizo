// THE REORG'S FRONT MENU IN ARBOR, ITS SOURCE SITES, BROWSERLESS (Fable, Nov 21, 6:54 pm: "INK takes Arbor's FRONT MENU"; claude/wrizors/arbor-reorg-spec.md section 4: tabs FORMAT (olive) | INK (madder) | SECTIONS (cold blue); "Arbor's PRESETS tab retires: its contents move to the SECTIONS
// head menu ... No section of today's drawer is lost; arbor2/drawerTabs.ts keeps its no-section-lost check"; "Publish: FORMAT and INK greyed, with the note, as in Machina"). No browser, no box. components/Sliver.tsx and reorg/frontTabs.ts are read as source: each site is a census (the line reads what the
// build needs and the line it replaces is gone), each with a mutant that puts the old line back and must turn the census RED; then the retire rule's guard is held and arbor2/drawerTabs.ts's own no-section-lost law is kept. The live half is reorg-arbor-front-live.mjs.
//   LABEL    the first tab reads Arbor's FORMAT (railFormat) in the plateau theme, Machina's TEXT everywhere else: the tab row is the theme's own words
//   RETIRE   in Arbor the FORMAT tab no longer shows Draft's ready-made starts (the templates section): they live in SECTIONS' head menu (reorg/DocKindMenu.tsx), so Presets is not on two tabs; every other theme keeps today's reading
//   GUARD    frontSectionAllowed retires only the templates section, only when asked (Arbor), before the drawerSet lookup; Machina's TEXT keeps it; nothing else changes
//   NOLOSS   arbor2/drawerTabs.ts is untouched: its union still covers every section drawerSet shows (arbor2-23.mjs reads it), because the Front menu regroups, it does not remove
//   FROZEN   in Publish the FORMAT and INK tabs are greyed with the note (reorgPubFrozen), SECTIONS stays: the Machina rule, unchanged
//   SETUP    (Fable, Nov 21, 9:40 pm: "Page Setup lives in the kind menu ONLY, as in Machina: drop it from FORMAT's foot") in Arbor the FORMAT tab no longer ends in Page setup: the SECTIONS kind menu holds it (it renders on every surface that has a Front menu: Draft and Revise); every other theme keeps today's reading
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
  // SUPERSEDED (Nov 22, the Wrizors pass 6 NIT 2: FORMAT's Pages Kind row retires as Presets did): the original, verbatim:
  // ['RETIRE-fn', 'Tabs', "export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection, retirePresets = false): boolean {\n  if (tab === 'parts') return false;\n  if (retirePresets && section === 'templates') return false;", "export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection): boolean {\n  if (tab === 'parts') return false;"],
  ['RETIRE-fn', 'Tabs', "export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection, retirePresets = false): boolean {\n  if (tab === 'parts') return false;\n  if (retirePresets && (section === 'templates' || section === 'pageKind')) return false;", "export function frontSectionAllowed(kind: DrawerKind, tab: FrontTab, section: DrawerSection): boolean {\n  if (tab === 'parts') return false;"],
  ['FROZEN', 'Sliver', "(front?.publishing && id !== 'parts' ? { id, label: t(FRONT_WORD[id]), disabled: true, title: t('reorgPubFrozen') } : { id, label: t(FRONT_WORD[id]) })", "(front?.publishing && id !== 'parts' ? { id, label: t(FRONT_WORD[id]), disabled: true } : { id, label: t(FRONT_WORD[id]) })"],
];
SITES.push(['SETUP', 'Sliver', "{frontTab === 'text' && frontEntry && theme !== 'plateau' && <PageSetupZone entry={getJournalEntry(frontEntry.id) ?? frontEntry} />}", "{frontTab === 'text' && frontEntry && <PageSetupZone entry={getJournalEntry(frontEntry.id) ?? frontEntry} />}"]);
  // SUPERSEDED (Nov 22, Fable 3:20 pm: the Front menu's foot goes back to POLISH's !reorgFront in every theme, so the goal is not doubled with the Session row; the named bar retires): the original, verbatim:
  // SITES.push(['GOALNAME', 'Sliver', "{named && target != null && settings.instrumentsOn && <div className=\"wz-sliver-goal-name\">{t('goalLabel')}</div>}", "{target != null && settings.instrumentsOn && ("]);
SITES.push(['GOALNAME', 'Sliver', "function SliverGoalFoot({ target, done, fraction, timerOn, firstWriteAt }: {", "function SliverGoalFoot({ target, done, fraction, timerOn, firstWriteAt, named }: {"]);
  // SUPERSEDED (Nov 22, with GOALNAME): the original, verbatim:
  // SITES.push(['GOALPROP', 'Sliver', "<SliverGoalFoot target={target} done={done} fraction={fraction} timerOn={settings.timer} firstWriteAt={firstWriteAt} named={reorgFront && sliverTheme === 'plateau'} />", "<SliverGoalFoot target={target} done={done} fraction={fraction} timerOn={settings.timer} firstWriteAt={firstWriteAt} />"]);
SITES.push(['GOALFOOT', 'Sliver', "{!reorgFront && <SliverGoalFoot target={target} done={done} fraction={fraction} timerOn={settings.timer} firstWriteAt={firstWriteAt} />}", "{(!reorgFront || sliverTheme === 'plateau') && <SliverGoalFoot target={target} done={done} fraction={fraction} timerOn={settings.timer} firstWriteAt={firstWriteAt} named={reorgFront && sliverTheme === 'plateau'} />}"]);
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
  // SUPERSEDED (Nov 22, pass 6 NIT 2): the original, verbatim:
  // ok('GUARD the retire guard is on the same line pair as the parts guard, before the drawerSet lookup', /if \(tab === 'parts'\) return false;\n  if \(retirePresets && section === 'templates'\) return false;\n  return sectionsFor/.test(TABS), J({}));
ok('GUARD the retire guard is on the same line pair as the parts guard, before the drawerSet lookup (templates and pageKind)', /if \(tab === 'parts'\) return false;\n  if \(retirePresets && \(section === 'templates' \|\| section === 'pageKind'\)\) return false;\n  return sectionsFor/.test(TABS), J({}));
  // SUPERSEDED (Nov 22, pass 6 NIT 2): the original, verbatim:
  // ok('GUARD (mutant) the retire guard dropped is caught', (() => { const m = TABS.replace("  if (retirePresets && section === 'templates') return false;\n", () => ''); return m !== TABS && !/if \(retirePresets && section === 'templates'\) return false;/.test(m); })(), J({}));
ok('GUARD (mutant) the retire guard dropped is caught', (() => { const m = TABS.replace("  if (retirePresets && (section === 'templates' || section === 'pageKind')) return false;\n", () => ''); return m !== TABS && !/if \(retirePresets && \(section === 'templates' \|\| section === 'pageKind'\)\) return false;/.test(m); })(), J({}));
ok('GUARD (mutant) the pageKind half dropped is caught: the Pages Kind row would be back on FORMAT', (() => { const m = TABS.replace(" || section === 'pageKind'", () => ''); return m !== TABS && !/section === 'pageKind'/.test(m); })(), J({}));
ok('GUARD drawerSet lists pageKind on Draft\'s text tab (so there is a row to retire)', /draft: \{ text: \[[^\]]*'pageKind'/.test(rd('store/drawerSet.ts')), J({}));
ok('NOLOSS arbor2/drawerTabs.ts still lists Draft templates under presets (its own union), untouched by the Front menu', /draft: \{ format: \['typeface', 'format', 'actions', 'pageKind'\], presets: \['templates'\] \}/.test(ARBTABS), J({}));

let bad = 0;
for (const c of checks) { console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.name + (c.pass ? '' : '  -- ' + String(c.detail).slice(0, 400))); if (!c.pass) bad += 1; }
console.log(bad ? '\nREORG-ARBOR-FRONT-SITES-UNIT VERIFY: FAIL - ' + bad + '/' + checks.length + ' failed' : '\nREORG-ARBOR-FRONT-SITES-UNIT VERIFY: PASS (' + checks.length + ' checks)');
process.exit(bad ? 1 : 0);

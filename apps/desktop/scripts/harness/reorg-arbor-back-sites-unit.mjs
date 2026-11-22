// THE REORG'S BACK MENU IN ARBOR, ITS TUTOR.TSX SITES, BROWSERLESS (Fable, Nov 21, 4:58 pm: Arbor's Back menu behind themeGate's plateau.back; claude/wrizors/arbor-reorg-spec.md section 5: the tabs top to bottom PLAN (madder), GRAFTS (cold blue), TUTOR (olive); "Publish: all three ... Before you publish
// in TUTOR"). No browser, no box. components/Tutor.tsx is read as source: each site is a census (the line reads what the build needs and the line it replaces is gone), each with a mutant that puts the old line back and must turn the census RED. The live half is reorg-arbor-back-live.mjs.
//   TABS    with the Back menu on in Arbor the tab row is the reorg's (PLAN | GRAFTS | TUTOR), not Arbor's own (TUTOR | GRAFTS | BOARD): Arbor's cloth tabs are chosen only when the Back menu is off
//   FOLD    in Arbor (and every theme but Machina) "Before you publish" is NOT a fourth tab: it stands at the head of the TUTOR tab while the publishing view is open (the spec's three tabs)
//   BODY    the TUTOR tab's body carries it: the fold renders BeforeExport above the lenses, only while publishing and not in Free Write
//   LINKS   the GRAFTS pane is the reorg's own (grouped by canvas, with the Doc's own list) in Arbor, not Arbor's "only grafts" view: the Arbor-only filter is not given when the Back menu is on
// Run: node scripts/harness/reorg-arbor-back-sites-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const TUTOR = rd('components/Tutor.tsx');

// each site: [name, the line the build needs, the line it replaces (the old reading, which the mutant puts back)]
const SITES = [
  ['TABS', "tabs={((back ? rightTabs : arborRightTabs) ?? rightTabs) as DrawerTabsConfig<string>}", "tabs={(arborRightTabs ?? rightTabs) as DrawerTabsConfig<string>}"],
  ['FOLD', "const foldExport = tutorTheme !== 'machina';\n  const exportTab = back && publishing && !foldExport;", "const exportTab = back && publishing;"],
  ['BODY', "{back && foldExport && publishing && !sprint && rightTab === 'tutor' && <BeforeExport entry={entry} />}", "{rightTab === 'tutor' && ("],
  ['LINKS', "only={arbor2 && !back ? (arborBoard ? 'board' : 'grafts') : undefined}", "only={arbor2 ? (arborBoard ? 'board' : 'grafts') : undefined}"],
];
const siteOk = (text, want, old, name) => text.includes(want) && (name === 'BODY' ? true : !text.includes(old));
for (const [name, want, old] of SITES) {
  ok(`${name} Tutor.tsx reads the build's line and the old one is gone`, !!TUTOR && siteOk(TUTOR, want, old, name), J({ has: TUTOR.includes(want), oldLeft: name === 'BODY' ? null : TUTOR.includes(old) }));
  // the mutant puts the old line back (for BODY: it removes the fold line): the census must see it
  const back = TUTOR ? (name === 'BODY' ? TUTOR.replace(want, () => '') : TUTOR.replace(want, () => old)) : '';
  ok(`MUT ${name}: the old reading put back LANDS and the census goes RED`, !!TUTOR && back !== TUTOR && !siteOk(back, want, old, name), J({ landed: back !== TUTOR }));
}
// the fold sits BEFORE the TUTOR body (the head of the tab), not after it
const iFold = TUTOR.indexOf("{back && foldExport && publishing && !sprint && rightTab === 'tutor' && <BeforeExport"), iBody = TUTOR.indexOf("{rightTab === 'tutor' && (");
ok('ORDER the fold stands before the TUTOR body (at the head of the tab)', iFold > 0 && iBody > iFold, J({ iFold, iBody }));
ok("ORDER (mutant) the fold moved after the body is caught", (() => { const moved = TUTOR.replace("{back && foldExport && publishing && !sprint && rightTab === 'tutor' && <BeforeExport entry={entry} />}", () => '').replace("{back && rightTab === 'plan' && <BackPlan entry={entry} />}", () => "{back && rightTab === 'plan' && <BackPlan entry={entry} />}\n{back && foldExport && publishing && !sprint && rightTab === 'tutor' && <BeforeExport entry={entry} />}"); const a = moved.indexOf("{back && foldExport && publishing && !sprint && rightTab === 'tutor' && <BeforeExport"), b = moved.indexOf("{rightTab === 'tutor' && ("); return moved !== TUTOR && !(a > 0 && b > a); })(), '');

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 400)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-ARBOR-BACK-SITES-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ARBOR-BACK-SITES-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

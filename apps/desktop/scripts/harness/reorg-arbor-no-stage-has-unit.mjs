// THE ARBOR REORG SHEETS KEEP OFF THE STAGE'S :has() (Fable, Nov 22, 1:25 am: "arbor-keyflip holds train I: a keystroke restyling 895/1929 elements is a typing cost ... key the rules on a class or attribute the Back menu sets itself; no :has() on the stage. Add a guard like FIX's TY5").
// The cause, bisected on Actions (arbor-keyflip alone, one dispatch per commit): green on main, on the gate's table commit 9e239b4b and on the Tutor.tsx commit 995673b0; RED from cd2b5cde, the Back menu's stylesheet, which carried two rules that start at the stage:
//   .desk-frame-stage:has(#wz-tutor-tab-plan[data-on='true']){ --arbor2-chosen-r:#A8392F; }   and   .desk-frame-stage:has(#wz-tutor-tab-plan[data-on='true']) .wz-tutor-panel .wz-drawer-slide--right{ ... }
// A condition on the stage that depends on its descendants is re-read on the restyle the first key causes (data-writing, data-chrome-receded flip on the stage), and a custom property set on the stage makes every descendant restyle: 895 of 1929 elements at the keystroke that starts writing. It fails WITHOUT ?reorg=1 too:
// the sheets are global, so every Arbor writer paid it, switch on or off.
// No browser, no box. The sheets are read as text; the rule is: no selector in a 25-reorg-arbor-*.css file has a :has() whose subject is the stage (.desk-frame-stage), the frame or the root. Anchor-level :has() (the drawers' own anchors, as arbor-v2.css has) is not the stage's and stays.
//   TY5  no stage-level, frame-level or root-level :has() in any 25-reorg-arbor-*.css (the census reads every one of them: the number of sheets and rules read is printed, and a guard that read none would be blind)
//   LIVE the scanner is a matcher, not a wall: it flags the two stage rules above, and it passes an anchor-level :has()
// Run: node scripts/harness/reorg-arbor-no-stage-has-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const STYLES = fileURLToPath(new URL('../../src/styles/', import.meta.url));
const lf = (s) => s.split('\r\n').join('\n');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const rules = (css) => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0; while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const c = t.indexOf('}', o); if (c < 0) break; out.push(t.slice(i, o).trim().replace(/\s+/g, ' ')); i = c + 1; } return out; };
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d += 1; else if (ch === ')' || ch === ']') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
// a stage-level :has(: a compound that carries :has( and whose class is the stage, the frame or the root (or is the bare root pseudo)
const STAGE_HAS = /(?:\.desk-frame-stage(?:--[a-z]+)?|\.desk-frame\b|:root|html)(?:\[[^\]]*\]|:not\((?:[^()]|\([^()]*\))*\))*:has\(/;
const stageHas = (css) => rules(css).flatMap(topSplit).filter((s) => STAGE_HAS.test(s));
const files = fs.readdirSync(STYLES).filter((f) => /^25-reorg-arbor-.*\.css$/.test(f)).sort();
const texts = Object.fromEntries(files.map((f) => [f, lf(fs.readFileSync(STYLES + f, 'utf8'))]));
const bad = Object.fromEntries(files.map((f) => [f, stageHas(texts[f]).map((s) => s.slice(0, 120))]).filter(([, v]) => v.length));
const nRules = files.reduce((n, f) => n + rules(texts[f]).length, 0);
ok(`TY5 no stage-level, frame-level or root-level :has() in any 25-reorg-arbor-*.css (read ${files.length} sheets, ${nRules} rules)`, files.length >= 5 && nRules >= 300 && Object.keys(bad).length === 0, J({ files, nRules, bad }));

// LIVE: the scanner finds the two rules that cost the keystroke, and lets an anchor-level :has() pass
const T2A = ":root[data-arbor2][data-theme='plateau']:not([data-arbor2-off~='tabs']) .desk-frame-stage:has(#wz-tutor-tab-plan[data-on='true']){ --arbor2-chosen-r:#A8392F; }";
const T2B = ":root[data-arbor2][data-theme='plateau']:not([data-arbor2-off~='tabs']) .desk-frame-stage:has(#wz-tutor-tab-plan[data-on='true']) .wz-tutor-panel .wz-drawer-slide--right{ box-shadow:none; }";
const ANCH = ":root[data-arbor2][data-theme='plateau'] .desk-frame-tutor-anchor:has(.wz-tutor-grip[data-open='true']) .arbor2-c2--right{ left:0; }";
ok('LIVE the scanner flags both stage rules that cost the keystroke, and passes an anchor-level :has()', stageHas(T2A).length === 1 && stageHas(T2B).length === 1 && stageHas(ANCH).length === 0 && stageHas(":root:has(.x) .y{ a:b; }").length === 1 && stageHas(".desk-frame-stage--prose:has(.x) .y{ a:b; }").length === 1, J({ a: stageHas(T2A).length, b: stageHas(T2B).length, anchor: stageHas(ANCH).length }));

// MUTANTS: a stage-level :has() put into each sheet in turn must turn TY5 red (the mutant LANDED: the text changed)
for (const f of files) {
  const after = texts[f] + '\n:root[data-arbor2][data-theme=\'plateau\'] .desk-frame-stage:has(#wz-tutor-tab-plan[data-on=\'true\']){ --arbor2-chosen-r:#A8392F; }\n';
  const landed = after !== texts[f];
  const flagged = stageHas(after).length > stageHas(texts[f]).length;
  ok(`MUT a stage-level :has() added to ${f}: it LANDED and the scanner flags it`, landed && flagged, J({ landed, flagged }));
}

let failed = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) failed += 1; }
console.log(failed ? `\nREORG-ARBOR-NO-STAGE-HAS-UNIT VERIFY: FAIL - ${failed}/${checks.length} failed` : `\nREORG-ARBOR-NO-STAGE-HAS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(failed ? 1 : 0);

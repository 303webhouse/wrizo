// THE TWO FRONT-MENU GOLDENS DIFFER BY THE TYPEWRITER TOGGLE ALONE, BROWSERLESS (Fable, Nov 20, 4:50 pm: "the front-menu golden: park-never-edit. Keep the old golden file (SUPERSEDED), the new golden as a NEW file, O1/O2 parked
// verbatim with successors on the new golden, and a mutant (the Typewriter toggle put back turns them red). I read the golden diff: it should differ only by the Typewriter toggle and its settings row, on all 12 surfaces").
//   reorg-front-menu-off-golden.json     main's switch-off drawer (cb25b7a1 era), with the Typewriter toggle: kept, SUPERSEDED (O1/O2's originals are parked against it)
//   reorg-front-menu-off-golden-tw.json  the drawer with Free Write = the Typewriter (Nick, Nov 19), captured by reorg-front-menu-capture.mjs on Actions run 44832637395, tree efde3402
// G1  on all 12 surfaces (3 themes x draft, free write, screenplay, board): the old drawer with the Typewriter toggle taken out IS the new drawer, byte for byte (nothing else changed: the settings row sits in the closed "..." menu
//     and is not in the DOM either way, which this equality also proves)
// G2  the old golden holds the toggle on every one of the 12; the new holds it on none (the successor is not an accident of a missing capture)
// G3  the sections the drawer lists (the other golden table) are identical in both
// M   MUTANTS: the successor O1/O2 compare the live drawer to the new golden by string equality. Put the toggle back into the new golden's drawer (or change one other byte) and that equality turns RED on every surface
// Run: node scripts/harness/reorg-front-menu-golden-diff.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';

const H = new URL('./', import.meta.url);
const read = (n) => JSON.parse(fs.readFileSync(new URL(n, H), 'utf8'));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const old = read('reorg-front-menu-off-golden.json');
const tw = fs.existsSync(new URL('reorg-front-menu-off-golden-tw.json', H)) ? read('reorg-front-menu-off-golden-tw.json') : null;
const TOGGLE = /<button type="button" class="wz-sliver-mode-btn" data-mode-toggle="typewriter"[^>]*>[\s\S]*?<\/button>/;
const keys = [];
for (const th of Object.keys(old.surfaces)) for (const s of Object.keys(old.surfaces[th])) keys.push([th, s]);

ok('the successor golden file exists and names the tree it was captured from', !!tw && /^[0-9a-f]{40}$/.test(tw.capturedFrom || '') && keys.length === 12, tw ? tw.capturedFrom : 'missing');
if (tw) {
  const bad = keys.filter(([th, s]) => old.surfaces[th][s].replace(TOGGLE, '') !== (tw.surfaces[th] || {})[s]);
  ok('G1 all 12 surfaces: the old drawer minus the Typewriter toggle IS the new drawer, byte for byte', bad.length === 0, JSON.stringify(bad));
  ok('G2 the old golden holds the toggle on all 12 surfaces and the new one on none', keys.every(([th, s]) => TOGGLE.test(old.surfaces[th][s]) && !/data-mode-toggle="typewriter"/.test(tw.surfaces[th][s])), '');
  ok('G3 the sections the drawer lists are identical in both goldens', JSON.stringify(old.sections) === JSON.stringify(tw.sections), '');
  // the successor O1 is `live === golden`; the mutants are the live drawer with the toggle put back, and with one other byte changed
  const o1 = (live, th, s) => live === tw.surfaces[th][s];
  const real = keys.every(([th, s]) => o1(tw.surfaces[th][s], th, s));
  const backInto = (th, s) => { const o = old.surfaces[th][s].match(TOGGLE)[0]; const cut = old.surfaces[th][s].replace(TOGGLE, ''); const at = old.surfaces[th][s].indexOf(o); return cut.slice(0, at) + o + cut.slice(at); };
  const mutToggle = keys.every(([th, s]) => o1(backInto(th, s), th, s) === false);
  const mutByte = keys.every(([th, s]) => o1(tw.surfaces[th][s].slice(0, 400) + '#' + tw.surfaces[th][s].slice(401), th, s) === false);
  ok('M0 the live drawer equal to the successor golden passes the successor O1 on all 12', real, '');
  ok('M1 MUTANT: the Typewriter toggle put back into the drawer turns the successor O1 RED on all 12 surfaces', mutToggle, '');
  ok('M2 MUTANT: any other byte changed in the drawer turns the successor O1 RED on all 12 surfaces', mutByte, '');
}
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FRONT-MENU-GOLDEN-DIFF VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FRONT-MENU-GOLDEN-DIFF VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);

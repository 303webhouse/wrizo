// ARBOR v2 MOCKUP - §14 item 7, the rhizome variation, BROWSERLESS (src/arbor2/shoots.ts + its wiring). Node >= 22.18 (type stripping). No box.
//   V1  the pace only ever rises with the count, 0 stays 0 and the goal stays whole (growth happens only on words written)
//   V2  laps really vary: across a page's laps both characters occur; a fine lap draws ahead of the plain fraction, a bold one behind it
//   V3  shoot widths: a whole stem shares one width class; a main stem is the heavier of its lap's pair; the CSS draws 1 / 1.5 / 2 / 2.5 px
//   V4  off the flag nothing changes: variationOn() is false with no flag, and RhizomeField's plain path is the original two paths on `frac`
import fs from 'node:fs';
import { lapCharacter, shootClass, pacedFrac, variationOn } from '../../src/arbor2/shoots.ts';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const seeds = Array.from({ length: 12 }, (_, i) => `page-${i}:1761700000000:8:words`);

let mono = true, ends = true, bad = '';
for (const s of seeds) for (let lap = 0; lap < 10; lap++) {
  let prev = -1;
  for (let i = 0; i <= 200; i++) {
    const v = pacedFrac(s, lap, i / 200);
    if (v < prev - 1e-12 || v < 0 || v > 1) { mono = false; bad = `${s} lap ${lap} at ${i / 200}: ${v} after ${prev}`; }
    prev = v;
  }
  if (pacedFrac(s, lap, 0) !== 0 || pacedFrac(s, lap, 1) !== 1 || pacedFrac(s, lap, 1.4) !== 1 || pacedFrac(s, lap, -1) !== 0) ends = false;
}
ok('V1 the pace never falls as the count rises, and stays inside [0, 1]', mono, bad);
ok('V1 nothing written = nothing new, the goal = the whole lap', ends, '');

let both = 0, sides = true;
for (const s of seeds) {
  const kinds = new Set(Array.from({ length: 10 }, (_, lap) => lapCharacter(s, lap)));
  if (kinds.size === 2) both++;
  for (let lap = 0; lap < 10; lap++) for (const f of [0.1, 0.3, 0.5, 0.8]) {
    const v = pacedFrac(s, lap, f);
    if (lapCharacter(s, lap) === 'fine' ? !(v > f) : !(v < f)) sides = false;
  }
}
ok('V2 every page sees both characters across ten laps', both === seeds.length, `${both}/${seeds.length}`);
ok('V2 a fine lap draws ahead of the plain fraction, a bold lap behind it', sides, '');

let stemOne = true, heavy = true, inPair = true;
for (const s of seeds) for (let lap = 0; lap < 6; lap++) {
  const base = lapCharacter(s, lap) === 'fine' ? 0 : 2;
  for (let stem = 0; stem < 20; stem++) {
    const a = shootClass(s, lap, { stem, thick: false }), b = shootClass(s, lap, { stem, thick: false });
    if (a !== b) stemOne = false;
    if (a !== base && a !== base + 1) inPair = false;
    if (shootClass(s, lap, { stem, thick: true }) !== base + 1) heavy = false;
  }
}
ok('V3 a stem keeps one width, inside its lap\'s pair (fine 0-1, bold 2-3)', stemOne && inPair, '');
ok('V3 a main stem is the heavier of the pair', heavy, '');
const css = fs.readFileSync(new URL('../../src/styles/arbor-v2.css', import.meta.url), 'utf8');
const widths = [0, 1, 2, 3].map((c) => { const m = css.match(new RegExp(`\\.wz-rhizome-seg\\[data-w='${c}'\\]\\{ stroke-width:([\\d.]+)px`)); return m ? +m[1] : null; });
ok('V3 the day CSS draws the four classes at 1 / 1.5 / 2 / 2.5 px (spec: 1-2.5)', widths.join() === '1,1.5,2,2.5', JSON.stringify(widths));

ok('V4 no flag (no document): the variation is off', variationOn() === false, '');
const rf = fs.readFileSync(new URL('../../src/components/RhizomeField.tsx', import.meta.url), 'utf8');
ok('V4 RhizomeField off the flag: segmentsFor on the plain `frac`, and the original two settled paths',
  rf.includes('segmentsFor(plan, variation ? pacedFrac(pageSeed, shownLap, frac) : frac)')
  && rf.includes('<path className="wz-rhizome-seg" d={pathOf(fadingSettled, false)} />')
  && rf.includes('<path className="wz-rhizome-seg" data-thick="true" d={pathOf(fadingSettled, true)} />'), '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-7-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-7-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);

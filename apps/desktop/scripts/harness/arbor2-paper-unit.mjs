// ARBOR v2 MOCKUP - the sun's page hole, BROWSERLESS half (src/arbor2/paper.ts holePath). Node >= 22.18 (type stripping). No box.
//   P1  the hole lands where the page is: viewport pixels minus the layer's own offset (the layer sits at inset -80px)
//   P2  the path is evenodd, outer rect first, and the frames proof's OWN regex (scripts/frames/arbor2.mjs zoomProof) reads the hole back
//       exactly - so the browser check and the clip it measures cannot drift apart in format
import { holePath, sheetMask, vignetteMask, featherFor, FEATHER } from '../../src/arbor2/paper.ts';
import { zoomProof, holeOf, stopsOf } from '../frames/arbor2.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const page = { l: 187, t: 108, r: 1179.5, b: 655 };
const clip = holePath(1526, 928, -80, -80, page);
const re = new RegExp(/M(-?[\d.]+) (-?[\d.]+)H(-?[\d.]+)V(-?[\d.]+)H/.source, 'g');
const m = [...clip.matchAll(re)];
ok('P1 outer rect is the whole layer', m[0] && +m[0][1] === 0 && +m[0][2] === 0 && +m[0][3] === 1526 && +m[0][4] === 928, clip);
ok('P1 the hole is the page, shifted by the layer offset (+80, +80)', m[1] && +m[1][1] === 267 && +m[1][2] === 188 && +m[1][3] === 1259.5 && +m[1][4] === 735, clip);
ok('P2 evenodd', clip.startsWith('path(evenodd,'), clip);
// PARKED 2026-10-29 (SUPERSEDED: the proof's regex reader was itself parked as zoomProofV1 - it read the clip only in the spelling holePath
// writes, and said false by day in run 40986639311 on a page with no slat on it; the successor proof reads through holeOf). Original, verbatim:
// // the proof's regex, lifted from its source text (not retyped here)
// const src = zoomProof.toString();
// const lifted = src.match(/clip\.matchAll\((\/.*?\/g)\)/);
// const proofRe = lifted ? eval(lifted[1]) : null;
// const pm = proofRe ? [...clip.matchAll(proofRe)] : [];
// ok('P2 the frames proof reads the hole back exactly', !!proofRe && pm.length === 2 && pm[1].slice(1, 5).map(Number).join() === '267,188,1259.5,735', JSON.stringify({ re: lifted && lifted[1], hole: pm[1] && pm[1].slice(1, 5) }));
// SUCCESSOR P2b: the proof's own reader (holeOf, which zoomProof is handed) reads the hole back exactly, as written AND in a browser's
// spaced re-serialization; and zoomProof really reads through the reader it is handed (not a regex of its own).
const spaced = clip.replace(/([MHVZ])/g, ' $1 ').replace(/\s+/g, ' ').replace('" ', '"').replace(' "', '"');
const h1 = holeOf(clip), h2 = holeOf(spaced);
ok('P2b holeOf reads the hole back exactly, as written and re-spaced', !!h1 && !!h2 && [h1.l, h1.t, h1.r, h1.b].join() === '267,188,1259.5,735' && [h2.l, h2.t, h2.r, h2.b].join() === '267,188,1259.5,735', JSON.stringify({ spaced, h1, h2 }));
// PARKED 2026-10-29 (SUPERSEDED: Fable's "no visible edge" moved the vignette from a clip to a mask, so zoomProof now reads ONE clip (the
// sun's) through holeOf and the masks through stopsOf; its signature and its holeOf count changed by design). Original, verbatim:
// ok('P2b zoomProof reads clips only through the holeOf it is handed', /^function zoomProof\(holeOf\)/.test(zoomProof.toString()) && !/matchAll/.test(zoomProof.toString()) && (zoomProof.toString().match(/holeOf\(/g) || []).length >= 2, '');
// SUCCESSOR P2c: zoomProof reads the sun's clip only through the holeOf it is handed, and masks only through the stopsOf it is handed.
const zp = zoomProof.toString();
// PARKED 2026-10-29 (SUPERSEDED: Fable's "feather the pergola's page hole with a ~24 px soft edge" moved the sun from a clip to a mask, so
// zoomProof reads no clip at all and three masks through stopsOf). Original, verbatim:
// ok('P2c zoomProof reads clips through holeOf and masks through stopsOf, with no parser of its own', /^function zoomProof\(holeOf, stopsOf\)/.test(zp) && !/matchAll/.test(zp) && (zp.match(/holeOf\(/g) || []).length === 1 && (zp.match(/stopsOf\(/g) || []).length === 2, '');
// SUCCESSOR P2d: zoomProof reads every mask (sheet, vignette, sun) through the stopsOf it is handed, no clip, and no parser of its own.
ok('P2d zoomProof reads its three masks through stopsOf, no clip, no parser of its own', /^function zoomProof\(holeOf, stopsOf\)/.test(zp) && !/matchAll/.test(zp) && (zp.match(/holeOf\(/g) || []).length === 0 && (zp.match(/stopsOf\(/g) || []).length === 3, '');
ok('P2b holeOf refuses a clip with no hole', holeOf('path(evenodd, "M0 0H10V10H0Z")') === null && holeOf('') === null && holeOf('none') === null, '');
// P3 stopsOf reads a computed gradient in each colour spelling Chrome may hand back, and the axis CSS defaults to
const g3 = stopsOf('linear-gradient(to right, rgb(0, 0, 0) 187px, rgba(0, 0, 0, 0) 235px, rgba(0, 0, 0, 0) 1131.5px, rgb(0, 0, 0) 1179.5px), linear-gradient(rgb(0 0 0 / 0) 0px, rgb(0 0 0) 48px, transparent 60px, #000 70px)');
ok('P3 stopsOf: two layers, x then the default y, every stop and alpha', g3.length === 2 && g3[0].axis === 'x' && g3[1].axis === 'y'
  && JSON.stringify(g3[0].stops) === JSON.stringify([{ a: 1, px: 187 }, { a: 0, px: 235 }, { a: 0, px: 1131.5 }, { a: 1, px: 1179.5 }])
  && JSON.stringify(g3[1].stops) === JSON.stringify([{ a: 0, px: 0 }, { a: 1, px: 48 }, { a: 0, px: 60 }, { a: 1, px: 70 }]), JSON.stringify(g3));
ok('P3 stopsOf reads no mask as no layers', stopsOf('none').length === 0 && stopsOf('').length === 0 && stopsOf(undefined).length === 0, '');
// P4 UNFRAMED (Fable, Oct 29): paper.ts's two masks, read back through the proof's own stopsOf and evaluated as CSS does - the sheet fades to
// nothing at every side, is whole in its core, and the vignette is its exact complement inside the page and whole outside it
const at = (st, v) => {
  if (!st.length) return 1;
  if (v <= st[0].px) return st[0].a;
  for (let i = 1; i < st.length; i++) if (v <= st[i].px) return st[i].px === st[i - 1].px ? st[i].a : st[i - 1].a + (st[i].a - st[i - 1].a) * (v - st[i - 1].px) / (st[i].px - st[i - 1].px);
  return st[st.length - 1].a;
};
const box = { l: 187, t: 107, r: 1179.5, b: 678 }, W = box.r - box.l, H = box.b - box.t, F = featherFor(W, H);
const sg = stopsOf(sheetMask(W, H, F)), vg = stopsOf(vignetteMask(box, F));
const sA = (x, y) => sg.reduce((m, g) => m * at(g.stops, g.axis === 'x' ? x - box.l : y - box.t), 1);
const vA = (x, y) => 1 - vg.reduce((m, g) => m * (1 - at(g.stops, g.axis === 'x' ? x : y)), 1);
ok('P4 the feather is FEATHER on a full page, and shrinks on a sheet too small to hold two', F === FEATHER && featherFor(100, 60) === 15 && featherFor(4, 4) === 1, JSON.stringify({ F }));
ok('P4 the sheet is 0 at the middle of each side and 1 in its core', [sA(box.l, 400), sA(box.r, 400), sA(700, box.t), sA(700, box.b)].every((v) => v === 0)
  && [sA(box.l + F, box.t + F), sA(box.r - F, box.b - F), sA(700, 400)].every((v) => v === 1), '');
let worst = 0;
for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) { const x = box.l + W * i / 40, y = box.t + H * j / 40; worst = Math.max(worst, Math.abs(sA(x, y) + vA(x, y) - 1)); }
ok('P4 vignette + paper = 1 everywhere on the page (41 x 41), corners included', worst < 1e-9, String(worst));
ok('P4 the vignette is whole just outside the page', [[box.l - 1, 400], [box.r + 1, 400], [700, box.t - 1], [700, box.b + 1], [box.l - 1, box.t - 1]].every(([x, y]) => vA(x, y) === 1), '');
const hg = stopsOf(vignetteMask(box, 0));
const hA = (x, y) => 1 - hg.reduce((m, g) => m * (1 - at(g.stops, g.axis === 'x' ? x : y)), 1);
ok('P4 feather 0 (a framed, unzoomed page) is the old hard hole: 0 just inside, 1 just outside', hA(box.l + .5, 400) === 0 && hA(box.r - .5, box.b - .5) === 0 && hA(box.l - .5, 400) === 1 && hA(700, box.b + .5) === 1, '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-PAPER-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-PAPER-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);

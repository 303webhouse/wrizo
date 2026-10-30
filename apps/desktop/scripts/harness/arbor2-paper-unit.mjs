// ARBOR v2 MOCKUP - the sun's page hole, BROWSERLESS half (src/arbor2/paper.ts holePath). Node >= 22.18 (type stripping). No box.
//   P1  the hole lands where the page is: viewport pixels minus the layer's own offset (the layer sits at inset -80px)
//   P2  the path is evenodd, outer rect first, and the frames proof's OWN regex (scripts/frames/arbor2.mjs zoomProof) reads the hole back
//       exactly - so the browser check and the clip it measures cannot drift apart in format
import { holePath } from '../../src/arbor2/paper.ts';
import { zoomProof, holeOf } from '../frames/arbor2.mjs';

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
ok('P2b zoomProof reads clips only through the holeOf it is handed', /^function zoomProof\(holeOf\)/.test(zoomProof.toString()) && !/matchAll/.test(zoomProof.toString()) && (zoomProof.toString().match(/holeOf\(/g) || []).length >= 2, '');
ok('P2b holeOf refuses a clip with no hole', holeOf('path(evenodd, "M0 0H10V10H0Z")') === null && holeOf('') === null && holeOf('none') === null, '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-PAPER-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-PAPER-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);

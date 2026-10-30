// ARBOR v2 MOCKUP - §14 item 9, the sage logo, BROWSERLESS: the four copies in public/brand/arbor2/ against the source, pixel by pixel
// (spec §12: "derives it from the source PNG and checks the result numerically - the Nomad polarity lesson"). No box.
//   G1  the reader reads the source as Pillow does (900 x 400; 45437 opaque, 292714 clear - Pillow's own counts, Oct 29), and round-trips
//   G2  every copy: same size, alpha byte-identical to the source (the drawing's shape is untouched)
//   G3  every stroke pixel is the source multiplied by the colour (POLISH's cream rule), a pure white stroke IS the colour; the orange is
//       kept as drawn in the brass copies and recoloured in the -all copies
//   G4  polarity and contrast: by night the sage is LIGHTER than the room, by day the olive DARKER; both >= 3:1 (a graphic); the numbers
//       for Nick's two calls are printed (the brass o by day; sage by day, which this lane does not wire)
//   G5  the generator reproduces the committed files byte for byte (nobody hand-edited a copy)
import fs from 'node:fs';
import { decodePng, encodePng, tint, isOrange, contrast } from '../arbor2-png.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const brand = new URL('../../public/brand/', import.meta.url);
const read = (p) => decodePng(fs.readFileSync(new URL(p, brand)));
const src = read('wrizo-logo.png');
let opaque = 0, clear = 0;
for (let p = 3; p < src.data.length; p += 4) { if (src.data[p] === 255) opaque++; if (src.data[p] === 0) clear++; }
ok('G1 the source reads as Pillow reads it: 900 x 400, 45437 opaque, 292714 clear', src.width === 900 && src.height === 400 && opaque === 45437 && clear === 292714, JSON.stringify({ w: src.width, h: src.height, opaque, clear }));
const rt = decodePng(encodePng(src));
ok('G1 encode then decode gives the same pixels', rt.data.equals(src.data), '');

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const SAGE = '#B7BC9A', OLIVE = '#3E4A2A';
const copies = [['wrizo-logo-sage.png', SAGE, null], ['wrizo-logo-sage-all.png', SAGE, SAGE], ['wrizo-logo-olive.png', OLIVE, null], ['wrizo-logo-olive-all.png', OLIVE, OLIVE]];
for (const [name, col, oc] of copies) {
  const img = read(`arbor2/${name}`), T = hex(col), O = oc ? hex(oc) : null;
  let alpha = img.width === src.width && img.height === src.height, rule = 0, white = 0, whiteExact = 0, orangeKept = 0, orangeN = 0;
  for (let p = 0; p < src.data.length; p += 4) {
    if (img.data[p + 3] !== src.data[p + 3]) { alpha = false; continue; }
    if (src.data[p + 3] === 0) continue;
    const [r, g, b] = [src.data[p], src.data[p + 1], src.data[p + 2]], got = [img.data[p], img.data[p + 1], img.data[p + 2]];
    let want;
    if (isOrange(r, g, b)) { orangeN++; want = O ? O.map((c) => Math.round((c * Math.max(r, g, b)) / 255)) : [r, g, b]; if (got.join() === [r, g, b].join()) orangeKept++; }
    else { want = [r, g, b].map((v, c) => Math.round((v * T[c]) / 255)); if (r === 255 && g === 255 && b === 255) { white++; if (got.join() === T.join()) whiteExact++; } }
    if (got.join() !== want.join()) rule++;
  }
  ok(`G2 ${name}: same size, alpha identical to the source`, alpha, '');
  ok(`G3 ${name}: every pixel follows the rule, every white stroke is ${col}, the orange ${O ? 'recoloured' : 'kept'}`,
    rule === 0 && white > 30000 && whiteExact === white && orangeN > 15000 && (O ? orangeKept === 0 : orangeKept === orangeN), JSON.stringify({ rule, white, whiteExact, orangeN, orangeKept }));
}

const NIGHT = '#0A0503', DAY = '#EFE6D2', LATE = '#E3D4B6', BRASS_O = '#FF9900';
const lumOf = (h) => hex(h).reduce((s, v) => s + v, 0);
const n = { sageNight: contrast(SAGE, NIGHT), oliveDay: contrast(OLIVE, DAY), oliveLate: contrast(OLIVE, LATE), brassDay: contrast(BRASS_O, DAY), sageDay: contrast(SAGE, DAY) };
ok('G4 polarity: night sage lighter than the night room, day olive darker than the day room', lumOf(SAGE) > lumOf(NIGHT) && lumOf(OLIVE) < lumOf(DAY) && lumOf(OLIVE) < lumOf(LATE), '');
ok('G4 each copy clears 3:1 on the ground it is made for (sage on the night room; olive on the whitewash, early and late)', n.sageNight >= 3 && n.oliveDay >= 3 && n.oliveLate >= 3, JSON.stringify(n));
console.log('     contrast:', Object.entries(n).map(([k, v]) => `${k} ${v.toFixed(2)}:1`).join(' · '));

const regen = copies.every(([name, col, oc]) => encodePng(tint(src, col, oc)).equals(fs.readFileSync(new URL(`arbor2/${name}`, brand))));
ok('G5 the generator reproduces all four committed copies byte for byte', regen, '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-9-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-9-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);

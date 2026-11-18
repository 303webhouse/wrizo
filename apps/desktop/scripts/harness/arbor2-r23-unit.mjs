// ARBOR v2 MOCKUP r23 - THE DAY LOGO ON THE SHADE, BROWSERLESS (Fable, Nov 10, 2:15 pm, item 10). The corner mark's day copy, all one green #374325
// (scripts/arbor2-logo-r23.mjs), checked as arbor2-9-unit's G6 checks r22's:
//   L1  wrizo-logo-day-green2-all.png: same size, alpha identical to the source, every pixel the source times #374325 (the orange too)
//   L2  the r23 generator reproduces it byte for byte (nobody hand-edited it)
//   L3  AS DRAWN (the mark sits at .7): >= 3:1 on the SHADED plaster #C3BEA6 (the Wrizors' r23 reading) and on the lit plaster #E3D8BF
//   MUT r22's #44522E, the same arithmetic: it must FAIL L3 on the shaded plaster (2.71:1) - L3 can go red
// Run: node apps/desktop/scripts/harness/arbor2-r23-unit.mjs   (no browser, no box)
import fs from 'node:fs';
import { decodePng, encodePng, tint, isOrange, contrast } from '../arbor2-png.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const brand = new URL('../../public/brand/', import.meta.url);
const read = (p) => decodePng(fs.readFileSync(new URL(p, brand)));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const src = read('wrizo-logo.png');
const GREEN = '#374325', WAS = '#44522E', SHADED = '#C3BEA6', LIT = '#E3D8BF';
{
  const img = read('arbor2/wrizo-logo-day-green2-all.png'), T = hex(GREEN);
  let alpha = img.width === src.width && img.height === src.height, rule = 0, white = 0, whiteExact = 0, orangeN = 0;
  for (let p = 0; p < src.data.length; p += 4) {
    if (img.data[p + 3] !== src.data[p + 3]) { alpha = false; continue; }
    if (src.data[p + 3] === 0) continue;
    const [r, g, b] = [src.data[p], src.data[p + 1], src.data[p + 2]], got = [img.data[p], img.data[p + 1], img.data[p + 2]];
    const want = isOrange(r, g, b) ? (orangeN++, T.map((c) => Math.round((c * Math.max(r, g, b)) / 255))) : [r, g, b].map((v, c) => Math.round((v * T[c]) / 255));
    if (!isOrange(r, g, b) && r === 255 && g === 255 && b === 255) { white++; if (got.join() === T.join()) whiteExact++; }
    if (got.join() !== want.join()) rule++;
  }
  ok('L1 wrizo-logo-day-green2-all.png: same size, alpha identical, every pixel the source times #374325 (the orange too)', alpha && rule === 0 && white > 30000 && whiteExact === white && orangeN > 15000, JSON.stringify({ alpha, rule, white, whiteExact, orangeN }));
  ok('L2 the r23 generator reproduces the day copy byte for byte', encodePng(tint(src, GREEN, GREEN)).equals(fs.readFileSync(new URL('arbor2/wrizo-logo-day-green2-all.png', brand))), '');
}
const at7 = (fg, bg) => '#' + hex(fg).map((c, i) => Math.round(c * 0.7 + hex(bg)[i] * 0.3).toString(16).padStart(2, '0')).join('');
const drawn = [SHADED, LIT].map((g) => contrast(at7(GREEN, g), g)), was = [SHADED, LIT].map((g) => contrast(at7(WAS, g), g));
ok('L3 as drawn at .7: >= 3:1 on the shaded plaster #C3BEA6 and on the lit #E3D8BF', drawn.every((v) => v >= 3), JSON.stringify({ shaded: drawn[0].toFixed(2), lit: drawn[1].toFixed(2) }));
ok('MUT r22\'s #44522E fails L3 on the shaded plaster (so L3 can go red)', was[0] < 3, JSON.stringify({ shaded: was[0].toFixed(2), lit: was[1].toFixed(2) }));
console.log(`     day mark at .7: shaded ${drawn[0].toFixed(2)}:1, lit ${drawn[1].toFixed(2)}:1 (r22's #44522E: ${was[0].toFixed(2)} / ${was[1].toFixed(2)})`);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-R23-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-R23-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);

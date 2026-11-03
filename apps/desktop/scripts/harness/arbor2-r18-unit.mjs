// ARBOR v2 MOCKUP r18 - browserless unit: THE LINE GONE FROM NICK'S DRAWING (Fable, Nov 3, Nick: "erase '(in abstract)' too. r18 removes the
// whole 'WRIZO (in abstract)' line from the top of the drawing, only that line; nothing else is touched or redrawn"), and the new things
// placed in the drawing's empty ground. Reads Nick's drawing (public/brand/splash-arbor/base.png) and the mockup's copy
// (public/brand/arbor2/splash-base-r18.png, written by scripts/arbor2-splash-r18.mjs), and the rects src/arbor2/frontLayer.tsx places.
// Prints ARBOR2-R18-UNIT VERIFY: PASS|FAIL. No browser, no storage.
import fs from 'node:fs';
import { decodePng } from '../arbor2-png.mjs';

const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? '  -- ' + detail : ''}`); };
const pub = new URL('../../public/brand/', import.meta.url);
const read = (rel) => { try { return decodePng(fs.readFileSync(new URL(rel, pub))); } catch (e) { return null; } };
const src = read('splash-arbor/base.png'), out = read('arbor2/splash-base-r18.png');
// the line, as measured on the drawing (canvas px): WRIZO x 1690-2185, "(in abstract)" x 2245-2675, y 120-280 with the underline
const LINE = { x0: 1670, y0: 95, x1: 2700, y1: 300 };
const RING = 24;   // the band around the line that must hold no ink of the drawing: the line stands alone, so clearing its box cuts nothing else
const ink = (img, x, y) => img.data[(y * img.width + x) * 4 + 3] > 0;
const inLine = (x, y) => x >= LINE.x0 && x < LINE.x1 && y >= LINE.y0 && y < LINE.y1;

ok('U0 both pictures read (Nick\'s drawing and the r18 copy)', !!src && !!out, JSON.stringify({ src: !!src, out: !!out }));
if (src && out) {
  ok('U1 the copy has the drawing\'s size', src.width === out.width && src.height === out.height, `${src.width}x${src.height} / ${out.width}x${out.height}`);
  let lineInk = 0, ring = 0, changedOutside = 0, leftInLine = 0;
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const i = (y * src.width + x) * 4;
    if (inLine(x, y)) { if (ink(src, x, y)) lineInk++; if (out.data[i + 3] !== 0) leftInLine++; continue; }
    if (x >= LINE.x0 - RING && x < LINE.x1 + RING && y >= LINE.y0 - RING && y < LINE.y1 + RING && ink(src, x, y)) ring++;
    if (src.data[i] !== out.data[i] || src.data[i + 1] !== out.data[i + 1] || src.data[i + 2] !== out.data[i + 2] || src.data[i + 3] !== out.data[i + 3]) changedOutside++;
  }
  ok('U2 the line was there to erase: Nick\'s drawing has ink in the line\'s box (liveness)', lineInk > 5000, String(lineInk));
  ok('U3 the line stands alone: no ink of the drawing within 24 px of its box (clearing the box cuts nothing else)', ring === 0, String(ring));
  ok('U4 the whole line is gone: nothing left in its box', leftInLine === 0, String(leftInLine));
  ok('U5 nothing else is touched: every pixel outside the line\'s box is byte-identical to Nick\'s drawing', changedOutside === 0, String(changedOutside));
  // what the mockup places in the drawing sits on empty ground of the drawing (never over a stroke of it)
  const tsx = fs.readFileSync(new URL('../../src/arbor2/frontLayer.tsx', import.meta.url), 'utf8');
  const rect = (name) => { const m = tsx.match(new RegExp(`export const ${name} = \\{ x: (\\d+), y: (\\d+), w: (\\d+), h: (\\d+) \\}`)); return m ? { x: +m[1], y: +m[2], w: +m[3], h: +m[4] } : null; };
  const doors = [...tsx.matchAll(/\{ id: '(\w+)', x: (\d+), y: (\d+), w: (\d+), h: (\d+) \}/g)].map((m) => ({ id: m[1], x: +m[2], y: +m[3], w: +m[4], h: +m[5] }));
  const logo = rect('TOP_LOGO');
  const inkIn = (r, pad) => { let n = 0; for (let y = Math.max(0, r.y - pad); y < Math.min(out.height, r.y + r.h + pad); y++) for (let x = Math.max(0, r.x - pad); x < Math.min(out.width, r.x + r.w + pad); x++) if (ink(out, x, y)) n++; return n; };
  ok('U6 the logo\'s rect is read from frontLayer.tsx and lies where the line stood (inside its span, at the top)', !!logo && logo.x >= LINE.x0 - 300 && logo.x + logo.w <= LINE.x1 + 300 && logo.y + logo.h <= LINE.y1, JSON.stringify(logo));
  ok('U7 the logo sits on ground the erasing left empty: no ink of the drawing under it', !!logo && inkIn(logo, 0) === 0, logo ? String(inkIn(logo, 0)) : 'no rect');
  ok('U8 two door boxes are read from frontLayer.tsx', doors.length === 2 && doors[0].id === 'write', JSON.stringify(doors));
  ok('U9 the doors are INSIDE the drawing and on its empty ground: no ink under either box or within 30 px of it', doors.length === 2 && doors.every((d) => d.x >= 0 && d.y >= 0 && d.x + d.w <= out.width && d.y + d.h <= out.height && inkIn(d, 30) === 0), JSON.stringify(doors.map((d) => inkIn(d, 30))));
}
const bad = results.filter((r) => !r.pass);
console.log(`ARBOR2-R18-UNIT VERIFY: ${bad.length ? 'FAIL' : 'PASS'} (${results.length} checks${bad.length ? `, ${bad.length} failed` : ''})`);
process.exit(bad.length ? 1 : 0);

// ARBOR v2 MOCKUP r18 - THE "WRIZO (in abstract)" LINE ERASED FROM NICK'S DRAWING (Fable, Nov 2-3; Nick: "erase '(in abstract)' too. r18
// removes the whole 'WRIZO (in abstract)' line from the top of the drawing, only that line; nothing else is touched or redrawn").
// Reads Nick's drawing as the splash uses it (public/brand/splash-arbor/base.png) and writes the mockup's copy with that line's box made
// transparent and every other pixel byte-for-byte his: public/brand/arbor2/splash-base-r18.png. The box was measured on the drawing (WRIZO
// x 1690-2185 with its underline, "(in abstract)" x 2245-2675, y 120-280); the script refuses to write if any ink of the drawing lies within
// 24 px of the box (then clearing it would cut something else). Proof: scripts/harness/arbor2-r18-unit.mjs.
// Run: node apps/desktop/scripts/arbor2-splash-r18.mjs
import fs from 'node:fs';
import { decodePng, encodePng } from './arbor2-png.mjs';

export const LINE = { x0: 1670, y0: 95, x1: 2700, y1: 300 };
const RING = 24;
const brand = new URL('../public/brand/', import.meta.url);
const img = decodePng(fs.readFileSync(new URL('splash-arbor/base.png', brand)));
const inLine = (x, y) => x >= LINE.x0 && x < LINE.x1 && y >= LINE.y0 && y < LINE.y1;
let ring = 0, cleared = 0;
for (let y = Math.max(0, LINE.y0 - RING); y < Math.min(img.height, LINE.y1 + RING); y++) for (let x = Math.max(0, LINE.x0 - RING); x < Math.min(img.width, LINE.x1 + RING); x++) {
  if (!inLine(x, y) && img.data[(y * img.width + x) * 4 + 3] > 0) ring++;
}
if (ring) { console.error(`refused: ${ring} ink pixels of the drawing lie within ${RING} px of the line's box`); process.exit(1); }
const data = Buffer.from(img.data);
for (let y = LINE.y0; y < LINE.y1; y++) for (let x = LINE.x0; x < LINE.x1; x++) { const i = (y * img.width + x) * 4; if (data[i + 3]) cleared++; data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0; }
fs.writeFileSync(new URL('arbor2/splash-base-r18.png', brand), encodePng({ width: img.width, height: img.height, data }));
console.log(`splash-base-r18.png: ${img.width}x${img.height}, the line's ${cleared} ink pixels cleared, nothing else changed`);

// #91 PROBE (a measurement aid, not a check of the product): reflow-open.mjs with the window 1392 px wide instead of 1400. The one red read a card one line taller (0.1875 against 0.1434) with nothing clipped: the signature of a text sitting
// on the edge of a wrap, where a few pixels of width (a scrollbar, a sub-pixel) tip the last word onto a fourth line. If the card heights change with the width here, the edge is real. The source is read and its viewport size swapped, then run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(dir, '..', 'reflow-open.mjs'), 'utf8');
if (!src.includes('emulateDpr(1, 1400, 1000)')) throw new Error('reflow-open.mjs no longer sets the 1400 x 1000 window');
const out = path.join(dir, '..', 'reflow-open-w1392.tmp.mjs');
fs.writeFileSync(out, src.replace('emulateDpr(1, 1400, 1000)', 'emulateDpr(1, 1392, 1000)'));
await import('../reflow-open-w1392.tmp.mjs');

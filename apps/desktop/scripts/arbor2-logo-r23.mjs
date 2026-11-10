// ARBOR v2 MOCKUP r23 - THE DAY LOGO ON THE SHADE (Fable, Nov 10, 2:15 pm, item 10; the Wrizors' r23 read: where the 1.5x pergola's shade passes
// behind the corner mark, the plaster is #C3BEA6 and r22's day copy (#44522E at the mark's .7, drawn #6A7252) reads 2.71:1). "It darkens until it
// reads 3:1 on shaded plaster." The lightest step along #44522E's own OKLab hue (chroma in proportion) that holds 3:1 there with a margin for the
// drawn pixel: #374325 - at .7 it draws #61684C on the shade, 3.13:1, and #6B7053 on the lit plaster #E3D8BF, 3.65:1 (r22's: 3.18). The same
// recolour as r22 (scripts/arbor2-png.mjs tint, all one colour by day). r22's file is kept as it was.
//   arbor2/wrizo-logo-day-green2-all.png
// Run: node apps/desktop/scripts/arbor2-logo-r23.mjs
import fs from 'node:fs';
import { decodePng, encodePng, tint } from './arbor2-png.mjs';

export const DAY_GREEN2 = '#374325';
const brand = new URL('../public/brand/', import.meta.url);
const src = decodePng(fs.readFileSync(new URL('wrizo-logo.png', brand)));
const out = new URL('arbor2/wrizo-logo-day-green2-all.png', brand);
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  fs.writeFileSync(out, encodePng(tint(src, DAY_GREEN2, DAY_GREEN2)));
  console.log('wrote arbor2/wrizo-logo-day-green2-all.png', DAY_GREEN2);
}

// ARBOR v2 MOCKUP r16 - THE LOGO FOLLOWS THE ROOM (Nick, Nov 2, 4:34 pm, via Fable): "Day = all sage. Night AND the splash / front door =
// Arbor's cream lettering colour (no pure white in Arbor) with the 'o' and the i's dot in brass #FF9800 (the orange already in Nick's source
// drawing; recolour, never redraw)." Writes, from the source PNG (public/brand/wrizo-logo.png: white strokes, orange o and dot):
//   arbor2/wrizo-logo-night.png          the night copy: the strokes in Arbor's cream lettering #EFE4CB, the orange in brass #FF9800
//   arbor2/wrizo-logo-night-letters.png  the same copy with the orange taken out (alpha 0): the layer the splash writes first
//   arbor2/wrizo-logo-night-brass.png    the same copy with only the orange: the "o" and the dot, written last
// Every pixel of the night copy is in exactly one of the two layers, so the two together are the night copy. The day copy is the existing
// all-sage arbor2/wrizo-logo-sage-all.png (scripts/arbor2-logo.mjs). Same recolour rule as that script (scripts/arbor2-png.mjs tint).
// Run: node apps/desktop/scripts/arbor2-logo-r16.mjs
import fs from 'node:fs';
import { decodePng, encodePng, tint, isOrange } from './arbor2-png.mjs';

export const CREAM = '#EFE4CB', BRASS = '#FF9800';
const brand = new URL('../public/brand/', import.meta.url);
const src = decodePng(fs.readFileSync(new URL('wrizo-logo.png', brand)));
const night = tint(src, CREAM, BRASS);
const split = (keepOrange) => {
  const data = Buffer.from(night.data);
  for (let p = 0; p < data.length; p += 4) {
    if (src.data[p + 3] === 0) continue;
    const orange = isOrange(src.data[p], src.data[p + 1], src.data[p + 2]);   // decided on the SOURCE pixel, as tint decides
    if (orange !== keepOrange) data[p + 3] = 0;
  }
  return { width: night.width, height: night.height, data };
};
const dir = new URL('arbor2/', brand);
for (const [name, img] of Object.entries({ 'wrizo-logo-night.png': night, 'wrizo-logo-night-letters.png': split(false), 'wrizo-logo-night-brass.png': split(true) })) {
  fs.writeFileSync(new URL(name, dir), encodePng(img));
  console.log('wrote', name, img.width + 'x' + img.height);
}

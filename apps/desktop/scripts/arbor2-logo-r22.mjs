// ARBOR v2 MOCKUP r22 - THE DAY LOGO, DARKER (Nick's walk, Nov 8, via Fable: "The day sage logo is nearly invisible: darker green, >= 3:1 vs
// the day room"). The corner mark (App.tsx .brand-mark, bottom-right, 88 px, at .7) drew the all-sage copy (#B7BC9A) by day: on the plaster
// behind it (#E2DAC2, sampled from the walk's day frames) that is 1.27:1 as the eye sees it (sage at .7 over the plaster). This writes the
// all-green day copy in #44522E, the same recolour as the others (scripts/arbor2-png.mjs tint, the orange gone green too, since by day the logo
// is all one colour, Nick's r5 choice): at .7 over #E2DAC2 it is 3.20:1 (3.29 on the lighter #E8DFC8; 6.04:1 at full strength).
//   arbor2/wrizo-logo-day-green-all.png
// The sage copies stay (the front door's marks keep their dark ground; the mockup bar's Logo row still names them).
// Run: node apps/desktop/scripts/arbor2-logo-r22.mjs
import fs from 'node:fs';
import { decodePng, encodePng, tint } from './arbor2-png.mjs';

export const DAY_GREEN = '#44522E';
const brand = new URL('../public/brand/', import.meta.url);
const src = decodePng(fs.readFileSync(new URL('wrizo-logo.png', brand)));
const out = new URL('arbor2/wrizo-logo-day-green-all.png', brand);
fs.writeFileSync(out, encodePng(tint(src, DAY_GREEN, DAY_GREEN)));
console.log('wrote arbor2/wrizo-logo-day-green-all.png', DAY_GREEN);

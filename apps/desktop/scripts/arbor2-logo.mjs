// ARBOR v2 MOCKUP - §14 item 9: writes Arbor's sage/olive copies of Nick's hand-drawn WRIZO from the source PNG (public/brand/wrizo-logo.png:
// white strokes, orange o and dot, transparent ground). Spec §12: night sage #B7BC9A; day the deep olive #3E4A2A or the same sage (Nick's eye
// on the frames); the orange stays brass or goes sage (Nick's call). So four copies, and the mockup bar picks between them in-session.
// Run: node apps/desktop/scripts/arbor2-logo.mjs   (checked by scripts/harness/arbor2-9-unit.mjs)
import fs from 'node:fs';
import { decodePng, encodePng, tint } from './arbor2-png.mjs';

const SAGE = '#B7BC9A', OLIVE = '#3E4A2A';
const brand = new URL('../public/brand/', import.meta.url);
const src = decodePng(fs.readFileSync(new URL('wrizo-logo.png', brand)));
const dir = new URL('arbor2/', brand);
fs.mkdirSync(dir, { recursive: true });
const out = {
  'wrizo-logo-sage.png': tint(src, SAGE),               // night, the orange kept (brass)
  'wrizo-logo-sage-all.png': tint(src, SAGE, SAGE),     // night, the orange gone sage too
  'wrizo-logo-olive.png': tint(src, OLIVE),             // day, the orange kept
  'wrizo-logo-olive-all.png': tint(src, OLIVE, OLIVE),  // day, the orange gone olive too
};
for (const [name, img] of Object.entries(out)) {
  fs.writeFileSync(new URL(name, dir), encodePng(img));
  console.log('wrote', name);
}

// B1 — generate the Ember icon set from the ornate hero mark (ember-hero.png,
// the transparent script "e"). favicon (multi-size ico), apple-touch-icon, and
// PWA icons (192/512 + 512 maskable) — the mark centered on a square canvas
// (transparent for the favicon, dark ink tile for the rest).
//
// Run from apps/desktop:  node scripts/gen-icons.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const SRC = join(pub, 'brand', 'ember-hero.png');
const INK = '#161210';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// The mark contained in a square `size`, centered, on `background`. `scale`
// leaves padding (the mark fills `scale` of the square).
async function squareIcon(size, scale, background) {
  const inner = Math.round(size * scale);
  const mark = await sharp(SRC)
    .resize({ width: inner, height: inner, fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

// favicon.ico — 16/32/48, the mark on a transparent square.
const icoPngs = await Promise.all([16, 32, 48].map(s => squareIcon(s, 0.96, TRANSPARENT)));
writeFileSync(join(pub, 'favicon.ico'), await pngToIco(icoPngs));

// A crisp PNG favicon for modern browsers.
writeFileSync(join(pub, 'favicon-32.png'), await squareIcon(32, 0.96, TRANSPARENT));

// apple-touch-icon (iOS home screen — opaque ink tile, rounded by iOS).
writeFileSync(join(pub, 'apple-touch-icon.png'), await squareIcon(180, 0.7, INK));

// PWA icons.
writeFileSync(join(pub, 'icon-192.png'), await squareIcon(192, 0.7, INK));
writeFileSync(join(pub, 'icon-512.png'), await squareIcon(512, 0.7, INK));
// Maskable: keep the mark inside the central safe zone.
writeFileSync(join(pub, 'icon-512-maskable.png'), await squareIcon(512, 0.56, INK));

console.log('icons generated from ember-hero.png');

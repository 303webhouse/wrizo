// B1 — generate the Ember icon set from the approved vector mark (ember-e.svg).
// favicon (svg + multi-size ico), apple-touch-icon, and PWA icons (192/512 +
// 512 maskable), the "e" centered on a square canvas (transparent for the
// favicon, dark ink tile for the rest, with maskable safe padding).
//
// Run from apps/desktop:  node scripts/gen-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const INK = '#161210';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const markSvg = readFileSync(join(pub, 'brand', 'ember-e.svg'), 'utf8');

function renderMark(px) {
  return Buffer.from(new Resvg(markSvg, { fitTo: { mode: 'width', value: px } }).render().asPng());
}

// The "e" centered on a SQUARE canvas (png-to-ico and PWA icons need squares).
async function squareIcon(size, scale, background) {
  const mark = renderMark(Math.round(size * scale));
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

// favicon.svg — the bare ember "e" (transparent; holds on light and dark tabs).
writeFileSync(join(pub, 'favicon.svg'), markSvg);

// favicon.ico — 16/32/48, the mark on a transparent square.
const icoPngs = await Promise.all([16, 32, 48].map(s => squareIcon(s, 0.84, TRANSPARENT)));
writeFileSync(join(pub, 'favicon.ico'), await pngToIco(icoPngs));

// apple-touch-icon (iOS home screen — opaque ink tile, rounded by iOS).
writeFileSync(join(pub, 'apple-touch-icon.png'), await squareIcon(180, 0.64, INK));

// PWA icons.
writeFileSync(join(pub, 'icon-192.png'), await squareIcon(192, 0.64, INK));
writeFileSync(join(pub, 'icon-512.png'), await squareIcon(512, 0.64, INK));
// Maskable: keep the mark inside the central safe zone.
writeFileSync(join(pub, 'icon-512-maskable.png'), await squareIcon(512, 0.52, INK));

console.log('icons generated from ember-e.svg');

// Generate raster brand icons from the SVG sources (branding B1).
// Run from apps/desktop:  node scripts/gen-icons.mjs
// Currently produces favicon.ico (16/32/48) from public/favicon.svg.
// B1 extends this to apple-touch-icon.png (180) and PWA icons (192/512 + maskable).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

function rasterize(svgPath, size) {
  const svg = readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return Buffer.from(resvg.render().asPng());
}

const faviconSvg = join(publicDir, 'favicon.svg');
const icoPngs = [16, 32, 48].map(s => rasterize(faviconSvg, s));
const ico = await pngToIco(icoPngs);
writeFileSync(join(publicDir, 'favicon.ico'), ico);
console.log('wrote public/favicon.ico (16/32/48)');

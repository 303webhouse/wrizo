// ARBOR v2 MOCKUP - §14 item 9, the sage logo: a PNG reader/writer for 8-bit RGBA, non-interlaced files, on node's own zlib (no new
// dependency), and the one recolour rule. Used by scripts/arbor2-logo.mjs (writes the copies) and scripts/harness/arbor2-9-unit.mjs (checks
// them against the source, pixel by pixel).
import zlib from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };

/** { width, height, data } with data = RGBA bytes, row by row. Refuses anything but 8-bit RGBA (colour type 6), non-interlaced. */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let off = 8, width = 0, height = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8), body = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      if (body[8] !== 8 || body[9] !== 6 || body[12] !== 0) throw new Error(`unsupported PNG: depth ${body[8]}, colour type ${body[9]}, interlace ${body[12]}`);
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * 4, data = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i], a = i >= 4 ? data[row + i - 4] : 0, b = y > 0 ? data[row - stride + i] : 0, c = y > 0 && i >= 4 ? data[row - stride + i - 4] : 0;
      let v;
      if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      else throw new Error(`bad filter ${f}`);
      data[row + i] = v & 255;
    }
  }
  return { width, height, data };
}

export function encodePng({ width, height, data }) {
  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type, 'latin1'), body]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(tb));
    return Buffer.concat([len, tb, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = width * 4, raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);   // filter 0 on every row
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** The drawing's orange (the o and the dot): saturation above 20%, hue 11-50 degrees. Everything else is the stroke. */
export function isOrange(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx === 0 || (mx - mn) * 5 <= mx) return false;   // saturation > 20%, in integers (a float test split hairs on s = .2 exactly)
  let h;
  if (mx === r) h = ((g - b) / (mx - mn)) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4;
  h = (h * 60 + 360) % 360;
  return h > 10.8 && h < 50.4;
}

/** POLISH's rule for the cream copy, measured on its file (white -> the colour, grey 127 -> half of it): the stroke is MULTIPLIED by the
 *  colour, channel by channel; alpha is never touched. `orangeTo` null keeps the orange as drawn (brass); a hex recolours it the same way. */
export function tint(img, hex, orangeTo = null) {
  const T = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const O = orangeTo ? [1, 3, 5].map((i) => parseInt(orangeTo.slice(i, i + 2), 16)) : null;
  const out = Buffer.from(img.data);
  for (let p = 0; p < out.length; p += 4) {
    if (out[p + 3] === 0) continue;
    const r = out[p], g = out[p + 1], b = out[p + 2];
    const orange = isOrange(r, g, b);
    if (orange && !O) continue;
    if (orange) {
      // the orange goes to the colour at its own lightness (its brightest channel carries the drawing's shading)
      const k = Math.max(r, g, b) / 255;
      for (let c = 0; c < 3; c++) out[p + c] = Math.round(O[c] * k);
    } else {
      for (let c = 0; c < 3; c++) out[p + c] = Math.round((out[p + c] * T[c]) / 255);
    }
  }
  return { width: img.width, height: img.height, data: out };
}

/** WCAG relative luminance and contrast. */
export const lum = (hex) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

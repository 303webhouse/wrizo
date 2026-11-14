import { lettersOf } from './railData';

// A PROJECT'S BOX (frames R1 to R5): its two letters on its colour. Until step 4's Box settings, every box wears the defaults, derived and never
// stored: the letters from the name (railData.lettersOf) on the first swatch. The letters are dark or light, whichever holds 4.5:1 on the colour
// (the Wrizors' guard, Nov 11). Decorative: the button around it carries the name.

/** The ruled swatches (frame R5, sampled as drawn): pale, grey, blue, brass, orange. The first is every box's default. */
export const SWATCHES = ['#C9CED3', '#6A727B', '#41658A', '#B9A03A', '#FF9800'] as const;
const INK_DARK = '#1E262E';
const INK_LIGHT = '#FFFFFF';

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The letters' ink on a colour: the one of dark and light with the higher contrast (so 4.5:1 whenever either can). */
export function letterInk(colour: string): string {
  return contrast(INK_DARK, colour) >= contrast(INK_LIGHT, colour) ? INK_DARK : INK_LIGHT;
}

export function RailBox({ name, size = 'rail' }: { name: string; size?: 'rail' | 'pin' | 'row' }) {
  const colour = SWATCHES[0];
  return (
    <span className={`wz-reorg-box wz-reorg-box--${size}`} aria-hidden="true" style={{ background: colour, color: letterInk(colour) }}>
      {lettersOf(name)}
    </span>
  );
}

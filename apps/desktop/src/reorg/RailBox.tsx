import { lettersOf } from './railData';
import { useBoxes } from './railMemory';
import { useTheme } from '../store/theme';

// A PROJECT'S BOX (frames R1 to R5): its two letters on its colour, or her picture. Its look is Box settings' (step 4), held in memory only
// (railMemory.ts); absent, the defaults are derived and never stored: the letters from the name (railData.lettersOf) on the first swatch, no
// picture. The letters' ink is whichever of the rail's dark, white and black holds the most contrast on the colour, so it holds 4.5:1 on ANY
// colour (black or white always clears 4.58:1; the Wrizors' guard, Nov 11). A picture fills the box and carries no letters (no ink can be
// promised over a picture). Decorative: the button around it carries the name.

/** The ruled swatches (frame R5, sampled as drawn): pale, grey, blue, brass, orange. The first is every box's default. */
export const SWATCHES = ['#C9CED3', '#6A727B', '#41658A', '#B9A03A', '#FF9800'] as const;
/** ARBOR's six (arbor-reorg-spec.md §1: "Pale · Grey · Blue · Brass · Orange become Arbor's six: Olive · Sea · Cold blue · Madder · Honey · Iron. Never
 *  brass for a box: brass is her act"; §6's cloths, slots a to f). The first is every box's default in Arbor (derived, never stored); a choice is stored as
 *  its hex in the box's own colour, as her own colour already is. */
export const ARBOR_SWATCHES = ['#56632E', '#17454E', '#7FA0BC', '#A8392F', '#C9A46B', '#39414A'] as const;
/** The swatches in force: Arbor's six in Arbor, the ruled five elsewhere. */
export function useSwatches(): readonly string[] { return useTheme() === 'plateau' ? ARBOR_SWATCHES : SWATCHES; }
const INKS = ['#1E262E', '#FFFFFF', '#000000'] as const;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The letters' ink on a colour: the rail's dark ink, white or black, whichever holds the most contrast (first wins a tie). */
export function letterInk(colour: string): string {
  return INKS.reduce((best, ink) => (contrast(ink, colour) > contrast(best, colour) ? ink : best), INKS[0] as string);
}

export function RailBox({ id, name, size = 'rail' }: { id: string | null; name: string; size?: 'rail' | 'pin' | 'row' }) {
  const look = useBoxes()[id ?? ''] || {};
  const swatches = useSwatches();
  const colour = look.colour || swatches[0];
  if (look.picture) {
    return <span className={`wz-reorg-box wz-reorg-box--${size} wz-reorg-box--picture`} aria-hidden="true" data-box-picture="" style={{ backgroundImage: `url("${look.picture}")` }} />;
  }
  return (
    <span className={`wz-reorg-box wz-reorg-box--${size}`} aria-hidden="true" style={{ background: colour, color: letterInk(colour) }}>
      {look.letters !== undefined ? look.letters : lettersOf(name)}
    </span>
  );
}

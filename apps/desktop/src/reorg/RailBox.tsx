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
 *  brass for a box: brass is her act"; §6's cloths, slots a to f). A choice is stored as its hex in the box's own colour, as her own colour already is. */
export const ARBOR_SWATCHES = ['#56632E', '#17454E', '#7FA0BC', '#A8392F', '#C9A46B', '#39414A'] as const;
/** ARBOR's uncoloured box (the Wrizors via Fable, Nov 21 11:20 pm: NOT olive): plain cream with walnut letters - cream 8.29:1 on the rail by day, 13.6 by
 *  night; walnut on cream 12.9. Derived, never stored; no swatch is chosen while a box has no colour of its own. */
export const ARBOR_PLAIN_BOX = '#EFE4CB';
export const ARBOR_PLAIN_INK = '#2B1D12';
/** FLUX's six signals (flux-reorg-words.md A: 01 to 06, named on hover; the same slots a to f as a Track's tag). Stored as the hex, as her own colour is. */
export const FLUX_SWATCHES = ['#00C2FF', '#B7FF3C', '#FF2E97', '#E7F4F1', '#7FA8A0', '#3A8FA5'] as const;
/** FLUX's uncoloured box (flux-reorg-spec.md section 11, rule 7: never a grey on the panel): node dress, a 1 px edge, text-hi letters. Derived, never stored. */
export const FLUX_PLAIN_BOX = '#04141A';
export const FLUX_PLAIN_INK = '#E7F4F1';
export const FLUX_PLAIN_EDGE = '#7EB4C4';
/** A code drawn ON a signal's colour (spec section 11, rule 2): dark on all six, lowest 5.05:1 on deep cyan. */
export const FLUX_CODE_INK = '#04141A';
/** The swatches in force: Arbor's six in Arbor, Flux's six signals in Flux, the ruled five elsewhere. */
export function useSwatches(): readonly string[] { const theme = useTheme(); return theme === 'plateau' ? ARBOR_SWATCHES : theme === 'flux' ? FLUX_SWATCHES : SWATCHES; }
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
  const flux = swatches === FLUX_SWATCHES;
  const plain = !look.colour && (swatches === ARBOR_SWATCHES || flux);   // the uncoloured box: Arbor's cream with walnut letters, Flux's node dress
  const colour = look.colour || (plain ? (flux ? FLUX_PLAIN_BOX : ARBOR_PLAIN_BOX) : swatches[0]);
  const ink = plain ? (flux ? FLUX_PLAIN_INK : ARBOR_PLAIN_INK) : letterInk(colour);
  const fluxEdge = plain && flux ? { border: `1px solid ${FLUX_PLAIN_EDGE}` } : {};
  // ARBOR: the letters' ink is also their text FILL. Arbor's night dim (arbor-v2.css section 6.2) letters every dimmed hook in --text-hi with a `color`
  // !important, which turned the cream box's walnut letters cream on cream (the frames on 2fc46347); the fill paints the letters and that rule does
  // not reach it, so they keep their ink and only the dim's opacity applies. Machina draws as before.
  const arborInk = swatches === ARBOR_SWATCHES ? { WebkitTextFillColor: ink } : {};
  if (look.picture) {
    return <span className={`wz-reorg-box wz-reorg-box--${size} wz-reorg-box--picture`} aria-hidden="true" data-box-picture="" style={{ backgroundImage: `url("${look.picture}")` }} />;
  }
  return (
    <span className={`wz-reorg-box wz-reorg-box--${size}`} aria-hidden="true" style={{ background: colour, color: ink, ...arborInk, ...fluxEdge }}>
      {look.letters !== undefined ? look.letters : lettersOf(name)}
    </span>
  );
}

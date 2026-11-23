import { getTheme } from '../store/theme';
import { REORG_PIECES, reorgFor, themeHas, useReorgPiece } from './themeGate';

/** The reorg's top rail is on for this page load only when the switch is on AND the theme has the 'top' piece (reorg/themeGate.ts: Machina today). The
 *  hook is chosen once at load, so with the switch off it calls no hook at all and the hook order never changes. */
export const useReorgTop: () => boolean = () => useReorgPiece('top');

/** The account syncs' gate, read at the moment of the act (railSaved.ts, prefsSaved.ts): the reorg is on for the theme she is in now (reorgFor: the switch, and the
 *  theme on by default or asked for) AND that theme has a reorg piece in the table (reorg/themeGate.ts; Machina's column today), never a theme literal. Outside it the
 *  reorg's facts are neither written nor synced (the switch-over: Arbor and Flux stay as they were). The name is kept from the switch-over's first build. */
export function reorgInMachina(): boolean { const t = getTheme(); return reorgFor(t) && REORG_PIECES.some((p) => themeHas(p, t)); }

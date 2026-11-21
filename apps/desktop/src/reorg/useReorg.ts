import { useReorgPiece } from './themeGate';

/** The reorg's top rail is on for this page load only when the switch is on AND the theme has the 'top' piece (reorg/themeGate.ts: Machina today). The
 *  hook is chosen once at load, so with the switch off it calls no hook at all and the hook order never changes. */
export const useReorgTop: () => boolean = () => useReorgPiece('top');

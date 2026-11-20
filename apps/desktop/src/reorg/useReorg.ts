import { useTheme } from '../store/theme';
import { REORG } from './flag';

/** The reorg's surfaces (the top rail, the Front menu) are on for this page load only when the switch is on AND the theme is Machina. The
 *  function is chosen once at load, so with the switch off it calls no hook at all and the hook order never changes. */
export const useReorgTop: () => boolean = REORG ? () => useTheme() === 'machina' : () => false;

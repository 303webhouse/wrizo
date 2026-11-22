import { useTheme, type ThemeId } from '../store/theme';
import { REORG, REORG_ASKED } from './flag';

// THE REORG'S THEME GATE (Fable, Nov 21, 3:20 pm: "Flux piece 1: the four Machina-only literals behind ONE table: six pieces x theme, Machina all on, Arbor and Flux empty. A Flux piece is switched on in the table only when its
// frames pass the Wrizors"; claude/wrizors/flux-reorg-spec.md). Until now every reorg surface asked "the switch AND Machina" in its own place (the rail, the top rail, the Front menu, the Back menu, the split, the Plan presets, Uplink).
// They ask HERE instead, by piece, so lifting a theme is one cell of this table, never an edit to a component.
//   rail    the left rail's doors (components/Cascade.tsx)                 top     the top rail and its readouts (PageEditor, BoardEditor, ScriptEditor)
//   front   the Front menu, TEXT / INK / PARTS (components/Sliver.tsx)     back    the Back menu, PLAN / ASSETS / FEEDBACK, and the Plan presets on a Board (Tutor.tsx, BoardEditor.tsx)
//   split   the split screen, an asset opened beside the page (Tutor.tsx)  uplink  the publishing view laid over the page (PageEditor.tsx)
// The columns are the app's own ThemeId: 'plateau' is the theme Arbor dresses (arbor2), so its column is Arbor's; ARBOR flips its own cells. Machina has every piece (today's behaviour, unchanged). Flux has none until a piece's frames pass.
// The switch (?reorg=1, reorg/flag.ts) still decides first: with it off nothing here is on for any theme and no hook runs.

export const REORG_PIECES = ['rail', 'top', 'front', 'back', 'split', 'uplink'] as const;
export type ReorgPiece = (typeof REORG_PIECES)[number];

const ALL_ON: Record<ReorgPiece, boolean> = { rail: true, top: true, front: true, back: true, split: true, uplink: true };
const ALL_OFF: Record<ReorgPiece, boolean> = { rail: false, top: false, front: false, back: false, split: false, uplink: false };

export const REORG_THEME_GATE: Record<ThemeId, Record<ReorgPiece, boolean>> = {
  machina: { ...ALL_ON },
  plateau: { ...ALL_OFF },
  flux: { ...ALL_OFF },
};

// THE HOOK STANDS FIRST (hooks-order census, Nov 22): useReorgPiece calls its hook at the top of its own arrow; themeHas below is a plain function, with its early return, and is only CALLED from here (a function declaration is hoisted).
/** The piece is on for this page load: the switch AND the current theme has it. The function is chosen once at load, so with the switch off it calls no hook at all and the hook order never changes. */
export const useReorgPiece: (piece: ReorgPiece) => boolean = REORG ? (piece) => { const t = useTheme(); return reorgFor(t) && themeHas(piece, t); } : () => false;

// THE SWITCH-OVER (Fable, Nov 21, 9:40 pm): the reorg is ON BY DEFAULT in Machina only. Arbor and Flux keep ?reorg=1 until all six of their cells pass: a cell
// flipped on for them lights only when the page load asked for the reorg by name. Flip a theme here once all six of its cells pass.
export const REORG_DEFAULT_ON: Record<ThemeId, boolean> = { machina: true, plateau: false, flux: false };

/** The reorg is on for this theme: the switch is on, and the theme is on by default or the page load asked for it (?reorg=1). The callers that read the table
 *  outside a hook (Tutor's back and split, BoardEditor's Plan presets, the account syncs) ask this, not the bare switch. */
export function reorgFor(theme: ThemeId | string | null | undefined): boolean {
  return REORG && (REORG_ASKED || ((REORG_DEFAULT_ON as Record<string, boolean | undefined>)[theme ?? ''] ?? false));
}

/** Whether this theme has this piece (the table alone: the caller holds the switch). A theme or a piece the table does not know has none. */
export function themeHas(piece: ReorgPiece, theme: ThemeId | string | null | undefined): boolean {
  return (REORG_THEME_GATE as Record<string, Record<string, boolean> | undefined>)[theme ?? '']?.[piece] === true;
}

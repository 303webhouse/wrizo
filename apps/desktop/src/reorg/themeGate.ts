import { useTheme, type ThemeId } from '../store/theme';
import { REORG } from './flag';
import { arbor2Enabled } from '../arbor2/flag';

// THE REORG'S THEME GATE (Fable, Nov 21, 3:20 pm: "Flux piece 1: the four Machina-only literals behind ONE table: six pieces x theme, Machina all on, Arbor and Flux empty. A Flux piece is switched on in the table only when its
// frames pass the Wrizors"; claude/wrizors/flux-reorg-spec.md). Until now every reorg surface asked "the switch AND Machina" in its own place (the rail, the top rail, the Front menu, the Back menu, the split, the Plan presets, Uplink).
// They ask HERE instead, by piece, so lifting a theme is one cell of this table, never an edit to a component.
//   rail    the left rail's doors (components/Cascade.tsx)                 top     the top rail and its readouts (PageEditor, BoardEditor, ScriptEditor)
//   front   the Front menu, TEXT / INK / PARTS (components/Sliver.tsx)     back    the Back menu, PLAN / ASSETS / FEEDBACK, and the Plan presets on a Board (Tutor.tsx, BoardEditor.tsx)
//   split   the split screen, an asset opened beside the page (Tutor.tsx)  uplink  the publishing view laid over the page (PageEditor.tsx)
// The columns are the app's own ThemeId: 'plateau' is the theme Arbor dresses (arbor2), so its column is Arbor's; ARBOR flips its own cells. Machina has every piece (today's behaviour, unchanged). Flux has none until a piece's frames pass.
// ARBOR'S COLUMN IS THE LIVE ARBOR, THE REDESIGN (Fable, Nov 21, 4:58 pm; arbor2/flag.ts: on by default in the plateau theme, ?arbor2=0 test-only): a plateau cell is on only while the redesign may run, the preview door included; the classic Plateau never has the reorg.
// The switch (?reorg=1, reorg/flag.ts) still decides first: with it off nothing here is on for any theme and no hook runs.

export const REORG_PIECES = ['rail', 'top', 'front', 'back', 'split', 'uplink'] as const;
export type ReorgPiece = (typeof REORG_PIECES)[number];

const ALL_ON: Record<ReorgPiece, boolean> = { rail: true, top: true, front: true, back: true, split: true, uplink: true };
const ALL_OFF: Record<ReorgPiece, boolean> = { rail: false, top: false, front: false, back: false, split: false, uplink: false };

export const REORG_THEME_GATE: Record<ThemeId, Record<ReorgPiece, boolean>> = {
  machina: { ...ALL_ON },
  // ARBOR: the rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4); the other five stay off until theirs pass
  // ARBOR: the top bar ON (Fable, Nov 22 3:20 pm: the Wrizors passed all six Arbor pieces; train K flips them - ARBOR the top, INK the other four)
  // INK: front, back, split and uplink ON (Fable, Nov 22 3:20 pm: pass 6 passed Arbor's Front menu; pass 2, the split and Publish had passed): all six Arbor cells are on, so Arbor's column is Machina's
  plateau: { ...ALL_ON },
  flux: { ...ALL_OFF },
};

// THE PREVIEW DOOR (Flux piece 2, Nov 21): a piece the table has not switched on for a theme can still be SEEN, by frames and by the Wrizors' review, with ?reorg=1&reorglift=flux.back (comma-separated theme.piece). Read once at load,
// honoured only under the switch, it only ADDS (no cell is ever turned off) and a token that is not a real theme.piece does nothing. It changes no stored word and no cell: with no parameter the table is the whole answer.
const LIFT: ReadonlySet<string> = REORG && typeof location !== 'undefined'
  ? new Set((new URLSearchParams(location.search).get('reorglift') ?? '').split(',').map((s) => s.trim()).filter((tok) => {
    const [th, pc, ...rest] = tok.split('.');
    return rest.length === 0 && Object.prototype.hasOwnProperty.call(REORG_THEME_GATE, th) && (REORG_PIECES as readonly string[]).includes(pc);
  }))
  : new Set<string>();

// THE HOOK STANDS FIRST (hooks-order census, Nov 22): useReorgPiece calls its hook at the top of its own arrow; themeHas below is a plain function, with its early return, and is only CALLED from here (a function declaration is hoisted).
/** The piece is on for this page load: the switch AND the current theme has it. The function is chosen once at load, so with the switch off it calls no hook at all and the hook order never changes. */
export const useReorgPiece: (piece: ReorgPiece) => boolean = REORG ? (piece) => themeHas(piece, useTheme()) : () => false;

/** Whether this theme has this piece (the table, or the preview door; the caller holds the switch). A theme or a piece the table does not know has none. */
export function themeHas(piece: ReorgPiece, theme: ThemeId | string | null | undefined): boolean {
  if (theme === 'plateau' && !arbor2Enabled()) return false;   // the classic Plateau (?arbor2=0) never has the reorg
  return (REORG_THEME_GATE as Record<string, Record<string, boolean> | undefined>)[theme ?? '']?.[piece] === true || LIFT.has(`${theme ?? ''}.${piece}`);
}

import { useTheme } from '../store/theme';
import { MachinaWordmark } from './wordmark';

// r5 - THE NAMEPLATE (the Wrizors, Nov 1, wrizors-to-ARBOR-nov1c.md; spec draft 9 §13b): the flush bar covered the end of the top-left mark, and
// in the light room the covered letters vanished. The mark moves INSIDE the bar, as its nameplate at the left end, before the crumb:
// "WRIZ▢ │ Unfiled / Title…" - Plex Mono at the mark's size and spacing, in the bar's label colour, the ▢ a hairline square in that colour (never
// brass in the bar), a hairline tick in the bar's hairline colour, 16 px in from the bar's left edge; the same in both rooms (the bars are dark
// in both). Drawn while a top bar is on screen (chrome.ts places it and makes room for it in the bar); the corner mark is not drawn then. The
// mark is not a door today (App.tsx's .brand-mark is aria-hidden and takes no pointer), so neither is the nameplate.
// (Ported from r10's doors.tsx for the ship, Fable Nov 19 "look only": the nameplate alone - the command-line door, the keyboard legend and
// "Outline -> Parts" stay out.)
// NOW (Nick, Nov 21, via Fable 1:30 pm): the mark is the mockup's WRIZO with its brass notch on the O (./wordmark.tsx), and no line beside it -
// the square and the tick are gone. Its place in the bar is the same.
export function Nameplate() {
  const theme = useTheme();
  if (theme !== 'machina') return null;
  return (
    <div className="machina2-nameplate" aria-hidden="true">
      <span className="machina2-nameplate-mark"><MachinaWordmark /></span>
    </div>
  );
}

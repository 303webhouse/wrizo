// FLUX3 S4 - THE BURST EDGE (the spec's §6: "a thin lime line draining across the top"; Fable's S4 ruling G: it drains with the GOAL'S LAP, the
// same lap the Glitch bar fills: there is no countdown timer to read). While Jacked In, a 2px line across the top of the window holds what is
// left of the lap: full at a lap's start, empty at the goal, full again as the next lap begins. It is the same pure hook on the same unit the goal
// lane uses (DeskGoalLane's useGoalProgress(unitCount, WORD_GOAL)), so the edge and the bar can never disagree.
//   - Decorative and inert: aria-hidden, no pointer, no words. It changes only as her words land (one step per word, no transition: nothing
//     animates while keys land) and it is drawn by a transform alone.
//   - Shown only where the lap is: Progress tracking on and the Words metric (the goal lane's own gates).
import { createPortal } from 'react-dom';
import { useTheme } from '../store/theme';
import { useWritingSettings } from '../store/writingSettings';
import { useGoalProgress, WORD_GOAL } from '../components/WritingIncentives';
import { useJacked } from './jackIn';

export function FluxBurstEdge({ unitCount }: { unitCount: number }) {
  const theme = useTheme();
  const settings = useWritingSettings();
  const jacked = useJacked();
  const { frac, celebrating } = useGoalProgress(unitCount, WORD_GOAL);
  if (theme !== 'flux' || !jacked || !settings.instrumentsOn || settings.progress !== 'words' || typeof document === 'undefined') return null;
  const left = celebrating ? 0 : Math.max(0, Math.min(1, 1 - frac));
  return createPortal(
    <div className="flux3-burst" aria-hidden="true" data-flux3-burst="" data-left={left.toFixed(4)}>
      <i style={{ transform: `scaleX(${left})` }} />
    </div>,
    document.body,
  );
}

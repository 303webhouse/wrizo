// FLUX3 S4 - THE MILESTONE POP (flux-jacked-in-concepts.md §1: "a brass milestone pop with the CHECKPOINT letter"). The Glitch bar is gone while
// Jacked In (no bar), so its word is shown here: at each Glitch-bar unit (her goal / 10, the same useGoalProgress the bar and the burst edge read, so
// the three can never disagree) the word CHECKPOINT shows under her line with the NEWLY EARNED letter popping in brass, and fades after POP_SHOW_MS.
// No number: letters, never a score. At the goal the whole word is lit brass (Flux's one brass moment). The corridor turns brass for 0.3 s and sends
// one brass frame past, on the 'flux3-pop' event (FluxCorridor.tsx).
//   - One change per milestone, and milestones are minutes apart; the change asks the flash budget first (a refused one still shows the letter).
//   - The still state (reduced motion, Ambiance 0): the letter lights with no event (no ring, no tint).
//   - Decorative and inert: aria-hidden, no pointer, drawn in a portal on <body>, so it can never move the page.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../store/theme';
import { useWritingSettings } from '../store/writingSettings';
import { useDeskLexicon } from '../store/deskLexicon';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { useGoalProgress, WORD_GOAL } from '../components/WritingIncentives';
import { useJacked } from './jackIn';

export const POP_SHOW_MS = 2000;

export function FluxCheckpointPop({ unitCount }: { unitCount: number }) {
  const theme = useTheme();
  const settings = useWritingSettings();
  const jacked = useJacked();
  const dial = useAmbianceDial();
  const { t } = useDeskLexicon();
  const { frac, celebrating } = useGoalProgress(unitCount, WORD_GOAL);
  const letters = [...t('flux3Checkpoint').toUpperCase()];
  const filled = celebrating ? letters.length : Math.max(0, Math.min(letters.length, Math.floor(frac * letters.length)));
  const gated = theme === 'flux' && jacked && settings.instrumentsOn && settings.progress === 'words';
  const [show, setShow] = useState<{ i: number; goal: boolean; filled: number } | null>(null);
  const seen = useRef(filled);
  const offRef = useRef(0);

  useEffect(() => {
    // a lap that went back to 0 forgets; a unit that filled while Jacked In pops (one pop however many filled at once: the newest letter)
    if (filled < seen.current) { seen.current = filled; return undefined; }
    const grew = filled > seen.current;
    seen.current = filled;
    if (!grew || !gated) return undefined;
    const still = prefersReducedMotion() || dial === 0;
    if (!still && tryFlash('f3-pop')) window.dispatchEvent(new CustomEvent('flux3-pop'));
    setShow({ i: filled - 1, goal: celebrating, filled });
    window.clearTimeout(offRef.current);
    offRef.current = window.setTimeout(() => setShow(null), POP_SHOW_MS);
    return undefined;
  }, [filled, gated, celebrating, dial]);
  useEffect(() => () => window.clearTimeout(offRef.current), []);

  if (!gated || !show || typeof document === 'undefined') return null;
  return createPortal(
    <div className="flux3-pop" aria-hidden="true" data-flux3-pop="" data-goal={show.goal ? 'true' : 'false'}>
      {letters.map((ch, i) => (
        <span key={i} data-on={i < show.filled ? 'true' : 'false'} data-new={!show.goal && i === show.i ? 'true' : undefined}>{ch}</span>
      ))}
    </div>,
    document.body,
  );
}

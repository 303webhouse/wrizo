// FLUX3 S3 - THE GLITCH BAR (the spec's §5; Fable's S3 ruling A: in Flux under the flag it REPLACES the bar-style ProgressBar in the framed goal
// lane; the rhizome style is untouched). The same progress the bar showed (DeskGoalLane's own useGoalProgress: the lap toward the goal, and its
// `celebrating` window), drawn as segmented lime units, one letter of the goal word (CHECKPOINT, through the lexicon) on each.
//   - A unit that fills shows its letter glitched toward code, then resolved. The glitch waits for her pause (nothing changes while keys land
//     but the fill itself), and every change asks the global flash budget first (store/flashBudget.ts: at most 3 a second across the screen); a
//     refused change is skipped, so the letter simply resolves.
//   - At the goal the units hand to orange and read CHECKPOINT (the one brass moment: the writer finished).
//   - The still state (reduced motion, Ambiance 0): no glitch at all, every filled letter already resolved.
import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';

export const GLITCH_PAUSE_MS = 700;   // the pause the glitch waits for
const GLITCH_STEPS = 3;               // glyph changes before the letter resolves
const GLITCH_STEP_MS = 360;           // their spacing (each also asks the flash budget)
const CODE = '01#%&$@/\\<>=+*';

interface Props { unitCount: number; frac: number; celebrating: boolean }

export function FluxGlitchBar({ unitCount, frac, celebrating }: Props) {
  const { t } = useDeskLexicon();
  const dial = useAmbianceDial();
  const word = t('flux3Checkpoint').toUpperCase();
  const letters = [...word];
  const units = letters.length;
  const filled = celebrating ? units : Math.max(0, Math.min(units, Math.floor(frac * units)));
  const still = prefersReducedMotion() || dial === 0;
  // the unit glitching now (its index) and the glyph it shows; null when every filled letter is resolved
  const [glitch, setGlitch] = useState<{ i: number; ch: string } | null>(null);
  const seen = useRef(filled);
  const pending = useRef<number[]>([]);

  useEffect(() => {
    // the units that filled since last time wait for the pause; a lap that went back to 0 forgets them
    if (filled < seen.current) pending.current = [];
    for (let i = seen.current; i < filled; i += 1) pending.current.push(i);
    seen.current = filled;
  }, [filled]);

  useEffect(() => {
    if (still) { pending.current = []; setGlitch(null); return; }
    let timer = 0;
    let lastKey = performance.now();
    const onKey = () => { lastKey = performance.now(); };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('beforeinput', onKey, true);
    let step = 0, unit = -1;
    const tick = () => {
      timer = window.setTimeout(tick, GLITCH_STEP_MS);
      if (unit < 0) {
        if (!pending.current.length || performance.now() - lastKey < GLITCH_PAUSE_MS) return;
        unit = pending.current.shift() as number;
        step = 0;
      }
      if (step < GLITCH_STEPS && tryFlash('f3-glitchbar')) {
        setGlitch({ i: unit, ch: CODE[Math.floor(Math.random() * CODE.length)] });
        step += 1;
        return;
      }
      setGlitch(null);   // resolved (a refused change resolves at once: the letter is never left glitched)
      unit = -1;
    };
    timer = window.setTimeout(tick, GLITCH_STEP_MS);
    return () => { window.clearTimeout(timer); document.removeEventListener('keydown', onKey, true); document.removeEventListener('beforeinput', onKey, true); };
  }, [still]);

  return (
    <div className="flux3-glitchbar" data-flux3-glitchbar="" data-goal={celebrating ? 'true' : 'false'} data-filled={filled} data-still={still ? 'true' : 'false'}
      role="img" aria-label={`${unitCount} ${unitCount === 1 ? t('flux3WordOne') : t('flux3WordMany')}`}>
      <span className="flux3-glitchbar-units">
        {letters.map((ch, i) => (
          <span key={i} className="flux3-glitchbar-unit" data-on={i < filled ? 'true' : 'false'} data-glitch={glitch && glitch.i === i ? 'true' : undefined}>
            {i < filled ? (glitch && glitch.i === i ? glitch.ch : ch) : ''}
          </span>
        ))}
      </span>
      <span className="flux3-glitchbar-count" aria-hidden="true">{unitCount} {unitCount === 1 ? t('flux3WordOne') : t('flux3WordMany')}</span>
    </div>
  );
}

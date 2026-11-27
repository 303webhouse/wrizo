import { useTheme } from '../store/theme';
import { useCast } from '../store/themeCast';
import { useWritingSettings } from '../store/writingSettings';
import { goalCount, useWritingGoal } from '../store/writingGoal';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { useGoalProgress } from './WritingIncentives';
import { SamePageLine } from './SamePageNotice';
import { PageCount } from './PageCount';
import { useFlourish } from '../store/flourish';

// Run, Machina's only progress instrument (not behind the style slot): twenty units, an orange notch on the unit in progress, the whole strip orange at the goal; sparks under NEUTRAL only; fixed counts and angles; a still state under reduced motion [RunStrip §1]
const UNITS = 20;
const BURST_ANGLES = [-90, -64, -38, -12, 12, 38, 64, 90];

/** True when the Run strip draws (the same gate RunStrip reads). */
export function useRunStripActive(text: string): boolean {
  const theme = useTheme();
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  void text;
  const n = goal?.n ?? 0;
  const wanted = useFlourish('machina');   // on until she turns Machina's flourish off (store/flourish.ts)
  return theme === 'machina' && settings.instrumentsOn && settings.progress === 'words' && goal != null && n > 0 && wanted;
}

export function RunStrip({ text }: { text: string }) {
  const theme = useTheme();
  const cast = useCast();
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  const dial = useAmbianceDial();
  const n = goal?.n ?? 0;
  const count = goal ? goalCount(text, goal) : 0;
  const { frac, celebrating } = useGoalProgress(count, n);
  const active = useRunStripActive(text);   // ONE gate (DeskInstrument's lane reads it too, for where the page count stands)
  if (!active) return null;

  const done = celebrating ? UNITS : Math.min(UNITS, Math.floor(frac * UNITS));
  const here = celebrating ? UNITS - 1 : done;
  const shown = celebrating ? n : count % n;
  const still = prefersReducedMotion() || dial === 0;
  const sparks = celebrating && cast === 'neutral' && !still;
  return (
    <div className="machina-run" data-closed={celebrating ? 'true' : 'false'} data-still={still ? 'true' : 'false'}>
      <div className="machina-run-strip" role="img" aria-label={`Run: ${shown} of ${n}`}>
        {Array.from({ length: UNITS }, (_, i) => (
          <i key={i} className={`${i < done ? 'on' : ''}${i === here ? ' here' : ''}`.trim() || undefined} data-unit={i} />
        ))}
        {sparks && (
          <span className="machina-run-burst" aria-hidden="true">
            {BURST_ANGLES.map((deg, i) => <span key={deg} style={{ ['--r' as string]: `${deg}deg`, animationDelay: `${i * 20}ms` } as React.CSSProperties} />)}
          </span>
        )}
      </div>
      <div className="machina-run-count">{shown} / {n}</div>
      <span className="wz-pagecount-div" aria-hidden="true" /><PageCount />   {/* PAGE BREAKS (spec draft 3, section 3): the open page's count, right of the Run's count */}
      <SamePageLine />
    </div>
  );
}

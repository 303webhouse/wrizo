import { useTheme } from '../store/theme';
import { useCast } from '../store/themeCast';
import { useWritingSettings } from '../store/writingSettings';
import { goalCount, useWritingGoal } from '../store/writingGoal';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { useGoalProgress } from './WritingIncentives';

// RUN - Machina's own progress instrument (Nick, Oct 21; cursor/machina-progress-mockup @ c17b4551; the approved mockup cursor/machina-v1-mockup @ 360f3db3; Fable's ruling: "Run is
// Machina-only" - each theme has its own: Arbor the rhizome, Flux Glitch, Machina Run). It is the REPLACEMENT for the thin sprint bar under Machina, the way GlitchMeter is under Flux:
// the same gate (the framed page's lane, Progress: Words, the Rhizome|Glitch|Run style slot, a goal set), the same lap grammar (useGoalProgress - one celebration grammar, canon §9).
//
// WHAT IT DRAWS (the mockup, verbatim in shape): twenty identical units, each one-twentieth of the goal's lap. A finished unit is gray (--signal-live), an unfinished one the line tone,
// and the unit in progress carries a 3 x 16 px ORANGE NOTCH on its left edge. The count reads once, after the bar ("430 / 1000" - the lap's own count over the goal). At the goal the
// WHOLE strip goes orange (a .35s colour crossfade, the foundations' fill handoff) and the notch stays on the last unit; then the lap resets for the next. Orange is scarce: the notch,
// and the closed strip - nothing else here.
//
// THE ONE CELEBRATION: the closed strip IS it, in both casts. NEUTRAL adds the sparks (foundations §5: "sparks on" is NEUTRAL's temperament) - the RC's burst of eight 9 x 1 px ticks at
// ~26 degree steps, .6s, 20 ms apart, from the last unit - and they never render under COOL. Both have a still state: under reduced motion or Ambiance 0 the strip simply turns orange
// (no transition, no ticks). Fixed counts and angles - "predictable, never variable" - no randomness.
const UNITS = 20;
const BURST_ANGLES = [-90, -64, -38, -12, 12, 38, 64, 90];

export function RunStrip({ text }: { text: string }) {
  const theme = useTheme();
  const cast = useCast();
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  const dial = useAmbianceDial();
  const n = goal?.n ?? 0;
  const count = goal ? goalCount(text, goal) : 0;
  const { frac, celebrating } = useGoalProgress(count, n);
  const active = theme === 'machina' && settings.instrumentsOn && settings.progress === 'words' && settings.progressStyle === 'rhizome' && goal != null && n > 0;
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
    </div>
  );
}

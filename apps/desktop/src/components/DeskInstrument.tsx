import { useWritingSettings } from '../store/writingSettings';
import { ProgressBar, useGoalProgress, WORD_GOAL } from './WritingIncentives';
import { RhizomeField } from './RhizomeField';

// M4 S3/S4 (SV15/SV16) — the progress instrument's framed home.
//
// S3, the bar comes home: "the progress bar renders UNDER THE PAGE, in the
// rhizome's own lane — bar and rhizome are two styles of one instrument and
// share one location." That lane already exists and is already proven:
// DeskFrame's `rhizome` prop -> `.desk-frame-rhizome-anchor` (index.css), the
// stage-spanning, paper-rect-immune overlay M2 S2 built for the growth layer.
// This component IS that prop's value now; the two styles hang off it as
// siblings, so a writer's Bar|Rhizome choice picks which one paints in the
// one lane instead of which surface gets an instrument at all.
//
// The render-gating finding this fixes (root-caused live, not guessed — the
// full trace is in docs/wrizo-alpha/m4-finish-map.md): on the FRAMED desk the
// legacy incentive row (`.mode-incentive-row`, ModeStage.tsx) is gated
// `!framed`, because AB1 S2 deliberately "reserved the meter track for its
// later return." S3 IS that return — but through THIS lane, not through
// `.desk-frame-meter`: FX1 S5 killed that shell on Nick's "the dead bar"
// verdict and it stays dead (nothing passes DeskFrame's `meter` prop). The
// legacy row itself is untouched and stays `!framed`; below 1100px nothing
// in this file ever mounts.
//
// S4, the completion moment: crossing the goal was effectively INVISIBLE on
// the framed desk — the ProgressBar's own celebrate (ignition + spark burst)
// never mounted there at all, and `AmbientGlow`'s bloom is `!framed` too
// (AB1 S2 parked the ambient glow on the framed desk, where GoalGlow owns the
// warmth behind the paper — reviving it here would put two glows on one
// stage). So the flare gets a home of its own IN the lane: an ember bloom
// that fires on the SAME `celebrating` transition every other celebration in
// the app already rides, then is gone. Evental by construction — no count, no
// score, nothing remembered (useGoalProgress seeds its lap count at mount, so
// re-opening a long page never re-fires a lap crossed in some earlier
// session). It fires for BOTH styles: the lane is where crossing the goal is
// felt, whichever instrument is occupying it.
export function DeskInstrument({ unitCount, seedKey, paperRef }: {
  unitCount: number;
  seedKey: string;
  paperRef: React.RefObject<HTMLElement | null>;
}) {
  // Both children self-gate on the settings (RhizomeField already did, and
  // still does, verbatim) — rendered as SIBLINGS rather than as a ternary so
  // the rhizome's own mount lifecycle is byte-identical to pre-M4: toggling
  // Bar<->Rhizome must not unmount/remount the growth layer and replay every
  // segment's 180ms grow animation.
  return (
    <>
      <RhizomeField unitCount={unitCount} seedKey={seedKey} paperRef={paperRef} />
      <DeskGoalLane unitCount={unitCount} />
    </>
  );
}

// The lane itself: the bar (S3) and the flare (S4). Scoped to Progress:Words
// exactly like the Bar|Rhizome control that selects between the two styles
// (ModeStage.tsx's SettingsPanel: `showProgressStyle = framed && progress ===
// 'words'`) and exactly like RhizomeField's own `active` gate — the lane is
// the Progress:Words instrument's lane, and Bar|Rhizome is the axis inside
// it. Time / Drawer / Off keep the framed home they have today (none): the
// brief names the bar-and-rhizome PAIR, and giving the other three metrics a
// framed home is a different question from the one SV15 answered.
function DeskGoalLane({ unitCount }: { unitCount: number }) {
  const settings = useWritingSettings();
  // The SAME pure hook the bar itself calls, on the SAME unit the host
  // already computes — the M2 precedent (RhizomeField.tsx's own header) for
  // "one celebration grammar, two consumers", not a second timing engine.
  const { frac, celebrating } = useGoalProgress(unitCount, WORD_GOAL);
  if (settings.progress !== 'words') return null;
  return (
    <div className="desk-frame-instrument" data-style={settings.progressStyle}>
      {/* S4 — the flare. Decorative and inert: it carries no text, no number,
          and nothing that outlives its own ~1.1s window. */}
      <div className={`desk-frame-goalflare${celebrating ? ' lit' : ''}`} aria-hidden="true" />
      {settings.progressStyle === 'bar' && (
        <ProgressBar
          frac={frac}
          celebrating={celebrating}
          label={`${unitCount} word${unitCount === 1 ? '' : 's'}`}
          metricLabel="words"
        />
      )}
    </div>
  );
}

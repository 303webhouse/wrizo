import { useWritingSettings } from '../store/writingSettings';
import { ProgressBar, useGoalProgress, WORD_GOAL } from './WritingIncentives';
import { RhizomeField } from './RhizomeField';
import { GlitchMeter } from './GlitchMeter';
import { RunStrip } from './RunStrip';
import { useTheme } from '../store/theme';

// the progress instrument's framed home: bar and rhizome share the rhizome's lane under the page, and the goal flare fires there on the same `celebrating` transition, for both styles [DeskInstrument §1]
export function DeskInstrument({ unitCount, text, seedKey, paperRef, glitch = false }: {
  unitCount: number;
  text: string;
  seedKey: string;
  paperRef: React.RefObject<HTMLElement | null>;
  // the glitch meter, Flux's progress animation: it gates itself on the theme and settings; writing pages only (the Journal sheet does not pass it) [DeskInstrument §2]
  glitch?: boolean;
}) {
  // Both children self-gate on the settings (RhizomeField already did, and
  // still does, verbatim) — rendered as SIBLINGS rather than as a ternary so
  // the rhizome's own mount lifecycle is byte-identical to pre-M4: toggling
  // Bar<->Rhizome must not unmount/remount the growth layer and replay every
  // segment's 180ms grow animation.
  return (
    <>
      <RhizomeField text={text} seedKey={seedKey} paperRef={paperRef} />
      {glitch && <GlitchMeter text={text} />}
      {glitch && <RunStrip text={text} />}
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
  const theme = useTheme();
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
      {/* under Machina the Run strip is the only progress instrument, so the thin bar is not drawn on the framed page (unframed surfaces keep it) [DeskInstrument §3] */}
      {settings.progressStyle === 'bar' && theme !== 'machina' && (
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

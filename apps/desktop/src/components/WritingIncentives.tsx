import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

// Shared incentive-layer pieces (glow + progress bar + typewriter toggle) used
// by both ModeStage (Free write/Draft/Format) and JournalEntry (the ink-capable
// Journal route) so the two writing surfaces the app actually has stop
// diverging in feel. Word-count-goal is a "lap": crossing the goal fills the
// bar fully orange with a celebration pulse, then it resets for the next lap —
// per Nick's spec (subtler brown/cream track, an orange caret marking the
// current edge of progress, full-orange + animate + reset on goal).

export const WORD_GOAL = 250;
export const TIME_GOAL_MS = 25 * 60 * 1000;
const CELEBRATE_MS = 1100;

// Tracks a value against a repeating goal (a "lap"): returns the fraction
// within the current lap (0..1) and a `celebrating` flag that pulses true for
// CELEBRATE_MS whenever a new lap completes (value crosses a goal multiple).
export function useGoalProgress(value: number, goal: number): { frac: number; celebrating: boolean } {
  const [celebrating, setCelebrating] = useState(false);
  // Seed from the first-render value/goal (Fable W1-R1) — a page opened with
  // e.g. 600 words already written must NOT celebrate laps completed in some
  // earlier session; only a lap crossed DURING this mount should fire.
  const lapsRef = useRef(goal > 0 ? Math.floor(value / goal) : 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const laps = goal > 0 ? Math.floor(value / goal) : 0;
  useEffect(() => {
    if (laps > lapsRef.current) {
      lapsRef.current = laps;
      setCelebrating(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    } else {
      lapsRef.current = laps;
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laps]);

  const frac = goal > 0 ? (value % goal) / goal : 0;
  return { frac, celebrating };
}

// Ambient ember behind the page — eased with progress, blooms as chrome fades.
// `m` is the eased 0..1 progress fraction (Math.pow(frac, 0.55) by callers).
export function AmbientGlow({ m }: { m: number }) {
  return <div aria-hidden="true" className="mode-glow" style={{ ['--m' as CSSProperties & string]: m.toFixed(3) } as CSSProperties} />;
}

interface ProgressBarProps {
  frac: number;            // 0..1 within the current lap
  celebrating: boolean;
  label: string;            // "142 words" / "4:12"
  metricLabel: string;      // "words" / "session"
  hidden?: boolean;         // Off metric — render nothing (glow still warms via `m` elsewhere)
  rightSlot?: React.ReactNode; // e.g. page number, timer readout
}

// `hidden` suppresses the track + word/time label (the "Off" progress metric)
// while still rendering the meta row, so a rightSlot (page number, opt-in
// timer) can show on its own — matches the pre-existing off-but-timer-on case.
export function ProgressBar({ frac, celebrating, label, metricLabel, hidden, rightSlot }: ProgressBarProps) {
  const pct = celebrating ? 100 : Math.max(0, Math.min(100, frac * 100));
  return (
    <div className="mode-progress">
      {!hidden && (
        <div className="mode-ptrack">
          <div
            className={`mode-pfill${celebrating ? ' celebrate' : ''}${pct > 0 ? ' started' : ''}`}
            style={{ width: `${pct.toFixed(1)}%` }}
          />
        </div>
      )}
      <div className="mode-pmeta">
        <span>{hidden ? '' : label}</span>
        <span className="mode-pmetric">
          {rightSlot}
          {!hidden && <span>{metricLabel}</span>}
        </span>
      </div>
    </div>
  );
}

// Bottom-right, always-clickable (incentive layer, never dissolves) typewriter
// toggle — a fast path beside the settings gear. Journal/Free write/Draft only;
// callers gate rendering out of Format/Workshop/Publish themselves.
export function TypewriterToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`typewriter-toggle${on ? ' on' : ''}`}
      aria-label={on ? 'Typewriter scroll on' : 'Typewriter scroll off'}
      aria-pressed={on}
      title={on ? 'Typewriter scroll: on' : 'Typewriter scroll: off'}
      onClick={onToggle}
    >
      <TypewriterIcon />
    </button>
  );
}

function TypewriterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="10" rx="1.5" />
      <path d="M6 14v2.5M18 14v2.5" />
      <path d="M5 20h14l-1.3-3.5H6.3z" />
      <path d="M7 8h2M11 8h2M15 8h2M8 11h8" />
    </svg>
  );
}

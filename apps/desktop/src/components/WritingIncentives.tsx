import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MilestoneBeat, Milestones } from '../store/milestones';

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

// M1 — the milestone circle-bar's celebration tracking, the useGoalProgress
// mount-seeding law generalized to a keyed collection (per the canon: "Apply
// the W1-R1 lesson as law: seed state on mount; celebrate only transitions
// that occur during the session"). `beats` is a fresh array every call (the
// selector is pure and stateless) — comparing its CONTENTS each render, not
// relying on referential stability, is the point.
//
// Unlike useGoalProgress's per-document lap count, a beat is Plan-side state
// visible from several surfaces at once (every page attached to it, Structure
// Board, QuickSprint) — so "the session" here is scoped to this app-load (a
// module-level seen-set), not to any one component's mount, and PARTITIONED
// by `scopeKey` (the StoryPlan's id). Beat ids are framework-authored strings
// ('midpoint', 'climax', ...) that every project on the same framework shares
// verbatim — an unscoped id space would cross-talk the moment two projects
// pick the same framework (a false celebration for one project's old beat, or
// a swallowed celebration for another's genuine one). Baseline-seeding reads
// `allLitIds` — the FULL, unwindowed lit set for the plan — never the
// (possibly windowed/capped) `beats` being displayed: a beat already lit but
// outside whichever window first renders this plan must still be captured in
// the baseline, or it misfires as newly-lit the first time a wider view
// shows it. Baseline is seeded once per scopeKey, the first time ANY
// consumer renders that plan after boot; a beat that turns lit while no
// celebration-consumer is looking (e.g. QuickSprint's finish-and-navigate
// flow) still celebrates exactly once, on whichever surface shows it to the
// writer next — never a beat that was already lit before this app-load
// began. A hard reload clears the module (fresh boot, fresh baseline).
//
// `seenLit` is committed lazily, when a celebration's timer actually completes
// — never at the moment the transition is first detected. App.tsx force-
// renders the whole routed tree on every persistence change (its sync/reactive-
// screens subscription), so a surface that's mid-navigation-away (e.g.
// QuickSprint's finish-and-save, which calls setBeatStatus then navigate() in
// the same handler) can get one invisible interim render reflecting the new
// status before it unmounts. If that render committed `seenLit` immediately,
// the celebration would be silently consumed without ever being painted. By
// deferring the commit to the timer's completion, an interrupted (unmounted)
// celebration leaves the id unseen, so the next surface that renders the beat
// gets a full, uninterrupted chance to show it.
let seenLit = new Set<string>();              // composite `${scopeKey}:${beatId}`
let establishedScopes = new Set<string>();    // scopeKey — has this plan's baseline been seeded this app-load

export function useMilestoneCelebration(beats: MilestoneBeat[], scopeKey: string, allLitIds: string[]): Set<string> {
  const [celebrating, setCelebrating] = useState<Set<string>>(() => new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!establishedScopes.has(scopeKey)) {
      establishedScopes.add(scopeKey);
      allLitIds.forEach(id => seenLit.add(`${scopeKey}:${id}`));
      return;
    }
    const newlyLit = beats.filter(b => b.state === 'lit' && !seenLit.has(`${scopeKey}:${b.id}`) && !timersRef.current.has(b.id)).map(b => b.id);
    if (newlyLit.length === 0) return;
    setCelebrating(prev => {
      const next = new Set(prev);
      newlyLit.forEach(id => next.add(id));
      return next;
    });
    newlyLit.forEach(id => {
      timersRef.current.set(id, setTimeout(() => {
        seenLit.add(`${scopeKey}:${id}`);
        setCelebrating(prev => { const next = new Set(prev); next.delete(id); return next; });
        timersRef.current.delete(id);
      }, CELEBRATE_MS));
    });
  }); // no dep array: beats is a fresh array every render by construction — re-check every time the caller recomputes it (cheap, idempotent when nothing changed)

  useEffect(() => {
    const timers = timersRef.current;
    // On unmount mid-celebration, pending timers are cancelled WITHOUT ever
    // committing seenLit for those ids — see the comment above `seenLit`.
    return () => { timers.forEach(t => clearTimeout(t)); };
  }, []);

  return celebrating;
}

// The circle-bar: a read-only projection of Plan beat coverage onto the
// writing surface — glanceable only, never a verdict (docs/progress-
// milestones-canon.md). pointer-events:none is an INVARIANT, not a style
// choice: no tap-to-navigate on a writing surface (an exit door embedded in
// the incentive layer is a departure temptation exactly where flow lives —
// the interaction designer's and motivation psychologist's veto, on the
// record). Empty = a quiet ring; kindled = ring + a small brass center dot
// (the W1 progress-caret vocabulary, deliberately reused); lit = solid brass
// fill, with the shared pfill-celebrate-derived ring-pulse on the transition
// into it. `windowed` shows an edge-fade (both sides — a centered window can
// truncate on either end) hinting more beats exist beyond the cap. Takes the
// whole Milestones object (not just `beats`) so it can hand the celebration
// hook the plan-scoped id and the full unwindowed lit set — see the comment
// above useMilestoneCelebration.
export function MilestoneBar({ milestones }: { milestones: Milestones }) {
  const { beats, windowed, planId, allLitBeatIds } = milestones;
  const celebrating = useMilestoneCelebration(beats, planId, allLitBeatIds);
  if (beats.length === 0) return null;
  return (
    <div className={`mode-milestones${windowed ? ' windowed' : ''}`} aria-label="Plan coverage for this section" style={{ pointerEvents: 'none' }}>
      {beats.map(b => (
        <span
          key={b.id}
          className={`mode-milestone mode-milestone--${b.state}${celebrating.has(b.id) ? ' celebrate' : ''}`}
          title={`${b.label} — ${b.state}`}
          aria-label={`${b.label}: ${b.state}`}
        />
      ))}
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

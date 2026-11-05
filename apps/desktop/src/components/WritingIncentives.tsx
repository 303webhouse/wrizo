import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MilestoneBeat, Milestones } from '../store/milestones';
import { useTheme } from '../store/theme';
import { useLexicon } from '../store/themeLexicon';
import { createJitteredScheduler } from '../store/effectsScheduler';

// TH2 Slice 2 — the spark burst is Flux-only spectacle riding the SAME
// celebrate class/timing Plateau already uses (one celebration grammar,
// canon §9) — 14 sparks, orange core with ~30% lime, fired once per lap
// completion. Fixed count/angles: "predictable, never variable" is a
// binding guardrail, not a suggestion — no randomness here.
const SPARK_COUNT = 14;
const SPARK_ANGLES = Array.from({ length: SPARK_COUNT }, (_, i) => (360 / SPARK_COUNT) * i);

// shared incentive pieces for ModeStage and JournalEntry; the word goal is a lap: crossing it fills the bar orange with a pulse, then it resets [WritingIncentives §1]

export const WORD_GOAL = 250;
export const TIME_GOAL_MS = 25 * 60 * 1000;
// M2 S4 — exported (was module-private) so RhizomeField.tsx can read the
// SAME celebration-grammar duration constant rather than inventing a
// parallel one ("Timing... read from the celebration grammar's existing
// constants/tokens wherever they exist" — the brief's own words). Purely
// additive; every existing consumer inside this file is unaffected.
export const CELEBRATE_MS = 1100;

// Tracks a value against a repeating goal (a "lap"): returns the fraction
// within the current lap (0..1) and a `celebrating` flag that pulses true for
// CELEBRATE_MS whenever a new lap completes (value crosses a goal multiple).
export function useGoalProgress(value: number, goal: number): { frac: number; celebrating: boolean } {
  const [celebrating, setCelebrating] = useState(false);
  // laps are seeded from the first render, so a page opened with words already written never celebrates an earlier session's laps [WritingIncentives §2]
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
// TH2 Slice 3 — Flux restyles this SAME mount point (canon §8, RESPONSE):
// a teal pool instead of the orange ember. `typing` pauses the 4.3s sputter
// cycle (RESPONSE's honest inverse of TEXTURE's damping — see canon §6);
// `celebrating` fires the one-shot brightness bloom. Plateau's own glow is
// completely untouched — this only branches under [data-theme='flux'] CSS.
export function AmbientGlow({ m, typing, celebrating }: { m: number; typing?: boolean; celebrating?: boolean }) {
  const theme = useTheme();
  const [deepSputter, setDeepSputter] = useState(false);
  const typingRef = useRef(!!typing);
  typingRef.current = !!typing;

  // Jittered deep sputters (canon §8: ~130ms to ~24% opacity, every 6-12s) —
  // only scheduled on Flux; store/effectsScheduler.ts's structural min-gap
  // floor is the ≤3Hz backstop even though these rates are nowhere near it.
  useEffect(() => {
    if (theme !== 'flux') return;
    const scheduler = createJitteredScheduler({
      minMs: 6000,
      maxMs: 12000,
      isBusy: () => typingRef.current,
      onFire: () => {
        setDeepSputter(true);
        setTimeout(() => setDeepSputter(false), 130);
      },
    });
    scheduler.start();
    return () => scheduler.stop();
  }, [theme]);

  if (theme !== 'flux') {
    return <div aria-hidden="true" className="mode-glow" style={{ ['--m' as CSSProperties & string]: m.toFixed(3) } as CSSProperties} />;
  }
  // Two layers so the 4.3s sputter's own opacity animation multiplies
  // against the progress-driven opacity/scale, rather than one CSS
  // animation fighting a calc()'d static value on the same property.
  return (
    <div aria-hidden="true" className="mode-glow-flux-wrap" data-typing={typing ? 'true' : 'false'} data-deep-sputter={deepSputter ? 'true' : 'false'}>
      <div className={`mode-glow mode-glow--flux${celebrating ? ' bloom' : ''}`} style={{ ['--m' as CSSProperties & string]: m.toFixed(3) } as CSSProperties} />
    </div>
  );
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
  // TH2 Slice 2 — Flux restyles this SAME bar (canon §9): lime fill, blue
  // caret notch in flight; on celebrate, an ignition sweep + 14-spark burst
  // ride the identical `celebrate` class/timing Plateau already uses. Zero
  // DOM cost on Plateau (sparks never render) or when not celebrating.
  const theme = useTheme();
  const fluxCelebrate = theme === 'flux' && celebrating;
  return (
    <div className="mode-progress">
      {!hidden && (
        <div className="mode-ptrack">
          <div
            className={`mode-pfill${celebrating ? ' celebrate' : ''}${pct > 0 ? ' started' : ''}`}
            style={{ width: `${pct.toFixed(1)}%` }}
          >
            {fluxCelebrate && (
              <span className="mode-pfill-sparks" aria-hidden="true">
                {SPARK_ANGLES.map((deg, i) => (
                  <span
                    key={i}
                    className={`mode-pfill-spark${i % 3 === 0 ? ' lime' : ''}`}
                    style={{ ['--spark-angle' as CSSProperties & string]: `${deg}deg` } as CSSProperties}
                  />
                ))}
              </span>
            )}
          </div>
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

// W5 - A DECK COMPLETES (every step kindled, for the first time): the theme's EXISTING goal celebration, once - this very bar with `celebrating` on (Arbor: the brass surge; Flux: the ignition sweep + the fourteen
// sparks), not a copy of it. It is a decorative, ephemeral track the board mounts for CELEBRATE_MS and then removes; it carries no number, no label and no fraction of anything.
export function GoalCelebration({ celebrating }: { celebrating: boolean }) {
  if (!celebrating) return null;
  return (
    <div className="deck-celebration" aria-hidden="true">
      <ProgressBar frac={1} celebrating label="" metricLabel="" />
    </div>
  );
}

// milestone celebrations: seeded per plan (scopeKey) from the FULL lit set on the first render after boot, so only beats lit this app-load celebrate; seenLit commits when the pulse completes, so an interrupted one is shown again [WritingIncentives §3]
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

// the circle-bar projects beat coverage, glanceable only; pointer-events:none is an invariant (no exit door on a writing surface); rightSlot keeps the timer beside it [WritingIncentives §4]
export function MilestoneBar({ milestones, rightSlot }: { milestones: Milestones; rightSlot?: React.ReactNode }) {
  const { beats, windowed, planId, allLitBeatIds } = milestones;
  const celebrating = useMilestoneCelebration(beats, planId, allLitBeatIds);
  const { t: lex } = useLexicon();
  if (beats.length === 0) return null;
  return (
    <>
      <div className={`mode-milestones${windowed ? ' windowed' : ''}`} aria-label={`${lex('plan')} coverage for this section`} style={{ pointerEvents: 'none' }}>
        {beats.map(b => (
          <span
            key={b.id}
            className={`mode-milestone mode-milestone--${b.state}${celebrating.has(b.id) ? ' celebrate' : ''}`}
            title={`${b.label} — ${b.state}`}
            aria-label={`${b.label}: ${b.state}`}
          />
        ))}
      </div>
      {rightSlot && <span className="mode-pmetric">{rightSlot}</span>}
    </>
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

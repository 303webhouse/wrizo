import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { useWritingSettings } from '../store/writingSettings';
import { goalCount, useWritingGoal } from '../store/writingGoal';
import { wordCount } from '../store/wordCount';

// THE PLAIN PROGRESS TRACKER (the Wrizors' spec draft 2, approved by Nick Nov 20, 3:57 pm; Fable's 5:25 pm rulings). When the session's "Use Theme
// Progress Tracker" switch is off (writingSettings.themeTracker false), every theme shows this ONE row under the page, where its own tracker sits
// (DeskInstrument's lane), as wide as the page: the count on the left as the session counts it (its goal, in words or lines), a thin bar with a
// small brass tick at her point, and the timer's ELAPSED time on the right (no countdown until a timer length is ruled). Four states: the goal
// (and the time); Goal Reached (a full bar, no tick; the words change and nothing else moves); the count alone; the count and the time. Plain
// means the same shape everywhere: each theme's quiet label colour (styles/24-plain-tracker.css), no theme art, no motion, no celebration, no
// fade. The goal and the timer are the session's (store/writingGoal.ts, writingSettings.timer); nothing here is stored.

const fill = (s: string, vals: Record<string, string | number>): string => Object.entries(vals).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
const num = (n: number): string => n.toLocaleString('en-US');

export function PlainTracker({ text }: { text: string }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  // the clock runs from her first keystroke on this page (the session's own rule, as the Front menu's foot kept it), and reads 0:00 before it
  const mounted = useRef(text);
  const [firstAt, setFirstAt] = useState<number | null>(null);
  useEffect(() => { if (firstAt === null && text !== mounted.current) setFirstAt(Date.now()); }, [text, firstAt]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!settings.timer) return undefined;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [settings.timer]);

  const unit = t(goal?.unit === 'lines' ? 'plainTrackerLines' : 'plainTrackerWords');
  const done = goal ? goalCount(text, goal) : wordCount(text);
  const reached = !!goal && done >= goal.n;
  const frac = goal ? Math.min(1, done / goal.n) : 0;
  const state = reached ? 'reached' : goal ? 'goal' : settings.timer ? 'timer' : 'count';
  const words = reached ? fill(t('plainTrackerReached'), { goal: num(goal.n), unit })
    : goal ? fill(t('plainTrackerOf'), { n: num(done), goal: num(goal.n), unit }) : fill(t('plainTrackerCount'), { n: num(done), unit });
  const s = firstAt == null ? 0 : Math.max(0, Math.floor((now - firstAt) / 1000));
  const clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="plain-tracker" data-plain-tracker data-state={state}>
      <span className="plain-tracker-count">{words}</span>
      {goal && (
        <span className="plain-tracker-track" aria-hidden="true">
          <span className="plain-tracker-fill" style={{ width: `${(frac * 100).toFixed(2)}%` }} />
          {!reached && <span className="plain-tracker-tick" style={{ left: `${(frac * 100).toFixed(2)}%` }} />}
        </span>
      )}
      {settings.timer && <span className="plain-tracker-time">{clock}</span>}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useWritingGoal, goalFraction } from '../store/writingGoal';
import { useWritingSettings } from '../store/writingSettings';

// the goal's glow: one fixed warm gradient whose opacity follows progress, hard-capped by --goal-glow-cap (read at runtime so a theme's cap applies); absent with no target [GoalGlow §1]
const DEFAULT_CAP = 0.34;

function readGlowCap(el: HTMLElement | null): number {
  if (!el || typeof getComputedStyle !== 'function') return DEFAULT_CAP;
  const raw = getComputedStyle(el).getPropertyValue('--goal-glow-cap').trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CAP;
}

// Self-contained: reads the writer-level target and computes progress from
// the page's own raw text (store/lineEquivalents.ts), so every call site is
// just `<GoalGlow text={currentText} />` — no fraction math duplicated per
// host. Renders NOTHING when no target exists (S6: "on any page where a
// target exists" — an untargeted page has no glow, ever; clearing the goal
// disables this instrument immediately, everywhere).
export function GoalGlow({ text }: { text: string }) {
  const target = useWritingGoal();
  // FX3 S5 — the instruments panel's own on/off (Sliver.tsx's foot row),
  // an ADDITIONAL gate on top of the existing target-null check below, not
  // a replacement for it — clearing the target already hides this (CD1 S6,
  // untouched); this just lets a writer hide it temporarily without losing
  // the stored target number.
  const settings = useWritingSettings();
  const ref = useRef<HTMLDivElement>(null);
  const [cap, setCap] = useState(DEFAULT_CAP);

  // Re-reads on every `target` transition (not just mount) — target can
  // flip from null (nothing rendered, ref.current unset) to a real value
  // without this component ever unmounting, and the cap must still be
  // picked up correctly the first time it actually renders.
  useEffect(() => { setCap(readGlowCap(ref.current)); }, [target]);

  if (target == null || target.n <= 0 || !settings.instrumentsOn) return null;

  const fraction = goalFraction(text, target);
  // an eased curve (fraction^0.28) so early and mid progress read; it reaches the cap exactly at 1 and never exceeds it [GoalGlow §2]
  const eased = Math.pow(fraction, 0.28);
  const intensity = eased * cap;

  return (
    <div
      ref={ref}
      className="wz-goal-glow"
      aria-hidden="true"
      style={{ ['--glow-intensity' as unknown as string]: intensity.toFixed(3) } as React.CSSProperties}
    />
  );
}

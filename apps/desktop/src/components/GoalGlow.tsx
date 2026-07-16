import { useEffect, useRef, useState } from 'react';
import { useWritingGoal } from '../store/writingGoal';
import { countLineEquivalents } from '../store/lineEquivalents';

// CD1 S6 — the goal's glow: a warm radial behind the paper, mapping to
// progress fraction (0..1, line-equivalents / the writer-level target).
// Ships DEFAULT-ON (Nick's ratification). Hard-capped via a CSS custom
// property (`--goal-glow-cap`, index.css :root) so it can never exceed a
// subtle halo regardless of progress — the field never burns; themes may
// dial the cap, never remove it. Read at runtime via getComputedStyle (not
// a duplicated JS constant) so a theme's own override of the token actually
// takes effect here, with DEFAULT_CAP only as the non-DOM/SSR fallback.
//
// One implementation, reused by the HB-arc's first-run gate later (the
// brief's own words) — no mode-specific branching, no completion event, no
// color shift: the SAME fixed warm gradient at every fraction, only its
// opacity (the intensity) changes, easing to rest at the cap when full.
// Absent entirely when no target exists (an untargeted page has no glow —
// neutral, never punitive).
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
  const ref = useRef<HTMLDivElement>(null);
  const [cap, setCap] = useState(DEFAULT_CAP);

  // Re-reads on every `target` transition (not just mount) — target can
  // flip from null (nothing rendered, ref.current unset) to a real value
  // without this component ever unmounting, and the cap must still be
  // picked up correctly the first time it actually renders.
  useEffect(() => { setCap(readGlowCap(ref.current)); }, [target]);

  if (target == null || target <= 0) return null;

  const lines = countLineEquivalents(text);
  const fraction = Math.max(0, Math.min(1, lines / target));
  const intensity = fraction * cap;

  return (
    <div
      ref={ref}
      className="wz-goal-glow"
      aria-hidden="true"
      style={{ ['--glow-intensity' as unknown as string]: intensity.toFixed(3) } as React.CSSProperties}
    />
  );
}

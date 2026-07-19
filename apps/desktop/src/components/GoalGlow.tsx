import { useEffect, useRef, useState } from 'react';
import { useWritingGoal } from '../store/writingGoal';
import { useWritingSettings } from '../store/writingSettings';
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

  if (target == null || target <= 0 || !settings.instrumentsOn) return null;

  const lines = countLineEquivalents(text);
  const fraction = Math.max(0, Math.min(1, lines / target));
  // FX4 S2 — Nick's "I can't perceive it" turned out to be TWO separate
  // things, diagnosed in order per FX2's own law (defect before tuning):
  // (1) a real rendering defect — this component's own anchor sat behind
  // the ENTIRE app background regardless of intensity, fixed structurally
  // in index.css (`.desk-frame-stage{ isolation:isolate }`), proven with a
  // live screenshot showing zero visible warmth at a non-zero
  // `--glow-intensity` before the fix, and a clearly visible halo after;
  // (2) once actually painting, the LINEAR fraction->opacity mapping still
  // left early/mid progress reading faint (a fresh page's glow barely
  // above the floor). The eased curve is the SAME `Math.pow(x, 0.55)`
  // technique this file's own sibling instrument (WritingIncentives.tsx's
  // AmbientGlow, JournalEntry.tsx's legacy branch) already uses for the
  // identical "make early progress read, not just late progress" problem —
  // reused, not invented. `cap` itself (the field-never-burns hard ceiling)
  // is completely untouched by this — the curve only changes how much of
  // the sub-cap range a given FRACTION reaches, never the ceiling.
  //
  // FX5 S2 — the paint fix above was real, but 0.55 still left mid-goal
  // reading faint on Nick's own desk ("Glow — anyone, anyone? Bueller?").
  // Re-diagnosed rather than re-guessed: the structural fix from FX4 was
  // confirmed still in place (isolation:isolate, unchanged, verified live),
  // so the remaining gap was genuinely the curve's own shallowness — at
  // fraction=0.5 the old exponent only reached ~68% of the cap
  // (eased=.684, intensity=.233 at cap=.34), and multiplied again by the
  // gradient's own peak color-stop alpha (.55, index.css .wz-goal-glow,
  // untouched by this ticket) the ACTUAL peak-pixel alpha at mid-goal was
  // only ~.13 — genuinely marginal on a bright, normally-lit display.
  // 0.28 is a materially steeper (more aggressive) exponent: fraction=0.1
  // now reaches ~52% of cap, fraction=0.25 ~68%, fraction=0.5 ~82%
  // (intensity=.280, comfortably clear of the raised floor below and
  // comfortably under the untouched .34 cap — this did NOT fight the
  // ceiling, so no STOP-and-report was needed), fraction=1 still eases to
  // rest exactly at the cap (unchanged "field never burns" behavior at
  // completion). Measured empirically post-change via a screenshot at
  // fraction=0.5 (see the build report) — genuinely, visibly warmer than
  // the FX4 screenshot at the same fraction, not just a bigger number.
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

import { useEffect, useRef, useState, type ReactNode } from 'react';

// HB1 S3 — the veil + the gate. Three small, composable pieces, wired
// together by PageEditorView on the ONE page a first-run Write click can
// produce (components/Arrival.tsx's `firstRunGate` one-shot navigation
// state — the same pattern useWarmStart already uses for its own one-shot
// signal). Nothing here is mode-specific or reusable beyond that page: the
// brief's own instrument (100 whitespace-delimited words, F1).

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// F1 — "monotone under forward lock." The clean derived text forward lock
// reports can transiently SHRINK while a trailing run is struck (it drops
// out of the derived text until the writer moves past it) — exactly the
// backward flicker forward lock exists to keep a writer from feeling
// anywhere else. Tracks a running max instead of the raw live count, reset
// only when the gate itself goes inactive (a fresh attempt).
export function useMonotonicWordCount(text: string, active: boolean): number {
  const [maxWords, setMaxWords] = useState(0);
  useEffect(() => {
    if (!active) { setMaxWords(0); return; }
    const live = wordCount(text);
    setMaxWords(m => (live > m ? live : m));
  }, [text, active]);
  return active ? maxWords : wordCount(text);
}

// The veil: chrome wrapped here goes inert AND blurred while `active`. Sets
// the real `inert` DOM attribute imperatively (sidesteps any React/TS
// version gap in JSX's own typing for it) so assistive tech and pointer
// input both structurally cannot reach the wrapped subtree — `aria-hidden`
// and the CSS blur/pointer-events:none (index.css) are the belt-and-
// suspenders layers on top, not the only ones.
export function FirstRunVeil({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }, [active]);
  return (
    <div ref={ref} className="hb1-veil" data-veiled={active ? 'true' : 'false'} aria-hidden={active || undefined}>
      {children}
    </div>
  );
}

// The gate's one sanctioned instruction + its progress bar. Static text —
// no aria-live: the page is otherwise fully inert, so a screen-reader
// writer reaches this (and the editor) as the only two things on the
// surface, without a live region re-announcing on every keystroke.
export function FirstRunGateBanner({ words, target }: { words: number; target: number }) {
  const fraction = Math.max(0, Math.min(1, words / target));
  return (
    <div className="hb1-gate-banner">
      <div className="hb1-gate-instruction">Write {target} words to unlock your desk</div>
      <div className="hb1-gate-track">
        <div className="hb1-gate-trackfill" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
}

// The gate's glow — the SAME rendering contract as components/GoalGlow.tsx
// (`.wz-goal-glow`, `--glow-intensity`, the same `--goal-glow-cap` read),
// so it can drop straight into DeskFrame's `goalGlow` slot in place of the
// real GoalGlow while the gate is active. GoalGlow itself measures line-
// equivalents against a writer-level target; the gate measures words
// against the fixed 100-word threshold (F1) — different fraction sources,
// identical seam (one progress fraction, capped, no color shift), per the
// brief's own "consume, don't fork" invariant. Re-plumbs into the canonical
// glow system whenever the origin chat's own pass lands (not this ticket).
const DEFAULT_CAP = 0.34;

export function FirstRunGlow({ fraction }: { fraction: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cap, setCap] = useState(DEFAULT_CAP);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof getComputedStyle !== 'function') return;
    const raw = getComputedStyle(el).getPropertyValue('--goal-glow-cap').trim();
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n > 0) setCap(n);
  }, []);
  const intensity = Math.max(0, Math.min(1, fraction)) * cap;
  return (
    <div
      ref={ref}
      className="wz-goal-glow"
      aria-hidden="true"
      style={{ ['--glow-intensity' as unknown as string]: intensity.toFixed(3) } as React.CSSProperties}
    />
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';

// HB1 S3 — the veil + the gate. Three small, composable pieces, wired
// together by PageEditorView on the ONE page a first-run Write click can
// produce (components/Arrival.tsx's `firstRunGate` one-shot navigation
// state — the same pattern useWarmStart already uses for its own one-shot
// signal). The instrument is the brief's own: 100 whitespace-delimited words,
// F1.
//
// CORRECTED 2026-08-26 (item 84, the deck phase). This header used to end
// "Nothing here is mode-specific or reusable beyond that page." That sentence
// was true when written — the veil and the gate had one caller — and it is no
// longer true of `useMonotonicWordCount`, which item 84's Free Write roster now
// imports for Nick's refill ruling ("It should reset after 100 words have been
// written"). Corrected rather than left standing, under the mirror law this
// house already applies to tutor-rules.md: a comment that lies about the code
// is a defect, and it is fixed in the SAME COMMIT as the change that falsified
// it. THE VEIL AND THE GATE REMAIN HB1's, and remain first-run-only; it is the
// word COUNT that turned out to be general — which is the honest shape of it,
// since Nick's hundred and F1's hundred are the same hundred, and a second
// reading of the same number would have been the real defect.

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
//
// Renders children with NO wrapper at all when inactive — this component is
// reused at call sites (ModeStage's reveal handle + settings gear) that
// mount on EVERY page, framed or not, gated or not; leaving an always-
// present (if inert-false) `.hb1-veil` node there would make ".hb1-veil
// exists" stop meaning "the gate is active," and would add a DOM node to
// every page in the app for a feature that touches exactly one page per
// device. The wrapped children never hold state that could be lost by the
// wrapper appearing/disappearing across the active/inactive edge: they're
// either inert for the entire time they'd have such state (Drawer/Sliver
// can't diverge from their mount defaults while unreachable) or stateless
// controls (ChromeHandle, the gear buttons).
export function FirstRunVeil({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    el.setAttribute('inert', '');
    return () => { el.removeAttribute('inert'); };
  }, [active]);
  if (!active) return <>{children}</>;
  return (
    <div ref={ref} className="hb1-veil" data-veiled="true" aria-hidden="true">
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

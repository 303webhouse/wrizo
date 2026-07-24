import { useEffect, useRef, useState, useCallback } from 'react';
import { useWritingSettings } from '../store/writingSettings';
import { useGoalProgress, WORD_GOAL, CELEBRATE_MS } from './WritingIncentives';
import {
  mulberry32, hashSeed, createRhizomeState, seedOrigins, saturationTarget, growTo, burstSegments,
  type RhizomeState, type RhizomeGeometry, type RhizomePoint, type RhizomeSegment,
} from '../store/rhizomeEngine';

// M2 — the Rhizome (docs/wrizo-alpha/m2-rhizome-brief.md, S2/S4). A single
// ambient SVG layer: absolutely positioned, clipped to its own box (an SVG
// element clips its own content to its own bounds by default — no separate
// `overflow:hidden` wrapper needed), z-index beneath paper and chrome (index
// .css's `.wz-rhizome-field`), `pointer-events:none`, `aria-hidden` — purely
// ambient, can never intercept a click or carry a control.
//
// SCOPE JUDGMENT CALL (disclosed in full in the build report): this build
// mounts RhizomeField ONLY on the framed (>=1100px) desk stage — the ONE
// place a "stage" wider than the paper itself genuinely exists in the
// current app (`.desk-frame-stage`, DeskFrame.tsx's own name for that exact
// zone — the literal match to S2's own words, "the desk stage"). Below
// 1100px, ModeStage's own root (`.mode-stage`) shrink-wraps to the paper's
// own intrinsic width when framed, and even in the legacy (`!framed`)
// layout the incentive row this ticket would otherwise extend does not
// currently exist at all inside `.desk-frame-stage` (S5's own mandatory
// geometry widths — 1100/1280/2200 — are ALL >= DESKFRAME_MIN_WIDTH, i.e.
// they exercise the framed path exclusively). Building a second, cramped
// legacy-only mount point would either (a) leave the mandatory geometry
// proofs untestable, or (b) require reviving DeskFrame's own explicitly-
// parked "meter track stays empty" law (FX1 S5, reaffirmed verbatim by both
// PageEditor.tsx's and JournalEntry.tsx's own framed-branch comments) for a
// feature the brief never asked to un-park. Scoping to framed-only keeps
// legacy (<1100px) chrome unconditionally byte-identical (this build's own
// standing instruction), keeps the paper-rect/stage-clamp proofs meaningful
// at every one of S5's three mandatory widths, and reuses an existing,
// PROVEN overlay pattern (GoalGlow.tsx/`goalGlow`) instead of inventing a
// new one. The Progress-style SETTING itself (S1) still stores/persists at
// any width — only its offering in the gear (ModeStage.tsx's SettingsPanel,
// `framed` prop) and this component's own visual effect are scoped to
// framed, so a writer who picks Rhizome on a wide screen sees it resume
// the instant they're back on one.
//
// Self-contained like GoalGlow.tsx: reads its own settings slice, computes
// its own `celebrating` flag by calling the SAME `useGoalProgress` hook the
// bar itself calls (imported verbatim, not re-implemented) with the SAME
// `unitCount` the host already computes for the bar — "the SAME unit event
// the bar already consumes" as literally as two independent calls to one
// pure hook can make it. No new subscription to the write/persistence bus:
// `unitCount` is a plain number prop, recomputed by the host from state it
// already holds for other reasons (item 18's own force-render ceiling).
const SESSION_START = Date.now(); // frozen once per app-load/session (S2: "session-scoped")

const BURST_COUNT = 12;
const BURST_STAGGER_MS = 600; // "staggered ~600ms across live shoots" (S4)

function measure(svg: SVGSVGElement, paper: HTMLElement): { geo: RhizomeGeometry; origin: RhizomePoint } | null {
  const stageRect = svg.getBoundingClientRect();
  const paperRect = paper.getBoundingClientRect();
  if (stageRect.width <= 0 || stageRect.height <= 0) return null;
  return {
    geo: {
      width: stageRect.width,
      height: stageRect.height,
      paper: {
        left: paperRect.left - stageRect.left,
        top: paperRect.top - stageRect.top,
        right: paperRect.right - stageRect.left,
        bottom: paperRect.bottom - stageRect.top,
      },
    },
    // S2's own origin: "the horizontal midpoint of the progress row's own
    // measured rect... first shoot rooted there." No incentive row exists
    // on the framed desk stage today (see this file's own header comment) —
    // the paper's own bottom-center reads as its exact equivalent (every
    // current layout centers the row on the SAME column as the paper, so
    // the two midpoints already coincide) and is trivially, always
    // measurable regardless of style/mode.
    origin: {
      x: (paperRect.left + paperRect.right) / 2 - stageRect.left,
      y: paperRect.bottom - stageRect.top,
    },
  };
}

export function RhizomeField({ unitCount, seedKey, paperRef }: {
  unitCount: number;
  seedKey: string;
  paperRef: React.RefObject<HTMLElement | null>;
}) {
  const settings = useWritingSettings();
  const active = settings.progress === 'words' && settings.progressStyle === 'rhizome';
  const { celebrating } = useGoalProgress(unitCount, WORD_GOAL);

  const svgRef = useRef<SVGSVGElement>(null);
  const [state, setState] = useState<RhizomeState>(createRhizomeState);
  const [burstOrder, setBurstOrder] = useState<Map<number, number>>(() => new Map());
  const [flash, setFlash] = useState(false);

  const rngRef = useRef<(() => number) | null>(null);
  const lastUnitRef = useRef<number | null>(null);
  const prevCelebratingRef = useRef(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // M3 S2 — the 7 blue-noise origins, computed ONCE per entry (in the growth
  // effect, from the seeded rng + the first successful measure) so the same
  // page scatters the same way and the rng stream stays deterministic across
  // every growTo call.
  const originsRef = useRef<RhizomePoint[] | null>(null);

  // `stateRef` mirrors `state` synchronously (written by `updateState`
  // below, never independently) so the growth effect and the burst effect
  // — two SEPARATE effects that can both fire from the SAME commit (a
  // single word crossing the goal on the very event that also roots the
  // first-ever shoot) — always compose against each other's latest write,
  // in declaration order, rather than each closing over a possibly-stale
  // `state` from the last completed render. `updateState` calls `setState`
  // with a plain VALUE, never a function, so React 18 StrictMode's own
  // double-invoke-to-check-purity behavior (main.tsx wraps the app in
  // `<React.StrictMode>`) can never run the PRNG-consuming computation
  // twice — that would have silently burned extra `rng()` draws only in
  // dev, a real (if dev-only) determinism hazard the plain-value form
  // avoids by construction rather than by care.
  const stateRef = useRef<RhizomeState>(state);
  const updateState = useCallback((updater: (s: RhizomeState) => RhizomeState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  // Re-seed whenever the entry changes (a fresh page => a fresh field —
  // S2's own seed key is entry id + session start; SESSION_START itself is
  // fixed for the whole app-load, so revisiting the SAME entry within the
  // SAME session reproduces the identical PRNG stream from empty, which is
  // exactly what the harness's determinism proof exercises).
  useEffect(() => {
    rngRef.current = mulberry32(hashSeed(`${seedKey}:${SESSION_START}`));
    lastUnitRef.current = null;
    originsRef.current = null; // M3 — a fresh entry re-scatters its own ground
    const fresh = createRhizomeState();
    stateRef.current = fresh;
    setState(fresh);
    setBurstOrder(new Map());
  }, [seedKey]);

  const measureNow = useCallback(() => {
    const svg = svgRef.current;
    const paper = paperRef.current;
    if (!svg || !paper) return null;
    return measure(svg, paper);
  }, [paperRef]);

  // The growth loop — one PRNG-driven step per unit the host's own word
  // count advanced by since the last observed value. Mount-seeds to the
  // CURRENT count (the useGoalProgress/W1-R1 "seed on mount, never
  // retroactively celebrate/grow the past" law) rather than ever catching
  // up — a page opened with 600 words already written shows an EMPTY field
  // until NEW words are written this session, matching the milestone
  // celebration's own established precedent exactly.
  // M3 S2/S3 — the growth loop. Coverage tracks TOTAL word count (not M2's
  // session delta) through the saturation curve, so opening a page already
  // written shows a ground alive to the essay's length (the DoD) rather than
  // M2's empty-until-you-type. The 7 blue-noise origins (S2) are computed ONCE,
  // from the seeded rng + the first successful measure, BEFORE any growth — so
  // the same page scatters the same way and the growth stream stays
  // deterministic across every call. growTo is forward-only (deleting words is a
  // no-op, never a shrink — the M2 law) and idempotent for a given target, so a
  // React 18 StrictMode double-invoke of this effect adds no segments and burns
  // no extra rng (the origins seed once behind the ref guard; growTo no-ops when
  // already at target) — the same dev-only determinism hazard updateState's
  // plain-value form already guards, closed here by construction too.
  useEffect(() => {
    if (!active || !rngRef.current) return;
    const m = measureNow();
    if (!m) return;
    if (!originsRef.current) originsRef.current = seedOrigins(rngRef.current, m.geo);
    lastUnitRef.current = unitCount;
    updateState(s => growTo(s, rngRef.current!, m.geo, originsRef.current!, saturationTarget(unitCount)));
  }, [unitCount, active, measureNow, updateState]);

  // S4 — the milestone burst + flash, on the SAME `celebrating` transition
  // the bar itself already fires on (nothing new invented). Decoupled from
  // `celebrating`'s own CELEBRATE_MS window on purpose: the flash's own
  // total (hold + ease-back) runs a little past it, and "growth kept whole"
  // must not depend on the bar's flag staying true the whole time.
  useEffect(() => {
    if (active && celebrating && !prevCelebratingRef.current) {
      const m = measureNow();
      if (m && rngRef.current) {
        const { state: next, added } = burstSegments(stateRef.current, rngRef.current, m.geo, BURST_COUNT);
        stateRef.current = next;
        setState(next);
        if (added.length > 0) {
          setBurstOrder(prev => {
            const map = new Map(prev);
            added.forEach((seg, i) => map.set(seg.id, i));
            return map;
          });
        }
      }
      setFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      // B4-provisional — 1200ms (400ms hold + 800ms ease-back, S4's own
      // exact split) has no existing named celebration-grammar constant of
      // its own to read from; CELEBRATE_MS (imported above, reused for
      // `useGoalProgress` itself) anchors the SAME duration family per the
      // canon's "same duration family" rule, but not this exact number —
      // B4's ember-accent finish is the named final authority (brief S4).
      flashTimerRef.current = setTimeout(() => setFlash(false), 1200);
    }
    prevCelebratingRef.current = celebrating;
  }, [celebrating, active, measureNow]);

  useEffect(() => () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); }, []);

  if (!active) return null;

  return (
    <svg
      ref={svgRef}
      className="wz-rhizome-field"
      aria-hidden="true"
      focusable="false"
      data-flash={flash ? 'true' : 'false'}
      style={{ pointerEvents: 'none' }}
    >
      {state.segments.map((seg: RhizomeSegment) => {
        const order = burstOrder.get(seg.id);
        return (
          <line
            key={seg.id}
            className="wz-rhizome-seg"
            x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
            style={order != null ? { animationDelay: `${(order * BURST_STAGGER_MS) / BURST_COUNT}ms` } : undefined}
          />
        );
      })}
    </svg>
  );
}

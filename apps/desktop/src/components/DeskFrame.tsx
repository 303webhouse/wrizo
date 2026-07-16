import { useEffect, useRef, useState, type ReactNode } from 'react';
import { setDeskFrameMounted } from '../store/deskFrameActive';
import { useDeskLexicon } from '../store/deskLexicon';

// AB1 S1 — the Page and its Desk. One component owning the viewport at
// >=1100px (DESKFRAME_MIN_WIDTH). Below that, per the ticket's own non-goal
// ("mobile (<1100px) keeps current behavior"), DeskFrame does not render at
// all — every call site branches on useDeskFrameViewport() and renders its
// EXACT pre-AB1 JSX below the gate, unchanged. See
// docs/wrizo-alpha/ab1-shell-inventory.md for why this keeps the whole
// existing harness suite green without needing to park anything in it.
//
// CD1 — the composed desk (docs/wrizo-alpha/cd1-composed-desk-brief.md).
// Zone tracks, present from day one even where empty:
//   1. wayfinding rail   — CD1 S4: DeskRail no longer mounts while ANY
//      DeskFrame is on screen (framed-only; legacy <1100px, which never
//      mounts DeskFrame at all, keeps DeskRail byte-identical). The gutter
//      it used to reserve (`.app-main`'s padding-left) collapses in step
//      (App.tsx reads the SAME store/deskFrameActive.ts signal this
//      component already writes, below) — the reclaimed width is what S5's
//      composition actually has to work with.
//   2. tool-rail track    — .desk-frame-toolrail. The Drawer (AB3, CD1 S3):
//      Page + Places faces only — the third `tools` face retired, its
//      estate divided between the sliver (hand tools) and nothing (the
//      drawer itself stops hosting tools).
//   3. the stage          — .desk-frame-stage. Centers the page: prose
//      min(760px,60ch) via .desk-frame-stage--prose; screenplay keeps its own
//      courier measure via .desk-frame-stage--screenplay (no forced 60ch).
//      CD1 S2/S6 add two overlay anchors inside it (sliver, goalGlow) — see
//      the props' own comments below; neither is a grid/flex track, so
//      neither can ever move the paper's rect.
//   4. corkboard track    — .desk-frame-corkboard. CD1 S5: adopts the FX1
//      S5 law ("render only with content") — its grid column itself
//      disappears, not just its children, when nothing is passed (every
//      CD1 caller). AB4's Wall is its first real tenant.
//   5. meter track        — .desk-frame-meter. ALWAYS empty/reserved (S2:
//      do not mount the incentive layer here) — desk ground at a fixed
//      height, ready for the flourishes' eventual return.
//
// CD1 S5 — the whole grid caps at a working max width (--frame-max,
// index.css) and centers within `.desk-frame-host`, which itself now
// carries the desk-ground texture across its full (uncapped) width — "a
// wide desk is more wood, not more furniture."
//
// Fixed CSS Grid tracks (not flex) — the page bounding rect is invariant
// under every toggle inside this frame (corkboard content, mode switches,
// gear panels) because track WIDTHS never change, only content inside a
// track re-flows. Extends the PAGE IS PRIMARY assertion pattern already
// proven by w2.mjs's rect-invariance checks.
export const DESKFRAME_MIN_WIDTH = 1100;

export function useDeskFrameViewport(): boolean {
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKFRAME_MIN_WIDTH,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(`(min-width: ${DESKFRAME_MIN_WIDTH}px)`);
    const onChange = () => setActive(mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange); // older WebKit fallback
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return active;
}

export interface DeskFrameProps {
  pageKind: 'prose' | 'screenplay';
  // CD1 S1 — the mode strip RETIRES from this track: it now lives in the
  // host's own top-line header row, above DeskFrame entirely (see
  // PageEditor.tsx/JournalEntry.tsx/ScriptEditor.tsx's own `sprint-nav`
  // composition). DeskFrame no longer accepts or renders one — a caller
  // still wiring `modeStrip` is a compile error, by design (the S1 park
  // sweep is meant to catch every stale call site, not silently no-op).
  // AB2 S1 — the tool-rail track's real content — the Drawer (AB3),
  // composing the Page/Places faces (CD1 S3 retires the third, `tools`,
  // face; its hand-tool content moves to `sliver` below). Empty/reserved
  // (desk ground, exactly as AB1 shipped it) when omitted — Board still
  // passes nothing here.
  toolRail?: ReactNode;
  // CD1 S2 — the sliver: the mode's hand tools + the goal block, riding the
  // paper's left edge. Rendered as an ABSOLUTELY POSITIONED overlay inside
  // `.desk-frame-stage` (see `.desk-frame-sliver-anchor` in index.css) —
  // never a grid/flex track, so the paper's rect is structurally immune to
  // it regardless of open/closed/dissolved state (S2's hard geometry law).
  sliver?: ReactNode;
  // CD1 S6 — the goal's warm glow, behind the paper. Same overlay
  // discipline as `sliver` (absolutely positioned, paper rect untouched),
  // centered instead of left-anchored.
  goalGlow?: ReactNode;
  // CD1 S5 — the corkboard track adopts the FX1 S5 law ("render only with
  // content"): omitted (as every CD1 caller does — nothing passes content
  // yet) means the whole track — including its grid column — disappears,
  // not just its children. AB4's Wall is this prop's first real tenant.
  corkboard?: ReactNode;
  // FX1 S5 — the meter track never got a content prop (AB1 S2: "ALWAYS
  // empty/reserved... do not mount the incentive layer here"), so its
  // desk-ground shell rendered as a wide, purposeless bar along the stage's
  // bottom on every framed page — Nick's "the dead bar" verdict. No caller
  // passes this yet; when the incentive layer eventually returns here, it
  // renders through this prop and the track reappears with it.
  meter?: ReactNode;
  dissolved?: boolean;
  children: ReactNode;
}

// S3 note — DeskFrame does NOT run its own useChromeDissolve; the vanishing
// law stays one engine (no second fade system). Every call site already owns
// a ModeStage-driven (or equivalent) engine and passes ITS OWN outer page
// ref as chromeRootRef, so --fade-dur lands on an ancestor of both the
// editor's own chrome AND this frame's tracks — CSS custom properties
// inherit down the DOM tree, so `.desk-frame-modestrip` /
// `.desk-frame-toolrail` / `.desk-frame-corkboard` (each carrying
// `chrome-fade desk-dissolve`) pick up the same fast-out/slow-in curve
// automatically, without DeskFrame needing to touch the timing itself.
export function DeskFrame({ pageKind, toolRail, sliver, goalGlow, corkboard, meter, dissolved, children }: DeskFrameProps) {
  const { t } = useDeskLexicon();
  const rootRef = useRef<HTMLDivElement>(null);

  // Tell App.tsx's GlobalHeader to collapse its orphaned top-right controls
  // into one corner glyph while this frame is on screen (S4). Cleared on
  // unmount so every other route's chrome is completely untouched.
  useEffect(() => {
    setDeskFrameMounted(true);
    return () => setDeskFrameMounted(false);
  }, []);

  // CD1 S5 — "render only with content" (the FX1 S5 law, reused verbatim
  // for a different track): the corkboard's own grid COLUMN disappears
  // along with its children when nothing is passed, not just its contents
  // — otherwise the reclaimed width from S4's rail retirement is immediately
  // spent on a dead 260px column instead of reaching the composed frame.
  const hasCorkboard = corkboard != null;

  return (
    <div ref={rootRef} className="desk-frame" data-writing={dissolved ? 'true' : 'false'}>
      <div className="desk-frame-grid" data-corkboard={hasCorkboard ? 'true' : 'false'}>
        <aside className="desk-frame-toolrail chrome-fade desk-dissolve" aria-label={t('zoneToolRail')}>
          {toolRail}
        </aside>
        <div className="desk-frame-stagecol">
          <div className={`desk-frame-stage desk-frame-stage--${pageKind}`}>
            {/* CD1 S6 — the glow sits behind the paper (DOM order first,
                negative z-index — see index.css); centered on the SAME
                canonical paper width the sliver anchors against. */}
            {goalGlow && <div className={`desk-frame-goalglow-anchor desk-frame-goalglow-anchor--${pageKind}`}>{goalGlow}</div>}
            {/* CD1 S2 — the sliver overlays the stage margin, left-anchored
                to the paper's own canonical width. Absolutely positioned:
                structurally cannot move `children`'s box below. */}
            {sliver && <div className={`desk-frame-sliver-anchor desk-frame-sliver-anchor--${pageKind}`}>{sliver}</div>}
            {children}
          </div>
          {/* FX1 S5 — render nothing instead of an empty vessel (see the
              `meter` prop's own comment above). */}
          {meter && <div className="desk-frame-meter" aria-label={t('zoneMeter')}>{meter}</div>}
        </div>
        {hasCorkboard && (
          <aside className="desk-frame-corkboard chrome-fade desk-dissolve" aria-label={t('zoneCorkboard')}>
            {corkboard}
          </aside>
        )}
      </div>
    </div>
  );
}

// AB2 S2 — the interim Journal capture tab (AB1's CorkboardJournalTab /
// CAPTURE_ITEMS) is RETIRED here: the corkboard track returns to
// empty/reserved until AB3, and the capture items (Spark deck / Fragments /
// Send → Drawer) move to their ruled final home, the Free Write tool rail
// (AB2's ToolRail.tsx — see its own CAPTURE_ITEMS export). Parked, not
// deleted: the harness checks that once asserted this stub's presence live
// on in scripts/harness/ab1.mjs's PARKED section (S8), with their successors
// in ab2.mjs. CD1 S7 — ToolRail.tsx itself retires whole; CAPTURE_ITEMS now
// lives at components/Sliver.tsx, verbatim.

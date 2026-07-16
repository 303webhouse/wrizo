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
// Five zone tracks, per the brief, present from day one even where empty:
//   1. wayfinding rail   — NOT re-rendered here. components/DeskRail.tsx is
//      already `position:fixed`, 64px wide, with `.app-main{padding-left:
//      64px}` reserving its gutter globally (App.tsx, every route). DeskFrame
//      documents this as track 1 rather than duplicating it.
//   2. tool-rail track    — .desk-frame-toolrail. Empty/reserved in AB1 (the
//      per-mode tool rails are AB2 non-goals) — desk ground at a fixed width.
//   3. the stage          — .desk-frame-stage. Centers the page: prose
//      min(760px,60ch) via .desk-frame-stage--prose; screenplay keeps its own
//      courier measure via .desk-frame-stage--screenplay (no forced 60ch).
//   4. corkboard track    — .desk-frame-corkboard. Interim home for the
//      Journal capture tab (S2); empty/reserved on surfaces that don't pass
//      one (Board, Script).
//   5. meter track        — .desk-frame-meter. ALWAYS empty/reserved in AB1
//      (S2: do not mount the incentive layer here) — desk ground at a fixed
//      height, ready for the flourishes' eventual return.
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
  modeStrip?: ReactNode;
  // AB2 S1 — the tool-rail track's real content, per mode
  // (components/ToolRail.tsx). Empty/reserved (desk ground, exactly as AB1
  // shipped it) when omitted — Board still passes nothing here.
  toolRail?: ReactNode;
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
export function DeskFrame({ pageKind, modeStrip, toolRail, corkboard, meter, dissolved, children }: DeskFrameProps) {
  const { t } = useDeskLexicon();
  const rootRef = useRef<HTMLDivElement>(null);

  // Tell App.tsx's GlobalHeader to collapse its orphaned top-right controls
  // into one corner glyph while this frame is on screen (S4). Cleared on
  // unmount so every other route's chrome is completely untouched.
  useEffect(() => {
    setDeskFrameMounted(true);
    return () => setDeskFrameMounted(false);
  }, []);

  return (
    <div ref={rootRef} className="desk-frame" data-writing={dissolved ? 'true' : 'false'}>
      <div className="desk-frame-grid">
        <aside className="desk-frame-toolrail chrome-fade desk-dissolve" aria-label={t('zoneToolRail')}>
          {toolRail}
        </aside>
        <div className="desk-frame-stagecol">
          {modeStrip && <div className="desk-frame-modestrip chrome-fade desk-dissolve">{modeStrip}</div>}
          <div className={`desk-frame-stage desk-frame-stage--${pageKind}`}>
            {children}
          </div>
          {/* FX1 S5 — render nothing instead of an empty vessel (see the
              `meter` prop's own comment above). The 260px corkboard track
              beside it is a NAMED NON-GOAL (brief) — left exactly as AB1/AB3
              shipped it, empty shell and all, even though it's the same
              species of bug; that track's fate is the composition
              committee's, not this ticket's. */}
          {meter && <div className="desk-frame-meter" aria-label={t('zoneMeter')}>{meter}</div>}
        </div>
        <aside className="desk-frame-corkboard chrome-fade desk-dissolve" aria-label={t('zoneCorkboard')}>
          {corkboard}
        </aside>
      </div>
    </div>
  );
}

// AB2 S2 — the interim Journal capture tab (AB1's CorkboardJournalTab /
// CAPTURE_ITEMS) is RETIRED here: the corkboard track returns to
// empty/reserved until AB3, and the capture items (Spark deck / Fragments /
// Send → Drawer) move to their ruled final home, the Free Write tool rail
// (components/ToolRail.tsx — see its own CAPTURE_ITEMS export). Parked, not
// deleted: the harness checks that once asserted this stub's presence live
// on in scripts/harness/ab1.mjs's PARKED section (S8), with their successors
// in ab2.mjs.

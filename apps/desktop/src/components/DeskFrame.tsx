import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { fitScaleFor, onePanelAt, pageLayoutHeightFor, pageScaleFor, pageYieldFor, PAGE_W_BASE, zoomFor } from '../store/pageScale';
import { DRAWER_MIN, useStandingHands } from '../store/menusDrawers';
import { chromeK } from '../reorg/chromeScale';
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
//   2. strip track         — .desk-frame-strip. CD2 S1/S5: the Cascade's
//      strip (components/Cascade.tsx) replaces the Drawer here whole — the
//      left drawer RETIRES (Drawer.tsx deleted), not "gets a sibling."
//      Unlike the drawer it replaces, the strip carries NO chrome-fade/
//      desk-dissolve classes: S1's own law is "never dissolving, focusable"
//      (the strip is glance, always one look away, like the sliver's own
//      grip). The strip's category panels (reach) and survey (browse) are
//      NOT this track's content — they're overlays, see `cascadeLayers`
//      below, the same structural family as `sliver`/`goalGlow`.
//   3. the stage          — .desk-frame-stage. Centers the page: prose
//      min(760px,60ch) via .desk-frame-stage--prose; screenplay keeps its own
//      courier measure via .desk-frame-stage--screenplay (no forced 60ch).
//      AB4 S5 — board carries `.desk-frame-stage--board` too (an
//      intentionally-empty hook, like the prose/screenplay pairing already
//      is for the sliver anchor below): BoardEditor sizes its own canvas
//      inline, wider than prose's measure.
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
  // AB4 S5 — 'board' joins prose/screenplay: BoardEditor.tsx finally
  // declares its own kind instead of the standing `pageKind="prose"`
  // placeholder a prior ticket flagged. The stage measure class this drives
  // (`.desk-frame-stage--board`, index.css) is an intentionally-empty hook
  // like the prose/screenplay ones below it — Board manages its own width
  // inline (`min(100%, 1100px)`, wider than prose's 60ch measure) rather
  // than through `.mode-pagecol`, so no board-specific stage CSS is needed;
  // the hook exists so every pageKind has a matching modifier class, not
  // because one does anything yet.
  pageKind: 'prose' | 'screenplay' | 'board';
  // CD1 S1 — the mode strip RETIRES from this track: it now lives in the
  // host's own top-line header row, above DeskFrame entirely (see
  // PageEditor.tsx/JournalEntry.tsx/ScriptEditor.tsx's own `sprint-nav`
  // composition). DeskFrame no longer accepts or renders one — a caller
  // still wiring `modeStrip` is a compile error, by design (the S1 park
  // sweep is meant to catch every stale call site, not silently no-op).
  // CD2 S1/S5 — the strip track's real content (components/Cascade.tsx's
  // `useCascade().strip`), replacing AB3's Drawer whole — the left drawer
  // RETIRES, not "gets a sibling." Empty/reserved (desk ground) when
  // omitted — Board still passes nothing here (the cascade, like the
  // drawer before it, was never wired into BoardEditor; AB4/the Wall stays
  // out of this ticket's scope).
  strip?: ReactNode;
  // CD2 S2 — the cascade's layers 2-3 (the reach panel + the survey),
  // `useCascade().layers`. Rendered as an ABSOLUTELY POSITIONED overlay
  // inside `.desk-frame-stage` (see `.desk-frame-cascade-anchor` in
  // index.css) — never a grid/flex track, so the paper's rect is
  // structurally immune to it regardless of open/closed/docked state, the
  // same hard geometry law `sliver` below already proves out. Grows
  // RIGHTWARD from the strip (left-anchored) where `sliver` grows LEFTWARD
  // from the paper (right-anchored) — the two overlays share the same
  // margin band between the strip and the paper and may transiently cross
  // (S2's own "grip-zone" allowance) without either ever moving
  // `children`'s box.
  cascadeLayers?: ReactNode;
  // CD1 S2 — the sliver: the mode's hand tools + the goal block, riding the
  // paper's left edge. Rendered as an ABSOLUTELY POSITIONED overlay inside
  // `.desk-frame-stage` (see `.desk-frame-sliver-anchor` in index.css) —
  // never a grid/flex track, so the paper's rect is structurally immune to
  // it regardless of open/closed/dissolved state (S2's hard geometry law).
  sliver?: ReactNode;
  // TU1 S2 — the Tutor: the sliver, mirrored, riding the paper's RIGHT
  // edge (see `.desk-frame-tutor-anchor` in index.css — the FX2 clamp
  // technique mirrored via `right:` instead of `left:`). Same overlay
  // discipline as `sliver`: absolutely positioned inside `.desk-frame-stage`,
  // so the paper's rect is structurally immune to it regardless of
  // open/closed/docked state. TU2 S4 — Board now mounts this too
  // (BoardEditor.tsx): the sentence this comment used to carry here ("Board
  // never mounts this... only the three prose/screenplay hosts named in the
  // brief do") is now false and superseded — the `--board` anchor
  // overrides index.css added (mirroring `.desk-frame-sliver-anchor--
  // board`'s own precedent) are what makes this safe; DeskFrame itself
  // needed no change; it already rendered `{tutor}` bare regardless of
  // `pageKind`.
  tutor?: ReactNode;
  // CD1 S6 — the goal's warm glow, behind the paper. Same overlay
  // discipline as `sliver` (absolutely positioned, paper rect untouched),
  // centered instead of left-anchored.
  goalGlow?: ReactNode;
  // M2 S2 — the Rhizome's own ambient growth layer (components/
  // RhizomeField.tsx). SAME overlay discipline as `goalGlow` (absolutely
  // positioned inside `.desk-frame-stage`, paper rect structurally
  // untouched regardless of state) — but sized to the STAGE's own full box
  // (`.desk-frame-rhizome-anchor`, index.css), not clamped to the paper's
  // own canonical width the way `.desk-frame-goalglow-anchor` is, since the
  // growth is meant to wander the margin AROUND the paper, never just glow
  // behind it. Rendered immediately after `goalGlow` (same DOM-order-first,
  // z-index:-1 discipline FX4 S2's `isolation:isolate` fix already proved
  // out for that layer) so both ambient layers paint behind the in-flow
  // paper without needing a second stacking-context fix of their own.
  rhizome?: ReactNode;
  // CD1 S5 — the corkboard track adopts the FX1 S5 law ("render only with
  // content"): omitted (as every CD1 caller does — nothing passes content
  // yet) means the whole track — including its grid column — disappears,
  // not just its children. AB4's Wall is this prop's first real tenant.
  corkboard?: ReactNode;
  // no caller passes `meter`: the empty track is not drawn; the incentive layer returns through this prop if it returns here [DeskFrame §1]
  meter?: ReactNode;
  dissolved?: boolean;
  children: ReactNode;
}

// DeskFrame runs no dissolve engine of its own: the host's useChromeDissolve writes --fade-dur on an ancestor, and the strip and corkboard carry `chrome-fade desk-dissolve` like every other receding track [DeskFrame §2]
export function DeskFrame({ pageKind, strip, cascadeLayers, sliver, tutor, goalGlow, rhizome, corkboard, meter, dissolved, children }: DeskFrameProps) {
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

  // the prose page's scale from the window and its stage, never a panel (store/pageScale.ts): it lays out at scale 1 and is painted at k by a transform, so line breaks never move; measured on resize in a layout effect, never a container query [DeskFrame §3]
  const stageRef = useRef<HTMLDivElement>(null);
  const hands = useStandingHands();   // #138: an open Front or Back menu takes its room from the page, never from over it
  const yielded = useRef('');
  // a menu that closes because she typed (the Back menu's vanishing law) must not resize the page under her keys: the size holds until the pointer moves or a menu opens
  const held = useRef(false);
  const typed = useRef(0);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (pageKind !== 'prose' || !stage) return;
    const apply = () => {
      const s = stage.getBoundingClientRect();
      const page = stage.querySelector<HTMLElement>('.mode-page');
      const col = page?.parentElement;
      const top = page && col ? col.getBoundingClientRect().top - s.top + page.offsetTop : 0;
      const kRest = pageScaleFor(s.width, s.height, top, window.innerWidth);
      // the strip is fixed at the window's left and stands over the stage's edge: the zoomed page keeps clear of it (pageScale.ts ZOOM_CLEAR)
      const strip = rootRef.current?.querySelector<HTMLElement>('.desk-frame-strip')?.getBoundingClientRect();
      const inset = strip && strip.width > 0 ? strip.right - s.left : 0;
      // #138: with a menu open the page yields from that side only (pageScale.ts pageYieldFor); the zoom hides the openers, so it never yields there
      let k = kRest, shift = 0, frontRoom: number | null = null;
      const small = onePanelAt(window.innerWidth);
      const zoomed = !!stage.querySelector('.mode-pagecol[data-zoom="true"]');
      const open = !zoomed && (hands.tools || hands.tutor);
      if (open || zoomed) held.current = false;
      else if (yielded.current.trim().split(' ').length > 2 && performance.now() - typed.current < 400) held.current = true;
      if (held.current) return;
      if (open && col) {
        const cr = col.getBoundingClientRect();
        const centre = cr.left + cr.width / 2;
        const ck = chromeK();
        const root = document.documentElement;
        const railRight = strip && strip.width > 0 ? Math.max(strip.right, s.left) : s.left;
        // each menu with its 16 px tab. At 1600 and narrower: the Front menu's own width (Arbor 264, others 184, by the chrome scale), the Back menu's 320.
        // Wider, the menus already fit beside the page (they narrow down to DRAWER_MIN there), so the page keeps its size
        const frontW = small ? (root.hasAttribute('data-arbor2') ? 264 : 184 * ck) : DRAWER_MIN;
        const backW = small ? 320 * ck : DRAWER_MIN;
        const y = pageYieldFor(centre, kRest, hands.tools ? railRight + frontW + 16 : null, hands.tutor ? s.right - backW - 16 : null);
        k = y.k; shift = y.shift;
        if (hands.tools && small) frontRoom = Math.floor(centre + shift - (PAGE_W_BASE * k) / 2 - railRight - 16);
      }
      stage.style.setProperty('--wz-k', k.toFixed(4));
      stage.style.setProperty('--wz-page-shift', `${shift.toFixed(2)}px`);
      const half = (PAGE_W_BASE * k) / 2;
      if (open) { stage.style.setProperty('--wz-page-half-l', `${(half - shift).toFixed(2)}px`); stage.style.setProperty('--wz-page-half-r', `${(half + shift).toFixed(2)}px`); }
      else { stage.style.removeProperty('--wz-page-half-l'); stage.style.removeProperty('--wz-page-half-r'); }
      if (frontRoom != null) stage.style.setProperty('--wz-front-yield', `${frontRoom}px`); else stage.style.removeProperty('--wz-front-yield');
      const sides = open ? [hands.tools && frontRoom != null ? 'l' : '', hands.tutor ? 'r' : ''].filter(Boolean).join(' ') : '';
      if (sides) stage.setAttribute('data-yield', sides); else stage.removeAttribute('data-yield');
      const fit = fitScaleFor(s.width, s.height, top);
      stage.style.setProperty('--wz-zoom', zoomFor(s.width, kRest, inset, fit).toFixed(4));
      // the zoomed sheet stays today's: its layout height is the letter fit's, so painted it is as tall as before the page grew (#133)
      stage.style.setProperty('--wz-page-hl-zoom', `${pageLayoutHeightFor(s.height, top, fit).toFixed(2)}px`);
      stage.style.setProperty('--wz-page-hl', `${pageLayoutHeightFor(s.height, top, k).toFixed(2)}px`);
      // where the painted page ends, from the stage's top: the page's drawers stop there, never running past the paper [DeskFrame §4]
      stage.style.setProperty('--wz-page-foot', `${(top + pageLayoutHeightFor(s.height, top, k) * k).toFixed(2)}px`);
      // a painted size change fires no observer: what measured the old edges (the drawers, the readouts) is told once
      const key = `${k.toFixed(4)} ${shift.toFixed(2)} ${sides}`;
      if (key !== yielded.current) { yielded.current = key; document.dispatchEvent(new Event('wz-board-moved')); window.dispatchEvent(new Event('resize')); }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(stage);
    const onType = (e: KeyboardEvent) => { if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') typed.current = performance.now(); };
    const release = () => { typed.current = 0; if (!held.current) return; held.current = false; apply(); };   // her pointer ends the typing's claim
    document.addEventListener('keydown', onType, true);
    document.addEventListener('pointermove', release, true);
    document.addEventListener('pointerdown', release, true);
    // the window's width is part of the law, and a stage may keep its size while the window changes
    window.addEventListener('resize', apply);
    document.addEventListener('wz-zoom-changed', apply);
    return () => { ro.disconnect(); window.removeEventListener('resize', apply); document.removeEventListener('wz-zoom-changed', apply); document.removeEventListener('keydown', onType, true); document.removeEventListener('pointermove', release, true); document.removeEventListener('pointerdown', release, true); };
  }, [pageKind, hands.tools, hands.tutor]);

  return (
    <div ref={rootRef} className="desk-frame" data-writing={dissolved ? 'true' : 'false'}>
      <div className="desk-frame-grid" data-corkboard={hasCorkboard ? 'true' : 'false'}>
        {/* FX10 S2 — the strip is chrome, and chrome vanishes: it now
            carries the same `chrome-fade desk-dissolve` pair every other
            dissolving DeskFrame track carries (see this file's own header
            comment for the root-cause diagnosis and CD2 S1's superseded
            "never dissolving" law). */}
        <aside className="desk-frame-strip chrome-fade desk-dissolve" aria-label={t('zoneStrip')}>
          {strip}
        </aside>
        <div className="desk-frame-stagecol">
          <div ref={stageRef} className={`desk-frame-stage desk-frame-stage--${pageKind}`}>
            {/* CD1 S6 — the glow sits behind the paper (DOM order first,
                negative z-index — see index.css); centered on the SAME
                canonical paper width the sliver anchors against. */}
            {goalGlow && <div className={`desk-frame-goalglow-anchor desk-frame-goalglow-anchor--${pageKind}`}>{goalGlow}</div>}
            {/* M2 S2 — the Rhizome's own growth layer; see the `rhizome`
                prop's own comment above for why its anchor spans the
                stage's full box rather than the paper's own width. */}
            {rhizome && <div className="desk-frame-rhizome-anchor">{rhizome}</div>}
            {/* CD2 S2 — the cascade's panel+survey overlay the stage margin,
                left-anchored to the strip's own edge (growing rightward,
                toward the paper — the mirror image of the sliver's own
                rightward-to-leftward anchor below). Absolutely positioned:
                structurally cannot move `children`'s box below. */}
            {cascadeLayers && <div className="desk-frame-cascade-anchor">{cascadeLayers}</div>}
            {/* CD1 S2 — the sliver overlays the stage margin, left-anchored
                to the paper's own canonical width. Absolutely positioned:
                structurally cannot move `children`'s box below. */}
            {sliver && <div className={`desk-frame-sliver-anchor desk-frame-sliver-anchor--${pageKind}`}>{sliver}</div>}
            {/* TU1 S2 — the Tutor's own overlay. Rendered BARE (no wrapping
                anchor div here, unlike sliver/cascade/goalGlow above):
                Tutor.tsx owns TWO of its own sibling anchors internally (the
                grip's FX2-clamped one, and the panel's own stage-right-edge-
                safe one — see that file's own header comment for why one
                anchor can't serve both jobs without either clipping the
                open panel or letting the persistent grip breach the paper).
                Both must be DIRECT children of this stage (position:relative)
                for their own `position:absolute` math to resolve against
                the correct 100%-of-stage reference box — an intervening
                wrapper div here would break that. */}
            {tutor}
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

// the corkboard track is empty and reserved; the capture items live at components/Sliver.tsx (CAPTURE_ITEMS) [DeskFrame §5]

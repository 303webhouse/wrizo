import { useState, useEffect, useRef, type MutableRefObject } from 'react';
import { type BoardView } from '../../store/boardKind';

export function useBoardMeasure({ wrapRef, boardMode }: {
  wrapRef: MutableRefObject<HTMLDivElement | null>;
  boardMode: BoardView;
}) {
  // Measure the WRAP's own natural available width (unchanged mechanism) —
  // this feeds pageWidthPx only when the writer has never dragged the
  // canvas resize handle (canvasOverrideW is null), preserving pre-FX4
  // auto-fit behavior exactly. Once overridden, pageWidthPx comes from the
  // persisted override instead (below), and the wrap's own `overflow:auto`
  // (unchanged CSS) scrolls to it like any content wider than its box.
  const [containerWidthPx, setContainerWidthPx] = useState(700);
  // BUG 32e - 700 is only the first render's placeholder: the reflow below waits until the wrap has really been measured (widthMeasured), because a pass at the placeholder width wraps every card in a
  // narrower page and GROWS its h to match - a height that then sticks (grow-only) once the true width arrives. Whether such a pass ran used to depend on load timing (check F of reflow-open).
  const [widthMeasured, setWidthMeasured] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // while a drawer narrows the board, the canvas keeps the width the board has with the drawers shut, so no card shrinks or moves - the board scrolls instead [BoardEditor §27]
    const measure = () => {
      const area = el.closest('.board-area') as HTMLElement | null; const stage = el.closest('.desk-frame-stage') as HTMLElement | null;
      const chrome = el.offsetWidth - el.clientWidth;
      const natural = area && stage ? Math.min(stage.clientWidth, 1100) - chrome : el.clientWidth;
      setContainerWidthPx(Math.max(320, area && stage ? Math.max(el.clientWidth, natural) : el.clientWidth));
      setWidthMeasured(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [boardMode === 'open']);   // W1: the wrap exists only while the board is shown Open - a board that mounts in the Walk (a Deck) or was shown another way must measure when Open arrives (it came back 700 px wide and never re-measured)
  // FX13 S2 (the board fits the room) — the WRAP's height is the DeskFrame
  // stage's ACTUAL available height, not a magic viewport ratio. The old
  // `maxHeight: 78vh` was the width-only-geometry law showing through: a fixed
  // fraction of the viewport that ignored the room the flex stage
  // (`.desk-frame-stage`, `flex:1; min-height:0`) actually leaves after the
  // board's own chrome, so on a short viewport (the 1366x768 leg) the wrap
  // overflowed the stage (measured: wrap bottom past the stage bottom below
  // ~700px) and left a page overflow at 768. Filling to the stage's own bottom
  // keeps every piece of the board's chrome in the room and reserves scrolling
  // for the CONTENT (the canvas) alone — the height floor the law was missing.
  // Legacy (<1100, no DeskFrame): stage is null, the 78vh fallback is kept, so
  // that path stays byte-identical.
  const [availHeightPx, setAvailHeightPx] = useState<number | null>(null);
  const lastAvailRef = useRef<number | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const stage = el.closest('.desk-frame-stage');
    if (!stage) { setAvailHeightPx(null); return; }
    let raf = 0;
    const apply = () => {
      raf = 0;
      // Never collapse: a very short viewport gets a small wrap that scrolls its
      // content, never a fall-back to the width-only 78vh.
      const avail = Math.max(160, Math.round(stage.getBoundingClientRect().bottom - el.getBoundingClientRect().top - 2));
      // THRASH GUARD (the deskFrameActive race lineage): the ResizeObserver
      // watches the STAGE, never the wrap, and the stage is `flex:1;
      // min-height:0` — its height is fixed by the flex column, NOT by the
      // wrap's content — so the wrap's own height can never feed back into it.
      // Committing only when the room actually MOVED (>1px) makes a feedback
      // loop impossible by construction (once stable, setState never fires
      // again) and swallows sub-pixel jitter from a mid-transition measure.
      if (lastAvailRef.current === null || Math.abs(avail - lastAvailRef.current) > 1) {
        lastAvailRef.current = avail;
        setAvailHeightPx(avail);
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply(); // initial synchronous measure (post-layout, in an effect)
    const ro = new ResizeObserver(schedule);
    ro.observe(stage);
    window.addEventListener('resize', schedule);
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('resize', schedule); };
  }, [boardMode === 'open']);   // W1: as the width measure above - re-attach when the wrap (re)mounts
  return { containerWidthPx, widthMeasured, availHeightPx };
}

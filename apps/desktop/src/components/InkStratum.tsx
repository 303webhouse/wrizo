import { useEffect, useRef, useState } from 'react';
import { ERASER_WIDTH, inkColor, renderStroke } from '../store/ink';
import type { Stroke, StrokeInk, StrokeNib, StrokePoint, StrokeTip } from '../types';

// ITEM 121 I2 — THE INK STRATUM. The Journal's J-series drawing layer
// (JournalEntry.tsx's own capture pipeline) ported onto the framed Free Write
// page, under R15's analog law: the page is a typewriter for text and a
// journal page / sketch pad for drawing, and this is the second half made
// real. Everything about HOW a stroke is captured, painted, erased, undone and
// persisted is the Journal's, unchanged in kind; what is new is that the page
// has a MODE, and this layer is inert unless the page says INK.
//
// ── THE SHEET, AND WHY IT IS NOT THE PAPER COLUMN ─────────────────────────
// The build brief said to mount at `inset:0` on the paper column. That was
// written from the Journal's geometry, where the sheet (`.entry-full`) GROWS
// with its text and the window scrolls, so `inset:0` genuinely covers the
// whole sheet forever. Free Write's paper is not shaped that way: `.mode-page`
// is a FIXED-HEIGHT box (`height:min(60vh,580px)`, `overflow:hidden`) with an
// inner scroller, `.mode-scroll`. A canvas at `inset:0` on the column or the
// page would cover only what is on screen — the writer would scroll, the text
// would move, and the ink would stay nailed to the viewport, so ink drawn
// beside a sentence on screen two would land on top of screen one's ink. That
// is not J9's sheet-anchoring tradeoff; it is a different and worse anchoring
// that no ruling asked for.
//
// So the SHEET here is the scroller's own content wrapper (PageEditor's
// `editorBody` wrap — already `position:relative`, already full-width, already
// growing with the editor), and this layer mounts as its absolutely positioned
// children at `inset:0`. The canvas fills the sheet BY LAYOUT, never by
// script — the anchor law holds, aimed at the right box — and the ink scrolls
// with the text as one sheet, which is what "a transparent sheet laid on the
// page" actually means. See docs/menus/item121-s0-survey.md §3.
//
// ── THE SHEET-ANCHORING TRADEOFF, PORTED KNOWINGLY (J9's own words) ───────
// "Ink anchors to the sheet, not to words — text reflows at another width, ink
// stays where it was drawn." That is inherited deliberately, not overlooked.
// Points are normalized 0..1 BY THE SHEET'S WIDTH and denormalized by the
// current width on BOTH axes (a circle stays a circle); `y` is unbounded above
// 1.0 because a long page is a tall sheet. Word-anchored ink would be a
// different feature and a different ruling.
//
// ── ROUTING LIVES ON THE SHEET, NOT THE CANVAS ────────────────────────────
// Both canvases are ALWAYS `pointer-events:none`, exactly as in the Journal.
// "In INK the layer intercepts everything on the paper" is a mode gate inside
// the sheet's own capture-phase listeners, NOT a `pointer-events` flip: the
// eraser's rubbing model paints onto the committed canvas mid-stroke and the
// hover ring reads positions continuously, and both break the moment a canvas
// starts swallowing events. In TEXT no listener is attached at all, so the
// surface is byte-identical to the page before this ticket.

export interface InkPen {
  tip: StrokeTip;
  nib: StrokeNib;
  ink: StrokeInk;
}

interface Props {
  /** INK mode. False → nothing is attached and the layer is inert. */
  active: boolean;
  /** The relatively-positioned sheet these layers fill by layout. */
  sheetRef: React.RefObject<HTMLElement>;
  strokes: Stroke[];
  /** Persist. The HOST merges live text, so a pending typed run is never lost. */
  onCommit: (next: Stroke[]) => void;
  /** The drawer's current pen — stamped onto every new stroke (I1/I4). */
  pen: InkPen;
  eraserArmed: boolean;
}

// Size a canvas's backing store to its CSS box scaled by devicePixelRatio so
// strokes are crisp on HiDPI, and scale the context so callers draw in CSS px.
// Ported verbatim from JournalEntry.tsx's own syncCanvas.
function syncCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Paint all committed strokes. Denormalizes by the sheet's current width, so a
// page drawn at one width keeps its ink in place when the text reflows at
// another. Called on mount, on every stroke-set change, and from the
// ResizeObserver — existing strokes re-render correctly at any new size.
export function paintCommitted(canvas: HTMLCanvasElement | null, sheet: HTMLElement | null, strokes: Stroke[]): void {
  if (!canvas || !sheet) return;
  const rect = sheet.getBoundingClientRect();
  const ctx = syncCanvas(canvas, rect.width, rect.height);
  if (!ctx) return;
  ctx.clearRect(0, 0, rect.width, rect.height);
  const color = inkColor();
  for (const s of strokes) renderStroke(ctx, s, rect.width, color);
}

export function InkStratum({ active, sheetRef, strokes, onCommit, pen, eraserArmed }: Props) {
  const committedRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef<HTMLCanvasElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<Stroke[]>(strokes);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const captureRectRef = useRef<DOMRect | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  // Refs the once-per-`active` listener effect reads, so it never needs to
  // re-attach when the pen or the eraser changes (the Journal's own pattern —
  // a re-attach mid-stroke would drop the in-flight pointer capture).
  const penRef = useRef(pen);
  penRef.current = pen;
  const eraserArmedRef = useRef(eraserArmed);
  eraserArmedRef.current = eraserArmed;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // §4 of the ink pass — "finger scrolls the page ONLY when a pen is present."
  // There is no way to ask a browser whether a stylus is attached, so presence
  // is LEARNED: once this session has seen a real pen event, touch stops
  // drawing and goes back to scrolling. Before that, on a pen-less tablet, a
  // finger draws — which is the honest reading of "in INK any pointer draws."
  // Session-scoped by construction (a ref, not storage), like J2's pen re-arm.
  const penSeenRef = useRef(false);

  // Repaint committed ink whenever the stroke set changes. Nothing animates —
  // this is a static repaint, so `prefers-reduced-motion` needs no branch.
  useEffect(() => {
    strokesRef.current = strokes;
    paintCommitted(committedRef.current, sheetRef.current, strokes);
  }, [strokes, sheetRef]);

  // Keep ink positioned when the sheet's width OR height changes (as the text
  // grows the sheet, existing strokes re-render at the new size). Runs in BOTH
  // modes: ink drawn in INK must stay put while the writer types in TEXT.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => paintCommitted(committedRef.current, sheetRef.current, strokesRef.current));
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [sheetRef]);

  // Hide the ring immediately on disarm or on leaving INK (not just on the
  // next pointermove) — J2's own rule.
  useEffect(() => {
    if ((!eraserArmed || !active) && ringRef.current) ringRef.current.style.display = 'none';
  }, [eraserArmed, active]);

  // ── CAPTURE ───────────────────────────────────────────────────────────────
  // Attached ONLY in INK. In TEXT this effect returns before adding anything,
  // so a Free Write page in TEXT behaves exactly as it did before item 121 —
  // including keeping ForwardOnlyEditor's I0 pen seal fully in force.
  //
  // In INK the listeners are capture-phase and non-passive on the SHEET (an
  // ANCESTOR of the editor). Capture runs root→target, so this fires BEFORE
  // ForwardOnlyEditor's own capture-phase `neutralizePen`, and stopPropagation
  // means that seal simply never runs while the page is inking. That is why
  // opening the seal needed no edit to ForwardOnlyEditor at all: nothing about
  // its behaviour changes, it just stops being reached on this one surface in
  // this one mode. R15 is the ruling that narrowed "ink is sealed in the
  // Journal" — see that file's own I0 comment, amended in place to say so.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!active || !sheet) return;

    const normPoint = (e: PointerEvent): StrokePoint => {
      const rect = captureRectRef.current ?? sheet.getBoundingClientRect();
      const w = rect.width || 1;
      // Normalized by WIDTH on both axes (J8) — the same scale, so a circle
      // stays a circle. y may exceed 1.0 on a page taller than it is wide.
      const point: StrokePoint = { x: (e.clientX - rect.left) / w, y: (e.clientY - rect.top) / w };
      // Pressure is captured, as it always has been, and deliberately NOT read
      // by the renderer this wave (item 121 I5 ships pressure-blind; pressure
      // rides a later slice). Capturing it now means that slice has data.
      if (e.pressure > 0) point.p = Math.round(e.pressure * 1000) / 1000;
      return point;
    };

    // THE POINTER CONTRACT, decided by the INSTRUMENT and not the device
    // (ink pass §0.2). The Journal asks "is this a pen?"; the page asks "am I
    // a sketch pad?" — and if it is, the pointer draws. Pen first; mouse and
    // trackpad draw because the laptop is the primary target and a surface
    // the primary target cannot draw on is not a sketch pad. Touch draws too
    // UNLESS a pen has been seen this session, in which case the finger goes
    // back to being a scroll (and a resting palm registers as touch, so it is
    // rejected for free — J9's own accident, inherited).
    const draws = (e: PointerEvent): boolean => {
      if (e.pointerType === 'pen') { penSeenRef.current = true; return true; }
      if (e.pointerType === 'touch') return !penSeenRef.current;
      return true; // mouse, trackpad, anything else the platform reports
    };

    // J2 — "rubbing, not stamping": committed and active are separate canvases,
    // so painting destination-out onto the empty, per-frame-cleared active
    // canvas would erase nothing visible. An in-progress erase instead paints
    // straight onto the COMMITTED canvas each move (no clear — destination-out
    // only removes, so redrawing the accumulated path is idempotent); onUp's
    // full repaint reproduces the same result, and onCancel repaints from
    // strokesRef to undo any live rub-out.
    const paintActive = () => {
      const stroke = activeStrokeRef.current;
      const rect = captureRectRef.current;
      if (!stroke || !rect) return;
      if (stroke.eraser) {
        const ctx = committedRef.current?.getContext('2d');
        if (ctx) renderStroke(ctx, stroke, rect.width, inkColor());
        return;
      }
      const canvas = activeRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, rect.width, rect.height);
      // A marker's `multiply` overlap (I5) is only visible against ink already
      // on the COMMITTED canvas; the live preview draws on its own transparent
      // canvas, so the crossing darkens on commit rather than mid-stroke. The
      // Journal's two-canvas split is what buys the flicker-free preview, and
      // that tradeoff is worth one frame of a marker looking slightly light.
      renderStroke(ctx, stroke, rect.width, inkColor());
    };
    const clearActive = () => {
      const canvas = activeRef.current;
      const rect = captureRectRef.current;
      if (!canvas || !rect) return;
      canvas.getContext('2d')?.clearRect(0, 0, rect.width, rect.height);
    };

    const onDown = (e: PointerEvent) => {
      if (!draws(e)) return; // falls through to the page — finger scroll
      // The on-sheet ink controls (undo) are real buttons; a press on one is
      // not a stroke. Same guard the Journal carries for its own.
      if ((e.target as Element | null)?.closest?.('.ink-undo')) return;
      // Keep the pointer off the editable text node entirely: no caret, no
      // selection, and — with the capture-phase intercept firing first — no OS
      // handwriting-to-text, which is the whole point of I0's hardening.
      e.stopPropagation();
      // I0 slice-2 hardening (Samsung S25 / Chrome S-Pen), ported whole. The
      // OS recognizer watches the FOCUSED editable and is largely independent
      // of touch-action and JS defaults, so for the duration of a stroke the
      // editable is made a NON-target: blurred, so there is nowhere to insert.
      // Restored on lift; the writer taps to resume typing.
      const edit = sheet.querySelector<HTMLElement>('.forward-only-editor');
      if (edit) { try { edit.blur(); } catch { /* */ } }
      // A short stroke over existing text was starting a TEXT SELECTION (which
      // yanks the writer out of drawing). Clear any live selection and forbid
      // selection on the sheet for the stroke's duration; restored on lift.
      try { window.getSelection()?.removeAllRanges(); } catch { /* */ }
      sheet.style.setProperty('user-select', 'none');
      sheet.style.setProperty('-webkit-user-select', 'none');
      captureRectRef.current = sheet.getBoundingClientRect();
      const ac = activeRef.current;
      if (ac) syncCanvas(ac, captureRectRef.current.width, captureRectRef.current.height);
      drawingRef.current = true;
      // J2 — the toggle is the guaranteed path; the hardware eraser tip is a
      // bonus signal on top of it. Per the Pointer Events spec the eraser end
      // reports pointerType 'pen' with the eraser-button bit (32) set in
      // `buttons`. The barrel button is NOT read here: it stays
      // hardware-reserved by ruling, an open word this wave does not spend.
      const hwErase = (e.buttons & 32) !== 0;
      const p = penRef.current;
      const stroke: Stroke = { points: [normPoint(e)] };
      if (eraserArmedRef.current || hwErase) {
        // An eraser carries no tip, nib or ink — J2's geometry is the whole of
        // it, and the eraser is tip-agnostic AS BUILT (the pencil-only reading
        // is an open word for Nick; deliberately not built).
        stroke.eraser = true;
      } else {
        stroke.tip = p.tip;
        stroke.nib = p.nib;
        stroke.ink = p.ink;
      }
      activeStrokeRef.current = stroke;
      try { sheet.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ }
      e.preventDefault();
      paintActive();
    };

    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      activeStrokeRef.current?.points.push(normPoint(e));
      paintActive();
    };

    const restoreSheet = () => {
      sheet.style.removeProperty('user-select');
      sheet.style.removeProperty('-webkit-user-select');
    };

    const onUp = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      drawingRef.current = false;
      restoreSheet();
      const stroke = activeStrokeRef.current;
      activeStrokeRef.current = null;
      try { sheet.releasePointerCapture(e.pointerId); } catch { /* */ }
      if (stroke && stroke.points.length > 0) {
        const next = [...strokesRef.current, stroke];
        strokesRef.current = next;
        paintCommitted(committedRef.current, sheet, next); // paint now — no 1-frame gap
        clearActive();
        setCanUndo(true);
        onCommitRef.current(next);
      } else {
        clearActive();
      }
    };

    const onCancel = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      restoreSheet();
      const wasErasing = activeStrokeRef.current?.eraser;
      activeStrokeRef.current = null;
      try { sheet.releasePointerCapture(e.pointerId); } catch { /* */ }
      clearActive();
      // J2 — a cancelled erase already rubbed pixels straight onto the
      // committed canvas with no matching entry in strokesRef; repaint from
      // the authoritative array to undo the stray in-progress rub-out.
      if (wasErasing) paintCommitted(committedRef.current, sheet, strokesRef.current);
    };

    // J2 — ring preview: a quiet ERASER_WIDTH-diameter ring follows the pointer
    // while the eraser is armed, so aim is possible before touching down.
    // Render-only: bubble-phase, PASSIVE, never intercepts input or changes
    // capture behaviour; positioned imperatively (not React state) so a
    // pointermove never costs a render.
    const onHover = (e: PointerEvent) => {
      const ring = ringRef.current;
      if (!ring) return;
      if (!eraserArmedRef.current) { ring.style.display = 'none'; return; }
      const rect = sheet.getBoundingClientRect();
      ring.style.display = 'block';
      ring.style.left = `${e.clientX - rect.left}px`;
      ring.style.top = `${e.clientY - rect.top}px`;
    };
    const onLeave = () => { const ring = ringRef.current; if (ring) ring.style.display = 'none'; };

    const opts = { passive: false, capture: true } as const;
    sheet.addEventListener('pointerdown', onDown, opts);
    sheet.addEventListener('pointermove', onMove, opts);
    sheet.addEventListener('pointerup', onUp, opts);
    sheet.addEventListener('pointercancel', onCancel, opts);
    const hoverOpts = { passive: true } as const;
    sheet.addEventListener('pointermove', onHover, hoverOpts);
    sheet.addEventListener('pointerleave', onLeave, hoverOpts);
    return () => {
      sheet.removeEventListener('pointerdown', onDown, opts);
      sheet.removeEventListener('pointermove', onMove, opts);
      sheet.removeEventListener('pointerup', onUp, opts);
      sheet.removeEventListener('pointercancel', onCancel, opts);
      sheet.removeEventListener('pointermove', onHover);
      sheet.removeEventListener('pointerleave', onLeave);
      // Leaving INK mid-stroke must not leave the sheet unselectable.
      drawingRef.current = false;
      activeStrokeRef.current = null;
      sheet.style.removeProperty('user-select');
      sheet.style.removeProperty('-webkit-user-select');
    };
  }, [active, sheetRef]);

  // ── UNDO ─────────────────────────────────────────────────────────────────
  // One level, the last STROKE only. The Journal's undo is unified across a
  // typed run and a stroke because the Journal's own editable records typed
  // runs; Free Write's does not, and must not — it is FORWARD-ONLY, and the
  // undo/redo stack ForwardOnlyEditor carries (FX6 S1) is gated to the
  // free-edit modes (Draft, Revise) by that law. Inventing a typed-run undo
  // here to satisfy "unified" would breach forward-only permanence, which is a
  // far older ruling than this wave. So: the pen gets an undo, the typewriter
  // keeps its permanence, and the affordance lives with the ink — visible in
  // INK only. Typing does not consume it, because typing is not undoable here.
  const undo = () => {
    const next = strokesRef.current.slice(0, -1);
    strokesRef.current = next;
    paintCommitted(committedRef.current, sheetRef.current, next);
    setCanUndo(false);
    onCommitRef.current(next);
  };

  return (
    <>
      {/* Both canvases fill the sheet BY LAYOUT (inset:0 on a relatively
          positioned parent) and NEVER intercept input — routing is the
          sheet's job, above. `aria-hidden` because ink is not text; the
          page's words remain the accessible content either way. */}
      <canvas
        ref={committedRef}
        className="ink-canvas ink-committed wz-ink-stratum"
        aria-hidden="true"
        data-ink-active={active ? 'true' : 'false'}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <canvas
        ref={activeRef}
        className="ink-canvas ink-active"
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {/* J2 — the eraser's ring preview. Hidden by default; shown and
          positioned imperatively (onHover) so it never triggers a render. */}
      <div
        ref={ringRef}
        className="ink-eraser-ring"
        aria-hidden="true"
        style={{
          position: 'absolute', display: 'none', width: ERASER_WIDTH, height: ERASER_WIDTH,
          marginLeft: -ERASER_WIDTH / 2, marginTop: -ERASER_WIDTH / 2, borderRadius: '50%',
          border: '1.5px solid var(--ink-on-paper-low)', pointerEvents: 'none',
        }}
      />
      {active && canUndo && (
        <button
          type="button"
          className="btn-quiet ink-undo"
          onClick={undo}
          aria-label="Undo the last stroke"
          title="Undo the last stroke"
          style={{
            position: 'absolute', top: 4, right: 4, lineHeight: 1, fontSize: 16,
            color: 'var(--ink-on-paper-low)', background: 'transparent', border: 'none',
            cursor: 'pointer', padding: 4, pointerEvents: 'auto',
          }}
        >
          ↺
        </button>
      )}
    </>
  );
}

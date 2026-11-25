import type { MutableRefObject } from 'react';
import { inkColor, renderStroke } from '../../store/ink';
import type { Stroke, StrokePoint } from '../../types';
import { inkOriginY, paintCommitted, syncCanvas, type InkPen } from '../InkStratum';

// VISUAL 1a.1 - THE INPUT THAT MAKES STROKES, moved here verbatim from InkStratum's `edit` effect so it is fetched on the first INK open and never before. InkStratum attaches it
// while its permission is `edit`; everything it touches is handed in, and the returned function detaches every listener.

export interface CaptureHost {
  sheet: HTMLElement;
  committedRef: MutableRefObject<HTMLCanvasElement | null>;
  activeRef: MutableRefObject<HTMLCanvasElement | null>;
  ringRef: MutableRefObject<HTMLDivElement | null>;
  strokesRef: MutableRefObject<Stroke[]>;
  activeStrokeRef: MutableRefObject<Stroke | null>;
  drawingRef: MutableRefObject<boolean>;
  captureRectRef: MutableRefObject<DOMRect | null>;
  penSeenRef: MutableRefObject<boolean>;
  undoSnapshotRef: MutableRefObject<Stroke[] | null>;
  penRef: MutableRefObject<InkPen>;
  eraserArmedRef: MutableRefObject<boolean>;
  onCommitRef: MutableRefObject<(next: Stroke[]) => void>;
  setCanUndo: (v: boolean) => void;
}

export function attachCapture(h: CaptureHost): () => void {
  const { sheet, committedRef, activeRef, ringRef, strokesRef, activeStrokeRef, drawingRef, captureRectRef, penSeenRef, undoSnapshotRef, penRef, eraserArmedRef, onCommitRef, setCanUndo } = h;

  // The pointer that started the current stroke, or -1. Per-attach state in a
  // closure, because the listeners below are attached once per permission.
  let activeId = -1;

  const normPoint = (e: PointerEvent): StrokePoint => {
    const rect = captureRectRef.current ?? sheet.getBoundingClientRect();
    const w = rect.width || 1;
    // Normalized by WIDTH on both axes (J8) — the same scale, so a circle
    // stays a circle. y may exceed 1.0 on a page taller than it is wide.
    const point: StrokePoint = { x: (e.clientX - rect.left) / w, y: (e.clientY - rect.top - inkOriginY(sheet, rect)) / w };
    // pressure is captured but not yet read by the renderer, so a later pressure slice has data [InkStratum §7]
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
    const oy = inkOriginY(sheet, rect);   // measured from the text [InkStratum §8]
    if (stroke.eraser) {
      const ctx = committedRef.current?.getContext('2d');
      if (ctx) { ctx.save(); ctx.translate(0, oy); renderStroke(ctx, stroke, rect.width, inkColor()); ctx.restore(); }
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
    ctx.save(); ctx.translate(0, oy); renderStroke(ctx, stroke, rect.width, inkColor()); ctx.restore();
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
    activeId = e.pointerId;   // only THIS pointer may drive or end the stroke
    // the toggle is the guaranteed path; the eraser tip (buttons bit 32) is a bonus; the barrel button is left unread [InkStratum §9]
    const hwErase = (e.buttons & 32) !== 0;
    const p = penRef.current;
    const stroke: Stroke = { points: [normPoint(e)] };
    if (eraserArmedRef.current || hwErase) {
      // an eraser carries no tip, nib or ink: the geometry is the whole of it [InkStratum §10]
      stroke.eraser = true;
    } else {
      stroke.tip = p.tip;
      stroke.nib = p.nib;
      stroke.ink = p.ink;
    }
    activeStrokeRef.current = stroke;
    // best effort only: move and release are heard on window, so a capture that fails or does not reroute can no longer lose a stroke [InkStratum §11]
    try { sheet.setPointerCapture(e.pointerId); } catch { /* best effort */ }
    e.preventDefault();
    paintActive();
  };

  const onMove = (e: PointerEvent) => {
    if (!drawingRef.current || e.pointerId !== activeId) return;
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
    if (!drawingRef.current || e.pointerId !== activeId) return;
    e.preventDefault();
    e.stopPropagation();
    drawingRef.current = false;
    activeId = -1;
    restoreSheet();
    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = null;
    try { sheet.releasePointerCapture(e.pointerId); } catch { /* */ }
    if (stroke && stroke.points.length > 0) {
      const before = strokesRef.current;
      const next = [...before, stroke];
      undoSnapshotRef.current = before;   // one level: the array as it stood
      strokesRef.current = next;
      paintCommitted(committedRef.current, sheet, next); // paint now — no 1-frame gap
      clearActive();
      setCanUndo(true);
      onCommitRef.current(next);
    } else {
      clearActive();
    }
  };

  const cancelStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    restoreSheet();
    const wasErasing = activeStrokeRef.current?.eraser;
    activeStrokeRef.current = null;
    try { if (activeId !== -1) sheet.releasePointerCapture(activeId); } catch { /* */ }
    activeId = -1;
    clearActive();
    // J2 — a cancelled erase already rubbed pixels straight onto the
    // committed canvas with no matching entry in strokesRef; repaint from
    // the authoritative array to undo the stray in-progress rub-out.
    if (wasErasing) paintCommitted(committedRef.current, sheet, strokesRef.current);
  };
  const onCancel = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    cancelStroke();
  };
  // A window that loses focus mid-stroke will never deliver the release.
  // Cancel rather than leave a stroke open that the next press would extend.
  const onBlur = () => cancelStroke();

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
    // PAGE-SIZE - the sheet may be PAINTED at a scale (the page's transform); the ring is positioned in the sheet's own LAYOUT px, so the screen
    // distance is divided by that scale (1 on an unscaled sheet - unchanged)
    const sc = sheet.offsetWidth > 0 ? rect.width / sheet.offsetWidth : 1;
    ring.style.left = `${(e.clientX - rect.left) / (sc || 1)}px`;
    ring.style.top = `${(e.clientY - rect.top) / (sc || 1)}px`;
  };
  const onLeave = () => { const ring = ringRef.current; if (ring) ring.style.display = 'none'; };

  // ITEM 126 — WHERE EACH LISTENER LIVES, AND WHY THAT MOVED.
  // The PRESS stays on the sheet: whether a stroke begins is a question about
  // the paper. The MOVE, RELEASE and CANCEL are heard on WINDOW, because a
  // stroke is not over until the writer lets go, and they may let go anywhere.
  // Before this, all four lived on the sheet and relied on pointer capture to
  // reroute a release that landed outside it. MEASURED: a trusted MOUSE stroke
  // ending past the paper's edge got capture, lost it, never delivered its
  // release to the sheet — and the stroke was SILENTLY DISCARDED. That is the
  // laptop, the primary target. Item 121's own mouse leg passed only because
  // it happened to release inside the sheet. Every handler below is guarded by
  // the pointer id, so only the pointer that started a stroke can extend or end
  // it — which a window listener would otherwise not guarantee.
  const opts = { passive: false, capture: true } as const;
  sheet.addEventListener('pointerdown', onDown, opts);
  window.addEventListener('pointermove', onMove, opts);
  window.addEventListener('pointerup', onUp, opts);
  window.addEventListener('pointercancel', onCancel, opts);
  window.addEventListener('blur', onBlur);
  const hoverOpts = { passive: true } as const;
  sheet.addEventListener('pointermove', onHover, hoverOpts);
  sheet.addEventListener('pointerleave', onLeave, hoverOpts);
  return () => {
    sheet.removeEventListener('pointerdown', onDown, opts);
    window.removeEventListener('pointermove', onMove, opts);
    window.removeEventListener('pointerup', onUp, opts);
    window.removeEventListener('pointercancel', onCancel, opts);
    window.removeEventListener('blur', onBlur);
    sheet.removeEventListener('pointermove', onHover);
    sheet.removeEventListener('pointerleave', onLeave);
    // Leaving INK mid-stroke must not leave the sheet unselectable.
    drawingRef.current = false;
    activeStrokeRef.current = null;
    sheet.style.removeProperty('user-select');
    sheet.style.removeProperty('-webkit-user-select');
  };
}

import { useEffect, useRef, useState } from 'react';
import { ERASER_WIDTH, clampDelta, groupBox, inkColor, renderStroke, strokeGroupAt, translateGroup } from '../store/ink';
import type { Stroke, StrokeInk, StrokeNib, StrokePoint, StrokeTip } from '../types';

// the ink stratum renders in every mode; mode decides permission (edit in INK, inert in TEXT, movable in Draft and Revise); the sheet is the scroller's content wrapper, so ink scrolls with the text; routing lives on the sheet, never a pointer-events flip [InkStratum §1]

export interface InkPen {
  tip: StrokeTip;
  nib: StrokeNib;
  ink: StrokeInk;
}

/**
 * ITEM 126 B2 — what the page lets the writer DO to its ink, in this mode.
 * Presence is no longer the variable (the stratum renders in every mode); this
 * is. One value rather than two booleans, because two could express states that
 * do not exist (`editable && locked`) and would drift apart the first time only
 * one of them was updated.
 */
export type InkPermission = 'edit' | 'inert' | 'movable';

interface Props {
  /** What the writer may do to the ink here. See InkPermission. */
  permission: InkPermission;
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

// where the sheet's TEXT starts, in painted px below the sheet's top: 0 with no top padding (so no saved stroke moves); in the zoom a stroke above the first line has a negative y [InkStratum §2]
export function inkOriginY(sheet: HTMLElement, rect?: DOMRect): number {
  const pt = parseFloat(getComputedStyle(sheet).paddingTop) || 0;
  if (!pt) return 0;
  const r = rect ?? sheet.getBoundingClientRect();
  return pt * (sheet.offsetWidth > 0 ? r.width / sheet.offsetWidth : 1);
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
  ctx.save(); ctx.translate(0, inkOriginY(sheet, rect));   // measured from the text [InkStratum §3]
  for (const s of strokes) renderStroke(ctx, s, rect.width, color);
  ctx.restore();
}

export function InkStratum({ permission, sheetRef, strokes, onCommit, pen, eraserArmed }: Props) {
  const committedRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef<HTMLCanvasElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<Stroke[]>(strokes);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const captureRectRef = useRef<DOMRect | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  // ITEM 126 B4 — THE ARMED GROUP. `armed` is state (the outline must re-render
  // with it); `armedRef` mirrors it for the once-per-permission listener effect,
  // the same ref-mirror pattern the pen and eraser already use so the listeners
  // never re-attach mid-gesture.
  const [armed, setArmed] = useState<number[] | null>(null);
  const armedRef = useRef<number[] | null>(null);
  armedRef.current = armed;
  // The live drag delta, in normalized units. A ref, not state: it changes every
  // pointermove and a render per move is exactly the cost J2's ring avoided.
  const dragRef = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);

  // undo is a snapshot of the whole strokes array before the last undoable act, so one mechanism reverses a stroke and a move [InkStratum §4]
  const undoSnapshotRef = useRef<Stroke[] | null>(null);

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

  // ITEM 126 B4 — a mode switch must not leave a group armed: the writer who
  // returns to Draft should find the page at rest, not mid-gesture.
  useEffect(() => { setArmed(null); }, [permission]);

  // Hide the ring immediately on disarm or on leaving INK (not just on the
  // next pointermove) — J2's own rule.
  useEffect(() => {
    if ((!eraserArmed || permission !== 'edit') && ringRef.current) ringRef.current.style.display = 'none';
  }, [eraserArmed, permission]);

  // capture attaches only under `edit`; capture-phase on the sheet, an ancestor, so it runs before ForwardOnlyEditor's pen seal and stops it only while the page is inking [InkStratum §5]
  useEffect(() => {
    const sheet = sheetRef.current;
    if (permission !== 'edit' || !sheet) return;

    // The pointer that started the current stroke, or -1. Per-effect state in a
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
  }, [permission, sheetRef]);

  // the move attaches only under `movable` (Draft and Revise), never "whenever not drawing", which would reach Free Write's TEXT half; it listens on the sheet so the text keeps every click [InkStratum §12]
  useEffect(() => {
    const sheet = sheetRef.current;
    if (permission !== 'movable' || !sheet) return;

    // The pointer that started the current drag, or -1.
    let dragId = -1;

    const norm = (e: PointerEvent | MouseEvent) => {
      const rect = sheet.getBoundingClientRect();
      const w = rect.width || 1;
      // BOTH axes over WIDTH — J8's rule. Converting y by height here is the
      // mistake that already cost this lane a check that passed for the wrong
      // reason; it would also make every hit test miss by a factor of ~2.
      return { x: (e.clientX - rect.left) / w, y: (e.clientY - rect.top - inkOriginY(sheet, rect)) / w, w, h: rect.height };
    };

    // Repaint with the live drag applied to the armed group only.
    const previewStrokes = () => {
      const d = dragRef.current, a = armedRef.current;
      if (!d || !a) return strokesRef.current;
      return translateGroup(strokesRef.current, a, d.dx, d.dy);
    };
    // The armed outline rides the ACTIVE canvas, which is otherwise unused in
    // this permission — no third canvas, no DOM overlay to keep in sync.
    const paintOutline = () => {
      const canvas = activeRef.current;
      const rect = sheet.getBoundingClientRect();
      if (!canvas) return;
      const ctx = syncCanvas(canvas, rect.width, rect.height);
      if (!ctx) return;
      ctx.clearRect(0, 0, rect.width, rect.height);
      const a = armedRef.current;
      if (!a) return;
      const box = groupBox(previewStrokes(), a);
      if (!box) return;
      const w = rect.width, pad = 6;
      ctx.save();
      // Olive at rest, per the plateau register; the press is the drag itself.
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-rest').trim() || '#96a05a';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(box.x0 * w - pad, box.y0 * w + inkOriginY(sheet, rect) - pad,   // measured from the text [InkStratum §14]
                     (box.x1 - box.x0) * w + pad * 2, (box.y1 - box.y0) * w + pad * 2);
      ctx.restore();
    };
    const repaint = () => {
      paintCommitted(committedRef.current, sheet, previewStrokes());
      paintOutline();
    };
    const disarm = () => {
      armedRef.current = null;
      dragRef.current = null;
      setArmed(null);
      const canvas = activeRef.current;
      const rect = sheet.getBoundingClientRect();
      canvas?.getContext('2d')?.clearRect(0, 0, rect.width, rect.height);
      paintCommitted(committedRef.current, sheet, strokesRef.current);
    };

    // a double-click on ink arms its group; one on bare text does nothing at all, so the browser's word selection stands [InkStratum §15]
    const onDblClick = (e: MouseEvent) => {
      const { x, y, w } = norm(e);
      const group = strokeGroupAt(strokesRef.current, x, y, w);
      if (!group) { if (armedRef.current) disarm(); return; }
      e.preventDefault();
      e.stopPropagation();
      // A double-click also leaves a word selected underneath; clear it, or the
      // writer drags ink with a stray selection glowing behind it.
      try { window.getSelection()?.removeAllRanges(); } catch { /* */ }
      armedRef.current = group;
      setArmed(group);
      dragRef.current = null;
      repaint();
    };

    const onDown = (e: PointerEvent) => {
      const a = armedRef.current;
      if (!a) return;                       // nothing armed: the text owns this press
      const { x, y, w } = norm(e);
      const box = groupBox(strokesRef.current, a);
      // Only a press INSIDE the armed box begins a drag. A press anywhere else
      // is the writer going back to the text, so it disarms and falls through
      // untouched — never swallowed.
      const pad = 8 / w;
      if (!box || x < box.x0 - pad || x > box.x1 + pad || y < box.y0 - pad || y > box.y1 + pad) { disarm(); return; }
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { x, y, dx: 0, dy: 0 };
      dragId = e.pointerId;
      // Best-effort only — see the registration comment below for why a drag no
      // longer depends on capture to hear its own release.
      try { sheet.setPointerCapture(e.pointerId); } catch { /* best effort */ }
    };

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current, a = armedRef.current;
      if (!d || !a || e.pointerId !== dragId) return;
      e.preventDefault();
      const { x, y, w, h } = norm(e);
      const box = groupBox(strokesRef.current, a);
      if (!box) return;
      // FX17's law, applied to ink: a limit STOPS, it never relocates. The group
      // cannot be pushed off the sheet on either axis. maxY is height/width
      // because y is normalized by WIDTH.
      const c = clampDelta(box, x - d.x, y - d.y, h / w);
      d.dx = c.dx; d.dy = c.dy;
      repaint();
    };

    const commit = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return;
      const d = dragRef.current, a = armedRef.current;
      dragRef.current = null;
      dragId = -1;
      try { sheet.releasePointerCapture(e.pointerId); } catch { /* */ }
      if (!d || !a || (d.dx === 0 && d.dy === 0)) { repaint(); return; }
      const before = strokesRef.current;
      const next = translateGroup(before, a, d.dx, d.dy);
      undoSnapshotRef.current = before;     // one level, and it reverses a MOVE
      strokesRef.current = next;
      setCanUndo(true);
      repaint();
      // merged with live text by the host, exactly as a stroke is [InkStratum §16]
      onCommitRef.current(next);
    };

    // A cancelled or abandoned drag DISCARDS its delta — nothing was persisted
    // yet, so dropping the preview and repainting is the whole of the undo.
    const cancelDrag = () => {
      if (!dragRef.current) return;
      try { if (dragId !== -1) sheet.releasePointerCapture(dragId); } catch { /* */ }
      dragRef.current = null;
      dragId = -1;
      repaint();
    };
    const onCancel = (e: PointerEvent) => { if (e.pointerId === dragId) cancelDrag(); };
    const onBlurMove = () => cancelDrag();

    // Escape releases the group, mid-drag or merely armed — the same
    // cancel-without-consequence J2's onCancel gives a stroke.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !armedRef.current) return;
      e.preventDefault();
      dragRef.current = null;
      disarm();
    };

    // ITEM 126 — THE RELEASE IS HEARD ON WINDOW. item126.mjs C8 went red with
    // the group not moved AT ALL, and the probe explained it: a trusted mouse
    // drag after the arming double-click NEVER receives gotpointercapture, so a
    // release anywhere outside the sheet — even an ordinary one inside the
    // viewport — never reached `commit`. The move was LOST, and the drag stayed
    // armed to the next mouse movement. Measured, not inferred: capture-got 0,
    // release-on-sheet 0, persisted false, in a leg whose release was a plain
    // in-viewport event, which rules out a CDP artifact.
    // The press and the double-click stay on the sheet (arming is a question
    // about the paper); move, release and cancel go to window; every handler is
    // guarded by the pointer that began the drag.
    const opts = { passive: false, capture: true } as const;
    sheet.addEventListener('dblclick', onDblClick, opts);
    sheet.addEventListener('pointerdown', onDown, opts);
    window.addEventListener('pointermove', onMove, opts);
    window.addEventListener('pointerup', commit, opts);
    window.addEventListener('pointercancel', onCancel, opts);
    window.addEventListener('blur', onBlurMove);
    window.addEventListener('keydown', onKey);
    return () => {
      sheet.removeEventListener('dblclick', onDblClick, opts);
      sheet.removeEventListener('pointerdown', onDown, opts);
      window.removeEventListener('pointermove', onMove, opts);
      window.removeEventListener('pointerup', commit, opts);
      window.removeEventListener('pointercancel', onCancel, opts);
      window.removeEventListener('blur', onBlurMove);
      window.removeEventListener('keydown', onKey);
      // Leaving this permission must not strand an armed outline on the paper.
      armedRef.current = null;
      dragRef.current = null;
      const canvas = activeRef.current;
      const rect = sheet.getBoundingClientRect();
      canvas?.getContext('2d')?.clearRect(0, 0, rect.width, rect.height);
      paintCommitted(committedRef.current, sheet, strokesRef.current);
    };
  }, [permission, sheetRef]);

  // one level, the last stroke only: Free Write is forward-only, so typing is not undoable and does not consume it [InkStratum §17]
  const undo = () => {
    const next = undoSnapshotRef.current;
    if (!next) return;
    undoSnapshotRef.current = null;
    strokesRef.current = next;
    // A move can be undone while its group is still armed; the indices stay
    // valid because a move never adds or removes strokes, only relocates them.
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
        data-ink-permission={permission}
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
      {/* ITEM 126 B4 — offered under `edit` (a stroke to reverse) and `movable`
          (a move to reverse), never under `inert`: Free Write's TEXT half is
          forward-only and has nothing of its own to undo, which is what
          item121.mjs's S8 already asserts and still does. */}
      {permission !== 'inert' && canUndo && (
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

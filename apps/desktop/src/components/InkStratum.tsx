import { useEffect, useRef, useState } from 'react';
import { ERASER_WIDTH, clampDelta, groupBox, inkColor, renderStroke, strokeGroupAt, translateGroup } from '../store/ink';
import type { Stroke, StrokeInk, StrokeNib, StrokeTip } from '../types';

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

export interface InkStratumProps {
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
export function syncCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D | null {
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
// #101 FOLLOW-UP (Fable Nov 19: an Enter on a page WITH ink cost 129-142 ms at 5 000 words, 296-302 ms at 12 000): the ink is placed in page-WIDTH units, so a page that only grows TALLER does not move it. What the last full paint was, per canvas: the strokes array, the width, the pixel ratio, the text's origin, the ink colour, and the height the canvas was given.
const painted = new WeakMap<HTMLCanvasElement, { strokes: Stroke[]; w: number; dpr: number; oy: number; color: string; cssH: number }>();
const INK_PAD = 32;      // px below the lowest stroke point: the widest nib and its cap
const INK_STEP = 256;    // the canvas is given its height in steps, so a stroke being dragged does not re-size it every frame
export function paintCommitted(canvas: HTMLCanvasElement | null, sheet: HTMLElement | null, strokes: Stroke[], opts?: { resize?: boolean }): void {
  if (!canvas || !sheet) return;
  // #101: a page with NO ink has nothing to paint, and sizing the canvas to the page is the expensive part: width x height of the whole sheet (40,000+ px tall on a long page), thrown away and allocated again from the ResizeObserver every
  // time the page grows by a line - every Enter - which the browser's profile showed as 23-85 ms per Enter in `setTransform`. With no strokes the canvas is one pixel (the CSS box stretches it; it is blank either way) and is not touched again. `will-change: transform` keeps it a composited layer of its own, as the page-sized canvas always was: without that layer, the native caret is not painted on a Typewriter (zoomed) page in the audit's screenshots (the reader proof's controls of wa-red-62 and wa-red-70 caught it), and with it they pass.
  if (strokes.length === 0) { canvas.style.willChange = 'transform'; if (canvas.width !== 1 || canvas.height !== 1) { canvas.width = 1; canvas.height = 1; } if (canvas.style.height !== '100%') canvas.style.height = '100%'; painted.delete(canvas); return; }
  const rect = sheet.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const oy = inkOriginY(sheet, rect);
  const color = inkColor();
  // the backing store reaches the LOWEST stroke (not the page's foot: 739 x 22 400 at 5 000 words, 739 x 50 458 at 12 000, allocated and cleared on every Enter): below the ink there is nothing to hold. An erase adds nothing below the ink it rubs out.
  let low = 0;
  for (const st of strokes) { if (st.eraser) continue; for (const p of st.points) if (p.y > low) low = p.y; }
  // ... and never less than the paper's visible foot (#111): the scroller's visible height, so a stroke drawn anywhere on the paper she sees shows whole
  const scale = sheet.offsetWidth > 0 ? rect.width / sheet.offsetWidth : 1;
  const scroller = sheet.closest('.mode-scroll') as HTMLElement | null;
  const visible = scroller ? scroller.clientHeight * scale : 0;
  const need = Math.ceil(Math.max(oy + low * rect.width + INK_PAD, visible));
  const was = painted.get(canvas);
  // from the sheet's ResizeObserver, a paint that would draw what is already there is not made: the same strokes, width, pixel ratio, origin and colour, and the canvas still reaches the lowest stroke and not past the sheet's foot
  if (opts && opts.resize && was && was.strokes === strokes && was.w === rect.width && was.dpr === dpr && was.oy === oy && was.color === color && was.cssH >= Math.min(rect.height, need) && was.cssH <= rect.height + 0.5) return;
  const cssH = Math.max(1, Math.min(rect.height, Math.ceil(need / INK_STEP) * INK_STEP));
  const ctx = syncCanvas(canvas, rect.width, cssH);
  if (!ctx) return;
  // cssH is in painted (on-screen) px, like rect: a sheet that is scaled by a transform needs the box in its own layout px, or the ink would be stretched down the page
  canvas.style.height = (cssH / (scale || 1)) + 'px';
  ctx.clearRect(0, 0, rect.width, cssH);
  ctx.save(); ctx.translate(0, oy);   // measured from the text [InkStratum §3]
  for (const st of strokes) renderStroke(ctx, st, rect.width, color);
  ctx.restore();
  painted.set(canvas, { strokes, w: rect.width, dpr, oy, color, cssH });
}

export function InkStratum({ permission, sheetRef, strokes, onCommit, pen, eraserArmed }: InkStratumProps) {
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
    const ro = new ResizeObserver(() => paintCommitted(committedRef.current, sheetRef.current, strokesRef.current, { resize: true }));
    // the BORDER box: the text's origin is the sheet's padding-top, which a content-box observation never sees change
    ro.observe(sheet, { box: 'border-box' });
    // the text's origin moves without the sheet's own size changing (the Typewriter's start offset settles after the first paint: the ink was left 25 px from where it was drawn after a reload); the scroller's content box changes with it, so it is watched too, and the paint is skipped when nothing it reads changed
    const scroller = sheet.closest('.mode-scroll');
    if (scroller) ro.observe(scroller);
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
  // VISUAL 1a.1: the listeners themselves live in ink/inkCapture.ts, fetched on the first INK open (a failed fetch tries again at the next one)
  useEffect(() => {
    const sheet = sheetRef.current;
    if (permission !== 'edit' || !sheet) return;
    let detach: (() => void) | null = null;
    let gone = false;
    import('./ink/inkCapture')
      .then(({ attachCapture }) => {
        if (gone) return;
        detach = attachCapture({
          sheet, committedRef, activeRef, ringRef, strokesRef, activeStrokeRef, drawingRef, captureRectRef, penSeenRef, undoSnapshotRef, penRef, eraserArmedRef, onCommitRef, setCanUndo,
        });
      })
      .catch(() => { /* the next INK open tries again */ });
    return () => { gone = true; detach?.(); };
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

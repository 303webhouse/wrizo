import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ERASER_WIDTH, clampDelta, groupBox, inkColor, renderStroke, strokeGroupAt, translateGroup } from '../store/ink';
import type { Stroke, StrokeInk, StrokeNib, StrokePoint, StrokeTip } from '../types';

// ITEM 121 I2 — THE INK STRATUM. The Journal's J-series drawing layer
// (JournalEntry.tsx's own capture pipeline) ported onto the framed Free Write
// page, under R15's analog law: the page is a typewriter for text and a
// journal page / sketch pad for drawing, and this is the second half made
// real. Everything about HOW a stroke is captured, painted, erased, undone and
// persisted is the Journal's, unchanged in kind; what is new is that the page
// has a MODE.
//
// ITEM 126 (121-B) — THE STRATUM NOW RENDERS IN EVERY MODE, because the ink is
// THE PAGE'S, not Free Write's decoration. Item 121's sentence here used to read
// "this layer is inert unless the page says INK"; that was true of the surface
// it shipped on and is false now, so it is corrected rather than left to mislead
// the next reader. What varies by mode is no longer PRESENCE but PERMISSION:
//   edit    — Free Write / INK: draw, erase, undo (item 121, unchanged).
//   inert   — Free Write / TEXT: renders, intercepts nothing. RULED (Fable,
//             2026-09-08): R15 stands, and the asymmetry is the reason, not a
//             hole — in Free Write the sketch pad is one press away, so a
//             typewriter does not move ink; a sketch pad does.
//   movable — Draft and Revise: renders, and a double-click on ink arms a move.
//             There is no INK to switch to in these modes, which is exactly why
//             movable exists here and nowhere else.
// THE LISTENER THAT ARMS A MOVE MUST ATTACH UNDER `movable` ALONE — never
// "whenever the writer is not drawing", which would quietly extend the gesture
// into Free Write's TEXT half and reverse the ruling with nobody typing a word.
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

// ── ITEM 157 · THE PAINT FRAME IS THE PAPER; THE BASIS IS STILL THE SHEET ──
//
// Nick: "The ink is hard limited to a kind of text box, not the entire page
// surface like it should be." Founder-ruled: the entire page surface.
//
// Item 121 used ONE element — the sheet, editorBody's wrapper inside the
// scroller — for three jobs: where the canvas paints, where the pointer is
// heard, and the coordinate basis every stored point is normalized against.
// Its reason was real (the paper is a fixed-height window with an inner
// scroller, so a paper-sized canvas would nail ink to the viewport) and its cost
// was seen and misfiled: the sheet excludes the paper's margins, so ink could
// never reach them. See docs/menus/item157-s0-survey.md.
//
// The three roles are now separate:
//   BASIS   — still the sheet. Production has real ink saved as x and y over the
//             sheet's width from the sheet's top-left; moving the basis would
//             silently shift and rescale every stroke writers have made. Margin
//             ink is just coordinates the basis already allowed (x < 0, y < 0).
//   RENDER  — the paper. The canvases are portalled into `.mode-page` and fill it
//             by layout; each paint translates by the sheet's offset inside the
//             canvas, MEASURED AT PAINT TIME.
//   CAPTURE — the paper. See the listener registrations below.
// Measuring the offset at paint time is what keeps item 121's reason honoured:
// when the page scrolls, the sheet moves, the offset changes, and the next
// repaint (driven by the scroller's own scroll event) follows the text.

// Size a canvas's backing store to its OWN box (which is the paper, by layout)
// and return a context whose origin is the SHEET's top-left and whose unit is
// the CSS pixel, so callers draw in sheet coordinates exactly as before.
// `clear` wipes the whole backing store first — the paper-sized one, margins
// included; an eraser's in-progress rub passes false so it can accumulate.
function frameCtx(canvas: HTMLCanvasElement, sheet: HTMLElement, clear: boolean):
  { ctx: CanvasRenderingContext2D; sheetW: number } | null {
  const dpr = window.devicePixelRatio || 1;
  const c = canvas.getBoundingClientRect();
  const s = sheet.getBoundingClientRect();
  const bw = Math.max(1, Math.round(c.width * dpr));
  const bh = Math.max(1, Math.round(c.height * dpr));
  if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (clear) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, bw, bh); }
  ctx.setTransform(dpr, 0, 0, dpr, dpr * (s.left - c.left), dpr * (s.top - c.top));
  return { ctx, sheetW: s.width };
}

// Wipe a canvas's whole backing store. Item 121's clears used the SHEET's size,
// which would leave the margins of a paper-sized canvas uncleared — a stale
// preview stranded exactly where this ticket lets ink go.
function clearCanvas(canvas: HTMLCanvasElement | null): void {
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Paint all committed strokes. Denormalizes by the sheet's current width, so a
// page drawn at one width keeps its ink in place when the text reflows at
// another. Called on mount, on every stroke-set change, on resize, and — since
// item 157 — on every scroll of the page, because the frame is the paper and
// the sheet moves inside it.
export function paintCommitted(canvas: HTMLCanvasElement | null, sheet: HTMLElement | null, strokes: Stroke[]): void {
  if (!canvas || !sheet) return;
  const f = frameCtx(canvas, sheet, true);
  if (!f) return;
  const color = inkColor();
  for (const s of strokes) renderStroke(f.ctx, s, f.sheetW, color);
}

// ITEM 157 — the page's scrollbar, which the sheet never covered and the paper
// does. Capture on the paper would otherwise start a stroke on a press meant to
// drag the scrollbar, breaking scrolling in INK. True only when a vertical
// scrollbar is actually showing AND the press lands in its gutter.
function inScrollbar(scroller: HTMLElement | null, e: MouseEvent): boolean {
  if (!scroller) return false;
  const bar = scroller.offsetWidth - scroller.clientWidth - scroller.clientLeft * 2;
  if (bar <= 0) return false;
  const r = scroller.getBoundingClientRect();
  const gutterLeft = r.left + scroller.clientLeft + scroller.clientWidth;
  return e.clientX >= gutterLeft && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
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

  // ITEM 157 — the paper this stratum paints on and listens to. Found from the
  // sheet (`closest('.mode-page')`) so the host passes nothing new: the sheet is
  // always inside the paper on a framed page. State, not a ref, because the
  // portal below can only render once it is known.
  const [paperEl, setPaperEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPaperEl((sheetRef.current?.closest('.mode-page') as HTMLElement | null) ?? null);
  }, [sheetRef]);

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

  // ITEM 126 B4 — UNDO BECOMES A SNAPSHOT, and that GENERALIZES item 121 rather
  // than changing it. It used to be `slice(0, -1)` — drop the last stroke — which
  // cannot express "put that drawing back where it was". One level is unchanged;
  // what the level holds is now the whole strokes array as it stood before the
  // last undoable act, so one mechanism reverses a stroke AND a move. For a
  // stroke-add the observable result is identical to the slice it replaces.
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
  }, [strokes, sheetRef, paperEl]);

  // Keep ink positioned when the sheet's width OR height changes (as the text
  // grows the sheet, existing strokes re-render at the new size). Runs in BOTH
  // modes: ink drawn in INK must stay put while the writer types in TEXT.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => paintCommitted(committedRef.current, sheetRef.current, strokesRef.current));
    ro.observe(sheet);
    // ITEM 157 — the paper can resize without the sheet doing so (the stage
    // grows, page setup changes a margin), and the canvas is the paper now.
    if (paperEl) ro.observe(paperEl);
    return () => ro.disconnect();
  }, [sheetRef, paperEl]);

  // ITEM 157 — INK SCROLLS WITH THE TEXT, which is item 121's own reason for
  // binding the sheet where it did, kept. The canvas is fixed to the paper; the
  // sheet scrolls inside it; so on every scroll the offset changes and the ink
  // is repainted at it. rAF-coalesced: one paint per frame however fast the
  // wheel turns. Runs in every permission — ink is visible in every mode.
  useEffect(() => {
    const scroller = sheetRef.current?.closest('.mode-scroll') as HTMLElement | null;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        paintCommitted(committedRef.current, sheetRef.current, strokesRef.current);
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => { scroller.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [sheetRef, paperEl]);

  // ITEM 126 B4 — a mode switch must not leave a group armed: the writer who
  // returns to Draft should find the page at rest, not mid-gesture.
  useEffect(() => { setArmed(null); }, [permission]);

  // Hide the ring immediately on disarm or on leaving INK (not just on the
  // next pointermove) — J2's own rule.
  useEffect(() => {
    if ((!eraserArmed || permission !== 'edit') && ringRef.current) ringRef.current.style.display = 'none';
  }, [eraserArmed, permission]);

  // ── CAPTURE ───────────────────────────────────────────────────────────────
  // Attached ONLY under `edit`. Under `inert` and `movable` this effect returns
  // before adding anything, so Free Write's TEXT half behaves exactly as it did
  // before item 121 — including keeping ForwardOnlyEditor's I0 pen seal fully in
  // force — and Draft and Revise never gain a drawing pointer at all. Item 126
  // gives those two modes a MOVE gesture, not a pen (B3/B4); nothing here.
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
    const paper = paperEl;
    if (permission !== 'edit' || !sheet || !paper) return;
    const scroller = sheet.closest('.mode-scroll') as HTMLElement | null;

    // The pointer that started the current stroke, or -1. Per-effect state in a
    // closure, because the listeners below are attached once per permission.
    let activeId = -1;

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
      if (!stroke) return;
      if (stroke.eraser) {
        // No clear: an erase rubs, and must accumulate on the committed canvas.
        // The frame is re-measured, so a page scrolled mid-rub still lands true.
        const f = committedRef.current ? frameCtx(committedRef.current, sheet, false) : null;
        if (f) renderStroke(f.ctx, stroke, f.sheetW, inkColor());
        return;
      }
      const canvas = activeRef.current;
      const f = canvas ? frameCtx(canvas, sheet, true) : null;
      if (!f) return;
      const ctx = f.ctx;
      // A marker's `multiply` overlap (I5) is only visible against ink already
      // on the COMMITTED canvas; the live preview draws on its own transparent
      // canvas, so the crossing darkens on commit rather than mid-stroke. The
      // Journal's two-canvas split is what buys the flicker-free preview, and
      // that tradeoff is worth one frame of a marker looking slightly light.
      renderStroke(ctx, stroke, f.sheetW, inkColor());
    };
    const clearActive = () => clearCanvas(activeRef.current);

    const onDown = (e: PointerEvent) => {
      if (!draws(e)) return; // falls through to the page — finger scroll
      // The on-sheet ink controls (undo) are real buttons; a press on one is
      // not a stroke. Same guard the Journal carries for its own.
      if ((e.target as Element | null)?.closest?.('.ink-undo')) return;
      // ITEM 157 — a press on the page's scrollbar is a scroll, not a stroke.
      if (inScrollbar(scroller, e)) return;
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
      // Points are normalized against the SHEET — the basis, unchanged — even
      // when the press lands in a margin, which is exactly what gives margin ink
      // its x < 0 / y < 0. frameCtx sizes the paper-sized canvases as it paints.
      captureRectRef.current = sheet.getBoundingClientRect();
      clearCanvas(activeRef.current);
      drawingRef.current = true;
      activeId = e.pointerId;   // only THIS pointer may drive or end the stroke
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
      // BEST-EFFORT, AND NO LONGER LOAD-BEARING (item 126, measured): the
      // stroke's move and release are heard on WINDOW (below), so this call
      // failing — or succeeding and then not rerouting the release, which is
      // what a trusted mouse drag was measured doing — can no longer lose a
      // stroke. It stays for cursor and hover consistency only.
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
      // ITEM 157 — the ring lives in the paper beside the canvases, so it is
      // positioned in the canvas's own frame and can follow the pen over a
      // margin, where item 121's sheet-bound ring could never appear.
      const frame = (committedRef.current ?? paper).getBoundingClientRect();
      ring.style.display = 'block';
      ring.style.left = `${e.clientX - frame.left}px`;
      ring.style.top = `${e.clientY - frame.top}px`;
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
    // ITEM 157 — THE PRESS IS HEARD ON THE PAPER, not the sheet, so a stroke can
    // BEGIN in a margin. (Item 126 already moved move/release/cancel to window.)
    const opts = { passive: false, capture: true } as const;
    paper.addEventListener('pointerdown', onDown, opts);
    window.addEventListener('pointermove', onMove, opts);
    window.addEventListener('pointerup', onUp, opts);
    window.addEventListener('pointercancel', onCancel, opts);
    window.addEventListener('blur', onBlur);
    const hoverOpts = { passive: true } as const;
    paper.addEventListener('pointermove', onHover, hoverOpts);
    paper.addEventListener('pointerleave', onLeave, hoverOpts);
    return () => {
      paper.removeEventListener('pointerdown', onDown, opts);
      window.removeEventListener('pointermove', onMove, opts);
      window.removeEventListener('pointerup', onUp, opts);
      window.removeEventListener('pointercancel', onCancel, opts);
      window.removeEventListener('blur', onBlur);
      paper.removeEventListener('pointermove', onHover);
      paper.removeEventListener('pointerleave', onLeave);
      // Leaving INK mid-stroke must not leave the sheet unselectable.
      drawingRef.current = false;
      activeStrokeRef.current = null;
      sheet.style.removeProperty('user-select');
      sheet.style.removeProperty('-webkit-user-select');
    };
  }, [permission, sheetRef, paperEl]);

  // ── ITEM 126 B4 · THE MOVE (permission: movable) ─────────────────────────
  //
  // Attached ONLY under `movable`, which is reachable ONLY from Draft and Revise
  // (PageEditor derives it by falling PAST Free Write). That is the ruling made
  // structural: a listener armed by "the writer is not drawing" would extend this
  // gesture into Free Write's TEXT half and reverse R15 with nobody typing a word.
  //
  // THE CANVAS STAYS INERT. Everything here listens on the SHEET, as item 121's
  // routing law requires — and it must, because the text underneath has to keep
  // receiving every click it would otherwise get.
  useEffect(() => {
    const sheet = sheetRef.current;
    const paper = paperEl;
    if (permission !== 'movable' || !sheet || !paper) return;
    const scroller = sheet.closest('.mode-scroll') as HTMLElement | null;

    // The pointer that started the current drag, or -1.
    let dragId = -1;

    const norm = (e: PointerEvent | MouseEvent) => {
      const rect = sheet.getBoundingClientRect();
      const w = rect.width || 1;
      // BOTH axes over WIDTH — J8's rule. Converting y by height here is the
      // mistake that already cost this lane a check that passed for the wrong
      // reason; it would also make every hit test miss by a factor of ~2.
      return { x: (e.clientX - rect.left) / w, y: (e.clientY - rect.top) / w, w };
    };

    // ITEM 157 — THE PAGE'S EDGES, IN SHEET COORDINATES, measured now. Item 126
    // stopped a group at the sheet's edge; the founder-ruled edge is the paper's.
    // Horizontally that is the canvas's box (which is the paper, by layout).
    // Vertically it is the WHOLE SCROLLABLE PAGE: its top is the paper's top as
    // it stands at scroll 0, and its bottom is the paper's bottom plus however
    // much further the page scrolls — sheet coordinates are scroll-independent,
    // so both are expressed in the scroll-0 frame.
    const pageBounds = () => {
      const s = sheet.getBoundingClientRect();
      const c = (committedRef.current ?? paper).getBoundingClientRect();
      const w = s.width || 1;
      const scrollTop = scroller ? scroller.scrollTop : 0;
      const maxScroll = scroller ? Math.max(0, scroller.scrollHeight - scroller.clientHeight) : 0;
      const sheetTop0 = s.top + scrollTop;
      return {
        x0: (c.left - s.left) / w,
        x1: (c.right - s.left) / w,
        y0: (c.top - sheetTop0) / w,
        y1: (c.bottom + maxScroll - sheetTop0) / w,
      };
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
      if (!canvas) return;
      const f = frameCtx(canvas, sheet, true);
      if (!f) return;
      const ctx = f.ctx;
      const a = armedRef.current;
      if (!a) return;
      const box = groupBox(previewStrokes(), a);
      if (!box) return;
      const w = f.sheetW, pad = 6;
      ctx.save();
      // Olive at rest, per the plateau register; the press is the drag itself.
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-rest').trim() || '#96a05a';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(box.x0 * w - pad, box.y0 * w - pad,
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
      clearCanvas(activeRef.current);
      paintCommitted(committedRef.current, sheet, strokesRef.current);
    };

    // THE GESTURE. A double-click that lands ON INK arms its group; one that
    // lands on bare text does NOTHING AT ALL — no preventDefault, no
    // stopPropagation — so the browser's own word-selection happens exactly as
    // it always has. That miss-path is not politeness: it is Nick's "text is
    // only editable by standard in-line word processing led by a cursor",
    // and it is the clause an over-eager listener breaks first.
    const onDblClick = (e: MouseEvent) => {
      if (inScrollbar(scroller, e)) return;
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
      if (inScrollbar(scroller, e)) return; // a scroll, never a drag
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
      const { x, y } = norm(e);
      const box = groupBox(strokesRef.current, a);
      if (!box) return;
      // FX17's law, applied to ink: a limit STOPS, it never relocates. ITEM 157:
      // the limit is the PAGE's edge, not the sheet's — margins are page.
      const c = clampDelta(box, x - d.x, y - d.y, pageBounds());
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
      // Merged with live text by the host, exactly as a stroke is (item 121 I2).
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
    // ITEM 157 — heard on the PAPER, so ink drawn in a margin can be grabbed.
    paper.addEventListener('dblclick', onDblClick, opts);
    paper.addEventListener('pointerdown', onDown, opts);
    // An ARMED outline must follow the page as it scrolls, the same as the ink.
    const onScrollArmed = () => { if (armedRef.current) repaint(); };
    scroller?.addEventListener('scroll', onScrollArmed, { passive: true });
    window.addEventListener('pointermove', onMove, opts);
    window.addEventListener('pointerup', commit, opts);
    window.addEventListener('pointercancel', onCancel, opts);
    window.addEventListener('blur', onBlurMove);
    window.addEventListener('keydown', onKey);
    return () => {
      paper.removeEventListener('dblclick', onDblClick, opts);
      paper.removeEventListener('pointerdown', onDown, opts);
      scroller?.removeEventListener('scroll', onScrollArmed);
      window.removeEventListener('pointermove', onMove, opts);
      window.removeEventListener('pointerup', commit, opts);
      window.removeEventListener('pointercancel', onCancel, opts);
      window.removeEventListener('blur', onBlurMove);
      window.removeEventListener('keydown', onKey);
      // Leaving this permission must not strand an armed outline on the paper.
      armedRef.current = null;
      dragRef.current = null;
      clearCanvas(activeRef.current);
      paintCommitted(committedRef.current, sheet, strokesRef.current);
    };
  }, [permission, sheetRef, paperEl]);

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

  // ITEM 157 — PORTALLED INTO THE PAPER. The stratum is rendered inside the
  // sheet, which is inside `.mode-scroll`, whose overflow clips its children: a
  // canvas there could never reach the paper's left or top margin. Portalled,
  // the canvases fill the paper by layout (inset:0 of `.mode-page`, which is
  // position:relative and clips to its own rounded edge — so ink stops exactly
  // at the paper). Above the scroller (z-index 1), and never intercepting.
  if (!paperEl) return null;
  return createPortal(
    <>
      {/* Both canvases fill the PAPER BY LAYOUT and NEVER intercept input —
          routing is the paper's job, above. `aria-hidden` because ink is not
          text; the page's words remain the accessible content either way. */}
      <canvas
        ref={committedRef}
        className="ink-canvas ink-committed wz-ink-stratum"
        aria-hidden="true"
        data-ink-permission={permission}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />
      <canvas
        ref={activeRef}
        className="ink-canvas ink-active"
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
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
          border: '1.5px solid var(--ink-on-paper-low)', pointerEvents: 'none', zIndex: 3,
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
            cursor: 'pointer', padding: 4, pointerEvents: 'auto', zIndex: 3,
          }}
        >
          ↺
        </button>
      )}
    </>,
    paperEl,
  );
}

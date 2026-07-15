import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJournalEntry, saveBoardBoxes, flushNow, getDrawer, getProject } from '../store/persistence';
import { renderStroke } from '../store/ink';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { useWayBack } from './useWayBack';
import { useLexicon } from '../store/themeLexicon';
import { DeskFrame, useDeskFrameViewport } from './DeskFrame';
import type { Box, Project } from '../types';

// J4 — the Board: a canvas of positioned boxes (I2/I3 realized). Boxes only
// ever arrive via a port (J4 Slice 2); this editor selects, moves, resizes,
// groups/ungroups, edits text in place, and removes — it never draws or adds
// a box from scratch (the anti-Canva guard: content + position only, no
// styling). Trellis-side: text boxes edit freely, no forward-only, no mode
// strip anywhere on a Board.

const AUTOSAVE_MS = 2000;
const LONG_PRESS_MS = 350;         // mirrors the S25-verified Spread gesture
const MOUSE_DRAG_THRESHOLD = 6;
const TOUCH_CANCEL_THRESHOLD = 12;
const MIN_TEXT_W = 0.15;
const MIN_INK_W = 0.08;
const MEASURE_TOLERANCE_PX = 2;
const VIEWPORT_MIN_PX = 560;

function groupMembers(boxes: Box[], groupId: string | undefined): Box[] {
  if (!groupId) return [];
  return boxes.filter(b => b.groupId === groupId);
}

function maxBottom(boxes: Box[]): number {
  return boxes.reduce((m, b) => Math.max(m, b.y + b.h), 0);
}

function escHtml(s: string): string {
  return s.replace(/[&<>]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}

// -- ink box: paints via the shared renderStroke, box-local (already
// re-normalized at port time so sheetW = the box's own pixel width). -------
function BoardInkBox({ box, pageWidthPx }: { box: Box; pageWidthPx: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const wPx = Math.max(1, box.w * pageWidthPx);
    const hPx = Math.max(1, box.h * pageWidthPx);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(wPx * dpr));
    canvas.height = Math.max(1, Math.round(hPx * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, wPx, hPx);
    const root = getComputedStyle(document.documentElement);
    const color = root.getPropertyValue('--ink-stroke').trim() || root.getPropertyValue('--ink-on-paper').trim() || '#1A1206';
    for (const s of box.strokes ?? []) renderStroke(ctx, s, wPx, color);
  }, [box.strokes, box.w, box.h, pageWidthPx]);
  return <canvas ref={ref} aria-hidden="true" className="board-ink-canvas" style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// -- text box: read-only prose, or an uncontrolled contenteditable while
// editing. The editing html is captured ONCE per edit session (a stable
// React state initializer) so React never re-sets innerHTML mid-edit — the
// same discipline ForwardOnlyEditor's Draft mode relies on. The Voice Wall
// stands: foreign paste/drop is blocked + whispered; an allowed own-ink
// paste proceeds natively (Draft law — this surface owns its contenteditable).
function BoardTextBox({
  boxId, initialText, editing, measureRef, onCommitText, onBlurEdit,
}: {
  boxId: string;
  initialText: string;
  editing: boolean;
  measureRef: (id: string, el: HTMLDivElement | null) => void;
  onCommitText: (id: string, text: string) => void;
  onBlurEdit: () => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [html] = useState(() => escHtml(initialText));
  const { t: lex } = useLexicon();

  useEffect(() => {
    const el = elRef.current;
    if (!el || !editing) return;
    // I0 pen discipline, scoped to this element: the pen is a Board POINTER,
    // never a typing/handwriting surface — the recognizer hazard returns
    // exactly here (a live contenteditable) and is pre-empted the same way.
    el.style.touchAction = 'none';
    el.setAttribute('handwriting', 'false');
    const neutralizePen = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const opts = { passive: false, capture: true } as const;
    el.addEventListener('pointerdown', neutralizePen, opts);
    el.addEventListener('pointermove', neutralizePen, opts);
    el.addEventListener('pointerup', neutralizePen, opts);

    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        if (shadowAllows(extractIncomingText(e))) return; // own ink: native paste proceeds
        e.preventDefault();
        notePasteBlocked();
      }
    };
    const blockForeign = (e: Event) => {
      if (shadowAllows(extractIncomingText(e))) return;
      e.preventDefault();
      notePasteBlocked();
    };
    el.addEventListener('beforeinput', onBeforeInput as EventListener);
    el.addEventListener('paste', blockForeign);
    el.addEventListener('drop', blockForeign);

    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }

    return () => {
      el.removeEventListener('pointerdown', neutralizePen, opts);
      el.removeEventListener('pointermove', neutralizePen, opts);
      el.removeEventListener('pointerup', neutralizePen, opts);
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('paste', blockForeign);
      el.removeEventListener('drop', blockForeign);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (!editing) {
    return (
      <div
        ref={el => { elRef.current = el; measureRef(boxId, el); }}
        className="board-text"
      >
        {initialText}
      </div>
    );
  }

  return (
    <div
      ref={el => { elRef.current = el; measureRef(boxId, el); }}
      className="board-text board-text-editing"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={`${lex('board')} text box`}
      onInput={() => onCommitText(boxId, elRef.current?.innerText ?? '')}
      onBlur={onBlurEdit}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type LastAction = { type: 'move' | 'resize' | 'remove' | 'ungroup'; before: Box[] } | null;

export function BoardEditor({ id }: { id: string }) {
  const navigate = useNavigate();
  const initialEntry = getJournalEntry(id);
  // AB1 S1 — DeskFrame owns the viewport at >=1100px only; below that this
  // renders its exact pre-AB1 markup. No mode strip on Board (Trellis-side
  // by design — matches w1.mjs's existing "board never gets mode tabs"
  // assertion), so DeskFrame mounts here with no modeStrip prop.
  const framed = useDeskFrameViewport();

  // W2 — route + mount identity only (S1: a Board's own view state — pan,
  // zoom, selection — already persists through its own store; no scroll/
  // caret to capture here).
  useWayBack({ entryId: id });

  const [boxes, setBoxes] = useState<Box[]>(() => initialEntry?.boxes ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [pageWidthPx, setPageWidthPx] = useState(700);

  const boxesRef = useRef(boxes);
  boxesRef.current = boxes;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const editingIdRef = useRef(editingId);
  editingIdRef.current = editingId;
  const lastActionRef = useRef<LastAction>(null);
  const lastSavedRef = useRef(boxes);
  const measureEls = useRef<Map<string, HTMLDivElement>>(new Map());

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const project: Project | null = initialEntry?.projectId ? getProject(initialEntry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;

  // Measure the board's rendered width so the normalized coordinate space
  // converts to real pixels; re-measure on resize.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setPageWidthPx(Math.max(320, el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Autosave — debounced, like PageEditor's text; flush on hide/unmount.
  useEffect(() => {
    if (boxes === lastSavedRef.current) return;
    const h = setTimeout(() => { saveBoardBoxes(id, boxesRef.current); lastSavedRef.current = boxesRef.current; }, AUTOSAVE_MS);
    return () => clearTimeout(h);
  }, [boxes, id]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && boxesRef.current !== lastSavedRef.current) {
        saveBoardBoxes(id, boxesRef.current);
        lastSavedRef.current = boxesRef.current;
        flushNow();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      if (boxesRef.current !== lastSavedRef.current) saveBoardBoxes(id, boxesRef.current);
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Text reflow — measure each text box's actual rendered height and correct
  // `h` when it drifts (the port-time estimate, or a width resize, or a live
  // edit). Tolerance-gated so it never loops.
  useLayoutEffect(() => {
    if (pageWidthPx <= 0) return;
    let changed = false;
    const next = boxes.map(b => {
      if (b.kind !== 'text') return b;
      const el = measureEls.current.get(b.id);
      if (!el) return b;
      const measuredPx = el.scrollHeight;
      const storedPx = b.h * pageWidthPx;
      if (Math.abs(measuredPx - storedPx) <= MEASURE_TOLERANCE_PX) return b;
      changed = true;
      return { ...b, h: measuredPx / pageWidthPx };
    });
    if (changed) setBoxes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, pageWidthPx, editingId]);

  const measureRef = (boxId: string, el: HTMLDivElement | null) => {
    if (el) measureEls.current.set(boxId, el);
    else measureEls.current.delete(boxId);
  };

  const commitText = (boxId: string, text: string) => {
    setBoxes(prev => prev.map(b => (b.id === boxId ? { ...b, text } : b)));
  };

  const snapshot = (type: NonNullable<LastAction>['type']) => {
    lastActionRef.current = { type, before: boxesRef.current };
    setCanUndo(true);
  };

  const undo = () => {
    const la = lastActionRef.current;
    if (!la) return;
    setBoxes(la.before);
    lastSavedRef.current = boxesRef.current; // force the autosave effect to see a change
    saveBoardBoxes(id, la.before);
    lastActionRef.current = null;
    setCanUndo(false);
  };

  const selectedBox = boxes.find(b => b.id === selectedId) ?? null;
  const selectedGroup = selectedBox ? groupMembers(boxes, selectedBox.groupId) : [];
  const selectedIds = new Set(selectedGroup.length > 0 ? selectedGroup.map(b => b.id) : selectedBox ? [selectedBox.id] : []);
  const canResize = !!selectedBox && !selectedBox.groupId;

  const ungroup = () => {
    if (!selectedBox?.groupId) return;
    snapshot('ungroup');
    const gid = selectedBox.groupId;
    setBoxes(prev => prev.map(b => (b.groupId === gid ? { ...b, groupId: undefined } : b)));
  };

  const removeSelected = () => {
    if (!selectedBox) return;
    snapshot('remove');
    const idsToRemove = selectedIds;
    setBoxes(prev => prev.filter(b => !idsToRemove.has(b.id)));
    setSelectedId(null);
  };

  // -- delegated pointer handling: select / move / resize -------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phase: 'idle' | 'pending' | 'dragging' | 'resizing' = 'idle';
    let startX = 0, startY = 0, ptype = 'mouse';
    let activePointerId: number | null = null;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let movingIds: string[] = [];
    let startBoxes: Box[] = [];
    let resizingId: string | null = null;
    let resizeStart: { w: number; h: number; aspect: number; kind: Box['kind'] } | null = null;

    const clearTimer = () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } };

    const beginMove = (ids: string[]) => {
      phase = 'dragging';
      movingIds = ids;
      startBoxes = boxesRef.current;
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
    };

    const beginResize = (boxId: string) => {
      const box = boxesRef.current.find(b => b.id === boxId);
      if (!box) return;
      phase = 'resizing';
      resizingId = boxId;
      startBoxes = boxesRef.current;
      resizeStart = { w: box.w, h: box.h, aspect: box.h / box.w, kind: box.kind };
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
    };

    const finish = (commit: boolean) => {
      clearTimer();
      if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
        try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      if (commit && (phase === 'dragging' || phase === 'resizing') && boxesRef.current !== startBoxes) {
        lastActionRef.current = { type: phase === 'dragging' ? 'move' : 'resize', before: startBoxes };
        setCanUndo(true);
      } else if (!commit && (phase === 'dragging' || phase === 'resizing')) {
        setBoxes(startBoxes); // release outside canvas / cancel: revert to the pre-gesture snapshot
      }
      phase = 'idle';
      movingIds = [];
      resizingId = null;
      resizeStart = null;
    };

    const onDown = (e: PointerEvent) => {
      if (editingIdRef.current) return; // interacting with live text — board gestures stand down
      const target = e.target as HTMLElement;
      const handleEl = target.closest('.board-handle') as HTMLElement | null;
      const boxEl = target.closest('.board-box') as HTMLElement | null;

      if (handleEl && boxEl) {
        const boxId = boxEl.dataset.boxId!;
        if (boxId !== selectedIdRef.current) return; // handle only active on the selected box
        startX = e.clientX; startY = e.clientY; ptype = e.pointerType; activePointerId = e.pointerId;
        beginResize(boxId);
        return;
      }

      if (!boxEl) {
        setSelectedId(null);
        return;
      }

      const boxId = boxEl.dataset.boxId!;
      setSelectedId(boxId);
      startX = e.clientX; startY = e.clientY; ptype = e.pointerType; activePointerId = e.pointerId;
      phase = 'pending';
      const box = boxesRef.current.find(b => b.id === boxId);
      const ids = box ? (box.groupId ? groupMembers(boxesRef.current, box.groupId).map(b => b.id) : [boxId]) : [boxId];
      if (ptype === 'touch' || ptype === 'pen') {
        longPressTimer = setTimeout(() => { if (phase === 'pending') beginMove(ids); }, LONG_PRESS_MS);
      } else {
        // mouse: stash the candidate ids; promoted to a real drag past the threshold in onMove
        movingIds = ids;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (phase === 'pending') {
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (ptype === 'mouse') {
          if (dist > MOUSE_DRAG_THRESHOLD) beginMove(movingIds);
        } else if (dist > TOUCH_CANCEL_THRESHOLD) {
          clearTimer();
          phase = 'idle';
        }
        return;
      }
      if (phase === 'dragging') {
        e.preventDefault();
        const dx = (e.clientX - startX) / pageWidthPx;
        const dy = (e.clientY - startY) / pageWidthPx;
        const ids = new Set(movingIds);
        setBoxes(startBoxes.map(b => (ids.has(b.id) ? { ...b, x: Math.max(0, b.x + dx), y: Math.max(0, b.y + dy) } : b)));
        return;
      }
      if (phase === 'resizing' && resizingId && resizeStart) {
        e.preventDefault();
        const dx = (e.clientX - startX) / pageWidthPx;
        const minW = resizeStart.kind === 'text' ? MIN_TEXT_W : MIN_INK_W;
        const newW = Math.max(minW, resizeStart.w + dx);
        setBoxes(startBoxes.map(b => {
          if (b.id !== resizingId) return b;
          if (b.kind === 'ink') return { ...b, w: newW, h: newW * resizeStart!.aspect };
          return { ...b, w: newW }; // text: height reflows via the measure effect
        }));
      }
    };

    const onUp = () => { finish(true); };
    const onCancel = () => { finish(false); };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    return () => {
      clearTimer();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
    };
  }, [pageWidthPx]);

  // Esc: exit edit mode, else deselect.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (editingIdRef.current) setEditingId(null);
      else if (selectedIdRef.current) setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Harness inspection seam (matches the wrizoNotebook/wrizoVocab convention).
  useEffect(() => {
    (window as unknown as { wrizoBoard?: unknown }).wrizoBoard = () => boxesRef.current;
    return () => { delete (window as unknown as { wrizoBoard?: unknown }).wrizoBoard; };
  }, []);

  if (!initialEntry) return null;

  const canvasHeightPx = Math.max((maxBottom(boxes) + 0.08) * pageWidthPx, VIEWPORT_MIN_PX);
  const backTo = project ? `/project/${project.id}` : '/journal';
  const title = initialEntry.text.trim() ? initialEntry.text.trim() : 'Untitled';

  const sorted = boxes.slice().sort((a, b) => a.z - b.z);

  const boardActionRow = selectedBox && (
    <div className="board-action-row" style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
      {selectedBox.groupId && <button type="button" className="btn-quiet" onClick={ungroup}>Ungroup</button>}
      <button type="button" className="btn-quiet" onClick={removeSelected}>Remove</button>
    </div>
  );

  const boardCanvas = (
    <div ref={wrapRef} className="board-canvas-wrap" style={{ overflow: 'auto', maxHeight: '78vh', border: '1px solid var(--ink-border)' }}>
      <div
        ref={canvasRef}
        className="board-canvas"
        style={{ position: 'relative', width: '100%', height: canvasHeightPx, background: 'var(--paper)' }}
        onDoubleClick={(e) => {
          const boxEl = (e.target as HTMLElement).closest('.board-box') as HTMLElement | null;
          const boxId = boxEl?.dataset.boxId;
          if (!boxId) return;
          const box = boxesRef.current.find(b => b.id === boxId);
          if (box?.kind === 'text') { setSelectedId(boxId); setEditingId(boxId); }
        }}
      >
        {sorted.map(box => {
          const selected = selectedIds.has(box.id);
          return (
            <div
              key={box.id}
              className="board-box"
              data-box-id={box.id}
              data-kind={box.kind}
              data-selected={selected ? 'true' : 'false'}
              data-grouped={box.groupId ? 'true' : 'false'}
              style={{
                position: 'absolute',
                left: box.x * pageWidthPx, top: box.y * pageWidthPx,
                width: box.w * pageWidthPx, height: box.h * pageWidthPx,
                zIndex: box.z,
              }}
            >
              {box.kind === 'ink' ? (
                <BoardInkBox box={box} pageWidthPx={pageWidthPx} />
              ) : (
                <BoardTextBox
                  // Review fix — remount per edit session: without this key,
                  // the SAME instance survives edit -> blur -> edit again, so
                  // its useState(() => escHtml(initialText)) initializer never
                  // re-runs — the second session's dangerouslySetInnerHTML
                  // renders the FIRST session's stale html, visibly reverting
                  // the box, and the next keystroke commits stale+new (a
                  // data-loss class bug). A fresh key per session forces a
                  // fresh mount, so the initializer re-seeds from current text.
                  key={editingId === box.id ? box.id + ':edit' : box.id}
                  boxId={box.id}
                  initialText={box.text ?? ''}
                  editing={editingId === box.id}
                  measureRef={measureRef}
                  onCommitText={commitText}
                  onBlurEdit={() => setEditingId(null)}
                />
              )}
              {selected && canResize && box.id === selectedId && (
                <div className="board-handle" data-handle="se" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // AB1 S1/S4 — framed (>=1100px): DeskFrame wraps the canvas (no mode strip;
  // no "Copy page text" analog exists on Board today, so S4's chrome-purge
  // line has nothing to remove here beyond what DeskFrame already omits).
  if (framed) {
    return (
      <div className="desk-frame-host">
        <div className="sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className="sprint-crumb" aria-label="Location">
            {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
            {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
            <span className="crumb-here">{title}</span>
          </div>
          <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {canUndo && <button type="button" className="btn-quiet" onClick={undo}>Undo</button>}
            <button type="button" className="btn-quiet" onClick={() => { flushNow(); navigate(backTo); }}>Done</button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <DeskFrame pageKind="prose">
          {boardActionRow}
          {boardCanvas}
        </DeskFrame>
      </div>
    );
  }

  return (
    <div className="page board-page" style={{ maxWidth: 1100, paddingTop: '2.5rem' }}>
      <div className="sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="sprint-crumb" aria-label="Location">
          {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
          {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
          <span className="crumb-here">{title}</span>
        </div>
        <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {canUndo && <button type="button" className="btn-quiet" onClick={undo}>Undo</button>}
          <button type="button" className="btn-quiet" onClick={() => { flushNow(); navigate(backTo); }}>Done</button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      {boardActionRow}
      {boardCanvas}
    </div>
  );
}

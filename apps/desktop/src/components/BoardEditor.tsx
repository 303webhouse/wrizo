import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getJournalEntry, saveBoardBoxes, flushNow, getDrawer, getProject,
  patchJournalEntry, getBoardsPinning, generateId,
} from '../store/persistence';
import { renderStroke } from '../store/ink';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { useWayBack } from './useWayBack';
import { useChromeDissolve } from './useChromeDissolve';
import { useLexicon } from '../store/themeLexicon';
import { describePageHome } from '../store/pageHome';
import { useCascade } from './Cascade';
import { AddToSheet } from './AddToSheet';
import { PortToBoardSheet } from './PortToBoardSheet';
import { PinToBoardSheet } from './PinToBoardSheet';
import { Sliver, type SliverContent } from './Sliver';
import type { PageFaceSubject } from './PageFace';
import { DeskFrame, useDeskFrameViewport } from './DeskFrame';
import type { Box, Project } from '../types';

// J4 — the Board: a canvas of positioned boxes (I2/I3 realized). Boxes only
// ever arrive via a port (J4 Slice 2) or, AB4 S2/S5, a pin (a membership
// card) or the sliver's own "Add card" tool — this editor selects, moves,
// resizes, groups/ungroups, edits text in place, and removes.
//
// AB4 — the Wall. S2 adds a 'page-pin' box kind (a membership card
// referencing a page by id, never a copy — BoardPinBox below always reads
// the referenced entry LIVE). S3 adds a 'connection' box kind (a hairline
// between two other cards' ids) — see the `Box` interface's own header
// comment in types/index.ts for the full zero-schema reasoning on why a
// connection is stored as a plain element of the SAME `boxes` array rather
// than a new field or a restructured column. S4 extends corner-drag resize
// to page-pin cards and wires double-click travel with a guaranteed way
// back (a `location.state.fromBoardId` chip on the target surface — see
// JournalEntry.tsx/PageEditor.tsx/ScriptEditor.tsx's own matching comment,
// mirroring the F2 warm-start precedent for one-shot navigation signals).
// S5 finally wires the cascade (strip/cascadeLayers) and the sliver (Add
// card, Connect toggle) — BoardEditor declares `pageKind="board"` instead
// of the standing `pageKind="prose"` placeholder a prior ticket flagged.

const AUTOSAVE_MS = 2000;
const LONG_PRESS_MS = 350;         // mirrors the S25-verified Spread gesture
const MOUSE_DRAG_THRESHOLD = 6;
const TOUCH_CANCEL_THRESHOLD = 12;
const MIN_TEXT_W = 0.15;
const MIN_INK_W = 0.08;
// AB4 S4 — a page-pin card resizes freeform on both axes (no aspect lock —
// it's not a drawing; no text-reflow — it's not live prose), unlike text
// (width-only, height reflows) or ink (aspect-locked).
const MIN_PIN_W = 0.15;
const MIN_PIN_H = 0.06;
const MEASURE_TOLERANCE_PX = 2;
const VIEWPORT_MIN_PX = 560;
// AB4 S2/S5 — matches persistence.ts's own BOARD_STACK_GAP (not exported;
// this file has never imported the port's internal layout constants, so a
// local mirror is the established shape here, same as pageWidthPx's own
// normalized-coordinate convention throughout this file).
const ADD_CARD_GAP = 0.08;
const NEW_CARD_W = 0.4;
const NEW_CARD_H = 0.08;

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

// AB4 S2 — a page-pin card: MEMBERSHIP, not capture. Reads the referenced
// entry LIVE at every render (getJournalEntry, the same "no cached
// snapshot" discipline the cascade's own panels use) — so it can never go
// stale, and pin/unpin never touches the referenced entry's own record.
function BoardPinBox({ box }: { box: Box }) {
  const { t: lex } = useLexicon();
  const entry = box.entryId ? getJournalEntry(box.entryId) : null;
  if (!entry) {
    return <div className="board-text board-pin board-pin-missing">Missing page</div>;
  }
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const trimmed = entry.text.trim();
  const title = trimmed ? trimmed.split('\n')[0].slice(0, 100) : (hasInk ? 'A sketch' : 'Untitled');
  const lines = trimmed.split('\n').filter(l => l.trim());
  const excerpt = lines.slice(1, 4).join(' ').slice(0, 160);
  return (
    <div className="board-text board-pin">
      <div className="board-pin-badge">{lex('board')} pin</div>
      <div className="board-pin-title">{title}</div>
      {excerpt && <div className="board-pin-excerpt">{excerpt}</div>}
    </div>
  );
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
  // AB1 S3 — the vanishing law, generalized to Board too. A Board has no
  // live pen-stroke authoring (J4: ink boxes only ever arrive via a port,
  // never drawn here), but committing text inside a selected text box IS
  // real keydown/words-producing input (the brief's own S3 wording: "any
  // words-producing input (keydown, pen stroke) dissolves every non-page
  // zone together" does not carve Board out) — wired here the same way
  // ScriptEditor wires its own dissolve: mounted unconditionally (so its
  // begin/endSession bookkeeping is uniform) but only ever triggered when
  // framed, since Board had no dissolve engine at all before this ticket.
  const boardDissolve = useChromeDissolve({ surface: 'board', editorSelector: '.board-canvas' });

  // W2 — route + mount identity only (S1: a Board's own view state — pan,
  // zoom, selection — already persists through its own store; no scroll/
  // caret to capture here).
  useWayBack({ entryId: id });

  const [boxes, setBoxes] = useState<Box[]>(() => initialEntry?.boxes ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [pageWidthPx, setPageWidthPx] = useState(700);
  // AB4 S3 — the connect-mode gesture: armed by the sliver's own toggle;
  // `pendingConnectFrom` is card A once picked, waiting for card B.
  const [connectMode, setConnectMode] = useState(false);
  const [pendingConnectFrom, setPendingConnectFrom] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  // AB4 S2 — the Page face's sending sheets (Move/Copy, Port, Pin) — Board
  // never had these before this ticket (S5's own "every surface carries the
  // same chrome system" closing line).
  const [portOpen, setPortOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const boxesRef = useRef(boxes);
  boxesRef.current = boxes;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const editingIdRef = useRef(editingId);
  editingIdRef.current = editingId;
  const connectModeRef = useRef(connectMode);
  connectModeRef.current = connectMode;
  const pendingConnectFromRef = useRef(pendingConnectFrom);
  pendingConnectFromRef.current = pendingConnectFrom;
  const selectedConnectionIdRef = useRef(selectedConnectionId);
  selectedConnectionIdRef.current = selectedConnectionId;
  const lastActionRef = useRef<LastAction>(null);
  const lastSavedRef = useRef(boxes);
  const measureEls = useRef<Map<string, HTMLDivElement>>(new Map());

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const project: Project | null = initialEntry?.projectId ? getProject(initialEntry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;

  // AB4 S5 — star/tag mutations + the Page face's subject, mirroring
  // JournalEntry.tsx/PageEditor.tsx/ScriptEditor.tsx's own patch-based
  // closures exactly (all four now share the identical shape). `initialEntry`
  // is re-read fresh every render (a plain call above, not useState — this
  // file's existing "no cached snapshot" discipline), so `.starred`/`.tags`
  // stay live across repeated toggles.
  const toggleStar = () => { if (!initialEntry) return; patchJournalEntry(id, initialEntry.text, { starred: !initialEntry.starred }); flushNow(); };
  const addTag = (tag: string) => {
    if (!initialEntry) return;
    const tags = initialEntry.tags ?? [];
    if (!tags.includes(tag)) patchJournalEntry(id, initialEntry.text, { tags: [...tags, tag] });
    flushNow();
  };
  const removeTag = (tag: string) => {
    if (!initialEntry) return;
    patchJournalEntry(id, initialEntry.text, { tags: (initialEntry.tags ?? []).filter(t => t !== tag) });
    flushNow();
  };

  // AB4 S5 — the cascade, replacing the standing "Board was never wired
  // into the cascade" gap (CD2's own note). `useCascade` is a HOOK: it must
  // run unconditionally, before the `if (!initialEntry) return null` guard
  // below (Rules of Hooks) — a harmless placeholder entry covers the
  // split-second `initialEntry` is genuinely null; nothing ever reads it,
  // since the component returns null right after this hook zone in that
  // case.
  const pinnedBoardTitles = initialEntry ? getBoardsPinning(initialEntry.id).map(b => b.title) : [];
  const { homeLabel, memberships } = describePageHome(
    initialEntry ?? { id, text: '', projectId: null, createdAt: '', updatedAt: '' },
    project,
    pinnedBoardTitles,
  );
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry: initialEntry ?? { id, text: '', projectId: null, createdAt: '', updatedAt: '' },
    homeLabel,
    memberships,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenMoveCopy: () => setAddOpen(true),
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: () => setPinOpen(true),
  };
  const cascade = useCascade({ subject: pageFaceSubject, project, navigate });

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
  // edit). Tolerance-gated so it never loops. page-pin/connection boxes are
  // never measured here (kind !== 'text' short-circuits, same as ink always
  // has).
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
    if (framed) boardDissolve.noteWrite(); // AB1 S3 — see the hook's mount comment above
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

  // AB4 S3 — removing a card also drops any hairline that referenced it (an
  // orphaned connection would point at nothing); one snapshot covers both,
  // so Undo restores the card AND its connections together.
  const removeSelected = () => {
    if (!selectedBox) return;
    snapshot('remove');
    const idsToRemove = selectedIds;
    setBoxes(prev => prev.filter(b => {
      if (idsToRemove.has(b.id)) return false;
      if (b.kind === 'connection' && (idsToRemove.has(b.connA ?? '') || idsToRemove.has(b.connB ?? ''))) return false;
      return true;
    }));
    setSelectedId(null);
  };

  // AB4 S3 — thread deletion: confirm-free (a thread is cheap; re-drawing is
  // one gesture, the brief's own words).
  const removeConnection = (connId: string) => {
    snapshot('remove');
    setBoxes(prev => prev.filter(b => b.id !== connId));
    setSelectedConnectionId(null);
  };

  // AB4 S5 — "Add card," the sliver's other hand tool: a blank text card,
  // dropped below the current content and opened straight into edit mode
  // (the anti-Canva guard still holds — content + position only; this just
  // adds ONE new way content can start, alongside a port and a pin).
  const onAddCard = () => {
    const y = maxBottom(boxesRef.current) + ADD_CARD_GAP;
    const maxZ = boxesRef.current.reduce((m, b) => Math.max(m, b.z), 0);
    const box: Box = { id: generateId(), kind: 'text', x: 0.05, y, w: NEW_CARD_W, h: NEW_CARD_H, z: maxZ + 1, text: '' };
    setBoxes(prev => [...prev, box]);
    setSelectedId(box.id);
    setEditingId(box.id);
  };

  // AB4 S4 — double-click travel from a page-pin card, "the board is one
  // Back away." `state.fromBoardId` is the guarantee: JournalEntry.tsx/
  // PageEditor.tsx/ScriptEditor.tsx's own framed nav row reads it and renders
  // a "‹ Back to the board" chip beside Done — the exact F2 warm-start
  // precedent for a one-shot `navigate(..., { state })` signal, applied to
  // routing instead of a landing glow. Framed-only by construction (every
  // target surface's chip only renders in ITS OWN framed branch).
  const travelToPin = (box: Box) => {
    if (!box.entryId) return;
    const target = getJournalEntry(box.entryId);
    if (!target) return;
    flushNow();
    const route = target.pageType != null ? `/page/${target.id}` : `/journal/${target.id}`;
    navigate(route, { state: { fromBoardId: id, fromBoardTitle: title } });
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

    // AB4 S3 — the connect-mode gesture's own click handler: card A, then
    // card B mints a hairline (de-duped either order); clicking the SAME
    // card again cancels the pending pick instead of connecting to itself.
    const handleConnectClick = (boxId: string) => {
      const from = pendingConnectFromRef.current;
      if (from == null) {
        pendingConnectFromRef.current = boxId;
        setPendingConnectFrom(boxId);
        return;
      }
      pendingConnectFromRef.current = null;
      setPendingConnectFrom(null);
      if (from === boxId) return; // same card twice — cancel, don't self-connect
      const a = from, b = boxId;
      const exists = boxesRef.current.some(x => x.kind === 'connection' && ((x.connA === a && x.connB === b) || (x.connA === b && x.connB === a)));
      if (exists) return;
      const maxZ = boxesRef.current.reduce((m, x) => Math.max(m, x.z), 0);
      const conn: Box = { id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: maxZ + 1, connA: a, connB: b };
      setBoxes(prev => [...prev, conn]);
    };

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

      // AB4 S3 — connect mode takes over pointer-down entirely while armed:
      // click card A, click card B; no select/move/resize happens
      // underneath while it's on.
      if (connectModeRef.current) {
        if (boxEl && !handleEl) handleConnectClick(boxEl.dataset.boxId!);
        return;
      }

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
      setSelectedConnectionId(null); // AB4 S3 — selecting a box clears any connection selection
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
        const minW = resizeStart.kind === 'text' ? MIN_TEXT_W : resizeStart.kind === 'ink' ? MIN_INK_W : MIN_PIN_W;
        const newW = Math.max(minW, resizeStart.w + dx);
        setBoxes(startBoxes.map(b => {
          if (b.id !== resizingId) return b;
          if (b.kind === 'ink') return { ...b, w: newW, h: newW * resizeStart!.aspect };
          if (b.kind === 'text') return { ...b, w: newW }; // text: height reflows via the measure effect
          // AB4 S4 — page-pin (and any other non-text/ink kind): freeform
          // resize on both axes — a fixed reference card, no aspect/reflow
          // concept to honor.
          const dy = (e.clientY - startY) / pageWidthPx;
          const newH = Math.max(MIN_PIN_H, resizeStart!.h + dy);
          return { ...b, w: newW, h: newH };
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

  // Esc: exit edit mode, else disarm connect mode, else deselect a
  // connection, else deselect a box. Delete/Backspace: remove a selected
  // connection (confirm-free, S3's own words) — guarded against a stray
  // Backspace while the writer is typing anywhere else on the page (the
  // isEditable check), so an unrelated edit can never eat a hairline.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingIdRef.current) { setEditingId(null); return; }
        if (connectModeRef.current) {
          setConnectMode(false);
          setPendingConnectFrom(null);
          return;
        }
        if (selectedConnectionIdRef.current) { setSelectedConnectionId(null); return; }
        if (selectedIdRef.current) { setSelectedId(null); return; }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionIdRef.current) {
        const ae = document.activeElement as HTMLElement | null;
        const editable = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
        if (editable) return;
        e.preventDefault();
        removeConnection(selectedConnectionIdRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // AB4 S3 — connections are hairlines, not cards: filtered out of the
  // positioned-card render loop (they never carry a real x/y/w/h) and drawn
  // as a separate SVG layer instead, deriving their endpoints LIVE from the
  // current boxes so a drag/resize drags the hairline with it for free.
  const visibleBoxes = boxes.filter(b => b.kind !== 'connection');
  const connections = boxes.filter(b => b.kind === 'connection');
  const sorted = visibleBoxes.slice().sort((a, b) => a.z - b.z);

  const boardActionRow = selectedBox && (
    <div className="board-action-row" style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
      {selectedBox.groupId && <button type="button" className="btn-quiet" onClick={ungroup}>Ungroup</button>}
      <button type="button" className="btn-quiet" onClick={removeSelected}>Remove</button>
    </div>
  );

  const boxCx = (b: Box) => (b.x + b.w / 2) * pageWidthPx;
  const boxCy = (b: Box) => (b.y + b.h / 2) * pageWidthPx;

  const boardCanvas = (
    <div ref={wrapRef} className="board-canvas-wrap" style={{ overflow: 'auto', maxHeight: '78vh', border: '1px solid var(--ink-border)' }}>
      <div
        ref={canvasRef}
        className="board-canvas"
        data-connect-mode={connectMode ? 'true' : 'false'}
        style={{ position: 'relative', width: '100%', height: canvasHeightPx, background: 'var(--paper)' }}
        onDoubleClick={(e) => {
          const boxEl = (e.target as HTMLElement).closest('.board-box') as HTMLElement | null;
          const boxId = boxEl?.dataset.boxId;
          if (!boxId) return;
          const box = boxesRef.current.find(b => b.id === boxId);
          if (box?.kind === 'text') { setSelectedId(boxId); setEditingId(boxId); }
          else if (box?.kind === 'page-pin') { travelToPin(box); }
        }}
      >
        {/* AB4 S3 — the threads layer: hairlines between cards, quiet at
            rest, olive only while connect mode is armed (nothing orange at
            rest anywhere new); a selected hairline goes brass, matching the
            selection treatment every other board element already carries.
            pointer-events:none on the group; each line opts back in via its
            own stroke so clicking elsewhere on the canvas is unaffected. */}
        <svg
          className="board-connections"
          data-connect-mode={connectMode ? 'true' : 'false'}
          width="100%"
          height={canvasHeightPx}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          {connections.map(conn => {
            const a = boxes.find(b => b.id === conn.connA);
            const b = boxes.find(b => b.id === conn.connB);
            if (!a || !b) return null;
            const x1 = boxCx(a), y1 = boxCy(a), x2 = boxCx(b), y2 = boxCy(b);
            const selected = conn.id === selectedConnectionId;
            return (
              <g key={conn.id} data-connection-id={conn.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="board-connection-hit"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={() => { setSelectedConnectionId(conn.id); setSelectedId(null); }} />
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="board-connection-line" data-selected={selected ? 'true' : 'false'} />
              </g>
            );
          })}
        </svg>
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
              data-connect-pending={box.id === pendingConnectFrom ? 'true' : 'false'}
              style={{
                position: 'absolute',
                left: box.x * pageWidthPx, top: box.y * pageWidthPx,
                width: box.w * pageWidthPx, height: box.h * pageWidthPx,
                zIndex: box.z,
              }}
            >
              {box.kind === 'ink' ? (
                <BoardInkBox box={box} pageWidthPx={pageWidthPx} />
              ) : box.kind === 'page-pin' ? (
                <BoardPinBox box={box} />
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

  // AB4 S5 — the board's own two hand tools, fenced to exactly these
  // (nothing else v1 — minimum options).
  const sliverContent: SliverContent = {
    kind: 'board',
    onAddCard,
    connect: {
      on: connectMode,
      onToggle: (next) => {
        setConnectMode(next);
        if (!next) setPendingConnectFrom(null); // Escape's own disarm law, mirrored for the toggle itself
      },
    },
  };

  const pageFaceSheets = (
    <>
      {portOpen && <PortToBoardSheet sourceIds={[id]} onClose={() => setPortOpen(false)} />}
      {addOpen && (
        <AddToSheet
          sourceIds={[id]}
          onClose={() => setAddOpen(false)}
          onDone={() => setAddOpen(false)}
        />
      )}
      {pinOpen && <PinToBoardSheet entryId={id} onClose={() => setPinOpen(false)} />}
    </>
  );

  // AB4 S5 — framed (>=1100px): DeskFrame now carries the strip, the
  // cascade's reach/survey layers, and the board's own sliver — the
  // standing gap CD2 left behind ("Board still passes nothing here...
  // AB4/the Wall stays out of this ticket's scope") closes here.
  if (framed) {
    return (
      <div className="desk-frame-host" data-chrome-receded={boardDissolve.dissolved ? 'true' : 'false'}>
        {/* ab1.1 R1 (Fable review) — the nav row was the one piece of framed
            chrome that never recessed with the rest of the room. */}
        <div className="chrome-fade chrome-top sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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

        <DeskFrame
          pageKind="board"
          strip={cascade.strip}
          cascadeLayers={cascade.layers}
          sliver={<Sliver content={sliverContent} goalText="" />}
          dissolved={boardDissolve.dissolved}
        >
          {/* ab2.1 F2 (geometry-sanity sweep) caught the same class of bug
              as F1, previously unchecked here: .desk-frame-stage is a
              display:flex ROW expecting ONE child. boardActionRow and
              boardCanvas were passed as two separate children with no
              width-establishing wrapper (unlike PageEditorView's
              .mode-pagecol or ScriptEditor's .desk-frame-scroll-cap), so
              they laid out side by side, each shrinking to fit-content —
              .board-canvas-wrap rendered at ~2px. legacy's own
              board-page container caps at maxWidth:1100 (board wants more
              room than prose's 720/760 measure); mirrored here. */}
          <div style={{ width: 'min(100%, 1100px)', display: 'flex', flexDirection: 'column' }}>
            {boardActionRow}
            {boardCanvas}
          </div>
        </DeskFrame>

        {pageFaceSheets}
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

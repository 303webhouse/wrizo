import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { Box, JournalEntry, StoredFace } from '../../types';
import { useDeskLexicon } from '../../store/deskLexicon';
import { generateId, getJournalEntry, getJournalEntryIncludingDeleted, getSystemKind, saveBoardBoxes, stashDeletedBoxes } from '../../store/persistence';
import { liveBoxes } from '../../store/boxTombstones';
import { homeViewOf, kindOf, viewsOf, type BoardView } from '../../store/boardKind';
import { cardTypeStyle, ensureFaceLoaded } from '../../store/fontRoster';
import { promptToShow } from '../../store/guided';
import { registerFlush } from '../../store/flushRegistry';
import { requestDelete } from '../../store/deleteGate';
import {
  BOARD_MAX_Y, MEASURE_TOLERANCE_PX, MIN_TEXT_H, MIN_TEXT_W, MOUSE_DRAG_THRESHOLD, NEW_CARD_H, NEW_CARD_W, groupMembers, naturalPx, notecardExcerpt,
} from '../../components/board/geometry';
import { BoardInkBox, BoardPinBox, BoardTextBox } from '../../components/board/BoardBoxes';
import { BoardCardPopup } from '../../components/board/BoardCardPopup';
import { OutlineProjection, StoryboardProjection } from '../../components/BoardProjection';
import { useActionToast } from '../../components/ActionToast';

// A BOARD IN THE SPLIT (reorg plan v2.1 §3b, ARBOR item 2; stage menus B2, Nick: "A Board in the split keeps its views, pans and zooms"; Fable, Nov 20
// 11:45 pm: 2a look-only, 2b editing straight after on THIS surface; Nov 21 12:10 am, 2b's approach accepted). The cards are drawn here by the Board's own
// card components; BoardEditor is never mounted beside a page: it owns the route, the room and window-wide keys.
//
// 2a, THE CANVAS. The cards stand where they stand on the Board: x and y are fractions of the canvas WIDTH (BoardEditor's own rule, both axes over the
// width), and the canvas is as wide as the split's side at scale 1. The Board's views are offered as far as they read without the Board's screen: Open
// (this canvas), Storyboard and Outline (the Board's own projections, read-only); the Walk and a book's pages stay on the Board's own screen. A drag on
// the empty canvas pans; Ctrl+wheel zooms about the pointer, the buttons about the middle; a plain wheel pans. The view, the pan and the zoom are never
// kept: they live while the split stands (the parent keys this component by the asset).
//
// 2b, EDITING ON THE OPEN CANVAS. A press selects a card; a drag moves it (its group with it); the selected text card's corner handle resizes it, never
// below the Board's own minimum; a double-click on a text card opens the Board's own card editor (BoardCardPopup, `scoped`: the split's side stops keys at
// its edge, so the pop-up listens on its own dialog); a double-click on the empty canvas makes a card there, kept only once it has words (closed empty,
// it was never written - the Board's click-to-create rule); Delete asks the Board's own question and leaves a TOMBSTONE (stashDeletedBoxes, the Board's
// path); Ctrl+Z takes back the last move, resize, add or delete (geometry and membership only: an undo never takes back words). The board is written
// only through saveBoardBoxes and stashDeletedBoxes, each act once at its end; the card editor's words are held for a moment and written on close, on
// the timer, on unmount and on the sign-out flush (registerFlush). Ink, link drags and Outline/Storyboard editing stay look-only, and a system board
// (getSystemKind) or a board in the Trash is look-only throughout. Every listener is this component's own element's: the page beside it never hears
// the canvas, and the canvas never hears the page or the card editor.

const SPLIT_VIEWS: BoardView[] = ['open', 'storyboard', 'outline'];
const VIEW_WORD: Record<string, 'boardModeOpen' | 'boardModeStoryboard' | 'boardModeOutline'> = { open: 'boardModeOpen', storyboard: 'boardModeStoryboard', outline: 'boardModeOutline' };
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;       // a button press or a key
const WHEEL_RATE = 0.002;     // Ctrl+wheel: the scale changes by e^(-deltaY * rate)
const TEXT_SAVE_MS = 600;     // the card editor's words reach the board this long after the last keystroke (and at once on close)
const UNDO_MAX = 50;
const DRAWN = new Set<Box['kind']>(['text', 'ink', 'page-pin']);
const noop = () => {};

const clampScale = (s: number): number => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s));
const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), Math.max(lo, hi));

type Gesture =
  | { kind: 'pan'; id: number; x0: number; y0: number; px: number; py: number; moved: boolean }
  | { kind: 'move'; id: number; x0: number; y0: number; ids: string[]; moved: boolean }
  | { kind: 'resize'; id: number; x0: number; y0: number; box: string; moved: boolean };
type Ghost = { kind: 'move'; ids: string[]; dx: number; dy: number } | { kind: 'resize'; box: string; w: number; h: number } | null;

export function SplitBoard({ entry }: { entry: JournalEntry }) {
  const { t } = useDeskLexicon();
  const toast = useActionToast();
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const id = entry.id;
  const stored = getJournalEntry(id);
  const cur = stored ?? entry;
  // a system board's cards are derived from elsewhere, and a board in the Trash is read, never edited: both stay look-only
  const editable = !!stored && !stored.deletedAt && !getSystemKind(stored);
  const offered = viewsOf(kindOf(cur)).filter((v) => SPLIT_VIEWS.includes(v));
  const home = homeViewOf(cur);
  const [view, setView] = useState<BoardView>(offered.includes(home) ? home : 'open');
  const [cam, setCam] = useState({ s: 1, x: 0, y: 0 });
  const camRef = useRef(cam);
  camRef.current = cam;
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const gestureRef = useRef<Gesture | null>(null);
  const [panning, setPanning] = useState(false);
  const [ghost, setGhost] = useState<Ghost>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [popupId, setPopupId] = useState<string | null>(null);
  // the card a double-click on the empty canvas made: drawn, not written, until its first word
  const [fresh, setFresh] = useState<Box | null>(null);
  const freshRef = useRef<Box | null>(null);
  freshRef.current = fresh;
  const madeRef = useRef<string | null>(null);          // the made card once written: closed empty, it goes again
  const textRef = useRef<{ id: string; text: string; changed: boolean } | null>(null);
  const textTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoRef = useRef<Box[][]>([]);
  const fitRef = useRef<string | null>(null);

  const storedLive = (): Box[] => liveBoxes(getJournalEntry(id)?.boxes);
  const write = (next: Box[], restored?: string[]) => { saveBoardBoxes(id, next, restored); bump(); };
  const pushUndo = (before: Box[]) => { undoRef.current.push(before); if (undoRef.current.length > UNDO_MAX) undoRef.current.shift(); };

  // the card editor's words, held: written onto the latest stored board, so a move made meanwhile is never undone by them
  const flushText = () => {
    if (textTimer.current) { clearTimeout(textTimer.current); textTimer.current = null; }
    const p = textRef.current;
    if (!p || !p.changed) return;
    p.changed = false;
    const all = storedLive();
    if (!all.some((b) => b.id === p.id && b.text !== p.text)) return;
    write(all.map((b) => (b.id === p.id ? { ...b, text: p.text } : b)));
  };
  const flushRef = useRef(flushText);
  flushRef.current = flushText;
  useEffect(() => {
    const unregister = registerFlush(() => flushRef.current());
    return () => { unregister(); flushRef.current(); };
  }, []);

  // the card editor's three doors, read through a ref: the pop-up keeps the callbacks it was mounted with
  const onText = (boxId: string, text: string) => {
    const f = freshRef.current;
    if (f && f.id === boxId) {
      if (!text.trim()) return;
      const before = storedLive();
      pushUndo(before);
      write([...before, { ...f, text }]);
      madeRef.current = f.id;
      freshRef.current = null;
      setFresh(null);
      textRef.current = { id: boxId, text, changed: false };
      return;
    }
    textRef.current = { id: boxId, text, changed: true };
    if (textTimer.current) clearTimeout(textTimer.current);
    textTimer.current = setTimeout(() => flushRef.current(), TEXT_SAVE_MS);
  };
  const onType = (boxId: string, patch: { fontFace?: StoredFace; fontSize?: number }) => {
    if (patch.fontFace) void ensureFaceLoaded(patch.fontFace.name);
    flushText();
    write(storedLive().map((b) => {
      if (b.id !== boxId) return b;
      const next = { ...b, ...patch };
      if ('fontFace' in patch && !patch.fontFace) delete next.fontFace;   // undefined CLEARS the face (the Board's rule)
      return next;
    }));
  };
  const onClosePopup = (boxId: string) => {
    const touched = !!textRef.current && textRef.current.id === boxId && (textRef.current.changed || madeRef.current === boxId);
    flushText();
    textRef.current = null;
    if (freshRef.current && freshRef.current.id === boxId) { freshRef.current = null; setFresh(null); setSelected(null); }   // never written: nothing to take back
    else if (madeRef.current === boxId) {
      const made = storedLive().find((b) => b.id === boxId);
      if (made && made.kind === 'text' && !(made.text ?? '').trim()) {   // made here and emptied again: it goes, and so does its undo step
        undoRef.current.pop();
        write(storedLive().filter((b) => b.id !== boxId));
        setSelected(null);
      } else if (touched) fitRef.current = boxId;
    } else if (touched) fitRef.current = boxId;
    madeRef.current = null;
    setPopupId(null);
    bump();
  };
  const popupRef = useRef({ onText, onType, onClosePopup });
  popupRef.current = { onText, onType, onClosePopup };

  // a card whose words changed grows to fit them (the Board fits a touched card the same way); never shrinks
  useLayoutEffect(() => {
    const boxId = fitRef.current;
    if (!boxId || width <= 0) return;
    fitRef.current = null;
    const el = canvasRef.current?.querySelector<HTMLElement>(`[data-split-box="${CSS.escape(boxId)}"]`);
    const b = storedLive().find((x) => x.id === boxId);
    if (!el || !b) return;
    const px = naturalPx(el);
    if (px > b.h * width + MEASURE_TOLERANCE_PX) write(storedLive().map((x) => (x.id === boxId ? { ...x, h: Math.min(px / width, BOARD_MAX_Y - x.y) } : x)));
  });

  // the canvas is as wide as the split's side (scale 1); a grip move re-measures it
  useLayoutEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    const measure = () => setWidth(w.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(w);
    return () => ro.disconnect();
  }, [view]);

  // zoom to `s` keeping the canvas point under (cx, cy) - the wrap's own coordinates - where it is
  const zoomAt = (s: number, cx: number, cy: number) => {
    const c = camRef.current;
    const next = clampScale(s);
    const ux = (cx - c.x) / c.s, uy = (cy - c.y) / c.s;
    setCam({ s: next, x: cx - ux * next, y: cy - uy * next });
  };
  const zoomMiddle = (factor: number) => {
    const w = wrapRef.current;
    if (!w) return;
    zoomAt(camRef.current.s * factor, w.clientWidth / 2, w.clientHeight / 2);
  };
  const fit = () => setCam({ s: 1, x: 0, y: 0 });

  // the wheel is listened to on the canvas's own element, not passive, so a Ctrl+wheel zooms the canvas and never the window
  useEffect(() => {
    const w = wrapRef.current;
    if (!w || view !== 'open') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = w.getBoundingClientRect();
      if (e.ctrlKey) zoomAt(camRef.current.s * Math.exp(-e.deltaY * WHEEL_RATE), e.clientX - r.left, e.clientY - r.top);
      else setCam((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }));
    };
    w.addEventListener('wheel', onWheel, { passive: false });
    return () => w.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const W = width;
  // a drag's delta in board units (fractions of the width), the move kept inside the board for every card it carries
  const moveDelta = (ids: string[], dxPx: number, dyPx: number) => {
    const s = camRef.current.s;
    const all = storedLive().filter((b) => ids.includes(b.id));
    let dx = dxPx / (W * s), dy = dyPx / (W * s);
    dx = clamp(dx, Math.max(...all.map((b) => -b.x)), Math.min(...all.map((b) => 1 - b.w - b.x)));
    dy = clamp(dy, Math.max(...all.map((b) => -b.y)), Math.min(...all.map((b) => BOARD_MAX_Y - b.h - b.y)));
    return { dx, dy };
  };
  const resizeTo = (boxId: string, dxPx: number, dyPx: number) => {
    const s = camRef.current.s;
    const b = storedLive().find((x) => x.id === boxId);
    if (!b) return null;
    return { w: clamp(b.w + dxPx / (W * s), MIN_TEXT_W, 1 - b.x), h: clamp(b.h + dyPx / (W * s), MIN_TEXT_H, BOARD_MAX_Y - b.y) };
  };

  // a press on a card selects it and may become its move (or, on the corner handle, its resize); a press on the empty canvas may become a pan
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !wrapRef.current?.contains(e.target as Node)) return;   // a press in the card editor (a portal) is the editor's
    const target = e.target as Element;
    const boxEl = target.closest?.('[data-split-box]');
    const start = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
    if (boxEl) {
      if (!editable) return;   // a look-only board leaves its cards alone
      const boxId = boxEl.getAttribute('data-split-box') ?? '';
      if (freshRef.current && freshRef.current.id === boxId) return;
      const all = storedLive();
      const b = all.find((x) => x.id === boxId);
      if (!b) return;
      setSelected(boxId);
      const group = b.groupId ? groupMembers(all, b.groupId).map((x) => x.id) : [boxId];
      gestureRef.current = target.closest('[data-split-resize]') ? { kind: 'resize', box: boxId, ...start } : { kind: 'move', ids: group, ...start };
    } else {
      gestureRef.current = { kind: 'pan', px: camRef.current.x, py: camRef.current.y, ...start };
      setPanning(true);
    }
    wrapRef.current.focus({ preventScroll: true });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* a pointer the browser no longer tracks: the drag still reads its moves */ }
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.id !== e.pointerId) return;
    const dxPx = e.clientX - g.x0, dyPx = e.clientY - g.y0;
    if (!g.moved && Math.hypot(dxPx, dyPx) < (g.kind === 'pan' ? 1 : MOUSE_DRAG_THRESHOLD)) return;
    g.moved = true;
    if (g.kind === 'pan') setCam((c) => ({ ...c, x: g.px + dxPx, y: g.py + dyPx }));
    else if (g.kind === 'move') setGhost({ kind: 'move', ids: g.ids, ...moveDelta(g.ids, dxPx, dyPx) });
    else { const r = resizeTo(g.box, dxPx, dyPx); if (r) setGhost({ kind: 'resize', box: g.box, ...r }); }
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.id !== e.pointerId) return;
    gestureRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    setGhost(null);
    if (g.kind === 'pan') { setPanning(false); if (!g.moved) setSelected(null); return; }
    if (!g.moved || e.type === 'pointercancel') return;
    const dxPx = e.clientX - g.x0, dyPx = e.clientY - g.y0;
    flushText();
    const before = storedLive();
    if (g.kind === 'move') {
      const { dx, dy } = moveDelta(g.ids, dxPx, dyPx);
      if (dx === 0 && dy === 0) return;
      pushUndo(before);
      write(before.map((b) => (g.ids.includes(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } : b)));
    } else {
      const r = resizeTo(g.box, dxPx, dyPx);
      if (!r) return;
      pushUndo(before);
      write(before.map((b) => (b.id === g.box ? { ...b, w: r.w, h: r.h } : b)));
    }
  };

  // a double-click on a hand-typed text card opens the Board's own card editor; on the empty canvas it makes a card there
  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || view !== 'open' || !wrapRef.current?.contains(e.target as Node) || popupId) return;
    const boxEl = (e.target as Element).closest?.('[data-split-box]');
    if (boxEl) {
      const b = storedLive().find((x) => x.id === boxEl.getAttribute('data-split-box'));
      if (b && b.kind === 'text' && !b.sourceEntryId) { setSelected(b.id); setPopupId(b.id); }
      return;
    }
    const c = canvasRef.current;
    if (!c || W <= 0) return;
    const r = c.getBoundingClientRect(), s = camRef.current.s;
    const all = storedLive();
    const box: Box = {
      id: generateId(), kind: 'text', text: '', w: NEW_CARD_W, h: NEW_CARD_H, z: all.reduce((m, b) => Math.max(m, b.z), 0) + 1,
      x: clamp((e.clientX - r.left) / (W * s), 0, 1 - NEW_CARD_W), y: clamp((e.clientY - r.top) / (W * s), 0, BOARD_MAX_Y - NEW_CARD_H),
    };
    freshRef.current = box;
    setFresh(box);
    setSelected(box.id);
    setPopupId(box.id);
  };

  const undo = () => {
    flushText();
    const before = undoRef.current.pop();
    if (!before) return;
    const now = new Map(storedLive().map((b) => [b.id, b]));
    // the cards the undo brings BACK are named to the save (it otherwise keeps a tombstone standing); a card still here keeps its words and face
    const restored = before.filter((b) => !now.has(b.id)).map((b) => b.id);
    write(before.map((b) => { const n = now.get(b.id); return n ? { ...n, x: b.x, y: b.y, w: b.w, h: b.h, z: b.z } : b; }), restored);
    setSelected(null);
  };
  const removeSelected = (boxId: string) => {
    const all = storedLive();
    const b = all.find((x) => x.id === boxId);
    if (!b) return;
    const ids = b.groupId ? groupMembers(all, b.groupId).map((x) => x.id) : [boxId];
    requestDelete(() => {
      flushText();
      const before = storedLive();
      pushUndo(before);
      saveBoardBoxes(id, before);          // the Board's order: the card is in storage before it is stamped
      stashDeletedBoxes(id, ids);
      setSelected(null);
      bump();
      toast.show(`${t('toastCardDeleted')}  ·  Ctrl+Z`);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as Node;
    if (view !== 'open' || !rootRef.current?.contains(target)) return;   // the card editor's keys (a portal) are its own
    const inCanvas = !!wrapRef.current?.contains(target);
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      if (inCanvas && editable) { e.preventDefault(); undo(); }
      return;
    }
    if (mod || e.altKey) return;
    if (inCanvas && e.key === 'Escape' && selected) { e.preventDefault(); setSelected(null); return; }
    if (inCanvas && editable && selected && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); removeSelected(selected); return; }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomMiddle(ZOOM_STEP); }
    else if (e.key === '-') { e.preventDefault(); zoomMiddle(1 / ZOOM_STEP); }
    else if (e.key === '0') { e.preventDefault(); fit(); }
  };

  const boxes = liveBoxes(cur.boxes);
  const pending = textRef.current;
  const drawn = [...boxes.filter((b) => DRAWN.has(b.kind)), ...(fresh ? [fresh] : [])].map((b) => {
    let x = b;
    if (pending && pending.id === b.id) x = { ...x, text: pending.text };
    if (ghost && ghost.kind === 'move' && ghost.ids.includes(b.id)) x = { ...x, x: b.x + ghost.dx, y: b.y + ghost.dy };
    if (ghost && ghost.kind === 'resize' && ghost.box === b.id) x = { ...x, w: ghost.w, h: ghost.h };
    return x;
  });
  const H = Math.max(W * 0.6, ...drawn.map((b) => (b.y + b.h) * W)) + 24;
  const label = (b: Box): string => {
    if (b.kind === 'page-pin') {
      const e = b.entryId ? getJournalEntryIncludingDeleted(b.entryId) : null;
      return e ? (notecardExcerpt(e.text ?? '').title || t('boardThreadUntitled')) : t('boardThreadUntitled');
    }
    return notecardExcerpt(b.text ?? '').title || t('boardThreadUntitled');
  };
  const scaleMark = String(Math.round(cam.s * 1000) / 1000);
  const panMark = `${Math.round(cam.x) || 0},${Math.round(cam.y) || 0}`;
  const popupBox = popupId ? drawn.find((b) => b.id === popupId) ?? null : null;

  return (
    <div ref={rootRef} className="wz-split-board" data-split-board="" data-view={view} data-scale={scaleMark} data-pan={panMark} data-editable={editable ? 'true' : undefined} onKeyDown={onKeyDown}>
      <div className="wz-split-board-bar">
        <div className="wz-split-board-views" data-split-views="" role="group" aria-label={t('reorgSplitViews')}>
          {offered.map((v) => (
            <button key={v} type="button" data-split-view={v} aria-pressed={view === v ? 'true' : 'false'} onClick={() => setView(v)}>{t(VIEW_WORD[v])}</button>
          ))}
        </div>
        {view === 'open' && (
          <div className="wz-split-board-zoom" role="group">
            <button type="button" data-split-zoom="out" aria-label={t('reorgSplitZoomOut')} title={t('reorgSplitZoomOut')} disabled={cam.s <= ZOOM_MIN} onClick={() => zoomMiddle(1 / ZOOM_STEP)}>−</button>
            <button type="button" data-split-zoom="fit" onClick={fit}>{t('reorgSplitZoomFit')}</button>
            <button type="button" data-split-zoom="in" aria-label={t('reorgSplitZoomIn')} title={t('reorgSplitZoomIn')} disabled={cam.s >= ZOOM_MAX} onClick={() => zoomMiddle(ZOOM_STEP)}>+</button>
          </div>
        )}
      </div>
      {view === 'open' ? (
        <div ref={wrapRef} className="wz-split-board-wrap" data-split-board-wrap="" data-panning={panning ? 'true' : undefined} tabIndex={0}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onDoubleClick={onDoubleClick}>
          {drawn.length === 0 && <p className="wz-split-board-empty">{t('reorgSplitBoardEmpty')}</p>}
          {W > 0 && (
            <div ref={canvasRef} className="wz-split-board-canvas board-canvas" data-split-board-canvas=""
              style={{ width: W, height: H, transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})` }}>
              {drawn.map((box) => (
                <div key={box.id} className={`board-box${selected === box.id ? ' is-selected' : ''}`} data-split-box={box.id} data-kind={box.kind}
                  data-selected={selected === box.id ? 'true' : undefined}
                  style={{ position: 'absolute', left: box.x * W, top: box.y * W, width: box.w * W, height: box.h * W, zIndex: box.z }}>
                  {box.kind === 'ink' ? <BoardInkBox box={box} pageWidthPx={W} />
                    : box.kind === 'page-pin' ? <BoardPinBox box={box} />
                    : <BoardTextBox boxId={box.id} initialText={box.text ?? ''} measureRef={noop} sourceEntryId={box.sourceEntryId}
                        typeStyle={cardTypeStyle(box.fontFace, box.fontSize)} prompt={promptToShow(box)} />}
                  {editable && selected === box.id && box.kind === 'text' && !box.groupId && !(fresh && fresh.id === box.id) && <div className="wz-split-handle" data-split-resize="" aria-hidden="true" />}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="wz-split-board-list">
          {view === 'storyboard'
            ? <StoryboardProjection boxes={boxes} setBoxes={noop} labelFor={label} onEditText={noop} readOnly />
            : <OutlineProjection boxes={boxes} setBoxes={noop} labelFor={label} onEditText={noop} readOnly />}
        </div>
      )}
      {popupBox && view === 'open' && (
        <BoardCardPopup key={popupBox.id} scoped initialText={popupBox.text ?? ''} prompt={!popupBox.sourceEntryId ? popupBox.prompt : undefined}
          fontFace={popupBox.fontFace} fontSize={popupBox.fontSize}
          onCommit={(text) => popupRef.current.onText(popupBox.id, text)}
          onType={(patch) => popupRef.current.onType(popupBox.id, patch)}
          onClose={() => popupRef.current.onClosePopup(popupBox.id)} />
      )}
      {toast.node}
    </div>
  );
}

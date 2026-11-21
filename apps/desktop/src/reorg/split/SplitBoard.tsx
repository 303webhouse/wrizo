import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Box, JournalEntry } from '../../types';
import { useDeskLexicon } from '../../store/deskLexicon';
import { getJournalEntryIncludingDeleted } from '../../store/persistence';
import { liveBoxes } from '../../store/boxTombstones';
import { homeViewOf, kindOf, viewsOf, type BoardView } from '../../store/boardKind';
import { cardTypeStyle } from '../../store/fontRoster';
import { promptToShow } from '../../store/guided';
import { notecardExcerpt } from '../../components/board/geometry';
import { BoardInkBox, BoardPinBox, BoardTextBox } from '../../components/board/BoardBoxes';
import { OutlineProjection, StoryboardProjection } from '../../components/BoardProjection';

// A BOARD IN THE SPLIT, 2a: THE LOOK-ONLY CANVAS (reorg plan v2.1 §3b, ARBOR item 2; stage menus B2, Nick: "A Board in the split keeps its views, pans
// and zooms"; Fable, Nov 20 11:45 pm: 2a look-only, 2b editing straight after on THIS surface - so the cards are drawn here, by the Board's own card
// components, and 2b adds its edits to this component; BoardEditor is never mounted beside a page: it owns the route, the room and window-wide keys).
//
// The cards stand where they stand on the Board: x and y are fractions of the canvas WIDTH (BoardEditor's own rule, both axes over the width), and the
// canvas is as wide as the split's side at scale 1. The Board's views are offered as far as they read without the Board's screen: Open (this canvas),
// Storyboard and Outline (the Board's own projections, read-only); the Walk and a book's pages stay on the Board's own screen. A drag on the empty
// canvas pans; Ctrl+wheel zooms about the pointer, the buttons about the middle; a plain wheel pans. NOTHING IS KEPT: the view, the pan and the zoom
// live while the split stands (the parent keys this component by the asset, so another asset, or the split opened again, starts at home).
// NOTHING IS WRITTEN, and every listener is this component's own element's: the page beside it never hears the canvas, and the canvas never hears
// the page.

const SPLIT_VIEWS: BoardView[] = ['open', 'storyboard', 'outline'];
const VIEW_WORD: Record<string, 'boardModeOpen' | 'boardModeStoryboard' | 'boardModeOutline'> = { open: 'boardModeOpen', storyboard: 'boardModeStoryboard', outline: 'boardModeOutline' };
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;       // a button press or a key
const WHEEL_RATE = 0.002;     // Ctrl+wheel: the scale changes by e^(-deltaY * rate)
const DRAWN = new Set<Box['kind']>(['text', 'ink', 'page-pin']);
const noop = () => {};

const clampScale = (s: number): number => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s));

export function SplitBoard({ entry }: { entry: JournalEntry }) {
  const { t } = useDeskLexicon();
  const offered = viewsOf(kindOf(entry)).filter((v) => SPLIT_VIEWS.includes(v));
  const home = homeViewOf(entry);
  const [view, setView] = useState<BoardView>(offered.includes(home) ? home : 'open');
  const [cam, setCam] = useState({ s: 1, x: 0, y: 0 });
  const camRef = useRef(cam);
  camRef.current = cam;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const panRef = useRef<{ id: number; x0: number; y0: number; px: number; py: number } | null>(null);
  const [panning, setPanning] = useState(false);

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

  // a drag on the EMPTY canvas pans (a card is left for 2b's own drag)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as Element).closest?.('[data-split-box]')) return;
    panRef.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, px: camRef.current.x, py: camRef.current.y };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* a pointer the browser no longer tracks: the drag still reads its moves */ }
    setPanning(true);
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    if (!p || p.id !== e.pointerId) return;
    setCam((c) => ({ ...c, x: p.px + (e.clientX - p.x0), y: p.py + (e.clientY - p.y0) }));
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    if (!p || p.id !== e.pointerId) return;
    panRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    setPanning(false);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (view !== 'open' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomMiddle(ZOOM_STEP); }
    else if (e.key === '-') { e.preventDefault(); zoomMiddle(1 / ZOOM_STEP); }
    else if (e.key === '0') { e.preventDefault(); fit(); }
  };

  const boxes = liveBoxes(entry.boxes);
  const cards = boxes.filter((b) => DRAWN.has(b.kind));
  const W = width;
  const H = Math.max(W * 0.6, ...cards.map((b) => (b.y + b.h) * W)) + 24;
  const label = (b: Box): string => {
    if (b.kind === 'page-pin') {
      const e = b.entryId ? getJournalEntryIncludingDeleted(b.entryId) : null;
      return e ? (notecardExcerpt(e.text ?? '').title || t('boardThreadUntitled')) : t('boardThreadUntitled');
    }
    return notecardExcerpt(b.text ?? '').title || t('boardThreadUntitled');
  };
  const scaleMark = String(Math.round(cam.s * 1000) / 1000);
  const panMark = `${Math.round(cam.x) || 0},${Math.round(cam.y) || 0}`;

  return (
    <div className="wz-split-board" data-split-board="" data-view={view} data-scale={scaleMark} data-pan={panMark} onKeyDown={onKeyDown}>
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
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
          {cards.length === 0 && <p className="wz-split-board-empty">{t('reorgSplitBoardEmpty')}</p>}
          {W > 0 && (
            <div className="wz-split-board-canvas board-canvas" data-split-board-canvas=""
              style={{ width: W, height: H, transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})` }}>
              {cards.map((box) => (
                <div key={box.id} className="board-box" data-split-box={box.id} data-kind={box.kind}
                  style={{ position: 'absolute', left: box.x * W, top: box.y * W, width: box.w * W, height: box.h * W, zIndex: box.z }}>
                  {box.kind === 'ink' ? <BoardInkBox box={box} pageWidthPx={W} />
                    : box.kind === 'page-pin' ? <BoardPinBox box={box} />
                    : <BoardTextBox boxId={box.id} initialText={box.text ?? ''} measureRef={noop} sourceEntryId={box.sourceEntryId}
                        typeStyle={cardTypeStyle(box.fontFace, box.fontSize)} prompt={promptToShow(box)} />}
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
    </div>
  );
}

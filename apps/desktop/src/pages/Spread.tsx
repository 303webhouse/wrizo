import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotebookPages, setNotebookPosition, flushNow } from '../store/persistence';
import { firstLine } from '../store/entryText';
import { renderThumbnail } from '../store/ink';
import { PortToBoardSheet } from '../components/PortToBoardSheet';
import type { JournalEntry, Stroke } from '../types';

// J3 — the spread view: a visual grid of the loose Journal in notebook order
// (J1's getNotebookPages), carrying each page's ink thumbnail (eraser-aware
// since J2), a firstLine(40) caption, and its position number. Drag-to-reorder
// (mouse: drag; touch: long-press ~350ms then drag) persists via
// setNotebookPosition — the SAME ordering helper createLoosePage uses, so
// there is exactly one ordering implementation. A selection mode toggles brass
// borders and a count; it wires NO actions (the Port arrives with J4). Loose
// pages only — filed/Shelf pages are a logged non-goal.

const THUMB_SIZE = 92;
const LONG_PRESS_MS = 350;
const MOUSE_DRAG_THRESHOLD = 6; // px of movement before a mouse-down commits to a drag
const TOUCH_CANCEL_THRESHOLD = 12; // px of movement before the long-press timer fires -> treat as a scroll, not a drag

// A small paper square: the ink thumbnail (blank — including a fully-erased
// drawing, via renderThumbnail's own bbox/paint logic — when there's nothing
// to show), never decorated with placeholder text.
function SpreadThumb({ strokes }: { strokes: Stroke[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => { if (ref.current) renderThumbnail(ref.current, strokes, THUMB_SIZE); }, [strokes]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: THUMB_SIZE, height: THUMB_SIZE, display: 'block' }} />;
}

interface CellProps {
  entry: JournalEntry;
  index: number;
  selectMode: boolean;
  selected: boolean;
  lifted: boolean;
  dropBefore: boolean;
  dropAfter: boolean;
  registerEl: (id: string, el: HTMLButtonElement | null) => void;
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

function SpreadCell({ entry, index, selectMode, selected, lifted, dropBefore, dropAfter, registerEl, onOpen, onToggleSelect }: CellProps) {
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const textEmpty = !entry.text.trim();
  const caption = textEmpty ? (hasInk ? 'A sketch' : 'Untitled') : firstLine(entry.text).slice(0, 40);
  return (
    <button
      type="button"
      className="spread-cell"
      data-page-id={entry.id}
      data-selected={selected ? 'true' : 'false'}
      data-lifted={lifted ? 'true' : 'false'}
      data-drop-before={dropBefore ? 'true' : 'false'}
      data-drop-after={dropAfter ? 'true' : 'false'}
      aria-pressed={selectMode ? selected : undefined}
      ref={el => registerEl(entry.id, el)}
      onClick={() => { if (selectMode) onToggleSelect(entry.id); else onOpen(entry.id); }}
    >
      <span className="spread-cell-paper">
        {hasInk ? <SpreadThumb strokes={entry.strokes!} /> : null}
      </span>
      <span className="spread-cell-caption">{caption}</span>
      <span className="spread-cell-pos">{index + 1}</span>
    </button>
  );
}

interface GridProps {
  pages: JournalEntry[];
  selectMode: boolean;
  selected: Set<string>;
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onReordered: () => void;
}

function SpreadGrid({ pages, selectMode, selected, onOpen, onToggleSelect, onReordered }: GridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const selectModeRef = useRef(selectMode);
  selectModeRef.current = selectMode;
  const onReorderedRef = useRef(onReordered);
  onReorderedRef.current = onReordered;

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAfterId, setDropAfterId] = useState<string | null | undefined>(undefined);
  const dragIdRef = useRef<string | null>(null);
  const dropAfterIdRef = useRef<string | null | undefined>(undefined);
  // Set the instant a real drag commits; checked by each cell's onClick so the
  // click that a genuine drag-release can still emit never re-opens/re-selects
  // the cell it was just dragged from.
  const draggingCommittedRef = useRef(false);

  const setDrag = (id: string | null) => { dragIdRef.current = id; setDragId(id); };
  const setDrop = (a: string | null | undefined) => { dropAfterIdRef.current = a; setDropAfterId(a); };

  const registerEl = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) cellElsRef.current.set(id, el);
    else cellElsRef.current.delete(id);
  }, []);

  // Pointer-driven drag (mouse + touch + pen unify under Pointer Events). ONE
  // delegated listener set on the grid, attached once — cross-callback state
  // (phase/drag id/drop target) lives in refs so it never needs re-attaching.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    let phase: 'idle' | 'pending' | 'dragging' = 'idle';
    let startX = 0, startY = 0, startId: string | null = null, ptype = 'mouse';
    let activePointerId: number | null = null;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } };

    // Nearest-cell-center heuristic: find the closest OTHER cell to the
    // pointer, then decide before/after it by which half of that cell the
    // pointer sits in. Returns undefined only when there's nothing to drop
    // against (e.g. a single-page notebook) — never committed on drop.
    const computeTarget = (x: number, y: number, excludeId: string): string | null | undefined => {
      const rects: { id: string; rect: DOMRect }[] = [];
      cellElsRef.current.forEach((el, id) => { if (id !== excludeId) rects.push({ id, rect: el.getBoundingClientRect() }); });
      if (rects.length === 0) return undefined;
      let nearest = rects[0];
      let bestDist = Infinity;
      for (const r of rects) {
        const cx = r.rect.left + r.rect.width / 2, cy = r.rect.top + r.rect.height / 2;
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d < bestDist) { bestDist = d; nearest = r; }
      }
      const cx = nearest.rect.left + nearest.rect.width / 2;
      if (x < cx) {
        const order = pagesRef.current.map(p => p.id).filter(id => id !== excludeId);
        const idx = order.indexOf(nearest.id);
        return idx <= 0 ? null : order[idx - 1];
      }
      return nearest.id;
    };

    const beginDrag = (id: string) => {
      phase = 'dragging';
      draggingCommittedRef.current = true;
      setDrag(id);
      setDrop(undefined);
      // Without capture, a drag released outside the grid never delivers
      // pointerup to the grid listener — a lifted cell + stale drop line
      // strand until the next full drag cycle.
      if (activePointerId != null) {
        try { grid.setPointerCapture(activePointerId); } catch { /* pointer already gone */ }
      }
    };

    const finishDrag = (commit: boolean) => {
      clearTimer();
      if (commit && dragIdRef.current && dropAfterIdRef.current !== undefined) {
        setNotebookPosition(dragIdRef.current, dropAfterIdRef.current);
        onReorderedRef.current();
      }
      if (activePointerId != null && grid.hasPointerCapture(activePointerId)) {
        try { grid.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      phase = 'idle';
      startId = null;
      setDrag(null);
      setDrop(undefined);
      // Let the click that follows a real drag-release see the flag as still
      // set (it fires synchronously right after pointerup), then clear it.
      setTimeout(() => { draggingCommittedRef.current = false; }, 0);
    };

    const onDown = (e: PointerEvent) => {
      if (selectModeRef.current) return; // selection mode: tap-to-select only, no drag
      const cellEl = (e.target as HTMLElement).closest('.spread-cell') as HTMLElement | null;
      const id = cellEl?.dataset.pageId;
      if (!id) return;
      startX = e.clientX; startY = e.clientY; startId = id; ptype = e.pointerType;
      activePointerId = e.pointerId;
      phase = 'pending';
      if (ptype === 'touch' || ptype === 'pen') {
        longPressTimer = setTimeout(() => { if (phase === 'pending' && startId) beginDrag(startId); }, LONG_PRESS_MS);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (phase === 'pending') {
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (ptype === 'mouse') {
          if (dist > MOUSE_DRAG_THRESHOLD && startId) beginDrag(startId);
        } else if (dist > TOUCH_CANCEL_THRESHOLD) {
          clearTimer(); // moved before the long-press fired -> a scroll/tap, not a lift
          phase = 'idle';
        }
      } else if (phase === 'dragging' && dragIdRef.current) {
        e.preventDefault();
        setDrop(computeTarget(e.clientX, e.clientY, dragIdRef.current));
      }
    };

    const onUp = () => {
      if (phase === 'dragging') { finishDrag(true); return; }
      clearTimer();
      phase = 'idle';
    };

    const onCancel = () => {
      const wasDragging = phase === 'dragging';
      clearTimer();
      phase = 'idle';
      if (wasDragging) finishDrag(false);
    };

    grid.addEventListener('pointerdown', onDown);
    grid.addEventListener('pointermove', onMove, { passive: false });
    grid.addEventListener('pointerup', onUp);
    grid.addEventListener('pointercancel', onCancel);
    return () => {
      clearTimer();
      grid.removeEventListener('pointerdown', onDown);
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerup', onUp);
      grid.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const els = pages.map(p => cellElsRef.current.get(p.id)).filter((el): el is HTMLButtonElement => !!el);
    const idx = els.findIndex(el => el === document.activeElement);
    if (idx < 0) return;
    e.preventDefault();
    const delta = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
    const next = Math.min(Math.max(idx + delta, 0), els.length - 1);
    els[next]?.focus();
  };

  const onOpenGuarded = (id: string) => { if (!draggingCommittedRef.current) onOpen(id); };
  const onToggleSelectGuarded = (id: string) => { if (!draggingCommittedRef.current) onToggleSelect(id); };

  // Where the 2px brass drop line renders: the page id it sits BEFORE, or
  // 'END' for after the last (non-dragged) cell. undefined = no active drag.
  const displayOrder = pages.filter(p => p.id !== dragId).map(p => p.id);
  let lineBeforeId: string | 'END' | undefined;
  if (dropAfterId === undefined) lineBeforeId = undefined;
  else if (dropAfterId === null) lineBeforeId = displayOrder[0] ?? 'END';
  else {
    const idx = displayOrder.indexOf(dropAfterId);
    lineBeforeId = idx >= 0 && idx + 1 < displayOrder.length ? displayOrder[idx + 1] : 'END';
  }
  const lastDisplayId = displayOrder[displayOrder.length - 1];

  return (
    <div ref={gridRef} className="spread-grid" role="grid" aria-label="Notebook spread" onKeyDown={onGridKeyDown}>
      {pages.map((entry, i) => (
        <SpreadCell
          key={entry.id}
          entry={entry}
          index={i}
          selectMode={selectMode}
          selected={selected.has(entry.id)}
          lifted={dragId === entry.id}
          dropBefore={entry.id === lineBeforeId}
          dropAfter={lineBeforeId === 'END' && entry.id === lastDisplayId}
          registerEl={registerEl}
          onOpen={onOpenGuarded}
          onToggleSelect={onToggleSelectGuarded}
        />
      ))}
    </div>
  );
}

export function Spread() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<JournalEntry[]>(() => getNotebookPages());
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [portOpen, setPortOpen] = useState(false); // J4 Slice 2 — "Port N pages…"

  const refreshPages = useCallback(() => setPages(getNotebookPages()), []);

  // A drag reorder's write is debounced (~300ms) to localStorage like any
  // other edit; flush immediately on tab-hide/navigate-away so a reorder made
  // right before closing/reloading the tab is never lost — the same
  // safeguard JournalEntry/PageEditor/QuickSprint/BeatWizard already carry.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushNow(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const toggleSelectMode = () => { setSelectMode(v => !v); setSelected(new Set()); };
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const openPage = (id: string) => navigate(`/journal/${id}`);

  return (
    <div className="page spread-page" style={{ maxWidth: 960, paddingTop: '3rem' }}>
      <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← The journal</Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>THE SPREAD</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.01em', color: 'var(--text-hi)' }}>
            Every loose page, laid out.
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectMode && (
            <span className="spread-select-count" style={{ color: 'var(--text-mid)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              {selected.size} selected
            </span>
          )}
          {/* J4 Slice 2 — the Spread's FIRST select-mode action (the J3 dead-button rule lifts here). */}
          {selectMode && selected.size > 0 && (
            <button type="button" className="btn-quiet spread-port" onClick={() => setPortOpen(true)}>
              Port {selected.size} page{selected.size === 1 ? '' : 's'}…
            </button>
          )}
          <button type="button" className="btn-quiet spread-select-toggle" onClick={toggleSelectMode}>
            {selectMode ? 'Done' : 'Select'}
          </button>
        </div>
      </div>

      {pages.length === 0 ? (
        <p style={{ color: 'var(--text-mid)' }}>No loose pages yet — pages you write in the Journal will spread out here.</p>
      ) : (
        <SpreadGrid
          pages={pages}
          selectMode={selectMode}
          selected={selected}
          onOpen={openPage}
          onToggleSelect={toggleSelect}
          onReordered={refreshPages}
        />
      )}
      {portOpen && (
        <PortToBoardSheet
          sourceIds={pages.filter(p => selected.has(p.id)).map(p => p.id)}
          onClose={() => setPortOpen(false)}
        />
      )}
    </div>
  );
}

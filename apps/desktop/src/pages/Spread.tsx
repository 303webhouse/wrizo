import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotebookPages, setNotebookPosition, flushNow } from '../store/persistence';
import { routeForEntry } from '../store/routeForEntry';
import { firstLine } from '../store/entryText';
import { renderThumbnail } from '../store/ink';
import { PortToBoardSheet } from '../components/PortToBoardSheet';
import { AddToSheet } from '../components/AddToSheet';
import { useActionToast } from '../components/ActionToast';
import { useLexicon } from '../store/themeLexicon';
import type { JournalEntry, Stroke } from '../types';

// J3 — the spread view: a visual grid of the loose Journal in notebook order
// (J1's getNotebookPages), carrying each page's ink thumbnail (eraser-aware
// since J2), a firstLine(40) caption, and its position number. Drag-to-reorder
// (mouse: drag; touch: long-press ~350ms then drag) persists via
// setNotebookPosition — the SAME ordering helper createLoosePage uses, so
// there is exactly one ordering implementation. A selection mode toggles brass
// borders and a count; it wires NO actions (the Port arrives with J4). Loose
// pages only — filed/Shelf pages are a logged non-goal.
//
// J5 — the console. A quiet lens row (order/content/star/tag) turns the grid
// into a VIEW, composed on top of the one notebook-order data source; lenses
// never write orderIndex. "Your order" is the user-facing label for the
// internal notebook sequence — the vocabulary canon (2026-07-10) keeps
// "notebook" strictly internal (function/variable names only), never surfaced
// to the writer, including in accessible names.

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
  dragEnabled: boolean; // J5 — drag-reorder lives ONLY in the default lens state
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onReordered: () => void;
}

function SpreadGrid({ pages, selectMode, selected, dragEnabled, onOpen, onToggleSelect, onReordered }: GridProps) {
  const { t: lex } = useLexicon();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const selectModeRef = useRef(selectMode);
  selectModeRef.current = selectMode;
  const dragEnabledRef = useRef(dragEnabled);
  dragEnabledRef.current = dragEnabled;
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
      // J5 — lift never begins outside the default lens state (Your order,
      // no filters): a filtered/re-sorted subset can't honestly express an
      // insert-between write. Tap/select/focus are untouched.
      if (!dragEnabledRef.current) return;
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
    <div ref={gridRef} className="spread-grid" role="grid" aria-label={`${lex('journal')} spread`} onKeyDown={onGridKeyDown}>
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

// J5 Slice 1 — content predicate, ported verbatim from the Journal list's own
// thumbnail idiom so "Text"/"Ink"/"Text+ink" mean exactly what the row-level
// ink thumbnail already means elsewhere in the app.
type ContentLens = 'all' | 'text' | 'ink' | 'both';
function matchesContent(entry: JournalEntry, lens: ContentLens): boolean {
  if (lens === 'all') return true;
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const hasText = !!entry.text.trim();
  if (lens === 'text') return hasText && !hasInk;
  if (lens === 'ink') return hasInk && !hasText;
  return hasInk && hasText; // 'both'
}

// J5 Slice 1 — the lens row. Square corners, quiet borders, brass ONLY on the
// active chip; reduced-motion: no transitions (none used here regardless).
interface LensRowProps {
  order: 'your' | 'newest'; setOrder: (v: 'your' | 'newest') => void;
  content: ContentLens; setContent: (v: ContentLens) => void;
  starOnly: boolean; setStarOnly: (v: boolean) => void;
  tagFilter: string | null; setTagFilter: (v: string | null) => void;
  allTags: string[];
}
function SpreadLensRow({ order, setOrder, content, setContent, starOnly, setStarOnly, tagFilter, setTagFilter, allTags }: LensRowProps) {
  const chip = (active: boolean, label: string, onClick: () => void, key?: string) => (
    <button key={key ?? label} type="button" className="spread-lens-chip" data-active={active ? 'true' : 'false'} onClick={onClick}>
      {label}
    </button>
  );
  return (
    <div className="spread-lens-row" role="group" aria-label="View lenses" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 12 }}>
      <div className="spread-lens-group" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {chip(order === 'your', 'Your order', () => setOrder('your'))}
        {chip(order === 'newest', 'Newest', () => setOrder('newest'))}
      </div>
      <div className="spread-lens-group" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {chip(content === 'all', 'All', () => setContent('all'))}
        {chip(content === 'text', 'Text', () => setContent('text'))}
        {chip(content === 'ink', 'Ink', () => setContent('ink'))}
        {chip(content === 'both', 'Text+ink', () => setContent('both'))}
      </div>
      <div className="spread-lens-group" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {chip(starOnly, starOnly ? '★ Starred' : '☆ Starred', () => setStarOnly(!starOnly))}
      </div>
      {allTags.length > 0 && (
        <div className="spread-lens-group spread-lens-tags" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {allTags.map(t => chip(tagFilter === t, t, () => setTagFilter(tagFilter === t ? null : t), t))}
          {tagFilter && (
            <button type="button" className="btn-quiet spread-lens-clear" onClick={() => setTagFilter(null)} style={{ color: 'var(--text-low)' }}>clear</button>
          )}
        </div>
      )}
    </div>
  );
}

export function Spread() {
  const navigate = useNavigate();
  const { t: lex, tMany: lexMany } = useLexicon();
  const [pages, setPages] = useState<JournalEntry[]>(() => getNotebookPages());
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [portOpen, setPortOpen] = useState(false); // J4 Slice 2 — "Port N pages…"
  const [addOpen, setAddOpen] = useState(false); // J5 Slice 2/3 — "Add to…"
  const toast = useActionToast();

  // J5 Slice 1 — the lenses. VIEW ONLY: none of these ever write orderIndex.
  // "Your order" is the user-facing label for the notebook sequence.
  const [order, setOrder] = useState<'your' | 'newest'>('your');
  const [content, setContent] = useState<ContentLens>('all');
  const [starOnly, setStarOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const refreshPages = useCallback(() => setPages(getNotebookPages()), []);

  // Unique tags across ALL loose pages (unfiltered — matches the Journal
  // list's own idiom: the chip row never hides a tag just because a
  // different filter is currently narrowing the view).
  const allTags = [...new Set(pages.flatMap(p => p.tags ?? []))].sort();

  const isDefaultLens = order === 'your' && content === 'all' && !starOnly && !tagFilter;

  const viewPages = (() => {
    const filtered = pages.filter(p => matchesContent(p, content) && (!starOnly || p.starred) && (!tagFilter || (p.tags ?? []).includes(tagFilter)));
    if (order === 'your') return filtered; // pages is already in notebook order
    return filtered.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  })();

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
  // J6 S2 — was an unconditional `/journal/${id}`. getNotebookPages() only
  // excludes pageType:'board' (persistence.ts), so a loose page with any
  // OTHER pageType (e.g. an un-filed manuscript/support page, reachable via
  // the Places panel per pageHome.ts's own header comment) could reach this
  // list — JournalEntry.tsx's own redirect guard already bounced that case
  // straight back out to /page/:id, so this was an extra hop, not a wrong
  // landing; routeForEntry now picks the same destination directly.
  const openPage = (id: string) => {
    const target = pages.find(p => p.id === id);
    navigate(target ? routeForEntry(target) : `/journal/${id}`);
  };

  return (
    <div className="page spread-page" style={{ maxWidth: 960, paddingTop: '3rem' }}>
      <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← The {lex('journal').toLowerCase()}</Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>THE SPREAD</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.01em', color: 'var(--text-hi)' }}>
            Every loose {lex('page').toLowerCase()}, laid out.
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
              Port {selected.size} {selected.size === 1 ? lex('page').toLowerCase() : lexMany('page').toLowerCase()}…
            </button>
          )}
          {/* J5 Slice 2/3 — "Add to…" joins Select-mode beside "Port…". */}
          {selectMode && selected.size > 0 && (
            <button type="button" className="btn-quiet spread-add" onClick={() => setAddOpen(true)}>
              Add to…
            </button>
          )}
          {/* CD4.1 — Select/Close: enter the mode, leave the mode — a door word,
              never a completion word ("Done" retired everywhere a writer can see). */}
          <button type="button" className="btn-quiet spread-select-toggle" onClick={toggleSelectMode}>
            {selectMode ? 'Close' : 'Select'}
          </button>
        </div>
      </div>

      {pages.length > 0 && (
        <SpreadLensRow
          order={order} setOrder={setOrder}
          content={content} setContent={setContent}
          starOnly={starOnly} setStarOnly={setStarOnly}
          tagFilter={tagFilter} setTagFilter={setTagFilter}
          allTags={allTags}
        />
      )}
      {pages.length > 0 && !isDefaultLens && (
        <p className="spread-lens-note" role="status">
          a view, not an arrangement — drag to reorder in Your order
        </p>
      )}

      {pages.length === 0 ? (
        <p style={{ color: 'var(--text-mid)' }}>No loose {lexMany('page').toLowerCase()} yet — {lexMany('page').toLowerCase()} you write in the {lex('journal')} will spread out here.</p>
      ) : viewPages.length === 0 ? (
        <p style={{ color: 'var(--text-mid)' }}>Nothing matches this view.</p>
      ) : (
        <SpreadGrid
          pages={viewPages}
          selectMode={selectMode}
          selected={selected}
          dragEnabled={isDefaultLens}
          onOpen={openPage}
          onToggleSelect={toggleSelect}
          onReordered={refreshPages}
        />
      )}
      {addOpen && (
        <AddToSheet
          // R3 (Fable review, 2026-07-11): `pages` is already notebook order
          // (Your order) — sourced that way regardless of click/selection
          // sequence, matching J4's port precedent. Ratified, not a bug.
          sourceIds={pages.filter(p => selected.has(p.id)).map(p => p.id)}
          onClose={() => setAddOpen(false)}
          onDone={(message) => { setAddOpen(false); setSelected(new Set()); refreshPages(); toast.show(message); }}
        />
      )}
      {portOpen && (
        <PortToBoardSheet
          sourceIds={pages.filter(p => selected.has(p.id)).map(p => p.id)}
          onClose={() => setPortOpen(false)}
        />
      )}
      {toast.node}
    </div>
  );
}

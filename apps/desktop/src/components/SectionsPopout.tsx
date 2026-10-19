import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { flushNow, getDrawer, pinPageToBoard } from '../store/persistence';
import {
  UNSORTED, createSet, ensureSet, moveToJournal, reorderSections, sectionsOf, setsOfDrawer, showSetHeadings, undoMoveToJournal,
  type MoveToken, type Place, type SectionGroup,
} from '../store/place';
import { usePlace } from '../store/usePlace';
import { unbornHref } from '../store/unbornPage';
import { routeForEntry } from '../store/routeForEntry';
import { firstLine } from '../store/entryText';
import { TEMPLATE_ORDER, TemplateSketch, type TemplateKey } from './TemplateSketch';
import type { JournalEntry } from '../types';

// BIG PROJECTS 1a (docs/plans/big-projects.md) - THE PAGES POP-OUT. Where you are (a Drawer or a Journal), the sections in it in the writer's
// own order, set headings once a second set exists, + New set, Presets, and X (out to the Journal, with Undo). It replaces the Open Pages list;
// step 2 reuses it for Boards.
//
// WHAT THIS FILE WILL NOT DO. It never deletes (X is store/place.moveToJournal: one write, projectId). It never writes an order except from a
// deliberate reorder (a drag or the arrow keys on a grip) - the sort control is Order, the writer's own order, and nothing here sorts and saves.
// The old list's hooks are kept on purpose (wz-open-pages on the root, wz-place-page-list on the rows, data-page-id on a row, wz-open-pages-open / -more / -menu / -place):
// item 170's harness - a click on a row opens its page, the more-menu places it on a board, the menu opens inside the list - still holds on the pop-out, so only
// what really changed (the heading, the A-Z / Date sorts, the three-row viewport) is parked, with successors.
// Every row declares data-link-entry (the connector's rail drop target, ledger 87/107). The rows use no native drag-and-drop: a row marked for it
// switches the board's thumbnail drag-to-copy off. Reorder is pointer events on a grip, and the grip is exempted from that copy-drag by name.

const TEMPLATE_TERM = { blank: 'templateBlank', screenplay: 'templateScreenplay', outline: 'templateOutline', title: 'templateTitlePage', bibliography: 'templateBibliography' } as const;

function titleOf(entry: JournalEntry): string {
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  if (!entry.text.trim()) return hasInk ? 'A sketch' : 'Untitled';
  return firstLine(entry.text).slice(0, 60);
}

/** The set a new page files into: the place's own set, else the Drawer's first (made lazily if the Drawer has none). Null in a Journal. */
function targetSetId(place: Place): string | null {
  if (place.kind === 'journal') return null;
  if (place.setId) return place.setId;
  const first = setsOfDrawer(place.id)[0];
  if (first) return first.id;
  return place.id === UNSORTED ? null : ensureSet(place.id)?.id ?? null;
}

export function SectionsPopout({ currentId, navigate, boardId, journalLabel }: {
  currentId: string;
  navigate: NavigateFunction;
  /** On a board, a row's secondary act places the page on it (PW1 S3, kept from the list this replaces). */
  boardId?: string;
  journalLabel: string;
}) {
  const { t } = useDeskLexicon();
  const place = usePlace();
  const [, setTick] = useState(0);
  const force = () => setTick(n => n + 1);
  const [undo, setUndo] = useState<{ token: MoveToken; title: string } | null>(null);
  const undoTimer = useRef<number | null>(null);
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const [naming, setNaming] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null);

  useEffect(() => () => { if (undoTimer.current != null) window.clearTimeout(undoTimer.current); }, []);

  useEffect(() => {
    if (!menuFor) return;
    const onDown = (e: MouseEvent) => {
      const row = (e.target as Element | null)?.closest?.('.wz-section-row');
      if (!row || row.getAttribute('data-entry-id') !== menuFor) setMenuFor(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuFor(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuFor]);

  const isJournal = place.kind === 'journal';
  const drawer = place.kind === 'drawer' && place.id !== UNSORTED ? getDrawer(place.id) : null;
  const placeName = isJournal ? journalLabel : place.id === UNSORTED ? t('switcherUnsorted') : drawer?.name ?? '';
  const groups: SectionGroup[] = sectionsOf(place, 'pages');
  const headings = showSetHeadings(place);
  const currentSet = place.setId ?? groups[0]?.set?.id ?? null;

  const open = (e: JournalEntry) => { flushNow(); navigate(routeForEntry(e)); };

  const newPage = () => {
    const setId = targetSetId(place);
    navigate(unbornHref(setId ? { binderId: setId } : { origin: isJournal ? 'journal' : 'loose' }));
  };
  const preset = (key: TemplateKey) => {
    const setId = targetSetId(place);
    const base = setId ? { binderId: setId } : { origin: isJournal ? 'journal' as const : 'loose' as const };
    if (key === 'screenplay') navigate(unbornHref({ ...base, structure: 'screenplay' }));
    else navigate(unbornHref({ ...base, template: key === 'blank' ? null : key }));
  };

  const takeOut = (e: JournalEntry) => {
    const token = moveToJournal(e.id);
    if (!token) return;
    setUndo({ token, title: titleOf(e) });
    if (undoTimer.current != null) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), 12000);
    force();
  };
  const undoTake = () => {
    if (!undo) return;
    undoMoveToJournal(undo.token);
    setUndo(null);
    force();
  };

  const placeOnBoard = (id: string) => {
    if (!boardId) return;
    pinPageToBoard(id, boardId, { display: true });
    setMenuFor(null);
    force();
  };

  // ---- reorder: a pointer drag on a row's grip, or the arrow keys on it. Order is the only sort, so there is no mode to be in. ----
  const startDrag = (ev: ReactPointerEvent, group: SectionGroup, from: number) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const list = (ev.currentTarget as HTMLElement).closest('.wz-sections-rows') as HTMLElement | null;
    if (!list) return;
    const ids = group.items.map(e => e.id);
    const id = ids[from];
    let over = from;
    setDrag({ id, over });
    const indexAt = (y: number): number => {
      const rows = Array.from(list.querySelectorAll<HTMLElement>('.wz-section-row'));
      for (let i = 0; i < rows.length; i += 1) { const r = rows[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i; }
      return rows.length - 1;
    };
    const onMove = (e: PointerEvent) => { over = indexAt(e.clientY); setDrag({ id, over }); };
    const finish = (commit: boolean) => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onCancel, true);
      setDrag(null);
      if (commit && over !== from) {
        const next = ids.slice();
        next.splice(from, 1);
        next.splice(over, 0, id);
        reorderSections(next);
      }
      force();
    };
    function onUp() { finish(true); }
    function onCancel() { finish(false); }
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onCancel, true);
  };
  const nudge = (ev: ReactKeyboardEvent, group: SectionGroup, from: number) => {
    const to = ev.key === 'ArrowUp' ? from - 1 : ev.key === 'ArrowDown' ? from + 1 : from;
    if (to === from || to < 0 || to >= group.items.length) return;
    ev.preventDefault();
    const ids = group.items.map(e => e.id);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorderSections(ids);
    force();
  };

  const addSet = (name: string) => {
    setNaming(false);
    if (!name.trim() || place.kind !== 'drawer' || place.id === UNSORTED) return;
    createSet(place.id, name.trim());
    force();
  };

  const renderRow = (group: SectionGroup, e: JournalEntry, i: number) => (
    <div key={e.id} className={`wz-section-row wz-open-pages-row${drag?.id === e.id ? ' dragging' : ''}${drag && drag.id !== e.id && drag.over === i ? ' drop-here' : ''}`}
      role="listitem" data-entry-id={e.id} data-page-id={e.id} data-link-entry={e.id}>
      <button type="button" className="wz-section-grip" data-reorder-grip="true" aria-label={t('sectionsReorder')} title={t('sectionsReorder')}
        onPointerDown={(ev) => startDrag(ev, group, i)} onKeyDown={(ev) => nudge(ev, group, i)}>{'⠿'}</button>
      <button type="button" className="wz-section-open wz-place-page-row wz-open-pages-open"
        aria-current={e.id === currentId ? 'page' : undefined} onClick={() => open(e)}>
        <span className="wz-place-page-title">{titleOf(e)}</span>
      </button>
      {boardId && (
        <button type="button" className="wz-open-pages-more" aria-label={t('openPagesMore')} aria-haspopup="menu" aria-expanded={menuFor === e.id}
          onClick={() => setMenuFor(menuFor === e.id ? null : e.id)}>{'⋯'}</button>
      )}
      {boardId && menuFor === e.id && (
        <div className="wz-open-pages-menu" role="menu">
          <button type="button" role="menuitem" className="wz-open-pages-place" onClick={() => placeOnBoard(e.id)}>{t('openPagesPlace')}</button>
        </div>
      )}
      {!isJournal && (
        <button type="button" className="wz-section-x" aria-label={t('sectionsTakeOut')} title={t('sectionsTakeOut')} onClick={() => takeOut(e)}>{'×'}</button>
      )}
    </div>
  );

  return (
    <div className="wz-cascade-panel-body wz-sections wz-open-pages" data-kind="pages">
      <div className="wz-sections-place">{placeName}</div>
      <button type="button" className="wz-cascade-action wz-cascade-action-door" onClick={newPage}>{t('cascadePageNewPage')}</button>
      <div className="wz-sections-bar">
        <span className="wz-sections-heading">{t('sectionsHeading')}</span>
        <span className="wz-sections-sort" aria-label={`${t('openPagesSort')}: ${t('sectionsOrder')}`}>{t('sectionsOrder')}</span>
      </div>
      {undo && (
        <div className="wz-sections-undo" role="status">
          <span>{`“${undo.title}” — ${t('sectionsMoved')}`}</span>
          <button type="button" onClick={undoTake}>{t('sectionsUndo')}</button>
        </div>
      )}
      {groups.length === 0 && <p className="wz-page-setup-note">{t('sectionsEmpty')}</p>}
      {groups.map((group, gi) => {
        const set = group.set;
        const isOpen = !headings || !set || (folded[set.id] === undefined ? (set.id === currentSet || (currentSet == null && gi === 0)) : !folded[set.id]);
        return (
          <div key={set ? set.id : 'journal'} className="wz-set" data-set-id={set ? set.id : ''}>
            {headings && set && (
              <button type="button" className="wz-set-head" aria-expanded={isOpen} onClick={() => setFolded(f => ({ ...f, [set.id]: isOpen }))}>
                <span className="wz-set-name">{set.title}</span>
                <span className="wz-set-count">{group.items.length}</span>
              </button>
            )}
            {isOpen && (
              <div className="wz-sections-rows wz-place-page-list" role="list">
                {group.items.map((e, i) => renderRow(group, e, i))}
              </div>
            )}
          </div>
        );
      })}
      {place.kind === 'drawer' && place.id !== UNSORTED && (
        naming ? (
          <input className="wz-sections-newset-input" autoFocus aria-label={t('sectionsNewSetName')} placeholder={t('sectionsNewSetName')}
            onKeyDown={(ev) => { if (ev.key === 'Enter') addSet((ev.target as HTMLInputElement).value); else if (ev.key === 'Escape') setNaming(false); }}
            onBlur={() => setNaming(false)} />
        ) : (
          <button type="button" className="wz-sections-newset wz-cascade-link" onClick={() => setNaming(true)}>{t('sectionsNewSet')}</button>
        )
      )}
      <div className="wz-sections-presets">
        <div className="wz-sections-heading">{t('sectionsPresets')}</div>
        {TEMPLATE_ORDER.filter(k => k !== 'blank').map(k => (
          <button key={k} type="button" className="wz-sections-preset" data-preset={k} onClick={() => preset(k)}>
            <TemplateSketch kind={k} />
            <span>{t(TEMPLATE_TERM[k])}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

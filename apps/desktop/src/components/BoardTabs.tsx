import { useEffect, useReducer, useRef, useState } from 'react';
import { subscribe } from '../store/persistence';
import { boardTabRow, connectListRows, type BoardTab } from '../store/boardTabs';
import { useDeskLexicon } from '../store/deskLexicon';

// ITEM 144 — THE BOARD TABS (docs/menus/b144-board-tabs-build-brief.md T1-T4,
// as amended by b144-plus-menu-and-unnest-amendment.md §1).
//
// A ROW OF DOORS, NOT A TABLIST: `<nav>`, the current tab `aria-current="page"`,
// never `role="tablist"` — a tab bar of doors is not a tablist of panels, and
// the mode strip's own tablist must never be mistaken for it (the one-handle-
// one-control ruling). Each tab is `data-board-tab="<id>"`, so a check selects
// by NAME, never by position.
//
// THE ROW DOES NOT MOVE WHEN YOU DO (T2). The order lives in store/boardTabs.ts
// and does not depend on the current board; press a tab and only `aria-current`
// (and the olive where-you-are marker) moves.
//
// A PRESS TRAVELS, NEVER NESTS (T3). The current tab is not pressable.
//
// THE "＋" (Nick, 2026-09-24: "Scrap 'Board.' Just a '+' next to the current
// board"): no visible word; the accessible name states the direction — "Add a
// board to Characters". It rides beside the CURRENT tab, wherever that sits. It
// opens a menu in the row's own BAND — the band grows, it never lays a panel
// over the canvas (item 166) — with exactly TWO rows, kept as two separate
// items so they are trivially swappable (PLAN DESK's rival reading of the two
// verbs is unanswered by Nick; the amendment's §1 says a builder may start on
// its reading because both rows are cheap to swap):
//   Add Board — an existing board becomes a nested one (the connect list);
//   New Board — a new board is born nested, name field focused, and you travel to it.
// Unlink is NOT in this menu: it acts on a particular board, and the ＋ belongs
// to the board you are standing on.
//
// This component owns NO writes. The two acts arrive as callbacks, because the
// writes must go through BoardEditor's own live `boxes` (item 92's law).

type Panel = 'closed' | 'menu' | 'connect';

export function BoardTabs({ boardId, onTravel, onAddBoard, onNewBoard }: {
  boardId: string;
  onTravel: (id: string) => void;
  onAddBoard: (chosenId: string) => void;
  onNewBoard: () => void;
}) {
  const { t } = useDeskLexicon();
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [panel, setPanel] = useState<Panel>('closed');
  const currentRef = useRef<HTMLSpanElement | null>(null);

  // The row is derived from the store every render; a change made anywhere
  // (this board, another lane, a sync) reaches it through the same notify()
  // every write already fires.
  useEffect(() => subscribe(() => bump()), []);

  // "The current tab is scrolled into view on arrival" (T2's long-row answer).
  useEffect(() => {
    try { currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* not every host implements it */ }
  }, [boardId]);

  // A new board (or a route change) starts with the band closed.
  useEffect(() => { setPanel('closed'); }, [boardId]);

  const row = boardTabRow(boardId);
  if (!row) return null;
  const current = row.tabs.find(tab => tab.isCurrent);

  const renderTab = (tab: BoardTab) => (
    <span
      key={tab.id}
      className="board-tab-wrap"
      data-depth={tab.depth}
      ref={tab.isCurrent ? currentRef : undefined}
    >
      <button
        type="button"
        className={`board-tab${tab.isCurrent ? ' current' : ''}`}
        data-board-tab={tab.id}
        aria-current={tab.isCurrent ? 'page' : undefined}
        aria-label={tab.inLine ? `${tab.title}, ${tab.inLine}` : tab.title}
        title={tab.title}
        // The current tab is not pressable (T3). aria-disabled rather than
        // `disabled`, so it stays in the tab order and a real pointer still
        // hit-tests to it (a disabled button swallows pointer events).
        aria-disabled={tab.isCurrent ? 'true' : undefined}
        onClick={() => { if (!tab.isCurrent) onTravel(tab.id); }}
      >
        <span className="board-tab-name">{tab.title}</span>
        {tab.inLine && <span className="board-tab-in">{tab.inLine}</span>}
      </button>
      {tab.isCurrent && (
        <button
          type="button"
          className="board-tab-plus"
          data-board-plus
          aria-haspopup="menu"
          aria-expanded={panel !== 'closed'}
          aria-label={`${t('boardTabsAddTo')} ${tab.title}`}
          title={`${t('boardTabsAddTo')} ${tab.title}`}
          onClick={() => setPanel(p => (p === 'closed' ? 'menu' : 'closed'))}
        >
          ＋
        </button>
      )}
    </span>
  );

  const rows = panel === 'connect' ? connectListRows(boardId) : [];

  return (
    <nav className="board-tabs" data-board-tabs aria-label={`${t('boardTabsNavLabel')} ${row.label}`}>
      <div className="board-tabs-strip">
        <span className="board-tabs-label">{row.label}</span>
        {row.tabs.map(renderTab)}
      </div>

      {panel === 'menu' && current && (
        <div className="board-tabs-band" role="menu" aria-label={`${t('boardTabsAddTo')} ${current.title}`} data-board-menu>
          <button type="button" role="menuitem" className="board-tabs-menuitem" data-board-menu-item="add"
            onClick={() => setPanel('connect')}>{t('boardTabsAddBoard')}</button>
          <button type="button" role="menuitem" className="board-tabs-menuitem" data-board-menu-item="new"
            onClick={() => { setPanel('closed'); onNewBoard(); }}>{t('boardTabsNewBoard')}</button>
        </div>
      )}

      {panel === 'connect' && (
        <div className="board-tabs-band board-tabs-connect" data-board-connect-list role="group" aria-label={t('boardTabsAddBoard')}>
          <button type="button" className="board-tabs-menuitem board-tabs-back" onClick={() => setPanel('menu')}>‹ {t('boardTabsBack')}</button>
          {rows.length === 0 && <div className="board-tabs-empty">{t('boardTabsNoOtherBoards')}</div>}
          {rows.map(r => (
            <button
              key={r.id}
              type="button"
              className={`board-tabs-connect-row${r.state === 'pressable' ? '' : ' inert'}`}
              data-board-connect-row={r.id}
              data-state={r.state}
              aria-disabled={r.state === 'pressable' ? undefined : 'true'}
              onClick={() => { if (r.state === 'pressable') { setPanel('closed'); onAddBoard(r.id); } }}
            >
              <span className="board-tabs-connect-name">{r.title}</span>
              <span className="board-tabs-connect-in">{r.inLine}</span>
              {r.state === 'already-inside' && <span className="board-tabs-connect-note">{t('boardTabsAlreadyInside')}</span>}
              {r.state === 'contains-this-board' && <span className="board-tabs-connect-note">{t('boardTabsContainsThis')}</span>}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

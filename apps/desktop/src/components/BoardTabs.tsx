import { useEffect, useReducer, useRef, useState } from 'react';
import { subscribe } from '../store/persistence';
import { boardTabRow, connectBoardRows, type BoardTab } from '../store/boardTabs';
import { useDeskLexicon } from '../store/deskLexicon';

// ITEM 144 — THE BOARD TABS (docs/menus/b144-board-tabs-build-brief.md T1-T4, as
// amended by b144-plus-menu-and-unnest-amendment.md §§1-9).
//
// A ROW OF DOORS, NOT A TABLIST: `<nav>`, the current tab `aria-current="page"`,
// never `role="tablist"` — a tab bar of doors is not a tablist of panels, and the
// mode strip's own tablist must never be mistaken for it (one-handle-one-control).
// Each tab is `data-board-tab="<id>"`, so a check selects by NAME, never position.
//
// THE ROW DOES NOT MOVE WHEN YOU DO (T2): the order lives in store/boardTabs.ts
// and does not depend on the current board; press a tab and only `aria-current`
// (and the olive where-you-are marker) moves. A PRESS TRAVELS, NEVER NESTS (T3).
//
// THE BARE "＋" (Nick: "Scrap 'Board.' Just a '+' next to the current board") sits
// beside the CURRENT tab, no visible word, its accessible name stating the
// direction ("Add a board to Characters"). It opens a menu in the row's own BAND —
// the band grows, it never lays a panel over the canvas (item 166) — with THREE
// rows, in Nick's literal words (PLAN DESK's second amendment, §9.1):
//   Add Board .....  a NEW board INSIDE this one (born in this drawer, name focused)
//   New Board .....  a NEW board BESIDE this one (connected, not inside)
//   Connect Board .  a toggle-open list of ALL boards, most recently opened first;
//                    the pick is connected BESIDE this one
// Each row is a separate item over a separate callback, so a reading swap is one line.
//
// UNLINK is NOT in the ＋ menu — it acts on a particular board. It lives on each
// tab's own ⋯ (absent, not greyed, when the tab has nothing to unlink): "Unlink
// from <parent>" on a NESTED tab, "Unlink from <current>" on a tab BESIDE the
// current board. Unlink writes membership/connection only; nothing is deleted.
//
// This component owns NO writes: every act arrives as a callback, because the writes
// must go through BoardEditor's own live `boxes` (item 92's law).

type Panel = 'closed' | 'menu' | 'connect' | { tab: string };

export function BoardTabs({ boardId, onTravel, onAddBoard, onNewBoard, onConnectBoard, onUnlinkNested, onUnlinkBeside }: {
  boardId: string;
  onTravel: (id: string) => void;
  onAddBoard: () => void;
  onNewBoard: () => void;
  onConnectBoard: (chosenId: string) => void;
  onUnlinkNested: (childId: string, parentId: string) => void;
  onUnlinkBeside: (otherId: string) => void;
}) {
  const { t } = useDeskLexicon();
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [panel, setPanel] = useState<Panel>('closed');
  const currentRef = useRef<HTMLSpanElement | null>(null);

  // The row is derived from the store every render; a change made anywhere
  // (this board, another lane, a sync) reaches it through the same notify().
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
  const isTabPanel = typeof panel === 'object';
  const tabPanelId = isTabPanel ? panel.tab : null;

  const unlinkActs = (tab: BoardTab) => {
    const acts: { kind: 'nested' | 'beside'; label: string; run: () => void }[] = [];
    if (tab.parentId && tab.parentTitle) {
      acts.push({ kind: 'nested', label: `${t('boardTabsUnlinkFrom')} ${tab.parentTitle}`, run: () => onUnlinkNested(tab.id, tab.parentId as string) });
    }
    if (tab.besideCurrent && current) {
      acts.push({ kind: 'beside', label: `${t('boardTabsUnlinkFrom')} ${current.title}`, run: () => onUnlinkBeside(tab.id) });
    }
    return acts;
  };

  const renderTab = (tab: BoardTab) => {
    const acts = unlinkActs(tab);
    return (
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
        {acts.length > 0 && (
          <button
            type="button"
            className={`board-tab-more${tab.isCurrent ? ' current' : ''}`}
            data-board-tab-more={tab.id}
            aria-haspopup="menu"
            aria-expanded={tabPanelId === tab.id}
            aria-label={`${t('boardTabsMoreFor')} ${tab.title}`}
            onClick={() => setPanel(p => (typeof p === 'object' && p.tab === tab.id ? 'closed' : { tab: tab.id }))}
          >
            ⋯
          </button>
        )}
        {tab.isCurrent && (
          <button
            type="button"
            className="board-tab-plus"
            data-board-plus
            aria-haspopup="menu"
            aria-expanded={panel === 'menu' || panel === 'connect'}
            aria-label={`${t('boardTabsAddTo')} ${tab.title}`}
            title={`${t('boardTabsAddTo')} ${tab.title}`}
            onClick={() => setPanel(p => (p === 'closed' || isTabPanel ? 'menu' : 'closed'))}
          >
            ＋
          </button>
        )}
      </span>
    );
  };

  const rows = panel === 'connect' ? connectBoardRows(boardId) : [];
  const panelTab = tabPanelId ? row.tabs.find(tab => tab.id === tabPanelId) : null;

  return (
    <nav className="board-tabs" data-board-tabs aria-label={`${t('boardTabsNavLabel')} ${row.label}`}>
      <div className="board-tabs-strip">
        <span className="board-tabs-label">{row.label}</span>
        {row.tabs.map(renderTab)}
      </div>

      {(panel === 'menu' || panel === 'connect') && current && (
        <div className="board-tabs-band" role="menu" aria-label={`${t('boardTabsAddTo')} ${current.title}`} data-board-menu>
          <button type="button" role="menuitem" className="board-tabs-menuitem" data-board-menu-item="add"
            onClick={() => { setPanel('closed'); onAddBoard(); }}>{t('boardTabsAddBoard')}</button>
          <button type="button" role="menuitem" className="board-tabs-menuitem" data-board-menu-item="new"
            onClick={() => { setPanel('closed'); onNewBoard(); }}>{t('boardTabsNewBoard')}</button>
          <button type="button" role="menuitem" className="board-tabs-menuitem" data-board-menu-item="connect"
            aria-expanded={panel === 'connect'}
            onClick={() => setPanel(p => (p === 'connect' ? 'menu' : 'connect'))}>{t('boardTabsConnectBoard')}</button>
        </div>
      )}

      {panel === 'connect' && (
        <div className="board-tabs-band board-tabs-connect" data-board-connect-list role="group" aria-label={t('boardTabsConnectBoard')}>
          {rows.length === 0 && <div className="board-tabs-empty">{t('boardTabsNoOtherBoards')}</div>}
          {rows.map(r => (
            <button
              key={r.id}
              type="button"
              className={`board-tabs-connect-row${r.state === 'pressable' ? '' : ' inert'}`}
              data-board-connect-row={r.id}
              data-state={r.state}
              aria-disabled={r.state === 'pressable' ? undefined : 'true'}
              onClick={() => { if (r.state === 'pressable') { setPanel('closed'); onConnectBoard(r.id); } }}
            >
              <span className="board-tabs-connect-name">{r.title}</span>
              <span className="board-tabs-connect-in">{r.inLine}</span>
              {r.state === 'already-beside' && <span className="board-tabs-connect-note">{t('boardTabsAlreadyBeside')}</span>}
            </button>
          ))}
        </div>
      )}

      {panelTab && (
        <div className="board-tabs-band" role="menu" aria-label={`${t('boardTabsMoreFor')} ${panelTab.title}`} data-board-tab-menu={panelTab.id}>
          {unlinkActs(panelTab).map(a => (
            <button key={a.kind} type="button" role="menuitem" className="board-tabs-menuitem"
              data-board-unlink={a.kind} data-board-unlink-tab={panelTab.id}
              onClick={() => { setPanel('closed'); a.run(); }}>{a.label}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

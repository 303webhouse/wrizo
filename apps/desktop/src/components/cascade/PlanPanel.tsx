import { requestDelete } from '../../store/deleteGate';
import { useState } from 'react';
import { useDeskLexicon, deskTerm } from '../../store/deskLexicon';
import { boardDrawerLine } from '../../store/pageHome';
import { firstLine } from '../../store/entryText';
import { softDeleteEntry, getJournalEntry, getPlanBoardId, getBoardsConnecting } from '../../store/persistence';
import { rememberLastPlanBoard, getLastPlanBoard } from '../../store/planTrail';
import { SectionsPopout } from '../SectionsPopout';
import { AddToSheet } from '../AddToSheet';
import type { JournalEntry } from '../../types';
import type { CascadeSurveyKind, CascadeContext } from './shared';

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------
export function boardTitle(entry: JournalEntry): string {
  if (!entry.text.trim()) return 'Untitled board';
  return firstLine(entry.text).slice(0, 60);
}

// PW1 S1 — BOARDS CONNECTED. THE SUBJECT CHANGES, and that is the whole slice.
// The panel used to list `getBinderPages(project.id)` — which containers live
// inside this page's DRAWER — when the writer asked which containers hold THIS
// PAGE. Co-location is not connection. The right set was already computed and
// already rendered, as a SENTENCE, inside a drawer, where it could not be
// pressed: `planBoardId` ∪ `getBoardsConnecting`. Zero schema; both functions
// built, local, and already called this same render.
interface ConnectedBoard {
  id: string;
  title: string;
  /** The second line: the RELATION or the DRAWER. Never a count (PW10; A14/A18; BD4). */
  relation: string;
  /** The page's own paired plan board — a SURFACE OWNING A CONTAINER (the three-space canon). */
  own: boolean;
}

// PW1 S1 — the untitled plan board is titled FROM ITS PAGE. `getOrCreatePlanBoard`
// mints `text: ''`, so a plan board is normally nameless; the pairing is 1:1, so
// the page's own name is a TRUE name for it rather than a guess, and it spares
// the writer a naming step the minimum-setup law forbids (PW10's clause).
function planBoardTitleFor(board: JournalEntry, page: JournalEntry): string {
  if (board.text.trim()) return boardTitle(board);
  const pageTitle = firstLine(page.text).slice(0, 60) || 'Untitled';
  return `${pageTitle} ${deskTerm('cascadePlanOwnSuffix')}`;
}


// computed from the PAGE alone, independent of `project`: a loose page can own a plan board and be pinned to boards [CascadePanels §8]
function connectedBoardsFor(page: JournalEntry): ConnectedBoard[] {
  const rows: ConnectedBoard[] = [];
  const seen = new Set<string>();
  const planId = getPlanBoardId(page.id);
  if (planId) {
    // `getPlanBoardId` is a raw pointer read with no existence check — a board
    // that was deleted (or soft-deleted; getJournalEntry excludes both) must
    // NOT become a row onto nothing. G3, at the level of a single row.
    const board = getJournalEntry(planId);
    if (board) {
      rows.push({ id: board.id, title: planBoardTitleFor(board, page), relation: deskTerm('cascadePlanRelationOwn'), own: true });
      seen.add(board.id);
    }
  }
  for (const pinned of getBoardsConnecting(page.id)) {
    if (seen.has(pinned.id)) continue; // ∪ — a page pinned to its OWN plan board is one row, named by the truer relation
    seen.add(pinned.id);
    const board = getJournalEntry(pinned.id);
    if (!board) continue;
    rows.push({ id: board.id, title: pinned.title, relation: boardDrawerLine(board), own: false });
  }
  return rows;
}

// the Plan panel reopens on the board last opened from this page, resolved only when the category opens (so `‹` back to the list stays put) and re-validated against the live connections [CascadePanels §9]
export function resolveStickyPlanSurvey(page: JournalEntry): CascadeSurveyKind | null {
  const lastId = getLastPlanBoard(page.id);
  if (!lastId) return null;
  const row = connectedBoardsFor(page).find((r) => r.id === lastId);
  return row ? { category: 'plan-board', boardId: row.id, boardTitle: row.title } : null;
}

// PW2 S2 / ITEM 163 — the zone's caption on a board, and now the board ROW's
// second line and the canvas board-card too, all from `boardDrawerLine`. This
// function's body moved there VERBATIM: the caption was already the correct form,
// so the shared reader is the code that was already right, not a new invention.

// one act per row: a press opens the board's contents; a double-click travels, and `Open the board` in the row's `⋯` is that gesture's keyboard twin [CascadePanels §10]
function BoardConnectedRow({ row, onOpenContents, onTravel }: { row: ConnectedBoard; onOpenContents: () => void; onTravel: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="wz-cascade-boardrow" data-own={row.own ? 'true' : 'false'} data-link-entry={row.id}>
      <button
        type="button"
        className="wz-cascade-boardrow-open"
        onClick={onOpenContents}
        onDoubleClick={onTravel}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
      >
        <span className="wz-cascade-boardrow-title">{row.title}</span>
        <span className="wz-cascade-boardrow-relation">{row.relation}</span>
      </button>
      <button type="button" className="wz-cascade-thumb-menu-btn wz-cascade-boardrow-menu-btn" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>⋯</button>
      {menuOpen && (
        <div className="wz-cascade-thumb-menu">
          {/* PW22's twin: the menu carries what the double-click does. */}
          <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-open-board" onClick={() => { setMenuOpen(false); onTravel(); }}>{deskTerm('cascadeOpenBoard')}</button>
          <BoardRowMenu id={row.id} />
        </div>
      )}
    </div>
  );
}

export function PlanPanel({ subject, project, navigate, openSurvey, travelFromCascade }: CascadeContext) {
  const { t } = useDeskLexicon();

  // the connections are computed before the no-project fork so both branches render them; no connections means no zone at all, never an empty one [CascadePanels §11]
  const rows = connectedBoardsFor(subject.entry);
  const openContents = (row: ConnectedBoard) => {
    // PW1 S5 — stickiness: remember what the writer THEMSELVES opened, so the
    // second and every later visit costs two presses instead of three.
    rememberLastPlanBoard(subject.entry.id, row.id);
    openSurvey({ category: 'plan-board', boardId: row.id, boardTitle: row.title });
  };
  const travelToBoard = (row: ConnectedBoard) => {
    const board = getJournalEntry(row.id);
    if (board) travelFromCascade(board);
  };
  const zone = rows.length > 0 ? (
    <div className="wz-cascade-plan-zone" role="group" aria-label={t('cascadePlanBoardsConnected')}>
      {/* the heading's uppercase is CSS; the lexicon term carries sentence case; here the nouns mean GO, so no verb heading [CascadePanels §12] */}
      <div className="wz-cascade-panel-title wz-cascade-plan-title">{t('cascadePlanBoardsConnected')}</div>
      {/* the drawer is the zone's caption, not a row (an inert row among pressable ones is forbidden); not pressable until a drawer has a surface of its own, when it becomes the door to it [CascadePanels §13] */}
      {subject.entry.pageType === 'board' && <div className="wz-cascade-plan-caption">{boardDrawerLine(subject.entry)}</div>}
      {rows.map((row) => (
        <BoardConnectedRow key={row.id} row={row} onOpenContents={() => openContents(row)} onTravel={() => travelToBoard(row)} />
      ))}
      <div className="wz-cascade-plan-rule" role="separator" />
    </div>
  ) : null;

  // the Boards tab mirrors the Pages pop-out (SectionsPopout in boards mode); the connected-boards zone stays here as a bridge, and is absent when there is nothing to show [CascadePanels §14]
  void project;
  return (
    <SectionsPopout view="boards" currentId={subject.entry.id} navigate={navigate} journalLabel={t('drawerPlaceJournal')} zone={zone} />
  );
}

// Per-board quiet disclosure: Move (AddToSheet's Move/Copy grammar) and Delete (one plain confirm; destructive colour only inside it) [CascadePanels §15]
function BoardRowMenu({ id }: { id: string }) {
  const { t } = useDeskLexicon();
  const [moveOpen, setMoveOpen] = useState(false);
  // BOARD CONTEXT MENU: the inline "are you sure" this row used to carry (T4: one plain confirm) is the ONE "Send to Trash?" dialog now - same gate as a card, a Page, a Drawers row.
  return (
    <>
      <button type="button" className="wz-cascade-thumb-menu-item" onClick={() => setMoveOpen(true)}>{t('cascadeBoardMove')}</button>
      {moveOpen && <AddToSheet sourceIds={[id]} onClose={() => setMoveOpen(false)} onDone={() => setMoveOpen(false)} />}
      <button type="button" className="wz-cascade-thumb-menu-item" onClick={() => requestDelete(() => { softDeleteEntry(id); })}>{t('cascadeBoardDelete')}</button>
    </>
  );
}


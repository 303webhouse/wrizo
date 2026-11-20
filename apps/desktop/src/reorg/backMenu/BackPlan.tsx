import { memo, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Box, JournalEntry } from '../../types';
import { useDeskLexicon } from '../../store/deskLexicon';
import { generateId, getJournalEntry, getPlanBoardId, isUnborn, saveJournalEntry, subscribe } from '../../store/persistence';
import { getOrCreatePlanBoard } from '../../store/persistence/planPairing';
import { hidePlanCard, unhidePlanCard } from '../../store/grafts';
import { withoutFontMarks } from '../../store/markRuns';
import { REORG } from '../flag';
import { addPlanRow, indentPlanRow, movePlanRow, outdentPlanRow, planRows, renamePlanRow } from './planOps';

// THE BACK MENU'S PLAN TAB (the reorg, phase 4.3, behind ?reorg=1 in Machina). An ordered outline of this Page's own board: numbered rows, indented
// as the board's Plan view indents them, each with Up, Down, Indent, Outdent and "Remove from the plan" (a keyboard path for every move, no drag
// needed; Alt+Up and Alt+Down in a row's name move it too), a name that renames on Enter or blur, and one field at the foot to add a row.
// An empty Plan says one quiet line and prompts nothing (R10, the laws table: "an empty Plan is silent").
//
// IT NEVER RE-RENDERS ON A KEYSTROKE (law L): the snapshot is the board's own `boxes` array plus the hidden cards' ids as a string, so a keystroke
// in the page (which saves the PAGE, never this board) changes neither. It is mounted only while the Plan tab is the one showing.

interface PlanSnap { boardId: string | null; boxes: readonly Box[] | undefined; hiddenKey: string }
let planMemo: (PlanSnap & { pageId: string }) | null = null;
function planSnapshot(pageId: string): PlanSnap {
  const boardId = getPlanBoardId(pageId);
  const board = boardId ? getJournalEntry(boardId) : null;
  const hiddenKey = (getJournalEntry(pageId)?.pageSettings?.hiddenPlanCards ?? []).join(',');
  const boxes = board?.boxes;
  if (planMemo && planMemo.pageId === pageId && planMemo.boardId === (board ? boardId : null) && planMemo.boxes === boxes && planMemo.hiddenKey === hiddenKey) return planMemo;
  planMemo = { pageId, boardId: board ? boardId : null, boxes, hiddenKey };
  return planMemo;
}

const titleOfText = (text: string | undefined): string => (withoutFontMarks(text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60);

// THE SPEED CHECK'S COUNTER (the rail's wrizoRailRenders pattern): how many times the Plan has rendered, read through a window seam that exists only under the switch.
let planRenders = 0;
if (REORG && typeof window !== 'undefined') (window as unknown as { wrizoPlanRenders?: () => number }).wrizoPlanRenders = () => planRenders;

// the parent re-renders with every page save (App's persistence subscription), and the entry it hands down is a new object each time: only the page's id matters here
export const BackPlan = memo(BackPlanImpl, (a, b) => a.entry.id === b.entry.id);

function BackPlanImpl({ entry }: { entry: JournalEntry }) {
  planRenders += 1;
  const { t } = useDeskLexicon();
  const pageId = entry.id;
  const snap = useSyncExternalStore(subscribe, () => planSnapshot(pageId), () => planSnapshot(pageId));
  const [adding, setAdding] = useState('');
  const [undo, setUndo] = useState<{ line: string; run: () => void } | null>(null);
  const addRef = useRef<HTMLInputElement | null>(null);
  const hidden = useMemo(() => new Set(snap.hiddenKey ? snap.hiddenKey.split(',') : []), [snap.hiddenKey]);
  const rows = useMemo(
    () => planRows(snap.boxes, hidden, (b) => (b.entryId ? titleOfText(getJournalEntry(b.entryId)?.text) : '')),
    [snap.boxes, hidden],
  );

  // the one write door: the board's boxes through the board's own entry, so it syncs like every other edit of a board
  const writeBoxes = (next: Box[] | null): void => {
    if (!next || !snap.boardId) return;
    const board = getJournalEntry(snap.boardId);
    if (!board || next === board.boxes) return;
    saveJournalEntry({ ...board, boxes: next });
  };
  const boxesNow = (): Box[] => (snap.boardId ? [...(getJournalEntry(snap.boardId)?.boxes ?? [])] : []);
  const act = (fn: (b: Box[]) => Box[]): void => { const cur = boxesNow(); const next = fn(cur); if (next !== cur) writeBoxes(next); };

  const remove = (boxId: string, title: string): void => {
    hidePlanCard(pageId, boxId);
    setUndo({ line: t('graftHiddenLine').replace('{title}', title || t('reorgUntitled')), run: () => unhidePlanCard(pageId, boxId) });
  };
  const add = (): void => {
    const text = adding.trim();
    if (!text) return;
    // the Page's board is born the first time something is put on it (never before: empty boards do not pile up), and never from an unborn page
    const board = snap.boardId ? getJournalEntry(snap.boardId) : getOrCreatePlanBoard(pageId);
    if (!board) return;
    const next = addPlanRow([...(board.boxes ?? [])], text, generateId);
    saveJournalEntry({ ...board, boxes: next });
    setAdding('');
    addRef.current?.focus();
  };
  const canAdd = !isUnborn(pageId);

  return (
    <div className="wz-back-plan" data-back-plan="">
      {rows.length === 0 ? (
        <div className="wz-back-quiet" data-back-plan-empty="">{t('reorgPlanEmpty')}</div>
      ) : (
        <ol className="wz-back-plan-list" aria-label={t('reorgBackPlan')}>
          {rows.map((r) => (
            <li key={r.boxId} className="wz-back-plan-row" data-plan-row={r.boxId} data-plan-depth={r.depth} style={{ paddingLeft: `${r.depth * 14}px` }}>
              <span className="wz-back-plan-num" aria-hidden="true">{r.number}</span>
              {r.isPin || r.isInk ? (
                <span className="wz-graft-title wz-back-plan-name" data-plan-name="">{r.isInk ? t('reorgSketch') : (r.title || t('reorgUntitled'))}</span>
              ) : (
                <input type="text" className="wz-back-plan-name wz-back-plan-input" data-plan-name="" defaultValue={r.title} key={`${r.boxId}:${r.title}`}
                  aria-label={`${t('reorgPlanRename')}: ${r.number}`} spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); act((b) => movePlanRow(b, r.boxId, e.key === 'ArrowUp' ? -1 : 1)); return; }
                    if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                    if (e.key === 'Escape') { (e.target as HTMLInputElement).value = r.title; (e.target as HTMLInputElement).blur(); }
                  }}
                  onBlur={(e) => { const v = e.target.value; if (snap.boardId) writeBoxes(renamePlanRow(boxesNow(), r.boxId, v)); }} />
              )}
              <span className="wz-back-plan-acts">
                <button type="button" className="wz-back-plan-btn" data-plan-up="" disabled={!r.canUp} aria-label={`${t('reorgPlanUp')}: ${r.number}`} title={t('reorgPlanUp')} onClick={() => act((b) => movePlanRow(b, r.boxId, -1))}>↑</button>
                <button type="button" className="wz-back-plan-btn" data-plan-down="" disabled={!r.canDown} aria-label={`${t('reorgPlanDown')}: ${r.number}`} title={t('reorgPlanDown')} onClick={() => act((b) => movePlanRow(b, r.boxId, 1))}>↓</button>
                <button type="button" className="wz-back-plan-btn" data-plan-indent="" disabled={!r.canIndent} aria-label={`${t('reorgPlanIndent')}: ${r.number}`} title={t('reorgPlanIndent')} onClick={() => act((b) => indentPlanRow(b, r.boxId))}>→</button>
                <button type="button" className="wz-back-plan-btn" data-plan-outdent="" disabled={!r.canOutdent} aria-label={`${t('reorgPlanOutdent')}: ${r.number}`} title={t('reorgPlanOutdent')} onClick={() => act((b) => outdentPlanRow(b, r.boxId))}>←</button>
                <button type="button" className="wz-back-plan-btn wz-links-x wz-graft-x" data-plan-remove="" aria-label={`${t('reorgPlanRemove')}: ${r.number}`} title={t('reorgPlanRemove')} onClick={() => remove(r.boxId, r.title)}>×</button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {undo && (
        <div className="wz-graft-undo" data-graft-undo="">
          <span>{undo.line}</span>
          <button type="button" onClick={() => { undo.run(); setUndo(null); }}>{t('graftUndo')}</button>
        </div>
      )}
      <div className="wz-back-plan-add">
        <input ref={addRef} type="text" className="wz-back-plan-input" data-plan-add="" value={adding} disabled={!canAdd} spellCheck={false}
          placeholder={t('reorgPlanAdd')} aria-label={t('reorgPlanAdd')}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      </div>
    </div>
  );
}

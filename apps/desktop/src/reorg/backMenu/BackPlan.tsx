import { memo, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Box, JournalEntry } from '../../types';
import { useDeskLexicon } from '../../store/deskLexicon';
import { flushNow, generateId, getJournalEntry, getPlanBoardId, isUnborn, saveBoardBoxes, subscribe } from '../../store/persistence';
import { routeForEntry } from '../../store/routeForEntry';
import { liveBoxes } from '../../store/boxTombstones';
import { getOrCreatePlanBoard } from '../../store/persistence/planPairing';
import { cache } from '../../store/persistence/core';
import { hidePlanCard, unhidePlanCard } from '../../store/grafts';
import { REORG } from '../flag';
import { ensureDoc } from '../parts';
import { docOfPage, partOfRow, toPartHref } from './planPart';
import { connectedBoardIds } from './planConnected';
import type { PlanPreset } from './planPresets';
import { PresetsMenu } from './PresetsMenu';
import { loadPlanPreset } from './planPresetLoad';
import { addPlanRow, indentPlanRow, movePlanRow, outdentPlanRow, planRows, renamePlanRow, titleOfText } from './planOps';
import { usePublishing, useIncludePlan, setIncludePlan } from '../publishPick';
import { setDocSetting } from '../docSettings';

// THE BACK MENU'S PLAN TAB (the reorg, phase 4.3, behind ?reorg=1 in Machina). An ordered outline of this Page's own board: numbered rows, indented
// as the board's Plan view indents them, each with Up, Down, Indent, Outdent and "Remove from the plan" (a keyboard path for every move, no drag
// needed; Alt+Up and Alt+Down in a row's name move it too), a name that renames on Enter or blur, and one field at the foot to add a row.
// An empty Plan says one quiet line and prompts nothing (R10, the laws table: "an empty Plan is silent").
//
// IT NEVER RE-RENDERS ON A KEYSTROKE (law L): the snapshot is the board's own `boxes` array plus the hidden cards' ids as a string, so a keystroke
// in the page (which saves the PAGE, never this board) changes neither. It is mounted only while the Plan tab is the one showing.

interface PlanSnap { key: string; board: unknown; boardId: string | null; cards: Box[]; hiddenKey: string }
let planMemo: (PlanSnap & { pageId: string }) | null = null;
// read from the store's own cache, never through getJournalEntry (which CLONES the whole entry, text and all, on every call): this runs on every store
// notification, including each keystroke's save, and must cost nothing and return the SAME object until the board or the hidden list has changed
function planSnapshot(pageId: string): PlanSnap {
  const page = cache.journalEntries.find((e) => e.id === pageId && !e.deletedAt);
  const boardId = page?.planBoardId ?? null;
  const board = boardId ? cache.journalEntries.find((e) => e.id === boardId && !e.deletedAt) : undefined;
  const hiddenKey = (page?.pageSettings?.hiddenPlanCards ?? []).join(',');
  // the board is compared by IDENTITY: every save replaces the cache's row, so two saves inside one millisecond (a board born and a row added in one act) still read as two
  const key = `${board ? boardId : ''}|${hiddenKey}`;
  if (planMemo && planMemo.pageId === pageId && planMemo.key === key && planMemo.board === board) return planMemo;
  planMemo = { pageId, key, board, boardId: board ? boardId : null, cards: liveBoxes(board?.boxes), hiddenKey };
  return planMemo;
}


// THE SPEED CHECK'S COUNTER (the rail's wrizoRailRenders pattern): how many times the Plan has rendered, read through a window seam that exists only under the switch.
let planRenders = 0;
if (REORG && typeof window !== 'undefined') (window as unknown as { wrizoPlanRenders?: () => number }).wrizoPlanRenders = () => planRenders;

// the parent re-renders with every page save (App's persistence subscription), and the entry it hands down is a new object each time: only the page's id matters here
export const BackPlan = memo(BackPlanImpl, (a, b) => a.entry.id === b.entry.id);

function BackPlanImpl({ entry }: { entry: JournalEntry }) {
  planRenders += 1;
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const pageId = entry.id;
  const snap = useSyncExternalStore(subscribe, () => planSnapshot(pageId), () => planSnapshot(pageId));
  const [adding, setAdding] = useState('');
  const [folded, setFolded] = useState<ReadonlySet<string>>(() => new Set());
  const [undo, setUndo] = useState<{ line: string; run: () => void } | null>(null);
  const addRef = useRef<HTMLInputElement | null>(null);
  const hidden = useMemo(() => new Set(snap.hiddenKey ? snap.hiddenKey.split(',') : []), [snap.hiddenKey]);
  const rows = useMemo(
    () => planRows(snap.cards, hidden, (b) => (b.entryId ? titleOfText(getJournalEntry(b.entryId)?.text) : '')),
    [snap.cards, hidden],
  );

  // the one write door: the board's LIVE cards through the store's own write boundary for a board (saveBoardBoxes: the tombstones and markers stored with the board are carried back, so
  // nothing a writer deleted is brought back and nothing is stripped), so it syncs like every other edit of a board
  const writeBoxes = (next: Box[] | null): void => {
    if (!next || !snap.boardId) return;
    saveBoardBoxes(snap.boardId, next);
  };
  const boxesNow = (): Box[] => (snap.boardId ? liveBoxes(getJournalEntry(snap.boardId)?.boxes) : []);
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
    const next = addPlanRow(liveBoxes(board.boxes), text, generateId);
    saveBoardBoxes(board.id, next);
    setAdding('');
    addRef.current?.focus();
  };
  const canAdd = !isUnborn(pageId);
  // INCLUDE THE PLAN IN WHAT GOES OUT (item 5a, stage menus L4): only while the publishing sheet is open; the tick is the sheet's own state (publishPick.ts), never stored
  const publishing = usePublishing(pageId);
  const includePlan = useIncludePlan(pageId);

  // PRESETS (planPresets.ts): a starting shape appended to the Plan as ordinary rows. The page's board is born the first time something is put on it, as the add field does. The Acts of a grouped preset start folded
  // closed (the Hero's Journey's twelve steps stay under three Acts, so the Plan stays short); a fold is a look, never stored.
  const fill = (preset: PlanPreset): void => {
    const made = loadPlanPreset(pageId, preset, (k) => t(k));   // the one loader (planPresetLoad.ts): the Guide's Start uses it too
    if (made && made.leaders.length) setFolded((was) => new Set([...was, ...made.leaders]));
  };
  const toggleFold = (id: string): void => setFolded((was) => { const n = new Set(was); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  // rows below a folded row are not drawn (depth is the board's own indent); a folded row keeps its place and its number
  const shownRows = useMemo(() => {
    const out: typeof rows = [];
    let hideDeeperThan: number | null = null;
    for (const r of rows) {
      if (hideDeeperThan !== null && r.depth > hideDeeperThan) continue;
      hideDeeperThan = folded.has(r.boxId) && r.underIds.length > 1 ? r.depth : null;
      out.push(r);
    }
    return out;
  }, [rows, folded]);

  // "-> PART": W2's "Write this" aimed at the Doc (planPart.ts). A row that has its Part opens it; otherwise the door opens a fresh page in this Doc for the card, named for the row.
  // The press writes nothing for the Part (her first word births it and the link in one act); a page with no Doc of her own is made one first, as the Parts list's "New part" does.
  const docNow = docOfPage(pageId);
  // THE GROUPS (planConnected.ts): each other board connected to this Page, its cards in THAT board's own order. A view: nothing here moves, renames or removes a card (that is done on the board itself); a group's row has the door and the tick only.
  const groups = connectedBoardIds(pageId, snap.boardId).flatMap((bid) => {
    const b = cache.journalEntries.find((e) => e.id === bid && !e.deletedAt);
    if (!b) return [];
    const first = titleOfText(b.text);
    return [{ id: bid, board: b, title: first || t('reorgUntitled'), rows: planRows(liveBoxes(b.boxes), new Set(), (x) => (x.entryId ? titleOfText(getJournalEntry(x.entryId)?.text) : '')) }];
  });
  const toPart = (r: { boxId: string; title: string }, boardId: string | null = snap.boardId): void => {
    flushNow();
    const have = partOfRow(boardId, r.boxId, docNow);
    if (have) { const e = getJournalEntry(have.id); if (e) navigate(routeForEntry(e)); return; }
    if (!boardId) return;
    let into = docNow;
    if (!into) {
      const made = ensureDoc(pageId);
      if (!made.ok) return;
      into = made.docId;
      flushNow();
    }
    navigate(toPartHref(into, boardId, r.boxId, r.title, getJournalEntry(pageId)?.pageType === 'script' ? 'screenplay' : null));
  };

  return (
    <div className="wz-back-plan" data-back-plan="">
      {publishing && (
        <label className="reorg-plan-include" data-plan-include="">
          <input type="checkbox" checked={includePlan && rows.length > 0} disabled={rows.length === 0} onChange={(e) => { setIncludePlan(pageId, e.target.checked); setDocSetting(pageId, { export: { includePlan: e.target.checked ? true : null } }); }} />
          <span>{rows.length === 0 ? t('reorgPlanIncludeNone') : t('reorgPlanInclude')}</span>
        </label>
      )}
      {rows.length === 0 && groups.length === 0 ? (
        <div className="wz-back-quiet" data-back-plan-empty="">{t('reorgPlanEmpty')}</div>
      ) : rows.length === 0 ? null : (
        <ol className="wz-back-plan-list" aria-label={t('reorgBackPlan')}>
          {shownRows.map((r) => (
            <li key={r.boxId} className="wz-back-plan-row" data-plan-row={r.boxId} data-plan-depth={r.depth} style={{ paddingLeft: `${r.depth * 14}px` }}>
              <span className="wz-back-plan-num" aria-hidden="true">{r.number}</span>
              {r.underIds.length > 1 && (
                <button type="button" className="wz-back-plan-btn wz-back-plan-fold" data-plan-fold={folded.has(r.boxId) ? 'closed' : 'open'} aria-expanded={!folded.has(r.boxId)}
                  aria-label={`${folded.has(r.boxId) ? t('reorgPlanUnfold') : t('reorgPlanFold')}: ${r.number}`} onClick={() => toggleFold(r.boxId)}>{folded.has(r.boxId) ? '▸' : '▾'}</button>
              )}
              {r.isPin || r.isInk ? (
                <span className="wz-graft-title wz-back-plan-name" data-plan-name="">{r.isInk ? t('reorgSketch') : (r.title || t('reorgUntitled'))}</span>
              ) : (
                <input type="text" className="wz-back-plan-name wz-back-plan-input" data-plan-name="" defaultValue={r.title} key={`${r.boxId}:${r.title}`}
                  aria-label={`${t('reorgPlanRename')}: ${r.number}`}
                  onKeyDown={(e) => {
                    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); act((b) => movePlanRow(b, r.boxId, e.key === 'ArrowUp' ? -1 : 1)); return; }
                    if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                    if (e.key === 'Escape') { (e.target as HTMLInputElement).value = r.title; (e.target as HTMLInputElement).blur(); }
                  }}
                  onBlur={(e) => { const v = e.target.value; if (snap.boardId) writeBoxes(renamePlanRow(boxesNow(), r.boxId, v)); }} />
              )}
              {(() => {
                if (r.isPin || r.isInk) return null;
                const part = partOfRow(snap.boardId, r.boxId, docNow);
                return (
                  <>
                    {part && part.written && <span className="wz-back-plan-tick" data-plan-tick="" role="img" aria-label={t('reorgPlanTick')} title={t('reorgPlanTick')}>{'✓'}</span>}
                    <button type="button" className="wz-back-plan-btn wz-back-plan-part" data-plan-part={part ? 'open' : 'new'} aria-label={`${part ? t('reorgPlanOpenPart') : t('reorgPlanToPart')}: ${r.number}`} onClick={() => toPart(r)}>
                      {part ? t('reorgPlanOpenPart') : t('reorgPlanToPart')}
                    </button>
                  </>
                );
              })()}
              <span className="wz-back-plan-acts">
                <button type="button" className="wz-back-plan-btn" data-plan-up="" disabled={!r.canUp} aria-label={`${t('reorgPlanUp')}: ${r.number}`} title={t('reorgPlanUp')} onClick={() => act((b) => movePlanRow(b, r.boxId, -1))}>↑</button>
                <button type="button" className="wz-back-plan-btn" data-plan-down="" disabled={!r.canDown} aria-label={`${t('reorgPlanDown')}: ${r.number}`} title={t('reorgPlanDown')} onClick={() => act((b) => movePlanRow(b, r.boxId, 1))}>↓</button>
                <button type="button" className="wz-back-plan-btn" data-plan-indent="" disabled={!r.canIndent} aria-label={`${t('reorgPlanIndent')}: ${r.number}`} title={t('reorgPlanIndent')} onClick={() => act((b) => indentPlanRow(b, r.boxId))}>→</button>
                <button type="button" className="wz-back-plan-btn" data-plan-outdent="" disabled={!r.canOutdent} aria-label={`${t('reorgPlanOutdent')}: ${r.number}`} title={t('reorgPlanOutdent')} onClick={() => act((b) => outdentPlanRow(b, r.boxId))}>←</button>
                <button type="button" className="wz-back-plan-btn wz-links-x wz-graft-x" data-plan-remove="" aria-label={`${t('reorgPlanRemove')}: ${r.number}`} title={t('reorgPlanRemove')} onClick={() => remove(r.boxId, r.title)}>×</button>
              </span>
              {r.hint && !r.underIds.some((id) => partOfRow(snap.boardId, id, docNow)?.written) && <span className="wz-back-plan-hint" data-plan-hint="">{r.hint}</span>}
            </li>
          ))}
        </ol>
      )}
      {groups.map((g) => (
        <section key={g.id} className="wz-back-plan-group" data-plan-group={g.id}>
          <div className="wz-back-plan-group-head">
            <span className="wz-back-plan-group-name" data-plan-group-name="">{g.title}</span>
            <button type="button" className="wz-back-plan-btn wz-back-plan-part" data-plan-group-open="" onClick={() => { flushNow(); navigate(routeForEntry(g.board)); }}>{t('reorgAssetsOpenBoard')}</button>
          </div>
          <ol className="wz-back-plan-group-list" aria-label={g.title}>
            {g.rows.map((r) => {
              const part = r.isPin || r.isInk ? null : partOfRow(g.id, r.boxId, docNow);
              return (
                <li key={r.boxId} className="wz-back-plan-row" data-plan-row={r.boxId} data-plan-depth={r.depth} style={{ paddingLeft: `${r.depth * 14}px` }}>
                  <span className="wz-back-plan-num" aria-hidden="true">{r.number}</span>
                  <span className="wz-graft-title wz-back-plan-name" data-plan-name="">{r.isInk ? t('reorgSketch') : (r.title || t('reorgUntitled'))}</span>
                  {part && part.written && <span className="wz-back-plan-tick" data-plan-tick="" role="img" aria-label={t('reorgPlanTick')} title={t('reorgPlanTick')}>{'\u2713'}</span>}
                  {!r.isPin && !r.isInk && (
                    <button type="button" className="wz-back-plan-btn wz-back-plan-part" data-plan-part={part ? 'open' : 'new'} aria-label={`${part ? t('reorgPlanOpenPart') : t('reorgPlanToPart')}: ${r.number}`} onClick={() => toPart(r, g.id)}>
                      {part ? t('reorgPlanOpenPart') : t('reorgPlanToPart')}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {undo && (
        <div className="wz-graft-undo" data-graft-undo="">
          <span>{undo.line}</span>
          <button type="button" onClick={() => { undo.run(); setUndo(null); }}>{t('graftUndo')}</button>
        </div>
      )}
      <PresetsMenu t={t} disabled={!canAdd} onPick={fill} />
      <div className="wz-back-plan-add">
        <input ref={addRef} type="text" className="wz-back-plan-input" data-plan-add="" value={adding} disabled={!canAdd}
          placeholder={t('reorgPlanAdd')} aria-label={t('reorgPlanAdd')}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      </div>
    </div>
  );
}

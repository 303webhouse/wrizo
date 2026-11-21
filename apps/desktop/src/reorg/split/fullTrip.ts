import { useEffect, useSyncExternalStore } from 'react';
import { getWayBack, type WayBackSession } from '../../store/wayBack';
import { liveQuery, registerLiveSite } from '../../store/liveDom';
import { setCaretOffset } from '../../store/caretOffset';

// FULL SCREEN ON A BOARD (reorg plan v2.1 §3b, ARBOR item 3; Nick, Team B row 2: "Full Screen on a Board opens the Board's own screen, with a Back
// button to the page she came from"; Fable, Nov 21 11:45 am, RULED: the return restores scroll, caret, stage and split).
//
// One trip at a time, in memory only (nothing is saved: a reload forgets it, as it forgets the split). The trip is made when she presses Full Screen
// on a Board beside a page; the Board's top rail shows Back while the trip names that Board; Back sends her to the page, which takes the trip back
// (SplitHost): the split opens again on the same Board and the page's scroll and caret are put back. Her stage needs nothing here: the page keeps its
// own stage (PageEditor's per-page mode).
//
// WHERE THE SCROLL AND CARET COME FROM: the page's own way back (store/wayBack.ts, W2). Leaving the page writes it (PageEditor's useWayBack, from the
// positions it tracked while she wrote, never a read at the moment of leaving); the Board's top rail takes a copy the moment it opens - before the
// Board can write its own way back over it on leaving - so nothing in between can lose it.

export interface BoardTrip { pageId: string; boardId: string; back: boolean; wb: WayBackSession | null }

let trip: BoardTrip | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribeTrip = (l: () => void): (() => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Full Screen pressed on Board `boardId` beside page `pageId`: the trip starts (replacing any other). */
export function startBoardTrip(pageId: string, boardId: string): void {
  trip = { pageId, boardId, back: false, wb: null };
  notify();
}
/** Back pressed on the Board's screen: the page it names will take the trip back. */
export function pressTripBack(): BoardTrip | null {
  if (!trip) return null;
  trip = { ...trip, back: true };
  notify();
  return trip;
}
/** The page `pageId` opened: the trip comes back here only if Back was pressed for this page; any other arrival ends it. */
export function takeTripBack(pageId: string): BoardTrip | null {
  if (!trip) return null;
  const t = trip;
  trip = null;
  notify();
  return t.back && t.pageId === pageId ? t : null;
}
export const getBoardTrip = (): BoardTrip | null => trip;

/** The trip for Board `boardId` (null for any other Board), with the page's way back copied in as the Board opens. */
export function useBoardTrip(boardId: string): BoardTrip | null {
  const t = useSyncExternalStore(subscribeTrip, () => trip);
  useEffect(() => {
    if (!trip || trip.boardId !== boardId || trip.wb) return;
    const wb = getWayBack();
    if (wb && wb.entryId === trip.pageId) trip = { ...trip, wb };
  }, [boardId]);
  return t && t.boardId === boardId && !t.back ? t : null;
}

// THE LIVE PAGE, NEVER ITS MEASURING COPY (store/liveDom.ts): the page's scroll box and editor are read from the live page
const pageScroll = (): HTMLElement | null => liveQuery<HTMLElement>('.mode-scroll');
const pageEditor = (): HTMLElement | null => liveQuery<HTMLElement>('.forward-only-editor');
registerLiveSite('split.trip.scroll', pageScroll);
registerLiveSite('split.trip.editor', pageEditor);

/** Put the page's scroll and caret back from the trip's copy of its way back. Re-asserted over the first ~350 ms, as the way back's own restore
 *  is (the page's first frames can move its own scroll box), and no longer once she presses, types or scrolls. */
export function restoreTripPage(wb: WayBackSession | null): () => void {
  if (!wb) return () => {};
  const apply = () => {
    const ed = pageEditor();
    if (ed && typeof wb.caret === 'number') { ed.focus({ preventScroll: true }); setCaretOffset(ed, wb.caret); }
    const sc = pageScroll();
    if (sc && typeof wb.scrollY === 'number') sc.scrollTop = wb.scrollY;
  };
  const raf = requestAnimationFrame(apply);
  const timers = [80, 200, 350].map((ms) => window.setTimeout(apply, ms));
  const types = ['keydown', 'pointerdown', 'wheel', 'touchstart'];
  const stop = () => { timers.forEach((t) => window.clearTimeout(t)); types.forEach((ty) => window.removeEventListener(ty, stop, true)); };
  types.forEach((ty) => window.addEventListener(ty, stop, true));
  return () => { cancelAnimationFrame(raf); stop(); };
}

// the inspection seam (the wrizoSplit pattern), under the switch only
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reorg') === '1') {
  (window as unknown as { wrizoBoardTrip?: unknown }).wrizoBoardTrip = { get: () => trip };
}

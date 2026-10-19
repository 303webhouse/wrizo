import { useSyncExternalStore } from 'react';
import type { Box } from '../types';

// CONNECTOR-B - what the open board tells the RIGHT drawer's Grafts / Links tab. The board owns its cards in editor state (autosaved a beat later); the tab lives in another component tree (the Tutor's
// drawer). So the board PUBLISHES a snapshot - its id, its live boxes, the selected card - and the actions the tab may ask of it (removing a connection box is an edit of the board's own state, so it goes through
// the board, not around it). Nothing here persists anything; it is a small seam, the wrizoBoard() pattern, and it is `null` whenever no board is open.
export interface BoardSnapshot { boardId: string; boxes: Box[]; selectedId: string | null }
// BIG PROJECTS STEP 3: addConnection - a graft picked for a card that lands on ANOTHER card of the same board is a connection box (the one-truth
// rule), made through the board like its removal; restoring one (Undo) is the same act. Returns the new box's id, or null if the pair is joined.
export interface BoardActions { removeConnection: (connId: string) => void; addConnection: (a: string, b: string) => string | null }

let snap: BoardSnapshot | null = null;
let actions: BoardActions | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function publishBoardSnapshot(s: BoardSnapshot | null): void { snap = s; notify(); }
export function registerBoardActions(a: BoardActions | null): void { actions = a; }
export function getBoardActions(): BoardActions | null { return actions; }
export function useBoardSnapshot(): BoardSnapshot | null {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => snap);
}

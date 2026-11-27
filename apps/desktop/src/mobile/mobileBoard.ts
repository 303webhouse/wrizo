// THE MOBILE BOARD (Nick, M4; Fable's ruling (b), Nov 24): where an unfiled phone note goes. It is the Board named exactly "Mobile" (spaces trimmed, same case) in Unfiled, the earliest-made if several.
// There is no marker and NO FIELD IS ADDED to a Board: if she renames or deletes it, the next unfiled note makes a new one. "In Unfiled" is the desk's own read-time rule (reorg/railData unfiledMembers).
// A new one is the same row a loose Board born at the desk is (store/unbornPage.ts: no set, origin 'loose'). Nothing else in Wrizo ever puts anything here: only the companion's own delivery calls this.
import { generateId, saveJournalEntry } from '../store/persistence';
import { fullBoardName } from '../store/entryText';
import { unfiledMembers } from '../reorg/railData';
import type { JournalEntry } from '../types';
import type { UnfiledHome } from './addNote';

/** The Board's name as it is saved: one word for every theme, so a change of theme never makes a second Board. */
export const MOBILE_BOARD_NAME = 'Mobile';

export function findMobileBoard(): string | null {
  const mine = unfiledMembers()
    .filter((e) => e.pageType === 'board' && fullBoardName(e.text, '').trim() === MOBILE_BOARD_NAME)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  return mine[0]?.id ?? null;
}

export function makeMobileBoard(): string {
  const now = new Date().toISOString();
  const board: JournalEntry = { id: generateId(), text: MOBILE_BOARD_NAME, projectId: null, pageType: 'board', boxes: [], source: 'page', origin: 'loose', createdAt: now, updatedAt: now };
  saveJournalEntry(board);
  return board.id;
}

export const UNFILED_HOME: UnfiledHome = { find: findMobileBoard, make: makeMobileBoard };

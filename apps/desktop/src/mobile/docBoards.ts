// A DOC AS A PLACE (Fable, Nov 24): choosing a Doc offers THAT Doc's own connected Boards, and nothing is made for it (never a per-Doc Mobile Board).
// "Connected" = the Boards in the Doc's own Assets (docSettings.assets, a whole Board, not one card of it) and the Boards filed in the Doc. Never a plan face, a system Board, a deleted Board or another Doc's.
//   one Board -> the note lands there, in the same two taps;  several -> she picks one;  none -> the sheet says so, and she picks a Board or leaves the note unfiled.
import { getJournalEntries, getProject, getSystemKind, isPairedPlanBoard } from '../store/persistence';

export interface DocBoard { id: string; updatedAt: string }
export type DocPlaces = { kind: 'one'; board: DocBoard } | { kind: 'many'; boards: DocBoard[] } | { kind: 'none' };

export function placesOfDoc(docId: string): DocPlaces {
  const doc = getProject(docId);
  if (!doc) return { kind: 'none' };
  const connected = new Set<string>();
  const assets = (doc.docSettings as { assets?: Array<{ entryId?: string; boxId?: string }> } | undefined)?.assets;
  for (const a of Array.isArray(assets) ? assets : []) if (a && typeof a.entryId === 'string' && !a.boxId) connected.add(a.entryId);
  const boards = getJournalEntries()
    .filter((e) => e.pageType === 'board' && !e.deletedAt && !e.purgedAt && e.origin !== 'system' && !getSystemKind(e) && !isPairedPlanBoard(e.id))
    .filter((e) => e.projectId === docId || connected.has(e.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((e) => ({ id: e.id, updatedAt: e.updatedAt }));
  if (boards.length === 0) return { kind: 'none' };
  return boards.length === 1 ? { kind: 'one', board: boards[0] } : { kind: 'many', boards };
}

import { graftsOf } from '../../store/grafts';

// THE CARDS OF OTHER CONNECTED BOARDS IN THE PLAN (Fable, Nov 21, ruling on FIX's queue item 5: "follow the Page's own board plus links. The Plan lists its own board's cards in their order, then each connected Board's
// cards as a group below, in that Board's order. A card may sit in two Plans (one card, two views). Re-ordering happens on its own board. Nothing new saved."). Which boards are connected is what the Assets tab already
// says (assetGroups.ts): a board linked whole to this Page, and a board that holds a card linked to it, in the order the Assets tab lists them, the Page's own board and a trashed one left out. Read, never written.
export function connectedBoardIds(pageId: string, ownBoardId: string | null): string[] {
  const g = graftsOf({ entryId: pageId });
  const ids: string[] = [];
  for (const r of [...g.Cards, ...g.Boards]) {
    if (r.trashed || r.entryId === pageId || r.entryId === ownBoardId || ids.includes(r.entryId)) continue;
    ids.push(r.entryId);
  }
  return ids;
}

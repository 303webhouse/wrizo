import type { GraftRow, Grafts, PlanGroup, SharedTagRow } from '../../store/grafts';

// THE BACK MENU'S ASSETS TAB (the reorg, phase 4.2, behind ?reorg=1 in Machina; reorg-plan.md section 9): today's links, GROUPED BY BOARD.
// "Grouped by board: the Page's own board first, then any other board connected to this Page, then Pages linked directly." Nothing here writes
// and nothing here is saved: it is a different way of reading what graftsOf and planGroupOf already return (a PageLink, a same-board connection,
// the Page's plan board). Pure, so it is proved without a browser (reorg-backmenu.mjs reads the same rows off the page).

export type AssetKind = 'card' | 'board' | 'page' | 'source';

export interface AssetItem {
  key: string;
  kind: AssetKind;
  row: GraftRow;
  /** A card of the Page's OWN board: its x hides it from this Page's list (never deletes it), as today's folded plan board does. */
  hideId?: string;
}

export interface AssetGroup {
  key: string;
  /** 'board': a board and the cards of it linked to this Page; 'pages': Docs and sources linked directly; 'tags': shared tags. */
  kind: 'board' | 'pages' | 'tags';
  boardId?: string;
  /** The Page's own board (first). */
  own: boolean;
  title: string;
  /** For a board linked as a whole: the link that connects it (the x on its head removes THIS link, never the board). */
  head?: GraftRow;
  items: AssetItem[];
  tags?: SharedTagRow[];
}

const kindOfRow = (r: GraftRow): AssetKind => (r.group === 'Cards' ? 'card' : r.group === 'Boards' ? 'board' : r.group === 'Sources' ? 'source' : 'page');

/** Group a page's links by board. `boardTitle` names a board by its entry id (the caller reads the board's own first line). */
export function assetGroupsOf(g: Grafts, plan: PlanGroup | null, boardTitle: (boardId: string) => string): AssetGroup[] {
  const groups: AssetGroup[] = [];
  const byBoard = new Map<string, AssetGroup>();
  const seen = new Set<string>();
  const boardGroup = (boardId: string, own: boolean): AssetGroup => {
    let grp = byBoard.get(boardId);
    if (!grp) {
      grp = { key: `board:${boardId}`, kind: 'board', boardId, own, title: boardTitle(boardId), items: [] };
      byBoard.set(boardId, grp);
      groups.push(grp);
    }
    return grp;
  };
  // 1. the Page's own board: its live cards that this Page has not hidden
  if (plan) {
    const own = boardGroup(plan.boardId, true);
    for (const c of plan.cards) {
      const key = `plan:${plan.boardId}:${c.boxId}`;
      seen.add(`${plan.boardId}:${c.boxId}`);
      own.items.push({
        key, kind: 'card', hideId: c.boxId,
        row: { key, group: 'Cards', entryId: plan.boardId, boxId: c.boxId, title: c.title, place: '', placeDiffers: false },
      });
    }
  }
  // 2. any other board connected to this Page: a board linked whole (its head), and the boards that hold a card linked to it
  // the boards that hold a linked card come first (in the order the links were made), then the boards linked whole with nothing of theirs listed
  for (const r of g.Cards) {
    const id = `${r.entryId}:${r.boxId ?? ''}`;
    if (seen.has(id)) continue;
    seen.add(id);
    boardGroup(r.entryId, !!plan && r.entryId === plan.boardId).items.push({ key: r.key, kind: 'card', row: r });
  }
  for (const r of g.Boards) {
    const grp = boardGroup(r.entryId, !!plan && r.entryId === plan.boardId);
    if (!grp.head) grp.head = r;
  }
  // 3. Pages linked directly (a Source is an imported or Research page, so it is listed here with them)
  const direct = [...g.Pages, ...g.Sources];
  if (direct.length) groups.push({ key: 'pages', kind: 'pages', own: false, title: '', items: direct.map((r) => ({ key: r.key, kind: kindOfRow(r), row: r })) });
  if (g.sharedTags.length) groups.push({ key: 'tags', kind: 'tags', own: false, title: '', items: [], tags: g.sharedTags });
  return groups;
}

/** How many assets the list holds (rows and linked boards; the shared tags are not assets). */
export function assetCount(groups: readonly AssetGroup[]): number {
  return groups.reduce((n, grp) => n + (grp.kind === 'tags' ? 0 : grp.items.length + (grp.head ? 1 : 0)), 0);
}

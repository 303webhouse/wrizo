import type { Box } from '../types';

// W1 - BOARD KINDS AND HOME VIEWS (Nick's option C; brief docs/guided-paths/w1-walk-brief.md). Pure: reads and writes only the board-meta box inside a board's own `boxes`; nothing here touches a store or the DOM.
//
//   Two true kinds: a BOARD (Open / Storyboard / Outline / Walk) and a BOOK (Flip / Thumbnails). A DECK is a Board whose home view is the Walk, born from a Preset. The JOURNAL is a Book - its kind is DERIVED from
//   board-meta.systemKind === 'journal' and never stored on it. Saved data: `boardKind` and `homeView`, optional, additive, on board-meta (types/index.ts). No field = a Board that opens in Open: no migration.
//   The DOOR chooses, never a picker (doorHome): New Board -> Open; a Preset -> a Deck (Walk); New Journal -> a Book (Flip - no such door exists yet).

export type BoardKind = 'board' | 'book';
export type BoardView = 'open' | 'storyboard' | 'outline' | 'walk' | 'flip' | 'thumbnails';

export const BOARD_VIEWS: BoardView[] = ['open', 'storyboard', 'outline', 'walk'];
export const BOOK_VIEWS: BoardView[] = ['flip', 'thumbnails'];

type EntryLike = { boxes?: Box[] | null } | null | undefined;
const metaOf = (entry: EntryLike): Box | undefined => (entry?.boxes ?? []).find((b) => b.kind === 'board-meta');

/** The kind of a board entry: the Journal is a Book (derived from its systemKind); a stored 'book' is a Book; everything else - including a board with no field at all - is a Board. */
export function kindOf(entry: EntryLike): BoardKind {
  const m = metaOf(entry);
  if (m?.systemKind === 'journal') return 'book';
  return m?.boardKind === 'book' ? 'book' : 'board';
}

export function viewsOf(kind: BoardKind): BoardView[] {
  return kind === 'book' ? BOOK_VIEWS : BOARD_VIEWS;
}

/** The view a board opens in before the writer has chosen one on this device. A value the kind does not have (or junk from an older / newer client) falls back to the kind's own default. */
export function homeViewOf(entry: EntryLike): BoardView {
  const kind = kindOf(entry);
  const kindDefault: BoardView = kind === 'book' ? 'flip' : 'open';
  const hv = metaOf(entry)?.homeView;
  return hv !== undefined && viewsOf(kind).includes(hv) ? hv : kindDefault;
}

/** A Deck is a Board whose home view is the Walk. */
export function isDeck(entry: EntryLike): boolean {
  return kindOf(entry) === 'board' && homeViewOf(entry) === 'walk';
}

/** The thumbnail a listing draws: a Board is wide, a Deck a short stack of three, a Book tall. */
export function thumbKind(entry: EntryLike): 'board' | 'deck' | 'book' {
  if (kindOf(entry) === 'book') return 'book';
  return isDeck(entry) ? 'deck' : 'board';
}

const DOORS = {
  'new-board': { boardKind: 'board', homeView: 'open' },
  preset: { boardKind: 'board', homeView: 'walk' },
  'new-journal': { boardKind: 'book', homeView: 'flip' },
} as const;
/** What each door makes - the door chooses, never a picker. */
export function doorHome(door: keyof typeof DOORS): { boardKind: BoardKind; homeView: BoardView } {
  const d = DOORS[door];
  return { boardKind: d.boardKind, homeView: d.homeView };
}

const stampNow = () => ({ updatedAt: new Date().toISOString() });

/**
 * Write (or clear, with null) the board's home view on its board-meta box. Returns the SAME array when nothing changes; keeps every other board-meta field (canvas size, lanes, footerOn, systemKind...);
 * creates the board-meta box only when there is none and a view is being set. It STAMPS board-meta.updatedAt: the board-level merge (store/boxTombstones mergeBoxLists) picks the greater `updatedAt` per box,
 * so a newer homeView wins a merge by its own stamp, not by a tie going to whichever side won the entry. It never writes `boardKind` (the Journal's is derived; nothing else is a Book yet).
 */
export function withHomeView(boxes: Box[], view: BoardView | null, newId: () => string): Box[] {
  const existing = boxes.find((b) => b.kind === 'board-meta');
  if (!existing) {
    if (view === null) return boxes;
    return [...boxes, { id: newId(), kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: view, ...stampNow() }];
  }
  if ((existing.homeView ?? null) === view) return boxes;
  const { homeView: _drop, ...rest } = existing;
  void _drop;
  const next: Box = view === null ? { ...rest, ...stampNow() } : { ...existing, homeView: view, ...stampNow() };
  return boxes.map((b) => (b === existing ? next : b));
}

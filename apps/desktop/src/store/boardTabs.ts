// ITEM 144 — THE BOARD TABS' READ SIDE (docs/menus/b144-board-tabs-build-brief.md
// T1-T4, as amended by b144-plus-menu-and-unnest-amendment.md).
//
// Pure derivations over the store's own readers. NOTHING here writes: a press
// on a tab travels, and the "+" menu's two acts go through the store's own
// `pinPageToBoard` / `createBoardPage` in BoardEditor.tsx, where item 92's
// "append to the component's live boxes" law lives.
//
// ONE DERIVATION, TWO DISPLAYS. The row and the crumb must agree about where a
// board sits, so a board appears ONCE, under the parent `boardNestChain` names
// (the first parent by `getBoardsConnecting`'s own stable order) — the same
// walk, not a second opinion.
import type { Box, JournalEntry } from '../types';
import {
  getJournalEntry, getProject, getBinderPages, getAllUserBoards, getBoardsConnecting,
  getSystemKind, wouldNestCycle,
} from './persistence';
import { boardName } from './entryText';
import { deskTerm } from './deskLexicon';
import { getBoardsBeside, isBeside } from './boardBeside';
import { orderByRecents } from './boardRecents';

// S0(d) — THE ONE "in X" HELPER. Item 163 wrote it locally in CascadePanels.tsx
// for the Plan row; the brief says whichever lands first builds it and the
// other reuses it, so it lives here and CascadePanels imports it. A location
// line always begins with its preposition, wherever it appears.
export function drawerCaptionFor(board: JournalEntry): string {
  const name = board.projectId ? (getProject(board.projectId)?.title || 'Untitled') : null;
  return name ? `${deskTerm('cascadePlanCaptionIn')} ${name}` : deskTerm('cascadePlanNoDrawer');
}

/** The tab's own label. Item 136's model: the board's name, 'Untitled' as the crumb's stand-in. */
export function boardTabTitle(entry: JournalEntry): string {
  return boardName(entry.text, 'Untitled');
}

// S0(c) — THE CHILDREN READER the brief asks for. Boards INSIDE `boardId`: its
// page-pin cards whose entry is a live, non-condition board — membership, not
// display (`onCanvas` is deliberately not consulted: a board nested and not yet
// placed is still inside). In the parent's reading order (y, then x — the order
// the Plan survey already uses).
export function getBoardsInside(boardId: string): JournalEntry[] {
  const board = getJournalEntry(boardId);
  if (!board) return [];
  const pins = (board.boxes ?? [])
    .filter((b: Box) => b.kind === 'page-pin' && b.entryId)
    .slice()
    .sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const out: JournalEntry[] = [];
  const seen = new Set<string>();
  for (const pin of pins) {
    const e = getJournalEntry(pin.entryId as string);
    if (!e || e.pageType !== 'board' || getSystemKind(e) !== undefined || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

export interface BoardTab {
  id: string;
  title: string;
  /** Nest depth in the row (0 = a root). Drawn as a joined-beneath hairline. */
  depth: number;
  isCurrent: boolean;
  /** The parent this tab is drawn beneath — the one `boardNestChain` names — or null for a root. */
  parentId: string | null;
  /** "in Research": present only when the board lives somewhere other than the row's drawer. */
  inLine: string | null;
  /** The parent's NAME as the row draws it (the one this tab hangs beneath), or null — for "Unlink from <parent>". */
  parentTitle: string | null;
  /** True when this tab is connected BESIDE the current board (never the current tab itself) — for "Unlink from <current>". */
  besideCurrent: boolean;
}

export interface BoardTabRow {
  /** The row's label: the DRAWER's name, or "Not in a drawer" for a loose board (SR-Q2, ruled). */
  label: string;
  tabs: BoardTab[];
}

const byBirth = (a: JournalEntry, b: JournalEntry) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/**
 * THE ROW (T2). The drawer's boards in BIRTH order — never `updatedAt`, which
 * would reshuffle the row on every edit — each followed immediately by its
 * children, depth nesting the same way. Condition boards (Journal/Shelf/Trash)
 * are excluded: a condition is not a place. The current board is a tab.
 *
 * WHO IS IN THE ROW: the drawer's boards; the current board (a loose board has
 * no drawer, so its row is itself and what it is connected to); the current
 * board's ancestors (the way up); and every descendant of any of those,
 * however far, drawn under its parent — including a child from ANOTHER drawer,
 * which carries the "in X" line.
 *
 * ORDER DOES NOT DEPEND ON WHERE YOU STAND: press a tab and only the
 * where-you-are marker moves. (The one thing that can change on a press is
 * membership of the row for a loose board, whose row is defined by connection.)
 */
export function boardTabRow(currentId: string): BoardTabRow | null {
  const current = getJournalEntry(currentId);
  if (!current || current.pageType !== 'board' || getSystemKind(current) !== undefined) return null;

  const drawerId = current.projectId ?? null;
  const label = drawerId ? (getProject(drawerId)?.title || 'Untitled') : deskTerm('cascadePlanNoDrawer');

  const inRow = new Map<string, JournalEntry>();
  const add = (e: JournalEntry | null) => {
    if (e && e.pageType === 'board' && !e.deletedAt && getSystemKind(e) === undefined) inRow.set(e.id, e);
  };
  if (drawerId) getBinderPages(drawerId).forEach(add);
  add(current);
  // The way up: every ancestor of the current board (walk with a seen-set —
  // data that arrives already cyclic must give a finite row, not a hang).
  {
    const seen = new Set<string>([currentId]);
    const stack = [currentId];
    while (stack.length) {
      const cur = stack.pop() as string;
      for (const p of getBoardsConnecting(cur)) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        add(getJournalEntry(p.id));
        stack.push(p.id);
      }
    }
  }
  // ITEM 144 — boards connected BESIDE the current one (either end stored it).
  // The row is "every connected board" (Nick), so a beside board is a tab even
  // from another drawer (it then wears its "in X" line).
  getBoardsBeside(currentId).forEach(add);
  // Every descendant of anything already in the row.
  {
    const seen = new Set<string>();
    const stack = [...inRow.keys()];
    while (stack.length) {
      const cur = stack.pop() as string;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const child of getBoardsInside(cur)) {
        add(child);
        stack.push(child.id);
      }
    }
  }

  // Rule 3 — a board sits under the FIRST parent `boardNestChain` names, and
  // only if that parent is itself in the row; otherwise it is a root.
  const besideIds = new Set(getBoardsBeside(currentId).map(b => b.id));
  const parentOf = new Map<string, string | null>();
  for (const e of inRow.values()) {
    const first = getBoardsConnecting(e.id).find(p => p.id !== e.id && inRow.has(p.id));
    parentOf.set(e.id, first ? first.id : null);
  }
  // A cycle in already-bad data could leave a component with no root; break it
  // by promoting the earliest-born member to a root, so nothing is silently dropped.
  const reachable = new Set<string>();
  const childrenOf = (pid: string) => getBoardsInside(pid).filter(c => inRow.has(c.id) && parentOf.get(c.id) === pid);
  const tabs: BoardTab[] = [];
  const emit = (e: JournalEntry, depth: number) => {
    if (reachable.has(e.id)) return;
    reachable.add(e.id);
    const foreign = (e.projectId ?? null) !== drawerId;
    tabs.push({
      id: e.id, title: boardTabTitle(e), depth, isCurrent: e.id === currentId,
      parentId: parentOf.get(e.id) ?? null,
      inLine: foreign ? drawerCaptionFor(e) : null,
      parentTitle: parentOf.get(e.id) ? boardTabTitle(inRow.get(parentOf.get(e.id) as string) as JournalEntry) : null,
      besideCurrent: e.id !== currentId && besideIds.has(e.id),
    });
    childrenOf(e.id).forEach(c => emit(c, depth + 1));
  };
  const roots = [...inRow.values()].filter(e => parentOf.get(e.id) === null).sort(byBirth);
  roots.forEach(r => emit(r, 0));
  [...inRow.values()].filter(e => !reachable.has(e.id)).sort(byBirth).forEach(e => emit(e, 0));
  return { label, tabs };
}

// --- THE CONNECT LIST (Add Board's second step, T4 minus its first row) -----

export type ConnectRowState = 'pressable' | 'already-inside' | 'contains-this-board';

export interface ConnectRow {
  id: string;
  title: string;
  inLine: string;
  state: ConnectRowState;
}

/**
 * Every board the writer might nest INSIDE `currentId`. One direction only —
 * "put a board inside this one" — because the card lands HERE, on the canvas
 * being looked at, so the act is visible.
 *
 *   self ................ ABSENT (nonsense, not a refusal — the one grammar)
 *   condition board ..... ABSENT (not a place)
 *   already inside ...... present, inert, says "already inside"
 *   an ancestor ......... present, inert, says "contains this board"
 *                         (item 128's first invariant, met where the writer meets it)
 *   any other ........... pressable
 *
 * The cycle state comes from `wouldNestCycle` — the store's one guard, with
 * its arguments in THIS mounting's order (chosen goes inside current) — so
 * this list and `pinPageToBoard` can never disagree about what may go where.
 */
export function connectListRows(currentId: string): ConnectRow[] {
  const current = getJournalEntry(currentId);
  if (!current) return [];
  const insideIds = new Set(getBoardsInside(currentId).map(b => b.id));
  return getAllUserBoards()
    .filter(b => b.id !== currentId)
    .sort(byBirth)
    .map<ConnectRow>(b => ({
      id: b.id,
      title: boardTabTitle(b),
      inLine: drawerCaptionFor(b),
      state: insideIds.has(b.id) ? 'already-inside'
        : wouldNestCycle(b.id, currentId) ? 'contains-this-board'
          : 'pressable',
    }));
}

// --- CONNECT BOARD (the "+" menu's third row) — a toggle-open list of ALL boards,
// most recently opened first, connecting the pick BESIDE the current board
// (docs/menus/b144-plus-menu-and-unnest-amendment.md §9.1/§9.4).
export type BesideRowState = 'pressable' | 'already-beside';

export interface BesideRow {
  id: string;
  title: string;
  inLine: string;
  state: BesideRowState;
}

/**
 * Every user board except the current one, ordered by `orderByRecents` (opened
 * on this device first, then never-opened by `updatedAt` — a stated fallback).
 * Self is ABSENT (nonsense, not a refusal); a board already beside this one is
 * present and inert, so a writer looking for it finds it. There is no cycle
 * state: "beside" contains nothing.
 */
export function connectBoardRows(currentId: string): BesideRow[] {
  return orderByRecents(getAllUserBoards().filter(b => b.id !== currentId))
    .map<BesideRow>(b => ({
      id: b.id,
      title: boardTabTitle(b),
      inLine: drawerCaptionFor(b),
      state: isBeside(currentId, b.id) ? 'already-beside' : 'pressable',
    }));
}

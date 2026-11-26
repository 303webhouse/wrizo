// WHAT THE PHONE'S SCREENS LIST (MOBILE slice 1, item 1). Pure READS of what is already stored, by the desk's own read-time rules, so the phone and the desk never disagree about what a Doc, a Project or a
// Board is: reorg/railData.ts (what is a Doc, a Project, Unfiled), reorg/partsSeam.ts (a Doc's Parts and names), the Plan tab's own rows (planOps, planPart) and the Assets tab's own groups (grafts, assetGroups).
// Nothing here writes, and nothing here is a new saved field. No word a writer sees is typed here: the stand-in for a nameless thing is handed in by the screen.
import type { Box, JournalEntry } from '../types';
import { getJournalEntries, getJournalEntry, getPlanBoardId, getSystemKind, isPairedPlanBoard } from '../store/persistence';
import { allDocRows, listOf, railProjects, unfiledMembers, type DocRow } from '../reorg/railData';
import { partsOfDoc } from '../reorg/partsSeam';
import { planRows, titleOfText } from '../reorg/backMenu/planOps';
import { partOfRow } from '../reorg/backMenu/planPart';
import { assetGroupsOf } from '../reorg/backMenu/assetGroups';
import { docAssetsOf } from '../reorg/docSettings';
import { graftsOf, planGroupOf } from '../store/grafts';
import type { RailRecord } from '../reorg/railSaved';   // the TYPE only: that module starts the desk's own rail sync when it is loaded, and the phone only reads
import { isDefaultRoot } from '../store/place';
import { firstPlainLine, plainLines } from '../store/entryText';
import { liveBoxes } from '../store/boxTombstones';
import { placesOfDoc, type DocPlaces } from './docBoards';

export interface Line { id: string; name: string; updatedAt: string }
export interface ProjectLine { id: string; name: string }

const live = (e: JournalEntry | null | undefined): e is JournalEntry => !!e && !e.deletedAt && !e.purgedAt;
const short = (s: string): string => (s.length > 60 ? s.slice(0, 60) + '…' : s);
const byRecent = (a: Line, b: Line): number => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);

export const boardName = (e: JournalEntry | null | undefined, untitled: string): string => short(firstPlainLine(e?.text ?? '') || untitled);
const boardLine = (e: JournalEntry, untitled: string): Line => ({ id: e.id, name: boardName(e, untitled), updatedAt: e.updatedAt });

/** A Doc as a row: its set's name, or its one page's. The id is the entry changed last (the way in). */
function docLine(row: DocRow, untitled: string): Line {
  return { id: row.lead.id, name: short((row.set ? row.set.title : partsOfDoc(row.lead).doc.name) || untitled), updatedAt: row.lead.updatedAt };
}

export function docLines(untitled: string): Line[] {
  return allDocRows().map((r) => docLine(r, untitled));
}

export interface DocView { name: string; setId: string | null; parts: Array<{ id: string; name: string; script: boolean }> }
/** The Doc an entry is a Part of (a loose page is a Doc of one Part), or null when it is gone. */
export function docView(entryId: string, untitled: string): DocView | null {
  const e = getJournalEntry(entryId);
  if (!live(e) || e.pageType === 'board') return null;
  const d = partsOfDoc(e);
  return { name: d.doc.name || untitled, setId: d.doc.set?.id ?? null, parts: d.parts.map((p) => ({ id: p.id, name: p.name || untitled, script: p.kind === 'script' })) };
}

export function projectLines(notebook: string, root: string): ProjectLine[] {
  return railProjects(notebook).map((p) => ({ id: p.id, name: p.drawer && isDefaultRoot(p.drawer) ? root : p.name }));
}

export function projectContents(projectId: string, untitled: string): { docs: Line[]; boards: Line[] } {
  const list = listOf(projectId);
  const docs = list.docs.map((d) => docLine({ set: d.set, parts: d.parts, lead: [...d.parts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] }, untitled));
  const boards = [...list.boards.map((b) => b.board), ...list.docs.flatMap((d) => d.boards)].map((b) => boardLine(b, untitled));
  return { docs, boards };
}

export function unfiledLines(untitled: string): { docs: Line[]; boards: Line[] } {
  const mine = unfiledMembers();
  return {
    docs: mine.filter((e) => e.pageType !== 'board').map((e) => docLine({ set: null, parts: [e], lead: e }, untitled)).sort(byRecent),
    boards: mine.filter((e) => e.pageType === 'board').map((e) => boardLine(e, untitled)).sort(byRecent),
  };
}

/** Every Board she can open: not a system Board, not a page's plan face, not deleted. */
export function allBoardLines(untitled: string): Line[] {
  return getJournalEntries()
    .filter((e) => e.pageType === 'board' && live(e) && e.origin !== 'system' && !getSystemKind(e) && !isPairedPlanBoard(e.id))
    .map((e) => boardLine(e, untitled))
    .sort(byRecent);
}

/** Pinned: her pinned Projects, in her order, from the account's rail record (read only). */
export function pinnedLines(rail: unknown, notebook: string, root: string): ProjectLine[] {
  if (!rail) return [];
  const all = new Map(projectLines(notebook, root).map((p) => [p.id, p]));
  // the desk's own rule for a pin (railSaved isPinnedFact and pinnedIdsOf): a pin stands unless it was removed after it was made; hers in her order
  return Object.entries((rail as RailRecord).pins ?? {})
    .filter(([, p]) => !!p && !(p.removedAt && p.removedAt >= p.at))
    .sort(([ia, a], [ib, b]) => a.order - b.order || (ia < ib ? -1 : 1))
    .map(([id]) => all.get(id))
    .filter((p): p is ProjectLine => !!p);
}

const cardLine = (b: Box): string => (b.kind === 'text' ? b.text ?? '' : b.kind === 'page-pin' && b.entryId ? titleOfText(getJournalEntry(b.entryId)?.text) : '');

export interface Found { key: string; label: string; where: string; to: string[] }
/** Find reaches a word across her Docs (names and every Part) and her cards (on any Board, a plan face too). Never anything deleted, never a system Board. */
export function findLines(q: string, untitled: string): Found[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const has = (s: string | undefined): boolean => (s ?? '').toLowerCase().includes(needle);
  const snippet = (s: string): string => {
    const line = plainLines(s).find((l) => has(l)) ?? plainLines(s)[0] ?? '';
    const at = Math.max(0, line.toLowerCase().indexOf(needle) - 30);
    return (at ? '…' : '') + short(line.slice(at));
  };
  const out: Found[] = [];
  for (const row of allDocRows()) {
    const name = docLine(row, untitled).name;
    const inParts = row.parts.filter((p) => has(p.text));
    // a Doc found by its name alone is listed once; one found in its words is listed by those Parts (a loose page is named by its own first line, so it would otherwise be listed twice)
    if (inParts.length === 0 && has(name)) out.push({ key: 'd' + row.lead.id, label: name, where: '', to: ['doc', row.lead.id, 'read', row.lead.id] });
    for (const p of inParts) out.push({ key: 'p' + p.id, label: name, where: snippet(p.text), to: ['doc', row.lead.id, 'read', p.id] });
  }
  for (const e of getJournalEntries()) {
    if (e.pageType !== 'board' || !live(e) || e.origin === 'system' || getSystemKind(e)) continue;
    const name = boardName(e, untitled);
    if (!isPairedPlanBoard(e.id) && has(e.text)) out.push({ key: 'b' + e.id, label: name, where: '', to: ['board', e.id, 'wall'] });
    for (const c of liveBoxes(e.boxes)) if (c.kind === 'text' && has(c.text)) out.push({ key: 'c' + e.id + c.id, label: snippet(c.text ?? ''), where: isPairedPlanBoard(e.id) ? '' : name, to: ['card', e.id, c.id] });
  }
  return out.slice(0, 80);
}

export interface PlanLine { key: string; depth: number; title: string; hint: string; written: boolean; partId: string | null; partName: string | null }
/** The Doc's Plan as one list: each Part's own plan Board (each once), in the Parts' order, rows as the desk's Plan tab shows them. A row is ticked when its Part has words: read, never saved. */
export function planView(entryId: string, untitled: string): PlanLine[] {
  const doc = docView(entryId, untitled);
  if (!doc) return [];
  const seen = new Set<string>();
  const out: PlanLine[] = [];
  for (const part of doc.parts) {
    const boardId = getPlanBoardId(part.id);
    const board = boardId ? getJournalEntry(boardId) : null;
    if (!live(board) || seen.has(board.id)) continue;
    seen.add(board.id);
    const hidden = new Set<string>(getJournalEntry(part.id)?.pageSettings?.hiddenPlanCards ?? []);
    for (const r of planRows(liveBoxes(board.boxes), hidden, (b) => cardLine(b))) {
      const to = partOfRow(board.id, r.boxId, doc.setId);
      out.push({ key: board.id + r.boxId, depth: r.depth, title: r.title, hint: r.hint, written: !!to?.written, partId: to?.id ?? null, partName: to ? doc.parts.find((p) => p.id === to.id)?.name ?? null : null });
    }
  }
  return out;
}

export interface CardLine { key: string; boardId: string; boxId: string; name: string }
export interface AssetList { cards: CardLine[]; boards: Line[]; pages: Line[] }
export interface AssetsView { part: AssetList; doc: AssetList }
const empty = (): AssetList => ({ cards: [], boards: [], pages: [] });

/** The open Part's assets (the desk's Assets tab rows) and the whole Doc's (its Doc assets, and the Boards connected to it). */
export function assetsView(partId: string, untitled: string): AssetsView {
  const view: AssetsView = { part: empty(), doc: empty() };
  const seen = new Set<string>();
  const add = (into: AssetList, entryId: string, boxId?: string): void => {
    const e = getJournalEntry(entryId);
    if (!live(e)) return;
    const key = entryId + '|' + (boxId ?? '');
    if (seen.has((into === view.doc ? 'doc ' : 'part ') + key)) return;
    seen.add((into === view.doc ? 'doc ' : 'part ') + key);
    if (boxId) {
      const box = liveBoxes(e.boxes).find((b) => b.id === boxId);
      if (box) into.cards.push({ key, boardId: entryId, boxId, name: short(firstPlainLine(cardLine(box)) || untitled) });
    } else if (e.pageType === 'board') into.boards.push(boardLine(e, untitled));
    else into.pages.push({ id: e.id, name: short(partsOfDoc(e).parts.find((p) => p.id === e.id)?.name || untitled), updatedAt: e.updatedAt });
  };
  const grafts = graftsOf({ entryId: partId });
  if (grafts) {
    for (const group of assetGroupsOf(grafts, planGroupOf(partId), () => '')) {
      if (group.kind === 'tags') continue;
      if (group.head && !group.own && group.boardId) add(view.part, group.boardId);
      for (const item of group.items) add(view.part, item.row.entryId, item.row.boxId);
    }
  }
  for (const a of docAssetsOf(partId)) add(view.doc, a.entryId, a.boxId);
  const doc = docView(partId, untitled);
  if (doc?.setId) {
    const places = placesOfDoc(doc.setId);
    for (const b of places.kind === 'many' ? places.boards : places.kind === 'one' ? [places.board] : []) add(view.doc, b.id);
  }
  return view;
}

/** A Doc chosen as the place for a note: ITS OWN connected Boards. A Doc she made: docBoards.ts. A loose page: the Boards linked to that page (never every Board of the set it happens to sit in). Nothing is made for a Doc. */
export function placesFor(entryId: string): DocPlaces {
  const doc = docView(entryId, '');
  if (!doc) return { kind: 'none' };
  if (doc.setId) return placesOfDoc(doc.setId);
  const boards = (graftsOf({ entryId })?.Boards ?? [])
    .map((r) => getJournalEntry(r.entryId))
    .filter((e): e is JournalEntry => live(e) && e.pageType === 'board' && !getSystemKind(e) && !isPairedPlanBoard(e.id))
    .map((e) => ({ id: e.id, updatedAt: e.updatedAt }));
  if (boards.length === 0) return { kind: 'none' };
  return boards.length === 1 ? { kind: 'one', board: boards[0] } : { kind: 'many', boards };
}

import type { Box, JournalEntry } from '../../types';
import { firstLine } from '../../store/entryText';
import { liveBoxes } from '../../store/boxTombstones';
import { getDrawers, getJournalEntry } from '../../store/persistence';
import { partsOfDoc } from '../partsSeam';
import { listOf, NOTEBOOK, projectOfEntry, unfiledMembers, type RailDoc } from '../railData';

// THE REORG'S SEARCH, what it finds (pure reads of the store; reorg plan draft 2 section 3 item 3, the prototype's runSearch, Nick's Nov 14
// rulings). Three reaches: This Doc (the words of the Doc she is in, by Part), This Project (its Docs, then its Boards: a Board by its name
// and its text cards), Everything (every Project in her order, the Notebook, then Unfiled, each under a head). Upper and lower case alike, no
// two finds overlapping; two letters or more. Imported files and feedback are later bets (the prototype's other two groups): nothing here.

export type Reach = 'doc' | 'project' | 'all';
export const REACHES: Reach[] = ['doc', 'project', 'all'];
export const MIN_LETTERS = 2;

/** One find: a word in a page's text, or in a board's own name or one of its text cards (boxId). */
export interface Hit { key: string; entryId: string; boxId: string | null; at: number; len: number; text: string }
/** A group of finds under a head. kind 'part' (This Doc), 'doc', 'board', or 'top' (a Project's head in Everything, with no rows). */
export interface HitGroup { id: string; kind: 'part' | 'doc' | 'board' | 'top'; name: string; n: number; rows: Hit[]; here: boolean }
export interface Found { q: string; reach: Reach; groups: HitGroup[]; here: Hit[]; total: number; project: string | null }

/** Where q is in text: upper and lower case alike, no two overlapping. */
export function findAll(text: string, q: string): number[] {
  const out: number[] = [];
  if (!q) return out;
  const lo = text.toLowerCase();
  const ql = q.toLowerCase();
  let at = lo.indexOf(ql);
  while (at !== -1) { out.push(at); at = lo.indexOf(ql, at + ql.length); }
  return out;
}

/** A few words either side of one find (the prototype's snippet): [before, the word, after], with an ellipsis where the text goes on. */
export function snippet(text: string, at: number, len: number): [string, string, string] {
  let from = Math.max(0, at - 22);
  let to = Math.min(text.length, at + len + 30);
  if (from > 0) { const sp = text.indexOf(' ', from); if (sp !== -1 && sp < at) from = sp + 1; }
  if (to < text.length) { const sp = text.lastIndexOf(' ', to); if (sp > at + len) to = sp; }
  return [(from > 0 ? '…' : '') + text.slice(from, at).replace(/\s+/g, ' '), text.slice(at, at + len),
    text.slice(at + len, to).replace(/\s+/g, ' ').replace(/[\s,;:]+$/, '') + (to < text.length ? '…' : '')];
}

export const hitKey = (entryId: string, boxId: string | null, at: number): string => `${entryId}|${boxId ?? ''}|${at}`;

function pageHits(e: JournalEntry, q: string): Hit[] {
  const text = e.text ?? '';
  return findAll(text, q).map((at) => ({ key: hitKey(e.id, null, at), entryId: e.id, boxId: null, at, len: q.length, text }));
}

function boardName(b: JournalEntry): string { return firstLine(b.text ?? '').trim(); }

function boardHits(b: JournalEntry, q: string): Hit[] {
  const name = boardName(b);
  const out: Hit[] = findAll(name, q).map((at) => ({ key: hitKey(b.id, null, at), entryId: b.id, boxId: null, at, len: q.length, text: name }));
  for (const box of liveBoxes(b.boxes) as Box[]) {   // a deleted card (a tombstone) is not a hit; box-tombstones T11 counts raw `.boxes` reads
    if (box.kind !== 'text') continue;
    const title = (box as Box & { title?: string }).title ?? '';
    const words = [title, box.text ?? ''].filter(Boolean).join(' · ');
    for (const at of findAll(words, q)) out.push({ key: hitKey(b.id, box.id, at), entryId: b.id, boxId: box.id, at, len: q.length, text: words });
  }
  return out;
}

const docName = (d: RailDoc): string => (d.set ? d.set.title : firstLine(d.parts[0]?.text ?? '').trim());
const docId = (d: RailDoc): string => (d.set ? d.set.id : d.parts[0]?.id ?? '');

/** One Project's groups (or the Notebook's, or Unfiled's): its Docs, then its Boards (frame P3-26A2). The Doc she is in reads `hereHits`. */
function projectGroups(docs: RailDoc[], boards: JournalEntry[], q: string, hereDoc: string, hereHits: Hit[]): HitGroup[] {
  const out: HitGroup[] = [];
  for (const d of docs) {
    const id = docId(d);
    const here = id === hereDoc;
    const rows = here ? hereHits : d.parts.flatMap((p) => pageHits(p, q));
    if (rows.length) out.push({ id, kind: 'doc', name: docName(d), n: rows.length, rows, here });
  }
  for (const b of boards) {
    const rows = boardHits(b, q);
    if (rows.length) out.push({ id: b.id, kind: 'board', name: boardName(b), n: rows.length, rows, here: false });
  }
  return out;
}

function unfiledList(): { docs: RailDoc[]; boards: JournalEntry[] } {
  const members = unfiledMembers().filter((e) => !e.deletedAt && !e.purgedAt);
  return { docs: members.filter((e) => e.pageType !== 'board').map((p) => ({ set: null, parts: [p], boards: [] })), boards: members.filter((e) => e.pageType === 'board') };
}

/** What a search finds from the page she is on. Below MIN_LETTERS it finds nothing (q is ''). */
export function runSearch(entry: JournalEntry, rawQ: string, reachIn: Reach): Found {
  const project = projectOfEntry(entry);
  const reach: Reach = reachIn === 'project' && project == null ? 'doc' : reachIn;
  const q = rawQ.trim().length >= MIN_LETTERS ? rawQ.trim() : '';
  const found: Found = { q, reach, groups: [], here: [], total: 0, project };
  if (!q) return found;
  const parts = partsOfDoc(entry);
  // the Doc she is in, Part by Part, read from the store (the open Part's newest words reach it within the page's own save)
  for (const p of parts.parts) { const e = getJournalEntry(p.id); if (e) found.here.push(...pageHits(e, q)); }
  const hereDoc = parts.doc.id;
  if (reach === 'doc') {
    for (const p of parts.parts) {
      const rows = found.here.filter((h) => h.entryId === p.id);
      if (rows.length) found.groups.push({ id: p.id, kind: 'part', name: String(p.n), n: rows.length, rows, here: p.id === entry.id });
    }
  } else if (reach === 'project' && project != null) {
    const l = listOf(project);
    found.groups = projectGroups(l.docs, [...l.docs.flatMap((d) => d.boards), ...l.boards.map((b) => b.board)], q, hereDoc, found.here);
  } else {
    const ids = [...getDrawers().slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((d) => d.id), NOTEBOOK];
    const under = (id: string, groups: HitGroup[]) => {
      const n = groups.reduce((s, g) => s + g.n, 0);
      if (n) found.groups.push({ id, kind: 'top', name: id, n, rows: [], here: false }, ...groups);
    };
    for (const id of ids) {
      const l = listOf(id);
      under(id, projectGroups(l.docs, [...l.docs.flatMap((d) => d.boards), ...l.boards.map((b) => b.board)], q, hereDoc, found.here));
    }
    const u = unfiledList();
    under('unfiled', projectGroups(u.docs, u.boards, q, hereDoc, found.here));
  }
  found.total = found.groups.reduce((s, g) => s + (g.kind === 'top' ? 0 : g.n), 0);
  return found;
}

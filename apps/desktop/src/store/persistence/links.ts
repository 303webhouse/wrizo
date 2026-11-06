import type { PageLink, JournalEntry, Box } from '../../types';
import { liveBoxes, isTombstoned } from '../boxTombstones';
import { withoutFontMarks } from '../markRuns';   // page-link labels read the words [persistence §1]
import { cache, clone, generateId } from './core';
import { saveJournalEntry } from './journal';
import { getJournalEntry } from './entries';

// ============================================================================================================================================================
// CONNECTOR-B - PAGE LINKS (docs/plans/connector-b-page-links.md). The pairs a connection box cannot hold: an end that is an ENTRY (a page or a board), or a card on another board.
//   THE ONE-TRUTH RULE: a link between two boxes of the SAME board is ALWAYS a connection box; a record here holds only what a box cannot - so a pair is never represented twice. The connector decides at creation
//   (BoardEditor: a target that is a live pin card on this board is that CARD, and gets a connection box), and a toggle off removes whichever record joins the pair.
//   Records are SINGLE-OWNER: stored once, on the entry where the writer started the link; the reverse is a cache scan (getPageLinksTo), exactly as getBoardsPinning scans for pins. Last-write-wins like `boxes`:
//   the whole array travels with the owner entry's updatedAt. A delete is a tombstone (deletedAt + updatedAt) so it syncs and cannot resurrect.
// ============================================================================================================================================================
const liveLink = (l: PageLink): boolean => !l.deletedAt;
const labelOf = (text: string | undefined): string => (withoutFontMarks(text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || 'Untitled';   // the words, never a span's marks [persistence §9]

/** Link records OWNED by this entry (live only). */
export function getPageLinksOf(entryId: string): PageLink[] {
  const e = cache.journalEntries.find(x => x.id === entryId);
  return (e?.pageLinks ?? []).filter(liveLink).map(clone);
}

/** Link records, from any LIVE entry, whose OTHER end is this entry (and card, when given). The reverse read: a cache scan. */
export function getPageLinksTo(entryId: string, boxId?: string): PageLink[] {
  const out: PageLink[] = [];
  for (const e of cache.journalEntries) {
    if (e.deletedAt || e.id === entryId) continue;
    for (const l of e.pageLinks ?? []) {
      if (!liveLink(l) || l.bEntryId !== entryId) continue;
      if (boxId !== undefined && l.bBoxId !== boxId) continue;
      out.push(clone(l));
    }
  }
  return out;
}

export interface LinkPeer {
  key: string;                         // stable id for the row
  via: 'card' | 'link';                // 'card': a same-board connection box; 'link': a page_links record
  connId?: string;                     // via 'card' - the connection box id
  linkId?: string;                     // via 'link' - the record id
  entryId?: string; boxId?: string;    // via 'link' - where the other end lives
  cardBoxId?: string;                  // via 'card' - the other card's box id on this board
  kind: 'card' | 'page' | 'board';
  label: string;
  trashed?: boolean;                   // the other end is in the Trash (shown as such, never "Missing")
  reverse?: boolean;                   // the record is owned by the OTHER end
}

function describeEnd(entryId: string, boxId: string | undefined): { kind: 'card' | 'page' | 'board'; label: string; trashed: boolean } | null {
  const e = cache.journalEntries.find(x => x.id === entryId);
  // hard-deleted, or deleted for good (a shell - a device that had not heard can still hold a link to it): a dangling end is dropped at read,
  // never "Missing page", never a Trash end that leads back to an empty shell
  if (!e || e.purgedAt) return null;
  const trashed = !!e.deletedAt;
  if (boxId) {
    const b = (e.boxes ?? []).find(x => x.id === boxId);
    if (!b || b.deletedAt || b.purgedAt) return null;
    if (b.kind === 'text') return { kind: 'card', label: labelOf(b.text), trashed };
    if (b.kind === 'page-pin' && b.entryId) { const t = cache.journalEntries.find(x => x.id === b.entryId); return t ? { kind: t.pageType === 'board' ? 'board' : 'page', label: labelOf(t.text), trashed: trashed || !!t.deletedAt } : null; }
    return { kind: 'card', label: 'A sketch', trashed };
  }
  return { kind: e.pageType === 'board' ? 'board' : 'page', label: labelOf(e.text), trashed };
}

/** Everything a card on a board is connected to: the same-board connection boxes AND the page_links records (owned or reverse) - ONE list for the Grafts/Links tab. */
export function getLinkPeersOfCard(boardId: string, boxId: string, boxes?: readonly Box[]): LinkPeer[] {
  const board = cache.journalEntries.find(x => x.id === boardId);
  if (!board) return [];
  const out: LinkPeer[] = [];
  const live = liveBoxes(boxes ?? board.boxes);
  for (const c of live) {
    if (c.kind !== 'connection' || (c.connA !== boxId && c.connB !== boxId)) continue;
    const otherId = c.connA === boxId ? c.connB : c.connA;
    const other = live.find(b => b.id === otherId);
    if (!other) continue;
    let kind: LinkPeer['kind'] = 'card'; let label = 'A sketch'; let trashed = false;
    if (other.kind === 'text') label = labelOf(other.text);
    else if (other.kind === 'page-pin' && other.entryId) { const t = cache.journalEntries.find(x => x.id === other.entryId); if (!t) continue; kind = t.pageType === 'board' ? 'board' : 'page'; label = labelOf(t.text); trashed = !!t.deletedAt; }
    out.push({ key: `card:${c.id}`, via: 'card', connId: c.id, cardBoxId: other.id, kind, label, trashed });
  }
  for (const l of board.pageLinks ?? []) {
    if (!liveLink(l) || l.aBoxId !== boxId) continue;
    const d = describeEnd(l.bEntryId, l.bBoxId);
    if (d) out.push({ key: `link:${l.id}`, via: 'link', linkId: l.id, entryId: l.bEntryId, boxId: l.bBoxId, ...d });
  }
  for (const l of getPageLinksTo(boardId, boxId)) {
    const d = describeEnd(l.aEntryId, l.aBoxId);
    if (d) out.push({ key: `link:${l.id}`, via: 'link', linkId: l.id, entryId: l.aEntryId, boxId: l.aBoxId, reverse: true, ...d });
  }
  return out;
}

/** EVERY card of a board at once - one scan of the cache, not one per card (the footers draw on every render). */
export function getLinkPeersByCard(boardId: string, boxes: readonly Box[]): Map<string, LinkPeer[]> {
  const out = new Map<string, LinkPeer[]>();
  const board = cache.journalEntries.find(x => x.id === boardId);
  if (!board) return out;
  const push = (cardId: string, peer: LinkPeer) => { const a = out.get(cardId); if (a) a.push(peer); else out.set(cardId, [peer]); };
  for (const l of board.pageLinks ?? []) {
    if (!liveLink(l) || !l.aBoxId) continue;
    const d = describeEnd(l.bEntryId, l.bBoxId);
    if (d) push(l.aBoxId, { key: `link:${l.id}`, via: 'link', linkId: l.id, entryId: l.bEntryId, boxId: l.bBoxId, ...d });
  }
  for (const e of cache.journalEntries) {
    if (e.deletedAt || e.id === boardId) continue;
    for (const l of e.pageLinks ?? []) {
      if (!liveLink(l) || l.bEntryId !== boardId || !l.bBoxId) continue;
      const d = describeEnd(l.aEntryId, l.aBoxId);
      if (d) push(l.bBoxId, { key: `link:${l.id}`, via: 'link', linkId: l.id, entryId: l.aEntryId, boxId: l.aBoxId, reverse: true, ...d });
    }
  }
  void boxes;
  return out;
}

/** Is there a live link joining these two ends (either direction, owned by either)? */
function findLinkBetween(aEntryId: string, aBoxId: string | undefined, bEntryId: string, bBoxId: string | undefined): { owner: JournalEntry; link: PageLink } | null {
  for (const e of cache.journalEntries) {
    for (const l of e.pageLinks ?? []) {
      if (!liveLink(l)) continue;
      const fwd = l.aEntryId === aEntryId && (l.aBoxId ?? null) === (aBoxId ?? null) && l.bEntryId === bEntryId && (l.bBoxId ?? null) === (bBoxId ?? null);
      const rev = l.aEntryId === bEntryId && (l.aBoxId ?? null) === (bBoxId ?? null) && l.bEntryId === aEntryId && (l.bBoxId ?? null) === (aBoxId ?? null);
      if (fwd || rev) return { owner: e, link: l };
    }
  }
  return null;
}

/** Make a link, OWNED by `ownerEntryId` (where the writer started it). Idempotent: an existing live link between the same two ends (either direction) is returned, never doubled. */
export function addPageLink(ownerEntryId: string, end: { aBoxId?: string; bEntryId: string; bBoxId?: string }): PageLink | null {
  const owner = getJournalEntry(ownerEntryId);
  if (!owner || ownerEntryId === end.bEntryId && !end.bBoxId && !end.aBoxId) return null;
  if (!cache.journalEntries.some(x => x.id === end.bEntryId)) return null;
  const existing = findLinkBetween(ownerEntryId, end.aBoxId, end.bEntryId, end.bBoxId);
  if (existing) return clone(existing.link);
  const now = new Date().toISOString();
  const rec: PageLink = { id: generateId(), aEntryId: ownerEntryId, bEntryId: end.bEntryId, createdAt: now, updatedAt: now };
  if (end.aBoxId) rec.aBoxId = end.aBoxId;
  if (end.bBoxId) rec.bBoxId = end.bBoxId;
  saveJournalEntry({ ...owner, pageLinks: [...(owner.pageLinks ?? []), rec] });
  return clone(rec);
}

/** Remove a link: stamp the tombstone (deletedAt + updatedAt) on its record and save the OWNER (which carries it to the server). */
export function removePageLink(linkId: string): boolean {
  for (const e of cache.journalEntries) {
    const l = (e.pageLinks ?? []).find(x => x.id === linkId);
    if (!l || !liveLink(l)) continue;
    const now = new Date().toISOString();
    saveJournalEntry({ ...clone(e), pageLinks: (e.pageLinks ?? []).map(x => (x.id === linkId ? { ...x, deletedAt: now, updatedAt: now } : x)) });
    return true;
  }
  return false;
}

/** The connector's release on an ENTRY (a rail thumbnail): link the card to it, or - already linked - unlink. Returns what happened. */
export function toggleEntryLink(boardId: string, cardBoxId: string, targetEntryId: string): 'linked' | 'unlinked' | null {
  if (boardId === targetEntryId) return null;
  const found = findLinkBetween(boardId, cardBoxId, targetEntryId, undefined);
  if (found) return removePageLink(found.link.id) ? 'unlinked' : null;
  return addPageLink(boardId, { aBoxId: cardBoxId, bEntryId: targetEntryId }) ? 'linked' : null;
}

/** THE ONE-TRUTH RULE at the door: when the entry a connector lands on is ALREADY a live pin card on THIS board, the pair is two cards of one board - the caller makes a connection box to that card, never a record here. */
export function livePinFor(boardId: string, entryId: string): Box | null {
  const b = liveBoxes(cache.journalEntries.find(x => x.id === boardId)?.boxes).find(x => x.kind === 'page-pin' && x.entryId === entryId && x.onCanvas !== false);
  return b ? clone(b) : null;
}

/** Is this card linked to that entry (a rail thumbnail's circle: open / solid)? */
export function isCardLinkedToEntry(boardId: string, cardBoxId: string, targetEntryId: string): boolean {
  return !!findLinkBetween(boardId, cardBoxId, targetEntryId, undefined);
}

/** One tombstoned box, read for a Trash card's face. */
export function getTombstonedBox(boardId: string, boxId: string): Box | null {
  const b = (cache.journalEntries.find(e => e.id === boardId)?.boxes ?? []).find(x => x.id === boxId);
  return b && isTombstoned(b) ? clone(b) : null;
}

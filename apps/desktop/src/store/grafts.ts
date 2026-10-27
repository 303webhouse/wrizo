// BIG PROJECTS STEP 3 - GRAFTS, "connected to this page" (docs/plans/big-projects.md step 3 + the graft-doors addendum; mockup
// cursor/graft-doors-mockup @ c4f34eb0, Nick approved; Fable cleared step 3 Oct 19, Q10: a checked picker row is inert). The readers and
// the few writes behind the Grafts tab (components/ConnectionsDrawerPanel.tsx), the "+ Graft..." picker (components/GraftPicker.tsx) and the
// knob's landing. SCHEMA CHANGE: NONE - a graft is a page_links record (connector-b) or a same-board connection box, and a hidden plan card
// is an id in pageSettings.hiddenPlanCards (the existing whole-blob jsonb, the way pageSettings.template shipped).
//
// THE FILE SPLIT (docs/plans/big-projects-3-file-split.md, agreed with INK): this lives here, not in store/place.ts (INK's step 1a) or
// persistence.ts. PLACE LABELS come from 1a's own reader, placeOfEntry (rebased onto 1a+2 @ 4913a47f), named in the place block's own words -
// this function is the one site.
//
// EVERY reader skips a built-in place (a system board) and a delete-for-good shell; a trashed entry shows only where connector-b already
// shows one (a graft's other end, flagged `trashed`), never in the search.
import type { Box, JournalEntry } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import {
  addPageLink, getDrawer, getJournalEntries, getJournalEntry, getJournalEntryIncludingDeleted, getLinkPeersOfCard, getPageLinksOf,
  getPageLinksTo, getPairedPageId, getPlanBoardId, getSystemKind, livePinFor, saveJournalEntry,
} from './persistence';
import { liveBoxes } from './boxTombstones';
import { deskTerm } from './deskLexicon';
import { UNSORTED, placeOfEntry } from './place';
import { isDeck } from './boardKind';

/** What Grafts is about: a page or a board (an entry), or a card on a board (the entry is the board, `boxId` the card). */
export interface GraftSubject { entryId: string; boxId?: string }
/** What a graft points at: an entry, or a card on a board. */
export interface GraftTarget { entryId: string; boxId?: string }

export type GraftGroup = 'Cards' | 'Sources' | 'Boards' | 'Pages';

export interface GraftRow {
  key: string;
  group: GraftGroup;
  entryId: string;
  boxId?: string;
  title: string;
  place: string;            // the place label: a Drawer's name, "Unsorted", or "Journal"
  placeDiffers: boolean;    // the faint label shows only when this is in another place than the subject
  checked?: boolean;        // the picker: already grafted (a check mark, inert - Q10)
  via?: 'card' | 'link';    // the panel: a same-board connection box, or a page_links record
  linkId?: string;
  connId?: string;
  trashed?: boolean;
}

export interface SharedTagRow { key: string; entryId: string; title: string; tag: string; place: string; placeDiffers: boolean }

export interface Grafts { Cards: GraftRow[]; Sources: GraftRow[]; Boards: GraftRow[]; Pages: GraftRow[]; sharedTags: SharedTagRow[] }

export interface PlanGroup { boardId: string; cards: { boxId: string; title: string }[]; count: number }

export type GraftMade = { made: 'link'; linkId: string } | { made: 'connection'; a: string; b: string } | null;

/** W2: how a step of a Deck is named away from its own board: "Three-Act · Midpoint" (the Deck's name, then the step's). */
export const STEP_SEP = ' · ';
export function stepLabel(deck: string, card: string): string { return `${deck}${STEP_SEP}${card}`; }

const CARD_KINDS = new Set<Box['kind']>(['text', 'ink']);
const titleOf = (text: string | undefined): string => ((text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || 'Untitled';
const cardTitle = (b: Box): string => (b.kind === 'ink' ? 'A sketch' : titleOf(b.text));
const isShell = (e: JournalEntry | null | undefined): boolean => !!(e as { purgedAt?: string } | null | undefined)?.purgedAt;

/** The place an entry lives in, as its label: its set's Drawer name; "Unsorted" for a set with no live Drawer; the Journal for an entry with
 *  no live home. 1a's placeOfEntry decides the place; the words are the place block's own (components/PlaceBlock.tsx). */
export function placeLabelOf(entryId: string): string {
  // getJournalEntry first: it also resolves a brand-new page's unborn slot (its binder from the door), so its place is right before birth
  const e = getJournalEntry(entryId) ?? getJournalEntryIncludingDeleted(entryId);
  if (!e) return '';
  const place = placeOfEntry(e);
  if (place.kind === 'journal') return deskTerm('drawerPlaceJournal');
  if (place.id === UNSORTED) return deskTerm('switcherUnsorted');
  return getDrawer(place.id)?.name ?? '';
}

const boxesOf = (boardId: string, boxes?: readonly Box[]): Box[] => liveBoxes((boxes as Box[] | undefined) ?? getJournalEntry(boardId)?.boxes ?? []);

/** Is the target already grafted to the subject (a record either way round, or - for a card - a same-board connection box)? */
export function isGrafted(subject: GraftSubject, target: GraftTarget, boxes?: readonly Box[]): boolean {
  const tBox = target.boxId ?? null;
  if (!subject.boxId) {
    const own = getPageLinksOf(subject.entryId).some(l => !l.aBoxId && l.bEntryId === target.entryId && (l.bBoxId ?? null) === tBox);
    const rev = getPageLinksTo(subject.entryId).some(l => !l.bBoxId && l.aEntryId === target.entryId && (l.aBoxId ?? null) === tBox);
    return own || rev;
  }
  const boardId = subject.entryId;
  const peers = getLinkPeersOfCard(boardId, subject.boxId, boxes);
  let cardOnBoard: string | null = target.entryId === boardId && tBox ? tBox : null;
  if (!cardOnBoard && !tBox) { const pin = livePinFor(boardId, target.entryId); if (pin) cardOnBoard = pin.id; }
  if (cardOnBoard) return peers.some(p => p.via === 'card' && p.cardBoxId === cardOnBoard);
  return peers.some(p => p.via === 'link' && p.entryId === target.entryId && (p.boxId ?? null) === tBox);
}

/** The picker: Cards / Pages / Boards from EVERY place, each with its place label and whether it is already grafted. Never the subject
 *  itself, a built-in place, a trashed entry or a shell. Filters by title or place label, case-insensitively. */
export function searchGraftables(query: string, subject: GraftSubject, boxes?: readonly Box[], only?: 'pages'): { Cards: GraftRow[]; Pages: GraftRow[]; Boards: GraftRow[] } {
  const q = query.trim().toLowerCase();
  const subjectPlace = placeLabelOf(subject.entryId);
  const out = { Cards: [] as GraftRow[], Pages: [] as GraftRow[], Boards: [] as GraftRow[] };
  const match = (title: string, place: string) => !q || title.toLowerCase().includes(q) || place.toLowerCase().includes(q);
  const entries = getJournalEntries().filter(e => !getSystemKind(e) && !isShell(e)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const e of entries) {
    const place = placeLabelOf(e.id);
    if (e.pageType === 'board') {
      if (only === 'pages') continue;   // W2 "Place a page...": the picker filtered to pages - no board, no card
      const title = titleOf(e.text);
      const isSubject = e.id === subject.entryId && !subject.boxId;
      if (!isSubject && match(title, place)) {
        out.Boards.push({ key: `entry:${e.id}`, group: 'Boards', entryId: e.id, title, place, placeDiffers: place !== subjectPlace, checked: isGrafted(subject, { entryId: e.id }, boxes) });
      }
      const live = e.id === subject.entryId && boxes ? liveBoxes(boxes as Box[]) : liveBoxes(e.boxes ?? []);
      for (const b of live) {
        if (b.kind !== 'text' || !(b.text ?? '').trim()) continue;
        if (e.id === subject.entryId && b.id === subject.boxId) continue;
        const ct = cardTitle(b);
        if (!match(ct, place)) continue;
        out.Cards.push({ key: `card:${e.id}:${b.id}`, group: 'Cards', entryId: e.id, boxId: b.id, title: ct, place, placeDiffers: place !== subjectPlace, checked: isGrafted(subject, { entryId: e.id, boxId: b.id }, boxes) });
      }
      continue;
    }
    if (e.id === subject.entryId) continue;
    const title = titleOf(e.text);
    if (!match(title, place)) continue;
    out.Pages.push({ key: `entry:${e.id}`, group: 'Pages', entryId: e.id, title, place, placeDiffers: place !== subjectPlace, checked: isGrafted(subject, { entryId: e.id }, boxes) });
  }
  return out;
}

/** Graft the target to the subject. A page subject owns a page_links record. A card subject: another card on the same board, or a page
 *  pinned on that board, is a CONNECTION BOX (the one-truth rule - the caller makes it through the board, which owns its own boxes);
 *  anything else is a record owned by the board with aBoxId = the card. Null (nothing written) for a self-graft, a target that is not
 *  there, or one already grafted (Q10: a checked row is inert). */
export function graftTo(subject: GraftSubject, target: GraftTarget, boxes?: readonly Box[]): GraftMade {
  const t = getJournalEntry(target.entryId);
  if (!t || isShell(t) || getSystemKind(t)) return null;
  if (target.boxId && !boxesOf(target.entryId, target.entryId === subject.entryId ? boxes : undefined).some(b => b.id === target.boxId)) return null;
  if (!subject.boxId && target.entryId === subject.entryId && !target.boxId) return null;
  if (subject.boxId && target.entryId === subject.entryId && target.boxId === subject.boxId) return null;
  if (isGrafted(subject, target, boxes)) return null;
  if (!subject.boxId) {
    const rec = addPageLink(subject.entryId, { bEntryId: target.entryId, ...(target.boxId ? { bBoxId: target.boxId } : {}) });
    return rec ? { made: 'link', linkId: rec.id } : null;
  }
  const boardId = subject.entryId;
  if (target.entryId === boardId && target.boxId) return { made: 'connection', a: subject.boxId, b: target.boxId };
  if (!target.boxId) { const pin = livePinFor(boardId, target.entryId); if (pin) return { made: 'connection', a: subject.boxId, b: pin.id }; }
  const rec = addPageLink(boardId, { aBoxId: subject.boxId, bEntryId: target.entryId, ...(target.boxId ? { bBoxId: target.boxId } : {}) });
  return rec ? { made: 'link', linkId: rec.id } : null;
}

const groupOf = (e: JournalEntry, boxId: string | undefined): GraftGroup => {
  if (boxId) return 'Cards';
  if (e.pageType === 'board') return 'Boards';
  // Q7 (Fable, Oct 18): Sources = imported documents (an import stamp) or Research-kind pages - shown under Sources, not under Pages
  if (e.importedAt || e.pageSettings?.kind === 'research') return 'Sources';
  return 'Pages';
};

/** The Grafts list: Cards, Sources, Boards, Pages (links either way round; for a card, its same-board connections too), and Shared tags. */
export function graftsOf(subject: GraftSubject, boxes?: readonly Box[]): Grafts {
  const out: Grafts = { Cards: [], Sources: [], Boards: [], Pages: [], sharedTags: [] };
  const subjectPlace = placeLabelOf(subject.entryId);
  const seen = new Set<string>();
  const push = (key: string, end: { entryId: string; boxId?: string }, extra: Partial<GraftRow>) => {
    if (seen.has(key)) return;
    const e = getJournalEntryIncludingDeleted(end.entryId);
    if (!e || isShell(e) || getSystemKind(e)) return;
    let title = titleOf(e.text);
    if (end.boxId) {
      const b = liveBoxes(e.boxes ?? []).find(x => x.id === end.boxId);
      if (!b) return;
      title = cardTitle(b);
      // W2: a step of a DECK reads "Deck · Step" on another surface's list ("Three-Act · Midpoint"); on its own board it is just the card
      if (e.id !== subject.entryId && isDeck(e)) title = stepLabel(titleOf(e.text), title);
    }
    seen.add(key);
    const place = placeLabelOf(e.id);
    const group = groupOf(e, end.boxId);
    out[group].push({ key, group, entryId: e.id, ...(end.boxId ? { boxId: end.boxId } : {}), title, place, placeDiffers: place !== subjectPlace, ...(e.deletedAt ? { trashed: true } : {}), ...extra });
  };
  if (!subject.boxId) {
    for (const l of getPageLinksOf(subject.entryId)) if (!l.aBoxId) push(`link:${l.id}`, { entryId: l.bEntryId, boxId: l.bBoxId }, { via: 'link', linkId: l.id });
    for (const l of getPageLinksTo(subject.entryId)) if (!l.bBoxId) push(`link:${l.id}`, { entryId: l.aEntryId, boxId: l.aBoxId }, { via: 'link', linkId: l.id });
  } else {
    const boardId = subject.entryId;
    const live = boxesOf(boardId, boxes);
    for (const p of getLinkPeersOfCard(boardId, subject.boxId, boxes)) {
      if (p.via === 'link' && p.entryId && p.linkId) { push(`link:${p.linkId}`, { entryId: p.entryId, boxId: p.boxId }, { via: 'link', linkId: p.linkId }); continue; }
      if (p.via !== 'card' || !p.cardBoxId || !p.connId) continue;
      const other = live.find(b => b.id === p.cardBoxId);
      if (!other) continue;
      if (other.kind === 'page-pin' && other.entryId) push(`card:${p.connId}`, { entryId: other.entryId }, { via: 'card', connId: p.connId });
      else if (CARD_KINDS.has(other.kind)) push(`card:${p.connId}`, { entryId: boardId, boxId: other.id }, { via: 'card', connId: p.connId });
    }
  }
  // Shared tags: every live entry sharing a tag with the subject, once, with the first tag they share (a card carries no tags of its own)
  const subj = subject.boxId ? null : getJournalEntry(subject.entryId);
  const tags = subj?.tags ?? [];
  if (tags.length > 0) {
    for (const e of getJournalEntries()) {
      if (e.id === subject.entryId || getSystemKind(e) || isShell(e)) continue;
      const shared = tags.find(tg => (e.tags ?? []).includes(tg));
      if (!shared) continue;
      const place = placeLabelOf(e.id);
      out.sharedTags.push({ key: `tag:${e.id}`, entryId: e.id, title: titleOf(e.text), tag: shared, place, placeDiffers: place !== subjectPlace });
    }
  }
  return out;
}

/** A board's paired page (the plan relation, not a graft): shown at the top of the board's Grafts, a plain row with no X. */
export function pairedPageRow(boardId: string): GraftRow | null {
  const pid = getPairedPageId(boardId);
  const e = pid ? getJournalEntry(pid) : null;
  if (!e || isShell(e)) return null;
  const place = placeLabelOf(e.id);
  return { key: `paired:${e.id}`, group: 'Pages', entryId: e.id, title: titleOf(e.text), place, placeDiffers: place !== placeLabelOf(boardId) };
}

const hiddenOf = (pageId: string): string[] => {
  const e = getJournalEntry(pageId);
  const h = e?.pageSettings?.hiddenPlanCards;
  return Array.isArray(h) ? h.filter((x): x is string => typeof x === 'string') : [];
};

/** A page's plan board as ONE group: its live cards that are not hidden from this page. A stale hidden id (a card that is gone) is simply
 *  not matched - pruned on read, never written back. */
export function planGroupOf(pageId: string): PlanGroup | null {
  const bid = getPlanBoardId(pageId);
  const board = bid ? getJournalEntry(bid) : null;
  if (!board || isShell(board)) return null;
  const hidden = new Set(hiddenOf(pageId));
  const cards = liveBoxes(board.boxes ?? []).filter(b => CARD_KINDS.has(b.kind) && !hidden.has(b.id)).map(b => ({ boxId: b.id, title: cardTitle(b) }));
  return { boardId: board.id, cards, count: cards.length };
}

// hide / unhide: the page's own settings, spread exactly as the page's own patch does (PageEditor's patchPageSettings), with the one key
// changed. Every other setting is kept.
const writeHidden = (pageId: string, next: string[]): void => {
  const e = getJournalEntry(pageId);
  if (!e) return;
  const base = { ...(e.pageSettings ?? PAGE_SETTINGS_FALLBACK) };
  if (next.length > 0) base.hiddenPlanCards = next; else delete base.hiddenPlanCards;
  saveJournalEntry({ ...e, pageSettings: base });
};
/** Hide a plan card from this page (never delete it: it stays on its board). */
export function hidePlanCard(pageId: string, boxId: string): void {
  const cur = hiddenOf(pageId);
  if (!cur.includes(boxId)) writeHidden(pageId, [...cur, boxId]);
}
/** Undo a hide. */
export function unhidePlanCard(pageId: string, boxId: string): void {
  const cur = hiddenOf(pageId);
  if (cur.includes(boxId)) writeHidden(pageId, cur.filter(x => x !== boxId));
}

/** Undo a removed graft: the SAME record, live again (its tombstone lifted, its owner saved, so the change syncs). */
export function restorePageLink(linkId: string): boolean {
  for (const e of getJournalEntries()) {
    const l = (e.pageLinks ?? []).find(x => x.id === linkId);
    if (!l) continue;
    if (!l.deletedAt) return true;
    const now = new Date().toISOString();
    saveJournalEntry({ ...e, pageLinks: (e.pageLinks ?? []).map(x => (x.id === linkId ? (({ deletedAt: _gone, ...rest }) => { void _gone; return { ...rest, updatedAt: now }; })(x) : x)) });
    return true;
  }
  return false;
}

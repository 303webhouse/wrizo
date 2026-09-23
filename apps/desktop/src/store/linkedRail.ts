// ITEM 190 §5/§8 — the Linked list's own read-side logic. This module is
// this lane's, sits BESIDE `store/anchors.ts` (PW's, never written through
// — every read below goes through that seam's own exported functions,
// `pageConnections`/`linksForAnchor`, or through the ordinary persistence
// readers every other surface already uses; nothing here reaches into
// `PageLinks`'s stored shape directly) and never duplicates it.
//
// WHAT THIS RESOLVES, per the ruling (Fable, relaying PW's revised report
// and then Nick's own verbatim words, 2026-09-24): "the rail reads tags
// from the TARGET, never from the link" — the same rule `Link`'s own type
// comment states for `kind`. A `Link` only carries `targetEntryId`/
// `targetBoxId`; everything the rail shows (a label, its tags, its
// recency) is read fresh from whatever that id points at, every render —
// so nothing here can go stale independent of the target itself.
import { getJournalEntry } from './persistence';
import { firstLine, boardName } from './entryText';
import type { Link, JournalEntry, Box } from '../types';

// Nick's own words, verbatim (2026-09-24): "sources or pages or cards or
// boards or images or imported docs". Images are their own later item (no
// image kind, no upload path exists yet — Fable's own finding, same date).
// This lane can derive THREE of the remaining four honestly from today's
// schema: 'board' (JournalEntry.pageType === 'board'), 'card' (a Box), and
// 'note' (a Link with no target at all — the writer's own words, `Link.
// kind === 'note'`, §3's "Note This" act). 'page' vs 'source' vs 'imported
// doc' among ordinary (non-board) entries has NO field to tell them apart
// with today — JournalEntry.pageType's own union has no such member, and
// nothing else on the entry marks it. Rather than guess (this project's
// own standing law: a classification you cannot defend per site is not a
// population), every non-board entry target reports 'page' here, and the
// gap is named in LinkedRail.tsx's own header rather than silently
// resolved by a heuristic.
export type RailKind = 'page' | 'board' | 'card' | 'note';

export interface ResolvedLink {
  link: Link;
  kind: RailKind;
  label: string;
  tags: string[];
  recency: string; // link.updatedAt — when the CONNECTION changed, not the target
  entry: JournalEntry | null; // set for 'page'/'board' targets
  box: Box | null;            // set for 'card' targets
  boardEntry: JournalEntry | null; // the board a card target lives on, for navigation
}

/**
 * Resolve one link to what the rail shows. Pure — reads only, via the same
 * `getJournalEntry` every other surface already calls.
 */
export function resolveLink(link: Link): ResolvedLink {
  // A bare note: no target at all, the writer's own words (§3 "Note This").
  if (!link.targetEntryId) {
    return {
      link, kind: 'note', label: link.body?.trim() || 'Untitled note',
      tags: [], recency: link.updatedAt, entry: null, box: null, boardEntry: null,
    };
  }

  const entry = getJournalEntry(link.targetEntryId);

  // A card: `targetBoxId` set too — "a card on that board" (the type's own
  // comment), so `targetEntryId` is the board and `targetBoxId` indexes its
  // own `boxes`.
  if (link.targetBoxId) {
    const box = entry?.boxes?.find(b => b.id === link.targetBoxId) ?? null;
    const label = box && box.kind === 'text' ? firstLine(box.text ?? '') : (box ? `${box.kind} card` : 'Removed card');
    // Boxes carry no tags of their own (types/index.ts's Box has no `tags`
    // field) — a card target therefore never joins a tag group. Real, not
    // an oversight: the by-tag view simply has nothing to place it under.
    return { link, kind: 'card', label, tags: [], recency: link.updatedAt, entry: null, box, boardEntry: entry };
  }

  // An entry target: a board, or (today) 'page' for everything else — see
  // the RailKind comment above for why the finer split isn't made here.
  if (!entry) {
    return { link, kind: 'page', label: 'Removed page', tags: [], recency: link.updatedAt, entry: null, box: null, boardEntry: null };
  }
  const isBoard = entry.pageType === 'board';
  return {
    link,
    kind: isBoard ? 'board' : 'page',
    label: isBoard ? boardName(entry.text, 'Untitled board') : firstLine(entry.text ?? ''),
    tags: entry.tags ?? [],
    recency: link.updatedAt,
    entry,
    box: null,
    boardEntry: null,
  };
}

export type RailSort = 'recency' | 'kind';

/** Most-recently-connected first — resting state's default (§5). */
export function sortByRecency(items: ResolvedLink[]): ResolvedLink[] {
  return [...items].sort((a, b) => b.recency.localeCompare(a.recency));
}

const KIND_ORDER: RailKind[] = ['page', 'board', 'card', 'note'];

export function sortByKind(items: ResolvedLink[]): ResolvedLink[] {
  return [...items].sort((a, b) => {
    const k = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
    return k !== 0 ? k : b.recency.localeCompare(a.recency);
  });
}

export function sortRail(items: ResolvedLink[], sort: RailSort): ResolvedLink[] {
  return sort === 'kind' ? sortByKind(items) : sortByRecency(items);
}

export interface TagGroup {
  tag: string;
  items: ResolvedLink[];
}

/**
 * THE GROUPING LAW, A THIRD TIME (ratified at 177, applied again at the All
 * Boards list, and here): "a source has one kind and one recency but many
 * tags — so by tag GROUPS, a source appears under every tag it carries."
 * An item with N tags appears in N groups; an item with none appears in
 * none — this view is additive to the recency/kind sorts above, not a
 * replacement that has to account for every item.
 */
export function groupByTag(items: ResolvedLink[]): TagGroup[] {
  const byTag = new Map<string, ResolvedLink[]>();
  for (const item of items) {
    for (const tag of item.tags) {
      const list = byTag.get(tag) ?? [];
      list.push(item);
      byTag.set(tag, list);
    }
  }
  return [...byTag.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, groupItems]) => ({ tag, items: sortByRecency(groupItems) }));
}

import type { Box } from '../types';

// card tombstones: a deleted card is stamped deletedAt in place (zero schema); liveBoxes is the one definition of hidden and mergeBoxLists the one merge; a connection is hidden while either endpoint is [boxTombstones §1]

export const changedAt = (b: Box): string => [b.updatedAt, b.deletedAt, b.purgedAt].filter((x): x is string => !!x).sort().pop() ?? '';
export const isPurged = (b: Box): boolean => !!b.purgedAt;
export const isTombstoned = (b: Box): boolean => !!b.deletedAt && !b.purgedAt;
/** hidden by its OWN state (a tombstone or a purge marker); a connection hidden by an endpoint is NOT this - see `isStashed`. */
export const isHiddenSelf = (b: Box): boolean => !!b.deletedAt || !!b.purgedAt;

/** The boxes a reader may see: no tombstones, no purge markers, and no connection with a hidden endpoint. The one place "hidden" is decided. */
export function liveBoxes(boxes: readonly Box[] | undefined | null): Box[] {
  const all = boxes ?? [];
  const hidden = new Set(all.filter(isHiddenSelf).map(b => b.id));
  return all.filter(b => {
    if (isHiddenSelf(b)) return false;
    if (b.kind === 'connection' && ((b.connA && hidden.has(b.connA)) || (b.connB && hidden.has(b.connB)))) return false;
    return true;
  });
}

/** Everything `liveBoxes` hides - the tombstones, the purge markers, and the connections hanging off them. */
export function stashedBoxes(boxes: readonly Box[] | undefined | null): Box[] {
  const all = boxes ?? [];
  const live = new Set(liveBoxes(all).map(b => b.id));
  return all.filter(b => !live.has(b.id));
}

export const tombstone = (b: Box, now: string): Box => ({ ...b, deletedAt: now, updatedAt: now });
export function restoreBox(b: Box, now: string): Box {
  const { deletedAt: _d, purgedAt: _p, ...rest } = b;
  void _d; void _p;
  return { ...rest, updatedAt: now };
}
/** The id-only marker a permanent delete leaves behind (geometry zeroed: the type wants the numbers, nothing reads them). */
export const purgeMarker = (b: Box, now: string): Box => ({ id: b.id, kind: b.kind, x: 0, y: 0, w: 0, h: 0, z: 0, purgedAt: now });

/**
 * Merge two box lists for ONE board - `primary` is the side that is winning the entry (the newer remote, or the local unsynced edit), `secondary` the other. Per id: a purged marker is final; otherwise
 * the greater `changedAt` wins (ties go to `primary`); an id only the SECONDARY has is carried over only if it is hidden (a tombstone or a marker) - a live box that is simply absent from the winner
 * stays gone, exactly as entry-level last-writer-wins has always treated a hard delete. Order follows `primary`, hidden extras last.
 */
export function mergeBoxLists(primary: readonly Box[] | undefined, secondary: readonly Box[] | undefined): Box[] {
  const a = primary ?? [], b = secondary ?? [];
  const bById = new Map(b.map(x => [x.id, x]));
  const out: Box[] = [];
  const seen = new Set<string>();
  for (const p of a) {
    seen.add(p.id);
    const s = bById.get(p.id);
    if (!s) { out.push(p); continue; }
    if (isPurged(p)) { out.push(p); continue; }
    if (isPurged(s)) { out.push(s); continue; }
    out.push(changedAt(s) > changedAt(p) ? s : p);
  }
  for (const s of b) if (!seen.has(s.id) && isHiddenSelf(s)) out.push(s);
  return out;
}

/**
 * The write boundary for a board autosave. `incoming` is what an editor holds (LIVE boxes only); `current` is what is stored. The stored hidden boxes - tombstones, markers, and the connections
 * hanging off them - are carried over so an ordinary save can never strip them; an incoming box that is PURGED in storage is dropped (it cannot be resurrected); an incoming box that is TOMBSTONED
 * in storage stays tombstoned unless the caller names it in `restored` (an explicit Undo/Restore) - then it is live again and stamped `updatedAt = now` so it beats the older tombstone in any later merge.
 */
export function carryHiddenOnSave(current: readonly Box[] | undefined, incoming: readonly Box[], now: string, restored: ReadonlySet<string> = new Set()): Box[] {
  const cur = current ?? [];
  const curById = new Map(cur.map(b => [b.id, b]));
  const kept: Box[] = [];
  for (const b of incoming) {
    const c = curById.get(b.id);
    if (c && isPurged(c)) continue;                                  // final: a stale editor cannot bring it back
    if (c && isTombstoned(c)) {
      if (restored.has(b.id)) { kept.push(restoreBox(b, now)); continue; }
      kept.push(c);                                                    // a stale view of a card someone deleted: the tombstone stands
      continue;
    }
    kept.push(b);
  }
  // carried: everything hidden in storage that did not make it into `kept` - which includes a purge marker whose id an editor still held (dropped above, so the marker must stand in its place)
  const keptIds = new Set(kept.map(b => b.id));
  const stashed = stashedBoxes(cur).filter(b => !keptIds.has(b.id));
  return [...kept, ...stashed];
}

import type { Project, StoryPlan, SessionLog, Draft, JournalEntry, Drawer } from '../../types';
import { clearProofingLocal } from '../proofing';
import { mergeBoxLists } from '../boxTombstones';
import { type CollectionName, DIRTY_KEY, KEYS, cache, clone, dirty, flushTimers, notify, persistDirty, scheduleFlush } from './core';
import { adoptLegacyScratch } from './drafts';
import { announcePurged, purgedToAnnounce } from './purge';

// --- Sync integration -----------------------------------------------------
// Apply records pulled from the server into the cache (W2). Locally-dirty
// records are skipped — unsynced on-device edits always win — and applied
// records are NOT marked dirty (they came from the server).

export interface RemoteRecords {
  projects?: Project[];
  storyPlans?: StoryPlan[];
  sessions?: SessionLog[];
  drafts?: Draft[];
  journalEntries?: JournalEntry[];
  drawers?: Drawer[];
}

function applyCollection<T extends { id: string; updatedAt: string }>(
  name: CollectionName,
  collection: T[],
  remote: T[] | undefined,
): boolean {
  if (!remote || remote.length === 0) return false;
  let changed = false;
  for (const rec of remote) {
    if (!rec || !rec.id) continue;
    // DELETE FOR GOOD: a record deleted for good elsewhere WINS - the one place a pulled record beats a local unsynced edit (the writer chose
    // to destroy it). The local copy becomes the shell and its dirty flag clears, so the stale edit is never pushed.
    if ((rec as { purgedAt?: string }).purgedAt) {
      const index = collection.findIndex(r => r.id === rec.id);
      const was = index >= 0 ? (collection[index] as unknown as { purgedAt?: string; deletedAt?: string }) : null;
      if (!was || !was.purgedAt) {
        if (index >= 0) collection[index] = clone(rec); else collection.push(clone(rec));
        if (dirty[name].delete(rec.id)) persistDirty();
        if (name === 'journalEntries' && was && !was.deletedAt) purgedToAnnounce.push(rec.id);
        changed = true;
      }
      continue;
    }
    if (dirty[name].has(rec.id)) {
      // local unsynced edit wins - but its BOARD BOXES still merge by per-box change time (BOARD CONTEXT MENU): a newer tombstone / purge from elsewhere must not be undone by a stale local copy of the card
      if (name === 'journalEntries') {
        const idx = collection.findIndex(r => r.id === rec.id);
        if (idx >= 0) {
          const loc = collection[idx] as unknown as JournalEntry, rem = rec as unknown as JournalEntry;
          if (loc.pageType === 'board' && (loc.boxes || rem.boxes)) {
            const merged = mergeBoxLists(loc.boxes, rem.boxes);
            if (JSON.stringify(merged) !== JSON.stringify(loc.boxes ?? [])) { (collection[idx] as unknown as JournalEntry).boxes = merged; changed = true; }
          }
        }
      }
      continue;
    }
    const index = collection.findIndex(r => r.id === rec.id);
    if (index < 0) {
      collection.push(clone(rec));
      changed = true;
    } else if (!collection[index].updatedAt || rec.updatedAt > collection[index].updatedAt) {
      const incoming = clone(rec);
      if (name === 'journalEntries') {
        // the newer remote wins the entry; the boxes merge per box, so a local tombstone (or Restore) the server has not seen yet is not lost - and when it survives, the entry is marked unsynced so it travels back
        const loc = collection[index] as unknown as JournalEntry, inc = incoming as unknown as JournalEntry;
        if (loc.pageType === 'board' && (loc.boxes || inc.boxes)) {
          const merged = mergeBoxLists(inc.boxes, loc.boxes);
          if (JSON.stringify(merged) !== JSON.stringify(inc.boxes ?? [])) { inc.boxes = merged; dirty[name].add(rec.id); persistDirty(); }
        }
      }
      collection[index] = incoming;
      changed = true;
    }
  }
  if (changed) scheduleFlush(name);
  return changed;
}

export function applyRemoteRecords(remote: RemoteRecords): void {
  let changed = false;
  changed = applyCollection('projects', cache.projects, remote.projects) || changed;
  changed = applyCollection('storyPlans', cache.storyPlans, remote.storyPlans) || changed;
  changed = applyCollection('sessions', cache.sessions, remote.sessions) || changed;
  changed = applyCollection('drafts', cache.drafts, remote.drafts) || changed;
  adoptLegacyScratch();     // the old server row 'scratch' (its owner's) arrives by pull: it belongs under the account's own key
  changed = applyCollection('journalEntries', cache.journalEntries, remote.journalEntries) || changed;
  changed = applyCollection('drawers', cache.drawers, remote.drawers) || changed;
  if (changed) notify();
  announcePurged();
}

// Wipe all local data (cache + dirty + localStorage). Used on logout so the
// next account starts from a clean slate and never sees another user's cache.
export function resetLocalData(): void {
  (Object.keys(KEYS) as CollectionName[]).forEach(name => {
    (cache[name] as unknown[]).length = 0;
    dirty[name].clear();
    if (flushTimers[name] !== null) {
      clearTimeout(flushTimers[name]!);
      flushTimers[name] = null;
    }
    try {
      localStorage.removeItem(KEYS[name]);
    } catch {
      // ignore
    }
  });
  // The id journal is per-account data too — a logout that left it behind
  // would boot the next account holding the previous one's pending ids.
  try {
    localStorage.removeItem(DIRTY_KEY);
  } catch {
    // ignore
  }

  // the proofing mirror goes out with everything else at sign-out, through its own store's function; unpushed words on this device go with it [persistence §30]
  clearProofingLocal();
  notify();
}

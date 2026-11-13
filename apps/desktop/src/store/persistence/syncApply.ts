import { clearSyncBases, dropSyncBase, getSyncBase, setSyncBase } from './syncBase';
import type { Project, StoryPlan, SessionLog, Draft, JournalEntry, Drawer } from '../../types';
import { clearProofingLocal } from '../proofing';
import { mergeBoxLists } from '../boxTombstones';
import { type CollectionName, COLLECTIONS, DIRTY_KEY, KEYS, cache, clone, dirty, flushTimers, isUnflushed, lastRaw, notify, onDisk, onDiskText, persistDirty, scheduleFlush, setPreFlush } from './core';
import { mergeText } from '../textMerge';
import { announceKeptBoth, noteMerge } from '../mergeNotice';
import { isSignedOutHere } from '../signedOutHere';
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
  flushAfter = true,
  ignoreDirty = false,
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
    if (!ignoreDirty && dirty[name].has(rec.id)) {
      // local unsynced edit wins - but its BOARD BOXES still merge by per-box change time (BOARD CONTEXT MENU): a newer tombstone / purge from elsewhere must not be undone by a stale local copy of the card
      if (name === 'journalEntries') {
        const idx = collection.findIndex(r => r.id === rec.id);
        if (idx >= 0) {
          const loc = collection[idx] as unknown as JournalEntry, rem = rec as unknown as JournalEntry;
          if (mergeBoxesInto(loc, loc, rem)) changed = true;
          if (mergeRemoteTextInto(loc, rem)) changed = true;
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
  if (changed && flushAfter) scheduleFlush(name);
  return changed;
}

// #79 - TWO DEVICES, ONE PAGE. A page with an unsynced edit HERE used to ignore the text another device pushed, and the push that followed replaced the server's whole text: the other device's words were lost on both. Now the
// three texts are merged (store/textMerge.ts, the #76 whole-line merge): the BASE is the text this device last synced (persistence/syncBase.ts), MINE the page here, THEIRS the pulled one. The merged page stays dirty and is stamped
// newer than the pulled copy, so the next push carries it and wins at the server; the pulled text becomes the new base, so the same pull merges once. No base kept (evicted, or a page this device never synced): the old rule, this
// device's text wins. A deleted page is never merged. Returns true when the page here changed.
function mergeRemoteTextInto(loc: JournalEntry, rem: JournalEntry): boolean {
  if (typeof loc.text !== 'string' || typeof rem.text !== 'string' || loc.deletedAt || rem.deletedAt || (rem as { purgedAt?: string }).purgedAt) return false;
  return false;   // mutant: no merge
  if (rem.text === loc.text) return false;
  const base = getSyncBase(loc.id);
  if (base === null || rem.text === base) return false;   // no base: the old rule; the server's text is the one this device started from: every word of it is already here
  const r = mergeText(base, loc.text, rem.text);
  noteMerge({ at: 'sync-merge', base, mine: loc.text, theirs: rem.text, out: r.text });
  setSyncBase(loc.id, rem.text);
  if (r.text === loc.text) return false;
  loc.text = r.text;
  const now = new Date().toISOString();
  loc.updatedAt = now > rem.updatedAt ? now : new Date(Date.parse(rem.updatedAt) + 1).toISOString();
  if (r.kept) announceKeptBoth(loc.id);
  return true;
}

// A board's boxes merge per box (store/boxTombstones.ts mergeBoxLists): `primary` is the side that is winning the entry, `target` takes the merged list. True when the target's list changed. The ONE place syncApply reads two boards' raw boxes
// for a local edit against another copy (a pull, or another window's write): the readers guard (box-tombstones T11) counts these reads.
function mergeBoxesInto(target: JournalEntry, primary: JournalEntry, secondary: JournalEntry): boolean {
  if (primary.pageType !== 'board' || !(primary.boxes || secondary.boxes)) return false;
  const merged = mergeBoxLists(primary.boxes, secondary.boxes);
  if (JSON.stringify(merged) === JSON.stringify(target.boxes ?? [])) return false;
  target.boxes = merged;
  return true;
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

// #79 - for the sync engine (store/sync.ts reaches these through the namespace, so a stub of this module without them still loads): is there a page here with unsynced words AND a kept base, i.e. one a pull could merge?
export function hasMergeBases(): boolean {
  return (cache.journalEntries as JournalEntry[]).some((e) => dirty.journalEntries.has(e.id) && getSyncBase(e.id) !== null);
}

// #79 - after a push landed: a page that is clean again no longer needs its base; a page the writer kept typing in while the push was out still has unsynced words, and the server now holds the text that was pushed, which is its new base.
export function settleSyncBases(pages: ReadonlyArray<{ id: string; text: string; stillDirty: boolean }>): void {
  for (const p of pages) { if (p.stillDirty) setSyncBase(p.id, p.text); else dropSyncBase(p.id); }
}

// #76 PART 1 - REFRESH. Every window of the app on this computer shares one localStorage, and each keeps its own in-memory cache; nothing used to tell a window that another had written. Now the browser's `storage` event does:
// when another window writes a collection, this window takes the records that are NEWER there (the same rules as a pull from the server: a record with an unsaved edit HERE is kept, and its board boxes merge; a clean one is replaced), and
// tells its screens (notify), so an open page with nothing unsaved shows the other window's words at once. It writes nothing back (flushAfter false): the other window already wrote them, and a write here would only echo.
export function applyOtherWindowWrite(name: CollectionName, raw: string | null): void {
  if (!raw || isSignedOutHere()) return;
  let rows: unknown;
  try { rows = JSON.parse(raw); } catch { return; }
  if (!Array.isArray(rows)) return;
  const collection = cache[name] as unknown as { id: string; updatedAt: string }[];
  const mineById = new Map(collection.map((r) => [r.id, r]));
  const mergedHere = name === 'journalEntries' ? mergeUnflushedPages(rows as JournalEntry[], mineById as unknown as Map<string, JournalEntry>) : false;
  // a record with a change of this window's own that is not yet written is a conflict (part 3 keeps both); every other record takes the newer copy, whether or not it has been pushed to the account
  const safe = (rows as { id: string; updatedAt: string }[]).filter((r) => { if (!r || !r.id) return false; const mine = mineById.get(r.id); return !mine || !isUnflushed(name, mine); });
  const changed = applyCollection(name, collection, safe, false, true);
  if (mergedHere) scheduleFlush(name);   // the merged page is this window's change now: it is written, and the other window takes it from the store
  if (changed || mergedHere) { for (const r of safe) { const mine = collection.find((x) => x.id === r.id); if (mine && mine.updatedAt === r.updatedAt) onDisk[name].set(r.id, r.updatedAt); } notify(); }
  announcePurged();
}

// #76 PART 3 - KEEP BOTH, in the store. A PAGE this window has changed and not yet written, which another window has written differently since the two last agreed, is merged: the text from a three-way merge (store/textMerge.ts) of what
// the store held when this window last agreed with it (the base), this window's text and the other window's text. The record is this window's, newer than both, still to be written (and pushed); a board's cards merge by their own times.
function mergeUnflushedPages(rows: JournalEntry[], mineById: Map<string, JournalEntry>): boolean {
  let any = false;
  for (const theirs of rows) {
    if (!theirs || !theirs.id) continue;
    const mine = mineById.get(theirs.id);
    if (!mine || !isUnflushed('journalEntries', mine)) continue;                 // nothing of this window's own to protect
    if (theirs.updatedAt === onDisk.journalEntries.get(theirs.id)) continue;      // the store still holds what this window last agreed with: nobody else has written it
    if (theirs.purgedAt || mine.purgedAt) continue;                              // a page deleted for good elsewhere is applyCollection's rule
    const t = theirs.text ?? '', m = mine.text ?? '';
    const base = onDiskText.get(theirs.id) ?? '';
    const r = mergeText(base, m, t);
    noteMerge({ at: 'store-merge', base, mine: m, theirs: t, out: r.text });
    const stamp = [theirs.updatedAt ?? '', mine.updatedAt ?? '', new Date().toISOString()].sort().pop() as string;
    const winner = (theirs.updatedAt ?? '') > (mine.updatedAt ?? '') ? theirs : mine;
    const out = clone(winner) as JournalEntry;
    out.text = r.text;
    out.updatedAt = stamp;
    mergeBoxesInto(out, mine, theirs);
    const i = cache.journalEntries.findIndex((x) => x.id === theirs.id);
    if (i < 0) continue;
    cache.journalEntries[i] = out;
    dirty.journalEntries.add(theirs.id);
    persistDirty();
    onDiskText.set(theirs.id, t);                        // the store holds the other window's text: that is the starting point of the next merge
    onDisk.journalEntries.set(theirs.id, theirs.updatedAt);
    if (r.kept) announceKeptBoth(theirs.id);
    any = true;
  }
  return any;
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {   // a harness that bundles this module with a bare `window` stand-in has no listeners to add
  setPreFlush(applyOtherWindowWrite);
  window.addEventListener('storage', (e: StorageEvent) => {
    try {
      if (e.storageArea !== window.localStorage) return;
      const name = COLLECTIONS.find((n) => KEYS[n] === e.key);
      if (name) { lastRaw[KEYS[name]] = e.newValue; applyOtherWindowWrite(name, e.newValue); }
    } catch { /* a listener never breaks a write path */ }
  });
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

  // #79: the merge bases go with everything else at sign-out
  clearSyncBases();

  // the proofing mirror goes out with everything else at sign-out, through its own store's function; unpushed words on this device go with it [persistence §30]
  clearProofingLocal();
  notify();
}

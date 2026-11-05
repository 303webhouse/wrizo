import type { Project, StoryPlan, JournalEntry, Drawer } from '../../types';
import { purgeMarker } from '../boxTombstones';
import { cache, clone, dirty, notify, persistDirty, scheduleFlush, upsert } from './core';
import { saveProject } from './projects';
import { saveStoryPlan } from './storyPlans';
import { draftKey, saveDraft } from './drafts';
import { getTrashedCards, purgeDeletedBox } from './boards';
import { getDeletedEntries } from './entries';
import { getSystemKind } from './systemBoards';

// delete for good: a purge replaces a record with its shell, marks it to sync and clears every reference; only from Trash (every purge refuses a record not already soft-deleted); the server refuses later non-purge writes [persistence §31]
export interface PurgeAck { journalEntries?: string[]; projects?: string[]; drawers?: string[]; storyPlans?: string[] }
export function isPurged(rec: { purgedAt?: string } | null | undefined): boolean { return !!(rec && rec.purgedAt); }

// a page that was live HERE and is now gone for good (deleted on another device): its open editor leaves, with one quiet line (Q3)
const purgedElsewhereListeners = new Set<(ids: string[]) => void>();
export let purgedToAnnounce: string[] = [];
export function subscribePurgedElsewhere(fn: (ids: string[]) => void): () => void {
  purgedElsewhereListeners.add(fn);
  return () => { purgedElsewhereListeners.delete(fn); };
}
export function announcePurged(): void {
  if (purgedToAnnounce.length === 0) return;
  const ids = purgedToAnnounce;
  purgedToAnnounce = [];
  purgedElsewhereListeners.forEach(fn => { try { fn(ids); } catch { /* a listener must never break a sync */ } });
}

function shellOf(name: 'journalEntries' | 'projects' | 'drawers' | 'storyPlans', rec: Record<string, unknown>, now: string): unknown {
  const base = { id: rec.id, createdAt: rec.createdAt ?? now, updatedAt: now, deletedAt: rec.deletedAt ?? now, purgedAt: now };
  if (name === 'journalEntries') return { ...base, text: '' };
  if (name === 'projects') return { ...base, title: '', type: rec.type ?? 'creative' };
  if (name === 'drawers') return { ...base, name: '', order: 0 };
  return { ...base, projectId: rec.projectId ?? '', frameworkId: rec.frameworkId ?? '', currentBeatId: null, beatNotes: [] };
}

// every reference to a page or board about to be purged: its pins on any board (and the connectors to them) become purge markers - the
// card purge's own shape, which mergeBoxLists carries to every device; a page whose plan board it was is unpaired; a binder that last opened
// it forgets it (resume falls back to the binder's newest page)
function clearReferencesTo(id: string, now: string): void {
  for (const e of [...cache.journalEntries]) {
    if (e.id === id || e.purgedAt) continue;
    const boxes = e.boxes ?? [];
    const pinIds = new Set(boxes.filter(b => b.kind === 'page-pin' && b.entryId === id && !b.purgedAt).map(b => b.id));
    if (pinIds.size > 0) {
      const next = boxes.map(b => (!b.purgedAt && (pinIds.has(b.id) || (b.kind === 'connection' && (pinIds.has(b.connA ?? '') || pinIds.has(b.connB ?? ''))))) ? purgeMarker(b, now) : b);
      upsert('journalEntries', cache.journalEntries, { ...clone(e), boxes: next });
    }
    // a page_links record on another entry naming the purged one is tombstoned (an unlink's shape, so it syncs); the purged entry's own records go with its shell [persistence §32]
    if ((e.pageLinks ?? []).some(l => !l.deletedAt && l.bEntryId === id)) {
      const cur = clone(cache.journalEntries.find(x => x.id === e.id) as JournalEntry);
      upsert('journalEntries', cache.journalEntries, { ...cur, pageLinks: (cur.pageLinks ?? []).map(l => (!l.deletedAt && l.bEntryId === id ? { ...l, deletedAt: now, updatedAt: now } : l)) });
    }
    if (e.planBoardId === id) {
      const { planBoardId: _gone, ...rest } = clone(cache.journalEntries.find(x => x.id === e.id) as JournalEntry);
      void _gone;
      upsert('journalEntries', cache.journalEntries, rest as JournalEntry);
    }
  }
  for (const pr of [...cache.projects]) {
    if (pr.lastActivePageId !== id || pr.purgedAt) continue;
    const { lastActivePageId: _gone, ...rest } = clone(pr);
    void _gone;
    upsert('projects', cache.projects, rest as Project);
  }
  // this device's own pointers to it
  try { localStorage.removeItem(`wrizo-mode-page-${id}`); localStorage.removeItem(`wrizo-typewriter-page-${id}`); } catch { /* storage refused: a missing target already falls back */ }
}

/** Delete a trashed page or board for good. False (and nothing done) unless it is in Trash and not a built-in place. */
export function purgeEntry(id: string): boolean {
  const entry = cache.journalEntries.find(e => e.id === id);
  if (!entry || !entry.deletedAt || entry.purgedAt || getSystemKind(entry)) return false;
  const now = new Date().toISOString();
  clearReferencesTo(id, now);
  upsert('journalEntries', cache.journalEntries, shellOf('journalEntries', entry as unknown as Record<string, unknown>, now) as JournalEntry);
  return true;
}

/** Delete a soft-deleted binder for good. Its LIVE pages are re-homed loose (never purged with it); its scratch draft is emptied; its
 *  sessions keep their counts and lose the pointer (Q2). */
export function purgeProject(id: string): boolean {
  const pr = cache.projects.find(x => x.id === id);
  if (!pr || !pr.deletedAt || pr.purgedAt) return false;
  const now = new Date().toISOString();
  for (const e of [...cache.journalEntries]) {
    if (e.projectId === id && !e.deletedAt && !e.purgedAt) upsert('journalEntries', cache.journalEntries, { ...clone(e), projectId: null, origin: 'loose' });
  }
  if (cache.drafts.some(d => d.id === draftKey(id))) saveDraft(id, '');
  for (const sess of [...cache.sessions]) if (sess.projectId === id) upsert('sessions', cache.sessions, { ...clone(sess), projectId: null });
  upsert('projects', cache.projects, shellOf('projects', pr as unknown as Record<string, unknown>, now) as Project);
  return true;
}

/** Delete a soft-deleted drawer for good (its binders already fell back to Unsorted when it was deleted). */
export function purgeDrawer(id: string): boolean {
  const d = cache.drawers.find(x => x.id === id);
  if (!d || !d.deletedAt || d.purgedAt) return false;
  upsert('drawers', cache.drawers, shellOf('drawers', d as unknown as Record<string, unknown>, new Date().toISOString()) as Drawer);
  return true;
}

/** Delete a soft-deleted story plan for good. */
export function purgeStoryPlan(id: string): boolean {
  const sp = cache.storyPlans.find(x => x.id === id);
  if (!sp || !sp.deletedAt || sp.purgedAt) return false;
  upsert('storyPlans', cache.storyPlans, shellOf('storyPlans', sp as unknown as Record<string, unknown>, new Date().toISOString()) as StoryPlan);
  return true;
}

/** Trash's own Empty Trash: every trashed page, board and card, deleted for good. Returns how many. */
export function emptyTrash(): number {
  let n = 0;
  for (const e of getDeletedEntries()) if (purgeEntry(e.id)) n += 1;
  for (const c of getTrashedCards()) if (purgeDeletedBox(c.boardId, c.box.id)) n += 1;
  return n;
}

/** Every soft-deleted binder, drawer and plan, deleted for good (they never appear in Trash - Q1). */
export function purgeAllDeleted(): { projects: number; drawers: number; storyPlans: number } {
  const out = { projects: 0, drawers: 0, storyPlans: 0 };
  for (const x of [...cache.projects]) if (x.deletedAt && !x.purgedAt && purgeProject(x.id)) out.projects += 1;
  for (const x of [...cache.drawers]) if (x.deletedAt && !x.purgedAt && purgeDrawer(x.id)) out.drawers += 1;
  for (const x of [...cache.storyPlans]) if (x.deletedAt && !x.purgedAt && purgeStoryPlan(x.id)) out.storyPlans += 1;
  return out;
}

/** Soft-delete a binder (no UI had a path; the seed's softAll needs one). */
export function softDeleteProject(id: string): void {
  const pr = cache.projects.find(x => x.id === id);
  if (!pr || pr.deletedAt) return;
  saveProject({ ...clone(pr), deletedAt: new Date().toISOString() });
}
/** Soft-delete a story plan. */
export function softDeleteStoryPlan(id: string): void {
  const sp = cache.storyPlans.find(x => x.id === id);
  if (!sp || sp.deletedAt) return;
  saveStoryPlan({ ...clone(sp), deletedAt: new Date().toISOString() });
}

/** The server REFUSED these pushes because their records were deleted for good elsewhere, and acknowledged them (change 2): take the shell
 *  and clear the dirty flag, so the edit is not pushed again. */
export function applyAcknowledgedPurged(ack: PurgeAck | undefined): void {
  if (!ack) return;
  const now = new Date().toISOString();
  const cols: Array<['journalEntries' | 'projects' | 'drawers' | 'storyPlans', Array<{ id: string }>]> = [
    ['journalEntries', cache.journalEntries], ['projects', cache.projects], ['drawers', cache.drawers], ['storyPlans', cache.storyPlans],
  ];
  let changed = false;
  for (const [name, collection] of cols) {
    for (const id of ack[name] ?? []) {
      const index = collection.findIndex(r => r.id === id);
      if (index >= 0) {
        const rec = collection[index] as unknown as Record<string, unknown>;
        if (!rec.purgedAt) {
          if (name === 'journalEntries' && !rec.deletedAt) purgedToAnnounce.push(id);
          (collection as unknown[])[index] = shellOf(name, rec, now);
          changed = true;
          scheduleFlush(name);
        }
      }
      if (dirty[name].delete(id)) changed = true;
    }
  }
  if (changed) { persistDirty(); notify(); }
  announcePurged();
}

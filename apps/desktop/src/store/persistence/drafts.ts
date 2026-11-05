import type { SessionLog, Draft } from '../../types';
import { isSignedOutHere } from '../signedOutHere';
import { getCurrentUser, subscribeCurrentUser } from '../currentUser';
import { cache, clone, dirty, notify, persistDirty, scheduleFlush, upsert } from './core';

// --- Drafts ---------------------------------------------------------------
// Autosaved writing buffers (A1), keyed by `projectId ?? 'scratch'`.

// DRAFTS INTEGRITY (A) - THE SCRATCH DRAFT IS KEYED BY ACCOUNT. The scratch sprint's draft used the literal id 'scratch', and the server's
// drafts table has one GLOBAL primary key: the first account to push 'scratch' owned it, and every later account's push was a silent no-op
// (200, nothing rejected) that the client then marked clean - their scratch text never reached the account (measured on the local server).
// So a signed-in writer's scratch draft is stored as 'scratch-<userId>'. Callers keep passing 'scratch'; the three accessors below resolve
// it, so a screen that mounted before the account was known (a boot straight to #/sprint) cannot write under the old name for long.
// A project draft keeps its project's id, which is already unique. Signed out, the draft stays 'scratch' (there is no account to collide in).
export const SCRATCH_DRAFT_ID = 'scratch';
const scratchIdFor = (userId: string): string => SCRATCH_DRAFT_ID + '-' + userId;
export function draftKey(id: string): string {
  if (id !== SCRATCH_DRAFT_ID) return id;
  const user = getCurrentUser();
  return user ? scratchIdFor(user.id) : id;
}

// A 'scratch' draft that exists while an account is signed in - typed before signing in, or the old row pulled from the server (the one
// account that owns it) - is adopted into 'scratch-<userId>' and marked dirty so it reaches the account under its new id. It never
// replaces a draft already under the new id unless that one is OLDER, so a stale server copy re-pulled later cannot undo a newer edit.
// The old local record goes; the server keeps its old row (there is no delete), which is harmless.
export function adoptLegacyScratch(): void {
  const user = getCurrentUser();
  if (!user) return;
  if (isSignedOutHere()) return;      // the write-belt would drop the adopted record: leave the old one where it is until the flag lifts
  const at = cache.drafts.findIndex(d => d.id === SCRATCH_DRAFT_ID);
  if (at < 0) return;
  const legacy = cache.drafts[at];
  cache.drafts.splice(at, 1);
  dirty.drafts.delete(SCRATCH_DRAFT_ID);
  const to = scratchIdFor(user.id);
  const existing = cache.drafts.find(d => d.id === to);
  if (!existing || existing.updatedAt < legacy.updatedAt) upsert('drafts', cache.drafts, { id: to, text: legacy.text, updatedAt: '' });
  scheduleFlush('drafts');
  persistDirty();
  notify();
}
subscribeCurrentUser((user) => { if (user) adoptLegacyScratch(); });

export function getDraft(id: string): Draft | null {
  const key = draftKey(id);
  const draft = cache.drafts.find(d => d.id === key);
  return draft ? clone(draft) : null;
}

export function saveDraft(id: string, text: string): void {
  upsert('drafts', cache.drafts, { id: draftKey(id), text, updatedAt: '' });
}

export function clearDraft(id: string): void {
  const key = draftKey(id);
  const index = cache.drafts.findIndex(d => d.id === key);
  if (index < 0) return;
  cache.drafts.splice(index, 1);
  dirty.drafts.delete(key);
  scheduleFlush('drafts');
  notify();
}

// --- Sessions (A9) --------------------------------------------------------
// Writing-session instrumentation, recorded on sprint finish/save. Surfaces
// nowhere in the UI except the sprint finish stats; syncs like any record.

export function saveSession(session: SessionLog): void {
  upsert('sessions', cache.sessions, clone(session));
}

export function getSessions(): SessionLog[] {
  return cache.sessions.filter(s => !s.deletedAt).map(clone);
}

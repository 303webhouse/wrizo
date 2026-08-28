import { useSyncExternalStore } from 'react';
import type { PageSettings } from '../types';

// ITEM 83 M2/M3 (R6) — THE WRITER'S DEFAULT PAGE DRESS.
//
// Nick's ruling: page settings are "linked to the current page a user is on
// but reset to defaults when the user creates a new page", and there is "a
// setting for the user to set their own default page settings at the bottom
// of the PAGE menu".
//
// TWO STORES, ONE SHAPE. The per-page value lives on the entry itself
// (JournalEntry.pageSettings, synced with the page); this file holds only the
// per-USER default. They share the PageSettings shape deliberately — "set as
// my default" is literally a copy of the open page's own settings, and two
// shapes would let them drift apart the way the sliver's hand-synced width
// formula drifted from the paper's.
//
// LOCAL FIRST, SERVER BEHIND IT. The default is read synchronously at page
// birth (persistence.createJournalPage), which cannot await a fetch, so the
// value is mirrored into localStorage and served from memory. The server is
// the durable copy across devices: hydrate() pulls it on boot, and every set
// pushes. A failed push leaves the local value intact and the writer's next
// boot re-pulls — the same offline-tolerant posture the rest of this app
// keeps (and the reason item 89's dirty-set fix mattered).

const KEY = 'writer-studio-page-defaults';

let defaults: PageSettings | null = readLocal();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

function readLocal(): PageSettings | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PageSettings) : null;
  } catch { return null; }
}

function writeLocal(v: PageSettings | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  } catch { /* quota/private-mode — the in-memory value still governs */ }
}

/** Synchronous read, for the birth path. Null when the writer has never
 *  chosen defaults — the caller then leaves pageSettings absent entirely. */
export function getUserPageDefaults(): PageSettings | null {
  return defaults;
}

/** Set (or clear) the writer's defaults. Local first so the next page born
 *  uses them immediately; the server call is fire-and-forget for durability. */
export function setUserPageDefaults(next: PageSettings | null): void {
  defaults = next;
  writeLocal(next);
  notify();
  void fetch('/api/page-defaults', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ pageDefaults: next }),
  }).catch(() => { /* offline: the local copy stands, boot re-pulls */ });
}

/** Pull the durable copy on boot. Server wins over the local mirror only when
 *  the server actually has one — a null server value never erases a local
 *  default the writer just set while offline. */
export async function hydrateUserPageDefaults(): Promise<void> {
  try {
    const r = await fetch('/api/page-defaults', { credentials: 'include' });
    if (!r.ok) return;
    const body = await r.json();
    const server = (body?.pageDefaults ?? null) as PageSettings | null;
    if (server) { defaults = server; writeLocal(server); notify(); }
  } catch { /* offline — the local mirror governs */ }
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const getSnapshot = (): PageSettings | null => defaults;

export function useUserPageDefaults(): PageSettings | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}

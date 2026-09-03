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
    // ITEM 114 — stripped on the way in too, so a mirror written by an older
    // build cannot re-dress births on this one.
    return raw ? dressOnly(JSON.parse(raw) as PageSettings) : null;
  } catch { return null; }
}

function writeLocal(v: PageSettings | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  } catch { /* quota/private-mode — the in-memory value still governs */ }
}

// ITEM 114 (item 83 errata E4) — THE KIND IS NOT DRESS, AND MUST NOT RIDE THIS
// CHANNEL.
//
// The defect this closes, found in S0 (e) before the code existed rather than
// after a writer hit it. `PageSettings` is deliberately ONE shape serving two
// stores (see this file's own header above): the per-page value and the
// per-user default. "Set as my default" is literally a copy of the open page's
// settings — `setUserPageDefaults(current)`, CascadePanels.tsx — and
// `persistence.createJournalPage` stamps that copy onto every page born after.
//
// So without this strip, a writer who pressed "Set as my default" while a
// RESEARCH page was open would make EVERY FUTURE PAGE Research. Nothing would
// announce it; they would simply find every new page declaring itself research
// with MLA chosen. A page's dress is a preference. A page's KIND is a fact
// about that page, and facts do not travel by default.
//
// STRIPPED AT THE DOOR, not at the call site, so the rule holds for callers not
// yet written — the same "close the class, don't fix the instance" discipline
// the two-drawer repair settled on. Applied on the way OUT (set) and on the way
// IN (hydrate): the server can only ever hold what this app pushed, but a value
// pushed by an older build, or by a build that regresses this, must not be able
// to come back and re-dress the writer's births.
//
// Nothing here forbids the kind from PERSISTING — it persists exactly where the
// brief rules it should, on the page's own `page_settings` row. It is only
// barred from the per-user default.
function dressOnly(v: PageSettings | null): PageSettings | null {
  if (!v) return v;
  const { kind, styleGuide, ...dress } = v as PageSettings & Record<string, unknown>;
  void kind; void styleGuide;
  return dress as PageSettings;
}

/** Synchronous read, for the birth path. Null when the writer has never
 *  chosen defaults — the caller then leaves pageSettings absent entirely. */
export function getUserPageDefaults(): PageSettings | null {
  return defaults;
}

/** Set (or clear) the writer's defaults. Local first so the next page born
 *  uses them immediately; the server call is fire-and-forget for durability. */
export function setUserPageDefaults(input: PageSettings | null): void {
  const next = dressOnly(input);   // ITEM 114 — the kind never enters this store
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
    const server = dressOnly((body?.pageDefaults ?? null) as PageSettings | null);
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

import { useSyncExternalStore } from 'react';
import type { PageSettings } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';

// the writer's default page dress: the per-page value lives on the entry, this file holds the per-user default, one shape; local first (read synchronously at birth), the server is the durable copy [pageDefaults §1]

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

// the page's KIND is not dress: stripped at the door, so "Set as my default" on a Research page never makes every future page Research [pageDefaults §2]
function dressOnly(v: PageSettings | null): PageSettings | null {
  if (!v) return v;
  // PAGE TEMPLATES - the template is the same kind of fact as the kind: "Set as my default" on an Outline page must not make every
  // future page an Outline. Found in S0 by reading every writer of pageSettings, before the key existed.
  // BIG PROJECTS STEP 3 (3c) - the cards a page hides from its Grafts are that page's own choice: "Set as my default" on one page must not
  // carry its hidden list into every future page (the item-114 trap, closed at the door).
  const { kind, styleGuide, template, hiddenPlanCards, ...dress } = v as PageSettings & Record<string, unknown>;
  void kind; void styleGuide; void template; void hiddenPlanCards;
  return dress as PageSettings;
}

// a page BORN now is born at 11 pt; a page that already exists keeps reading PAGE_SIZE_DEFAULT (12) through its absent size, so nothing is rewritten and no field is new; the writer's own default dress comes first, with its own size if it set one, else the app's floor (PAGE_SETTINGS_FALLBACK) [pageDefaults §3]
export const NEW_PAGE_SIZE = 11;
export function bornPageSettings(): PageSettings {
  const d = defaults;
  return { ...(d ?? PAGE_SETTINGS_FALLBACK), size: d?.size ?? NEW_PAGE_SIZE };
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

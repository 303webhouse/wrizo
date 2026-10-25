// POLISH #10 item 24 (Nick, via Fable, Oct 25) - THE LINK DOCK's slot: which linked card or page stands docked beside a page, ONE per page, on THIS
// device only. A UI setting (localStorage, as the per-page mode and typewriter keys), never a collection and never synced - nothing saved changes.
import { useSyncExternalStore } from 'react';

export interface LinkDockRef { entryId: string; boxId?: string }
const KEY = 'wrizo-link-dock';
const listeners = new Set<() => void>();
let snapshot: Record<string, LinkDockRef> = read();

function read(): Record<string, LinkDockRef> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}

/** The linked item docked beside page `pageId` on this device, or null. */
export function getLinkDock(pageId: string | null | undefined): LinkDockRef | null {
  return pageId && snapshot[pageId] ? snapshot[pageId] : null;
}

/** Dock `ref` beside page `pageId` (replacing whatever stood there: one at a time), or clear it with null. */
export function setLinkDock(pageId: string, ref: LinkDockRef | null): void {
  const next = { ...snapshot };
  if (ref) next[pageId] = ref.boxId ? { entryId: ref.entryId, boxId: ref.boxId } : { entryId: ref.entryId };
  else delete next[pageId];
  snapshot = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* a private window keeps it for the session */ }
  listeners.forEach((l) => l());
}

export function useLinkDock(pageId: string | null | undefined): LinkDockRef | null {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => getLinkDock(pageId));
}

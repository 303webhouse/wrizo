import { useSyncExternalStore } from 'react';
import { getPref, setPref, subscribePrefs } from '../prefsSaved';

// THE SPLIT SCREEN'S STATE (the reorg, phase 4.2, behind ?reorg=1 in Machina; reorg-plan.md section 9, Nick's ruling Nov 10: "a true split screen is allowed, and the page
// may move when she opts into it"; Nov 19: the asset opens on the RIGHT, at HALF width, with a GRIP to drag).
//
// WHAT IS KEPT, AND WHERE (Nick's SAVED DATA ruling, Nov 19, 4:05 pm: split side and width belong to the ACCOUNT):
//   - which asset is beside the page: never kept. It is where she is (a pointer in memory); a reload, another page or a close forgets it (Cursor 115, 118).
//   - the side and the width: ONE preference fact, `split = { side: 'right', width: 0.5, at }` (width = the asset's side as a fraction of the room right of the rail),
//     saved with the account in users.prefs (reorg/prefsSaved.ts; the server half is apps/server/src/prefs.ts). It follows her to every device; the later act wins.
//     (Between Nov 19 6:05 pm and 7:00 pm this was the FALLBACK: the same record in the same shape on this device only, `wrizo-reorg-prefs`. That key is now the prefs
//     record's own local copy, so a copy made then reads unchanged.)

export interface SplitRef { entryId: string; boxId?: string }
interface SplitState { pageId: string; ref: SplitRef }

export const SPLIT_DEFAULT = 0.5;
const SPLIT_MIN = 0.2;
const SPLIT_MAX = 0.8;

function savedWidth(): number | null {
  const f = getPref('split');
  return f && f.side === 'right' && typeof f.width === 'number' && Number.isFinite(f.width) ? clampFrac(f.width) : null;
}

export const clampFrac = (f: number): number => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, f));

let state: SplitState | null = null;
let frac: number = savedWidth() ?? SPLIT_DEFAULT;
let dragging = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribeSplit = (l: () => void): (() => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Open `ref` beside page `pageId` (replacing whatever stood there: swapping an asset keeps where the grip was). */
export function openSplit(pageId: string, ref: SplitRef): void {
  state = { pageId, ref: ref.boxId ? { entryId: ref.entryId, boxId: ref.boxId } : { entryId: ref.entryId } };
  notify();
}
export function closeSplit(): void {
  if (!state) return;
  state = null;
  notify();
}
/** The grip let go (or moved by a key): the width is kept. During a drag only the memory moves (see dragSplit). */
export function setSplitWidth(f: number): void {
  dragging = false;
  frac = clampFrac(f);
  setPref('split', { side: 'right', width: frac });
  notify();
}
/** The grip being dragged: the width moves in memory only, so a drag writes nothing until it ends. */
export function dragSplit(f: number): void {
  dragging = true;
  frac = clampFrac(f);
  notify();
}
export const getSplitWidth = (): number => frac;
// her width on another device arrives with the account's preferences (a sync round, or another window): take it in, unless her own hand is on the grip
subscribePrefs(() => {
  if (dragging) return;
  const w = savedWidth() ?? SPLIT_DEFAULT;
  if (w !== frac) { frac = w; notify(); }
});
export const getSplit = (pageId: string): SplitRef | null => (state && state.pageId === pageId ? state.ref : null);

let snapKey = '';
let snapVal: SplitRef | null = null;
export function useSplit(pageId: string): SplitRef | null {
  return useSyncExternalStore(subscribeSplit, () => {
    const r = getSplit(pageId);
    const k = r ? `${r.entryId}:${r.boxId ?? ''}` : '';
    if (k !== snapKey) { snapKey = k; snapVal = r; }
    return snapVal;
  });
}
export function useSplitWidth(): number {
  return useSyncExternalStore(subscribeSplit, getSplitWidth);
}

/** Why the split is not offered right now, or null when it is. Free Writing is the Typewriter, always (Nick, Nov 19), and the Typewriter is not available in a split. */
export function splitBlocked(mode: string | undefined): 'freewrite' | 'typewriter' | null {
  if (mode === 'journal') return 'freewrite';
  if (typeof document !== 'undefined' && document.querySelector('.mode-scroll[data-typewriter="true"], .mode-pagecol[data-zoom="true"]')) return 'typewriter';
  return null;
}

// the inspection seam (the wrizoRailMemory pattern), under the switch only
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reorg') === '1') {
  (window as unknown as { wrizoSplit?: unknown }).wrizoSplit = { get: () => state, width: getSplitWidth, open: openSplit, close: closeSplit };
}

import { useSyncExternalStore } from 'react';

// THE SPLIT SCREEN'S STATE (the reorg, phase 4.2, behind ?reorg=1 in Machina; reorg-plan.md section 9, Nick's ruling Nov 10: "a true split screen is allowed, and the page
// may move when she opts into it"; Nov 19: the asset opens on the RIGHT, at HALF width, with a GRIP to drag).
//
// WHAT IS KEPT, AND WHERE (Nick's SAVED DATA ruling, Nov 19, 4:05 pm: split side and width belong to the ACCOUNT, in users.prefs):
//   - which asset is beside the page: never kept. It is where she is (a pointer in memory); a reload, another page or a close forgets it (Cursor 115, 118).
//   - the side and the width: kept in ONE record, `prefs.split = { side: 'right', width: 0.5 }` (width = the asset's side as a fraction of the room right of the rail).
//     FALLBACK (Fable's rule: "anything that can't reach the account by Monday may live on the device first, ONLY in the same shape the account version
//     reads"): today the record lives on this device in `wrizo-reorg-prefs` as { split: { side, width, at } }. The PATH to the account is one step: when
//     users.prefs (jsonb) ships, that key is read and written through the sync engine's prefs door (merged by `at`, the later act wins), and this file's two
//     functions (readPrefs, writePrefs) are the only things that change; nothing else here knows where the record lives.

export interface SplitRef { entryId: string; boxId?: string }
interface SplitState { pageId: string; ref: SplitRef }

export const PREFS_KEY = 'wrizo-reorg-prefs';
export const SPLIT_DEFAULT = 0.5;
const SPLIT_MIN = 0.2;
const SPLIT_MAX = 0.8;

interface SplitPrefs { side: 'right'; width: number; at: string }

function readPrefs(): SplitPrefs | null {
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    const s = v && typeof v === 'object' ? v.split : null;
    if (s && s.side === 'right' && typeof s.width === 'number' && Number.isFinite(s.width)) return { side: 'right', width: clampFrac(s.width), at: typeof s.at === 'string' ? s.at : '' };
  } catch { /* storage blocked or junk: the default stands */ }
  return null;
}
function writePrefs(width: number): void {
  try {
    let all: Record<string, unknown> = {};
    try { const v = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); if (v && typeof v === 'object') all = v; } catch { /* start over */ }
    all.split = { side: 'right', width, at: new Date().toISOString() };
    localStorage.setItem(PREFS_KEY, JSON.stringify(all));
  } catch { /* a private window keeps it for the session */ }
}

export const clampFrac = (f: number): number => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, f));

let state: SplitState | null = null;
let frac: number = readPrefs()?.width ?? SPLIT_DEFAULT;
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
  frac = clampFrac(f);
  writePrefs(frac);
  notify();
}
/** The grip being dragged: the width moves in memory only, so a drag writes nothing until it ends. */
export function dragSplit(f: number): void {
  frac = clampFrac(f);
  notify();
}
export const getSplitWidth = (): number => frac;
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

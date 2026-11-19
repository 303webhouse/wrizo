import { useSyncExternalStore } from 'react';
import { REORG } from './flag';
import { boxPictureUrl, getSavedRail, pinnedIdsOf, savedRailVersion, setBoxFactsSaved, setViewSaved, subscribeSavedRail, togglePinSaved, type PinView } from './railSaved';

// THE RAIL'S STATE (the reorg, phase 2, behind ?reorg=1 in Machina). Her pins and their order, the list-or-boxes switch and each box's look
// are SAVED WITH THE ACCOUNT (Nick's ruling, Nov 18, 1:56 pm): they live in railSaved.ts, which keeps one local copy and merges it with the
// server's. This module is the rail's one door to them, unchanged in shape. Which Project's own list is open stays a pointer in memory only:
// it is where she is, not something she chose to keep.

export type { PinView } from './railSaved';

interface RailMemory {
  /** Pinned Project ids (a Drawer id, or the Notebook's id), in her order. Day one: none (frame R3). */
  pins: readonly string[];
  /** The rail draws her pins as boxes (R1) or as a list (R2). */
  pinView: PinView;
}

const listeners = new Set<() => void>();
function notifyLocal(): void {
  listeners.forEach((fn) => { try { fn(); } catch { /* a listener never breaks the rail */ } });
}

export function subscribeRail(fn: () => void): () => void {
  listeners.add(fn);
  const off = subscribeSavedRail(fn);
  return () => { listeners.delete(fn); off(); };
}

// one snapshot per saved version: useSyncExternalStore needs the same object back until something changed
let memoAt = -1;
let memo: RailMemory = { pins: [], pinView: 'boxes' };
export function getRailMemory(): RailMemory {
  if (memoAt !== savedRailVersion()) {
    const r = getSavedRail();
    memo = { pins: pinnedIdsOf(r), pinView: r.view ?? 'boxes' };
    memoAt = savedRailVersion();
  }
  return memo;
}

export function useRailMemory(): RailMemory {
  return useSyncExternalStore(subscribeRail, getRailMemory, getRailMemory);
}

export function isPinned(id: string): boolean { return getRailMemory().pins.includes(id); }

export function togglePin(id: string): void { togglePinSaved(id); }

export function setPinView(pinView: PinView): void { setViewSaved(pinView); }

// ---- step 3: which Project's own list is open (a pointer into memory, so a travel out of the list comes back to the same list) --------------
let openList: string | null = null;
export function getOpenList(): string | null { return openList; }
export function setOpenList(id: string | null): void {
  if (openList === id) return;
  openList = id;
  notifyLocal();
}
export function useOpenList(): string | null {
  return useSyncExternalStore(subscribeRail, getOpenList, getOpenList);
}

// ---- step 4: each box's own look (Box settings, frame R5). Absent = the derived defaults (railData.lettersOf, the first swatch, no picture) --
export interface BoxLook {
  /** Her own letters; '' = no letters (R5's "No letters"); absent = derived from the name. */
  letters?: string;
  /** A swatch, or her own colour (#rrggbb). */
  colour?: string;
  /** Where her picture is drawn from (railSaved.boxPictureUrl): this device's copy, else the server. */
  picture?: string;
}
// (named `looks`, not boxes: a board's boxes are another thing, and box-tombstones T11 counts every raw read of one)
let looksAt = -1;
let looks: Readonly<Record<string, BoxLook>> = {};
export function getBoxes(): Readonly<Record<string, BoxLook>> {
  if (looksAt !== savedRailVersion()) {
    const next: Record<string, BoxLook> = {};
    for (const [id, facts] of Object.entries(getSavedRail().boxes)) {
      const look: BoxLook = {};
      if (facts.lettersAt !== undefined) look.letters = facts.letters ?? '';
      if (facts.colourAt !== undefined && facts.colour) look.colour = facts.colour;
      const url = facts.picture ? boxPictureUrl(id) : undefined;
      if (url) look.picture = url;
      next[id] = look;
    }
    looks = next;
    looksAt = savedRailVersion();
  }
  return looks;
}
export function useBoxes(): Readonly<Record<string, BoxLook>> {
  return useSyncExternalStore(subscribeRail, getBoxes, getBoxes);
}
/** Letters and a colour. `picture: undefined` given explicitly removes her picture (a swatch pick does, frame R5); a picture is set through
 *  railSaved.setBoxPictureSaved, which keeps its bytes until the server has them. */
export function setBoxLook(id: string, patch: BoxLook): void {
  setBoxFactsSaved(id, { letters: patch.letters, colour: patch.colour, removePicture: 'picture' in patch && patch.picture === undefined });
}

// Test/inspection seam (the wrizoLexicon pattern): the harness reads what the rail holds. Switch on only.
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoRailMemory?: unknown }).wrizoRailMemory = { get: getRailMemory, boxes: getBoxes, openList: getOpenList, saved: getSavedRail };
}

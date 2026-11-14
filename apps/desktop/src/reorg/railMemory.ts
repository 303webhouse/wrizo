import { useSyncExternalStore } from 'react';
import { REORG } from './flag';

// THE RAIL'S MEMORY (the reorg, phase 2, behind ?reorg=1 in Machina). New saved data is NOT approved (Fable, Nov 14: her pins, the box's
// letters, colour and picture, list-or-boxes wait for Nick's saved-data sitting), so all of it lives HERE, in this module's memory, and nowhere
// else: no localStorage, no sessionStorage, no IndexedDB, no sync. A reload forgets it. In-app navigation does not (a module outlives a route).

export type PinView = 'boxes' | 'list';

interface RailMemory {
  /** Pinned Project ids (a Drawer id, or the Notebook's id), in the order she pinned them. Day one: none (frame R3). */
  pins: readonly string[];
  /** The rail draws her pins as boxes (R1) or as a list (R2). */
  pinView: PinView;
}

let memory: RailMemory = { pins: [], pinView: 'boxes' };
const listeners = new Set<() => void>();

function set(next: RailMemory): void {
  memory = next;
  listeners.forEach((fn) => { try { fn(); } catch { /* a listener never breaks the rail */ } });
}

export function subscribeRail(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getRailMemory(): RailMemory { return memory; }

export function useRailMemory(): RailMemory {
  return useSyncExternalStore(subscribeRail, getRailMemory, getRailMemory);
}

export function isPinned(id: string): boolean { return memory.pins.includes(id); }

export function togglePin(id: string): void {
  set({ ...memory, pins: memory.pins.includes(id) ? memory.pins.filter((p) => p !== id) : [...memory.pins, id] });
}

export function setPinView(pinView: PinView): void {
  if (memory.pinView !== pinView) set({ ...memory, pinView });
}

// ---- step 3: which Project's own list is open (a pointer into memory, so a travel out of the list comes back to the same list) --------------
let openList: string | null = null;
export function getOpenList(): string | null { return openList; }
export function setOpenList(id: string | null): void {
  if (openList === id) return;
  openList = id;
  listeners.forEach((fn) => { try { fn(); } catch { /* a listener never breaks the rail */ } });
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
  /** A picture she chose, read into memory as a data: URL. Nothing uploads. */
  picture?: string;
}
let boxes: Readonly<Record<string, BoxLook>> = {};
export function getBoxes(): Readonly<Record<string, BoxLook>> { return boxes; }
export function useBoxes(): Readonly<Record<string, BoxLook>> {
  return useSyncExternalStore(subscribeRail, getBoxes, getBoxes);
}
export function setBoxLook(id: string, patch: BoxLook): void {
  const next: BoxLook = { ...(boxes[id] || {}), ...patch };
  for (const k of Object.keys(next) as (keyof BoxLook)[]) if (next[k] === undefined) delete next[k];
  boxes = { ...boxes, [id]: next };
  try { localStorage.setItem('wz.rail.boxes', JSON.stringify(boxes)); } catch { /* mutant */ }
  listeners.forEach((fn) => { try { fn(); } catch { /* a listener never breaks the rail */ } });
}

// Test/inspection seam (the wrizoLexicon pattern): the harness reads what the rail holds, to prove it is held here and nowhere else. Switch on only.
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoRailMemory?: unknown }).wrizoRailMemory = { get: getRailMemory, boxes: getBoxes, openList: getOpenList };
}

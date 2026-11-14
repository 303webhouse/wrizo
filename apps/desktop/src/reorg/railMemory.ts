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
  try { localStorage.setItem('wz.rail.pins', JSON.stringify(memory.pins)); } catch { /* mutant */ }
}

export function setPinView(pinView: PinView): void {
  if (memory.pinView !== pinView) set({ ...memory, pinView });
}

// Test/inspection seam (the wrizoLexicon pattern): the harness reads what the rail holds, to prove it is held here and nowhere else. Switch on only.
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoRailMemory?: unknown }).wrizoRailMemory = { get: getRailMemory };
}

// FLUX3 S1 - "the LAST-touched node" (flux-rulings-oct31.md q3: orange marks the last-touched node's bar and the LAST readout; "derived from
// the existing edit time, nothing new is stored"). A card carries no edit time of its own (Box.updatedAt is stamped only by delete and
// restore), so the derivation is in-session (q6: session-only state is allowed in v1): the card whose words or place last changed under
// the writer's hand while this window has been open. Nothing is written anywhere; a reload starts with no last node.
import { useSyncExternalStore } from 'react';

let lastId: string | null = null;
const subs = new Set<() => void>();

export function touchNode(id: string): void {
  if (lastId === id) return;
  lastId = id;
  subs.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  subs.add(fn);
  return () => { subs.delete(fn); };
}

export function useLastTouched(): string | null {
  return useSyncExternalStore(subscribe, () => lastId, () => null);
}

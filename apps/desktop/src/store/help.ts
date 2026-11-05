import { useSyncExternalStore } from 'react';
import type { DeskTermId } from './deskLexicon';

// the one sentence behind each "?": carries the trigger's own rect (an anchor), not menu items; the useSyncExternalStore one-overlay pattern [help §1]

export interface HelpAnchor { left: number; right: number; top: number; bottom: number }
export interface OpenHelp { key: DeskTermId; anchor: HelpAnchor }

let open: OpenHelp | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Opens `key`'s sentence anchored to `anchor` — or, if `key` is already the
 *  open one, closes it (the mockup's own "second tap closes" rule). */
export function toggleHelp(key: DeskTermId, anchor: HelpAnchor): void {
  open = open?.key === key ? null : { key, anchor };
  notify();
}

export function closeHelp(): void {
  if (!open) return;
  open = null;
  notify();
}

export function useOpenHelp(): OpenHelp | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => open,
  );
}

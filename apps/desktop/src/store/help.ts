import { useSyncExternalStore } from 'react';
import type { DeskTermId } from './deskLexicon';

// HELP BUTTONS (Nick approved Oct 12, cursor/help-buttons @ d4d1c835) — the
// one plain sentence behind each "?". Deliberately NOT store/contextMenu.ts's
// own OpenMenu shape reused verbatim — that one carries ITEMS (a menu);
// this carries the TRIGGERING BUTTON'S OWN RECT (an anchor to position
// against), which is the one thing HelpPop.tsx actually needs. Same
// useSyncExternalStore pattern (ContextMenuHost.tsx's own proven mechanism:
// one shared overlay, Esc/outside-click closes, focus returns on close).

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

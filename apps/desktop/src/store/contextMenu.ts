import { useSyncExternalStore } from 'react';

// BOARD CONTEXT MENU - the one small theme-styled menu (components/ContextMenuHost.tsx renders it). `openContextMenu(x, y, items)` is how a surface asks for one at the pointer; `null` is a separator.
// `disabled` greys an item that has nothing to act on yet (Empty Trash on an empty Trash) - shown, never pressable
export type ContextMenuItem = { label: string; onSelect: () => void; disabled?: boolean } | null;
export interface OpenMenu { x: number; y: number; items: ContextMenuItem[] }

let open: OpenMenu | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

export function openContextMenu(x: number, y: number, items: ContextMenuItem[]): void {
  if (items.filter(Boolean).length === 0) return;
  open = { x, y, items };
  notify();
}
export function closeContextMenu(): void {
  if (!open) return;
  open = null;
  notify();
}
export function useOpenContextMenu(): OpenMenu | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => open,
  );
}

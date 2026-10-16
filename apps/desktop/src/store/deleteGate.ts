import { useSyncExternalStore } from 'react';

// BOARD CONTEXT MENU - "Ask before deleting" and the one gate every delete goes through (Nick, Oct 15).
//
//   Every delete - a card, a Page, a board, from a menu, from the Delete key, from a Drawers row - calls `requestDelete(run)`. If the writer still wants to be asked, the "Send to Trash?" dialog
//   (components/DeleteDialog.tsx) opens and `run` waits for its Delete; if they ticked "Don't ask me again" on an earlier confirmed Delete, `run` happens at once. ONE setting for every kind of delete,
//   reversible in Settings ("Ask before deleting"). Exempt (they never come here): an empty new card closing and discarding itself, and unlinks.
//
//   The flag is PER DEVICE (localStorage) - Fable's ruling: it would have needed the users.page_defaults jsonb, whose client store strips non-dress keys and replaces the whole object on save, so a flag
//   there would be wiped by "reset my defaults". Absent = ask (the safe default); only an explicit '0' stops asking.

const KEY = 'wrizo-ask-before-delete';
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

export function getAskBeforeDelete(): boolean {
  try { return localStorage.getItem(KEY) !== '0'; } catch { return true; }
}
export function setAskBeforeDelete(on: boolean): void {
  try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, '0'); } catch { /* storage unavailable: the in-memory answer below still holds for this session */ memoryOff = !on; }
  notify();
}
let memoryOff = false;
const currentAsk = (): boolean => (memoryOff ? false : getAskBeforeDelete());

export function useAskBeforeDelete(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    currentAsk,
  );
}

// ---- the pending request the dialog host renders ----
export interface PendingDelete { run: () => void; title?: string; noDontAsk?: boolean }
let pending: PendingDelete | null = null;
const pendingListeners = new Set<() => void>();
const notifyPending = () => pendingListeners.forEach(l => l());

/** The gate. Runs `run` now when the writer has turned asking off; otherwise opens the dialog and runs it on Delete. `title` overrides the dialog's question (a permanent delete asks a different one). */
export function requestDelete(run: () => void, opts?: { title?: string; always?: boolean; noDontAsk?: boolean }): void {
  if (!opts?.always && !currentAsk()) { run(); return; }
  pending = { run, title: opts?.title, noDontAsk: opts?.noDontAsk };
  notifyPending();
}

export function usePendingDelete(): PendingDelete | null {
  return useSyncExternalStore(
    (l) => { pendingListeners.add(l); return () => { pendingListeners.delete(l); }; },
    () => pending,
  );
}

/** The dialog answered. `confirmed` runs the held delete; `dontAsk` (honoured only with a confirm) turns the setting off for good. */
export function resolveDelete(confirmed: boolean, dontAsk = false): void {
  const p = pending;
  pending = null;
  notifyPending();
  if (!p || !confirmed) return;
  if (dontAsk) setAskBeforeDelete(false);
  p.run();
}

// Inspection seam (the wrizoDeskLexicon pattern): a fixture reads / sets the flag through the product's own functions, never raw storage.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoAskBeforeDelete?: unknown }).wrizoAskBeforeDelete = { get: getAskBeforeDelete, set: setAskBeforeDelete };
}

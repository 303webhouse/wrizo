// DELETE FOR GOOD (docs/plans/delete-for-good.md; Fable's change 1, Oct 18) - THE GATE on the account-wide destructive paths (window.wrizoDelete,
// window.wrizoSeed): they refuse unless the writer completed the IN-APP typed confirmation in this same page session.
//
//   - The confirmation is the app's own dialog (components/DestructiveConfirm.tsx), opened by requestDestructiveConfirm. It unlocks only when the
//     writer TYPES the exact phrase and PRESSES the button: the dialog reports whether each was trusted (a person's input, not a page script's -
//     a script can fill the field and click the button, but those events carry isTrusted: false), and submitDestructiveConfirm refuses unless both
//     were. A bare console call to a gated path refuses outright.
//   - The unlock lives in this module's memory only - never in storage - so a reload (a new page session) locks it again.
//   - The harness has its own test-only unlock, which works ONLY on a local host (127.0.0.1 / localhost): a deployed origin can never take it.
import { useSyncExternalStore } from 'react';

export interface DestructiveRequest { title: string; lines: string[]; phrase: string }

let unlocked = false;
let pending: { req: DestructiveRequest; resolve: (answer: boolean) => void } | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => { try { l(); } catch { /* never break the gate */ } });

export function isDestructiveUnlocked(): boolean { return unlocked; }

/** Ask the writer, in the app, to type `phrase`. Resolves true when they did (and the gate is then open for this page session), false on
 *  Cancel. A second request while one is open replaces it (the first resolves false). */
export function requestDestructiveConfirm(req: DestructiveRequest): Promise<boolean> {
  if (pending) pending.resolve(false);
  return new Promise<boolean>((resolve) => {
    pending = { req: { title: String(req.title || ''), lines: (req.lines || []).map(String), phrase: String(req.phrase || '') }, resolve };
    notify();
  });
}

/** The dialog's own submit: unlocks only with the exact phrase AND trusted (writer-made) input. True when it unlocked. */
export function submitDestructiveConfirm(typed: string, trusted: boolean): boolean {
  if (!pending || !trusted || !pending.req.phrase || typed !== pending.req.phrase) return false;
  unlocked = true;
  const p = pending;
  pending = null;
  p.resolve(true);
  notify();
  return true;
}

export function cancelDestructiveConfirm(): void {
  if (!pending) return;
  const p = pending;
  pending = null;
  p.resolve(false);
  notify();
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
/** The harness's test-only unlock: true (and unlocked) only on a local host. */
export function unlockDestructiveForTest(): boolean {
  const host = typeof location !== 'undefined' ? location.hostname : '';
  if (!LOCAL_HOSTS.has(host)) return false;
  unlocked = true;
  notify();
  return true;
}

export function usePendingDestructive(): DestructiveRequest | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => (pending ? pending.req : null),
  );
}

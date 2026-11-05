// the gate on the account-wide destructive paths: they refuse unless the in-app typed confirmation completed this page session with trusted input; the unlock is memory only; the harness unlock works only on a local host [destructiveGate §1]
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

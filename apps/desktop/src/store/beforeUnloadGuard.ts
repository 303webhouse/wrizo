// closing the tab is the one act that turns "at risk" into "gone": while storage has failed and edits exist only in memory, the web build asks through the browser's own beforeunload; Electron is excluded (it would silently refuse to close) [beforeUnloadGuard §1]
import { getStorageFailedCollections } from './storageHealth';
import { hasDirtyRecords } from './persistence';
import { getCurrentUser } from './currentUser';

export function isElectronRenderer(): boolean {
  return typeof navigator !== 'undefined' && /Electron\//.test(navigator.userAgent || '');
}

/** True right now if leaving would risk losing something ONLY this device holds: storage has failed, and either
 *  there is no account to ever receive it (signed out) or the account does not have it yet (dirty records remain).
 *  State (b) — failed, but everything already pushed — is NOT risky to leave; nothing more would be lost. */
export function unloadIsRisky(): boolean {
  if (getStorageFailedCollections().length === 0) return false;
  if (getCurrentUser() === null) return true;
  return hasDirtyRecords();
}

let cleanup: (() => void) | null = null;

/** Installs the guard once (idempotent — a second call is a no-op while the first install is still active) and
 *  returns a function that removes it. A no-op, returning a no-op remover, in Electron's own renderer. */
export function installBeforeUnloadGuard(): () => void {
  if (isElectronRenderer()) return () => {};
  if (cleanup) return cleanup;
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!unloadIsRisky()) return;
    e.preventDefault();
    // Chrome requires a truthy returnValue to arm the prompt; every modern browser then shows its OWN generic
    // wording regardless of what this string says — a page cannot customize this dialog's text, which is exactly
    // why the real words live in the sync notice, on screen already, rather than here.
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  cleanup = () => { window.removeEventListener('beforeunload', onBeforeUnload); cleanup = null; };
  return cleanup;
}

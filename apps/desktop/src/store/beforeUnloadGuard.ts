// STORAGE-FULL STEP 1 (Fable's byte review, item 3) — CLOSING THE TAB IS THE ONE ACT THAT TURNS "AT RISK" INTO
// "GONE." While storage has failed and either the account does not have every edit yet (state (a)) or there is no
// account at all to ever receive them (state (c)), the edit exists nowhere but this tab's memory — leaving closes
// the only copy. The web build asks first, through the browser's OWN "Leave site?" dialog (`beforeunload`): never a
// page of ours, and browsers deliberately ignore a script's own message on this event (so a page cannot manufacture
// a false warning) — the real words live in the sync notice instead, which is always on screen already.
//
// ELECTRON IS EXCLUDED, BY NAME. Chromium's "Leave site?" prompt is a BROWSER TAB affordance; Electron's
// BrowserWindow does not reproduce it, and `apps/desktop/src/main.ts` installs no `will-prevent-unload` handling —
// so calling `preventDefault()` there does not ask anything, it silently refuses to close the window with no way
// for the writer to see why or override it. Detected by Electron's own default user-agent token, which this app's
// main process never overrides (no `userAgentFallback` is set) — measured, never assumed.
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

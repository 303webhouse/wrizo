// SIGNED OUT HERE — a per-device flag (Nick's ruling, 2026-10-06). Set on an
// explicit sign-out; cleared on sign-in. While it is set, the app goes to the
// sign-in screen and stays there: a route, a key or a click that would open a
// writing surface is sent back to sign-in until the writer signs in again.
//
// Scope: only a device that signed out. A device that was never signed in keeps
// anonymous Write as it does today. The flag lives in localStorage, NOT in the
// collections resetLocalData() clears, so it survives the logout that sets it.
// Every storage access is wrapped: a blocked or full storage must never trap a
// writer on the sign-in screen, nor crash the app.

const KEY = 'wz.signedOutHere';

export function isSignedOutHere(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markSignedOutHere(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // Blocked storage: the logout still happens; the device simply does not remember it.
  }
}

export function clearSignedOutHere(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

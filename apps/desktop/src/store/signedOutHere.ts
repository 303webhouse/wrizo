// signed out here, a per-device flag: set on explicit sign-out, cleared on sign-in; while set, writing routes go back to sign-in; it lives outside the collections resetLocalData clears; every access is wrapped [signedOutHere §1]

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

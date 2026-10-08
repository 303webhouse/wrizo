import { useEffect, useState } from 'react';
import { accountHasWork } from './persistence';
import { firstPullDone, whenFirstPulled } from './sync';
import { getCurrentUser } from './currentUser';

// HB1 F3 — the rite runs once per device. Local-first, pre-account: a
// client-local flag, same module shape as store/forwardLock.ts. Never
// server-persisted this ticket (F3 — "do not build server persistence for
// it"); if an account later carries preferences, this flag simply isn't one
// of them yet.
const KEY = 'wrizo-first-run-complete';

function load(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let current: boolean = load();
const subs = new Set<(v: boolean) => void>();

export function getFirstRunComplete(): boolean {
  return current;
}

export function setFirstRunComplete(next: boolean): void {
  current = next;
  try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

// B10.1 - THE RITUAL RUNS ONCE PER ACCOUNT, EVER (Nick's ruling). The flag above is only this device's memory of it, and a
// device's memory is the wrong unit: a sign-out, a second device or a fresh profile would otherwise show an existing writer
// the 100-word gate again. So the verdict is derived from the ACCOUNT, with no schema change:
//   - a successful REGISTER on this device is a first run, whatever the flag says (a new account on a used device gets it);
//   - signed out (local-first writing, no account): the flag alone decides, as before;
//   - a sign-in is a first run ONLY if the session's first whole-account pull has completed AND the account holds no work
//     (no non-system entry, no project). A pull that is capped or failed is NOT a first run: not knowing is never a reason to
//     put a returning writer through the gate. If the account does hold work, the flag is set so it cannot return.
export const FIRST_PULL_CAP_MS = 3000;

export function markRegistered(): void {
  setFirstRunComplete(false);
}

export async function resolveFirstRun(): Promise<boolean> {
  if (current) return false;
  if (getCurrentUser() === null) return true;
  if (!firstPullDone()) await whenFirstPulled(FIRST_PULL_CAP_MS);
  if (!firstPullDone()) return false;
  if (accountHasWork()) { setFirstRunComplete(true); return false; }
  return true;
}

export function useFirstRunComplete(): boolean {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (v: boolean) => setValue(v);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

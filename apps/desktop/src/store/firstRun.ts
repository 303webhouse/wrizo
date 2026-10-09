import { useEffect, useState } from 'react';
import { accountHasWork } from './persistence';
import { firstPullDone, firstPullPending, whenFirstPulled } from './sync';
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
let justRegisteredFor: string | null = null;
const subs = new Set<(v: boolean) => void>();

export function getFirstRunComplete(): boolean {
  return current;
}

export function setFirstRunComplete(next: boolean): void {
  current = next;
  if (next) justRegisteredFor = null;
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

// A just-registered account is EMPTY BY DEFINITION - it did not exist a moment ago - so there is nothing to pull that could change
// the answer, and nothing to wait for. Remembered per account id for the session, and dropped when the ritual completes.
export function markRegistered(userId: string): void {
  justRegisteredFor = userId;
  setFirstRunComplete(false);
}

// A GUEST LINK's sign-in is a first run too (Nick's ruling): a new, empty account, whatever this device's flag says. But it is NOT "empty
// by definition" the way a register is: the link can be opened again, later, by a guest who has already written. So this only lifts the
// device's flag and lets the derivation decide - after the first pull, an empty account is a first run, one that holds work is not (and the
// flag is set again so it cannot return).
export function markGuestStart(): void {
  setFirstRunComplete(false);
}

const isJustRegistered = (): boolean => !!justRegisteredFor && getCurrentUser()?.id === justRegisteredFor;

/** True when resolveFirstRun() would have to WAIT for the first pull right now - so a door can show its loading state first. */
export function firstRunWillWait(): boolean {
  return !current && getCurrentUser() !== null && !isJustRegistered() && !firstPullDone() && firstPullPending();
}

export async function resolveFirstRun(): Promise<boolean> {
  if (current) return false;
  if (getCurrentUser() === null) return true;
  if (isJustRegistered()) return true;
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

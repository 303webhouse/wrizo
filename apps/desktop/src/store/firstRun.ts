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

// the first-run ritual runs once per ACCOUNT: a register here is a first run; signed out, the flag decides; a sign-in only when the first whole-account pull completed and the account holds no work (not knowing is never a reason) [firstRun §1]
export const FIRST_PULL_CAP_MS = 3000;

// A just-registered account is EMPTY BY DEFINITION - it did not exist a moment ago - so there is nothing to pull that could change
// the answer, and nothing to wait for. Remembered per account id for the session, and dropped when the ritual completes.
export function markRegistered(userId: string): void {
  justRegisteredFor = userId;
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

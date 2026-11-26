// WHO IS ON THIS PHONE (MOBILE slice 1). Online, the account says. With no signal the companion still opens, and it knows whose notes wait from the one pointer kept with the queue (an id, wiped with the notes at sign-out); a device that
// signed out (the flag the desk sets) is never treated as signed in.
import { setCurrentUser } from '../store/currentUser';
import { isSignedOutHere } from '../store/signedOutHere';
import type { AuthUser } from '../store/api';
import { ACCOUNT_POINTER_KEY, wipeWaitingExcept } from './noteQueue';

export type Who = { state: 'authed'; user: AuthUser; online: boolean } | { state: 'anon' };

const store = (): Storage | null => { try { return window.localStorage; } catch { return null; } };

export async function whoIsHere(): Promise<Who> {
  const s = store();
  try {
    const res = await fetch('/auth/me', { credentials: 'include' });
    if (res.ok) {
      const user = (await res.json()) as AuthUser;
      if (s) { wipeWaitingExcept(s, user.id); s.setItem(ACCOUNT_POINTER_KEY, user.id); }
      setCurrentUser(user);
      return { state: 'authed', user, online: true };
    }
    // the account answered "not signed in"
    if (res.status === 401 || res.status === 403) return { state: 'anon' };
    // any other answer (the server is down, a hotel's sign-in page in the way) says nothing about who she is: treated as no signal, so she can still write a note that waits
    return fromPhone(s);
  } catch {
    return fromPhone(s);
  }
}

/** No signal: the phone's own record of whose it is. */
function fromPhone(s: Storage | null): Who {
  const id = s && !isSignedOutHere() ? s.getItem(ACCOUNT_POINTER_KEY) : null;
  if (!id) return { state: 'anon' };
  const user: AuthUser = { id, email: '' };
  setCurrentUser(user);
  return { state: 'authed', user, online: false };
}

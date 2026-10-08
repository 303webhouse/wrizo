// LOGOUT SAFETY — a sign-out never wipes this device while the account is missing writing. Pure words and a tiny
// store for the "blocked" state, so a proof can run the exact functions the sheet and App.tsx call.
//
// What blocks: any record still dirty — pending, offline, or REJECTED by the server (a rejected record stays dirty,
// so it counts, and it is named). What does not: a device with nothing unpushed signs out as before.

export type LogoutLexiconKey =
  | 'logoutBlockedBody' | 'logoutBlockedBodyOne' | 'logoutBlockedRejected'
  | 'logoutAnyway' | 'logoutAnywayOne' | 'logoutAnywayConfirm' | 'logoutAnywayConfirmOne';

export interface LogoutBlock {
  count: number;
  rejectedTitles: readonly string[];
}

// Singular and plural are separate sentences, not "{n} changes" with an n of 1.
export function logoutWords(count: number, t: (key: LogoutLexiconKey) => string) {
  const one = count === 1;
  const n = (s: string) => s.replace('{n}', () => String(count));
  return {
    body: n(t(one ? 'logoutBlockedBodyOne' : 'logoutBlockedBody')),
    anyway: n(t(one ? 'logoutAnywayOne' : 'logoutAnyway')),
    confirm: n(t(one ? 'logoutAnywayConfirmOne' : 'logoutAnywayConfirm')),
  };
}

// The names of the records the account refused. A replacer function, not a replacement string: a title is whatever
// the writer typed ("Q&A $& notes"), and `$&` in a replacement STRING would splice the template back in.
export function rejectedLine(titles: readonly string[], t: (key: LogoutLexiconKey) => string): string | null {
  if (titles.length === 0) return null;
  return t('logoutBlockedRejected').replace('{titles}', () => titles.map((x) => `\u201c${x}\u201d`).join(', '));
}

// THE TIME LIMIT — the final push is given this long, then the sign-out decides from what is actually unsaved.
export const LOGOUT_PUSH_CAP_MS = 8000;

export type SignOutAttempt =
  | { kind: 'clear' }
  | { kind: 'blocked'; count: number; timedOut: boolean };

// One last push, capped. The push finishing, failing or stalling past the cap all lead to the same question — is
// anything still unsaved? — answered from the dirty count, never from how the push ended. A stalled or failed push
// leaves records unsaved, so it ends at the sheet; it never signs out silently past unsaved work. A push that
// stalls but leaves nothing unsaved has nothing to lose, and signs out.
export async function attemptSignOut(
  push: () => Promise<unknown>,
  countUnsaved: () => number,
  capMs: number = LOGOUT_PUSH_CAP_MS,
): Promise<SignOutAttempt> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const outcome = await Promise.race([
    Promise.resolve().then(push).then(() => 'done' as const, () => 'failed' as const),
    new Promise<'timeout'>((resolve) => { timer = setTimeout(() => resolve('timeout'), capMs); }),
  ]);
  if (timer !== undefined) clearTimeout(timer);
  const count = countUnsaved();
  return count > 0 ? { kind: 'blocked', count, timedOut: outcome === 'timeout' } : { kind: 'clear' };
}

// THE SECOND CAP — ending the SERVER session is given this long. It never throws and never hangs the sign-out: on a
// timeout the sign-out finishes on THIS device anyway (flag set, sign-in screen shown), and the next load, still
// holding the flag and a live session, ends the server session then (see bootDecision).
export const LOGOUT_SERVER_CAP_MS = 5000;

export async function endServerSession(
  logout: () => Promise<unknown>,
  capMs: number = LOGOUT_SERVER_CAP_MS,
): Promise<'done' | 'failed' | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const outcome = await Promise.race([
    Promise.resolve().then(logout).then(() => 'done' as const, () => 'failed' as const),
    new Promise<'timeout'>((resolve) => { timer = setTimeout(() => resolve('timeout'), capMs); }),
  ]);
  if (timer !== undefined) clearTimeout(timer);
  return outcome;
}

// What a load does once it knows whether a server session exists and whether this device signed out. A session that
// outlived a sign-out (the server logout hung, or the tab closed mid-way) is ended on the next load, never resumed.
export function bootDecision(hasSession: boolean, signedOutHere: boolean): 'end-session' | 'authed' | 'anon' {
  if (!hasSession) return 'anon';
  return signedOutHere ? 'end-session' : 'authed';
}

// "Signing out…" — true from the click until the sign-out ends one way or the other, so the button never does nothing
// and a second click while one is under way is ignored.
let signingOut = false;
const signingOutListeners = new Set<() => void>();
export function getSigningOut(): boolean { return signingOut; }
export function setSigningOut(v: boolean): void {
  if (signingOut === v) return;
  signingOut = v;
  signingOutListeners.forEach((l) => l());
}
export function subscribeSigningOut(listener: () => void): () => void {
  signingOutListeners.add(listener);
  return () => { signingOutListeners.delete(listener); };
}

let blocked: LogoutBlock | null = null;
const listeners = new Set<() => void>();

export function getLogoutBlock(): LogoutBlock | null { return blocked; }
export function showLogoutBlock(b: LogoutBlock): void { blocked = b; listeners.forEach((l) => l()); }
export function clearLogoutBlock(): void { if (blocked === null) return; blocked = null; listeners.forEach((l) => l()); }
export function subscribeLogoutBlock(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

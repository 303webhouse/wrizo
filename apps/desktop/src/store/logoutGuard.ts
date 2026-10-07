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

let blocked: LogoutBlock | null = null;
const listeners = new Set<() => void>();

export function getLogoutBlock(): LogoutBlock | null { return blocked; }
export function showLogoutBlock(b: LogoutBlock): void { blocked = b; listeners.forEach((l) => l()); }
export function clearLogoutBlock(): void { if (blocked === null) return; blocked = null; listeners.forEach((l) => l()); }
export function subscribeLogoutBlock(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

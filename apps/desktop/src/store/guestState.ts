// GUEST LOGIN (item 225) — the client's half: reading the invite link, keeping
// the token out of the address bar and out of every log, and remembering that
// the guest's clock has run out. Pure where it can be, so a proof can run the
// exact functions the components call.
//
// THE TOKEN: it arrives in the address bar as `#/guest?t=<token>`. It is read
// once, the address bar is rewritten without it (history.replaceState), and it
// is never logged, stored, or put in an error message. The server's own
// refusal text is the only thing a writer ever sees about a bad link.

// The one line a guest sees when their time is over. Plain, never a bare
// sign-in error: the device keeps the full copy, so the writing stays.
export const GUEST_EXPIRED_LINE = 'Your guest time is over — create an account to keep your work here';

// Read the token out of a hash such as `#/guest?t=abc`. Returns null when there
// is no `t` parameter or it is empty — never a partial or guessed value.
export function readGuestTokenFromHash(hash: string): string | null {
  const q = hash.indexOf('?');
  if (q < 0) return null;
  const token = new URLSearchParams(hash.slice(q + 1)).get('t');
  return token && token.length > 0 ? token : null;
}

// The same URL with the token removed, keeping the route. Pure, so the address
// bar's rewritten form is checkable without a browser.
export function guestAddressWithoutToken(href: string): string {
  const url = new URL(href);
  const hash = url.hash;
  const q = hash.indexOf('?');
  url.hash = q < 0 ? hash : hash.slice(0, q);
  return url.toString();
}

// The expired state, shared by the sync loop (which sets it) and the claim
// sheet (which shows it). A tiny store in the same shape as the other stores.
let expired = false;
const listeners = new Set<() => void>();

export function isGuestExpired(): boolean {
  return expired;
}

export function markGuestExpired(): void {
  if (expired) return;
  expired = true;
  listeners.forEach((l) => l());
}

export function clearGuestExpired(): void {
  if (!expired) return;
  expired = false;
  listeners.forEach((l) => l());
}

export function subscribeGuestExpired(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

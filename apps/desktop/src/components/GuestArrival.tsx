import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiGuest, type AuthUser } from '../store/api';
import { readGuestTokenFromHash, guestAddressWithoutToken, GUEST_EXPIRED_LINE } from '../store/guestState';
import { clearSignedOutHere } from '../store/signedOutHere';
import { markGuestStart } from '../store/firstRun';
import { createAttemptGate } from '../store/attemptGate';
import { NETWORK_ERROR_LINE } from '../store/authSubmit';

// GUEST LOGIN (item 225) — `#/guest?t=<token>`, the beta tester's invite link.
// The token is read and taken out of the address bar BEFORE anything awaits, so
// it never sits in the address bar for a network round trip, and it is never
// logged. On success the writer lands on the Arrival door, now signed in as a
// guest; on refusal they see the server's own sentence, nothing more.
export function GuestArrival({ onAuthed }: { onAuthed: (user: AuthUser) => void }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Opening your guest account…');
  // Handled per NAVIGATION, not per mount. Opening a second guest link in the same tab (a mistyped one, then the right
  // one pasted over it) only changes the hash: the route stays mounted, so an effect that ran once per mount would never
  // read the new token and the writer would sit on the first answer.
  //
  // The guard is the LOCATION OBJECT'S IDENTITY, not location.key. A key is assigned only to navigations the router makes
  // itself; one it did not make (a pasted URL, location.hash = ...) carries no router state, so react-router falls back to
  // the literal key "default" — the same key as the first load. Keyed on that, the second link is skipped as "already
  // handled" (a first fix did exactly this, and a live run caught it). The router builds a NEW location object for every
  // navigation, so identity tells them apart. StrictMode's double-run of an effect sees the same object and skips.
  // replaceState (the token strip below) does not go through the router and does not change it.
  const location = useLocation();
  const handledLocation = useRef<unknown>(null);
  // Only the NEWEST attempt may act on its result (link A, then B quickly: A's answer arriving last must not win), and
  // nothing acts once the component is gone. `mounted` is re-armed by StrictMode's remount, so it is a flag, not a cancel.
  const gate = useRef(createAttemptGate()).current;
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (handledLocation.current === location) return;
    handledLocation.current = location;
    // Begin BEFORE anything can return early: a newer link with no token still retires an older one in flight.
    const attempt = gate.begin();
    const live = () => mounted.current && gate.isCurrent(attempt);
    setMessage('Opening your guest account…');
    const token = readGuestTokenFromHash(window.location.hash);
    window.history.replaceState(window.history.state, '', guestAddressWithoutToken(window.location.href));
    if (!token) {
      setMessage('This guest link is not valid.');
      return;
    }
    // A request that never arrives (offline) must end in a plain line, not a message that never changes.
    void apiGuest(token).catch(() => ({ ok: false as const, error: NETWORK_ERROR_LINE, reason: undefined, user: undefined })).then((r) => {
      if (!live()) return; // a stale answer (an older link's) or one for a component that is gone: it acts on nothing
      if (r.ok && r.user) {
        // A guest entering on a device that signed out must lift the signed-out flag, exactly as a sign-in does: while
        // it is set, the write-belt drops every record write, and the guest would lose everything silently. Cleared
        // here, explicitly and first, so the guest session never starts under the belt (handleAuthed clears it too).
        clearSignedOutHere();
        // A guest link's first sign-in is a first run, like a register (see store/firstRun.ts markGuestStart).
        markGuestStart();
        onAuthed(r.user);
        navigate('/', { replace: true });
        return;
      }
      // A link past its grace says the expired line at once — the same words the claim sheet uses.
      setMessage(r.reason === 'guest_expired' ? GUEST_EXPIRED_LINE : (r.error || 'This guest link is not valid.'));
    });
    // Runs once per location by design; handledLocation is the guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <div className="wz-home wz-arrival">
      <div className="wz-ambient" aria-hidden="true" />
      <section className="wz-hero">
        <img className="wz-logo" src="/brand/wrizo-logo.png" alt="Wrizo" />
        <div className="wz-tagline">For humans writing</div>
        <div className="wz-sub" role="status">{message}</div>
      </section>
    </div>
  );
}

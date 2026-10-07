import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGuest, type AuthUser } from '../store/api';
import { readGuestTokenFromHash, guestAddressWithoutToken, GUEST_EXPIRED_LINE } from '../store/guestState';
import { clearSignedOutHere } from '../store/signedOutHere';

// GUEST LOGIN (item 225) — `#/guest?t=<token>`, the beta tester's invite link.
// The token is read and taken out of the address bar BEFORE anything awaits, so
// it never sits in the address bar for a network round trip, and it is never
// logged. On success the writer lands on the Arrival door, now signed in as a
// guest; on refusal they see the server's own sentence, nothing more.
export function GuestArrival({ onAuthed }: { onAuthed: (user: AuthUser) => void }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Opening your guest account…');
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice; the link is one-use-per-open, so only the first run acts.
    if (started.current) return;
    started.current = true;
    const token = readGuestTokenFromHash(window.location.hash);
    window.history.replaceState(window.history.state, '', guestAddressWithoutToken(window.location.href));
    if (!token) {
      setMessage('This guest link is not valid.');
      return;
    }
    void apiGuest(token).then((r) => {
      if (r.ok && r.user) {
        // A guest entering on a device that signed out must lift the signed-out flag, exactly as a sign-in does: while
        // it is set, the write-belt drops every record write, and the guest would lose everything silently. Cleared
        // here, explicitly and first, so the guest session never starts under the belt (handleAuthed clears it too).
        clearSignedOutHere();
        onAuthed(r.user);
        navigate('/', { replace: true });
        return;
      }
      // A link past its grace says the expired line at once — the same words the claim sheet uses.
      setMessage(r.reason === 'guest_expired' ? GUEST_EXPIRED_LINE : (r.error || 'This guest link is not valid.'));
    });
    // Runs once per mount by design; the ref above is the guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

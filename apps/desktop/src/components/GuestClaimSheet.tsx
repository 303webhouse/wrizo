import { useEffect, useState } from 'react';
import { apiClaim } from '../store/api';
import { setCurrentUser } from '../store/currentUser';
import { startSync } from '../store/sync';
import { GUEST_EXPIRED_LINE, clearGuestExpired, isGuestExpired, subscribeGuestExpired } from '../store/guestState';

// GUEST LOGIN (item 225) — shown when a guest's time is over. An OVERLAY (fixed,
// over the page): the page stays mounted and keeps its place, and the device's
// full copy stays writable behind it. "Not now" hides it for this session only;
// the server refuses sync until the writer claims, and the local copy is untouched.
// The claim keeps every page — it is the same account, made real in place.
export function GuestClaimSheet() {
  const [open, setOpen] = useState(isGuestExpired());
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeGuestExpired(() => setOpen(isGuestExpired())), []);

  if (!open || dismissed) return null;

  const submit = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    const r = await apiClaim(email, password);
    setBusy(false);
    if (!r.ok || !r.user) {
      setError(r.error || 'Could not create account');
      return;
    }
    setCurrentUser(r.user);
    clearGuestExpired();
    void startSync();
  };

  return (
    <div className="wz-guest-sheet" role="dialog" aria-modal="true" aria-labelledby="wz-guest-sheet-line">
      <div className="wz-guest-sheet-panel">
        <p id="wz-guest-sheet-line" className="wz-guest-sheet-line">{GUEST_EXPIRED_LINE}</p>
        <div className="wz-fieldcol">
          <input className="wz-field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="wz-field" type="password" placeholder="choose a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="wz-sub" role="alert">{error}</div>}
        <button type="button" className="wz-btn wz-primary" disabled={busy} onClick={() => void submit()}>
          Create my account
        </button>
        <button type="button" className="wz-link" onClick={() => setDismissed(true)}>Not now — keep writing here</button>
      </div>
    </div>
  );
}

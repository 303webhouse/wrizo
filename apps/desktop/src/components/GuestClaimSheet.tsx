import { useEffect, useRef, useState } from 'react';
import { apiClaim } from '../store/api';
import { setCurrentUser } from '../store/currentUser';
import { startSync } from '../store/sync';
import { GUEST_EXPIRED_LINE, clearGuestExpired, isGuestExpired, subscribeGuestExpired } from '../store/guestState';

// Everything in the panel a keyboard can reach, in document order.
function focusablesIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('input, button, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter((el) => !(el as HTMLButtonElement).disabled);
}

// GUEST LOGIN (item 225) — shown when a guest's time is over. An OVERLAY (fixed,
// over the page): the page stays mounted and keeps its place, and the device's
// full copy stays writable behind it. "Not now" hides it for this session only;
// the server refuses sync until the writer claims, and the local copy is untouched.
// The claim keeps every page — it is the same account, made real in place.
//
// FOCUS: moving into the sheet when it opens, Tab stays inside it, Esc is "Not
// now", and closing puts focus back where it was. The Esc and Tab listener is in
// the CAPTURE phase on the document, so the editor underneath never sees those keys
// while the sheet is up.
export function GuestClaimSheet() {
  const [open, setOpen] = useState(isGuestExpired());
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const submitting = useRef(false);
  const visible = open && !dismissed;

  useEffect(() => subscribeGuestExpired(() => setOpen(isGuestExpired())), []);

  useEffect(() => {
    if (!visible) return;
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setDismissed(true);
        return;
      }
      const panel = panelRef.current;
      if (e.key !== 'Tab' || !panel) return;
      const items = focusablesIn(panel);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault();
        e.stopPropagation();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        e.stopPropagation();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const back = returnTo.current;
      returnTo.current = null;
      if (back && document.contains(back)) back.focus();
    };
  }, [visible]);

  if (!visible) return null;

  const submit = async () => {
    // The ref flips synchronously: two Enters in one tick both read busy=false before a re-render.
    if (busy || submitting.current) return;
    submitting.current = true;
    setError('');
    setBusy(true);
    const r = await apiClaim(email, password);
    submitting.current = false;
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
      <div className="wz-guest-sheet-panel" ref={panelRef}>
        <p id="wz-guest-sheet-line" className="wz-guest-sheet-line">{GUEST_EXPIRED_LINE}</p>
        {/* A real <form>: Enter submits, and a password manager recognises it. */}
        <form className="wz-guest-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className="wz-fieldcol">
            <input ref={emailRef} className="wz-field" type="email" name="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="wz-field" type="password" name="new-password" placeholder="choose a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="wz-sub" role="alert">{error}</div>}
          <button type="submit" className="wz-btn wz-primary" disabled={busy}>
            Create my account
          </button>
        </form>
        <button type="button" className="wz-link" onClick={() => setDismissed(true)}>Not now — keep writing here</button>
      </div>
    </div>
  );
}

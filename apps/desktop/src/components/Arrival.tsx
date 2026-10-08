import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { unbornHref } from '../store/unbornPage';
import { setForwardLock } from '../store/forwardLock';
import { setWritingSettings } from '../store/writingSettings';
import { getFirstRunComplete, setFirstRunComplete } from '../store/firstRun';
import { getResumeTarget } from '../store/resume';
import { apiLogin, apiRegister, apiSignupStatus, type AuthUser } from '../store/api';
import { useDeskLexicon } from '../store/deskLexicon';
import { useDeskFrameViewport } from './DeskFrame';

import { isSignedOutHere } from '../store/signedOutHere';
import { runAuthCall } from '../store/authSubmit';

// HB1 S1/S5 — the Threshold. Route '/' for every boot, authed or not:
// the mark, a boot bar (real readiness — doors disable until authState
// resolves), and the two doors (flow §1). Write is local-first — it never
// requires an account (F2: "no new visitor hits a login wall"); the page it
// creates persists immediately via createLooseHomePage/saveJournalEntry, the
// same as any loose page, account or none. Open routes by state (F2): an
// authed session resumes; an anon visitor reaches the existing sign-in
// (relocated from the retired HomeFlow, not rebuilt — same apiLogin/
// apiRegister calls, same fields).
//
// Replaces BOTH the pre-auth HomeFlow gate and the authed Desk room (Nick's
// ruling, 2026-07-16, on the HomeFlow/Arrival overlap surfaced before this
// ticket's code was written — not in the brief's own text). App.tsx now
// mounts the router regardless of auth state; Write/Open/Journal/Shelf/
// Drawers all work on local data whether or not an account exists yet —
// sync simply doesn't start until one does (App.tsx's existing authed-only
// startSync() call, untouched).
export type ArrivalAuthState = 'loading' | 'anon' | 'authed';
type Stage = 'doors' | 'signin' | 'account';

export function Arrival({ authState, onAuthed }: { authState: ArrivalAuthState; onAuthed: (user: AuthUser) => void }) {
  const navigate = useNavigate();
  const { t } = useDeskLexicon();
  // SIGNED OUT HERE — a device that signed out opens straight on the sign-in stage.
  const [stage, setStage] = useState<Stage>(() => (isSignedOutHere() ? 'signin' : 'doors'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // ITEM 224 — sign-up by invite code, until launch.
  const [inviteCode, setInviteCode] = useState('');
  // ITEM 224, ROUND 2 — null while unchecked (renders nothing extra, not an
  // error); checked once per arrival at the account stage, never polled.
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  useEffect(() => {
    if (stage !== 'account') return;
    let cancelled = false;
    apiSignupStatus().then((open) => { if (!cancelled) setSignupOpen(open); });
    return () => { cancelled = true; };
  }, [stage]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // A ref as well as the state: two Enter presses in one tick both read busy=false before a re-render, and
  // would submit twice. The ref flips synchronously.
  const submitting = useRef(false);

  const ready = authState !== 'loading';
  // SIGNED OUT HERE — read every render: logout sets authState to 'anon' and re-renders this screen, which picks the flag up.
  // While locked there is no doors stage and no way back to it; sign-in and Create an account are the only doors.
  const locked = authState === 'anon' && isSignedOutHere();
  useEffect(() => { if (locked && stage === 'doors') setStage('signin'); }, [locked, stage]);
  // Signed in: the door is back to Write / Open, whatever stage the sign-in left behind.
  useEffect(() => { if (authState === 'authed') setStage('doors'); }, [authState]);
  const framed = useDeskFrameViewport();

  const handleWrite = () => {
    if (!ready) return;
    const firstRun = !getFirstRunComplete();
    if (firstRun) {
      // S2 — forced first-session defaults, set explicitly (not merely
      // trusted from each store's own DEFAULT, which happens to already
      // match on a truly fresh device) so the founding page is guaranteed
      // Free Write / typewriter / forward-lock regardless of any prior
      // local override. FX1's own mechanics are unmodified — consumed as
      // shipped, per the brief's own invariant.
      setForwardLock(true);
      setWritingSettings({ typewriter: true });
      // F4 — no rite exists below the gate (framed-only), so there is no
      // ceremony there to ever flip firstRunComplete (PageEditor.tsx's
      // handleChooseTheme is the only other place that does). Flip it here
      // instead, once, so a sub-1100px writer's own later preference
      // changes aren't silently re-forced back on every subsequent Write.
      if (!framed) setFirstRunComplete(true);
    }
    // PB1 (item 71) — the Write door opens a room; it does not build one. No
    // row exists until the first word: the door's meaning (a loose page) rides
    // in the address, and the first-run gate's own one-shot state rides beside
    // it exactly as before.
    navigate(unbornHref({ origin: 'loose' }), firstRun ? { state: { firstRunGate: true } } : undefined);
  };

  // Where an authed Open goes: the last Page or Board, else a fresh Free Write page. Shared by Open and by a
  // successful sign-in or sign-up, so signing in LEAVES the sign-in screen instead of sitting on it.
  const openAsAuthed = () => {
    {
      const target = getResumeTarget();
      // HB2-lite S1 (SV11 — the landing rule): Open resumes the last Page or Board.
      // getResumeTarget already routes EVERY surface to /page/:id or /project/:id
      // (routeForEntry, FX14) and excludes system boards, so a resumed target is never
      // a journal surface — a stale legacy journal-origin pointer lands on THE Page via
      // FX14's redirect. With NO last surface, Open degrades to a fresh Free Write page
      // (the SAME door as Write, typewriter on), NEVER the Journal Board — "the app
      // opens where the writing is, and never on a journal surface."
      if (target) { navigate(target.route, { state: { warmStart: true } }); }
      else { handleWrite(); }
    }
  };

  const handleOpen = () => {
    if (!ready) return;
    if (authState === 'authed') { openAsAuthed(); return; }
    setError('');
    setStage('signin');
  };

  const handleSignin = async () => {
    if (busy || submitting.current) return;
    submitting.current = true;
    setError(''); setBusy(true);
    // try/finally: whatever happens, the form is given back. A thrown request becomes the network line, not a stuck button.
    try {
      const res = await runAuthCall(() => apiLogin(email.trim(), password));
      if (res.ok && res.user) { onAuthed(res.user); openAsAuthed(); }
      else setError(res.error || 'Could not sign in');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (busy || submitting.current) return;
    submitting.current = true;
    setError(''); setBusy(true);
    try {
      const res = await runAuthCall(() => apiRegister(email.trim(), password, name.trim(), inviteCode.trim()));
      if (res.ok && res.user) { onAuthed(res.user); openAsAuthed(); }
      else setError(res.error || 'Could not create your account');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="wz-home wz-arrival">
      <div className="wz-ambient" aria-hidden="true" />
      <img className="wz-mark show" src="/brand/wrizo-logo.png" alt="" aria-hidden="true" />

      <section className={stage === 'doors' ? 'wz-hero' : 'wz-hero gone'}>
        <img className="wz-logo" src="/brand/wrizo-logo.png" alt="Wrizo" />
        <div className="wz-tagline">For humans writing</div>
        <div className="wz-arrival-bootbar" data-ready={ready ? 'true' : 'false'} aria-hidden="true">
          <div className="wz-arrival-bootbar-fill" />
        </div>

        {stage === 'doors' && (
          <div className="wz-arrival-doors">
            <button type="button" className="wz-btn wz-primary wz-arrival-write" disabled={!ready} onClick={handleWrite}>
              Write
            </button>
            <button type="button" className="wz-link wz-arrival-open" disabled={!ready} onClick={handleOpen}>
              Open
            </button>
            {authState === 'anon' && (
              <button type="button" className="wz-link wz-arrival-signin" onClick={() => { setError(''); setStage('signin'); }}>
                Sign in
              </button>
            )}
          </div>
        )}
      </section>

      {stage === 'signin' && (
        <section className="wz-screen show" style={{ zIndex: 8 }}>
          <div className="wz-bighead">Welcome back.</div>
          {/* A real <form>: Enter submits, and a password manager recognises it. */}
          <form className="wz-form" onSubmit={(e) => { e.preventDefault(); void handleSignin(); }}>
            <div className="wz-fieldcol">
              <input className="wz-field" type="email" name="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input className="wz-field" type="password" name="password" placeholder="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <div className="wz-error">{error}</div>}
            <button type="submit" className="wz-btn" disabled={busy}>{busy ? 'one moment…' : 'Sign in'}</button>
          </form>
          <div className="wz-secondary">
            {/* a11y audit A2 (Blocker, WCAG 2.1.1 Keyboard) — was a <span onClick>,
                unreachable by keyboard. A real <button>; index.css resets its
                chrome so nothing looks different. */}
            <button type="button" className="wz-link" onClick={() => { setError(''); setStage('account'); }}>New here? Create an account</button>
          </div>
          {!locked && (
            <div className="wz-secondary">
              <button type="button" className="wz-link" onClick={() => { setError(''); setStage('doors'); }}>← back</button>
            </div>
          )}
        </section>
      )}

      {stage === 'account' && (
        <section className="wz-screen show" style={{ zIndex: 8 }}>
          <div className="wz-bighead">Save your writing to an account.</div>
          {/* ITEM 224, ROUND 2 — closed reads as a quiet fact, never a form
              the writer fills in only to be told no at the end. `null`
              (status not back yet) renders neither the form nor the
              message — a blink of nothing, never an error either. */}
          {signupOpen === false ? (
            <div className="wz-sub">{t('authSignupByInvitation')}</div>
          ) : signupOpen === true ? (
            <>
              <div className="wz-sub">Add an email and your writing follows you to any device — anything you've already written here comes with it.</div>
              <form className="wz-form" onSubmit={(e) => { e.preventDefault(); void handleCreate(); }}>
              <div className="wz-fieldcol">
                <input className="wz-field" type="text" placeholder="what should we call you?" autoComplete="given-name" value={name} onChange={e => setName(e.target.value)} />
                <input className="wz-field" type="email" name="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="wz-field" type="password" name="new-password" placeholder="choose a password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
                {/* ITEM 224 — sign-up by invite code, until launch. */}
                <input className="wz-field" type="text" placeholder={t('authInviteCodePlaceholder')} autoComplete="off" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
              </div>
              {error && <div className="wz-error">{error}</div>}
              <button type="submit" className="wz-btn" disabled={busy}>{busy ? 'one moment…' : 'Create my account'}</button>
              </form>
            </>
          ) : null}
          {/* Kept when locked: this back goes to SIGN-IN, never to the doors, so "New here?" is never a dead end. */}
          <div className="wz-secondary">
            {/* a11y audit A2 — same fix as sign-in's own "← back" above. */}
            <button type="button" className="wz-link" onClick={() => { setError(''); setStage('signin'); }}>← back</button>
          </div>
        </section>
      )}
    </div>
  );
}

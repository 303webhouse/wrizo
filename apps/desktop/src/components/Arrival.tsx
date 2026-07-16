import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLooseHomePage } from '../store/persistence';
import { setForwardLock } from '../store/forwardLock';
import { setWritingSettings } from '../store/writingSettings';
import { getFirstRunComplete, setFirstRunComplete } from '../store/firstRun';
import { getResumeTarget } from '../store/resume';
import { apiLogin, apiRegister, type AuthUser } from '../store/api';
import { useDeskFrameViewport } from './DeskFrame';

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
  const [stage, setStage] = useState<Stage>('doors');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ready = authState !== 'loading';
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
    const page = createLooseHomePage();
    navigate(`/page/${page.id}`, firstRun ? { state: { firstRunGate: true } } : undefined);
  };

  const handleOpen = () => {
    if (!ready) return;
    if (authState === 'authed') {
      const target = getResumeTarget();
      navigate(target ? target.route : '/journal', target ? { state: { warmStart: true } } : undefined);
      return;
    }
    setError('');
    setStage('signin');
  };

  const handleSignin = async () => {
    if (busy) return;
    setError(''); setBusy(true);
    const res = await apiLogin(email.trim(), password);
    setBusy(false);
    if (res.ok && res.user) onAuthed(res.user);
    else setError(res.error || 'Could not sign in');
  };

  const handleCreate = async () => {
    if (busy) return;
    setError(''); setBusy(true);
    const res = await apiRegister(email.trim(), password, name.trim());
    setBusy(false);
    if (res.ok && res.user) onAuthed(res.user);
    else setError(res.error || 'Could not create your account');
  };

  return (
    <div className="wz-home wz-arrival">
      <div className="wz-ambient" aria-hidden="true" />
      <img className="wz-mark show" src="/brand/wrizo-logo.png" alt="" aria-hidden="true" />

      <section className="wz-hero">
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
          </div>
        )}
      </section>

      {stage === 'signin' && (
        <section className="wz-screen show" style={{ zIndex: 8 }}>
          <div className="wz-bighead">Welcome back.</div>
          <div className="wz-fieldcol">
            <input className="wz-field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="wz-field" type="password" placeholder="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="wz-error">{error}</div>}
          <button type="button" className="wz-btn" disabled={busy} onClick={handleSignin}>{busy ? 'one moment…' : 'Sign in'}</button>
          <div className="wz-secondary">
            <span className="wz-link" onClick={() => { setError(''); setStage('account'); }}>New here? Create an account</span>
          </div>
          <div className="wz-secondary">
            <span className="wz-link" onClick={() => { setError(''); setStage('doors'); }}>← back</span>
          </div>
        </section>
      )}

      {stage === 'account' && (
        <section className="wz-screen show" style={{ zIndex: 8 }}>
          <div className="wz-bighead">Save your writing to an account.</div>
          <div className="wz-sub">Add an email and your writing follows you to any device — anything you've already written here comes with it.</div>
          <div className="wz-fieldcol">
            <input className="wz-field" type="text" placeholder="what should we call you?" autoComplete="given-name" value={name} onChange={e => setName(e.target.value)} />
            <input className="wz-field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="wz-field" type="password" placeholder="choose a password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="wz-error">{error}</div>}
          <button type="button" className="wz-btn" disabled={busy} onClick={handleCreate}>{busy ? 'one moment…' : 'Create my account'}</button>
          <div className="wz-secondary">
            <span className="wz-link" onClick={() => { setError(''); setStage('signin'); }}>← back</span>
          </div>
        </section>
      )}
    </div>
  );
}

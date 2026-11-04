import { WrizoMark } from './WrizoMark';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { unbornHref } from '../store/unbornPage';
import { setForwardLock } from '../store/forwardLock';
import { setWritingSettings } from '../store/writingSettings';
import { setFirstRunComplete, resolveFirstRun, markRegistered, firstRunWillWait, FIRST_PULL_CAP_MS } from '../store/firstRun';
import { firstPullDone, whenFirstPulled } from '../store/sync';
import { accountHasWork } from '../store/persistence';
import { getResumeTarget } from '../store/resume';
import { apiLogin, apiRegister, apiSignupStatus, type AuthUser } from '../store/api';
import { useDeskLexicon } from '../store/deskLexicon';
import { useDeskFrameViewport } from './DeskFrame';

import { isSignedOutHere } from '../store/signedOutHere';
import { runAuthCall } from '../store/authSubmit';
import { isArbor2 } from '../arbor2/flag';
import { useTheme } from '../store/theme';
import { SplashMark } from './SplashMark';
import { splashSizeFor } from './Splash';
import { ArborFront, takeWantWrite, WANT_WRITE } from '../arbor2/frontLayer';

// the Threshold, route '/' for every boot: Write is local-first and never needs an account; Open resumes an authed session or reaches sign-in [Arrival §1]
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
  // ARBOR v2 MOCKUP r14 (Fable, Nov 1: "retire the Arrival screen in Arbor under the flag. The splash's Sign in door opens the existing
  // sign-in / sign-up forms (keep the invite-code field)"). Under the flag in Arbor, the threshold's hero (its logo, tagline, load bar and
  // doors) is not drawn: the splash's own finished frame stays as the front door - the same drawing at the same size and place on the same
  // ground - with the tagline and the doors beneath it: Write and Sign in for a visitor, Write and Open for a signed-in writer. Every door
  // keeps its own handler, and Sign in opens this file's existing sign-in and sign-up stages, unchanged (the invite code included).
  const theme = useTheme();
  const arborFront = isArbor2() && theme === 'plateau';
  const [frontBox, setFrontBox] = useState(() => (typeof window === 'undefined' ? { width: 0, height: 0 } : splashSizeFor(window.innerWidth, window.innerHeight)));
  useEffect(() => {
    if (!arborFront) return undefined;
    const resize = () => setFrontBox(splashSizeFor(window.innerWidth, window.innerHeight));
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [arborFront]);

  // ARBOR v2 MOCKUP r18 (Nick, via Fable, Nov 3: "Enter = Write"): on the front door's doors, Enter writes - unless a control or a field has
  // the key (a focused door presses itself; the sign-in form submits). Read through a ref so the listener always calls today's handler.
  const writeRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!arborFront || stage !== 'doors') return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
      e.preventDefault(); writeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [arborFront, stage]);

  // B10.1 - a quiet "Loading your pages" state while the landing waits for the account's first pull (capped).
  const [landing, setLanding] = useState(false);
  const writing = useRef(false);

  const handleWrite = async () => {
    if (!ready || writing.current) return;
    writing.current = true;
    try { await writeDoor(); } finally { writing.current = false; }
  };
  writeRef.current = () => { if (landing) return; if (arborFront && authState === 'authed') handleOpen(); else void handleWrite(); };
  // ARBOR v2 MOCKUP r19: an Enter that skipped the splash asks for Write - taken here once the front door can (ready, its doors up)
  useEffect(() => {
    if (!arborFront || stage !== 'doors') return undefined;
    const take = () => { if (ready && takeWantWrite()) writeRef.current(); };
    take();
    window.addEventListener(WANT_WRITE, take);
    return () => window.removeEventListener(WANT_WRITE, take);
  }, [arborFront, stage, ready]);

  const writeDoor = async () => {
    // B10.1 - derived per account, after the first pull (see store/firstRun.ts). Synchronous in every case but one: a signed-in
    // writer whose flag is unset and whose first pull has not landed yet.
    // The same quiet state and the doors disabled, but only when the wait is real (a flash on every Write would be noise).
    const waits = firstRunWillWait();
    if (waits) setLanding(true);
    let firstRun: boolean;
    try { firstRun = await resolveFirstRun(); } finally { if (waits) setLanding(false); }
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
    // the Write door opens a room, it does not build one: no row until the first word, and the door's meaning (a loose page) rides in the address [Arrival §2]
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

  // B10.1 - THE LANDING WAITS FOR THE FIRST PULL. Choosing resume-or-new the instant a login answered sent a returning writer to a
  // blank page, because their pages had not arrived yet. 'always' (a sign-in, whose cache was just wiped) waits whatever the
  // cache holds; Open on an authed boot waits only if the cache is empty and the pull has not landed. The wait is capped, and
  // every outcome (pulled, capped, failed) then opens exactly as before.
  const openWhenLoaded = async (always: boolean) => {
    if (!firstPullDone() && (always || !accountHasWork())) {
      setLanding(true);
      try { await whenFirstPulled(FIRST_PULL_CAP_MS); } finally { setLanding(false); }
    }
    openAsAuthed();
  };

  const handleOpen = () => {
    if (!ready || landing) return;
    if (authState === 'authed') { void openWhenLoaded(false); return; }
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
      if (res.ok && res.user) { onAuthed(res.user); await openWhenLoaded(true); }
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
      // B10.1 - a successful REGISTER is a first run on this device whatever the flag says (once per account).
      if (res.ok && res.user) { markRegistered(res.user.id); onAuthed(res.user); openAsAuthed(); }
      else setError(res.error || 'Could not create your account');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="wz-home wz-arrival">
      <div className="wz-ambient" aria-hidden="true" />
      {!arborFront && <WrizoMark className="wz-mark show" alt="" />}

      {arborFront ? (
        <section className={stage === 'doors' ? 'arbor2-front' : 'arbor2-front gone'} aria-label="Wrizo">
          <div className="arbor2-front-mark" style={{ width: `${frontBox.width}px`, height: `${frontBox.height}px`, marginLeft: `${-frontBox.width / 2}px`, marginTop: `${-frontBox.height / 2}px` }} aria-hidden="true">
            <SplashMark theme="plateau" reduced width={frontBox.width} height={frontBox.height} onFloorReached={() => {}} />
            {/* ARBOR v2 MOCKUP r18 (Nick, via Fable, Nov 3): the logo, still, where the drawing's top line stood, the tagline under it - the splash's
                last frame, in the same rect (src/arbor2/frontLayer.tsx) */}
            <ArborFront mode="door" part="top" width={frontBox.width} />
          </div>
          {/* r18: the doors are hand-drawn boxes INSIDE the drawing - Write and Log in (signed in: Write and Open); they come last, after the logo.
              Every door keeps its own handler; Log in opens this file's sign-in stage, unchanged (-> the sign-up with the invite code). */}
          {/* r19 (spec draft 38 §12c): Write and Sign in (signed in: Write only, into the last page), in the drawing's twin box (screen readers see them) */}
          {stage === 'doors' && (
            <div className="arbor2-front-mark arbor2-front-doorbox" style={{ width: `${frontBox.width}px`, height: `${frontBox.height}px`, marginLeft: `${-frontBox.width / 2}px`, marginTop: `${-frontBox.height / 2}px` }}>
              <ArborFront mode="door" part="doors" width={frontBox.width} authed={authState === 'authed'} ready={ready} landing={landing}
                onWrite={() => writeRef.current()} onLogin={() => { setError(''); setStage('signin'); }} />
            </div>
          )}
          {/* (r14's foot - the tagline and the doors under the drawing - moved into the drawing in r18; the quiet loading line stays under it) */}
          {landing && (
            <div className="arbor2-front-foot" style={{ top: `calc(50% + ${Math.round(frontBox.height / 2)}px + 8px)` }}>
              <div className="wz-sub wz-arrival-loading" role="status">Loading your pages…</div>
            </div>
          )}
        </section>
      ) : (
        <section className={stage === 'doors' ? 'wz-hero' : 'wz-hero gone'}>
          <WrizoMark className="wz-logo" alt="Wrizo" />
          <div className="wz-tagline">For humans writing</div>
          <div className="wz-arrival-bootbar" data-ready={ready ? 'true' : 'false'} aria-hidden="true">
            <div className="wz-arrival-bootbar-fill" />
          </div>
  
          {stage === 'doors' && (
            <div className="wz-arrival-doors">
              <button type="button" className="wz-btn wz-primary wz-arrival-write" disabled={!ready || landing} onClick={() => { void handleWrite(); }}>
                Write
              </button>
              <button type="button" className="wz-link wz-arrival-open" disabled={!ready || landing} onClick={handleOpen}>
                Open
              </button>
              {landing && <div className="wz-sub wz-arrival-loading" role="status">Loading your pages…</div>}
              {authState === 'anon' && (
                <button type="button" className="wz-link wz-arrival-signin" onClick={() => { setError(''); setStage('signin'); }}>
                  Sign in
                </button>
              )}
            </div>
          )}
        </section>
      )}

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

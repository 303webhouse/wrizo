import { useEffect, useRef, useState } from 'react';
import { ForwardOnlyEditor } from './ForwardOnlyEditor';
import { apiLogin, apiRegister, type AuthUser } from '../store/api';
import { generateId, saveJournalEntry } from '../store/persistence';
import type { JournalEntry } from '../types';

// HOME port (v6) — the warm-dark front door. Landing → forced first-write gate →
// reward → account, seated on the existing forward-only prose surface (CW2). The
// gate writes NO editor logic of its own: it mounts <ForwardOnlyEditor>, so the
// runway, strikethrough, the struck-words-drop-from-derived-prose rule, the
// paste block, and IME/tablet exposure all come for free. The word the reward
// echoes and the entry we persist are the clean DERIVED text (struck excluded),
// which is exactly what the editor reports up via onChange.
//
// Visuals/copy/motion are ported from apps/desktop/scratch/wrizo-home-v6.html
// (the feel source of truth); styles live scoped under .wz-home in index.css.
//
// Deferred (flagged for review, NOT built here):
//  - Gate idle-nudges: the re-tuned nudge cadence lives in QuickSprint; mounting
//    it here needs that system extracted into a shared hook. Follow-up.
//  - The v6 "launch"/Desk launchpad as the authed home (replaces SessionLauncher).
//  - Auth model: invite dropped (Wrizo is open — the writing-gate is the filter).
//    Account collects email + password for now; passwordless / email-first is a
//    later backend lift (backlog).

const WORD_GOAL = 50; // lowerable for testing

type Stage = 'landing' | 'writing' | 'reward' | 'account' | 'signin';

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
function firstWords(text: string, n: number): string {
  const w = text.trim().split(/\s+/).filter(Boolean);
  return w.slice(0, n).join(' ') + (w.length > n ? '…' : '');
}
function reducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HomeFlow({ onAuthed }: { onAuthed: (user: AuthUser) => void }) {
  const [stage, setStage] = useState<Stage>('landing');
  const [gateText, setGateText] = useState('');
  const [bloom, setBloom] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // account / sign-in form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const words = wordCount(gateText);
  const progress = Math.min(1, words / WORD_GOAL);
  const done = progress >= 1;

  // Landing → writing on first keystroke or click (no "start" CTA, per v6).
  useEffect(() => {
    if (stage !== 'landing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter' || (e.key && e.key.length === 1)) { e.preventDefault(); setStage('writing'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]);

  // Focus the editor once the gate has eased in.
  useEffect(() => {
    if (stage !== 'writing') return;
    const t = setTimeout(() => editorRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, [stage]);

  // Reaching the goal → the one-time reward (bloom + word-echo).
  useEffect(() => {
    if (stage === 'writing' && words >= WORD_GOAL) {
      if (!reducedMotion()) setBloom(true);
      setStage('reward');
    }
  }, [stage, words]);

  const persistFirstEntry = () => {
    const text = gateText.trim(); // clean derived prose (struck already excluded by the editor)
    if (!text) return;
    const now = new Date().toISOString();
    const entry: JournalEntry = { id: generateId(), text, projectId: null, createdAt: now, updatedAt: now };
    saveJournalEntry(entry); // persists locally; the sync path carries it to the server once authed
  };

  const handleCreate = async () => {
    if (busy) return;
    setError(''); setBusy(true);
    const res = await apiRegister(email.trim(), password);
    setBusy(false);
    if (res.ok && res.user) {
      persistFirstEntry(); // first, so the entry is on the desk the instant they arrive
      onAuthed(res.user);
    } else {
      setError(res.error || 'Could not create your desk');
    }
  };

  const handleSignin = async () => {
    if (busy) return;
    setError(''); setBusy(true);
    const res = await apiLogin(email.trim(), password);
    setBusy(false);
    if (res.ok && res.user) onAuthed(res.user);
    else setError(res.error || 'Could not sign in');
  };

  const screen = (id: Stage) => `wz-screen${stage === id ? ' show' : ''}`;

  return (
    <div className="wz-home" onClick={() => { if (stage === 'writing') editorRef.current?.focus(); }}>
      <div className="wz-ambient" style={{ opacity: stage === 'landing' ? 0.4 : (0.4 + 0.6 * progress) }} />

      {(stage === 'landing') && (
        <button type="button" className="wz-signin" onClick={(e) => { e.stopPropagation(); setStage('signin'); }}>Sign in</button>
      )}

      {/* corner mark — present once writing begins */}
      <img className={`wz-mark${stage !== 'landing' ? ' show' : ''}`} src="/brand/wrizo-logo.png" alt="" aria-hidden="true" />

      {/* Hero */}
      <section className={`wz-hero${stage !== 'landing' ? ' gone' : ''}`} onClick={() => { if (stage === 'landing') setStage('writing'); }}>
        <img className="wz-logo" src="/brand/wrizo-logo.png" alt="Wrizo" />
        <div className="wz-tagline">For humans writing</div>
        <div className="wz-invite">begin anywhere<span className="wz-cursor" /></div>
      </section>

      {/* Gate — the real forward-only surface */}
      <section className={`wz-gate${stage === 'writing' ? ' show' : ''}`}>
        <div className="wz-writewrap">
          <div className="wz-eyebrow wz-goalhint">a short paragraph opens your desk</div>
          <ForwardOnlyEditor
            ref={editorRef}
            initialText=""
            onChange={setGateText}
            placeholder="Write the first thing that comes."
            ariaLabel="Opening paragraph"
            style={{ minHeight: '40vh' }}
          />
          <div className="wz-track"><div className={`wz-trackfill${done ? ' done' : ''}`} style={{ width: `${progress * 100}%` }} /></div>
        </div>
      </section>

      {/* Bloom — the one crescendo */}
      <div className={`wz-bloom${bloom ? ' go' : ''}`} onAnimationEnd={() => setBloom(false)} />

      {/* Reward */}
      <section className={screen('reward')} style={{ zIndex: 8 }}>
        <div className="wz-bighead">You're already writing.</div>
        <div className="wz-sub">you wrote this just now — <b>“{firstWords(gateText, 14)}”</b></div>
        <button type="button" className="wz-btn" onClick={() => setStage('account')}>Keep what you wrote →</button>
      </section>

      {/* Account — "Save it to your desk" */}
      <section className={screen('account')} style={{ zIndex: 8 }}>
        <div className="wz-bighead">Save it to your desk.</div>
        <div className="wz-sub">Add an email and your writing is here whenever you come back — that first entry already saved.</div>
        <div className="wz-fieldcol">
          <div className="wz-eyebrow">your email</div>
          <input className="wz-field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {/* Backend needs these until a passwordless / no-invite flow lands (flagged). */}
          <input className="wz-field" type="password" placeholder="choose a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="wz-sub" style={{ fontSize: '.98rem' }}>your first entry — <b>“{firstWords(gateText, 9)}”</b></div>
        {error && <div className="wz-error">{error}</div>}
        <button type="button" className="wz-btn" disabled={busy} onClick={handleCreate}>{busy ? 'one moment…' : 'Create my desk'}</button>
      </section>

      {/* Sign in — returning writers */}
      <section className={screen('signin')} style={{ zIndex: 8 }}>
        <div className="wz-bighead">Welcome back.</div>
        <div className="wz-fieldcol">
          <input className="wz-field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="wz-field" type="password" placeholder="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="wz-error">{error}</div>}
        <button type="button" className="wz-btn" disabled={busy} onClick={handleSignin}>{busy ? 'one moment…' : 'Sign in'}</button>
        <div className="wz-secondary"><span className="wz-link" onClick={() => { setError(''); setStage('landing'); }}>← back</span></div>
      </section>
    </div>
  );
}

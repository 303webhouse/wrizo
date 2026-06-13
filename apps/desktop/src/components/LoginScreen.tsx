import { useState, type FormEvent } from 'react';
import { apiLogin, apiRegister, type AuthUser } from '../store/api';
import { Wordmark } from './Wordmark';

// Minimal login/register gate (W2). Functional-plain now; styled in the
// D-stream as an honorary D-ticket (one centered card on --ink-950).

interface LoginScreenProps {
  onAuthed: (user: AuthUser) => void;
}

export function LoginScreen({ onAuthed }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    const result =
      mode === 'login'
        ? await apiLogin(email.trim(), password)
        : await apiRegister(email.trim(), password, inviteCode.trim());
    setBusy(false);
    if (result.ok && result.user) {
      onAuthed(result.user);
    } else {
      setError(result.error || 'Something went wrong');
    }
  };

  return (
    <div
      className="page"
      style={{ maxWidth: '420px', paddingTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div className="card" style={{ width: '100%' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Wordmark size={26} />
        </div>
        <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          The page is ready when you are.
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="invite">Invite code</label>
              <input
                id="invite"
                className="form-input"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>
          )}

          {error && (
            <div className="warning-text" style={{ marginBottom: '0.75rem' }}>{error}</div>
          )}

          <button className="btn-brass" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="btn-quiet"
          style={{ marginTop: '1rem', width: '100%' }}
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
        >
          {mode === 'login' ? 'Have an invite code? Create an account' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
